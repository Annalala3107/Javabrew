---
title: Tổng hợp khái niệm cốt lõi về Git
description: Tổng hợp các khái niệm cốt lõi và quy trình làm việc của Git, bao gồm phân nhánh và gộp nhánh, quản lý commit và giải quyết xung đột, giúp nâng cao hiệu quả cộng tác nhóm và chất lượng mã nguồn.
category: Công cụ phát triển
tag:
  - Git
lang: vi
sourceRef: zh-ref/tools/git/git-intro.md
head:
  - - meta
    - name: keywords
      content: Git,Kiểm soát phiên bản,Phân tán,Nhánh,Commit,Merge,Giải quyết xung đột,Quy trình làm việc
---

## Kiểm soát phiên bản

### Kiểm soát phiên bản là gì

Kiểm soát phiên bản (Version Control) là một hệ thống ghi lại sự thay đổi nội dung của một hoặc nhiều tệp theo thời gian, giúp bạn có thể tra cứu lại tình trạng chỉnh sửa của một phiên bản cụ thể trong tương lai. Ngoài mã nguồn dự án, bạn có thể áp dụng kiểm soát phiên bản cho bất kỳ loại tệp nào.

### Tại sao cần kiểm soát phiên bản

Nhờ có kiểm soát phiên bản, bạn có thể khôi phục một tệp nào đó về trạng thái trước kia, thậm chí đưa toàn bộ dự án quay lại một thời điểm trong quá khứ. Bạn có thể so sánh chi tiết các thay đổi của tệp, tìm ra người cuối cùng đã sửa vị trí nào để xác định nguyên nhân gây ra lỗi kỳ lạ, hoặc biết ai đã báo cáo lỗi chức năng nào và vào lúc nào.

### Hệ thống kiểm soát phiên bản cục bộ

Nhiều người có thói quen sao chép toàn bộ thư mục dự án để lưu các phiên bản khác nhau, có thể còn đổi tên và gắn thêm thời gian sao lưu để phân biệt. Ưu điểm duy nhất của cách làm này là đơn giản, nhưng lại cực kỳ dễ mắc sai lầm. Đôi khi bạn sẽ bị nhầm lẫn thư mục làm việc hiện tại, vô tình ghi nhầm tệp hoặc ghi đè lên những tệp ngoài ý muốn.

Để giải quyết vấn đề này, từ rất lâu trước đây người ta đã phát triển nhiều hệ thống kiểm soát phiên bản cục bộ, đa số sử dụng một dạng cơ sở dữ liệu đơn giản để ghi lại lịch sử các thay đổi khác biệt của tệp qua từng lần cập nhật.

![Hệ thống kiểm soát phiên bản cục bộ](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/.png-2300cd9c.png)

### Hệ thống kiểm soát phiên bản tập trung

Tiếp theo, người ta lại gặp một bài toán mới: làm thế nào để các lập trình viên trên những hệ thống khác nhau có thể cộng tác cùng nhau? Từ đó, hệ thống kiểm soát phiên bản tập trung (Centralized Version Control Systems, viết tắt là CVCS) ra đời.

Các hệ thống kiểm soát phiên bản tập trung đều có một máy chủ duy nhất được quản lý tập trung để lưu giữ tất cả các phiên bản chỉnh sửa của tệp, còn những người làm việc chung sẽ kết nối tới máy chủ này thông qua client để lấy tệp mới nhất hoặc gửi bản cập nhật lên.

![Hệ thống kiểm soát phiên bản tập trung](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/.png-a7825939.png)

Dù cách này giải quyết được nhược điểm của hệ thống kiểm soát phiên bản cục bộ là không thể giúp lập trình viên trên các máy khác nhau cộng tác, nhưng vẫn tồn tại những vấn đề sau:

- **Điểm lỗi đơn (Single Point of Failure):** Nếu máy chủ trung tâm gặp sự cố ngừng hoạt động, những người khác không thể sử dụng; nếu ổ đĩa cơ sở dữ liệu trung tâm bị hỏng mà chưa kịp sao lưu, bạn sẽ mất toàn bộ dữ liệu. Hệ thống kiểm soát phiên bản cục bộ cũng gặp vấn đề tương tự: hễ toàn bộ lịch sử dự án chỉ được lưu tại một vị trí duy nhất thì luôn tiềm ẩn rủi ro mất sạch lịch sử cập nhật.
- **Bắt buộc phải có kết nối mạng mới làm việc được:** Bị ảnh hưởng bởi tình trạng mạng và băng thông.

### Hệ thống kiểm soát phiên bản phân tán

Vì vậy, hệ thống kiểm soát phiên bản phân tán (Distributed Version Control System, viết tắt là DVCS) đã ra đời. Git là một ví dụ điển hình của hệ thống kiểm soát phiên bản phân tán.

Với loại hệ thống này, client không chỉ tải về bản chụp (snapshot) mới nhất của tệp, mà sẽ sao chép (mirror) toàn bộ kho lưu trữ mã nguồn về máy. Nhờ vậy, nếu bất kỳ máy chủ nào dùng để cộng tác gặp sự cố, sau đó đều có thể khôi phục lại từ bất kỳ kho lưu trữ cục bộ nào đã được sao chép. Bởi vì mỗi lần `clone` thực chất là một lần sao lưu đầy đủ toàn bộ kho mã nguồn.

![Hệ thống kiểm soát phiên bản phân tán](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/.png-35b4df98.png)

Hệ thống kiểm soát phiên bản phân tán có thể hoạt động mà không cần kết nối mạng, vì trên máy tính của mỗi người đều có đầy đủ một kho lưu trữ phiên bản hoàn chỉnh; sau khi sửa một tệp nào đó, bạn chỉ cần đẩy thay đổi của mình cho người khác. Tuy nhiên, trong thực tế sử dụng hệ thống kiểm soát phiên bản phân tán, người ta ít khi đẩy thay đổi trực tiếp cho nhau mà thường dùng một máy đóng vai trò "máy chủ trung tâm". Máy chủ này chỉ có tác dụng giúp việc "trao đổi" các thay đổi giữa mọi người thuận tiện hơn; không có nó thì mọi người vẫn làm việc bình thường, chỉ là việc trao đổi thay đổi kém tiện lợi hơn một chút.

Ưu thế của hệ thống kiểm soát phiên bản phân tán không chỉ đơn giản là không cần kết nối mạng; ở phần sau chúng ta sẽ còn thấy những tính năng cực kỳ mạnh mẽ của Git như quản lý nhánh (branch).

## Làm quen với Git

### Sơ lược lịch sử Git

Nhóm phát triển nhân Linux trước đây sử dụng hệ thống kiểm soát phiên bản phân tán BitKeeper để quản lý và bảo trì mã nguồn. Tuy nhiên, sau này mối quan hệ hợp tác giữa công ty thương mại phát triển BitKeeper và cộng đồng mã nguồn mở nhân Linux chấm dứt, và họ thu hồi quyền sử dụng BitKeeper miễn phí của cộng đồng nhân Linux. Cộng đồng mã nguồn mở Linux (đặc biệt là Linus Torvalds, cha đẻ của Linux) đã dựa trên kinh nghiệm và bài học khi dùng BitKeeper để tự phát triển hệ thống quản lý phiên bản của riêng mình, đồng thời cải tiến rất nhiều trên hệ thống mới này.

### Sự khác biệt chính giữa Git và các hệ thống quản lý phiên bản khác

Cách Git lưu trữ và xử lý các thông tin khác biệt rất nhiều so với các hệ thống kiểm soát phiên bản khác, mặc dù các câu lệnh thao tác trông khá giống nhau. Hiểu rõ những khác biệt này sẽ giúp bạn tránh bị bỡ ngỡ khi sử dụng.

Dưới đây, chúng ta chủ yếu nói về một điểm khác biệt cốt lõi giữa Git và các hệ thống quản lý phiên bản khác: **cách tiếp cận dữ liệu**.

**Git sử dụng cách ghi nhận trực tiếp các bản chụp (snapshot), chứ không phải so sánh chênh lệch (diff). Tôi sẽ giải thích chi tiết sự khác biệt giữa hai cách này ở bên dưới.**

Phần lớn các hệ thống kiểm soát phiên bản khác (CVS, Subversion, Perforce, Bazaar, v.v.) đều lưu trữ thông tin dưới dạng danh sách thay đổi theo từng tệp. Các hệ thống dạng này **coi thông tin lưu trữ như một tập hợp các tệp cơ sở cùng phần chênh lệch tích lũy dần theo thời gian của từng tệp**.

Nguyên lý cụ thể được minh họa như hình dưới đây; thực chất rất dễ hiểu: mỗi khi chúng ta commit cập nhật một tệp, hệ thống sẽ ghi lại những cập nhật đã thực hiện trên tệp đó, được biểu thị bằng ký hiệu phần tăng Δ (Delta).

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/2019-3deltas-21153b9f.png)

**Làm thế nào để chúng ta lấy được phiên bản cuối cùng của một tệp?**

Rất đơn giản, giống như kiến thức toán phổ thông cơ bản: chúng ta chỉ cần cộng tệp gốc ban đầu với tất cả các phần tăng thêm (delta) này lại là xong.

**Cách làm này có vấn đề gì?**

Ví dụ, nếu số lượng phần tăng thêm (delta) cực kỳ nhiều, thì để dựng lại được tệp cuối cùng sẽ tốn rất nhiều thời gian và hiệu năng.

Git không xử lý hay lưu trữ dữ liệu theo cách trên. Ngược lại, Git coi dữ liệu giống như một tập hợp các bản chụp (snapshot) của một hệ thống tệp thu nhỏ. Mỗi lần bạn commit cập nhật hoặc lưu trạng thái dự án trong Git, về cơ bản nó sẽ chụp lại toàn bộ các tệp tại thời điểm đó và lưu trữ chỉ mục trỏ tới bản chụp này. Để tối ưu hiệu quả, nếu tệp không bị sửa đổi, Git sẽ không lưu trữ lại tệp đó nữa mà chỉ giữ một liên kết trỏ tới tệp đã lưu trước đó. Git tiếp cận dữ liệu giống như một **luồng các bản chụp (snapshot stream)**.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/2019-3snapshots-74465a70.png)

### Ba trạng thái của Git

Git có ba trạng thái mà tệp của bạn có thể nằm trong đó:

1. **Committed (Đã commit)**: Dữ liệu đã được lưu trữ an toàn trong cơ sở dữ liệu cục bộ.
2. **Modified (Đã sửa đổi)**: Cho biết tệp đã được chỉnh sửa, nhưng chưa được lưu vào cơ sở dữ liệu.
3. **Staged (Đã đưa vào vùng đệm)**: Cho biết phiên bản hiện tại của một tệp đã sửa đổi đã được đánh dấu để đưa vào bản chụp (snapshot) của lần commit tiếp theo.

Từ đó dẫn đến khái niệm ba vùng làm việc của một dự án Git: **Thư mục Git (`.git` directory)**, **Thư mục làm việc (Working Directory)** và **Vùng đệm (Staging Area)**.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/2019-3areas-2e18b4f5.png)

**Quy trình làm việc cơ bản của Git như sau:**

1. Chỉnh sửa tệp trong thư mục làm việc (Working Directory).
2. Đưa tệp vào vùng đệm (Staging Area), tức là đặt bản chụp của tệp vào vùng đệm.
3. Commit cập nhật, Git sẽ lấy các tệp trong vùng đệm và lưu trữ vĩnh viễn bản chụp đó vào thư mục kho Git.

## Hướng dẫn nhanh sử dụng Git

### Khởi tạo hoặc lấy một Git Repository

Có hai cách để có được kho lưu trữ (repository) của một dự án Git:

1. Khởi tạo kho lưu trữ trong một thư mục hiện có: vào thư mục dự án và chạy lệnh `git init`, lệnh này sẽ tạo ra một thư mục con tên là `.git`.
2. Sao chép (clone) một kho lưu trữ Git có sẵn từ máy chủ: `git clone [url]`. Nếu muốn tùy chỉnh tên thư mục cục bộ, bạn có thể dùng `git clone [url] directoryname`.

### Ghi nhận từng thay đổi vào Repository

1. **Kiểm tra trạng thái tệp hiện tại**: `git status`
2. **Đề xuất thay đổi (đưa chúng vào vùng đệm - Staging Area)**: `git add filename` (cho một tệp cụ thể), `git add .` (toàn bộ thay đổi trong thư mục hiện tại), `git add *.txt` (hỗ trợ ký tự đại diện wildcard, toàn bộ các tệp `.txt`).
3. **Bỏ qua tệp**: tệp `.gitignore`.
4. **Commit cập nhật**: `git commit -m "thông điệp commit"`. Trước mỗi lần chuẩn bị commit, hãy chạy `git status` trước để kiểm tra xem mọi thứ đã được stage hết chưa.
5. **Cách bỏ qua bước dùng vùng đệm khi commit**: `git commit -a -m "thông điệp commit"`. Khi thêm tùy chọn `-a` vào `git commit`, Git sẽ tự động stage tất cả các tệp đã được theo dõi (tracked) rồi commit cùng lúc, qua đó bỏ qua bước `git add`.
6. **Xóa tệp**: `git rm filename` (xóa khỏi vùng đệm, sau đó commit).
7. **Đổi tên tệp**: `git mv README.md README` (lệnh này tương đương với tập hợp 3 lệnh `mv README.md README`, `git rm README.md` và `git add README`).

### Cách viết một Git Commit Message chuẩn

Một thông điệp commit (commit message) tốt trong Git có dạng như sau:

```plain
Dòng tiêu đề: dùng một dòng này để mô tả và giải thích ngắn gọn cho lần commit của bạn

Phần thân (body) có thể gồm vài dòng ngắn để bổ sung thêm chi tiết giải thích cho commit, tốt nhất là cung cấp thêm bối cảnh liên quan hoặc giải thích commit này sửa và giải quyết vấn đề gì.

Phần thân tất nhiên cũng có thể có nhiều đoạn, nhưng nhất định phải chú ý xuống dòng và không viết câu quá dài. Bởi vì làm như vậy khi dùng "git log" sẽ căn lề thụt đầu dòng trông rất gọn và dễ đọc.
```

Mô tả ở dòng tiêu đề của commit nên rõ ràng hết mức có thể và cố gắng tóm gọn trong một câu. Như vậy sẽ thuận tiện cho các công cụ xem Git log hiển thị và giúp người khác dễ đọc hơn.

### Đẩy thay đổi lên Remote Repository

- Nếu bạn chưa clone kho lưu trữ có sẵn và muốn kết nối kho cục bộ của mình với một máy chủ từ xa (remote), bạn có thể thêm bằng lệnh: `git remote add origin <server>`. Chẳng hạn, để liên kết kho cục bộ với kho đã tạo trên GitHub, bạn có thể viết: `git remote add origin https://github.com/Snailclimb/test.git`.
- Đẩy những thay đổi này lên kho lưu trữ từ xa: `git push origin main`. Ở đây `main` có thể thay bằng bất kỳ nhánh nào bạn muốn đẩy lên. Nhiều dự án cũ vẫn đặt tên nhánh mặc định là `master`, hãy đối chiếu theo thực tế kho lưu trữ của bạn.

  Như vậy bạn đã có thể đẩy các thay đổi của mình lên máy chủ đã thêm.

### Xóa và đổi tên Remote Repository

- Đổi tên `test` thành `test1`: `git remote rename test test1`
- Xóa kho lưu trữ từ xa `test1`: `git remote rm test1`

### Xem lịch sử Commit

Sau khi đã commit một số cập nhật, hoặc sau khi clone một dự án nào đó về, có thể bạn sẽ muốn xem lại lịch sử commit. Công cụ đơn giản nhưng hiệu quả nhất cho việc này là lệnh `git log`. `git log` sẽ liệt kê tất cả các bản cập nhật theo thời gian commit, với bản cập nhật mới nhất nằm ở trên cùng.

**Bạn có thể thêm một số tham số để lọc ra nội dung mình muốn xem:**

Chỉ xem lịch sử commit của một người cụ thể:

```shell
git log --author=bob
```

### Hoàn tác thao tác (Undo)

Đôi khi chúng ta commit xong mới phát hiện bỏ sót vài tệp chưa thêm vào, hoặc viết nhầm thông điệp commit. Lúc này, bạn có thể chạy lệnh commit kèm tùy chọn `--amend` để commit lại:

```shell
git commit --amend
```

Hủy trạng thái đã đưa vào vùng đệm (unstage) của tệp:

```shell
git restore --staged filename
```

Ở các phiên bản Git cũ cũng thường gặp cách viết dưới đây:

```shell
git reset filename
```

Hủy bỏ các sửa đổi trên tệp trong thư mục làm việc:

```shell
git restore filename
```

Ở các phiên bản Git cũ cũng thường gặp cách viết dưới đây:

```shell
git checkout -- filename
```

Nếu bạn muốn hủy bỏ toàn bộ thay đổi và commit ở máy cục bộ, bạn có thể lấy lịch sử phiên bản mới nhất từ máy chủ về và trỏ nhánh chính cục bộ tới đó:

```shell
git fetch origin
git reset --hard origin/main
```

Lưu ý: `git reset --hard` sẽ xóa bỏ mọi thay đổi chưa commit ở máy cục bộ, vì vậy trước khi chạy nhất định phải kiểm tra chắc chắn không còn nội dung nào cần giữ lại. Nếu dự án cũ có nhánh mặc định là `master`, hãy đổi lệnh tương ứng thành `git reset --hard origin/master`.

### Nhánh (Branch)

Nhánh (Branch) được dùng để cô lập các tác vụ phát triển khác nhau. Bạn phát triển tính năng hoặc sửa lỗi trên các nhánh khác, sau khi hoàn thành mới gộp (merge) ngược lại vào nhánh chính. Hiện nay nhiều kho lưu trữ đặt tên nhánh mặc định là `main`, nhưng trong các dự án cũ cũng rất hay thấy `master`.

Chúng ta thường chọn tạo nhánh mới khi phát triển tính năng mới, sửa một lỗi khẩn cấp, v.v. Nên phát triển đơn nhánh hay đa nhánh còn tùy thuộc vào từng bối cảnh cụ thể.

Tạo một nhánh tên là `test`:

```shell
git branch test
```

Chuyển nhánh hiện tại sang `test` (khi bạn chuyển nhánh, Git sẽ đặt lại thư mục làm việc của bạn để trông giống hệt trạng thái ở lần commit cuối cùng trên nhánh đó. Git sẽ tự động thêm, xóa, sửa tệp nhằm đảm bảo thư mục làm việc lúc này khớp với lần commit cuối cùng trên nhánh kia):

```shell
git switch test
```

Ở các phiên bản Git cũ cũng hay thấy cách viết `git checkout test`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/2019-3-16e02f90.png)

Bạn cũng có thể tạo nhánh mới rồi chuyển sang nhánh đó ngay lập tức như sau:

```shell
git switch -c feature_x
```

Ở các phiên bản Git cũ cũng hay thấy cách viết `git checkout -b feature_x`.

Chuyển về nhánh chính:

```shell
git switch main
```

Gộp nhánh (có thể xảy ra xung đột):

```shell
git merge test
```

Xóa nhánh vừa tạo:

```shell
git branch -d feature_x
```

Đẩy nhánh lên kho lưu trữ từ xa (sau khi đẩy thành công thì mọi người khác đều có thể thấy):

```shell
git push origin feature_x
```

## Tài liệu học tập đề xuất

**Công cụ học tập minh họa trực tuyến:**

(Bổ sung từ [issue729](https://github.com/Snailclimb/JavaGuide/issues/729)) Learn Git Branching <https://oschina.gitee.io/learn-git-branching/>. Trang web này giúp minh họa trực quan các thao tác Git cơ bản, giải thích cực kỳ rõ ràng tác dụng và kết quả của từng câu lệnh nền tảng.

**Tài liệu đọc đề xuất:**

- [Hướng dẫn nhập môn Git có minh họa trực quan (15.000 chữ, 40 hình)](https://www.cnblogs.com/anding/p/16987769.html): Một bài viết vô cùng tâm huyết, nội dung toàn diện kèm theo sơ đồ minh họa chi tiết, rất đáng đọc!
- [Git - Hướng dẫn ngắn gọn](https://rogerdudler.github.io/git-guide/index.zh.html): Bao quát các thao tác Git phổ biến, trình bày cực kỳ rõ ràng.
- [Minh họa Git trực quan (Visual Git Guide)](https://marklodato.github.io/visual-git-guide/index-zh-cn.html): Minh họa bằng hình ảnh các câu lệnh Git hay dùng nhất. Nếu bạn đã hiểu sơ bộ nguyên lý hoạt động của Git, bài viết này sẽ giúp bạn nắm sâu sắc hơn nữa.
- [Hướng dẫn nhập môn Git ai cũng có thể hiểu](https://backlog.com/git-tutorial/cn/intro/intro1_1.html): Cách giải thích sinh động, thú vị.
- [Pro Git book](https://git-scm.com/book/zh/v2): Một cuốn sách kinh điển về Git của nước ngoài, đã được dịch ra nhiều ngôn ngữ với chất lượng rất cao.
