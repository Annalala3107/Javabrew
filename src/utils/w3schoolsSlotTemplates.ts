import type { PlaygroundTemplate } from './javaPlayground';

export const W3SCHOOLS_SLOT_TEMPLATES: PlaygroundTemplate[] = [
  {
    id: 'slot-01-lab',
    title: 'Slot 01 Lab: Thong tin JVM & Print Card',
    subtitle: 'W3Schools Intro/Output - System.getProperty() & println vs print',
    category: 'Cơ bản',
    slotRef: 'Slot 01',
    stdin: '',
    files: [
      {
        id: 'slot01-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        String name = "Nguyen Van An";
        String roll = "SE180001";
        System.out.println("=== JAVA PLATFORM CARD ===");
        System.out.print("Sinh vien: " + name);
        System.out.println(" (" + roll + ")");
        System.out.println("Java Version : " + System.getProperty("java.version"));
        System.out.println("JVM Vendor   : " + System.getProperty("java.vendor"));
        System.out.println("OS Platform  : " + System.getProperty("os.name"));
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-02-lab',
    title: 'Slot 02 Lab: Output Numbers & Concatenation',
    subtitle: 'W3Schools Syntax/Output - Phân biệt phép cộng số học và nối chuỗi',
    category: 'Cơ bản',
    slotRef: 'Slot 02',
    stdin: '',
    files: [
      {
        id: 'slot02-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        System.out.println(3 + 3);
        System.out.println(2 * 5 + 4);
        // Luu y dau ngoac () de tranh phep noi chuoi tu trai sang phai
        System.out.println("Sai neu quen ngoac: " + 3 + 3);
        System.out.println("Dung khi co ngoac : " + (3 + 3));
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-03-lab',
    title: 'Slot 03 Lab: CLI Args & Multi-Class 1 File',
    subtitle: 'W3Schools Syntax - Đối số dòng lệnh args[] & lớp phụ trong cùng tệp',
    category: 'Cơ bản',
    slotRef: 'Slot 03',
    stdin: '',
    files: [
      {
        id: 'slot03-main',
        name: 'Main.java',
        content: `class ConsolePrinter {
    void printBanner(String title) {
        System.out.println("[" + title.toUpperCase() + "]");
    }
}

public class Main {
    public static void main(String[] args) {
        ConsolePrinter printer = new ConsolePrinter();
        printer.printBanner("PRO192 CLI Structure");
        System.out.println("So doi so dong lenh args.length = " + args.length);
        if (args.length == 0) {
            System.out.println("Khong co args tu CLI -> dung gia tri mac dinh.");
        } else {
            for (int i = 0; i < args.length; i++) {
                System.out.println("args[" + i + "] = " + args[i]);
            }
        }
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-04-lab',
    title: 'Slot 04 Lab: Casting, Division & Array Sum/Min',
    subtitle: 'W3Schools Data Types/Casting/Arrays - Tránh chia nguyên & duyệt mảng',
    category: 'Cơ bản',
    slotRef: 'Slot 04',
    stdin: '',
    files: [
      {
        id: 'slot04-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 2;
        System.out.println("Chia nguyen (5 / 2)   = " + (a / b));
        System.out.println("Ep kieu (double) 5/2 = " + ((double) a / b));

        int[] scores = { 8, 5, 10, 7, 9 };
        int sum = 0;
        int min = scores[0];
        for (int i = 0; i < scores.length; i++) {
            sum += scores[i];
            if (scores[i] < min) {
                min = scores[i];
            }
        }
        double avg = (double) sum / scores.length;
        System.out.printf("Sum = %d, Min = %d, Avg = %.2f%n", sum, min, avg);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-05-lab',
    title: 'Slot 05 Lab: Switch Grade & Prime Loop',
    subtitle: 'W3Schools Switch/For/Continue - Xếp loại GPA, nguyên tố & bẫy for-each',
    category: 'Cơ bản',
    slotRef: 'Slot 05',
    stdin: '',
    files: [
      {
        id: 'slot05-main',
        name: 'Main.java',
        content: `public class Main {
    static boolean isPrime(int n) {
        if (n < 2) {
            return false;
        }
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) {
                return false;
            }
        }
        return true;
    }

    static String rankLetter(char grade) {
        switch (grade) {
            case 'A':
                return "Excellent";
            case 'B':
                return "Good";
            case 'C':
                return "Pass";
            default:
                return "Retake";
        }
    }

    public static void main(String[] args) {
        System.out.println("Grade B -> " + rankLetter('B'));
        System.out.print("Primes <= 20: ");
        for (int i = 2; i <= 20; i++) {
            if (i > 2 && i % 2 == 0) {
                continue;
            }
            if (isPrime(i)) {
                System.out.print(i + " ");
            }
        }
        System.out.println();

        int[] arr = { 1, 2, 3 };
        for (int x : arr) {
            x += 10; // Khong thay doi mang goc!
        }
        System.out.println("Sau for-each arr[0] van la: " + arr[0]);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-06-lab',
    title: 'Slot 06 Lab: Stack vs Heap & Recursion',
    subtitle: 'W3Schools Methods/Recursion - Truyền tham trị vs tham chiếu & đệ quy',
    category: 'Cơ bản',
    slotRef: 'Slot 06',
    stdin: '',
    files: [
      {
        id: 'slot06-main',
        name: 'Main.java',
        content: `public class Main {
    static void swapPrimitives(int x, int y) {
        int tmp = x;
        x = y;
        y = tmp;
    }

    static void doubleFirst(int[] arr) {
        if (arr != null && arr.length > 0) {
            arr[0] *= 2;
        }
    }

    static long factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        swapPrimitives(a, b);
        System.out.println("Sau swapPrimitives: a=" + a + ", b=" + b);

        int[] heapArr = { 5, 9 };
        doubleFirst(heapArr);
        System.out.println("Sau doubleFirst: heapArr[0]=" + heapArr[0]);
        System.out.println("5! = " + factorial(5));
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-07-lab',
    title: 'Slot 07 Lab: Reference Aliasing & Null Guard',
    subtitle: 'W3Schools Objects - Hai biến cùng trỏ Heap & tránh NullPointerException',
    category: 'Cơ bản',
    slotRef: 'Slot 07',
    stdin: '',
    files: [
      {
        id: 'slot07-main',
        name: 'Main.java',
        content: `class MemoryBox {
    int value;
    MemoryBox(int value) {
        this.value = value;
    }
}

public class Main {
    public static void main(String[] args) {
        MemoryBox b1 = new MemoryBox(100);
        MemoryBox b2 = b1; // Cung tro 1 doi tuong tren Heap
        b2.value = 250;
        System.out.println("b1.value = " + b1.value);

        b1 = null; // Doi tuong chua thanh rac vi b2 van tro toi
        System.out.println("b2 van song: " + b2.value);

        MemoryBox[] slots = { new MemoryBox(10), null, new MemoryBox(30) };
        int sum = 0;
        for (MemoryBox box : slots) {
            if (box != null) {
                sum += box.value;
            }
        }
        System.out.println("Tong gia tri khac null = " + sum);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-08-lab',
    title: 'Slot 08 Lab: Integer Cache, Character & Math',
    subtitle: 'W3Schools Wrapper/Math - Bẫy == Integer(200) & Character API',
    category: 'Cơ bản',
    slotRef: 'Slot 08',
    stdin: '',
    files: [
      {
        id: 'slot08-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        Integer a = 127;
        Integer b = 127;
        Integer x = 200;
        Integer y = 200;
        System.out.println("127 == 127        : " + (a == b));
        System.out.println("200 == 200        : " + (x == y));
        System.out.println("200.equals(200)   : " + x.equals(y));

        String sample = "PRO192_Java8!";
        int letters = 0;
        int digits = 0;
        for (int i = 0; i < sample.length(); i++) {
            char c = sample.charAt(i);
            if (Character.isLetter(c)) {
                letters++;
            } else if (Character.isDigit(c)) {
                digits++;
            }
        }
        System.out.println("Letters=" + letters + ", Digits=" + digits);
        System.out.println("round(sqrt(50)) = " + Math.round(Math.sqrt(50)));
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-09-lab',
    title: 'Slot 09 Lab: Scanner Buffer, Count Words & Reverse',
    subtitle: 'W3Schools User Input & How To - Xả nextLine(), đếm từ & Palindrome',
    category: 'Cơ bản',
    slotRef: 'Slot 09',
    stdin: '20\n  Nguyen   Van   An  \n',
    files: [
      {
        id: 'slot09-main',
        name: 'Main.java',
        content: `import java.util.Scanner;

public class Main {
    static int countWords(String s) {
        if (s == null) {
            return 0;
        }
        String trimmed = s.trim();
        if (trimmed.isEmpty()) {
            return 0;
        }
        return trimmed.split("\\\\s+").length;
    }

    static String reverseText(String s) {
        if (s == null) {
            return "";
        }
        return new StringBuilder(s).reverse().toString();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int age = sc.hasNextInt() ? sc.nextInt() : 20;
        if (sc.hasNextLine()) {
            sc.nextLine(); // Xa troi ky tu xuong dong con sot trong buffer!
        }
        String fullName = sc.hasNextLine() ? sc.nextLine() : "Nguyen Van An";
        String normalized = fullName.trim().replaceAll("\\\\s+", " ");

        System.out.println("Sinh vien: " + normalized + " (" + age + " tuoi)");
        System.out.println("So tu    : " + countWords(fullName));
        System.out.println("Dao nguoc: " + reverseText("PRO192"));
        sc.close();
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-10-lab',
    title: 'Slot 10 Lab: BankAccount (State & Behavior)',
    subtitle: 'W3Schools OOP/Classes - Tạo lớp & quản lý trạng thái số dư độc lập',
    category: 'OOP',
    slotRef: 'Slot 10',
    stdin: '',
    files: [
      {
        id: 'slot10-main',
        name: 'Main.java',
        content: `class BankAccount {
    String owner;
    double balance;

    BankAccount(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }

    void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    boolean withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            return true;
        }
        return false;
    }
}

public class Main {
    public static void main(String[] args) {
        BankAccount acc1 = new BankAccount("An", 500.0);
        BankAccount acc2 = new BankAccount("Binh", 200.0);
        acc1.deposit(150.0);
        boolean ok = acc2.withdraw(300.0);
        System.out.printf("%s balance = %.2f%n", acc1.owner, acc1.balance);
        System.out.printf("%s withdraw 300 ok? %s (balance=%.2f)%n", acc2.owner, ok, acc2.balance);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-11-lab',
    title: 'Slot 11 Lab: UML -> Class & Method Overloading',
    subtitle: 'W3Schools Class Methods/Overloading - Đọc UML & nạp chồng area()',
    category: 'OOP',
    slotRef: 'Slot 11',
    stdin: '',
    files: [
      {
        id: 'slot11-main',
        name: 'Main.java',
        content: `class AreaHelper {
    static double area(double side) {
        return side * side;
    }

    static double area(double width, double height) {
        return width * height;
    }

    static double area(double radius, boolean isCircle) {
        return isCircle ? Math.PI * radius * radius : 0.0;
    }
}

class StudentCard {
    private String id;
    private double gpa;

    StudentCard(String id, double gpa) {
        this.id = id;
        this.gpa = gpa;
    }

    public boolean isHonors() {
        return gpa >= 8.0;
    }

    public String summary() {
        return id + " -> GPA=" + gpa + ", honors=" + isHonors();
    }
}

public class Main {
    public static void main(String[] args) {
        StudentCard s = new StudentCard("SE1801", 8.5);
        System.out.println(s.summary());
        System.out.printf("Square(4)=%.2f, Rect(3,5)=%.2f, Circle(2)=%.2f%n",
                AreaHelper.area(4), AreaHelper.area(3, 5), AreaHelper.area(2, true));
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-12-lab',
    title: 'Slot 12 Lab: Constructors & Chaining this(...)',
    subtitle: 'W3Schools Constructors - Giữ constructor rỗng & gọi chéo this(...)',
    category: 'OOP',
    slotRef: 'Slot 12',
    stdin: '',
    files: [
      {
        id: 'slot12-main',
        name: 'Main.java',
        content: `class Product {
    private String code;
    private double price;

    public Product() {
        this("DEFAULT", 0.0);
    }

    public Product(String code, double price) {
        this.code = code;
        this.price = price;
    }

    @Override
    public String toString() {
        return String.format("%s - %.2f", code, price);
    }
}

public class Main {
    public static void main(String[] args) {
        Product p1 = new Product();
        Product p2 = new Product("LATTE01", 45.5);
        System.out.println("p1: " + p1);
        System.out.println("p2: " + p2);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-13-lab',
    title: 'Slot 13 Lab: Encapsulation & Validation Setter',
    subtitle: 'W3Schools Encapsulation - private fields, clamp >= 0 & format getter',
    category: 'OOP',
    slotRef: 'Slot 13',
    stdin: '',
    files: [
      {
        id: 'slot13-main',
        name: 'Main.java',
        content: `class MemberProfile {
    private String name;
    private int score;

    public MemberProfile(String name, int score) {
        this.name = name;
        setScore(score);
    }

    public String getName() {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        String t = name.trim();
        return Character.toUpperCase(t.charAt(0)) + t.substring(1).toLowerCase();
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = (score < 0) ? 0 : score;
    }
}

public class Main {
    public static void main(String[] args) {
        MemberProfile m = new MemberProfile("  passio COFFEE ", -25);
        System.out.println("Name : " + m.getName());
        System.out.println("Score: " + m.getScore());
        m.setScore(90);
        System.out.println("Updated Score: " + m.getScore());
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-14-lab',
    title: 'Slot 14 Lab: Inheritance is-a & Composition has-a',
    subtitle: 'W3Schools Inheritance - Đa file Person.java + Main.java chuẩn OOP',
    category: 'OOP',
    slotRef: 'Slot 14',
    stdin: '',
    files: [
      {
        id: 'slot14-main',
        name: 'Main.java',
        content: `class Address {
    String city;
    Address(String city) {
        this.city = city;
    }
}

class Employee extends Person {
    private double salary;
    private Address address;

    public Employee(String name, double salary, Address address) {
        super(name);
        this.salary = salary;
        this.address = address;
    }

    public String info() {
        return getName() + " | salary=" + salary + " | city=" + address.city;
    }
}

public class Main {
    public static void main(String[] args) {
        Employee e = new Employee("Minh", 1200.0, new Address("Ha Noi"));
        System.out.println(e.info());
    }
}
`,
      },
      {
        id: 'slot14-person',
        name: 'Person.java',
        content: `public class Person {
    private String name;

    public Person() {
    }

    public Person(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-15-lab',
    title: 'Slot 15 Lab: Constructor Chaining & super(...)',
    subtitle: 'W3Schools Inheritance/super - Thứ tự khởi tạo 3 tầng & SpecBook',
    category: 'OOP',
    slotRef: 'Slot 15',
    stdin: '',
    files: [
      {
        id: 'slot15-main',
        name: 'Main.java',
        content: `class SpecBook extends Book {
    private String tag;

    public SpecBook(String title, double price, String tag) {
        super(title, price); // Bat buoc o dong dau tien!
        this.tag = tag;
        System.out.println("[3] Init SpecBook tag=" + tag);
    }

    @Override
    public String toString() {
        return getTitle() + ", " + tag + ", " + getPrice();
    }
}

public class Main {
    public static void main(String[] args) {
        SpecBook b = new SpecBook("Clean Java", 18.5, "PE-Q2");
        System.out.println("Result -> " + b);
    }
}
`,
      },
      {
        id: 'slot15-book',
        name: 'Book.java',
        content: `public class Book {
    private String title;
    private double price;

    public Book(String title, double price) {
        this.title = title;
        this.price = price;
        System.out.println("[2] Init Book title=" + title);
    }

    public String getTitle() {
        return title;
    }

    public double getPrice() {
        return price;
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-16-lab',
    title: 'Slot 16 Lab: @Override toString vs Static Hiding',
    subtitle: 'W3Schools Polymorphism - Phân biệt Overriding động & Static Hiding',
    category: 'OOP',
    slotRef: 'Slot 16',
    stdin: '',
    files: [
      {
        id: 'slot16-main',
        name: 'Main.java',
        content: `class Husky extends Animal {
    private String coat;

    public Husky(String name, String coat) {
        super(name);
        this.coat = coat;
    }

    public static void kind() {
        System.out.println("Static Husky.kind()");
    }

    @Override
    public void speak() {
        System.out.println("Husky " + getName() + " says Woof!");
    }

    @Override
    public String toString() {
        return super.toString() + ", " + coat;
    }
}

public class Main {
    public static void main(String[] args) {
        Animal ref = new Husky("Milo", "White-Gray");
        ref.speak();        // Da hinh dong -> Husky.speak()
        Animal.kind();      // Static hiding -> Animal.kind()
        Husky.kind();       // Static hiding -> Husky.kind()
        System.out.println("toString(): " + ref);
    }
}
`,
      },
      {
        id: 'slot16-animal',
        name: 'Animal.java',
        content: `public class Animal {
    private String name;

    public Animal(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public static void kind() {
        System.out.println("Static Animal.kind()");
    }

    public void speak() {
        System.out.println("Animal sound");
    }

    @Override
    public String toString() {
        return name;
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-17-lab',
    title: 'Slot 17 Lab: instanceof & Array of Objects CRUD',
    subtitle: 'W3Schools Type Casting/Arrays - Downcasting an toàn & Item[MAX]',
    category: 'OOP',
    slotRef: 'Slot 17',
    stdin: '',
    files: [
      {
        id: 'slot17-main',
        name: 'Main.java',
        content: `class Item {
    String id;
    Item(String id) { this.id = id; }
}

class SpecialItem extends Item {
    int bonus;
    SpecialItem(String id, int bonus) {
        super(id);
        this.bonus = bonus;
    }
}

class ItemList {
    private final Item[] list;
    private int count = 0;

    ItemList(int max) {
        this.list = new Item[max];
    }

    boolean add(Item item) {
        if (item == null || count >= list.length) {
            return false;
        }
        list[count++] = item;
        return true;
    }

    boolean removeAt(int idx) {
        if (idx < 0 || idx >= count) {
            return false;
        }
        for (int i = idx; i < count - 1; i++) {
            list[i] = list[i + 1];
        }
        list[--count] = null;
        return true;
    }

    void inspectAll() {
        for (int i = 0; i < count; i++) {
            Item cur = list[i];
            if (cur instanceof SpecialItem) {
                SpecialItem sp = (SpecialItem) cur;
                System.out.println("Special: " + sp.id + " bonus=" + sp.bonus);
            } else {
                System.out.println("Normal : " + cur.id);
            }
        }
    }
}

public class Main {
    public static void main(String[] args) {
        ItemList box = new ItemList(3);
        box.add(new Item("I01"));
        box.add(new SpecialItem("S02", 50));
        box.add(new Item("I03"));
        box.removeAt(0);
        box.inspectAll();
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-18-lab',
    title: 'Slot 18 Lab: Polymorphic Array & Field Trap',
    subtitle: 'W3Schools Polymorphism - Mảng Shape[] & bẫy field không đa hình',
    category: 'OOP',
    slotRef: 'Slot 18',
    stdin: '',
    files: [
      {
        id: 'slot18-main',
        name: 'Main.java',
        content: `class Shape {
    String label = "ShapeField";
    double area() { return 0.0; }
}

class Circle extends Shape {
    String label = "CircleField";
    double r;
    Circle(double r) { this.r = r; }
    @Override
    double area() { return Math.PI * r * r; }
}

class Rect extends Shape {
    double w, h;
    Rect(double w, double h) { this.w = w; this.h = h; }
    @Override
    double area() { return w * h; }
}

public class Main {
    public static void main(String[] args) {
        Shape[] shapes = { new Circle(3.0), new Rect(4.0, 5.0) };
        double total = 0;
        for (Shape s : shapes) {
            total += s.area();
            System.out.printf("%s -> area=%.2f%n", s.getClass().getSimpleName(), s.area());
        }
        System.out.printf("Total area = %.2f%n", total);
        System.out.println("Field theo kieu tinh Shape: " + shapes[0].label);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-19-lab',
    title: 'Slot 19 Lab: Abstract Class Payment Template',
    subtitle: 'W3Schools Abstraction - abstract method & template printReceipt()',
    category: 'OOP',
    slotRef: 'Slot 19',
    stdin: '',
    files: [
      {
        id: 'slot19-main',
        name: 'Main.java',
        content: `class CardPayment extends Payment {
    public CardPayment(double amount) {
        super(amount);
    }

    @Override
    public double calculateFee() {
        return getAmount() * 0.02;
    }
}

class CashPayment extends Payment {
    public CashPayment(double amount) {
        super(amount);
    }

    @Override
    public double calculateFee() {
        return 0.0;
    }
}

public class Main {
    public static void main(String[] args) {
        Payment p1 = new CardPayment(500.0);
        Payment p2 = new CashPayment(500.0);
        p1.printReceipt();
        p2.printReceipt();
    }
}
`,
      },
      {
        id: 'slot19-payment',
        name: 'Payment.java',
        content: `public abstract class Payment {
    private double amount;

    public Payment(double amount) {
        this.amount = amount;
    }

    public double getAmount() {
        return amount;
    }

    public abstract double calculateFee();

    public void printReceipt() {
        double fee = calculateFee();
        System.out.printf("%s: amount=%.2f, fee=%.2f, total=%.2f%n",
                getClass().getSimpleName(), amount, fee, amount + fee);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-20-lab',
    title: 'Slot 20 Lab: Interface IString & MyString',
    subtitle: 'W3Schools Interface - Mô phỏng đúng cấu trúc Q4 PE (IString + MyString)',
    category: 'OOP',
    slotRef: 'Slot 20',
    stdin: '',
    files: [
      {
        id: 'slot20-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        IString tool = new MyString();
        String input = "   Java8   PRO192   test20   pure  ";
        System.out.println("f1 (words with digit): " + tool.f1(input));
        System.out.println("f2 (normalized)      : [" + tool.f2(input) + "]");
    }
}
`,
      },
      {
        id: 'slot20-istring',
        name: 'IString.java',
        content: `public interface IString {
    int f1(String str);
    String f2(String str);
}
`,
      },
      {
        id: 'slot20-mystring',
        name: 'MyString.java',
        content: `public class MyString implements IString {
    @Override
    public int f1(String str) {
        if (str == null || str.trim().isEmpty()) {
            return 0;
        }
        int count = 0;
        for (String w : str.trim().split("\\\\s+")) {
            for (int i = 0; i < w.length(); i++) {
                if (Character.isDigit(w.charAt(i))) {
                    count++;
                    break;
                }
            }
        }
        return count;
    }

    @Override
    public String f2(String str) {
        if (str == null || str.trim().isEmpty()) {
            return "";
        }
        return str.trim().replaceAll("\\\\s+", " ");
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-21-lab',
    title: 'Slot 21 Lab: Anonymous Class & Comparator (JDK 8)',
    subtitle: 'W3Schools Inner/Anonymous Class - Comparator đa tiêu chí không dùng Lambda',
    category: 'OOP',
    slotRef: 'Slot 21',
    stdin: '',
    files: [
      {
        id: 'slot21-main',
        name: 'Main.java',
        content: `import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

interface Greeting {
    String say(String name);
}

class StudentRow {
    String name;
    double gpa;
    StudentRow(String name, double gpa) {
        this.name = name;
        this.gpa = gpa;
    }
    @Override
    public String toString() {
        return name + "(" + gpa + ")";
    }
}

public class Main {
    public static void main(String[] args) {
        final String prefix = "Xin chao, ";
        Greeting g = new Greeting() {
            @Override
            public String say(String name) {
                return prefix + name + "!";
            }
        };
        System.out.println(g.say("PRO192"));

        List<StudentRow> list = new ArrayList<StudentRow>();
        list.add(new StudentRow("Linh", 8.5));
        list.add(new StudentRow("An", 8.5));
        list.add(new StudentRow("Binh", 9.0));

        Collections.sort(list, new Comparator<StudentRow>() {
            @Override
            public int compare(StudentRow a, StudentRow b) {
                int cmp = Double.compare(b.gpa, a.gpa);
                return (cmp != 0) ? cmp : a.name.compareTo(b.name);
            }
        });
        System.out.println("Sorted: " + list);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-22-lab',
    title: 'Slot 22 Lab: Bắt RuntimeException An toàn',
    subtitle: 'W3Schools Exceptions - Arithmetic, IndexOutOfBounds & NumberFormat',
    category: 'Exception & File I/O',
    slotRef: 'Slot 22',
    stdin: '',
    files: [
      {
        id: 'slot22-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        String[] tokens = { "10", "abc", "25", null, "5" };
        int sum = 0;
        for (int i = 0; i <= tokens.length; i++) {
            try {
                String t = tokens[i];
                if (t == null) {
                    throw new NullPointerException("Phan tu null tai index " + i);
                }
                sum += Integer.parseInt(t);
            } catch (ArrayIndexOutOfBoundsException e) {
                System.out.println("Chan vuot bien mang tai i=" + i);
            } catch (NumberFormatException e) {
                System.out.println("Bo qua chuoi khong phai so: " + tokens[i]);
            } catch (NullPointerException e) {
                System.out.println("Bo qua null: " + e.getMessage());
            }
        }
        System.out.println("Tong cac so hop le = " + sum);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-23-lab',
    title: 'Slot 23 Lab: Thứ tự catch & Luồng finally',
    subtitle: 'W3Schools Try/Catch/Finally - Catch con trước cha & dấu vết finally',
    category: 'Exception & File I/O',
    slotRef: 'Slot 23',
    stdin: '',
    files: [
      {
        id: 'slot23-main',
        name: 'Main.java',
        content: `public class Main {
    static int divideWithTrace(int a, int b) {
        try {
            int result = a / b;
            System.out.println("try: ket qua tam = " + result);
            return result;
        } catch (ArithmeticException e) {
            System.out.println("catch (cu the): loi chia cho 0");
            return -1;
        } catch (Exception e) {
            System.out.println("catch (tong quat): " + e.getMessage());
            return -2;
        } finally {
            System.out.println("finally: LUON chay truoc khi roi ham!");
        }
    }

    public static void main(String[] args) {
        System.out.println("Run 1 return = " + divideWithTrace(10, 2));
        System.out.println("Run 2 return = " + divideWithTrace(10, 0));
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-24-lab',
    title: 'Slot 24 Lab: Custom Exception & Scanner Retry Loop',
    subtitle: 'W3Schools throw/Exceptions - InvalidScoreException + ép nhập chuẩn',
    category: 'Exception & File I/O',
    slotRef: 'Slot 24',
    stdin: 'abc\n12\n8.5\n',
    files: [
      {
        id: 'slot24-main',
        name: 'Main.java',
        content: `import java.util.Scanner;

class InvalidScoreException extends Exception {
    public InvalidScoreException(String message) {
        super(message);
    }
}

public class Main {
    static double parseValidScore(String raw) throws InvalidScoreException {
        double score;
        try {
            score = Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            throw new InvalidScoreException("Khong phai so hop le: " + raw);
        }
        if (score < 0.0 || score > 10.0) {
            throw new InvalidScoreException("Diem ngoai khoang [0..10]: " + score);
        }
        return score;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double accepted = -1;
        while (sc.hasNextLine()) {
            String line = sc.nextLine();
            try {
                accepted = parseValidScore(line);
                System.out.println("Nhan diem hop le: " + accepted);
                break;
            } catch (InvalidScoreException e) {
                System.out.println("Nhap lai (" + e.getMessage() + ")");
            }
        }
        sc.close();
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-25-lab',
    title: 'Slot 25 Lab: ArrayList & Iterator.remove()',
    subtitle: 'W3Schools ArrayList/Iterator - Xóa an toàn tránh ConcurrentModification',
    category: 'Collections',
    slotRef: 'Slot 25',
    stdin: '',
    files: [
      {
        id: 'slot25-main',
        name: 'Main.java',
        content: `import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<Integer>();
        nums.add(10);
        nums.add(15);
        nums.add(21);
        nums.add(30);
        nums.add(33);

        Iterator<Integer> it = nums.iterator();
        while (it.hasNext()) {
            Integer val = it.next();
            if (val % 2 != 0) {
                it.remove(); // Khong bao gio dung nums.remove(val) trong for-each!
            }
        }
        System.out.println("Sau khi xoa so le bang Iterator: " + nums);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-26-lab',
    title: 'Slot 26 Lab: HashSet/TreeSet & HashMap Tần suất',
    subtitle: 'W3Schools HashSet/HashMap - Đếm chữ số khác nhau & từ qua entrySet()',
    category: 'Collections',
    slotRef: 'Slot 26',
    stdin: '',
    files: [
      {
        id: 'slot26-main',
        name: 'Main.java',
        content: `import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        String code = "a1b2c1d9a2";
        Set<Character> distinctDigits = new TreeSet<Character>();
        for (int i = 0; i < code.length(); i++) {
            char c = code.charAt(i);
            if (Character.isDigit(c)) {
                distinctDigits.add(c);
            }
        }
        System.out.println("Distinct digits (sorted): " + distinctDigits
                + " (count=" + distinctDigits.size() + ")");

        String sentence = "java oop java collections java map";
        Map<String, Integer> freq = new HashMap<String, Integer>();
        for (String w : sentence.trim().split("\\\\s+")) {
            Integer old = freq.get(w);
            freq.put(w, old == null ? 1 : old + 1);
        }
        for (Map.Entry<String, Integer> e : freq.entrySet()) {
            System.out.println("  " + e.getKey() + " -> " + e.getValue());
        }
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-27-lab',
    title: 'Slot 27 Lab: Comparable, Comparator & Partial Sort',
    subtitle: 'W3Schools List/Advanced Sorting - Sắp xếp cục bộ giữ nguyên vị trí khác',
    category: 'Collections',
    slotRef: 'Slot 27',
    stdin: '',
    files: [
      {
        id: 'slot27-main',
        name: 'Main.java',
        content: `import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

class BookItem implements Comparable<BookItem> {
    String name;
    int price;

    BookItem(String name, int price) {
        this.name = name;
        this.price = price;
    }

    @Override
    public int compareTo(BookItem other) {
        return Integer.compare(this.price, other.price);
    }

    @Override
    public String toString() {
        return "(" + name + "," + price + ")";
    }
}

public class Main {
    static boolean hasLower(String s) {
        for (int i = 0; i < s.length(); i++) {
            if (Character.isLowerCase(s.charAt(i))) {
                return true;
            }
        }
        return false;
    }

    public static void main(String[] args) {
        List<BookItem> items = new ArrayList<BookItem>();
        items.add(new BookItem("Alpha", 50));
        items.add(new BookItem("JAVA", 99)); // Giu nguyen vi tri index 1
        items.add(new BookItem("Beta", 20));
        items.add(new BookItem("OOP", 88));  // Giu nguyen vi tri index 3
        items.add(new BookItem("Gamma", 35));

        List<Integer> idx = new ArrayList<Integer>();
        List<BookItem> matched = new ArrayList<BookItem>();
        for (int i = 0; i < items.size(); i++) {
            if (hasLower(items.get(i).name)) {
                idx.add(i);
                matched.add(items.get(i));
            }
        }
        Collections.sort(matched, new Comparator<BookItem>() {
            @Override
            public int compare(BookItem a, BookItem b) {
                return Integer.compare(a.price, b.price);
            }
        });
        for (int k = 0; k < idx.size(); k++) {
            items.set(idx.get(k), matched.get(k));
        }
        System.out.println("Partial sort: " + items);
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-28-lab',
    title: 'Slot 28 Lab: java.io.File & Directory Listing',
    subtitle: 'W3Schools Files/Create/Delete - mkdirs(), createNewFile(), listFiles()',
    category: 'Exception & File I/O',
    slotRef: 'Slot 28',
    stdin: '',
    files: [
      {
        id: 'slot28-main',
        name: 'Main.java',
        content: `import java.io.File;

public class Main {
    public static void main(String[] args) throws Exception {
        File dir = new File(System.getProperty("java.io.tmpdir"), "jb_slot28_demo");
        dir.mkdirs();
        File f1 = new File(dir, "notes.txt");
        File f2 = new File(dir, "scores.csv");
        f1.createNewFile();
        f2.createNewFile();

        System.out.println("Dir exists: " + dir.exists() + " | isDir=" + dir.isDirectory());
        File[] children = dir.listFiles();
        if (children != null) {
            for (File child : children) {
                System.out.println("  - " + child.getName() + " (" + child.length() + " bytes)");
            }
        }

        f1.delete();
        f2.delete();
        dir.delete();
        System.out.println("Cleaned up temp files.");
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-29-lab',
    title: 'Slot 29 Lab: BufferedReader/Writer UTF-8 & CSV',
    subtitle: 'W3Schools Read/Write Files - try-with-resources & tách dòng CSV',
    category: 'Exception & File I/O',
    slotRef: 'Slot 29',
    stdin: '',
    files: [
      {
        id: 'slot29-main',
        name: 'Main.java',
        content: `import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;

public class Main {
    public static void main(String[] args) throws Exception {
        File csv = File.createTempFile("jb_slot29_", ".csv");
        try (BufferedWriter bw = new BufferedWriter(
                new OutputStreamWriter(new FileOutputStream(csv), StandardCharsets.UTF_8))) {
            bw.write("SV01,An,8.5");
            bw.newLine();
            bw.write("SV02,Binh,invalid_gpa");
            bw.newLine();
            bw.write("SV03,Chau,9.2");
            bw.newLine();
        }

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(new FileInputStream(csv), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 3) {
                    try {
                        double gpa = Double.parseDouble(parts[2].trim());
                        System.out.printf("Hop le: %s - %s (GPA=%.1f)%n", parts[0], parts[1], gpa);
                    } catch (NumberFormatException e) {
                        System.out.println("Bo qua dong loi so: " + line);
                    }
                }
            }
        } finally {
            csv.delete();
        }
    }
}
`,
      },
    ],
  },
  {
    id: 'slot-30-lab',
    title: 'Slot 30 Lab: Byte Stream Copy & Serializable',
    subtitle: 'FileIO Byte Streams & Serialization - ObjectInputStream + transient',
    category: 'Exception & File I/O',
    slotRef: 'Slot 30',
    stdin: '',
    files: [
      {
        id: 'slot30-main',
        name: 'Main.java',
        content: `import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;

class Account implements Serializable {
    private static final long serialVersionUID = 1L;
    String username;
    transient String password; // Khong duoc tuan tu hoa!

    Account(String username, String password) {
        this.username = username;
        this.password = password;
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        File src = File.createTempFile("jb_src_", ".bin");
        File dst = File.createTempFile("jb_dst_", ".bin");
        File objFile = File.createTempFile("jb_acc_", ".ser");

        try {
            try (FileOutputStream fos = new FileOutputStream(src)) {
                fos.write("Binary PRO192 Byte Copy".getBytes(StandardCharsets.UTF_8));
            }
            byte[] buf = new byte[64];
            try (FileInputStream fis = new FileInputStream(src);
                 FileOutputStream fos = new FileOutputStream(dst)) {
                int len;
                while ((len = fis.read(buf)) != -1) {
                    fos.write(buf, 0, len);
                }
            }
            System.out.println("Copied bytes = " + dst.length());

            try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(objFile))) {
                oos.writeObject(new Account("se180001", "secret123"));
            }
            try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(objFile))) {
                Account loaded = (Account) ois.readObject();
                System.out.println("Loaded user=" + loaded.username
                        + ", transient password=" + loaded.password);
            }
        } finally {
            src.delete();
            dst.delete();
            objFile.delete();
        }
    }
}
`,
      },
    ],
  },
];
