export interface PeHarnessSpec {
  fileName: string;
  entryClass: string;
  content: string;
  extraFiles?: Array<{ path: string; content: string }>;
}

const I_DAISY_CODE = `import java.util.List;

public interface IDaisy {
    public int f1(List<Daisy> t);
    public void f2(List<Daisy> t);
    public void f3(List<Daisy> t);
}
`;

const I_STRING_CODE = `public interface IString {
    public int f1(String str);
    public String f2(String str);
}
`;

const I_STRING_NUMBER_TOOL_CODE = `public interface IStringNumberTool {
    public String buildAcronym(String string);
    public String decimalToBinary(int n);
}
`;

const I_SHOES_CODE = `import java.util.List;

public interface IShoes {
    public Shoes f1(List<Shoes> t);
    public void f2(List<Shoes> t);
    public void f3(List<Shoes> t);
}
`;

const I_LINK_CODE = `public interface ILink {
    public String f1(String str);
    public String f2(String str);
}
`;

const I_LADDER_CODE = `import java.util.List;

public interface ILadder {
    public int f1(List<Ladder> t);
    public void f2(List<Ladder> t);
    public void f3(List<Ladder> t);
}
`;

export function getPeInterfaceFiles(peId: number): Array<{ path: string; content: string }> {
  switch (peId) {
    case 3:
      return [{ path: '/tmp/jb-work/IDaisy.java', content: I_DAISY_CODE }];
    case 4:
    case 19:
      return [{ path: '/tmp/jb-work/IString.java', content: I_STRING_CODE }];
    case 11:
      return [{ path: '/tmp/jb-work/IStringNumberTool.java', content: I_STRING_NUMBER_TOOL_CODE }];
    case 14:
      return [{ path: '/tmp/jb-work/IShoes.java', content: I_SHOES_CODE }];
    case 15:
      return [{ path: '/tmp/jb-work/ILink.java', content: I_LINK_CODE }];
    case 18:
      return [{ path: '/tmp/jb-work/ILadder.java', content: I_LADDER_CODE }];
    default:
      return [];
  }
}

const JSON_HELPERS = `
    private static String jbEsc(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length() + 8);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\\\') sb.append("\\\\\\\\");
            else if (c == '"') sb.append("\\\\\\"");
            else if (c == '\\n') sb.append("\\\\n");
            else if (c == '\\r') sb.append("\\\\r");
            else if (c == '\\t') sb.append("\\\\t");
            else if (c < 32) sb.append(' ');
            else sb.append(c);
        }
        return sb.toString();
    }

    private static String jbFormat(String id, String name, boolean passed, long ms, String expected, String actual, String error) {
        return "{\\"id\\":\\"" + jbEsc(id) + "\\","
            + "\\"name\\":\\"" + jbEsc(name) + "\\","
            + "\\"passed\\":" + passed + ","
            + "\\"durationMs\\":" + ms + ","
            + "\\"expected\\":\\"" + jbEsc(expected) + "\\","
            + "\\"actual\\":\\"" + jbEsc(actual) + "\\","
            + "\\"error\\":\\"" + jbEsc(error) + "\\"}";
    }
`;

function wrapGrader(peId: number, bodyJava: string): PeHarnessSpec {
  const entryClass = `__JavaBrewPe${String(peId).padStart(2, '0')}Grader`;
  const extraFiles = getPeInterfaceFiles(peId);
  const content = `import java.util.*;

public class ${entryClass} {
${JSON_HELPERS}
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        List<String> results = new ArrayList<String>();
${bodyJava}
        System.out.println("__JB_TESTS_START__");
        System.out.println("[" + String.join(",", results) + "]");
        System.out.println("__JB_TESTS_END__");
    }
}
`;
  return {
    fileName: `${entryClass}.java`,
    entryClass,
    content,
    ...(extraFiles.length > 0 ? { extraFiles } : {}),
  };
}

function wrapRunner(peId: number, bodyJava: string): PeHarnessSpec {
  const entryClass = '__JavaBrewSmokeRunner';
  const extraFiles = getPeInterfaceFiles(peId);
  const content = `import java.util.*;

public class ${entryClass} {
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
${bodyJava}
    }
}
`;
  return {
    fileName: `${entryClass}.java`,
    entryClass,
    content,
    ...(extraFiles.length > 0 ? { extraFiles } : {}),
  };
}

function tcBlock(
  id: string,
  title: string,
  expectedExpr: string,
  tryBody: string
): string {
  const javaTitle = JSON.stringify(title);
  return `
        long t_${id} = System.nanoTime();
        boolean p_${id} = false;
        String a_${id} = "", e_${id} = "";
        String exp_${id} = ${expectedExpr};
        try {
${tryBody}
        } catch (Throwable t) {
            a_${id} = t.getClass().getSimpleName() + ": " + t.getMessage();
            e_${id} = a_${id};
        }
        results.add(jbFormat("${id}", ${javaTitle}, p_${id}, (System.nanoTime() - t_${id}) / 1_000_000L, exp_${id}, a_${id}, e_${id}));
`;
}

function buildGrader(peId: number): PeHarnessSpec | null {
  switch (peId) {
    // 1. PE1-Q1: Crocus
    case 1:
      return wrapGrader(
        1,
        [
          tcBlock(
            'TC1',
            'getName() xoa chu so cuoi (crocus3 -> crocus)',
            '"crocus"',
            `            Crocus c = new Crocus("crocus3", 2);
            String out = c.getName();
            a_TC1 = String.valueOf(out);
            p_TC1 = "crocus".equals(out);
            if (!p_TC1) e_TC1 = "getName() phai xoa dung chu so cuoi trong name";`
          ),
          tcBlock(
            'TC2',
            'setWeight(10) tru so ky tu non-digit (crocus3 -> 4)',
            '"4"',
            `            Crocus c = new Crocus("crocus3", 2);
            c.setWeight(10);
            int w = c.getWeight();
            a_TC2 = String.valueOf(w);
            p_TC2 = (w == 4);
            if (!p_TC2) e_TC2 = "weight = newWeight - countNonDigits (10 - 6 = 4)";`
          ),
          tcBlock(
            'TC3',
            'Truong hop bien (a1b2c -> a1bc & default constructor an toan)',
            '"a1bc, nonNull"',
            `            Crocus c1 = new Crocus("a1b2c", 10);
            Crocus c2 = new Crocus();
            String s1 = c1.getName();
            String s2 = c2.getName();
            c2.setWeight(5);
            a_TC3 = s1 + ", s2=" + s2 + ", w2=" + c2.getWeight();
            p_TC3 = "a1bc".equals(s1) && s2 != null && c2.getWeight() == 5;
            if (!p_TC3) e_TC3 = "Kiem tra xoa chu so cuoi khi nam giua chuoi va default constructor";`
          ),
        ].join('')
      );

    // 2. PE1-Q2: Daisy & SpecDaisy
    case 2:
      return wrapGrader(
        2,
        [
          tcBlock(
            'TC1',
            'toString() Daisy & SpecDaisy dung dinh dang dau phay',
            '"daisy, 2 | daisy, yellow, 2"',
            `            Daisy d = new Daisy("daisy", 2);
            SpecDaisy sd = new SpecDaisy("daisy", 2, "yellow");
            String out1 = d.toString();
            String out2 = sd.toString();
            a_TC1 = out1 + " | " + out2;
            p_TC1 = "daisy, 2".equals(out1) && "daisy, yellow, 2".equals(out2) && "yellow".equals(sd.getColor());
            if (!p_TC1) e_TC1 = "Kiem tra super(name, age) va toString(): name, color, age";`
          ),
          tcBlock(
            'TC2',
            'setData() dao 2 chu thuong (a-z) dau tien (DaIsy -> DsIay)',
            '"DsIay, 2"',
            `            SpecDaisy sd = new SpecDaisy("DaIsy", 2, "yellow");
            sd.setData();
            a_TC2 = sd.getName() + ", " + sd.getAge();
            p_TC2 = "DsIay".equals(sd.getName()) && sd.getAge() == 2;
            if (!p_TC2) e_TC2 = "Chi dao 2 chu cai thuong (a-z) dau tien trong name";`
          ),
          tcBlock(
            'TC3',
            'getValue() kiem tra color co chu thuong (Yellow -> D123, YELLOW -> Daisy123)',
            '"D123 | Daisy123"',
            `            SpecDaisy s1 = new SpecDaisy("Daisy123", 2, "Yellow");
            SpecDaisy s2 = new SpecDaisy("Daisy123", 2, "YELLOW");
            String v1 = s1.getValue();
            String v2 = s2.getValue();
            a_TC3 = v1 + " | " + v2;
            p_TC3 = "D123".equals(v1) && "Daisy123".equals(v2);
            if (!p_TC3) e_TC3 = "Neu color co >= 1 chu thuong thi xoa het chu thuong trong name, nguoc lai giu nguyen";`
          ),
        ].join('')
      );

    // 3. PE1-Q3: MyDaisy
    case 3:
      return wrapGrader(
        3,
        [
          tcBlock(
            'TC1',
            'f1(): tong age co it nhat 1 chu hoa va 1 chu thuong',
            '"20"',
            `            IDaisy m = new MyDaisy();
            List<Daisy> t = new ArrayList<Daisy>(Arrays.asList(
                new Daisy("Ab1", 6), new Daisy("CD2", 9), new Daisy("ef2", 11), new Daisy("gH2", 14)
            ));
            int out = m.f1(t);
            a_TC1 = String.valueOf(out);
            p_TC1 = (out == 20);
            if (!p_TC1) e_TC1 = "Tong age cho (Ab1,6) va (gH2,14) phai bang 20";`
          ),
          tcBlock(
            'TC2',
            'f2(): Partial Sort giu nguyen vi tri khong chua chu thuong',
            '"A11:5 f67:2 C23:1 d45:5 E56:11 b12:9"',
            `            IDaisy m = new MyDaisy();
            List<Daisy> t = new ArrayList<Daisy>(Arrays.asList(
                new Daisy("A11", 5), new Daisy("b12", 9), new Daisy("C23", 1),
                new Daisy("d45", 5), new Daisy("E56", 11), new Daisy("f67", 2)
            ));
            m.f2(t);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < t.size(); i++) {
                if (i > 0) sb.append(" ");
                sb.append(t.get(i).getName()).append(":").append(t.get(i).getAge());
            }
            a_TC2 = sb.toString();
            p_TC2 = exp_TC2.equals(a_TC2);
            if (!p_TC2) e_TC2 = "Chi sap xep cac phan tu co a-z tang dan theo age, giu nguyen vi tri khac";`
          ),
          tcBlock(
            'TC3',
            'f3(): thay palindrome (phan biet hoa/thuong) bang non-palindrome dau tien',
            '"B1b:7 B1b:7 C1:10 D1:14"',
            `            IDaisy m = new MyDaisy();
            List<Daisy> t = new ArrayList<Daisy>(Arrays.asList(
                new Daisy("C1C", 16), new Daisy("B1b", 7), new Daisy("C1", 10), new Daisy("D1", 14)
            ));
            m.f3(t);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < t.size(); i++) {
                if (i > 0) sb.append(" ");
                sb.append(t.get(i).getName()).append(":").append(t.get(i).getAge());
            }
            a_TC3 = sb.toString();
            p_TC3 = exp_TC3.equals(a_TC3);
            if (!p_TC3) e_TC3 = "B1b khong phai palindrome case-sensitive; C1C phai duoc thay bang B1b";`
          ),
        ].join('')
      );

    // 4. PE1-Q4: MyString
    case 4:
      return wrapGrader(
        4,
        [
          tcBlock(
            'TC1',
            'f1(): dem tu co chu cai dau truoc so dau & chu cai cuoi sau so cuoi',
            '"2"',
            `            IString m = new MyString();
            int out = m.f1("abc12def A12B C123 abc123 xyz");
            a_TC1 = String.valueOf(out);
            p_TC1 = (out == 2);
            if (!p_TC1) e_TC1 = "Chi co abc12def va A12B thoa man ca 2 dieu kien";`
          ),
          tcBlock(
            'TC2',
            'f2(): thay chu so dau tien bang so luong chu cai trong tu',
            '"ab22 xyz A2B2 hello5"',
            `            IString m = new MyString();
            String out = m.f2("ab12 xyz A1B2 hello3");
            a_TC2 = String.valueOf(out);
            p_TC2 = exp_TC2.equals(out);
            if (!p_TC2) e_TC2 = "Thay dung chu so dau tien bang so chu cai; giu nguyen tu khong co so";`
          ),
          tcBlock(
            'TC3',
            'Xu ly nhieu dau cach lien tiep va chuoi rong / null',
            '"0 | ab22 hello5"',
            `            IString m = new MyString();
            int rEmpty = m.f1("   ");
            String rMulti = m.f2("  ab12   hello3  ");
            a_TC3 = rEmpty + " | " + rMulti;
            p_TC3 = (rEmpty == 0) && "ab22 hello5".equals(rMulti);
            if (!p_TC3) e_TC3 = "Can trim() va split(\\"\\\\\\\\s+\\") khong du dau cach";`
          ),
        ].join('')
      );

    // 5. PE2-Q1: Camel
    case 5:
      return wrapGrader(
        5,
        [
          tcBlock(
            'TC1',
            'getDesert() tra ve chuoi IN HOA (alan -> ALAN)',
            '"ALAN"',
            `            Camel c = new Camel("alan", 5);
            String out = c.getDesert();
            a_TC1 = String.valueOf(out);
            p_TC1 = "ALAN".equals(out);
            if (!p_TC1) e_TC1 = "getDesert() phai tra ve desert viet hoa";`
          ),
          tcBlock(
            'TC2',
            'setStep() & getStep() cap nhat gia tri chinh xac',
            '"15"',
            `            Camel c = new Camel("alan", 12);
            c.setStep(15);
            int s = c.getStep();
            a_TC2 = String.valueOf(s);
            p_TC2 = (s == 15);
            if (!p_TC2) e_TC2 = "setStep(15) phai cap nhat step thanh 15";`
          ),
          tcBlock(
            'TC3',
            'Default constructor khong nem NullPointerException',
            '"nonNull, step=0"',
            `            Camel c = new Camel();
            String d = c.getDesert();
            a_TC3 = "desert=" + d + ", step=" + c.getStep();
            p_TC3 = (d != null && c.getStep() == 0);
            if (!p_TC3) e_TC3 = "Can kiem tra desert == null trong getDesert()";`
          ),
        ].join('')
      );

    // 6. PE2-Q2: Cala & SpecCala
    case 6:
      return wrapGrader(
        6,
        [
          tcBlock(
            'TC1',
            'Constructor SpecCala(color, owner, price) & toString()',
            '"alan, 3 | alan, 3, 4"',
            `            Cala c = new Cala("alan", 3);
            SpecCala sc = new SpecCala(4, "alan", 3);
            a_TC1 = c.toString() + " | " + sc.toString();
            p_TC1 = "alan, 3".equals(c.toString()) && "alan, 3, 4".equals(sc.toString());
            if (!p_TC1) e_TC1 = "Chu y thu tu tham so SpecCala(int color, String owner, int price)";`
          ),
          tcBlock(
            'TC2',
            'setData() thay ky tu thu 2 cua owner bang "XX" (alan -> aXXan)',
            '"aXXan, 3"',
            `            SpecCala sc = new SpecCala(4, "alan", 3);
            sc.setData();
            a_TC2 = sc.getOwner() + ", " + sc.getPrice();
            p_TC2 = "aXXan".equals(sc.getOwner()) && sc.getPrice() == 3;
            if (!p_TC2) e_TC2 = "Thay ky tu tai index 1 bang XX va goi setOwner(...)";`
          ),
          tcBlock(
            'TC3',
            'getValue() color le (+3) & chan (+7)',
            '"odd=6, even=10"',
            `            SpecCala sOdd = new SpecCala(5, "alan", 3);
            SpecCala sEven = new SpecCala(4, "alan", 3);
            int v1 = sOdd.getValue();
            int v2 = sEven.getValue();
            a_TC3 = "odd=" + v1 + ", even=" + v2;
            p_TC3 = (v1 == 6 && v2 == 10);
            if (!p_TC3) e_TC3 = "color le -> price + 3; color chan -> price + 7";`
          ),
        ].join('')
      );

    // 7. PE2-Q3: Ticket & TicketList
    case 7:
      return wrapGrader(
        7,
        [
          tcBlock(
            'TC1',
            'Ticket.toString() dinh dang code,type,%.2f khong dau cach',
            '"V001,VIP,150.00"',
            `            Ticket tk = new Ticket("V001", "VIP", 150.0);
            a_TC1 = tk.toString();
            p_TC1 = "V001,VIP,150.00".equals(a_TC1);
            if (!p_TC1) e_TC1 = "Dinh dang dung phai la code,type,%.2f khong dau cach";`
          ),
          tcBlock(
            'TC2',
            'getCheapestTicket() tra ve ve gia thap nhat (S005,STUDENT,45.00)',
            '"S005,STUDENT,45.00"',
            `            TicketList list = new TicketList();
            list.addTicket(new Ticket("V001", "VIP", 150.0));
            list.addTicket(new Ticket("N002", "NORMAL", 80.0));
            list.addTicket(new Ticket("S005", "STUDENT", 45.0));
            list.addTicket(new Ticket("N006", "Normal", 100.0));
            Ticket cheap = list.getCheapestTicket();
            a_TC2 = (cheap == null) ? "null" : cheap.toString();
            p_TC2 = cheap != null && "S005,STUDENT,45.00".equals(cheap.toString());
            if (!p_TC2) e_TC2 = "getCheapestTicket() phai tim ve co price nho nhat";`
          ),
          tcBlock(
            'TC3',
            'countTicketsByType("Normal") khong phan biet hoa/thuong',
            '"3"',
            `            TicketList list = new TicketList();
            list.addTicket(new Ticket("N002", "NORMAL", 80.0));
            list.addTicket(new Ticket("N004", "NORMAL", 75.0));
            list.addTicket(new Ticket("N006", "Normal", 100.0));
            list.addTicket(new Ticket("V001", "VIP", 150.0));
            int cnt = list.countTicketsByType("Normal");
            int cntMiss = list.countTicketsByType("NONE");
            a_TC3 = String.valueOf(cnt) + " (miss=" + cntMiss + ")";
            p_TC3 = (cnt == 3 && cntMiss == 0);
            if (!p_TC3) e_TC3 = "Dung equalsIgnoreCase() va tra 0 neu khong khop";`
          ),
        ].join('')
      );

    // 8. PE3-Q1: CoffeeShop
    case 8:
      return wrapGrader(
        8,
        [
          tcBlock(
            'TC1',
            'getStoreName() chuan hoa ky tu dau hoa, sau thuong',
            '"Passio coffee"',
            `            CoffeeShop c = new CoffeeShop(2, "passio Coffee", 4.0, 150);
            a_TC1 = String.valueOf(c.getStoreName());
            p_TC1 = "Passio coffee".equals(a_TC1);
            if (!p_TC1) e_TC1 = "Chi viet hoa chu cai dau ca chuoi, con lai viet thuong";`
          ),
          tcBlock(
            'TC2',
            'getTotalRevenue() (<100 & >=100) & getProfitRevenue()',
            '"rev1=175.00, profit3=612.00"',
            `            CoffeeShop c1 = new CoffeeShop(1, "Coffee World", 3.5, 50);
            CoffeeShop c3 = new CoffeeShop(3, "orange bar bistro", 5.5, 120);
            double r1 = c1.getTotalRevenue();
            double pr3 = c3.getProfitRevenue(1.5);
            a_TC2 = String.format("rev1=%.2f, profit3=%.2f", r1, pr3);
            p_TC2 = Math.abs(r1 - 175.0) < 1e-6 && Math.abs(pr3 - 612.0) < 1e-6;
            if (!p_TC2) e_TC2 = "Neu numberOfCups >= 100 thi doanh thu nhan 1.2";`
          ),
          tcBlock(
            'TC3',
            'toString() xuat STORE_UPPER:%.2f (BREW HAVEN:1440.00)',
            '"BREW HAVEN:1440.00"',
            `            CoffeeShop c4 = new CoffeeShop(4, "brew haven", 6.0, 200);
            a_TC3 = c4.toString();
            p_TC3 = "BREW HAVEN:1440.00".equals(a_TC3);
            if (!p_TC3) e_TC3 = "toString() phai la storeName.toUpperCase():%.2f";`
          ),
        ].join('')
      );

    // 9. PE3-Q2: Screen & OLEDScreen
    case 9:
      return wrapGrader(
        9,
        [
          tcBlock(
            'TC1',
            'calculatePrice() & clamp refresh am ve 0',
            '"price=460.00, clamped=0.00"',
            `            OLEDScreen o1 = new OLEDScreen(5, 400, 60);
            OLEDScreen oNeg = new OLEDScreen(5, 400, -15);
            double price = o1.calculatePrice();
            double clamped = oNeg.getRefresh();
            a_TC1 = String.format("price=%.2f, clamped=%.2f", price, clamped);
            p_TC1 = Math.abs(price - 460.0) < 1e-6 && Math.abs(clamped) < 1e-6;
            if (!p_TC1) e_TC1 = "Kiem tra clamp refresh < 0 -> 0 va cong thuc calculatePrice()";`
          ),
          tcBlock(
            'TC2',
            'estimateBurnInRisk() chia thuc (brightness/100.0)*(refresh/60.0)',
            '"7.50"',
            `            OLEDScreen o2 = new OLEDScreen(6, 500, 90);
            double risk = o2.estimateBurnInRisk();
            a_TC2 = String.format("%.2f", risk);
            p_TC2 = Math.abs(risk - 7.5) < 1e-6;
            if (!p_TC2) e_TC2 = "Tranh chia nguyen: phai chia cho 100.0 va 60.0";`
          ),
          tcBlock(
            'TC3',
            'OLEDScreen.toString() dinh dang %.2f,%d,%.2f khong dau cach',
            '"6.50,750,120.00"',
            `            OLEDScreen o3 = new OLEDScreen(6.5, 750, 120);
            a_TC3 = o3.toString();
            p_TC3 = "6.50,750,120.00".equals(a_TC3);
            if (!p_TC3) e_TC3 = "toString() phai co dang %.2f,%d,%.2f khong dau cach";`
          ),
        ].join('')
      );

    // 10. PE3-Q3: Employee & EmployeeList
    case 10:
      return wrapGrader(
        10,
        [
          tcBlock(
            'TC1',
            'Employee() & toString() khong dau cach',
            '",,,0.0 | E001,John Smith,IT,75000.0"',
            `            Employee empty = new Employee();
            Employee e1 = new Employee("E001", "John Smith", "IT", 75000.0);
            a_TC1 = empty.toString() + " | " + e1.toString();
            p_TC1 = ",,,0.0".equals(empty.toString()) && "E001,John Smith,IT,75000.0".equals(e1.toString());
            if (!p_TC1) e_TC1 = "Employee() khoi tao \\"\\",0.0 va toString() khong co dau cach";`
          ),
          tcBlock(
            'TC2',
            'getEmployeeById() tim thay E003 va tra null neu khong thay',
            '"E003,Michael Brown,Sales,70000.0 | null"',
            `            EmployeeList list = new EmployeeList();
            list.add(new Employee("E001", "John Smith", "IT", 75000.0));
            list.add(new Employee("E002", "Sarah Johnson", "HR", 65000.0));
            list.add(new Employee("E003", "Michael Brown", "Sales", 70000.0));
            Employee found = list.getEmployeeById("E003");
            Employee miss = list.getEmployeeById("E999");
            a_TC2 = (found == null ? "null" : found.toString()) + " | " + String.valueOf(miss);
            p_TC2 = found != null && "E003,Michael Brown,Sales,70000.0".equals(found.toString()) && miss == null;
            if (!p_TC2) e_TC2 = "So sanh ID bang equals() va tra null neu khong khop";`
          ),
          tcBlock(
            'TC3',
            'countEmployeesBySalary() dem luong >= minimum',
            '"cnt70k=4, cnt68k=5"',
            `            EmployeeList l1 = new EmployeeList();
            l1.add(new Employee("E001", "A", "IT", 75000.0));
            l1.add(new Employee("E002", "B", "HR", 65000.0));
            l1.add(new Employee("E003", "C", "Sales", 70000.0));
            l1.add(new Employee("E004", "D", "Finance", 80000.0));
            l1.add(new Employee("E005", "E", "Ops", 68000.0));
            l1.add(new Employee("E007", "F", "IT", 78000.0));
            int c70 = l1.countEmployeesBySalary(70000.0);
            EmployeeList l2 = new EmployeeList();
            l2.addAll(l1.subList(0, 5));
            l2.add(new Employee("E006", "G", "Sale", 70000.0));
            int c68 = l2.countEmployeesBySalary(68000.0);
            a_TC3 = "cnt70k=" + c70 + ", cnt68k=" + c68;
            p_TC3 = (c70 == 4 && c68 == 5);
            if (!p_TC3) e_TC3 = "Phai dem cac nhan vien co salary >= gia tri truyen vao";`
          ),
        ].join('')
      );

    // 11. PE3-Q4: MyStringNumberTool
    case 11:
      return wrapGrader(
        11,
        [
          tcBlock(
            'TC1',
            'buildAcronym() loc chu cai dau tung tu & viet hoa',
            '"OOP | DS | AI"',
            `            IStringNumberTool t = new MyStringNumberTool();
            String s1 = t.buildAcronym("object oriented program");
            String s2 = t.buildAcronym("123 data structure");
            String s3 = t.buildAcronym("artificial intelligence");
            a_TC1 = s1 + " | " + s2 + " | " + s3;
            p_TC1 = "OOP".equals(s1) && "DS".equals(s2) && "AI".equals(s3);
            if (!p_TC1) e_TC1 = "Chi lay ky tu dau neu la chu cai A-Za-z va chuyen in hoa";`
          ),
          tcBlock(
            'TC2',
            'decimalToBinary() chuyen doi chinh xac (0, 5, 10)',
            '"0 | 101 | 1010"',
            `            IStringNumberTool t = new MyStringNumberTool();
            String b0 = t.decimalToBinary(0);
            String b5 = t.decimalToBinary(5);
            String b10 = t.decimalToBinary(10);
            a_TC2 = b0 + " | " + b5 + " | " + b10;
            p_TC2 = "0".equals(b0) && "101".equals(b5) && "1010".equals(b10);
            if (!p_TC2) e_TC2 = "Phai xu ly n == 0 -> \\"0\\" va chia % 2 / 2 thu cong";`
          ),
          tcBlock(
            'TC3',
            'buildAcronym() an toan khi null hoac chuoi rong',
            '"empty"',
            `            IStringNumberTool t = new MyStringNumberTool();
            String rNull = t.buildAcronym(null);
            String rEmpty = t.buildAcronym("");
            a_TC3 = "null=" + rNull + ", empty=" + rEmpty;
            p_TC3 = "".equals(rNull) && "".equals(rEmpty);
            if (!p_TC3) e_TC3 = "Null hoac rong phai tra ve \\"\\"";`
          ),
        ].join('')
      );

    // 12. PE4-Q1: Person
    case 12:
      return wrapGrader(
        12,
        [
          tcBlock(
            'TC1',
            'getSickLeave() tra ve gia tri dung',
            '"4.5"',
            `            Person p = new Person("nguyen anh", 4.5);
            double sl = p.getSickLeave();
            a_TC1 = String.valueOf(sl);
            p_TC1 = Math.abs(sl - 4.5) < 1e-6;
            if (!p_TC1) e_TC1 = "getSickLeave() chua tra dung sickLeave";`
          ),
          tcBlock(
            'TC2',
            'setName() noi them newname & toString() khong dau cach',
            '"ly hung anh,5.5"',
            `            Person p = new Person("ly hung", 5.5);
            p.setName("anh");
            a_TC2 = p.toString();
            p_TC2 = "ly hung anh,5.5".equals(a_TC2);
            if (!p_TC2) e_TC2 = "setName(newname) phai noi vao sau name cu va toString() khong co dau cach sau dau phay";`
          ),
          tcBlock(
            'TC3',
            'setName(null) an toan khong lam hong ten',
            '"an,2.0"',
            `            Person p = new Person("an", 2.0);
            p.setName(null);
            a_TC3 = p.toString();
            p_TC3 = "an,2.0".equals(a_TC3);
            if (!p_TC3) e_TC3 = "Can kiem tra newname == null";`
          ),
        ].join('')
      );

    // 13. PE4-Q2: Chair & SpecChair
    case 13:
      return wrapGrader(
        13,
        [
          tcBlock(
            'TC1',
            'Chair & SpecChair.toString() khong co dau cach sau dau phay',
            '"blue,14 | blue,14,steel"',
            `            Chair c = new Chair("blue", 14);
            SpecChair sc = new SpecChair("blue", 14, "steel");
            a_TC1 = c.toString() + " | " + sc.toString();
            p_TC1 = "blue,14".equals(c.toString()) && "blue,14,steel".equals(sc.toString());
            if (!p_TC1) e_TC1 = "toString() phai theo dinh dang khong co dau cach sau dau phay";`
          ),
          tcBlock(
            'TC2',
            'setType() quantity > 15 ("flash sale") vs <= 15 ("no sale")',
            '"wooden,16,flash sale | wooden,6,no sale"',
            `            SpecChair s1 = new SpecChair("wooden", 16, "normal");
            SpecChair s2 = new SpecChair("wooden", 6, "6");
            s1.setType();
            s2.setType();
            a_TC2 = s1.toString() + " | " + s2.toString();
            p_TC2 = "wooden,16,flash sale".equals(s1.toString()) && "wooden,6,no sale".equals(s2.toString());
            if (!p_TC2) e_TC2 = "quantity > 15 -> \\"flash sale\\", nguoc lai -> \\"no sale\\"";`
          ),
          tcBlock(
            'TC3',
            'getType() xoa ky tu dau (normal -> ormal)',
            '"ormal"',
            `            SpecChair s = new SpecChair("wooden", 5, "normal");
            SpecChair empty = new SpecChair("red", 1, "");
            String g1 = s.getType();
            String g2 = empty.getType();
            a_TC3 = g1 + " (empty=" + g2 + ")";
            p_TC3 = "ormal".equals(g1) && "".equals(g2);
            if (!p_TC3) e_TC3 = "getType() cat bo ky tu dau tien an toan";`
          ),
        ].join('')
      );

    // 14. PE4-Q3: Shoes & MyShoes
    case 14:
      return wrapGrader(
        14,
        [
          tcBlock(
            'TC1',
            'f1(): tim Shoes co price lon nhat',
            '"(cong so, 55)"',
            `            IShoes m = new MyShoes();
            List<Shoes> t = new ArrayList<Shoes>(Arrays.asList(
                new Shoes("sandal", 20), new Shoes("tre em", 50),
                new Shoes("the thao", 15), new Shoes("cong so", 55)
            ));
            Shoes max = m.f1(t);
            a_TC1 = (max == null) ? "null" : max.toString();
            p_TC1 = max != null && "(cong so, 55)".equals(max.toString());
            if (!p_TC1) e_TC1 = "f1() phai tra ve doi tuong Shoes co gia cao nhat";`
          ),
          tcBlock(
            'TC2',
            'f2(): sap xep danh sach giam dan theo price',
            '"(tre em, 50) (sandal, 20) (the thao, 15)"',
            `            IShoes m = new MyShoes();
            List<Shoes> t = new ArrayList<Shoes>(Arrays.asList(
                new Shoes("sandal", 20), new Shoes("tre em", 50), new Shoes("the thao", 15)
            ));
            m.f2(t);
            a_TC2 = t.get(0) + " " + t.get(1) + " " + t.get(2);
            p_TC2 = exp_TC2.equals(a_TC2);
            if (!p_TC2) e_TC2 = "f2() phai sap xep price giam dan";`
          ),
          tcBlock(
            'TC3',
            'f3(): xoa an toan cac Shoes co name bat dau bang s',
            '"(tre em, 50) (the thao, 15)"',
            `            IShoes m = new MyShoes();
            List<Shoes> t = new ArrayList<Shoes>(Arrays.asList(
                new Shoes("sandal", 20), new Shoes("slipper", 10),
                new Shoes("tre em", 50), new Shoes("the thao", 15)
            ));
            m.f3(t);
            a_TC3 = t.size() == 2 ? (t.get(0) + " " + t.get(1)) : t.toString();
            p_TC3 = t.size() == 2 && "(tre em, 50) (the thao, 15)".equals(a_TC3);
            if (!p_TC3) e_TC3 = "Dung Iterator de xoa lien tiep cac phan tu bat dau bang \\"s\\" ma khong bo sot";`
          ),
        ].join('')
      );

    // 15. PE4-Q4: MyLink
    case 15:
      return wrapGrader(
        15,
        [
          tcBlock(
            'TC1',
            'f1(): thay toan bo dau "." bang ":" (tranh bay Regex)',
            '"https://fap:fpt:edu:vn"',
            `            ILink m = new MyLink();
            String out = m.f1("https://fap.fpt.edu.vn");
            a_TC1 = String.valueOf(out);
            p_TC1 = exp_TC1.equals(out);
            if (!p_TC1) e_TC1 = "Dung str.replace(\\".\\", \\":\\") thay vi replaceAll(\\".\\", \\":\\")";`
          ),
          tcBlock(
            'TC2',
            'f2(): viet hoa phan chuoi sau dau "." dau tien',
            '"https://fap.FPT.EDU.VN"',
            `            ILink m = new MyLink();
            String out = m.f2("https://fap.fpt.edu.vn");
            a_TC2 = String.valueOf(out);
            p_TC2 = exp_TC2.equals(out);
            if (!p_TC2) e_TC2 = "Chi viet hoa substring sau indexOf('.') dau tien";`
          ),
          tcBlock(
            'TC3',
            'Truong hop khong co dau cham & null an toan',
            '"localhost | ok"',
            `            ILink m = new MyLink();
            String noDot = m.f2("localhost");
            String rNull = m.f1(null);
            a_TC3 = noDot + " | " + (rNull != null ? "ok" : "null");
            p_TC3 = "localhost".equals(noDot) && rNull != null;
            if (!p_TC3) e_TC3 = "Neu khong tim thay '.' (idx == -1) thi giu nguyen chuoi";`
          ),
        ].join('')
      );

    // 16. PE5-Q1: Coral
    case 16:
      return wrapGrader(
        16,
        [
          tcBlock(
            'TC1',
            'getName() cat ky tu cuoi cung (vietnam -> vietna)',
            '"vietna"',
            `            Coral c = new Coral("vietnam", 10);
            a_TC1 = String.valueOf(c.getName());
            p_TC1 = "vietna".equals(a_TC1);
            if (!p_TC1) e_TC1 = "getName() phai tra ve name bo ky tu cuoi";`
          ),
          tcBlock(
            'TC2',
            'setPrice() & getPrice() cap nhat gia tri',
            '"12"',
            `            Coral c = new Coral("vietnam", 10);
            c.setPrice(12);
            a_TC2 = String.valueOf(c.getPrice());
            p_TC2 = (c.getPrice() == 12);
            if (!p_TC2) e_TC2 = "setPrice(12) phai cap nhat price = 12";`
          ),
          tcBlock(
            'TC3',
            'An toan khi name rong, 1 ky tu hoac null',
            '"empty | empty | nonNull"',
            `            Coral c1 = new Coral("a", 1);
            Coral c2 = new Coral("", 1);
            Coral c3 = new Coral();
            String r1 = c1.getName();
            String r2 = c2.getName();
            String r3 = c3.getName();
            a_TC3 = r1 + " | " + r2 + " | " + r3;
            p_TC3 = "".equals(r1) && "".equals(r2) && r3 != null;
            if (!p_TC3) e_TC3 = "Kiem tra name == null || name.isEmpty() truoc khi substring";`
          ),
        ].join('')
      );

    // 17. PE5-Q2: Ladder & SpecLadder
    case 17:
      return wrapGrader(
        17,
        [
          tcBlock(
            'TC1',
            'Ladder & SpecLadder.toString()',
            '"standard, 100 | standard, 100, 50"',
            `            Ladder l = new Ladder("standard", 100);
            SpecLadder sl = new SpecLadder("standard", 100, 50);
            a_TC1 = l.toString() + " | " + sl.toString();
            p_TC1 = "standard, 100".equals(l.toString()) && "standard, 100, 50".equals(sl.toString());
            if (!p_TC1) e_TC1 = "Kiem tra super(type, price) va toString()";`
          ),
          tcBlock(
            'TC2',
            'setData() thay chu cai cuoi trong type bang chu so cuoi cua price',
            '"standar1, 21"',
            `            SpecLadder sl = new SpecLadder("standard", 21, 20);
            sl.setData();
            a_TC2 = sl.getType() + ", " + sl.getPrice();
            p_TC2 = "standar1".equals(sl.getType()) && sl.getPrice() == 21;
            if (!p_TC2) e_TC2 = "Thay chu cai cuoi (isLetter) bang price % 10";`
          ),
          tcBlock(
            'TC3',
            'getValue() >=2 chu so chan (+evenCount) vs <2 (+totalDigits)',
            '"standard2 | standard3"',
            `            SpecLadder s1 = new SpecLadder("standard", 123, 24);
            SpecLadder s2 = new SpecLadder("standard", 12, 135);
            a_TC3 = s1.getValue() + " | " + s2.getValue();
            p_TC3 = "standard2".equals(s1.getValue()) && "standard3".equals(s2.getValue());
            if (!p_TC3) e_TC3 = "weight=24 co 2 chu so chan -> standard2; weight=135 -> standard3";`
          ),
        ].join('')
      );

    // 18. PE5-Q3: MyLadder
    case 18:
      return wrapGrader(
        18,
        [
          tcBlock(
            'TC1',
            'f1(): tong price co nhieu chu hoa hon chu thuong',
            '"20"',
            `            ILadder m = new MyLadder();
            List<Ladder> t = new ArrayList<Ladder>(Arrays.asList(
                new Ladder("AB1", 11), new Ladder("BC1", 9),
                new Ladder("de1", 16), new Ladder("ef2", 14)
            ));
            int sum = m.f1(t);
            a_TC1 = String.valueOf(sum);
            p_TC1 = (sum == 20);
            if (!p_TC1) e_TC1 = "(AB1,11) va (BC1,9) co nhieu chu hoa hon chu thuong -> 20";`
          ),
          tcBlock(
            'TC2',
            'f2(): dat price = 0 cho tat ca type co do dai lon nhat',
            '"[6, 9, 0, 0]"',
            `            ILadder m = new MyLadder();
            List<Ladder> t = new ArrayList<Ladder>(Arrays.asList(
                new Ladder("A1", 6), new Ladder("B1", 9),
                new Ladder("A12", 2), new Ladder("B12", 5)
            ));
            m.f2(t);
            int[] prices = { t.get(0).getPrice(), t.get(1).getPrice(), t.get(2).getPrice(), t.get(3).getPrice() };
            a_TC2 = Arrays.toString(prices);
            p_TC2 = prices[0] == 6 && prices[1] == 9 && prices[2] == 0 && prices[3] == 0;
            if (!p_TC2) e_TC2 = "Tat ca Ladder co length == maxLen phai dat price = 0";`
          ),
          tcBlock(
            'TC3',
            'f3(): xoa tat ca phan tu co nhieu chu cai (isLetter) nhat',
            '"A1234, B1"',
            `            ILadder m = new MyLadder();
            List<Ladder> t = new ArrayList<Ladder>(Arrays.asList(
                new Ladder("AB123", 10), new Ladder("AC1", 11),
                new Ladder("A1234", 12), new Ladder("B1", 13)
            ));
            m.f3(t);
            a_TC3 = (t.size() == 2) ? (t.get(0).getType() + ", " + t.get(1).getType()) : "size=" + t.size();
            p_TC3 = t.size() == 2 && "A1234".equals(t.get(0).getType()) && "B1".equals(t.get(1).getType());
            if (!p_TC3) e_TC3 = "AB123 va AC1 deu co 2 chu cai (max) nen phai bi xoa";`
          ),
        ].join('')
      );

    // 19. PE5-Q4: MyString
    case 19:
      return wrapGrader(
        19,
        [
          tcBlock(
            'TC1',
            'f1(): dem tu co dung 2 chu so khac nhau va >= 1 chu thuong',
            '"2"',
            `            IString m = new MyString();
            int cnt = m.f1("A12b B121 c34D 111X");
            a_TC1 = String.valueOf(cnt);
            p_TC1 = (cnt == 2);
            if (!p_TC1) e_TC1 = "A12b va c34D dat; B121 thieu chu thuong; 111X chi co 1 chu so";`
          ),
          tcBlock(
            'TC2',
            'f2(): loc cac tu co so chu cai != so ky tu khong phai chu cai',
            '"xyz"',
            `            IString m = new MyString();
            String out = m.f2("ab12 A#B# xyz");
            a_TC2 = String.valueOf(out);
            p_TC2 = "xyz".equals(out);
            if (!p_TC2) e_TC2 = "ab12 va A#B# co 2 chu cai == 2 non-letters nen bi loai";`
          ),
          tcBlock(
            'TC3',
            'f2() tra "" khi khong co tu thoa man & khong du dau cach',
            '"empty | hello! abc"',
            `            IString m = new MyString();
            String none = m.f2("ab12 cd34");
            String some = m.f2("  hello!   ab12   abc ");
            a_TC3 = (none.isEmpty() ? "empty" : none) + " | " + some;
            p_TC3 = "".equals(none) && "hello! abc".equals(some);
            if (!p_TC3) e_TC3 = "Khong duoc de dau cach thua o dau/cuoi chuoi tra ve";`
          ),
        ].join('')
      );

    default:
      return null;
  }
}

function buildRunner(peId: number): PeHarnessSpec | null {
  switch (peId) {
    case 1:
      return wrapRunner(
        1,
        `        Crocus c = new Crocus("crocus3", 2);
        System.out.println("[PE1-Q1 Crocus] getName() => " + c.getName());
        c.setWeight(10);
        System.out.println("[PE1-Q1 Crocus] setWeight(10) => " + c.getWeight());`
      );
    case 2:
      return wrapRunner(
        2,
        `        SpecDaisy sd = new SpecDaisy("daisy", 2, "yellow");
        System.out.println("[PE1-Q2 SpecDaisy] toString() => " + sd);
        SpecDaisy sd2 = new SpecDaisy("DaIsy", 2, "yellow");
        sd2.setData();
        System.out.println("[PE1-Q2 SpecDaisy] setData() => " + sd2.getName());
        System.out.println("[PE1-Q2 SpecDaisy] getValue(Yellow) => " + new SpecDaisy("Daisy123", 2, "Yellow").getValue());`
      );
    case 3:
      return wrapRunner(
        3,
        `        IDaisy m = new MyDaisy();
        List<Daisy> t1 = new ArrayList<Daisy>(Arrays.asList(new Daisy("Ab1", 6), new Daisy("CD2", 9), new Daisy("gH2", 14)));
        System.out.println("[PE1-Q3 MyDaisy] f1 => " + m.f1(t1));
        List<Daisy> t2 = new ArrayList<Daisy>(Arrays.asList(new Daisy("A11", 5), new Daisy("b12", 9), new Daisy("f67", 2)));
        m.f2(t2);
        System.out.println("[PE1-Q3 MyDaisy] f2 => " + t2);`
      );
    case 4:
      return wrapRunner(
        4,
        `        IString m = new MyString();
        System.out.println("[PE1-Q4 MyString] f1 => " + m.f1("abc12def A12B C123 abc123 xyz"));
        System.out.println("[PE1-Q4 MyString] f2 => " + m.f2("ab12 xyz A1B2 hello3"));`
      );
    case 5:
      return wrapRunner(
        5,
        `        Camel c = new Camel("alan", 5);
        System.out.println("[PE2-Q1 Camel] getDesert() => " + c.getDesert());
        c.setStep(15);
        System.out.println("[PE2-Q1 Camel] getStep() => " + c.getStep());`
      );
    case 6:
      return wrapRunner(
        6,
        `        SpecCala sc = new SpecCala(4, "alan", 3);
        System.out.println("[PE2-Q2 SpecCala] toString() => " + sc);
        sc.setData();
        System.out.println("[PE2-Q2 SpecCala] setData() => " + sc.getOwner());
        System.out.println("[PE2-Q2 SpecCala] getValue() => " + sc.getValue());`
      );
    case 7:
      return wrapRunner(
        7,
        `        TicketList tl = new TicketList();
        tl.addTicket(new Ticket("V001", "VIP", 150.0));
        tl.addTicket(new Ticket("S005", "STUDENT", 45.0));
        tl.addTicket(new Ticket("N006", "Normal", 100.0));
        System.out.println("[PE2-Q3 TicketList] cheapest => " + tl.getCheapestTicket());
        System.out.println("[PE2-Q3 TicketList] count(Normal) => " + tl.countTicketsByType("Normal"));`
      );
    case 8:
      return wrapRunner(
        8,
        `        CoffeeShop cs = new CoffeeShop(2, "passio Coffee", 4.0, 150);
        System.out.println("[PE3-Q1 CoffeeShop] getStoreName() => " + cs.getStoreName());
        System.out.println("[PE3-Q1 CoffeeShop] toString() => " + cs);`
      );
    case 9:
      return wrapRunner(
        9,
        `        OLEDScreen s = new OLEDScreen(6.5, 750, 120);
        System.out.println("[PE3-Q2 OLEDScreen] price => " + s.calculatePrice());
        System.out.println("[PE3-Q2 OLEDScreen] burnIn => " + s.estimateBurnInRisk());
        System.out.println("[PE3-Q2 OLEDScreen] toString() => " + s);`
      );
    case 10:
      return wrapRunner(
        10,
        `        EmployeeList el = new EmployeeList();
        el.add(new Employee("E001", "John Smith", "IT", 75000.0));
        el.add(new Employee("E003", "Michael Brown", "Sales", 70000.0));
        System.out.println("[PE3-Q3 EmployeeList] find(E003) => " + el.getEmployeeById("E003"));
        System.out.println("[PE3-Q3 EmployeeList] count(>=70000) => " + el.countEmployeesBySalary(70000.0));`
      );
    case 11:
      return wrapRunner(
        11,
        `        IStringNumberTool t = new MyStringNumberTool();
        System.out.println("[PE3-Q4] acronym('123 data structure') => " + t.buildAcronym("123 data structure"));
        System.out.println("[PE3-Q4] binary(10) => " + t.decimalToBinary(10));`
      );
    case 12:
      return wrapRunner(
        12,
        `        Person p = new Person("ly hung", 5.5);
        p.setName("anh");
        System.out.println("[PE4-Q1 Person] toString() => " + p);`
      );
    case 13:
      return wrapRunner(
        13,
        `        SpecChair c = new SpecChair("wooden", 16, "normal");
        System.out.println("[PE4-Q2 SpecChair] getType() => " + c.getType());
        c.setType();
        System.out.println("[PE4-Q2 SpecChair] setType() => " + c);`
      );
    case 14:
      return wrapRunner(
        14,
        `        IShoes ms = new MyShoes();
        List<Shoes> list = new ArrayList<Shoes>(Arrays.asList(new Shoes("sandal", 20), new Shoes("tre em", 50)));
        System.out.println("[PE4-Q3 MyShoes] max => " + ms.f1(list));
        ms.f3(list);
        System.out.println("[PE4-Q3 MyShoes] after f3 => " + list);`
      );
    case 15:
      return wrapRunner(
        15,
        `        ILink ml = new MyLink();
        System.out.println("[PE4-Q4 MyLink] f1 => " + ml.f1("https://fap.fpt.edu.vn"));
        System.out.println("[PE4-Q4 MyLink] f2 => " + ml.f2("https://fap.fpt.edu.vn"));`
      );
    case 16:
      return wrapRunner(
        16,
        `        Coral c = new Coral("vietnam", 10);
        System.out.println("[PE5-Q1 Coral] getName() => " + c.getName());
        c.setPrice(12);
        System.out.println("[PE5-Q1 Coral] getPrice() => " + c.getPrice());`
      );
    case 17:
      return wrapRunner(
        17,
        `        SpecLadder sl = new SpecLadder("standard", 21, 24);
        System.out.println("[PE5-Q2 SpecLadder] getValue() => " + sl.getValue());
        sl.setData();
        System.out.println("[PE5-Q2 SpecLadder] after setData => " + sl.getType() + ", " + sl.getPrice());`
      );
    case 18:
      return wrapRunner(
        18,
        `        ILadder ml = new MyLadder();
        List<Ladder> list = new ArrayList<Ladder>(Arrays.asList(new Ladder("AB1", 11), new Ladder("BC1", 9), new Ladder("de1", 16)));
        System.out.println("[PE5-Q3 MyLadder] f1 => " + ml.f1(list));`
      );
    case 19:
      return wrapRunner(
        19,
        `        IString m = new MyString();
        System.out.println("[PE5-Q4 MyString] f1 => " + m.f1("A12b B121 c34D 111X"));
        System.out.println("[PE5-Q4 MyString] f2 => " + m.f2("ab12 A#B# xyz"));`
      );
    default:
      return null;
  }
}

export function buildPeHarness(peId: number, mode: 'run' | 'grade'): PeHarnessSpec | null {
  return mode === 'run' ? buildRunner(peId) : buildGrader(peId);
}
