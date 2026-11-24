---
title: Tổng hợp mẹo sử dụng GitHub hữu ích
description: Tổng hợp các mẹo sử dụng GitHub hiệu quả, bao gồm trang cá nhân, huy hiệu dự án (badge), đọc mã nguồn, GitHub Actions, Explore/Trending và các phương pháp nâng cao hiệu suất cộng tác mã nguồn mở.
category: Công cụ phát triển
tag:
  - Git
lang: vi
sourceRef: zh-ref/tools/git/github-tips.md
head:
  - - meta
    - name: keywords
      content: Mẹo GitHub,Trang cá nhân,README,Thống kê,Đóng góp mã nguồn mở,GitHub Actions,Đọc mã nguồn
---

GitHub không chỉ là nền tảng lưu trữ mã nguồn. Đối với lập trình viên, nó đồng thời đảm nhiệm vai trò giới thiệu dự án, đọc mã nguồn, cộng tác mã nguồn mở, xây dựng tự động hóa (CI/CD) và làm trang cá nhân. Bài viết này tổng hợp một số mẹo sử dụng GitHub khá hữu ích trong thực tế.

## Tạo nhanh CV GitHub và báo cáo năm GitHub

Thông qua trang web [https://resume.github.io/](https://resume.github.io/), bạn có thể tạo nhanh một bản CV GitHub trực tuyến chỉ với một cú nhấp chuột.

Tuy nhiên, có nên đưa liên kết GitHub vào CV hay không còn tùy thuộc vào chất lượng nội dung tài khoản. Nếu tài khoản có các dự án hoàn chỉnh, lịch sử bảo trì đều đặn, file README rõ ràng và lịch sử commit tương đối chuẩn chỉnh thì liên kết GitHub sẽ là điểm cộng; còn nếu chỉ có các repository trống hoặc code luyện tập tạm bợ thì không cần cố nhét vào. Kết quả sau khi tạo sẽ trông như hình dưới đây.

![CV GitHub](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201108192205620-a5a4105a.png)

Thông qua trang web <https://www.githubtrends.io/wrapped>, bạn có thể tạo một bản báo cáo tổng kết năm (Year in Review) cho tài khoản GitHub cá nhân; báo cáo này sẽ liệt kê tình hình đóng góp dự án trong năm qua, các ngôn ngữ lập trình bạn dùng nhiều nhất và thông tin đóng góp chi tiết.

## Cá nhân hóa trang chủ GitHub

GitHub hiện hỗ trợ tùy chỉnh hiển thị một số nội dung ngay trên trang cá nhân. Hiệu ứng hiển thị trông như hình dưới đây.

![Hiệu ứng hiển thị trang chủ cá nhân hóa](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210616221212259-50c2e8ba.png)

Để làm được điều này cực kỳ đơn giản: bạn chỉ cần tạo một repository trùng tên với tên tài khoản GitHub của mình, sau đó tùy chỉnh nội dung tệp `README.md` là được.

Nội dung tùy chỉnh hiển thị trên trang chủ của bạn chính là nội dung của `README.md` (_bạn nào chưa biết cú pháp Markdown thì tự đứng úp mặt vào tường suy ngẫm 5 phút nhé_).

![Tạo một repository trùng tên với tài khoản GitHub của bạn](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20201107110309341-355239b7.png)

Phần này bạn có thể sáng tạo rất nhiều thứ hay ho! Ví dụ: thông qua dự án mã nguồn mở [github-readme-stats](https://hellogithub.com/periodical/statistics/click/?target=https://github.com/anuraghazra/github-readme-stats), bạn có thể hiển thị bảng thống kê GitHub được tạo động ngay trong README. Hiệu ứng hiển thị như hình dưới đây.

![Tạo động thông tin thống kê GitHub qua github-readme-stats](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210616221312426-cbbca19f.png)

Về phần cá nhân hóa trang cá nhân xin không đi quá sâu ở đây, bạn nào hứng thú có thể tự tìm hiểu thêm.

## Tùy chỉnh huy hiệu dự án (Badge)

Những huy hiệu dự án bạn thường thấy trên GitHub đều được tạo qua trang web [https://shields.io/](https://shields.io/). Huy hiệu của dự án JavaGuide của tôi trông như hình bên dưới.

![Huy hiệu dự án](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107143136559-62170ad2.png)

Hơn nữa, bạn không chỉ tạo được huy hiệu tĩnh, mà `shields.io` còn có thể đọc động trạng thái dự án của bạn để tạo ra các huy hiệu tương ứng.

![Tùy chỉnh huy hiệu dự án](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107143502356-2f8b8313.png)

Kết quả huy hiệu mô tả trạng thái dự án được tạo ra trông như hình dưới đây.

![Huy hiệu mô tả trạng thái dự án](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107143752642-fcfeaa4e.png)

## Tự động thêm biểu đồ đóng góp cho dự án

Thông qua công cụ `repobeats`, bạn có thể thêm biểu đồ tổng quan tình hình đóng góp cho dự án GitHub của mình.

Địa chỉ: <https://repobeats.axiom.co/>.

## Emoji trên GitHub

![Emoji trên GitHub](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107162254582-46615280.png)

Nếu bạn muốn sử dụng emoji trên GitHub, bạn có thể tra cứu tại đây: [www.webfx.com/tools/emoji-cheat-sheet/](https://www.webfx.com/tools/emoji-cheat-sheet/).

![Emoji GitHub trực tuyến](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107162432941-fa620aab.png)

## Đọc mã nguồn dự án GitHub hiệu quả

GitHub Codespaces có thể cung cấp môi trường phát triển trực tuyến tương tự VS Code, phù hợp để đọc nhanh, debug hoặc tham gia đóng góp mã nguồn mở tức thì. Với những dự án lớn hoặc dự án cần phụ thuộc vào các dịch vụ chạy cục bộ, vẫn nên clone về máy và dùng IDE quen thuộc để đọc và debug.

Dưới đây giới thiệu ngắn gọn một vài cách đọc mã nguồn dự án GitHub thường dùng.

### Tiện ích mở rộng Chrome: Octotree

Đây đã là công cụ quá quen thuộc rồi và cũng là cách tôi thích nhất. Sau khi dùng Octotree, thanh bên của trang web sẽ hiển thị dự án theo cấu trúc dạng cây, mang lại cho chúng ta trải nghiệm đọc mã nguồn giống như trong IDE.

![Tiện ích Chrome Octotree](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107144944798-0bf10917.png)

### Sourcegraph

Khi không muốn clone dự án về máy, bạn cũng có thể dùng các công cụ tìm kiếm và đọc mã nguồn như Sourcegraph. Sourcegraph hỗ trợ tìm kiếm mã nguồn xuyên suốt nhiều repository, nhảy tới vị trí tham chiếu (reference), v.v., rất hữu ích khi đọc các dự án lớn.

Sau khi tải tiện ích mở rộng này về, trang chủ dự án sẽ xuất hiện thêm một biểu tượng nhỏ như hình dưới đây. Nhấp vào biểu tượng này là bạn có thể đọc mã nguồn dự án trực tuyến.

![](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107145749659-5034715a.png)

Giao diện đọc mã nguồn bằng Sourcegraph sẽ tương tự như hình bên dưới, cũng hiển thị mã nguồn theo cấu trúc cây và hỗ trợ nhảy qua lại giữa các class.

![](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107150307314-f8d6db4f.png)

### Clone dự án về máy cục bộ

Trước tiên clone dự án về máy, sau đó dùng IDE yêu thích của bạn để đọc. Nếu muốn hiểu sâu một dự án, đây là lựa chọn hàng đầu.

```bash
git clone https://github.com/Snailclimb/JavaGuide.git
```

## Mở rộng tính năng cho GitHub

**Enhanced GitHub** giúp trải nghiệm GitHub của bạn tốt hơn nữa. Tiện ích trình duyệt này có thể hiển thị dung lượng repository, dung lượng từng tệp và hỗ trợ tải nhanh từng tệp riêng lẻ.

![](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107160817672-8db933ee.png)

## Tự động tạo mục lục cho tệp Markdown

Nếu bạn muốn tạo mục lục cho tệp Markdown, chỉ cần dùng các tiện ích của VS Code như **Markdown Preview Enhanced** là được.

Hiệu ứng mục lục được tạo ra trông như hình dưới đây. Bạn có thể bấm trực tiếp vào liên kết trong mục lục để nhảy đến vị trí tương ứng trong bài viết, giúp cải thiện trải nghiệm đọc.

![](/media/jg/ext/oss.javaguide.cn/2020-11/iShot2020-11-07-16.14.14-1--d677ca02.png)

Tuy nhiên, hiện tại GitHub cũng đã tự động tạo mục lục cho tệp Markdown rồi, bạn chỉ cần bấm vào nút mục lục trên trang để mở rộng ra là thấy.

## Tận dụng tốt GitHub Explore

Tính năng Explore tích hợp sẵn của GitHub cực kỳ mạnh mẽ và hữu ích, rất phù hợp để khám phá dự án, chủ đề và xu hướng công nghệ.

Nói một cách đơn giản, GitHub Explore có thể cung cấp những tính năng sau:

1. Đề xuất các dự án dựa trên sở thích cá nhân của bạn;
2. GitHub Topics phân loại và tổng hợp các dự án theo danh mục/chủ đề. Ví dụ: [Data visualization](https://github.com/topics/data-visualization) tổng hợp các dự án mã nguồn mở liên quan đến trực quan hóa dữ liệu, còn [Awesome Lists](https://github.com/topics/awesome) tập hợp các repository thuộc chuỗi Awesome;
3. Thông qua GitHub Trending, chúng ta có thể xem các dự án mã nguồn mở đang thịnh hành gần đây, đồng thời lọc dự án theo ngôn ngữ lập trình và mốc thời gian;
4. GitHub Collections giống như một bộ sưu tập đánh dấu trang. Ví dụ: [Teaching materials for computational social science](https://github.com/collections/teaching-computational-social-science) tổng hợp các tài nguyên mã nguồn mở cho môn học khoa học máy tính, còn [Learn to Code](https://github.com/collections/learn-to-code) tổng hợp những repository hữu ích cho việc học lập trình;
5. ...

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/github-explore-cce0f1aa.png)

## GitHub Actions rất mạnh mẽ

Bạn có thể hiểu đơn giản GitHub Actions là nền tảng tự động hóa tích hợp sẵn của GitHub. Thông qua GitHub Actions, bạn có thể thực hiện build, chạy test, deploy, quét thư viện phụ thuộc, chạy tác vụ định kỳ (cron job), v.v. ngay trên GitHub.

Về giới thiệu chi tiết hơn đối với GitHub Actions, bạn có thể tham khảo bài viết [Hướng dẫn nhập môn GitHub Actions](https://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html) của tác giả Ruan Yifeng.

GitHub Actions có một kho ứng dụng (Marketplace) chính thức với rất nhiều Action do cộng đồng đóng góp mà bạn có thể tái sử dụng trực tiếp.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20211227100147433-5efe5259.png)

## Lời kết

Bạn không cần phải ghi nhớ toàn bộ mẹo GitHub trong một lần. Chỉ cần bắt đầu áp dụng những phần như trang cá nhân, huy hiệu dự án, công cụ đọc mã nguồn, Explore/Trending và GitHub Actions là đã đủ đáp ứng phần lớn các tình huống thường ngày rồi.

Ngoài ra, bài viết này chưa đi sâu vào cú pháp tìm kiếm của GitHub. Trong thực tế sử dụng, việc tìm theo từ khóa, lọc theo ngôn ngữ, sắp xếp theo số Star và lọc theo thời gian cập nhật thường hữu ích hơn nhiều so với việc cố học thuộc các cú pháp phức tạp.
