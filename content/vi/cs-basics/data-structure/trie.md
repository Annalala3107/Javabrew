---
title: "Tổng hợp câu hỏi phỏng vấn Cây tiền tố Trie: Nguyên lý cây từ điển, Khớp tiền tố và Cài đặt Java"
description: Tổng hợp câu hỏi phỏng vấn về cây tiền tố Trie (Prefix Tree / Cây từ điển), giải thích cấu trúc node, chèn, tra cứu, khớp tiền tố, độ phức tạp, gợi ý tìm kiếm, lọc từ nhạy cảm và các bài LeetCode tần suất cao.
category: Kiến thức cơ sở máy tính
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Trie,cây tiền tố,cây từ điển,prefix tree,khớp tiền tố,thuật toán chuỗi ký tự,gợi ý tìm kiếm,lọc từ nhạy cảm,Java Trie,LeetCode Trie,câu hỏi phỏng vấn cấu trúc dữ liệu
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/trie.md
---

# Tổng hợp câu hỏi phỏng vấn Cây tiền tố Trie: Nguyên lý cây từ điển, Khớp tiền tố và Cài đặt Java

Trie (đọc là "try"), còn gọi là cây tiền tố (Prefix Tree) hay cây từ điển, là cấu trúc dữ liệu chuyên dùng để xử lý các bài toán khớp tiền tố trên tập hợp chuỗi ký tự khổng lồ. Gợi ý tìm kiếm (autocomplete), tra cứu từ điển, lọc từ nhạy cảm, khớp tiền tố định tuyến mạng đều có sự hiện diện của cấu trúc này.

Ý tưởng cốt lõi của Trie rất trực quan: chia nhỏ chuỗi theo từng ký tự và chia sẻ chung các tiền tố giống nhau. Ví dụ: `app`, `apple`, `apply` sẽ dùng chung nhánh đường đi `a -> p -> p`.

Tổng quan nội dung bài viết:

1. Trie là gì?
2. Tại sao Trie lại vượt trội trong việc khớp tiền tố?
3. Thiết kế node trong Trie như thế nào?
4. Cách viết các hàm chèn, tra cứu từ hoàn chỉnh và tra cứu tiền tố trong Trie?
5. Nên chọn Trie hay Bảng băm (Hash Table)?

![Sơ đồ minh họa cấu trúc cây Trie tổ chức tập hợp chuỗi ký tự theo đường đi ký tự](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/trie-4a6afdfb.png)

## Trie là gì?

Trie là một cấu trúc dữ liệu dạng cây chuyên biệt dành cho tập hợp các chuỗi ký tự. Khác với cây tìm kiếm nhị phân (BST), các node trong Trie không tổ chức theo quan hệ "lớn hơn hay nhỏ hơn", mà tổ chức theo **đường đi ký tự**.

Bạn có thể hình dung qua các quy tắc sau:

- Node gốc (root) không đại diện cho bất kỳ ký tự nào, nó đóng vai trò là điểm bắt đầu (cửa ngõ) cho mọi chuỗi.
- Bắt đầu từ node gốc, mỗi khi đi xuống một tầng là khớp với một ký tự trong chuỗi.
- Tập hợp các ký tự đi qua từ node gốc đến một node bất kỳ tạo thành một tiền tố (prefix).
- Nếu một node được đánh dấu là điểm kết thúc từ (`isWord = true`), điều đó chứng tỏ chuỗi hình thành từ gốc đến node đó tạo nên một từ hoàn chỉnh hợp lệ.

Lấy ví dụ: sau khi chèn `app`, `apple`, `apply`, chúng sẽ dùng chung đoạn đường đi `a -> p -> p`. Node tương ứng với chữ cái `p` cuối cùng của `app` cần được đánh dấu là kết thúc từ; nếu không, Trie sẽ chỉ biết rằng `app` là tiền tố của các từ khác chứ không thể xác định bản thân nó cũng là một từ độc lập hoàn chỉnh.

Đó chính là lý do biến cờ `isWord` bắt buộc phải tồn tại. Không có nó, bạn sẽ không thể phân biệt được "đường đi này chỉ là một đoạn tiền tố" hay "đường đi này đã cấu thành một từ độc lập".

## Tại sao Trie lại vượt trội trong việc khớp tiền tố?

Bảng băm (Hash Table) rất giỏi trong việc xác định xem một chuỗi hoàn chỉnh có tồn tại hay không, ví dụ kiểm tra xem `apple` có trong tập hợp hay không ($O(L)$ với $L$ là độ dài chuỗi). Nhưng nếu bài toán đổi thành "tìm tất cả các từ bắt đầu bằng `app`", bảng băm sẽ trở nên lúng túng: trừ khi bạn chủ động duy trì thêm chỉ mục tiền tố phụ trợ, nếu không bạn buộc phải quét qua toàn bộ các key trong bảng băm.

Ưu thế của Trie nằm ở chỗ tiền tố tự nhiên tương ứng với một đường đi duy nhất trên cây. Khi tra cứu tiền tố `app`, bạn chỉ cần xuất phát từ node gốc và lần lượt đi qua `a`, `p`, `p`:

- Nếu giữa đường đi mà nhánh ký tự kế tiếp không tồn tại, kết luận ngay là không có từ nào có tiền tố `app`.
- Nếu có thể đi tới node `p` cuối cùng, toàn bộ các từ nằm trong cây con bên dưới node này đều bắt đầu bằng tiền tố `app`.

Vì vậy, độ phức tạp khi tra cứu tiền tố trong Trie chỉ phụ thuộc vào độ dài của tiền tố cần tìm, chứ không phụ thuộc trực tiếp vào việc từ điển có bao nhiêu triệu từ. Đặc điểm ưu việt này phát huy tác dụng cực kỳ lớn trong gợi ý tìm kiếm (search suggestion), định tuyến tiền tố dài nhất (longest prefix match) hay các bộ lọc từ điển.

## Trọng tâm kiểm tra phỏng vấn

- Trình bày mạch lạc vì sao Trie vượt trội cho bài toán tra cứu tiền tố.
- Tự tay cài đặt hoàn chỉnh thao tác chèn (insert), tra cứu từ (search) và tra cứu tiền tố (startsWith).
- Phân tích được độ phức tạp thời gian phụ thuộc vào độ dài chuỗi ký tự.
- Chỉ ra được vấn đề tiêu tốn không gian bộ nhớ của Trie.
- So sánh, đối chiếu chi tiết giữa Trie và Bảng băm.

## Cấu trúc Node

Một node trong Trie thường lưu trữ hai loại thông tin:

1. Tham chiếu trỏ tới các node con, dùng để tiếp tục so khớp ký tự kế tiếp.
2. Cờ đánh dấu xem node này có phải là kết thúc của một từ hoàn chỉnh hay không.

Nếu tập ký tự chỉ gồm các chữ cái tiếng Anh viết thường, sử dụng một mảng có độ dài cố định 26 là tối ưu nhất:

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isWord;
}
```

Nếu tập ký tự không cố định hoặc gồm nhiều loại ký tự khác nhau, bạn có thể dùng `Map<Character, TrieNode>`. Cách này linh hoạt về bộ nhớ hơn, nhưng mỗi lần truy cập sẽ chịu thêm chi phí băm và chi phí đối tượng phụ trợ.

Hai cách tiếp cận này không có cách nào tuyệt đối tốt hơn, tùy thuộc vào bài toán:

| Cách triển khai Node | Ưu điểm | Nhược điểm |
| -------------------- | ------- | ---------- |
| `TrieNode[] children = new TrieNode[26]` | Truy cập cực nhanh, phù hợp tập ký tự nhỏ cố định | Khá lãng phí bộ nhớ khi có nhiều node con rỗng (null) |
| `Map<Character, TrieNode>` | Chỉ cấp phát cho ký tự thực tế xuất hiện, rất linh hoạt | Tốn thêm chi phí tạo đối tượng và chi phí truy vấn băm |

Trong phỏng vấn viết mã, nếu đề bài nêu rõ chỉ chứa chữ cái tiếng Anh in thường, dùng mảng là phương án trực quan và nhanh nhất; nếu tập ký tự chứa chữ hoa, chữ thường, tiếng Việt/tiếng Trung, đường dẫn URL hoặc ký tự bất kỳ, dùng `Map` sẽ an toàn và chắc chắn hơn.

## Cài đặt cơ bản

Mẫu code dưới đây giả định chuỗi ký tự chỉ bao gồm các chữ cái tiếng Anh viết thường:

```java
class Trie {
    private final TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int index = c - 'a';
            if (node.children[index] == null) {
                node.children[index] = new TrieNode();
            }
            node = node.children[index];
        }
        node.isWord = true;
    }

    public boolean search(String word) {
        TrieNode node = find(word);
        return node != null && node.isWord;
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;
    }

    private TrieNode find(String text) {
        TrieNode node = root;
        for (char c : text.toCharArray()) {
            int index = c - 'a';
            if (node.children[index] == null) {
                return null;
            }
            node = node.children[index];
        }
        return node;
    }
}
```

Bản chất logic của chèn và tra cứu đều đi theo cùng một trục tư duy: xuất phát từ node gốc, đi xuống từng tầng tương ứng với từng ký tự. Khi chèn, nếu nhánh đường đi chưa có thì khởi tạo node mới; khi tra cứu, nếu nhánh đường đi bị đứt thì trả về `false`. Điểm khác biệt duy nhất nằm ở bước cuối cùng: `search()` bắt buộc phải kiểm tra cờ `isWord`, còn `startsWith()` chỉ cần đi hết được toàn bộ tiền tố là đủ.

## Hiểu về thao tác xóa từ trong Trie như thế nào?

Thao tác xóa trong Trie dễ viết sai hơn nhiều so với thao tác chèn và tra cứu, bởi vì khi xóa một từ, ta không thể đơn thuần xóa bỏ toàn bộ nhánh ký tự của nó.

Ví dụ, trong Trie đồng thời có cả `app` và `apple`. Khi xóa từ `app`, ta chỉ được phép hủy bỏ cờ đánh dấu `isWord` trên node `p` cuối cùng của `app`, tuyệt đối không được xóa nhánh `a -> p -> p`, vì nếu xóa sẽ làm hỏng luôn từ `apple`.

Để thực sự giải phóng (xóa vật lý) các node, cần xét ngược từ cuối từ trở về gốc: nếu một node không có bất kỳ node con nào VÀ bản thân nó cũng không phải là điểm kết thúc của một từ khác, thì node đó mới được phép bị xóa bỏ. Trong phỏng vấn, nếu đề bài không yêu cầu tường minh thao tác xóa, bạn hãy ưu tiên viết thật chuẩn xác và vững vàng ba phương thức: chèn, tra cứu từ và tra cứu tiền tố trước.

## Độ phức tạp

Gọi độ dài chuỗi ký tự là $L$:

- Thao tác chèn (Insert): $O(L)$
- Tra cứu từ hoàn chỉnh (Search): $O(L)$
- Tra cứu tiền tố (StartsWith): $O(L)$

Độ phức tạp không gian phụ thuộc vào tổng số lượng node được tạo ra. Trong trường hợp xấu nhất, nếu các chuỗi ký tự gần như không có tiền tố chung nào, lượng bộ nhớ tiêu thụ sẽ xấp xỉ bằng tổng số ký tự của tất cả các chuỗi cộng lại.

Nếu yêu cầu liệt kê tất cả các từ nằm dưới một tiền tố nhất định, độ phức tạp sẽ không chỉ dừng lại ở $O(L)$. Việc định vị node tiền tố tốn $O(L)$, sau đó phải duyệt toàn bộ cây con bên dưới node này; chi phí phụ trội sẽ phụ thuộc vào quy mô cây con và số lượng kết quả trả về.

## Nên chọn Trie hay Bảng băm?

| Kịch bản | Trie | Bảng băm (Hash Table) |
| -------- | ---- | --------------------- |
| Tra cứu chuỗi hoàn chỉnh | Hoàn toàn làm được, nhưng tốn bộ nhớ hơn | Nhanh gọn và trực tiếp hơn |
| Tra cứu tiền tố | Cực kỳ phù hợp | Cần xử lý chỉ mục phụ phức tạp |
| Liệt kê tất cả từ theo tiền tố | Cực kỳ phù hợp | Rất bất tiện và chi phí cao |
| Tập ký tự rất lớn hoặc bất định | Cần tối ưu cấu trúc node | Đơn giản, đỡ đau đầu hơn |

Nếu bài toán chỉ đơn thuần là kiểm tra xem một từ cụ thể có tồn tại hay không, bảng băm thường là lựa chọn đơn giản và tiết kiệm hơn. Nhưng nếu hệ thống cần truy vấn tiền tố liên tục, Trie chắc chắn là cấu trúc vượt trội hơn hẳn.

Một khác biệt tinh tế thường bị bỏ qua: tra cứu khớp chính xác của bảng băm thường tiết kiệm bộ nhớ và đa dụng hơn; trong khi Trie hiển thị hóa các tiền tố chung thành các nhánh đường đi, nhờ đó tự nhiên hỗ trợ đắc lực cho tra cứu tiền tố, liệt kê theo tiền tố và khớp tiền tố dài nhất. Hai cấu trúc này tập trung giải quyết trọng tâm bài toán khác nhau chứ không phải là sự thay thế triệt để lẫn nhau.

## Các kịch bản ứng dụng trong kỹ thuật thực tế

- Tự động điền gợi ý tìm kiếm (Autocomplete): Dựa trên tiền tố người dùng vừa gõ để gợi ý danh sách từ khóa tiềm năng.
- Lọc từ nhạy cảm: Trie kết hợp với con trỏ thất bại (fail pointer) tạo nên máy tự động Aho-Corasick (AC Automaton), chuyên dùng để khớp nhiều mẫu chuỗi cùng lúc với tốc độ cực cao.
- Định tuyến IP (IP Routing): Giải thuật khớp tiền tố dài nhất (Longest Prefix Match - LPM) trong các router mạng kế thừa tư tưởng từ Trie.
- Kiểm tra từ điển / Chính tả: Nhanh chóng xác định một từ hoặc tiền tố có hợp lệ hay không.

Trong kỹ thuật thực tế, bạn sẽ còn bắt gặp một số biến thể mạnh mẽ của Trie:

- **Compressed Trie / Radix Tree**: Nén các chuỗi node đơn nhánh liên tiếp thành một chuỗi ký tự, giúp giảm đáng kể số lượng node và độ sâu của cây.
- **Ternary Search Trie (TST - Cây tìm kiếm tam phân)**: Mỗi node phân nhánh theo 3 hướng (nhỏ hơn, bằng, lớn hơn), tạo sự cân bằng dung hòa giữa chi phí bộ nhớ và tính linh hoạt khi tra cứu.
- **AC Automaton**: Bổ sung thêm các con trỏ thất bại trên nền tảng Trie để phục vụ so khớp nhiều mẫu chuỗi song song.

Bạn không cần học thuộc lòng tất cả các biến thể này ngay từ đầu, nhưng hãy ghi nhớ tư tưởng nền tảng của Trie chính là điểm xuất phát chung của chúng: dùng đường đi biểu diễn chuỗi ký tự và chia sẻ đường đi để tái sử dụng tiền tố chung.

## Các điểm dễ sai sót (Pitfalls)

- Không được bỏ quên cờ `isWord`, nếu không sẽ không thể phân biệt được từ `app` và từ `apple`.
- Tập ký tự không phải lúc nào cũng chỉ có chữ cái in thường, khi phỏng vấn cần linh hoạt thay đổi cấu trúc node theo yêu cầu đề bài.
- Thao tác xóa từ phức tạp hơn chèn và tra cứu rất nhiều; cần phán đoán xem node có còn được dùng chung bởi các từ khác hay không trước khi giải phóng node.
- Độ phức tạp khi tra cứu trong Trie phụ thuộc vào độ dài chuỗi ký tự, không tỷ lệ thuận trực tiếp với kích thước từ điển.

## Bài tập đề xuất rèn luyện

- [208. Cài đặt Trie (Implement Trie / Prefix Tree)](https://leetcode.cn/problems/implement-trie-prefix-tree/)
- [211. Thiết kế cấu trúc dữ liệu thêm và tìm kiếm từ (Design Add and Search Words Data Structure)](https://leetcode.cn/problems/design-add-and-search-words-data-structure/)
- [212. Tìm kiếm từ II (Word Search II)](https://leetcode.cn/problems/word-search-ii/)
- [648. Thay thế từ (Replace Words)](https://leetcode.cn/problems/replace-words/)

## Tài liệu tham khảo

- [Algorithms, 4th Edition: Tries](https://algs4.cs.princeton.edu/52trie/)
- [Algorithms, 4th Edition: TrieST API](https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/TrieST.html)
- [Stanford CS166: Tries and Suffix Trees](https://web.stanford.edu/class/archive/cs/cs166/cs166.1216/lectures/16/Slides16.pdf)
