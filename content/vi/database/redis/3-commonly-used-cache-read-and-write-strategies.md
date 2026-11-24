---
title: Giải thích chi tiết 3 chiến lược đọc ghi Cache thường dùng
description: So sánh chuyên sâu ba chiến lược đọc ghi Cache gồm Cache Aside, Read/Write Through và Write Behind, kèm phân tích trình tự theo dòng thời gian, bài toán tính nhất quán và giải pháp cấp độ Production — kiến thức thiết yếu khi thực chiến Redis!
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Chiến lược đọc ghi Cache,Cache Aside,Read Through,Write Through,Write Behind,Write Back,Tính nhất quán Cache,Vô hiệu hóa Cache,Đọc ghi xuyên suốt,Ghi Cache bất đồng bộ,Chiến lược Cache Redis,Chiến lược cập nhật Cache
lang: vi
sourceRef: zh-ref/database/redis/3-commonly-used-cache-read-and-write-strategies.md
---

Mình thấy nhiều bạn ghi trong CV là "**sử dụng thành thạo Cache**", nhưng khi bị hỏi về "**3 chiến lược đọc ghi Cache thường dùng**" thì lại ngơ ngác không biết trả lời sao.

Theo mình, nguyên nhân gây ra tình trạng này là khi học Redis, chúng ta có thể chỉ viết vài Demo đơn giản mà chưa chú ý đến chiến lược đọc ghi Cache, hoặc thậm chí chưa từng nghe qua khái niệm này.

Tuy nhiên, việc hiểu rõ 3 chiến lược đọc ghi Cache phổ biến này cực kỳ hữu ích cả khi áp dụng Cache trong công việc thực tế lẫn khi bị hỏi về Cache trong phỏng vấn!

**Ba mô hình được giới thiệu bên dưới mỗi loại đều có ưu nhược điểm riêng, không tồn tại mô hình tối ưu tuyệt đối — hãy dựa vào kịch bản nghiệp vụ cụ thể để chọn mô hình đọc ghi Cache phù hợp với hệ thống của mình.**

### Cache Aside Pattern (Mô hình Cache đứng cạnh )

Đây là mô hình **được dùng phổ biến nhất và kinh điển nhất** trong phát triển hằng ngày, gần như là tiêu chuẩn mặc định cho giải pháp Cache của các ứng dụng Internet, đặc biệt phù hợp với kịch bản nghiệp vụ **đọc nhiều ghi ít**.

Mô hình này được gọi là **"Aside" (đứng bên cạnh)** vì **thao tác ghi của ứng dụng bỏ qua hoàn toàn Cache và tác động trực tiếp xuống cơ sở dữ liệu**.

Ứng dụng đóng vai trò như "người chỉ huy" điều phối luồng dữ liệu, cần tự duy trì đồng thời cả hai nguồn dữ liệu là Cache và DB.

Dưới đây hãy cùng xem các bước đọc và ghi Cache theo chiến lược này.

**Thao tác ghi:**

1. Ứng dụng **cập nhật DB trước và commit Transaction**.
2. Sau khi Transaction commit thành công, **xóa** dữ liệu tương ứng trong **Cache**.

Mình vẽ một sơ đồ đơn giản giúp các bạn dễ hình dung các bước ghi.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/cache-aside-write-9faa322c.png)

**Thao tác đọc:**

1. Ứng dụng đọc dữ liệu từ Cache trước.
2. Nếu trúng (Hit) thì trả về trực tiếp.
3. Nếu trượt (Miss) thì đọc dữ liệu từ DB; sau khi đọc thành công, **ghi dữ liệu ngược lại vào Cache**, rồi trả về.

Mình vẽ một sơ đồ đơn giản giúp các bạn dễ hình dung các bước đọc.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/cache-aside-read-166ab345.png)

Chỉ nắm được những nội dung trên thôi là chưa đủ, chúng ta còn phải hiểu sâu nguyên lý bên trong.

Chẳng hạn, nhà tuyển dụng rất có thể sẽ hỏi vặn thêm:

1. Vì sao thao tác ghi là "cập nhật DB trước, xóa Cache sau"? Đảo ngược thứ tự được không?
2. Vậy "cập nhật DB trước, xóa Cache sau" có an toàn tuyệt đối không?
3. Vì sao lại là "xóa Cache", chứ không phải là "cập nhật Cache"?

Tiếp theo mình sẽ lần lượt phân tích và giải đáp các câu hỏi này.

**1. Vì sao thao tác ghi là "cập nhật DB trước, xóa Cache sau"? Đảo ngược thứ tự được không?**

**Trả lời:** Thông thường không khuyến nghị đảo ngược thứ tự. Nếu chỉ làm "xóa Cache trước, rồi mới cập nhật DB", request đọc đồng thời có thể nạp lại dữ liệu cũ vào Cache.

- **Phân tích dòng thời gian (Request A ghi, Request B đọc):**
  1. Request A: Xóa dữ liệu trong Cache trước.
  2. Request B: Lúc này thấy Cache rỗng, bèn xuống DB đọc **giá trị cũ** và chuẩn bị ghi vào Cache.
  3. Request A: Ghi **giá trị mới** vào DB và commit Transaction.
  4. Request B: Ghi **giá trị cũ** vừa đọc trước đó vào Cache.
- **Kết quả:** Trong DB là giá trị mới, còn trong Cache lại là giá trị cũ — dữ liệu bị mất nhất quán.

**2. Vậy "cập nhật DB trước, xóa Cache sau" có an toàn tuyệt đối không?**

**Trả lời:** Cũng không an toàn tuyệt đối! Vì cách này vẫn có thể gây ra vấn đề **mất nhất quán dữ liệu giữa cơ sở dữ liệu và Cache**.

- **Phân tích dòng thời gian (Request A đọc, Request B ghi):**
  1. Request A: Cache miss, xuống DB đọc được **giá trị cũ**.
  2. Request B: Hoàn tất cập nhật DB và commit Transaction, sau đó xóa Cache.
  3. Request A: Ghi **giá trị cũ** mình lấy được trước đó vào Cache.
- **Kết quả:** Trong DB là giá trị mới, còn trong Cache lại là giá trị cũ.
- **Xác suất xảy ra phụ thuộc vào yếu tố nào?** Điểm mấu chốt là cửa sổ thời gian "đọc DB → ghi Cache" có chồng lấn với request ghi hay không. Truy vấn chậm (slow query), tạm dừng Thread (thread pause) hay độ trễ mạng đều có thể kéo dài cửa sổ này; không thể chỉ dựa vào cảm tính "đọc thường nhanh hơn ghi" mà cho rằng xác suất cực nhỏ.

Thao tác "cập nhật DB trước" ở đây bắt buộc phải bao gồm **Transaction đã commit thành công**. Nếu thực hiện xóa Cache ngay sau khi chạy `UPDATE` bên trong một method có Transaction, trong khi Transaction phải chờ method return mới commit, thì các request khác vẫn có thể đọc phải giá trị cũ trước lúc commit rồi điền bù vào Cache. Callback sau khi commit có thể đảm bảo thứ tự thao tác, nhưng tiến trình vẫn có nguy cơ thoát đột ngột sau khi commit và trước khi chạy callback, do đó vẫn cần tính đến cơ chế bù trừ khi thất bại.

Dữ liệu đọc về từ nguồn gốc có đủ mới hay không cũng rất quan trọng: khi tách đọc-ghi (Read/Write Splitting), Replica có thể chưa áp dụng kịp cập nhật từ Primary; dưới mức cô lập `REPEATABLE READ` của InnoDB, một Transaction kéo dài đã thiết lập Snapshot từ trước cũng có thể tiếp tục đọc phiên bản cũ. Đối với các thao tác backfill nhạy cảm về độ mới dữ liệu, cần đánh giá việc đọc từ Primary bằng một Transaction ngắn mới, tránh đưa Snapshot cũ vào Cache như dữ liệu mới nhất. Quy tắc về Snapshot có thể tham khảo tại [Tài liệu chính thức của MySQL](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html).

**3. Vì sao lại là "xóa Cache", chứ không phải là "cập nhật Cache"?**

- **Chi phí hiệu năng:** Thao tác ghi thường chỉ sửa một phần trường của đối tượng; nếu để "cập nhật Cache" mà phải truy vấn lại hoặc tính toán lại toàn bộ đối tượng Cache thì chi phí có thể rất lớn. So với đó, "xóa" là một thao tác nhẹ nhàng hơn nhiều.
- **Tư tưởng Lazy Loading:** Thao tác "xóa" tuân theo nguyên lý nạp lười (Lazy Loading). Chỉ đến lần tiếp theo dữ liệu thực sự cần dùng (được đọc) mới kích hoạt việc tải từ DB và ghi vào Cache, tránh được các cập nhật Cache vô ích.
- **Tránh ghi đè khi ghi đồng thời:** Giả sử A commit phiên bản 1, B commit phiên bản 2 ngay sau đó và hoàn thành cập nhật Cache trước; nếu lệnh cập nhật Cache của A đến sau cùng, nó sẽ ghi đè Cache quay ngược về phiên bản 1. Xóa Cache không mang theo giá trị cũ nên tránh được kiểu ghi đè trực tiếp này, nhưng vẫn phải xử lý bài toán dữ liệu cũ bị backfill như đã đề cập ở trên.

Khi áp dụng mô hình này, cần đáp ứng hai điều kiện tiên quyết: dữ liệu Cache có thể tái tạo lại từ cơ sở dữ liệu, và luồng đọc có khả năng truy vấn về nguồn gốc khi Cache miss; đồng thời nghiệp vụ chấp nhận được một khoảng cửa sổ đọc dữ liệu cũ nhất định. Cửa sổ này có thể xảy ra sau khi commit nhưng trước khi xóa Cache, hoặc do xóa thất bại hay backfill giá trị cũ, và không nhất thiết phải ngắn. [Bản thân Cache Aside không đảm bảo Cache và cơ sở dữ liệu luôn nhất quán ở mọi thời điểm](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).

**4. Xóa thất bại và backfill giá trị cũ xử lý riêng như thế nào?**

- **Xóa thất bại phải có cơ chế thử lại có thể khôi phục.** Có thể giao tác vụ vô hiệu hóa cho Message Queue hoặc tác vụ chạy nền, nhưng "commit DB rồi mới gửi message" vẫn có nguy cơ sập giữa hai bước. Khi cần liên kết đáng tin cậy, có thể áp dụng Transactional Outbox: ghi nhận sự kiện chờ xử lý trong cùng Transaction cập nhật dữ liệu nghiệp vụ của cơ sở dữ liệu, sau khi commit sẽ do tác vụ nền gửi đi; hoặc dùng CDC để đăng ký theo dõi các thay đổi đã commit của cơ sở dữ liệu nhằm kích hoạt vô hiệu hóa. Việc consumer thực hiện xóa lặp lại thông thường là an toàn (tính lũy đẳng), đồng thời cần giám sát tồn đọng, lỗi sau nhiều lần retry và cung cấp điểm bù trừ thủ công. Có thể tham khảo [Hướng dẫn của AWS về Transactional Outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).
- **Backfill giá trị cũ không thể chỉ dựa vào retry xóa để giải quyết.** Thao tác xóa có thể đã thành công từ lâu, nhưng request cũ lại ghi vào Cache sau đó. Trì hoãn rồi xóa thêm một lần nữa (xóa kép có độ trễ — delayed double delete) có thể dọn bớt một phần backfill đến muộn, nhưng độ trễ cố định không thể bao phủ các trường hợp request bị treo, Transaction hoặc độ trễ Replication kéo dài bất kỳ, và bản thân lần xóa thứ hai cũng có thể thất bại. Do đó, xóa kép có độ trễ chỉ thu hẹp rủi ro chứ không thể xem là cam kết nhất quán mạnh (strong consistency).
- **TTL là lưới an toàn cuối cùng, không phải giao thức đồng bộ.** Sau khi hết hạn cần nạp lại từ cơ sở dữ liệu; nếu vẫn backfill từ Replica bị trễ hoặc Snapshot cũ, dữ liệu cũ sẽ lại được cấp thêm một khoảng TTL mới. Cũng không được gia hạn TTL mỗi lần đọc giá trị cũ, nếu không dữ liệu cũ có thể tồn tại mãi mãi. TTL nên được xác định dựa trên thời gian dữ liệu cũ tối đa mà nghiệp vụ chấp nhận được và áp lực truy vấn nguồn gốc.

Khi nghiệp vụ cần kiểm soát chặt chẽ hơn việc backfill đồng thời, có thể thiết kế giao thức loại trừ lẫn nhau (mutex) hoặc kiểm tra phiên bản bao phủ cả luồng đọc và luồng ghi liên quan. Chỉ khóa request ghi sẽ không ngăn được request đọc không khóa thực hiện backfill; chỉ so sánh phiên bản hiện tại trong Cache cũng không thể nhận diện giá trị cũ đến muộn khi key trong Cache đã bị xóa, mà cần lưu thêm các thông tin độc lập như mốc phiên bản (version watermark). **Cả khóa Redis lẫn Lua script đều không thể tự động biến hai thao tác ghi vào Redis và MySQL thành một Transaction nguyên tử.** Với các nghiệp vụ bắt buộc phải đọc trạng thái đã commit mới nhất, cần quy định rõ đường dẫn đọc chuẩn (authoritative read path) và yêu cầu cô lập của cơ sở dữ liệu.

Bây giờ chúng ta hãy phân tích tiếp **nhược điểm của Cache Aside Pattern**.

**Nhược điểm 1: Request đầu tiên dữ liệu chắc chắn không có trong Cache**

Cách giải quyết: Đối với dữ liệu nóng (hot data) có lượng truy cập cực lớn, có thể làm nóng Cache trước (Cache Warm-up) lúc khởi động hệ thống hoặc vào giờ thấp điểm.

**Nhược điểm 2: Nếu thao tác ghi diễn ra thường xuyên sẽ khiến dữ liệu trong Cache bị xóa liên tục, làm giảm tỷ lệ Cache Hit.**

Cách giải quyết:

- Trước tiên đánh giá xem dữ liệu này có phù hợp để Cache hay không. Khi tần suất đọc và ghi gần tương đương nhau mà chi phí tái tạo lại thấp, truy vấn thẳng cơ sở dữ liệu có thể đơn giản hơn.
- Nếu thực sự cần chủ động cập nhật Cache, phải xử lý thứ tự cập nhật đồng thời và cơ chế bù trừ khi lỗi, đồng thời đặt TTL hợp lý. Khóa hoặc kiểm soát phiên bản có thể giải quyết một phần vấn đề đồng thời, nhưng không thể bỏ qua việc xử lý sự cố liên hệ thống đã thảo luận ở trên.

### Read/Write Through Pattern (Đọc/Ghi xuyên suốt)

Trong mô hình này, ứng dụng coi **Cache là nơi lưu trữ duy nhất và chính yếu**. Mọi request đọc và ghi đều đi thẳng vào Cache, còn bản thân dịch vụ Cache tự chịu trách nhiệm đồng bộ dữ liệu với DB.

Cơ chế này **trong suốt (transparent)** đối với ứng dụng — lập trình viên ứng dụng không cần quan tâm đến sự tồn tại của DB.

Chắc các bạn cũng nhận ra chiến lược đọc ghi Cache này rất hiếm gặp trong quá trình phát triển thực tế. Bỏ qua yếu tố ảnh hưởng hiệu năng, phần lớn là vì Redis — Distributed Cache chúng ta hay dùng — vốn không cung cấp sẵn tính năng để Cache tự ghi dữ liệu xuống DB, mà chúng ta phải tự triển khai ở phía nghiệp vụ hoặc tầng middleware.

**Ghi (Write Through):**

- Kiểm tra Cache trước; nếu không tồn tại trong Cache thì cập nhật thẳng DB.
- Nếu tồn tại trong Cache thì cập nhật Cache trước, sau đó bản thân dịch vụ Cache tự cập nhật DB. Chỉ khi cả Cache và DB đều ghi thành công mới trả về thành công cho tầng trên.

Mình vẽ một sơ đồ đơn giản giúp các bạn dễ hình dung các bước ghi.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/write-through-0c128aa9.png)

**Đọc (Read Through):**

- Ứng dụng đọc dữ liệu từ Cache.
- Nếu hit thì trả về trực tiếp.
- Nếu miss thì **chính dịch vụ Cache** chịu trách nhiệm tải dữ liệu từ DB; sau khi tải thành công sẽ ghi vào chính nó trước rồi mới trả về cho ứng dụng.

Mình vẽ một sơ đồ đơn giản giúp các bạn dễ hình dung các bước đọc.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/read-through-12212d89.png)

Read-Through thực chất chỉ là lớp đóng gói (wrapper) đặt phía trên Cache-Aside. Trong Cache-Aside, khi xảy ra request đọc mà Cache không có dữ liệu tương ứng, phía client tự chịu trách nhiệm ghi dữ liệu vào Cache; còn với Read-Through, chính dịch vụ Cache tự thực hiện việc ghi vào Cache, hoàn toàn trong suốt với client.

Xét từ góc độ triển khai, Read-Through về bản chất là đưa logic "Đọc Miss → Đọc DB → Backfill Cache" của Cache-Aside xuống tầng bên trong của dịch vụ Cache, trong suốt với client.

Giống như Cache Aside, Read-Through cũng gặp vấn đề request đầu tiên chắc chắn không có trong Cache; đối với dữ liệu nóng có thể đưa trước vào Cache.

### Write Behind Pattern (Ghi Cache bất đồng bộ)

Write Behind (còn thường gọi là Write-Back) Pattern rất giống với Read/Write Through Pattern — cả hai đều do dịch vụ Cache đảm nhận việc đọc ghi giữa Cache và DB.

Tuy nhiên, giữa hai mô hình có một khác biệt rất lớn: **Read/Write Through là cập nhật đồng bộ cả Cache và DB, còn Write Behind chỉ cập nhật Cache, không cập nhật DB ngay mà chuyển sang cập nhật DB theo lô một cách bất đồng bộ (asynchronous batching).**

**Thao tác ghi (Write Behind):**

1. Ứng dụng ghi dữ liệu vào Cache rồi **trả về ngay lập tức**.
2. Dịch vụ Cache đưa thao tác ghi này vào một hàng đợi (queue).
3. Thông qua một Thread/tác vụ bất đồng bộ độc lập, các thao tác ghi trong hàng đợi được **gom lô, gộp nhóm** và ghi xuống DB.

Mô hình này đặt ra thách thức lớn về tính nhất quán dữ liệu (ví dụ: dữ liệu trong Cache chưa kịp ghi xuống DB thì hệ thống bị sập), do đó không phù hợp cho các kịch bản đòi hỏi tính nhất quán mạnh (như giao dịch tài chính, tồn kho).

Tuy nhiên, đặc tính bất đồng bộ và gom lô của nó mang lại **hiệu năng ghi vượt trội**. Nó được ứng dụng rộng rãi trong rất nhiều hệ thống hiệu năng cao:

- **Cơ chế InnoDB Buffer Pool của MySQL:** Thay đổi dữ liệu được thực hiện trong Buffer Pool trên bộ nhớ trước, sau đó được Thread chạy nền đẩy bất đồng bộ (flush) xuống đĩa.
- **Page Cache của hệ điều hành:** Thao tác ghi file cũng được ghi vào bộ nhớ trước, rồi hệ điều hành mới xả xuống đĩa một cách bất đồng bộ.
- **Kịch bản bộ đếm tần suất cao:** Với những kịch bản cho phép dữ liệu mất nhất quán tạm thời nhưng tần suất ghi cực cao như lượt xem bài viết, lượt thích bài đăng, có thể cộng dồn nhanh trong Redis trước, rồi đồng bộ bất đồng bộ về cơ sở dữ liệu thông qua tác vụ định kỳ.
