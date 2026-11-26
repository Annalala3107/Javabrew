import type { MistakeItem } from '../types/content';
import { stripJavaComments } from './javaFiles';

export interface PeDiagnosisCard {
  id: string;
  tone: 'sky' | 'amber' | 'green';
  title: string;
  description: string;
  hintCode?: string;
}

export interface PeEvaluationResult {
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  hardPolicyViolations: string[];
  softWarnings: PeDiagnosisCard[];
  statusText: string;
  consoleRunOutput: string;
  consoleTestOutput: string;
  diagnosisCards: PeDiagnosisCard[];
  detectedMistake?: Omit<MistakeItem, 'id' | 'createdAt'>;
}

interface PeRuleSpec {
  code: string;
  check: (main: string, combined: string) => {
    tc1: boolean;
    tc2: boolean;
    tc3: boolean;
    labels: [string, string, string];
    failHints: [string, string, string];
    passSummary: string;
    sampleRunOk: string;
    sampleRunFail: string;
    skyTitle: string;
    skyDesc: string;
    skyHint: string;
    amberTitle: string;
    amberDesc: string;
    amberHint?: string;
    mistakeTitle: string;
    mistakeDetail: string;
    mistakeType: 'runtime' | 'cleancode';
  };
}

const PE_RULES: Record<number, PeRuleSpec> = {
  // 1. PE1-Q1: Crocus
  1: {
    code: 'PE1-Q1',
    check: (main, combined) => {
      const tc1 = /getName\s*\(/.test(main) && /Character\.isDigit/.test(combined) && /substring/.test(combined);
      const tc2 =
        /setWeight\s*\(/.test(main) &&
        /(?:!\s*Character\.isDigit|isDigit)/.test(combined) &&
        /(?:(?:this\.)?weight\s*=\s*[A-Za-z_]\w*\s*-|weight\s*-=)/.test(combined);
      const tc3 = /name\s*==\s*null/.test(combined) && /public\s+Crocus\s*\(\s*\)/.test(combined);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'getName() xóa chữ số cuối (crocus3 -> crocus)',
          'setWeight(w) trừ đi số ký tự non-digit (10 -> 4)',
          'Default constructor & kiểm tra name == null an toàn',
        ],
        failHints: [
          'Cần duyệt ngược tìm Character.isDigit và dùng substring',
          'Đếm !Character.isDigit(c) rồi gán this.weight = weight - n',
          'Thiếu kiểm tra name == null ở đầu getName()/setWeight()',
        ],
        passSummary: 'Crocus chuẩn JDK 8 — xóa đúng chữ số cuối và xử lý biên an toàn.',
        sampleRunOk: 'Output:\ngetName("crocus3") => crocus\nsetWeight(10) => 4',
        sampleRunFail: 'Running PE1-Q1 Crocus...\nChưa hoàn thiện logic tìm chữ số cuối hoặc đếm non-digit.',
        skyTitle: '1. Kiểm tra biên & tìm chữ số cuối từ phải sang trái',
        skyDesc:
          'Dùng vòng lặp for (int i = name.length() - 1; i >= 0; i--) với Character.isDigit(name.charAt(i)) để xóa đúng chữ số cuối cùng.',
        skyHint: 'if (Character.isDigit(name.charAt(i))) return name.substring(0, i) + name.substring(i + 1);',
        amberTitle: '2. Công thức setWeight() & kiểm tra null',
        amberDesc:
          'Đếm tổng số ký tự !Character.isDigit trong name (gán 0 nếu name == null), rồi gán this.weight = weight - nonDigits.',
        mistakeTitle: 'Chưa xóa chữ số cuối hoặc thiếu kiểm tra null (PE1-Q1)',
        mistakeDetail: 'Kiểm tra Character.isDigit từ cuối chuỗi và kiểm tra name == null trong Crocus.',
        mistakeType: 'runtime',
      };
    },
  },

  // 2. PE1-Q2: SpecDaisy
  2: {
    code: 'PE1-Q2',
    check: (main, combined) => {
      const tc1 =
        /extends\s+Daisy/.test(main) &&
        /super\s*\(\s*name\s*,\s*age\s*\)/.test(main) &&
        /toString\s*\(\s*\)/.test(main) &&
        /getName\s*\(\s*\)/.test(main);
      const tc2 =
        /setData\s*\(\s*\)/.test(main) &&
        /'a'/.test(main) &&
        /'z'/.test(main) &&
        /toCharArray\s*\(/.test(main) &&
        /setName\s*\(/.test(main);
      const tc3 =
        /getValue\s*\(\s*\)/.test(main) &&
        /StringBuilder/.test(combined) &&
        /(>= 'a'|c < 'a')/.test(combined);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'SpecDaisy extends Daisy, gọi super() & @Override toString()',
          'setData() đảo chỗ 2 chữ cái thường a-z đầu tiên (DaIsy -> DsIay)',
          'getValue() xóa chữ cái thường khi color có chữ thường',
        ],
        failHints: [
          'Cần super(name, age) và toString() -> getName() + ", " + color + ", " + getAge()',
          'Tìm 2 chỉ số có c >= \'a\' && c <= \'z\' rồi đổi chỗ và gọi setName(...)',
          'Chưa kiểm tra color có chữ thường (a-z) hoặc chưa lọc bỏ chữ thường bằng StringBuilder',
        ],
        passSummary: 'SpecDaisy chuẩn OOP & hoán đổi chính xác 2 chữ thường đầu tiên.',
        sampleRunOk: 'Output:\ndaisy, yellow, 2\nDaIsy -> DsIay\nYellow -> D123 | YELLOW -> Daisy123',
        sampleRunFail: 'Running PE1-Q2 SpecDaisy...\nKiểm tra lại super(name, age), setData() và getValue().',
        skyTitle: '1. Kế thừa Daisy & hoán đổi 2 chữ thường (a-z)',
        skyDesc:
          'Chỉ xét c >= \'a\' && c <= \'z\' (tránh nhầm chữ hoa ở giữa như DaIsy), hoán đổi 2 vị trí đầu tiên trên char[] rồi gọi setName(new String(arr)).',
        skyHint: 'super(name, age); // va chi xet ky tu c >= \'a\' && c <= \'z\' trong setData()',
        amberTitle: '2. Lọc chữ thường trong getValue() theo color',
        amberDesc:
          'Nếu color có ít nhất 1 chữ thường a-z thì giữ lại các ký tự (c < \'a\' || c > \'z\'); ngược lại trả về nguyên chuỗi name gốc.',
        mistakeTitle: 'Sai super() hoặc nhầm chữ hoa/thường trong SpecDaisy (PE1-Q2)',
        mistakeDetail: 'Cần super(name, age) và lọc theo miền ký tự a-z thay vì isLetter().',
        mistakeType: 'cleancode',
      };
    },
  },

  // 3. PE1-Q3: MyDaisy
  3: {
    code: 'PE1-Q3',
    check: (main, combined) => {
      const tc1 = /implements\s+IDaisy/.test(main) && /f1\s*\(/.test(main) && /'A'/.test(combined) && /'a'/.test(combined);
      const tc2 =
        /f2\s*\(/.test(main) &&
        /Collections\.sort/.test(combined) &&
        /\.set\s*\(/.test(combined) &&
        /indices|pos|idx/i.test(combined);
      const tc3 =
        /f3\s*\(/.test(main) &&
        /isPalindrome|charAt\s*\(/.test(combined) &&
        /firstNonPalin|first/i.test(combined);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'f1() cộng age có >= 1 chữ hoa (A-Z) và >= 1 chữ thường (a-z)',
          'f2() Partial Sort tách indices + Collections.sort + List.set()',
          'f3() tìm firstNonPalindrome trước rồi thay các phần tử đối xứng',
        ],
        failHints: [
          'Kiểm tra cả A-Z và a-z trong name trước khi cộng dồn d.getAge()',
          'Không sort cả List! Phải lưu chỉ số (indices), sort nhóm khớp, rồi gán t.set()',
          'Tìm phần tử không phải palindrome đầu tiên (case-sensitive) rồi mới thay thế',
        ],
        passSummary: 'MyDaisy chuẩn Partial Sort & Palindrome case-sensitive.',
        sampleRunOk: 'Output:\nf1 => 20\nf2 => (A11,5)(f67,2)(C23,1)(d45,5)(E56,11)(b12,9)\nf3 => replaced',
        sampleRunFail: 'Running PE1-Q3 MyDaisy...\nKiểm tra lại Partial Sort ở f2() và Palindrome ở f3().',
        skyTitle: '1. Bẫy Partial Sort trong f2()',
        skyDesc:
          'Nếu gọi Collections.sort(t) trực tiếp sẽ làm xáo trộn các phần tử không chứa chữ thường! Hãy tách 2 list indices + matched rồi t.set() lại.',
        skyHint: 'Collections.sort(matched, ...); for (int k = 0; k < indices.size(); k++) t.set(indices.get(k), matched.get(k));',
        amberTitle: '2. Kiểm tra Palindrome phân biệt hoa/thường trong f3()',
        amberDesc:
          'Tìm xong firstNonPalin bằng vòng lặp riêng trước khi chạy vòng thay thế; dùng s.charAt(l) != s.charAt(r) (case-sensitive).',
        mistakeTitle: 'Partial Sort thiếu tách chỉ số hoặc f3 vừa tìm vừa thay (PE1-Q3)',
        mistakeDetail: 'Dùng thuật toán 3 bước Tách - Sort - Trả vị trí cho f2() và tách vòng lặp tìm firstNonPalin cho f3().',
        mistakeType: 'runtime',
      };
    },
  },

  // 4. PE1-Q4: MyString
  4: {
    code: 'PE1-Q4',
    check: (main, combined) => {
      const tc1 =
        /implements\s+IString/.test(main) &&
        /\\s\+/.test(combined) &&
        /Character\.isLetter/.test(combined) &&
        /Character\.isDigit/.test(combined) &&
        /</.test(combined) &&
        />/.test(combined);
      const tc2 =
        /f2\s*\(/.test(main) && /StringBuilder/.test(combined) && /substring\s*\(/.test(combined);
      const tc3 = /str\s*==\s*null/.test(combined) && /\.trim\s*\(\s*\)/.test(combined);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'f1() kiểm tra firstLetter < firstDigit && lastLetter > lastDigit',
          'f2() thay chữ số đầu bằng tổng số chữ cái (Character.isLetter)',
          'Tách từ trim().split("\\\\s+") và kiểm tra str == null an toàn',
        ],
        failHints: [
          'Phải kiểm tra firstLetter != -1 && firstDigit != -1 trước khi so sánh chỉ số',
          'Tìm firstDigit và đếm letters, dùng substring + StringBuilder ghép chuỗi',
          'Kiểm tra str == null và trimmed.isEmpty() tránh thừa khoảng trắng',
        ],
        passSummary: 'MyString chuẩn chỉ số letter/digit & định dạng chuỗi không dư dấu cách.',
        sampleRunOk: 'Output:\nf1 => 2\nf2 => ab22 xyz A2B2 hello5',
        sampleRunFail: 'Running PE1-Q4 MyString...\nKiểm tra so sánh firstLetter/lastLetter và đếm letters trong f2().',
        skyTitle: '1. Kiểm tra tồn tại cả letter và digit trong f1()',
        skyDesc:
          'Từ chỉ có chữ cái ("xyz") khiến firstDigit == -1; luôn kiểm tra firstLetter != -1 && firstDigit != -1 trước khi so sánh vị trí.',
        skyHint: 'if (firstLetter != -1 && firstDigit != -1 && firstLetter < firstDigit && lastLetter > lastDigit) count++;',
        amberTitle: '2. Không để khoảng trắng thừa ở đầu/cuối trong f2()',
        amberDesc:
          'Dùng if (i > 0) out.append(\' \'); thay vì nối dấu cách sau mọi từ rồi trim().',
        mistakeTitle: 'Chưa kiểm tra biên -1 khi so sánh vị trí chữ cái/số (PE1-Q4)',
        mistakeDetail: 'Kiểm tra firstLetter != -1 && firstDigit != -1 và tách từ bằng trim().split("\\\\s+").',
        mistakeType: 'runtime',
      };
    },
  },

  // 5. PE2-Q1: Camel
  5: {
    code: 'PE2-Q1',
    check: (main) => {
      const tc1 = /getDesert\s*\(/.test(main) && /toUpperCase\s*\(\s*\)/.test(main);
      const tc2 = /setStep\s*\(/.test(main) && /this\.step\s*=\s*step/.test(main);
      const tc3 = /desert\s*==\s*null/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'getDesert() chuyển desert sang in hoa (toUpperCase)',
          'setStep() & getStep() cập nhật chính xác',
          'Kiểm tra desert == null an toàn với constructor mặc định',
        ],
        failHints: [
          'Gọi desert.toUpperCase() trong getDesert()',
          'Kiểm tra setStep(int step) gán this.step = step',
          'Chặn desert == null trước khi gọi .toUpperCase()',
        ],
        passSummary: 'Camel chuẩn JDK 8 & null-safe khi dùng default constructor.',
        sampleRunOk: 'Output:\ngetDesert() => ALAN\ngetStep() => 15',
        sampleRunFail: 'Running PE2-Q1 Camel...\nCần chuẩn hóa toUpperCase() và kiểm tra desert == null.',
        skyTitle: '1. Chuẩn hóa IN HOA & tránh NullPointerException',
        skyDesc: 'Khi test gọi new Camel(), desert là null. Hãy trả về "" thay vì gọi thẳng desert.toUpperCase().',
        skyHint: 'return (desert == null) ? "" : desert.toUpperCase();',
        amberTitle: '2. Đảm bảo đúng tên hàm getDesert() / getStep() / setStep()',
        amberDesc: 'Kiểm tra chính tả chính xác theo UML: Camel (desert, step).',
        mistakeTitle: 'Rủi ro NullPointerException trong getDesert() (PE2-Q1)',
        mistakeDetail: 'Cần kiểm tra desert == null trước khi gọi toUpperCase().',
        mistakeType: 'runtime',
      };
    },
  },

  // 6. PE2-Q2: SpecCala
  6: {
    code: 'PE2-Q2',
    check: (main, combined) => {
      const tc1 =
        /extends\s+Cala/.test(main) &&
        /SpecCala\s*\(\s*int\s+color\s*,\s*String\s+owner\s*,\s*int\s+price\s*\)/.test(main) &&
        /super\s*\(\s*owner\s*,\s*price\s*\)/.test(main);
      const tc2 =
        /setData\s*\(\s*\)/.test(main) && /"XX"/.test(main) && /setOwner\s*\(/.test(main);
      const tc3 =
        /getValue\s*\(\s*\)/.test(main) &&
        /%\s*2/.test(combined) &&
        /\+\s*3/.test(combined) &&
        /\+\s*7/.test(combined);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'Đúng thứ tự tham số SpecCala(int color, String owner, int price) & super()',
          'setData() thay ký tự thứ 2 trong owner bằng "XX" (alan -> aXXan)',
          'getValue() color lẻ -> price + 3, chẵn -> price + 7',
        ],
        failHints: [
          'Kiểm tra thứ tự tham số color đứng ĐẦU trong SpecCala(int color, String owner, int price)',
          'Dùng s.substring(0, 1) + "XX" + s.substring(2) và setOwner(...)',
          'Chưa chia lấy dư color % 2 để trả getPrice() + 3 / + 7',
        ],
        passSummary: 'SpecCala khớp đúng chữ ký constructor bẫy & công thức toString()/getValue().',
        sampleRunOk: 'Output:\nalan, 3, 4\nsetData() => aXXan, 3\ngetValue(5)=>6 | getValue(4)=>10',
        sampleRunFail: 'Running PE2-Q2 SpecCala...\nKiểm tra thứ tự tham số constructor SpecCala và logic setData()/getValue().',
        skyTitle: '1. Bẫy thứ tự tham số Constructor lớp con!',
        skyDesc:
          'Đề PE2-Q2 đặt color ở VỊ TRÍ ĐẦU TIÊN: SpecCala(int color, String owner, int price). Luôn truyền super(owner, price) đúng thứ tự.',
        skyHint: 'public SpecCala(int color, String owner, int price) { super(owner, price); this.color = color; }',
        amberTitle: '2. Thay ký tự thứ 2 (index 1) bằng "XX"',
        amberDesc: 'Kiểm tra s != null && s.length() >= 2 trước khi gọi s.substring(0, 1) + "XX" + s.substring(2).',
        mistakeTitle: 'Sai constructor SpecCala hoặc thiếu super(owner, price) (PE2-Q2)',
        mistakeDetail: 'Constructor phải là SpecCala(int color, String owner, int price).',
        mistakeType: 'runtime',
      };
    },
  },

  // 7. PE2-Q3: TicketList
  7: {
    code: 'PE2-Q3',
    check: (main, combined) => {
      const tc1 =
        /extends\s+ArrayList\s*<\s*Ticket\s*>/.test(main) &&
        /%s,%s,%(\.2f)/.test(combined) &&
        /addTicket\s*\(/.test(main);
      const tc2 =
        /getCheapestTicket\s*\(/.test(main) &&
        /getPrice\s*\(\s*\)/.test(main) &&
        /isEmpty\s*\(\s*\)/.test(main);
      const tc3 =
        /countTicketsByType\s*\(/.test(main) && /equalsIgnoreCase\s*\(/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'Ticket.toString() "%s,%s,%.2f" không dấu cách & TicketList extends ArrayList<Ticket>',
          'getCheapestTicket() kiểm tra isEmpty() và tìm giá nhỏ nhất',
          'countTicketsByType() đếm bằng equalsIgnoreCase()',
        ],
        failHints: [
          'Kiểm tra extends ArrayList<Ticket> và Ticket.toString() không có dấu cách',
          'Chặn isEmpty() trả về null trước khi lấy this.get(0)',
          'Phải dùng equalsIgnoreCase(value) vì "NORMAL" phải khớp "Normal"',
        ],
        passSummary: 'TicketList chuẩn kế thừa ArrayList<Ticket> & định dạng không khoảng trắng.',
        sampleRunOk: 'Output:\nCheapest: S005,STUDENT,45.00\nCount("Normal") => 3',
        sampleRunFail: 'Running PE2-Q3 TicketList...\nChưa hoàn thiện getCheapestTicket() hoặc countTicketsByType().',
        skyTitle: '1. So sánh không phân biệt hoa/thường & check rỗng',
        skyDesc:
          'Luôn kiểm tra this.isEmpty() ở đầu getCheapestTicket() và kiểm tra null trước khi gọi equalsIgnoreCase(value).',
        skyHint: 'if (t.getType() != null && t.getType().equalsIgnoreCase(value)) count++;',
        amberTitle: '2. Định dạng Ticket.toString() không dấu cách',
        amberDesc: 'Yêu cầu đề: "Do not use spaces to separate values" -> String.format("%s,%s,%.2f", code, type, price).',
        mistakeTitle: 'Thiếu equalsIgnoreCase hoặc không chặn rỗng trong TicketList (PE2-Q3)',
        mistakeDetail: 'Dùng equalsIgnoreCase() cho type và check isEmpty() trong getCheapestTicket().',
        mistakeType: 'runtime',
      };
    },
  },

  // 8. PE3-Q1: CoffeeShop
  8: {
    code: 'PE3-Q1',
    check: (main) => {
      const tc1 =
        /getStoreName\s*\(/.test(main) &&
        /toUpperCase/.test(main) &&
        /toLowerCase/.test(main) &&
        /substring\s*\(\s*1\s*\)/.test(main);
      const tc2 =
        /getTotalRevenue\s*\(/.test(main) &&
        /numberOfCups\s*>=\s*100/.test(main) &&
        /1\.2/.test(main) &&
        /getProfitRevenue\s*\(/.test(main);
      const tc3 =
        /toString\s*\(\s*\)/.test(main) &&
        /%s:%\.2f|:|\.2f/.test(main) &&
        /toUpperCase\s*\(\s*\)/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'getStoreName() viết hoa chữ cái đầu, viết thường toàn bộ phần sau',
          'getTotalRevenue() (>= 100 ly nhân 1.2) & getProfitRevenue()',
          'toString() xuất STORE_UPPER:%.2f (BREW HAVEN:1440.00)',
        ],
        failHints: [
          'Dùng Character.toUpperCase(storeName.charAt(0)) + storeName.substring(1).toLowerCase()',
          'Kiểm tra điều kiện numberOfCups >= 100 -> nhân 1.2 và trừ costPerCup * numberOfCups',
          'toString() phải dùng storeName.toUpperCase() ghép ":" và String.format("%.2f", getTotalRevenue())',
        ],
        passSummary: 'CoffeeShop chuẩn công thức doanh thu/lợi nhuận & định dạng 2 chữ số thập phân.',
        sampleRunOk: 'Output:\nPassio coffee\nRevenue(50)=>175.00 | Profit=>612.00\nBREW HAVEN:1440.00',
        sampleRunFail: 'Running PE3-Q1 CoffeeShop...\nKiểm tra getStoreName(), ngưỡng >= 100 ly và định dạng toString().',
        skyTitle: '1. Chuẩn hóa "First letter capitalized, rest lowercase"',
        skyDesc:
          'Không đổi thành Title Case từng từ ("Passio Coffee") — cả phần từ vị trí 1 trở đi phải viết thường ("Passio coffee").',
        skyHint: 'return Character.toUpperCase(storeName.charAt(0)) + storeName.substring(1).toLowerCase();',
        amberTitle: '2. Ngưỡng 100 ly & format 2 chữ số thập phân ở toString()',
        amberDesc: 'getTotalRevenue() không format, còn toString() format %.2f nối liền dấu ":".',
        mistakeTitle: 'Sai công thức doanh thu >= 100 ly hoặc định dạng toString() (PE3-Q1)',
        mistakeDetail: 'Kiểm tra numberOfCups >= 100 * 1.2 và toString() dạng %s:%.2f.',
        mistakeType: 'cleancode',
      };
    },
  },

  // 9. PE3-Q2: OLEDScreen
  9: {
    code: 'PE3-Q2',
    check: (main) => {
      const tc1 =
        /extends\s+Screen/.test(main) &&
        /super\s*\(\s*diagonal\s*,\s*brightness\s*\)/.test(main) &&
        /refresh\s*<\s*0/.test(main) &&
        /calculatePrice\s*\(/.test(main);
      const tc2 =
        /estimateBurnInRisk\s*\(/.test(main) && /100\.0/.test(main) && /60\.0/.test(main);
      const tc3 =
        /toString\s*\(\s*\)/.test(main) && /%\.2f,%d,%\.2f/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'OLEDScreen kế thừa Screen, clamp refresh < 0 về 0 & calculatePrice()',
          'estimateBurnInRisk() chia số thực 100.0 và 60.0 chính xác',
          'toString() xuất "%.2f,%d,%.2f" không khoảng trắng (6.50,750,120.00)',
        ],
        failHints: [
          'Clamp refresh < 0 ? 0 : refresh trong constructor + setRefresh(), viết calculatePrice()',
          'Cần dùng 100.0 và 60.0 để tránh chia nguyên int bị làm tròn',
          'Dùng String.format("%.2f,%d,%.2f", getDiagonal(), getBrightness(), refresh)',
        ],
        passSummary: 'OLEDScreen chuẩn kế thừa, chia số thực và format không khoảng trắng.',
        sampleRunOk: 'Output:\ncalculatePrice()=>460.00 | burnIn=>7.50 | 6.50,750,120.00',
        sampleRunFail: 'Running PE3-Q2 OLEDScreen...\nKiểm tra clamp refresh < 0, phép chia 100.0/60.0 và %.2f,%d,%.2f.',
        skyTitle: '1. Tránh chia nguyên & clamp refresh âm',
        skyDesc:
          'Luôn viết (getBrightness() / 100.0) * (refresh / 60.0) và kẹp refresh < 0 -> 0 trong cả constructor lẫn setRefresh().',
        skyHint: 'this.refresh = (refresh < 0) ? 0 : refresh;',
        amberTitle: '2. Định dạng 2 chữ số thập phân không dấu cách',
        amberDesc: 'Yêu cầu dùng dấu phẩy không dấu cách: "%.2f,%d,%.2f".',
        mistakeTitle: 'Thiếu clamp refresh < 0 hoặc sai format toString() (PE3-Q2)',
        mistakeDetail: 'Dùng String.format("%.2f,%d,%.2f", ...) và kiểm tra refresh < 0.',
        mistakeType: 'runtime',
      };
    },
  },

  // 10. PE3-Q3: EmployeeList
  10: {
    code: 'PE3-Q3',
    check: (main, combined) => {
      const tc1 = /extends\s+ArrayList\s*<\s*Employee\s*>/.test(main) && /toString\s*\(/.test(combined);
      const tc2 =
        /getEmployeeById\s*\(/.test(main) &&
        /\.equals\s*\(/.test(main) &&
        /return\s+null/.test(main);
      const tc3 =
        /countEmployeesBySalary\s*\(/.test(main) &&
        /getSalary\s*\(\s*\)\s*>=\s*[A-Za-z_]\w*/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'EmployeeList extends ArrayList<Employee> & Employee.toString() không dấu cách',
          'getEmployeeById() so sánh equals() & trả null nếu không tìm thấy',
          'countEmployeesBySalary() đếm nhân viên có salary >= value',
        ],
        failHints: [
          'Cần public class EmployeeList extends ArrayList<Employee>',
          'Kiểm tra id != null rồi dùng id.equals(e.getEmployeeId()), trả null khi không khớp',
          'Kiểm tra điều kiện e.getSalary() >= salary (bao gồm dấu bằng)',
        ],
        passSummary: 'EmployeeList chuẩn kế thừa ArrayList<Employee> & so sánh String an toàn.',
        sampleRunOk: 'Output:\nE003,Michael Brown,Sales,70000.0\ncount(>=70000) => 4',
        sampleRunFail: 'Running PE3-Q3 EmployeeList...\nKiểm tra getEmployeeById() và countEmployeesBySalary().',
        skyTitle: '1. So sánh String ID bằng equals() thay vì ==',
        skyDesc: 'Trong Java, == so sánh địa chỉ tham chiếu. Dùng id.equals(e.getEmployeeId()) sau khi chặn id == null.',
        skyHint: 'if (e != null && id.equals(e.getEmployeeId())) return e;',
        amberTitle: '2. Kiểm tra điều kiện >= trong countEmployeesBySalary()',
        amberDesc: 'Đề yêu cầu "greater than or equal to the specified salary value" -> >= salary.',
        mistakeTitle: 'Chưa hoàn thiện getEmployeeById hoặc countEmployeesBySalary (PE3-Q3)',
        mistakeDetail: 'Dùng equals() để tra ID và >= salary khi đếm.',
        mistakeType: 'runtime',
      };
    },
  },

  // 11. PE3-Q4: MyStringNumberTool
  11: {
    code: 'PE3-Q4',
    check: (main) => {
      const tc1 =
        /implements\s+IStringNumberTool/.test(main) &&
        /buildAcronym\s*\(/.test(main) &&
        /toUpperCase\s*\(/.test(main) &&
        /('a'|isLetter|isAlphabetic)/.test(main);
      const usesForbiddenBinary = /Integer\.toBinaryString|Long\.toBinaryString|Integer\.toString\s*\([^,]+,\s*2\)/.test(
        main
      );
      const tc2 =
        !usesForbiddenBinary &&
        /decimalToBinary\s*\(/.test(main) &&
        /%\s*2/.test(main) &&
        /(\/=\s*2|\/\s*2)/.test(main) &&
        /"0"/.test(main);
      const tc3 =
        /string\s*==\s*null/.test(main) && /isEmpty\s*\(\s*\)/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'buildAcronym() lấy chữ cái đầu (A-Za-z) và viết hoa (123 data structure -> DS)',
          'decimalToBinary(n) tự chia % 2 / 2 thủ công (cấm Integer.toBinaryString)',
          'Xử lý an toàn string == null || isEmpty()',
        ],
        failHints: [
          'Tách từ theo " ", kiểm tra ký tự đầu là A-Za-z trước khi nối toUpperCase()',
          usesForbiddenBinary
            ? 'VI PHẠM ĐỀ BÀI: Đã phát hiện Integer.toBinaryString() bị cấm! Hãy tự chia % 2 / 2.'
            : 'Chưa xử lý n == 0 -> "0" hoặc chưa chia lấy dư % 2 / 2 và reverse()',
          'Kiểm tra string == null || string.isEmpty() trả về ""',
        ],
        passSummary: 'MyStringNumberTool chuẩn xử lý từ viết tắt & thuật toán đổi nhị phân thủ công.',
        sampleRunOk: 'Output:\nbuildAcronym("123 data structure") => DS\ndecimalToBinary(10) => 1010',
        sampleRunFail: usesForbiddenBinary
          ? 'Lỗi quy chế PE3-Q4: Cấm dùng Integer.toBinaryString()!'
          : 'Running PE3-Q4...\nKiểm tra buildAcronym() và thuật toán chia nhị phân thủ công.',
        skyTitle: usesForbiddenBinary
          ? '1. CẢNH BÁO: Đề cấm dùng Integer.toBinaryString()!'
          : '1. Đổi nhị phân thủ công + trường hợp n = 0',
        skyDesc:
          'Dùng StringBuilder ghi val % 2 rồi val /= 2 trong vòng while (val > 0), sau đó reverse(). Nhớ trả "0" nếu n == 0.',
        skyHint: 'if (n == 0) return "0"; while (val > 0) { sb.append(val % 2); val /= 2; } return sb.reverse().toString();',
        amberTitle: '2. Lọc bỏ từ bắt đầu bằng số trong buildAcronym()',
        amberDesc: 'Với "123 data structure", từ "123" bắt đầu bằng ký tự số nên bị bỏ qua -> "DS".',
        mistakeTitle: usesForbiddenBinary
          ? 'Dùng Integer.toBinaryString() bị cấm ở PE3-Q4'
          : 'Thiếu kiểm tra chữ cái hoặc trường hợp n == 0 (PE3-Q4)',
        mistakeDetail: 'Tự viết vòng lặp % 2 và / 2 để đổi nhị phân và check A-Za-z trong buildAcronym().',
        mistakeType: 'runtime',
      };
    },
  },

  // 12. PE4-Q1: Person
  12: {
    code: 'PE4-Q1',
    check: (main) => {
      const tc1 = /getSickLeave\s*\(\s*\)/.test(main) && /return\s+sickLeave/.test(main);
      const tc2 =
        /setName\s*\(/.test(main) &&
        /(?:(?:this\.)?name\s*\+\s*" "\s*\+\s*[A-Za-z_]\w*|(?:this\.)?name\s*\+=\s*" "\s*\+\s*[A-Za-z_]\w*)/.test(
          main
        );
      const tc3 = /toString\s*\(\s*\)/.test(main) && /name\s*\+\s*","/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'Constructor & getSickLeave() đúng đặc tả',
          'setName(newname) nối thêm vào sau tên cũ ("ly hung" + "anh" -> "ly hung anh")',
          'toString() xuất "name,sickLeave" KHÔNG có dấu cách sau dấu phẩy',
        ],
        failHints: [
          'Cần public double getSickLeave()',
          'Không gán đè this.name = newname; phải nối this.name + " " + newname',
          'Starter code đang có ", " thừa dấu cách! Phải sửa thành ","',
        ],
        passSummary: 'Person chuẩn nối chuỗi setName() & toString() không dấu cách.',
        sampleRunOk: 'Output:\ngetSickLeave() => 4.5\ntoString() => ly hung anh,5.5',
        sampleRunFail: 'Running PE4-Q1 Person...\nKiểm tra nối chuỗi trong setName() và bỏ dấu cách sau dấu phẩy ở toString().',
        skyTitle: '1. Bẫy "nối tên" và dấu cách trong toString()',
        skyDesc:
          'setName(newname) nối newname vào sau name cũ; đồng thời toString() phải là name + "," + sickLeave (không có khoảng trắng sau dấu phẩy).',
        skyHint: 'this.name = this.name + " " + newname;\nreturn name + "," + sickLeave;',
        amberTitle: '2. Kiểm tra null cho newname & this.name',
        amberDesc: 'Tránh tạo chuỗi "null anh" nếu đối tượng được tạo từ default constructor.',
        mistakeTitle: 'Gán đè tên hoặc thừa dấu cách trong toString() (PE4-Q1)',
        mistakeDetail: 'setName phải nối chuỗi và toString() không có dấu cách sau dấu phẩy.',
        mistakeType: 'cleancode',
      };
    },
  },

  // 13. PE4-Q2: SpecChair
  13: {
    code: 'PE4-Q2',
    check: (main) => {
      const tc1 =
        /extends\s+Chair/.test(main) &&
        /super\s*\(\s*color\s*,\s*quantity\s*\)/.test(main) &&
        /toString\s*\(\s*\)/.test(main) &&
        /getQuantity\s*\(\s*\)/.test(main);
      const tc2 =
        /setType\s*\(\s*\)/.test(main) &&
        /getQuantity\s*\(\s*\)\s*>\s*15/.test(main) &&
        /"flash sale"/.test(main) &&
        /"no sale"/.test(main);
      const tc3 =
        /getType\s*\(\s*\)/.test(main) && /substring\s*\(\s*1\s*\)/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'SpecChair kế thừa Chair, super(color, quantity) & toString() không dấu cách',
          'setType() đặt "flash sale" (quantity > 15) / "no sale" (<= 15)',
          'getType() xóa ký tự đầu tiên an toàn (normal -> ormal)',
        ],
        failHints: [
          'Cần super(color, quantity) và toString() -> getColor() + "," + getQuantity() + "," + type',
          'Kiểm tra quantity > 15 -> "flash sale" ngược lại "no sale"',
          'Dùng type.substring(1) sau khi chặn null/isEmpty',
        ],
        passSummary: 'SpecChair chuẩn kế thừa, flash sale & cắt ký tự đầu.',
        sampleRunOk: 'Output:\nblue,14,steel\nwooden,16,flash sale\normal',
        sampleRunFail: 'Running PE4-Q2 SpecChair...\nKiểm tra super(), setType() và getType().',
        skyTitle: '1. Điều kiện > 15 vs >= 15 & kiểm tra rỗng substring(1)',
        skyDesc: 'Đề ghi "greater than 15" (chặt: > 15). Trong getType(), luôn chặn type == null || type.isEmpty() trước khi substring(1).',
        skyHint: 'if (getQuantity() > 15) this.type = "flash sale"; else this.type = "no sale";',
        amberTitle: '2. Định dạng toString() không khoảng trắng',
        amberDesc: 'Trả về đúng color,quantity,type (không dấu cách).',
        mistakeTitle: 'Thiếu super(color, quantity) hoặc lỗi biên getType() (PE4-Q2)',
        mistakeDetail: 'Kiểm tra super(color, quantity), điều kiện > 15 và check rỗng trong getType().',
        mistakeType: 'runtime',
      };
    },
  },

  // 14. PE4-Q3: MyShoes
  14: {
    code: 'PE4-Q3',
    check: (main) => {
      const tc1 =
        /implements\s+IShoes/.test(main) &&
        /f1\s*\(/.test(main) &&
        /getPrice\s*\(\s*\)/.test(main) &&
        /display\s*\(/.test(main);
      const tc2 =
        /f2\s*\(/.test(main) && /Collections\.sort/.test(main) && /compare/.test(main);
      const tc3 =
        /f3\s*\(/.test(main) && /Iterator\s*<\s*Shoes\s*>/.test(main) && /it\.remove|remove\s*\(\s*\)/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'f1() tìm max price & có hàm display(List<Shoes>)',
          'f2() sắp xếp giảm dần theo price bằng Comparator JDK 8',
          'f3() xóa an toàn bằng Iterator các Shoes bắt đầu với "s"',
        ],
        failHints: [
          'Hoàn thiện f1() tìm max price và phương thức public void display(List<Shoes> t)',
          'Dùng Collections.sort(t, new Comparator<Shoes>() { ... }) theo Integer.compare(b.getPrice(), a.getPrice())',
          'Dùng Iterator<Shoes> it = t.iterator(); và it.remove() để tránh ConcurrentModificationException',
        ],
        passSummary: 'MyShoes chuẩn Comparator giảm dần & Iterator.remove() an toàn.',
        sampleRunOk: 'Output:\nMax: (cong so, 55)\nSorted: (tre em, 50) (sandal, 20) (the thao, 15)',
        sampleRunFail: 'Running PE4-Q3 MyShoes...\nChưa dùng Collections.sort/Comparator hoặc Iterator.remove().',
        skyTitle: '1. Cấm xóa phần tử trong vòng for-each!',
        skyDesc:
          'Xóa bằng t.remove(s) bên trong for (Shoes s : t) sẽ ném ConcurrentModificationException ngay lập tức. Hãy dùng Iterator.',
        skyHint: 'Iterator<Shoes> it = t.iterator(); while (it.hasNext()) { if (it.next().getName().toLowerCase().startsWith("s")) it.remove(); }',
        amberTitle: '2. Comparator chuẩn JDK 8 cho f2()',
        amberDesc: 'Sắp xếp giảm dần: Integer.compare(b.getPrice(), a.getPrice()).',
        mistakeTitle: 'Rủi ro ConcurrentModificationException khi xóa trong MyShoes (PE4-Q3)',
        mistakeDetail: 'Luôn dùng Iterator.remove() hoặc duyệt ngược trong f3().',
        mistakeType: 'runtime',
      };
    },
  },

  // 15. PE4-Q4: MyLink
  15: {
    code: 'PE4-Q4',
    check: (main) => {
      const hasRegexDotBug = /\.replaceAll\s*\(\s*"\."\s*,/.test(main);
      const tc1 =
        !hasRegexDotBug &&
        /implements\s+ILink/.test(main) &&
        /f1\s*\(/.test(main) &&
        (/\.replace\s*\(\s*"\."\s*,\s*":"\s*\)/.test(main) ||
          /\.replaceAll\s*\(\s*"\\\\\."\s*,\s*":"\s*\)/.test(main));
      const tc2 =
        /f2\s*\(/.test(main) &&
        /indexOf\s*\(\s*'\.'|indexOf\s*\(\s*"\."\s*\)/.test(main) &&
        /toUpperCase\s*\(\s*\)/.test(main);
      const tc3 =
        /str\s*==\s*null/.test(main) && /(?:==\s*-1|<\s*0)/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'f1() thay "." bằng ":" an toàn (tránh bẫy replaceAll(".", ":"))',
          'f2() viết hoa phần sau dấu "." đầu tiên (https://fap.FPT.EDU.VN)',
          'Kiểm tra str == null và trường hợp không có dấu "." (idx == -1)',
        ],
        failHints: [
          hasRegexDotBug
            ? 'BẪY REGEX: replaceAll(".", ":") sẽ biến mọi ký tự thành dấu ":"! Hãy dùng replace(".", ":")!'
            : 'Dùng str.replace(".", ":") để thay dấu chấm thành dấu hai chấm',
          'Tìm vị trí idx = str.indexOf(\'.\') rồi ghép substring(0, idx + 1) + substring(idx + 1).toUpperCase()',
          'Kiểm tra str == null và idx == -1 tránh StringIndexOutOfBoundsException',
        ],
        passSummary: 'MyLink chuẩn xử lý URL — tránh thành công bẫy Regex replaceAll(".").',
        sampleRunOk: 'Output:\nf1 => https://fap:fpt:edu:vn\nf2 => https://fap.FPT.EDU.VN',
        sampleRunFail: hasRegexDotBug
          ? 'Lỗi Regex PE4-Q4: replaceAll(".", ":") đã biến toàn bộ URL thành "::::::"!'
          : 'Running PE4-Q4 MyLink...\nKiểm tra f1 (replace vs replaceAll) và indexOf(".") ở f2().',
        skyTitle: hasRegexDotBug
          ? '1. BẪY KINH ĐIỂN: Sai replaceAll(".", ":")!'
          : '1. Phân biệt String.replace() vs String.replaceAll()',
        skyDesc:
          'replaceAll() nhận biểu thức chính quy (Regex), nơi dấu "." khớp MỌI KÝ TỰ! Luôn dùng str.replace(".", ":") để thay ký tự thuần.',
        skyHint: 'return str.replace(".", ":");',
        amberTitle: '2. An toàn indexOf(\'.\') trong f2()',
        amberDesc: 'Kiểm tra if (idx == -1 || idx + 1 >= str.length()) return str; trước khi cắt substring.',
        mistakeTitle: hasRegexDotBug
          ? 'Bẫy Regex replaceAll(".", ":") ở PE4-Q4'
          : 'Thiếu kiểm tra idx == -1 trong f2() (PE4-Q4)',
        mistakeDetail: 'Dùng str.replace(".", ":") và chặn idx == -1 khi URL không có dấu chấm.',
        mistakeType: 'runtime',
      };
    },
  },

  // 16. PE5-Q1: Coral
  16: {
    code: 'PE5-Q1',
    check: (main) => {
      const tc1 =
        /getName\s*\(/.test(main) &&
        /substring\s*\(\s*0\s*,/.test(main) &&
        /length\s*\(\s*\)\s*-\s*1/.test(main);
      const tc2 = /setPrice\s*\(/.test(main) && /this\.price\s*=\s*price/.test(main);
      const tc3 = /name\s*==\s*null/.test(main) && /isEmpty\s*\(\s*\)/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'getName() cắt ký tự cuối cùng (vietnam -> vietna)',
          'setPrice() & getPrice() cập nhật đúng',
          'Chặn name == null || name.isEmpty() tránh lỗi chỉ số âm',
        ],
        failHints: [
          'Dùng name.substring(0, name.length() - 1) trong getName()',
          'Cần setPrice(int price) và getPrice()',
          'Kiểm tra name == null || name.isEmpty() trước khi substring',
        ],
        passSummary: 'Coral chuẩn JDK 8 & an toàn với chuỗi rỗng/null.',
        sampleRunOk: 'Output:\ngetName("vietnam") => vietna\ngetPrice() => 12',
        sampleRunFail: 'Running PE5-Q1 Coral...\nCần cắt ký tự cuối trong getName() và kiểm tra name.isEmpty().',
        skyTitle: '1. Kiểm tra chuỗi rỗng trước substring(0, length - 1)',
        skyDesc: 'Nếu name == "" mà gọi substring(0, -1) sẽ ném StringIndexOutOfBoundsException ngay lập tức.',
        skyHint: 'if (name == null || name.isEmpty()) return ""; return name.substring(0, name.length() - 1);',
        amberTitle: '2. Không format thêm kết quả',
        amberDesc: 'Giữ nguyên kiểu trả về String và int đúng UML Coral.',
        mistakeTitle: 'Rủi ro StringIndexOutOfBoundsException trong Coral.getName() (PE5-Q1)',
        mistakeDetail: 'Phải kiểm tra name == null || name.isEmpty() trước substring.',
        mistakeType: 'runtime',
      };
    },
  },

  // 17. PE5-Q2: SpecLadder
  17: {
    code: 'PE5-Q2',
    check: (main) => {
      const tc1 =
        /extends\s+Ladder/.test(main) &&
        /super\s*\(\s*type\s*,\s*price\s*\)/.test(main) &&
        /toString\s*\(\s*\)/.test(main);
      const tc2 =
        /setData\s*\(\s*\)/.test(main) &&
        /Character\.isLetter/.test(main) &&
        /%\s*10/.test(main) &&
        /setType\s*\(/.test(main);
      const tc3 =
        /getValue\s*\(\s*\)/.test(main) &&
        /%\s*2\s*==\s*0/.test(main) &&
        />=\s*2/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'SpecLadder extends Ladder, super(type, price) & toString()',
          'setData() đổi chữ cái cuối (isLetter) thành chữ số cuối của price',
          'getValue() đếm chữ số chẵn (>= 2 -> +evenDigits; < 2 -> +totalDigits)',
        ],
        failHints: [
          'Gọi super(type, price) và toString() -> getType() + ", " + getPrice() + ", " + weight',
          'Duyệt ngược tìm Character.isLetter(s.charAt(i)) rồi thay bằng Math.abs(getPrice()) % 10',
          'Duyệt các chữ số của weight, đếm chữ số chẵn (d % 2 == 0) và kiểm tra >= 2',
        ],
        passSummary: 'SpecLadder chuẩn kế thừa & biến đổi chữ cái cuối / chữ số chẵn.',
        sampleRunOk: 'Output:\nstandard, 100, 50\nsetData() => standar1, 21\ngetValue(24)=>standard2 | getValue(135)=>standard3',
        sampleRunFail: 'Running PE5-Q2 SpecLadder...\nKiểm tra Character.isLetter ngược trong setData() và đếm chữ số chẵn ở getValue().',
        skyTitle: '1. Tìm "chữ cái cuối" bằng Character.isLetter()',
        skyDesc:
          'Nếu type có số ở cuối như "ab1", thay ký tự cuối sẽ sai! Phải duyệt từ s.length() - 1 về 0 tới chữ cái isLetter đầu tiên gặp.',
        skyHint: 'if (Character.isLetter(s.charAt(i))) { setType(s.substring(0, i) + lastDigit + s.substring(i + 1)); return; }',
        amberTitle: '2. Nhớ chữ số 0 cũng là chữ số chẵn (0 % 2 == 0)',
        amberDesc: 'Chuyển weight sang chuỗi với Math.abs(weight) để đếm chính xác cả trường hợp weight = 0 hay số âm.',
        mistakeTitle: 'Sai vị trí thay trong setData() hoặc điều kiện getValue() (PE5-Q2)',
        mistakeDetail: 'Tìm isLetter từ phải sang trái và đếm chữ số chẵn >= 2.',
        mistakeType: 'cleancode',
      };
    },
  },

  // 18. PE5-Q3: MyLadder
  18: {
    code: 'PE5-Q3',
    check: (main, combined) => {
      const tc1 =
        /implements\s+ILadder/.test(main) &&
        /f1\s*\(/.test(main) &&
        /(?:isUpperCase|'A')/.test(combined) &&
        /(?:isLowerCase|'a')/.test(combined) &&
        />/.test(combined);
      const tc2 =
        /f2\s*\(/.test(main) &&
        /setPrice\s*\(\s*0\s*\)/.test(main) &&
        /\.length\s*\(\s*\)/.test(combined);
      const tc3 =
        /f3\s*\(/.test(main) &&
        /Character\.isLetter/.test(main) &&
        /Iterator\s*<\s*Ladder\s*>/.test(main);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'f1() tính tổng price khi số chữ hoa > số chữ thường',
          'f2() gán price = 0 cho TẤT CẢ type đạt maxLength',
          'f3() xóa an toàn bằng Iterator mọi phần tử có max số chữ cái (isLetter)',
        ],
        failHints: [
          'Đếm upper (A-Z) và lower (a-z) trên từng Ladder.getType(), cộng price nếu upper > lower',
          'Tìm maxLen trước rồi duyệt lại đặt l.setPrice(0) cho tất cả phần tử có length == maxLen',
          'Đếm theo Character.isLetter() (không phải length!) rồi xóa tất cả phần tử == maxLetters bằng Iterator',
        ],
        passSummary: 'MyLadder chuẩn đếm isLetter, gán 0 theo maxLength & Iterator.remove().',
        sampleRunOk: 'Output:\nf1 => 20\nf2 => [6, 9, 0, 0]\nf3 => [A1234, B1]',
        sampleRunFail: 'Running PE5-Q3 MyLadder...\nKiểm tra f2 (đặt price=0 mọi maxLen) và f3 (max Character.isLetter + Iterator).',
        skyTitle: '1. Phân biệt độ dài (f2) vs số chữ cái isLetter (f3)',
        skyDesc:
          'Ở f3, "A1234" dài 5 ký tự nhưng chỉ có 1 chữ cái, nên vẫn được giữ lại; còn "AB123" và "AC1" có 2 chữ cái (max) nên bị xóa!',
        skyHint: 'Iterator<Ladder> it = t.iterator(); while (it.hasNext()) { if (countLetters(it.next().getType()) == maxLetters) it.remove(); }',
        amberTitle: '2. f2 phải gán price = 0 cho TẤT CẢ phần tử dài nhất',
        amberDesc: 'Tách thành 2 vòng lặp: vòng 1 tìm maxLen, vòng 2 đặt setPrice(0) cho mọi phần tử đạt maxLen.',
        mistakeTitle: 'Nhầm length() với isLetter() hoặc không dùng Iterator ở f3 (PE5-Q3)',
        mistakeDetail: 'f3 đếm Character.isLetter() và xóa tất cả phần tử đạt max bằng Iterator.',
        mistakeType: 'runtime',
      };
    },
  },

  // 19. PE5-Q4: MyString
  19: {
    code: 'PE5-Q4',
    check: (main, combined) => {
      const tc1 =
        /implements\s+IString/.test(main) &&
        /f1\s*\(/.test(main) &&
        /(Set\s*<\s*Character\s*>|HashSet)/.test(combined) &&
        /size\s*\(\s*\)\s*==\s*2/.test(combined) &&
        /'a'/.test(combined);
      const tc2 =
        /f2\s*\(/.test(main) &&
        /Character\.isLetter/.test(combined) &&
        /!=\s*nonAlpha|!=/.test(combined) &&
        /StringBuilder/.test(combined);
      const tc3 = /str\s*==\s*null/.test(combined) && /\.split\s*\(\s*"\\\\s\+"\s*\)/.test(combined);
      return {
        tc1,
        tc2,
        tc3,
        labels: [
          'f1() dùng HashSet đếm đúng 2 chữ số khác nhau & >= 1 chữ thường',
          'f2() giữ lại từ có số chữ cái != số ký tự không phải chữ cái',
          'Tách từ trim().split("\\\\s+") an toàn null & không thừa dấu cách',
        ],
        failHints: [
          'Dùng Set<Character> digits = new HashSet<Character>() kiểm tra digits.size() == 2 && hasLower',
          'Đếm alpha (Character.isLetter) và nonAlpha cho từng từ; chỉ giữ khi alpha != nonAlpha',
          'Kiểm tra str == null / rỗng và dùng if (sb.length() > 0) sb.append(\' \')',
        ],
        passSummary: 'MyString PE5-Q4 chuẩn HashSet đếm chữ số phân biệt & lọc cân bằng ký tự.',
        sampleRunOk: 'Output:\nf1("A12b B121 c34D 111X") => 2\nf2("ab12 A#B# xyz") => "xyz"',
        sampleRunFail: 'Running PE5-Q4 MyString...\nKiểm tra HashSet 2 chữ số khác nhau và điều kiện alpha != nonAlpha.',
        skyTitle: '1. Đếm chữ số KHÁC NHAU bằng HashSet<Character>',
        skyDesc:
          '"B121" có 3 ký tự số nhưng chỉ gồm 2 chữ số khác nhau là \'1\' và \'2\'. Dùng Set<Character> rồi kiểm tra digits.size() == 2 && hasLower.',
        skyHint: 'Set<Character> digits = new HashSet<Character>(); if (Character.isDigit(c)) digits.add(c);',
        amberTitle: '2. Trả về "" khi không có từ nào thỏa f2()',
        amberDesc: 'StringBuilder khởi tạo rỗng tự động trả "" nếu mọi từ đều có alpha == nonAlpha.',
        mistakeTitle: 'Chưa dùng HashSet đếm chữ số phân biệt hoặc thừa dấu cách (PE5-Q4)',
        mistakeDetail: 'Dùng Set<Character> để kiểm tra exactly 2 distinct digits và ghép chuỗi sạch dấu cách.',
        mistakeType: 'cleancode',
      };
    },
  },
};

export function evaluatePeCode(
  peId: number,
  mainCode: string,
  entityCode: string
): PeEvaluationResult {
  const cleanMainCode = stripJavaComments(mainCode);
  const combined = stripJavaComments(`${mainCode}\n${entityCode}`);

  const spec = PE_RULES[peId] || PE_RULES[1];
  const r = spec.check(cleanMainCode, combined);

  const hasPackageDecl = /^\s*package\s+/m.test(cleanMainCode);
  const hasJava11Api = /\.isBlank\s*\(|\b(?:List|Set|Map)\.of\s*\(|\.toList\s*\(|\.strip\s*\(|\.repeat\s*\(/.test(
    cleanMainCode
  );
  const hasForbiddenPe3Q4Binary =
    peId === 11 &&
    /\bInteger\.toBinaryString\s*\(|\bLong\.toBinaryString\s*\(|\bInteger\.toString\s*\([^,]+,\s*2\s*\)/.test(
      cleanMainCode
    );
  const hasNonAscii = /[^\x00-\x7F]/.test(mainCode);

  const hardPolicyViolations: string[] = [];
  if (hasPackageDecl) {
    hardPolicyViolations.push('Quy chế 0 điểm PEA/EOS: Không khai báo package trong bài PE.');
  }
  if (hasJava11Api) {
    hardPolicyViolations.push('Phát hiện API Java 11+ (không tương thích trình chấm JDK 1.8).');
  }
  if (hasForbiddenPe3Q4Binary) {
    hardPolicyViolations.push('Vi phạm quy chế PE3-Q4: Cấm dùng Integer.toBinaryString().');
  }

  const passedCount = [r.tc1, r.tc2, r.tc3].filter(Boolean).length;
  const allPassed = passedCount === 3 && hardPolicyViolations.length === 0;

  const diagnosisCards: PeDiagnosisCard[] = [];
  const softWarnings: PeDiagnosisCard[] = [];

  if (hasPackageDecl) {
    diagnosisCards.push({
      id: `pe${peId}-pkg`,
      tone: 'amber',
      title: '⚠ Quy chế 0 điểm PEA/EOS: Không khai báo package',
      description:
        'Tất cả file .java nộp bài thi PRO192 phải nằm trong default package (xóa dòng package ...;).',
    });
  }

  if (hasJava11Api || hasNonAscii) {
    const asciiCard: PeDiagnosisCard = {
      id: `pe${peId}-jdk8`,
      tone: 'amber',
      title: hasJava11Api ? '⚠ Cảnh báo chuẩn JDK 1.8' : '💡 Lưu ý ASCII phòng thi PEA/EOS',
      description: hasJava11Api
        ? 'Phát hiện API Java 11+ (isBlank/List.of/toList/strip/repeat). Trình chấm dùng JDK 1.8 sẽ báo lỗi biên dịch 0 điểm!'
        : 'Phát hiện ký tự có dấu trong mã nguồn/comment Java. Quy chế phòng thi khuyến nghị chỉ dùng ASCII.',
    };
    diagnosisCards.push(asciiCard);
    if (!hasJava11Api) {
      softWarnings.push(asciiCard);
    }
  }

  if (!r.tc1 || !r.tc3) {
    diagnosisCards.push({
      id: `pe${peId}-sky`,
      tone: 'sky',
      title: r.skyTitle,
      description: r.skyDesc,
      hintCode: r.skyHint,
    });
    softWarnings.push({
      id: `pe${peId}-soft-edge`,
      tone: 'amber',
      title: `💡 Gợi ý phòng bẫy test ẩn (${spec.code})`,
      description: r.skyDesc,
      hintCode: r.skyHint,
    });
  }

  if (!r.tc2 || !allPassed) {
    diagnosisCards.push({
      id: `pe${peId}-amber`,
      tone: 'amber',
      title: r.amberTitle,
      description: r.amberDesc,
      hintCode: r.amberHint,
    });
  }

  if (allPassed) {
    diagnosisCards.push({
      id: `pe${peId}-pass`,
      tone: 'green',
      title: `✔ Cấu trúc đạt chuẩn ${spec.code} (Static Preview)`,
      description: r.passSummary,
    });
  }

  const staticRunPrefix = '[Static Preview — Phân tích cấu trúc tĩnh, chưa biên dịch JVM]';
  const staticSampleBody = allPassed
    ? `${staticRunPrefix}\nMinh họa kỳ vọng đề bài:\n${r.sampleRunOk.replace(/^Output:\s*/i, '')}`
    : `${staticRunPrefix}\n${r.sampleRunFail}`;

  return {
    passedCount,
    totalCount: 3,
    allPassed,
    hardPolicyViolations,
    softWarnings,
    statusText: allPassed
      ? '✔ 3/3 Tiêu chí cấu trúc (Static Preview — chưa chạy JVM)'
      : `${passedCount}/3 Tiêu chí cấu trúc (Static Preview)`,
    consoleRunOutput: staticSampleBody,
    consoleTestOutput: [
      '[Static Preview — Phân tích cấu trúc tĩnh · Cần OpenJDK để xác nhận Pass chính thức]',
      `${r.tc1 ? '✔' : '✕'} TC1: ${r.labels[0]} (${r.tc1 ? 'Đạt mẫu' : r.failHints[0]})`,
      `${r.tc2 ? '✔' : '✕'} TC2: ${r.labels[1]} (${r.tc2 ? 'Đạt mẫu' : r.failHints[1]})`,
      `${r.tc3 ? '✔' : '✕'} TC3: ${r.labels[2]} (${r.tc3 ? 'Đạt mẫu' : r.failHints[2]})`,
      allPassed
        ? `Cấu trúc ${spec.code} khớp mẫu chuẩn JDK 1.8. Hãy chạy trên OpenJDK Cloud hoặc "Copy lệnh javac" để xác nhận Pass thật!`
        : 'Gợi ý: Mở "⚡ So sánh Bản Tối ưu (Diff)" hoặc xem /pro192/pe-patterns để đối chiếu.',
    ].join('\n'),
    diagnosisCards,
    detectedMistake: !allPassed
      ? {
          type: r.mistakeType,
          title: r.mistakeTitle,
          detail: r.mistakeDetail,
          peId,
        }
      : undefined,
  };
}
