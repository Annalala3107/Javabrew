---
title: Tổng hợp giải pháp lọc từ nhạy cảm (Sensitive Word Filtering)
description: Giải thích chi tiết các giải pháp lọc từ nhạy cảm, theo tiến trình thuật toán từ khớp vét cạn (Brute Force) đến cây Trie và máy trạng thái Aho-Corasick (AC Automaton), bao gồm phân tích độ phức tạp, thực tiễn kỹ thuật và chiến lược tối ưu cho đồng thời cao.
category: Thiết kế hệ thống
tag:
  - Bảo mật
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Lọc từ nhạy cảm,Cây Trie,Thuật toán DFA,AC Automaton,Double-Array Trie,Khớp chuỗi,Thuật toán KMP,An toàn nội dung,Atomic Hot-Swap
lang: vi
sourceRef: zh-ref/system-design/security/sentive-words-filter.md
---

Lọc từ nhạy cảm là khâu cốt lõi trong an toàn nội dung. Dù là mạng xã hội, nền tảng thương mại điện tử, trò chơi trực tuyến hay các ứng dụng AI hiện nay, hệ thống đều cần lọc theo thời gian thực cả nội dung đầu vào lẫn nội dung sinh ra nhằm ngăn chặn sự phát tán của thông tin vi phạm như nội dung khiêu dâm, bạo lực, ngôn từ thù ghét.

Xét dưới góc độ kỹ thuật, lọc từ nhạy cảm về bản chất là **bài toán khớp chuỗi đa mẫu (Multi-Pattern String Matching)**: tìm kiếm đồng thời nhiều từ khóa trong cùng một đoạn văn bản.

Bài viết này dài gần 20.000 ký tự; tôi sẽ trình bày từ tiến trình phát triển thuật toán, đồng thời chia sẻ một số kinh nghiệm thực chiến trên môi trường production như chống từ biến thể (lách luật), tối ưu hóa đồng thời cao và quản lý bộ từ điển.

**Kết luận cốt lõi**:

| Thuật toán                  | Kịch bản áp dụng               | Đặc điểm                                                 |
| --------------------------- | ------------------------------ | -------------------------------------------------------- |
| **Cây Trie**                | Bộ từ quy mô nhỏ (< 10.000 từ) | Cài đặt đơn giản, dễ hiểu                                |
| **AC Automaton**            | Kịch bản thông lượng cao       | Quét một lần duy nhất khớp toàn bộ từ, hiệu năng tối ưu  |
| **Double-Array Trie (DAT)** | Bộ từ quy mô lớn (> 10.000 từ) | Chiếm dụng bộ nhớ thấp, chi phí khởi tạo cao             |

## Tiến trình phát triển thuật toán

Dưới đây, theo trình tự **từ đơn giản đến phức tạp**, chúng ta sẽ lần lượt tìm hiểu các thuật toán lọc từ nhạy cảm để thấy rõ động lực và hiệu quả của từng bước tối ưu.

### Khớp vét cạn (Thuật toán BF)

**Khớp vét cạn (Brute Force)** là giải pháp trực quan nhất: duyệt qua từng vị trí trong văn bản và thử so khớp với từng từ nhạy cảm.

Giả sử bộ từ nhạy cảm có `n` từ, độ dài trung bình là `m`, và văn bản cần kiểm tra có độ dài `L`:

```java
public List<String> bruteForceMatch(String text, List<String> words) {
    List<String> result = new ArrayList<>();
    for (String word : words) {              // O(n): duyệt qua từng từ nhạy cảm
        if (text.contains(word)) {           // O(L × m): khớp chuỗi con ngây thơ
            result.add(word);
        }
    }
    return result;
}
```

**Độ phức tạp thời gian**: O(n × L × m)

| Quy mô      | Số từ nhạy cảm | Độ dài văn bản | Độ dài từ trung bình | Số phép thao tác |
| ----------- | -------------- | -------------- | -------------------- | ---------------- |
| Quy mô nhỏ  | 100            | 1000           | 5                    | 500.000          |
| Quy mô vừa  | 1000           | 5000           | 5                    | 25.000.000       |
| Quy mô lớn  | 10000          | 10000          | 5                    | 500.000.000      |

**Phân tích vấn đề**:

1. **Quét lặp lại**: Mỗi từ nhạy cảm đều phải duyệt qua toàn bộ văn bản, khiến một lượng lớn ký tự bị so sánh lặp đi lặp lại.
2. **Không tái sử dụng trạng thái**: Giữa các từ nhạy cảm không có sự liên kết, không thể tận dụng thông tin đã khớp trước đó.
3. **Khả năng mở rộng kém**: Khi bộ từ tăng lên, hiệu năng giảm tuyến tính.

Khi bộ từ đạt mức hàng chục nghìn từ, độ trễ của khớp vét cạn có thể lên tới hàng giây, hoàn toàn không thể đáp ứng yêu cầu hiệu năng của dịch vụ online.

### Cây Trie: Tận dụng tiền tố để giảm phép so sánh

**Cây Trie** (phát âm là /ˈtraɪ/), còn gọi là cây từ điển hoặc cây tiền tố (prefix tree), sử dụng chiến lược **đánh đổi không gian lấy thời gian** để tối ưu hóa thuật toán vét cạn. Tư tưởng cốt lõi là tận dụng **tiền tố chung** của các chuỗi nhằm giảm chi phí không gian lưu trữ và thời gian truy vấn.

Tính năng gợi ý từ khóa trên thanh tìm kiếm của trình duyệt có thể được xây dựng dựa trên cây Trie:

![Minh họa cây Trie trên trình duyệt](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/brower-trie-2a2c090e.png)

#### Tính chất cơ bản

Cây Trie có 3 tính chất cơ bản sau:

1. **Nút gốc (root) không chứa ký tự nào**; ngoại trừ nút gốc, mỗi nút chỉ chứa đúng một ký tự.
2. **Từ nút gốc đi đến một nút bất kỳ**, các ký tự đi qua trên đường đi nối lại với nhau chính là chuỗi tương ứng với nút đó.
3. **Tất cả các nút con của cùng một nút đều chứa các ký tự khác nhau**.

#### Ví dụ cấu trúc

Giả sử trong bộ từ nhạy cảm có các từ sau:

- `"高清视频"` (video HD)
- `"高清 CV"` (HD CV)
- `"东京冷"` (Tokyo Cold)
- `"东京热"` (Tokyo Hot)

Cấu trúc cây Trie được xây dựng sẽ như sau (các nút màu đỏ biểu thị điểm kết thúc của chuỗi):

![Cây Trie cho từ nhạy cảm](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/sensitive-word-trie-8f71e1f2.png)

Khi tìm kiếm chuỗi `"东京热"`, chuỗi sẽ được tách thành từng ký tự đơn `"东"`, `"京"`, `"热"`, sau đó đối chiếu từng tầng bắt đầu từ nút gốc.

#### So sánh với khớp vét cạn

Giả sử bộ từ gồm `["she", "he", "his", "hers"]`, tìm kiếm trong văn bản `"ushers"`:

| Thuật toán     | Quá trình khớp                                          | Số lần so sánh ký tự |
| -------------- | ------------------------------------------------------- | -------------------- |
| Khớp vét cạn   | Lần lượt dùng 4 từ quét toàn bộ văn bản                 | Khoảng 24 lần¹       |
| Cây Trie       | Bắt đầu từ mỗi vị trí, so khớp dọc theo nhánh của cây   | Khoảng 10 lần        |

> ¹ Đây là con số ước tính đơn giản hóa (số lượng từ × độ dài văn bản); số lần so sánh thực tế trong trường hợp xấu nhất còn phụ thuộc vào độ dài từng từ và vị trí trong văn bản, có thể cao hơn nữa.

Ưu điểm của cây Trie là: **toàn bộ các từ nhạy cảm dùng chung một cây duy nhất**, chỉ cần một lượt duyệt là có thể thử so khớp tất cả các từ.

#### Phân tích độ phức tạp

| Chỉ số               | Cài đặt bằng HashMap | Cài đặt bằng Mảng |
| -------------------- | -------------------- | ----------------- |
| Tiền xử lý           | O(n × m)             | O(n × m × σ)      |
| Thời gian truy vấn   | O(L × m)             | O(L × m)          |
| Độ phức tạp bộ nhớ   | O(n × m)             | O(n × m × σ)      |

> σ là kích thước bảng chữ cái (chữ Hán khoảng 20.000, ASCII chỉ 128). Các ví dụ code trong bài này dùng `HashMap`, phù hợp với tập ký tự lớn như tiếng Trung; cách cài đặt bằng mảng phù hợp với tập ký tự nhỏ (như thuần tiếng Anh).

#### Ví dụ code cây Trie

```java
public class SimpleTrie {
    private static class Node {
        Map<Character, Node> children = new HashMap<>();
        boolean isEnd;
    }

    private final Node root = new Node();

    // Thêm từ nhạy cảm
    public void addWord(String word) {
        Node node = root;
        for (char c : word.toCharArray()) {
            node = node.children.computeIfAbsent(c, k -> new Node());
        }
        node.isEnd = true;
    }

    // Kiểm tra văn bản có chứa từ nhạy cảm hay không
    public boolean contains(String text) {
        for (int i = 0; i < text.length(); i++) {
            Node node = root;
            for (int j = i; j < text.length(); j++) {
                node = node.children.get(text.charAt(j));
                if (node == null) break;
                if (node.isEnd) return true;
            }
        }
        return false;
    }

    // Lấy toàn bộ từ nhạy cảm khớp được trong văn bản
    public List<String> matchAll(String text) {
        List<String> result = new ArrayList<>();
        for (int i = 0; i < text.length(); i++) {
            Node node = root;
            for (int j = i; j < text.length(); j++) {
                node = node.children.get(text.charAt(j));
                if (node == null) break;
                if (node.isEnd) {
                    result.add(text.substring(i, j + 1));
                }
            }
        }
        return result;
    }
}
```

#### Hạn chế của cây Trie

Mặc dù cây Trie cải thiện đáng kể so với khớp vét cạn, nó vẫn tồn tại **vấn đề quay lui (backtracking)**:

Khi tìm kiếm bộ từ `["she", "he", "his"]` trong văn bản `"ushers"`:

1. Bắt đầu từ vị trí 1, khớp `"s" → "h" → "e"`, tìm thấy `"she"`.
2. Sau khi khớp xong, **quay lui về vị trí 2**, khớp lại `"h" → "e"`, tìm thấy `"he"`.

Chiến lược "khi thất bại hoặc khớp xong phải lùi về vị trí tiếp theo để bắt đầu lại" này trong trường hợp xấu nhất (ví dụ văn bản `"aaaaaaaa"` khớp từ `"aaaaab"`) vẫn suy biến về O(L × m).

Có cách nào để **hoàn toàn không phải quay lui** hay không? Điều này dẫn tới AC Automaton.

**Lưu ý**: `PatriciaTrie` do [Apache Commons Collections](https://mvnrepository.com/artifact/org.apache.commons/commons-collections4) cung cấp là cây Trie nhị phân nén dựa trên **thao tác bit** (PATRICIA = Practical Algorithm To Retrieve Information Coded In Alphanumeric), khác về nguyên lý so với **Trie cấp ký tự** được mô tả trong bài viết này, nên không phù hợp để dùng trực tiếp cho bài toán lọc từ nhạy cảm tiếng Trung.

### AC Automaton: Quét một lần khớp toàn bộ từ

**AC Automaton (Aho-Corasick Automaton)** là thuật toán khớp đa mẫu được xây dựng trên nền cây Trie, do Alfred V. Aho và Margaret J. Corasick tại Bell Labs đề xuất năm 1975.

Tư tưởng cốt lõi của nó kế thừa trực tiếp từ thuật toán KMP: **tận dụng thông tin đã khớp để khi gặp ký tự không khớp (mismatch), nhảy thẳng tới vị trí trạng thái phù hợp và tiếp tục đối chiếu, tránh quay lui**. Điểm khác biệt là KMP xử lý chuỗi đơn mẫu, còn AC Automaton xử lý đa mẫu.

#### Thành phần cốt lõi

Quá trình vận hành của AC Automaton dựa trên ba hàm cốt lõi:

| Hàm                  | Vai trò                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| **Hàm goto**         | Chuyển trạng thái: từ trạng thái hiện tại, khi đọc vào một ký tự sẽ chuyển sang trạng thái nào        |
| **Hàm failure**      | Nhảy khi thất bại: khi không khớp sẽ nhảy tới trạng thái có "hậu tố trùng dài nhất" để tránh quay lui |
| **Hàm output**       | Xuất kết quả khớp: lưu tập các từ khớp tương ứng với mỗi trạng thái                                   |

#### Các bước xây dựng

Quá trình xây dựng AC Automaton gồm ba bước:

![Quy trình xây dựng và đối chiếu của AC Automaton](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/sensitive-word-ac-automaton-flow-8921f53f.png)

**Bước 1: Xây dựng cây Trie**

Chèn toàn bộ các chuỗi mẫu vào cây Trie để tạo bộ khung cơ bản cho máy trạng thái. Đánh dấu kết thúc ở nút cuối của mỗi chuỗi mẫu.

**Bước 2: Xây dựng con trỏ `fail` (Cốt lõi)**

Con trỏ `fail` là cơ chế cốt lõi của AC Automaton. Vai trò của nó là: **khi ký tự hiện tại không thể khớp tiếp, ta sẽ nhảy tới trạng thái nào để thử tiếp thay vì quay lại điểm xuất phát**.

Quá trình xây dựng sử dụng BFS (tìm kiếm theo chiều rộng) duyệt từng tầng. Với nút hiện tại `temp`:

1. Tìm nút `fail` của nút cha của `temp`.
2. Tìm trong các nút con của nút `fail` đó xem có nút nào mang ký tự giống với `temp` hay không.
3. Nếu tồn tại, cho `temp.fail` trỏ tới nút con đó.
4. Nếu không tồn tại, tiếp tục lần theo nút `fail` của nút `fail`, cho tới khi tìm thấy hoặc đi tới `root`.

**Bản chất của con trỏ `fail`**: Trỏ tới trạng thái ứng với **hậu tố dài nhất** của chuỗi tương ứng với trạng thái hiện tại.

::: tip Mối liên hệ với KMP
Con trỏ `fail` chính là sự tổng quát hóa mảng `next` trong thuật toán KMP lên cấu trúc cây Trie. Ví dụ: hậu tố `"he"` của `"she"` trùng với tiền tố của `"he"`, do đó con trỏ `fail` của ký tự `'e'` ở cuối `"she"` sẽ trỏ tới ký tự `'e'` trong `"he"`.
:::

**Bước 3: Đối chiếu mẫu (Pattern Matching)**

Quét từ đầu chuỗi văn bản, con trỏ `p` ban đầu trỏ tại `root`:

1. **Chuyển trạng thái**: Nếu ký tự hiện tại nằm trong các nút con của `p`, đưa `p` đi xuống nút con đó; ngược lại, đi ngược theo chuỗi `fail` cho tới khi khớp được hoặc quay về `root`.
2. **Thu thập kết quả (output)**: [Quan trọng] Sau mỗi lần chuyển trạng thái, **phải duyệt một lượt theo chuỗi `fail`** để thu thập toàn bộ các từ khớp tại những trạng thái kết thúc.

Vì sao phải duyệt theo chuỗi `fail`? Bởi vì hậu tố của một từ dài có thể lại là một từ ngắn khác. Chẳng hạn khi khớp thành công `"she"`, đi theo chuỗi `fail` sẽ tìm thêm được `"he"`, nếu không sẽ bỏ sót các từ lồng nhau.

#### Ví dụ code AC Automaton

```java
public class AhoCorasickAutomaton {
    private static class Node {
        Map<Character, Node> children = new HashMap<>();
        Node fail;                    // Con trỏ thất bại (fail pointer)
        List<String> outputs = new ArrayList<>(); // Danh sách từ khớp tại trạng thái này
    }

    private final Node root = new Node();

    // Bước 1: Xây dựng cây Trie
    public void addWord(String word) {
        Node node = root;
        for (char c : word.toCharArray()) {
            node = node.children.computeIfAbsent(c, k -> new Node());
        }
        node.outputs.add(word); // Nút cuối ghi nhận từ khớp
    }

    // Bước 2: Xây dựng con trỏ fail (BFS)
    public void buildFailPointer() {
        Queue<Node> queue = new LinkedList<>();
        root.fail = root;

        // Các nút con trực tiếp của root có fail trỏ về root
        for (Node child : root.children.values()) {
            child.fail = root;
            queue.offer(child);
        }

        while (!queue.isEmpty()) {
            Node current = queue.poll();
            for (Map.Entry<Character, Node> entry : current.children.entrySet()) {
                char c = entry.getKey();
                Node child = entry.getValue();

                // Lần theo chuỗi fail của nút cha để tìm nhánh chuyển với ký tự c
                Node fail = current.fail;
                while (fail != root && !fail.children.containsKey(c)) {
                    fail = fail.fail;
                }
                child.fail = fail.children.getOrDefault(c, root);
                // Tránh tự trỏ vòng: nếu fail trỏ vào chính mình thì sửa thành trỏ về root
                if (child.fail == child) {
                    child.fail = root;
                }
                // Hợp nhất output của nút fail (điểm mấu chốt!)
                child.outputs.addAll(child.fail.outputs);
                queue.offer(child);
            }
        }
    }

    // Bước 3: Đối chiếu mẫu (quét một lần duy nhất)
    public List<String> match(String text) {
        List<String> result = new ArrayList<>();
        Node state = root;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            // Đi theo chuỗi fail để tìm trạng thái có thể xử lý ký tự c
            while (state != root && !state.children.containsKey(c)) {
                state = state.fail;
            }
            state = state.children.getOrDefault(c, root);
            // Thu thập toàn bộ từ khớp ở trạng thái hiện tại (đã hợp nhất qua chuỗi fail)
            result.addAll(state.outputs);
        }
        return result;
    }
}
```

Ví dụ sử dụng:

```java
AhoCorasickAutomaton ac = new AhoCorasickAutomaton();
ac.addWord("she");
ac.addWord("he");
ac.addWord("her");
ac.addWord("hers");
ac.buildFailPointer(); // Sau khi chèn xong toàn bộ từ, xây dựng con trỏ fail một lần

List<String> matches = ac.match("ushers");
// Kết quả: [she, he, her, hers]
```

#### So sánh hiệu năng

| Thuật toán   | Tiền xử lý | Thời gian đối chiếu | Đặc điểm                                                                 |
| ------------ | ---------- | ------------------- | ------------------------------------------------------------------------ |
| Khớp vét cạn | O(1)       | O(L × n × m)        | Quét riêng lẻ cho từng từ                                                |
| Cây Trie     | O(n × m)   | O(L × m)            | Có thể phải quay lui                                                     |
| AC Automaton | O(n × m)¹  | O(L + z)            | Quét một lần; z là tổng số lần khớp trúng (bao gồm cả khớp chồng chéo)²  |

> 1. O(n × m) khi dùng `HashMap` để lưu nút con; nếu dùng mảng (cần cấp phát trước theo kích thước bảng chữ cái σ) thì là O(n × m × σ).
> 2. Trong kịch bản cực đoan, nếu bộ từ chứa hàng loạt từ lồng nhau dày đặc (như `"a"`, `"ab"`, `"abc"`, ..., `"abc...z"`), z có thể lớn hơn nhiều so với L và thời gian chạy sẽ bị chi phối bởi z. Trong thực tế kỹ thuật, bộ từ nhạy cảm thường không xuất hiện kiểu lồng nhau cực đoan như vậy.

AC Automaton đạt được **khớp chuỗi trong thời gian tuyến tính**, không phụ thuộc vào số lượng từ nhạy cảm mà chỉ phụ thuộc vào độ dài văn bản và số lượng kết quả khớp.

Khi kết hợp AC Automaton với DAT ([AhoCorasickDoubleArrayTrie](https://github.com/hankcs/AhoCorasickDoubleArrayTrie)), ta có thể cân bằng đồng thời hiệu suất đối chiếu và mức chiếm dụng bộ nhớ.

### Double-Array Trie (DAT): Nén mức chiếm dụng bộ nhớ

Cây Trie chuẩn tiêu tốn khá nhiều bộ nhớ (mỗi nút cần một `Map`), vì vậy trong thực tế kỹ thuật người ta thường dùng phiên bản cải tiến — **Double-Array Trie (DAT)**.

DAT được Aoe Jun-ichi và cộng sự tại Nhật Bản đề xuất trong bài báo năm 1989 [An Efficient Implementation of Trie Structures](https://www.co-ding.com/assets/pdf/dat.pdf). Thuật toán nén cấu trúc cây Trie thông qua hai mảng số nguyên (`base[]` và `check[]`):

| Đặc tính           | Trie chuẩn (cài đặt mảng) | Double-Array Trie                              |
| ------------------ | ------------------------- | ---------------------------------------------- |
| Độ phức tạp bộ nhớ | O(n × m × σ)              | O(n × m)                                       |
| Chiếm dụng bộ nhớ  | Lớn                       | Thường giảm xuống còn 20%–30% so với bản mảng |
| Độ phức tạp cài đặt| Đơn giản                  | Khá phức tạp (cần xử lý xung đột)              |

**Lưu ý**: Hiệu quả nén của DAT phụ thuộc chặt chẽ vào tỷ lệ tiền tố chung trong bộ từ. Trong trường hợp cực đoan (không có tiền tố chung), hiệu quả nén sẽ hạn chế.

Triển khai tham khảo: <https://github.com/komiya-atsushi/darts-java>

### Cài đặt DFA: Đóng gói theo hướng kỹ thuật

**DFA (Deterministic Finite Automaton — Máy hữu hạn trạng thái tất định)** là khái niệm trong lý thuyết otomát. Dưới góc độ triển khai, một lượt khớp bắt đầu từ nút gốc trên cây Trie bản chất đã là một lần chạy DFA — mỗi nút đại diện cho một trạng thái, mỗi cạnh đại diện cho một phép chuyển trạng thái theo ký tự. Tuy nhiên, khớp Trie thông thường phải khởi động lại DFA từ mỗi vị trí của văn bản, còn AC Automaton thông qua con trỏ `fail` đã bổ sung đầy đủ mọi phép chuyển trạng thái, qua đó trở thành **DFA đa mẫu quét một lần** thực thụ.

[Hutool 5.8.x](https://hutool.cn/docs/#/dfa/%E6%A6%82%E8%BF%B0) cung cấp sẵn bộ lọc từ nhạy cảm dựa trên DFA (nền tảng bên dưới là cây Trie):

![Thuật toán DFA của Hutool](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/hutool-dfa-3208b9f3.png)

```java
WordTree wordTree = new WordTree();
wordTree.addWord("大");
wordTree.addWord("大憨憨");
wordTree.addWord("憨憨");

String text = "那人真是个大憨憨！";

// Lấy từ khóa khớp đầu tiên
String matchStr = wordTree.match(text);
System.out.println(matchStr); // Kết quả: 大

// matchAll(text, limit, isDensityMatch, isGreedy)
// - limit: giới hạn số lượng khớp, -1 nghĩa là không giới hạn
// - isDensityMatch: có khớp theo mật độ hay không (tiếp tục tìm từ chồng lấn bên trong từ đã khớp)
// - isGreedy: có khớp tham lam hay không (true khớp từ khóa dài nhất, false khớp từ khóa ngắn nhất)
List<String> matchStrList = wordTree.matchAll(text, -1, false, false);
System.out.println(matchStrList); // Kết quả: [大, 憨憨]

List<String> matchStrList2 = wordTree.matchAll(text, -1, false, true);
System.out.println(matchStrList2); // Kết quả: [大, 大憨憨]
```

**Giải thích kết quả**:

- `matchAll(text, -1, false, false)`: Không tham lam + không khớp mật độ

  - Bắt đầu từ vị trí 0, `"大"` khớp thành công (khớp ngắn nhất).
  - Sau khi bỏ qua ký tự đã khớp, `"憨憨"` khớp thành công từ vị trí 2.
  - Kết quả: `[大, 憨憨]`

- `matchAll(text, -1, false, true)`: Tham lam + không khớp mật độ
  - Bắt đầu từ vị trí 0, `"大憨憨"` khớp thành công (khớp dài nhất).
  - Đồng thời `"大"` cũng khớp thành công (với vai trò tiền tố).
  - Kết quả: `[大, 大憨憨]`

## Chống từ biến thể (lách bộ lọc)

Trong thực tế, người dùng thường lách bộ lọc từ nhạy cảm bằng các cách sau:

| Kiểu biến thể           | Ví dụ                              | Chiến lược ứng phó                        |
| ----------------------- | ---------------------------------- | ----------------------------------------- |
| Từ đồng âm              | `"赌博"` (cờ bạc) → `"读博"` (học tiến sĩ) | Duy trì từ điển từ đồng âm                |
| Chèn ký tự đặc biệt     | `"fuck"` → `"f\*u\*c\*k"`          | Tiền xử lý loại bỏ các ký tự đặc biệt     |
| Lẫn phồn thể / giản thể | `"台灣"` → `"台湾"`                | Chuyển thống nhất về giản thể trước khi khớp |
| Ký tự toàn giác (full-width) | `"abc"` → `"ａｂｃ"`           | Chuyển toàn giác (full-width) sang bán giác (half-width) |

**Làm sạch tiền xử lý (Pre-cleaning)** là chiến lược phổ biến để đối phó với từ biến thể: chuẩn hóa bản sao văn bản dùng để kiểm tra trước khi chạy thuật toán khớp. Đoạn code dưới đây bao phủ các trường hợp cơ bản như ký tự tương đương tương thích, chữ hoa/thường, Unicode Code Point và ký tự điều khiển định dạng, nhưng vẫn chỉ mang tính minh họa; hệ thống production cần căn cứ theo ngôn ngữ hỗ trợ, mức độ chấp nhận báo động nhầm (false positive) và mẫu đối kháng thực tế để bổ sung quy tắc liên tục.

```java
import java.text.Normalizer;
import java.util.Locale;

public String preprocess(String text) {
    // NFKC thống nhất các ký tự tương đương tương thích như toàn giác/bán giác. Chỉ xử lý bản sao kiểm tra, không ghi đè văn bản gốc của người dùng.
    String normalized = Normalizer.normalize(text, Normalizer.Form.NFKC)
            .toLowerCase(Locale.ROOT);
    StringBuilder sb = new StringBuilder();
    normalized.codePoints()
            // Loại bỏ các ký tự điều khiển định dạng như ký tự nối không độ rộng (ZWJ) để ngăn chèn ký tự vô hình nhằm qua mặt bộ lọc.
            .filter(codePoint -> Character.getType(codePoint) != Character.FORMAT)
            .filter(this::isChineseOrAlphanumeric)
            .forEach(sb::appendCodePoint);
    return toSimplifiedChinese(sb.toString()); // Chuyển phồn thể sang giản thể
}

private boolean isChineseOrAlphanumeric(int codePoint) {
    return Character.isLetterOrDigit(codePoint)
            || Character.UnicodeScript.of(codePoint) == Character.UnicodeScript.HAN;
}
```

Các thư viện hoàn chỉnh như [ToolGood.Words](https://github.com/toolgood/ToolGood.Words) đã tích hợp sẵn chuyển đổi phồn thể/giản thể, toàn giác/bán giác..., có thể sử dụng trực tiếp.

::: warning Lưu ý

- **Ánh xạ vị trí**: Phương thức `preprocess` sẽ xóa các ký tự đặc biệt, khiến vị trí ký tự trong văn bản sau khi làm sạch không còn khớp 1-1 với văn bản gốc. Nếu nghiệp vụ cần trả về vị trí chính xác của từ nhạy cảm trong văn bản gốc (như tô sáng hoặc thay thế cục bộ), cần duy trì một bảng ánh xạ từ vị trí sau làm sạch về vị trí trong văn bản gốc.
- **Giới hạn chuẩn hóa**: NFKC sẽ triệt tiêu một số khác biệt ký tự tương thích có mang ngữ nghĩa nghiệp vụ, vì vậy chỉ nên áp dụng trên bản sao kiểm tra và giữ nguyên bản gốc cho việc hiển thị và kiểm toán (audit). Việc xóa ký tự cũng có thể ghép hai phần vốn tách rời thành một từ mới, cần đánh giá tỷ lệ báo động nhầm trên tập ngữ liệu thực tế.
- **Ký tự đồng hình khác mã (Confusables)**: Unicode confusables có thể hỗ trợ phát hiện các ký tự giống nhau về mặt thị giác giữa các hệ chữ viết, nhưng không thích hợp dùng trực tiếp làm "kết quả chuẩn hóa" cho văn bản tổng quát. Các trường hợp trúng mức độ rủi ro cao nên kết hợp mô hình ngữ cảnh hoặc duyệt thủ công, không nên chỉ dựa vào thay thế ký tự để đưa ra phán quyết cuối cùng.
:::

## Tối ưu hóa đồng thời cao

### Atomic Hot-Swap: Hỗ trợ cập nhật nóng bộ từ

Trong môi trường production, bộ từ nhạy cảm cần được cập nhật thường xuyên nhưng không được làm gián đoạn các request kiểm tra đang chạy. Thực hiện Atomic Hot-Swap (thay nóng nguyên tử) thông qua `AtomicReference`: trước tiên xây dựng cây Trie mới ở luồng nền, sau khi hoàn tất thì thay thế nguyên tử (atomic) cho instance cũ, đảm bảo các thread đọc không bị ảnh hưởng.

```java
public class SensitiveWordFilter {
    private final AtomicReference<SimpleTrie> trieRef;

    public SensitiveWordFilter(List<String> initialWords) {
        this.trieRef = new AtomicReference<>(buildTrie(initialWords));
    }

    // Lấy cây Trie hiện tại khi đối chiếu
    public List<String> match(String text) {
        SimpleTrie trie = trieRef.get();
        return trie != null ? trie.matchAll(text) : Collections.emptyList();
    }

    // Cập nhật bộ từ: dựng Trie mới trước, sau đó công bố nguyên tử
    public void refreshWords(List<String> newWords) {
        SimpleTrie newTrie = buildTrie(newWords);
        trieRef.set(newTrie);  // Công bố nguyên tử, hiển thị ngay lập tức cho các thread đọc
    }

    private SimpleTrie buildTrie(List<String> words) {
        SimpleTrie trie = new SimpleTrie();
        for (String word : words) {
            trie.addWord(word);
        }
        return trie;
    }
}
```

**Điểm mấu chốt**:

- Dùng `AtomicReference` đảm bảo thao tác chuyển đổi mang tính nguyên tử (atomic).
- Cây Trie cũ có thể vẫn còn thread đang dùng, dựa vào cơ chế Garbage Collection (GC) để thu hồi tự động.
- Có thể xây dựng cây Trie mới bất đồng bộ ở nền mà không ảnh hưởng tới thời gian phản hồi của dịch vụ.

### Xử lý song song: Chia đoạn văn bản siêu dài

Đối với văn bản siêu dài (như bài viết, bình luận dài), có thể chia nhỏ thành nhiều đoạn rồi xử lý song song.

**Lưu ý**: Khi chia đoạn bắt buộc phải thêm vùng chồng lấn (overlap), nếu không sẽ bỏ sót các từ nhạy cảm nằm vắt qua ranh giới giữa hai đoạn.

```java
// Dùng Thread Pool riêng, tránh chiếm dụng ForkJoinPool.commonPool()
private final ExecutorService filterExecutor =
    new ThreadPoolExecutor(
        4, 8, 60L, TimeUnit.SECONDS,
        LinkedBlockingQueue<>(1000),
        new ThreadPoolExecutor.CallerRunsPolicy() // Khi hàng đợi đầy, chạy trên caller thread để tạo backpressure
    );

public List<String> parallelMatch(String text, int chunkSize, int maxWordLength) {
    // Vùng chồng lấn = độ dài từ nhạy cảm lớn nhất - 1, tránh sót từ ở ranh giới
    int overlap = maxWordLength - 1;
    List<CompletableFuture<List<String>>> futures = new ArrayList<>();

    for (int i = 0; i < text.length(); i += chunkSize) {
        int start = i;
        int end = Math.min(i + chunkSize + overlap, text.length());
        String chunk = text.substring(start, end);

        // Truyền tường minh Thread Pool tùy chỉnh
        futures.add(CompletableFuture.supplyAsync(() ->
            trieRef.get().matchAll(chunk), filterExecutor
        ));
    }

    return futures.stream()
        .flatMap(f -> f.join().stream())
        .distinct()
        .collect(Collectors.toList());
}
```

**Vì sao cần có vùng chồng lấn?**

Giả sử từ nhạy cảm `"赌博网站"` (trang web cờ bạc) có độ dài là 4, kích thước phân mảnh `chunkSize` là 100. Nếu văn bản có từ này bắt đầu đúng ở vị trí 99, nó sẽ bị cắt đôi sang hai chunk:

- chunk1: `...văn bản kết thúc tại vị trí 99赌`
- chunk2: `博网站 tiếp tục...`

Cả hai chunk đều không thể khớp được đầy đủ `"赌博网站"`, dẫn tới bỏ lọt (false negative). Vùng chồng lấn đảm bảo mỗi từ nhạy cảm đều xuất hiện trọn vẹn trong ít nhất một chunk.

### Loại trừ nhanh: Bloom Filter

Sử dụng **Bloom Filter** để sàng lọc bước đầu giúp loại trừ nhanh các văn bản không chứa từ nhạy cảm.

**Điều kiện tiên quyết để áp dụng**: Giải pháp này chỉ mang lại lợi ích khi đại đa số văn bản không chứa từ nhạy cảm và tỷ lệ dương tính giả (false positive) của Bloom Filter cực kỳ thấp. Vì bản thân hàm `quickCheck` có độ phức tạp O(L × maxWordLen), cùng bậc với khớp trên cây Trie, nên nếu văn bản thường xuyên trúng Bloom Filter (dương tính giả) thì ngược lại sẽ làm phát sinh thêm chi phí thừa.

**Lưu ý**: Bloom Filter kiểm tra quan hệ thành viên tập hợp của từng phần tử đơn lẻ, do đó cần kiểm tra trên các chuỗi con của văn bản chứ không phải toàn bộ chuỗi văn bản.

```java
public List<String> matchWithBloomFilter(String text, int maxWordLength) {
    // Kiểm tra nhanh: quét toàn bộ các chuỗi con có thể
    if (!quickCheck(text, maxWordLength)) {
        return Collections.emptyList();  // Chắc chắn không chứa từ nhạy cảm
    }
    // Có khả năng chứa từ nhạy cảm, tiến hành đối chiếu chính xác
    return trieRef.get().matchAll(text);
}

private boolean quickCheck(String text, int maxWordLen) {
    BloomFilter<String> filter = getBloomFilter();  // Bloom Filter chứa toàn bộ từ nhạy cảm
    for (int i = 0; i < text.length(); i++) {
        for (int len = 1; len <= maxWordLen && i + len <= text.length(); len++) {
            if (filter.mightContain(text.substring(i, i + len))) {
                return true;  // Có thể chứa, cần đối chiếu chính xác
            }
        }
    }
    return false;  // Chắc chắn không chứa
}
```

**Kịch bản áp dụng**: Khi tỷ lệ xuất hiện từ nhạy cảm thấp, Bloom Filter có thể nhanh chóng loại trừ lượng lớn văn bản sạch và giảm số lần đối chiếu qua Trie. Tuy nhiên bản thân việc quét Bloom Filter cũng tiêu tốn chi phí O(L × maxWordLen), nên cần đánh giá dựa trên đặc trưng dữ liệu thực tế trước khi bật.

## Dự án mã nguồn mở

| Dự án                                                                              | Ngôn ngữ             | JDK tối thiểu | Đặc điểm                                                                                        | Kịch bản áp dụng                    |
| ---------------------------------------------------------------------------------- | -------------------- | ------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------- |
| [ToolGood.Words](https://github.com/toolgood/ToolGood.Words)                       | C#/Java/Python/Go/JS | Java 8+       | Hỗ trợ đa ngôn ngữ, tích hợp chuyển phồn/giản thể, toàn/bán giác, Pinyin; bản C# đạt >300 triệu ký tự/giây | Dự án đa ngôn ngữ                   |
| [Hutool DFA](https://hutool.cn/docs/#/dfa/%E6%A6%82%E8%BF%B0)                      | Java                 | Java 8+       | Nhẹ, API ngắn gọn, cài đặt dựa trên cây Trie                                                    | Bộ từ quy mô nhỏ và vừa             |
| [AhoCorasickDoubleArrayTrie](https://github.com/hankcs/AhoCorasickDoubleArrayTrie) | Java                 | Java 7+       | AC Automaton + Double-Array Trie, hiệu năng vượt trội                                           | Bộ từ quy mô lớn, thông lượng cao   |

## Khuyến nghị cho môi trường Production

### Quản lý bộ từ

- **Cập nhật định kỳ**: Bộ từ nhạy cảm cần được bảo trì liên tục, hỗ trợ tải nóng (hot reload) để tránh phải khởi động lại dịch vụ.
- **Quản lý phân cấp**: Chia theo kịch bản nghiệp vụ thành mức độ nhạy cảm Cao / Trung bình / Thấp để áp dụng chiến lược xử lý khác nhau (chặn trực tiếp, chuyển duyệt thủ công, ghi log).
- **Cơ chế danh sách trắng (Whitelist)**: Duy trì whitelist để tránh chặn nhầm. Ví dụ điển hình như từ nhạy cảm `"XXX"` khớp nhầm từ bình thường `"XXY"` (khớp nhầm chuỗi con), hoặc `"公安"` (công an) khớp nhầm cụm `"办公安排"` (sắp xếp công việc văn phòng — chứa chuỗi `"公安"` vắt qua hai từ). Các chiến lược đối phó phổ biến gồm loại trừ cụm từ trong whitelist, yêu cầu độ dài khớp tối thiểu (ví dụ chỉ khớp từ trọn vẹn thay vì chuỗi con), đánh giá theo cửa sổ ngữ cảnh...
- **Ghi log đối chiếu**: Lưu lại kết quả khớp để phục vụ tối ưu bộ từ và phân tích báo động nhầm.

### Xử lý ngoại lệ

- **Lỗi nạp bộ từ**: Khi xây dựng Trie mới thất bại (như `OOM`, hỏng file), cần giữ nguyên cây Trie cũ không đổi, ghi log lỗi và phát cảnh báo.
- **Xử lý bộ từ rỗng**: Khi bộ từ rỗng cần ghi log mức `WARN`, tuyệt đối không âm thầm cho qua toàn bộ văn bản.
- **Quá thời gian đối chiếu (Timeout)**: Với kịch bản văn bản siêu dài + bộ từ lớn có thể thiết lập ngắt mạch theo timeout. Nội dung rủi ro cao khi bị timeout cần từ chối, cách ly hoặc chuyển duyệt thủ công, không được mặc định cho qua; chỉ những kịch bản rủi ro thấp rõ ràng và đã được nghiệp vụ phê duyệt mới có thể áp dụng `fail-open`, đồng thời phải giới hạn độ dài đầu vào, ghi nhận metrics và cảnh báo kịp thời.

### Chỉ số giám sát (Monitoring Metrics)

| Chỉ số                     | Ngưỡng khuyến nghị   | Mô tả                                                              |
| -------------------------- | -------------------- | ------------------------------------------------------------------ |
| Độ trễ đối chiếu (p99)     | < 10ms               | Thời gian xử lý cho một lần lọc                                    |
| Tỷ lệ báo động nhầm        | < 1%                 | Nội dung bình thường bị nhận nhầm là từ nhạy cảm                   |
| Tỷ lệ bỏ lọt               | Giám sát liên tục    | Nội dung nhạy cảm không được phát hiện                             |
| Tỷ lệ trúng bộ từ          | Phân tích theo nhu cầu | Tần suất kích hoạt của từng từ nhạy cảm để tinh chỉnh bộ từ       |

### Khuyến nghị kiến trúc

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/sensitive-word-filter-arch-fc6046a9.png)

## Tài liệu tham khảo

### Bài báo học thuật

- Unicode Standard Annex #15 - Unicode Normalization Forms: <https://www.unicode.org/reports/tr15/>
- Unicode Technical Standard #39 - Unicode Security Mechanisms: <https://www.unicode.org/reports/tr39/>
- Aho, A.V. and Corasick, M.J. (1975). "[Efficient string matching: An aid to bibliographic search](https://dl.acm.org/doi/10.1145/360825.360855)." _Communications of the ACM_, 18(6), 333-340. (Bài báo gốc về AC Automaton)
- Aoe, J., Morimoto, K., and Sato, T. (1989). "[An Efficient Implementation of Trie Structures](https://www.co-ding.com/assets/pdf/dat.pdf)." _Software: Practice and Experience_.

### Bằng sáng chế liên quan

- [Hệ thống tự động lọc và quản lý từ nhạy cảm](https://patents.google.com/patent/CN101964000B)
- [Phương pháp và hệ thống lọc từ nhạy cảm trong trò chơi trực tuyến](https://patents.google.com/patent/CN103714160A/zh)
