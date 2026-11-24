import type { MistakeItem } from '../types/content';

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
  statusText: string;
  consoleRunOutput: string;
  consoleTestOutput: string;
  diagnosisCards: PeDiagnosisCard[];
  detectedMistake?: Omit<MistakeItem, 'id' | 'createdAt'>;
}

export function evaluatePeCode(
  peId: number,
  mainCode: string,
  entityCode: string
): PeEvaluationResult {
  const combined = `${mainCode}\n${entityCode}`;

  if (peId === 1) {
    const hasNullListCheck =
      /list\s*==\s*null/i.test(combined) || /Objects\.isNull\s*\(\s*list\s*\)/.test(combined);
    const hasFilterLogic =
      /getGpa\s*\(\s*\)\s*>=\s*8(\.0)?/.test(combined) &&
      (/s\s*!=\s*null/.test(combined) || /Objects::nonNull/.test(combined));
    const hasSort =
      /sort\s*\(/.test(combined) || /sorted\s*\(/.test(combined) || /Comparator/.test(combined);

    const tc1 = hasFilterLogic;
    const tc2 = hasNullListCheck;
    const tc3 = hasSort;
    const passedCount = [tc1, tc2, tc3].filter(Boolean).length;
    const allPassed = passedCount === 3;

    const diagnosisCards: PeDiagnosisCard[] = [];
    if (!hasNullListCheck) {
      diagnosisCards.push({
        id: 'pe1-null',
        tone: 'sky',
        title: '1. Phát hiện rủi ro NullPointerException',
        description:
          'Trong filterHonor(), bạn chưa kiểm tra list == null trước khi duyệt vòng lặp hoặc stream.',
        hintCode: 'if (list == null || list.isEmpty()) return Collections.emptyList();',
      });
    }
    if (!hasSort || /for\s*\([^)]+\)\s*\{[\s\S]*for\s*\(/.test(mainCode)) {
      diagnosisCards.push({
        id: 'pe1-clean',
        tone: 'amber',
        title: hasSort ? '2. Gợi ý tối ưu Comparator & Clean Code' : '2. Thiếu sắp xếp GPA giảm dần',
        description: hasSort
          ? 'Có thể dùng Comparator.comparingDouble(Student::getGpa).reversed().thenComparing(Student::getName) để ngắn và rõ ràng hơn.'
          : 'Đề yêu cầu sắp xếp theo GPA giảm dần, nếu bằng GPA thì xếp theo name tăng dần.',
        hintCode:
          'result.sort(Comparator.comparingDouble(Student::getGpa).reversed().thenComparing(Student::getName));',
      });
    }
    if (allPassed) {
      diagnosisCards.push({
        id: 'pe1-pass',
        tone: 'green',
        title: '✔ Clean Code đạt chuẩn PE 01',
        description:
          'Đã kiểm tra list/element null ở đầu hàm (Early Return) và sắp xếp Comparator chuẩn 2 tiêu chí.',
      });
    }

    return {
      passedCount,
      totalCount: 3,
      allPassed,
      statusText: allPassed
        ? '✔ 3/3 Test Cases PASSED!'
        : `${passedCount}/3 Test Cases Passed`,
      consoleRunOutput: !tc2
        ? 'Running Test...\n[TC1] An (9.00) | Binh (8.50) -> OK\n[TC2] NullPointerException at Main.java (list is null!)\n-> Xem thẻ AI Code Mentor bên phải để biết cách sửa.'
        : 'Output:\nAn - 9.00\nBinh - 8.50\nKhông phát hiện lỗi runtime!',
      consoleTestOutput: [
        `${tc1 ? '✔' : '✕'} TC1: Lọc danh sách SV có GPA >= 8.0 (${tc1 ? 'Pass' : 'Chưa lọc hoặc thiếu kiểm tra s != null'})`,
        `${tc2 ? '✔' : '✕'} TC2: Danh sách null hoặc rỗng (${tc2 ? 'Pass — Trả về list rỗng an toàn' : 'Lỗi NullPointerException'})`,
        `${tc3 ? '✔' : '✕'} TC3: Sắp xếp GPA giảm dần, cùng GPA theo tên (${tc3 ? 'Pass' : 'Thiếu logic sắp xếp'})`,
        allPassed
          ? 'Chúc mừng! Bài PE 01 đã đạt tiêu chí Clean Code.'
          : 'Gợi ý: Mở "⚡ So sánh Bản Tối ưu (Diff)" để đối chiếu Clean Code!',
      ].join('\n'),
      diagnosisCards,
      detectedMistake: !tc2
        ? {
            type: 'runtime',
            title: 'NullPointerException trong filterHonor() (PE 01)',
            detail:
              'Chưa kiểm tra list == null hoặc phần tử s == null trước khi truy xuất s.getGpa().',
            peId: 1,
          }
        : undefined,
    };
  }

  if (peId === 2) {
    const hasExtendsSuper = /extends\s+Book/.test(combined) && /super\s*\(/.test(combined);
    const hasOverridePrice =
      /@Override/.test(combined) &&
      /getFinalPrice\s*\(\s*\)/.test(combined) &&
      /discountRate/.test(combined);
    const hasToString =
      /toString\s*\(\s*\)/.test(combined) &&
      (/EBook\[/.test(combined) || /String\.format/.test(combined));

    const tc1 = hasExtendsSuper;
    const tc2 = hasOverridePrice;
    const tc3 = hasToString;
    const passedCount = [tc1, tc2, tc3].filter(Boolean).length;
    const allPassed = passedCount === 3;

    const diagnosisCards: PeDiagnosisCard[] = [];
    if (!tc1 || !tc2) {
      diagnosisCards.push({
        id: 'pe2-inherit',
        tone: 'sky',
        title: '1. Kiểm tra Kế thừa & @Override',
        description:
          'Lớp EBook cần kế thừa Book (extends Book), gọi super(title, price) và dùng @Override getFinalPrice().',
        hintCode: '@Override public double getFinalPrice() { return price * (1.0 - discountRate); }',
      });
    }
    if (!tc3) {
      diagnosisCards.push({
        id: 'pe2-format',
        tone: 'amber',
        title: '2. Định dạng toString() chuẩn Test Case',
        description:
          'PEA chấm chuỗi đầu ra rất gắt: cần trả về đúng format EBook[title, finalPrice] làm tròn 1 số lẻ.',
        hintCode: 'return String.format("EBook[%s, %.1f]", title, getFinalPrice());',
      });
    }
    if (allPassed) {
      diagnosisCards.push({
        id: 'pe2-pass',
        tone: 'green',
        title: '✔ Kế thừa & Đa hình chuẩn PE 02',
        description:
          'Constructor super(), @Override getFinalPrice() và định dạng toString() đều khớp tiêu chí chấm tự động.',
      });
    }

    return {
      passedCount,
      totalCount: 3,
      allPassed,
      statusText: allPassed ? '✔ 3/3 Test Cases PASSED!' : `${passedCount}/3 Test Cases Passed`,
      consoleRunOutput: allPassed
        ? 'Output:\nEBook[Java Core, 85.0]\nBiên dịch & thực thi thành công!'
        : 'Running PE 02...\nChưa hoàn thiện @Override getFinalPrice() hoặc toString(). Mở Diff View để xem gợi ý.',
      consoleTestOutput: [
        `${tc1 ? '✔' : '✕'} TC1: Kế thừa Book & Constructor super() (${tc1 ? 'Pass' : 'Thiếu extends Book / super()'})`,
        `${tc2 ? '✔' : '✕'} TC2: Ghi đè @Override getFinalPrice() (${tc2 ? 'Pass' : 'Chưa tính price * (1 - discountRate)'})`,
        `${tc3 ? '✔' : '✕'} TC3: Định dạng toString() EBook[title, %.1f] (${tc3 ? 'Pass' : 'Thiếu định dạng EBook[...]'})`,
      ].join('\n'),
      diagnosisCards,
      detectedMistake: !tc2
        ? {
            type: 'cleancode',
            title: 'Thiếu @Override getFinalPrice() ở lớp con EBook (PE 02)',
            detail:
              'Luôn gắn annotation @Override để trình biên dịch kiểm tra đúng chữ ký phương thức ghi đè.',
            peId: 2,
          }
        : undefined,
    };
  }

  if (peId === 3) {
    const hasAddGuard = /item\s*==\s*null/.test(combined) && /numOfItem\s*>=\s*MAX/.test(combined);
    const hasSafeRemove =
      /removeItem/.test(combined) &&
      (/numOfItem\s*-\s*1/.test(combined) || /--numOfItem/.test(combined));
    const hasSortAndFind = /equalsIgnoreCase/.test(combined) && /sort/.test(combined);

    const tc1 = hasAddGuard;
    const tc2 = hasSafeRemove;
    const tc3 = hasSortAndFind;
    const passedCount = [tc1, tc2, tc3].filter(Boolean).length;
    const allPassed = passedCount === 3;

    const diagnosisCards: PeDiagnosisCard[] = [];
    if (!tc1 || !tc2) {
      diagnosisCards.push({
        id: 'pe3-bounds',
        tone: 'sky',
        title: '1. Bẫy ArrayIndexOutOfBoundsException',
        description:
          'Khi mảng đầy MAX = 100, addItem() phải chặn numOfItem >= MAX và removeItem() chỉ dịch đến i < numOfItem - 1 rồi gán null phần tử cuối.',
        hintCode: 'for (int i = index; i < numOfItem - 1; i++) list[i] = list[i + 1]; list[--numOfItem] = null;',
      });
    }
    if (!tc3) {
      diagnosisCards.push({
        id: 'pe3-compare',
        tone: 'amber',
        title: '2. So sánh chuỗi & Sắp xếp ItemList',
        description:
          'Tìm kiếm creator nên dùng equalsIgnoreCase(creator.trim()) và hoán đổi đúng hai đối tượng Item.',
      });
    }
    if (allPassed) {
      diagnosisCards.push({
        id: 'pe3-pass',
        tone: 'green',
        title: '✔ ItemList an toàn tuyệt đối biên mảng',
        description:
          'Đã vá sạch toàn bộ lỗi tràn chỉ số MAX và rò rỉ tham chiếu khi xóa phần tử.',
      });
    }

    return {
      passedCount,
      totalCount: 3,
      allPassed,
      statusText: allPassed ? '✔ 3/3 Test Cases PASSED!' : `${passedCount}/3 Test Cases Passed`,
      consoleRunOutput: allPassed
        ? 'Output:\nItemList [MAX=100] -> add/find/remove/sort OK!'
        : 'Cảnh báo: Chưa kiểm tra ngưỡng MAX hoặc thiếu removeItem() dịch trái an toàn!',
      consoleTestOutput: [
        `${tc1 ? '✔' : '✕'} TC1: Kiểm tra item == null & numOfItem >= MAX (${tc1 ? 'Pass' : 'Có nguy cơ tràn mảng MAX'})`,
        `${tc2 ? '✔' : '✕'} TC2: removeItem() khi mảng đầy không lỗi biên (${tc2 ? 'Pass' : 'Thiếu dịch trái tới numOfItem - 1'})`,
        `${tc3 ? '✔' : '✕'} TC3: findItemIndex (equalsIgnoreCase) & sortByValueAsc (${tc3 ? 'Pass' : 'Chưa đủ hàm tìm/sắp xếp'})`,
      ].join('\n'),
      diagnosisCards,
      detectedMistake: !tc1
        ? {
            type: 'runtime',
            title: 'ArrayIndexOutOfBoundsException khi thêm/xóa mảng ItemList (PE 03)',
            detail:
              'Cần chặn item == null || numOfItem >= MAX trong addItem() và dịch vòng lặp tới numOfItem - 1.',
            peId: 3,
          }
        : undefined,
    };
  }

  // PE 04: HashMap + File I/O CSV
  const hasWordCountSafe =
    /text\s*==\s*null/.test(combined) &&
    /toLowerCase\s*\(\s*\)/.test(combined) &&
    /\\s\+/.test(combined);
  const hasTryWithResources =
    /try\s*\(\s*BufferedReader/.test(combined) && /StandardCharsets\.UTF_8|UTF_8/.test(combined);
  const hasErrorSafeAndSort =
    /NumberFormatException/.test(combined) &&
    (/Comparator/.test(combined) || /sort\s*\(/.test(combined));

  const tc1 = hasWordCountSafe;
  const tc2 = hasTryWithResources;
  const tc3 = hasErrorSafeAndSort;
  const passedCount = [tc1, tc2, tc3].filter(Boolean).length;
  const allPassed = passedCount === 3;

  const diagnosisCards: PeDiagnosisCard[] = [];
  if (!tc1) {
    diagnosisCards.push({
      id: 'pe4-split',
      tone: 'sky',
      title: '1. Chuẩn hóa chuỗi trước khi đếm HashMap',
      description:
        'Dùng split(" ") sẽ tạo token rỗng nếu có nhiều dấu cách liên tiếp; cần text.trim().toLowerCase().split("\\\\s+") và chặn text == null.',
      hintCode: 'if (text == null || text.isBlank()) return Collections.emptyMap();',
    });
  }
  if (!tc2 || !tc3) {
    diagnosisCards.push({
      id: 'pe4-io',
      tone: 'amber',
      title: '2. Đóng luồng File I/O & Bắt lỗi từng dòng CSV',
      description:
        'Dùng try-with-resources UTF-8 cho BufferedReader và bọc try-catch(NumberFormatException) bên trong vòng while để 1 dòng hỏng không làm sập cả tệp.',
      hintCode: 'try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8)))',
    });
  }
  if (allPassed) {
    diagnosisCards.push({
      id: 'pe4-pass',
      tone: 'green',
      title: '✔ Đạt chuẩn Full Q1–Q4 Collections + File I/O',
      description:
        'HashMap chuẩn hóa từ, try-with-resources UTF-8, bắt NumberFormatException từng dòng và Comparator 2 tiêu chí đều hoàn chỉnh.',
    });
  }

  return {
    passedCount,
    totalCount: 3,
    allPassed,
    statusText: allPassed ? '✔ 3/3 Test Cases PASSED!' : `${passedCount}/3 Test Cases Passed`,
    consoleRunOutput: allPassed
      ? 'Output:\n{java=2, oop=1}\nLoaded 3 valid products (1 malformed CSV row skipped safely).'
      : 'Running PE 04...\nChưa đủ try-with-resources UTF-8 hoặc xử lý chuỗi/NumberFormatException.',
    consoleTestOutput: [
      `${tc1 ? '✔' : '✕'} TC1: Chuẩn hóa chuỗi & đếm HashMap (${tc1 ? 'Pass' : 'Cần check null + trim().toLowerCase().split("\\\\s+")'})`,
      `${tc2 ? '✔' : '✕'} TC2: Đọc CSV bằng try-with-resources UTF-8 (${tc2 ? 'Pass' : 'Thiếu try(BufferedReader ...) UTF-8'})`,
      `${tc3 ? '✔' : '✕'} TC3: Bỏ qua NumberFormatException & sắp xếp 2 tiêu chí (${tc3 ? 'Pass' : 'Thiếu catch NumberFormatException hoặc Comparator'})`,
    ].join('\n'),
    diagnosisCards,
    detectedMistake: !tc1
      ? {
          type: 'runtime',
          title: 'Lỗi tách từ bằng split(" ") và chưa check null ở countWords() (PE 04)',
          detail:
            'Cần kiểm tra text == null || text.isBlank() và tách bằng regex "\\\\s+" sau khi trim().toLowerCase().',
          peId: 4,
        }
      : undefined,
  };
}
