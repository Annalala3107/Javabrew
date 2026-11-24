---
title: "Giải thích chi tiết Bài toán Các vị tướng Byzantine: Đồng thuận phân tán, 3m+1 Node và Khả năng chịu lỗi BFT"
description: "Giải thích chi tiết Bài toán Các vị tướng Byzantine, bao gồm lỗi Byzantine, đồng thuận phân tán (Distributed Consensus), tính an toàn (Safety) và tính sống (Liveness), mô hình thông điệp miệng OM(m), thông điệp có chữ ký, yêu cầu 3m+1 node, sự khác biệt giữa CFT và BFT, cùng ứng dụng trong Blockchain."
category: Hệ thống phân tán
tag:
  - Giao thức & Thuật toán phân tán
  - Thuật toán đồng thuận
  - BFT
head:
  - - meta
    - name: keywords
      content: Bài toán các vị tướng Byzantine,Byzantine Fault Tolerance,BFT,PBFT,đồng thuận phân tán,thuật toán đồng thuận,3m+1,OM(m),Signed Messages,CFT,đồng thuận blockchain,hệ thống phân tán
lang: vi
sourceRef: zh-ref/distributed-system/protocol/byzantine-generals-problem.md
---

Nhiều node dịch vụ đều khăng khăng mình đúng — vậy phía client nên tin ai?

Trong các hệ thống Backend thông thường, bài toán này hiếm khi cực đoan đến mức đó. Redis Replication (Master-Slave), ZooKeeper, etcd, Nacos hay sao chép cơ sở dữ liệu thường gặp lỗi sập máy (crash), mạng chập chờn, hỏng ổ đĩa hoặc khởi động lại tiến trình (process). Các node nhìn chung không cố tình lừa bạn; chúng chỉ ngừng phản hồi, phản hồi chậm hoặc tạm thời mất kết nối khỏi cụm.

Bài toán Các vị tướng Byzantine (Byzantine Generals Problem) bàn về một lớp tình huống phức tạp hơn nhiều: **trong hệ thống có những node hành xử khó lường, thậm chí có thể gửi những thông tin mâu thuẫn nhau tới các đối tượng khác nhau**.

Đó chính là giá trị của bài toán này trong hệ thống phân tán. Câu chuyện quân sự cổ đại chỉ là phương tiện diễn đạt; điều cốt lõi muốn nói tới là "làm sao đạt được sự đồng thuận giữa các thành viên không đáng tin cậy".

Nếu bạn đang tìm hiểu các hệ thống điều phối phổ biến như Raft, ZAB, ZooKeeper, etcd, trước tiên cần phân biệt rõ hai mô hình lỗi: chúng thường xử lý lỗi sập máy (Crash Fault) và phân vùng mạng (Network Partition) mà không giả định node cố ý nói dối; còn bài toán Byzantine xem xét một mô hình lỗi khắc nghiệt hơn. Nếu muốn tìm hiểu đồng thuận trong bối cảnh phi Byzantine, bạn có thể đọc tiếp [Giải thích chi tiết Thuật toán Raft](./raft-algorithm.md) và [Giải thích chi tiết Giao thức ZAB](./zab.md).

## Bài toán Các vị tướng Byzantine là gì?

Bài toán Các vị tướng Byzantine được Leslie Lamport, Robert Shostak và Marshall Pease đề xuất trong bài báo [The Byzantine Generals Problem](https://www.microsoft.com/en-us/research/publication/byzantine-generals-problem/) công bố năm 1982 trên tạp chí ACM Transactions on Programming Languages and Systems (tháng 7 năm 1982).

Lamport là cái tên không thể bỏ qua trong lĩnh vực hệ thống phân tán. Ông đã giành giải thưởng ACM A.M. Turing Award năm 2013 nhờ những đóng góp nền tảng cho hệ thống phân tán và hệ thống đồng thời, đồng thời cũng là cha đẻ của hệ thống soạn thảo tài liệu LaTeX.

Phiên bản câu chuyện của bài toán đại khái như sau:

Nhiều vị tướng Byzantine dẫn các đạo quân riêng biệt bao vây một thành trì của địch. Các cánh quân đóng ở những vị trí tách rời nhau, các vị tướng không thể gặp mặt trực tiếp để họp bàn mà chỉ có thể truyền tin qua lính đưa thư. Họ cần quyết định ngày mai sẽ tấn công hay rút lui. Nếu đánh đơn lẻ chắc chắn sẽ thất bại; chỉ khi đủ nhiều đạo quân cùng hành động thì mới có cơ hội thắng.

Điều rắc rối là trong số các vị tướng có thể có kẻ phản bội.

Kẻ phản bội không chỉ đơn thuần là "không chấp hành mệnh lệnh". Hắn có thể nói với tướng A là tấn công, nói với tướng B là rút lui; hoặc bịa đặt thông tin mà hắn nghe được nhằm đánh lừa các vị tướng trung thành đưa ra quyết định trái ngược nhau. Đặt vào hệ thống máy tính, hành vi tương tự không nhất thiết xuất phát từ ác ý chủ quan, mà có thể đến từ lỗi phần mềm, hỏng trạng thái (state corruption), lỗi bộ nhớ/ổ đĩa, hoặc node bị xâm nhập dẫn đến hành vi bất thường. Cuối cùng, nếu một số tướng trung thành tấn công trong khi số khác lại rút lui, toàn bộ kế hoạch tác chiến sẽ sụp đổ.

Ánh xạ sang hệ thống phân tán: các vị tướng là các node, lính đưa thư là các thông điệp mạng, còn tấn công/rút lui là một giá trị nào đó cần đạt được sự đồng thuận, chẳng hạn:

- Node nào trở thành Leader?
- Bản ghi log nào đó có được commit hay không?
- Giao dịch (Transaction) nào đó có hợp lệ hay không?
- State Machine tiếp theo sẽ thực thi lệnh nào?

Vì vậy, bài toán này có thể chuyển sang ngôn ngữ kỹ thuật như sau:

> Trong trường hợp một phần node có thể gặp lỗi, nói dối, giả mạo thông tin hoặc gửi thông điệp mâu thuẫn, làm thế nào để tất cả các node bình thường đều đạt được sự đồng thuận trên cùng một kết quả?

![Bối cảnh cơ bản của Bài toán Các vị tướng Byzantine](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-problem-overview-6ec36198.png)

Ở đây cần làm rõ một chi tiết. Nhiều tài liệu thường gộp cả việc lính đưa thư bị giết, mất thông điệp hay bị sửa nội dung vào câu chuyện để dễ hình dung "giao tiếp không đáng tin cậy". Tuy nhiên, mô hình "thông điệp miệng" (Oral Messages) trong bài báo của Lamport lại giả định hệ thống truyền tin thỏa mãn vài điều kiện nhằm phục vụ chứng minh hình thức: mọi thông điệp đã gửi đều được chuyển tới chính xác, người nhận biết rõ ai là người gửi và việc không nhận được thông điệp có thể được phát hiện.

Do đó, điểm khó cốt lõi mà bài báo thực sự giải quyết còn đi xa hơn việc "mạng có thể mất gói tin": **chính người gửi thông điệp có thể giở trò phá hoại**.

## Đạt được đồng thuận rốt cuộc phải thỏa mãn điều gì?

Trong Bài toán Các vị tướng Byzantine có một Tổng chỉ huy (Commander) và nhiều Phó tướng (Lieutenant). Tổng chỉ huy cần gửi lệnh tấn công hoặc rút lui cho các Phó tướng, và hệ thống kỳ vọng thỏa mãn hai điều kiện:

- **Tính nhất quán (Agreement)**: Tất cả các Phó tướng trung thành cuối cùng phải thực thi cùng một mệnh lệnh.
- **Tính hợp lệ (Validity)**: Nếu Tổng chỉ huy là người trung thành, thì mọi Phó tướng trung thành đều phải thực thi đúng mệnh lệnh do Tổng chỉ huy phát ra.

Điều kiện thứ nhất yêu cầu tập thể không bị chia rẽ. Điều kiện thứ hai đảm bảo hệ thống không vì đề phòng kẻ phản bội mà làm thất lạc mệnh lệnh đúng đắn của một Tổng chỉ huy trung thành.

Nói một cách chặt chẽ, mô hình Tổng chỉ huy – Phó tướng trong bài báo của Lamport gần với bài toán **Byzantine Broadcast** hoặc **Interactive Consistency** hơn. Nó liên quan mật thiết đến đồng thuận tổng quát nhưng giao diện không hoàn toàn giống nhau: đồng thuận tổng quát thường cho phép mọi node đều đề xuất giá trị ban đầu và yêu cầu các node bình thường chốt cùng một giá trị; trong khi mô hình Tổng chỉ huy – Phó tướng chỉ có một Tổng chỉ huy phát lệnh, còn các Phó tướng chịu trách nhiệm phán đoán xem phải thực thi lệnh nào.

Trong bài toán đồng thuận phân tán tổng quát hơn, người ta còn quan tâm đến tính kết thúc (Termination), tức các node bình thường cuối cùng phải đưa ra được quyết định chứ không thể chờ đợi vô hạn. Một số định nghĩa còn bổ sung tính toàn vẹn (Integrity): một node chỉ được phép chốt quyết định tối đa một lần. Trong các hệ thống thực tế, những cơ chế như Timeout, Retry, vòng bầu chọn (Election Round) và chuyển đổi góc nhìn (View Change) đều phục vụ mục tiêu này.

![Minh họa biểu quyết đa số của các node trung thành](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-honest-majority-ead9b7c7.png)

Bây giờ hãy thu gọn bài toán trở lại câu chuyện các vị tướng. Giả sử chỉ có 3 vị tướng A, B, C, trong đó A là Tổng chỉ huy, B và C là Phó tướng. Chỉ cần 1 người là kẻ phản bội, mọi thứ sẽ bế tắc ngay lập tức.

Từ góc nhìn cục bộ của Phó tướng trung thành B, hai quá trình thực thi dưới đây hoàn toàn giống hệt nhau:

- A là kẻ phản bội: A nói với B "Tấn công", nói với C "Rút lui"; C trung thành thuật lại với B rằng A nói "Rút lui".
- C là kẻ phản bội: A là Tổng chỉ huy trung thành, nói với cả B và C là "Tấn công"; nhưng C lại nói dối B rằng A bảo "Rút lui".

Trong cả hai tình huống, những gì B thấy đều là: A trực tiếp bảo mình "Tấn công", còn C thuật lại là A bảo "Rút lui". Nếu chỉ nhìn vào các thông điệp mình nhận được, B không thể nào phân biệt được A đang lừa mình hay C đang nói dối.

Đó chính là điểm nan giải của kịch bản 3 tướng 1 phản đồ. Các node trung thành không hề thiếu quy tắc bỏ phiếu; thứ họ thực sự thiếu là thông tin để phán đoán "ai đang nói dối". Nếu dựng kịch bản đối xứng cho Phó tướng trung thành còn lại, hai Phó tướng trung thành sẽ bị đẩy về hai quyết định trái ngược nhau, rốt cuộc vi phạm tính nhất quán (Agreement). Bài báo của Lamport từng lưu ý rằng dạng bài toán này rất dễ bị đánh lừa bởi những phép chứng minh theo trực giác; bài báo cuối cùng chứng minh bằng quy giản rằng: nếu chỉ dùng thông điệp miệng, để chịu được tối đa `m` kẻ phản bội thì cần ít nhất `3m + 1` vị tướng. Nói cách khác, số tướng trung thành phải vượt quá `2/3` tổng số tướng.

![Ba vị tướng không thể chịu nổi một kẻ phản bội](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-three-general-impossi-fcb399f6.png)

Để chịu được 1 kẻ phản bội cần ít nhất 4 vị tướng; để chịu được 2 kẻ phản bội cần ít nhất 7 vị tướng.

## Nhất quán không có nghĩa là chắc chắn tiếp tục chạy được

Khi học các giao thức đồng thuận, cần tách bạch hai tính chất:

- **Tính an toàn (Safety)**: Không bao giờ được chốt hai kết quả mâu thuẫn nhau.
- **Tính sống (Liveness)**: Hệ thống cuối cùng vẫn có thể tiếp tục tiến triển và đưa ra quyết định.

Nhiều giao thức khi gặp bất thường sẽ ưu tiên bảo vệ Safety trước. Chẳng hạn khi cụm Raft không gom đủ đa số phiếu (Majority/Quorum), nó sẽ ngừng commit log mới thay vì để hai phân vùng mạng tự ý commit hai nhóm log xung đột nhau. Dừng tiến triển sẽ ảnh hưởng đến tính sẵn sàng (Availability), nhưng ít nhất không làm hỏng trạng thái dữ liệu.

Trong hệ thống bất đồng bộ hoàn toàn (completely asynchronous system), độ trễ thông điệp không có cận trên. Chỉ dựa vào Timeout thì không thể phán đoán chặt chẽ được một node thực sự đã sập hay chỉ đang phản hồi hơi chậm. Kết quả bất khả thi FLP (FLP Impossibility) chỉ ra thêm rằng: trong mô hình bất đồng bộ hoàn toàn, ngay cả khi chỉ có một tiến trình có khả năng sập (Crash), mọi giao thức đồng thuận tất định đều tồn tại kịch bản thực thi không thể kết thúc.

Vì vậy, các hệ thống thực tế thường bổ sung giả định hoặc cơ chế phụ trợ để khôi phục Liveness, chẳng hạn như tính đồng bộ cuối cùng (Eventual Synchrony), ngẫu nhiên hóa (Randomization), bộ phát hiện lỗi (Failure Detector), thử lại (Retry) và chuyển View (View Change). Về sau khi nói PBFT có thể chạy trên mạng bất đồng bộ như Internet, cũng cần hiểu theo hướng này: Safety và Liveness không phải là cùng một cam kết.

![Tính an toàn và Tính sống trong các giao thức đồng thuận](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-safety-liveness-83535db0.png)

## Thông điệp miệng: Tại sao cần 3m + 1?

Bài báo của Lamport trước tiên bàn về **Oral Messages** (thông điệp miệng).

Mô hình thông điệp miệng có 3 tiền đề:

1. Mọi thông điệp đã gửi sẽ được truyền tới chính xác.
2. Người nhận biết rõ thông điệp đó do ai gửi tới.
3. Việc không nhận được thông điệp có thể được phát hiện.

Những giả định này đã mạnh hơn mạng thực tế rất nhiều. Trong hệ thống thật, thông điệp có thể mất, độ trễ khó lường, và việc kiểm tra xem một node thực sự chết hay chỉ chậm thường chỉ có thể ước lượng bằng Timeout.

Ngay cả dưới các giả định khá mạnh này, chừng nào thông điệp chưa có chữ ký, kẻ phản bội vẫn có thể nói với mỗi người một kiểu. Để triệt tiêu điều đó, giao thức yêu cầu các Phó tướng thuật lại cho nhau mệnh lệnh mình nghe được, và phơi bày sự mâu thuẫn qua nhiều vòng truyền tin.

Thuật toán thông điệp miệng thường được ký hiệu là `OM(m)`, trong đó `m` biểu thị số lượng kẻ phản bội tối đa.

Khi `m = 0`, quy trình rất đơn giản: Tổng chỉ huy gửi lệnh tới từng Phó tướng, Phó tướng làm theo lệnh đó.

Khi `m > 0`, quy trình sẽ triển khai theo dạng đệ quy:

1. Tổng chỉ huy gửi lệnh tới tất cả các Phó tướng.
2. Mỗi Phó tướng chuyển tiếp mệnh lệnh mình nhận được tới các Phó tướng khác.
3. Nếu cần chịu thêm nhiều kẻ phản bội hơn, các node nhận được tin thuật lại tiếp tục chuyển tiếp ra ngoài.
4. Cuối cùng, mỗi Phó tướng trung thành áp dụng cùng một hàm `majority` tất định lên tập giá trị nhận được; nếu không có giá trị chiếm đa số, có thể dùng giá trị mặc định — trong bài báo, giá trị mặc định là Rút lui. Bài báo cũng đề cập rằng nếu miền giá trị có thứ tự, có thể lấy trung vị (median). Điểm mấu chốt là mọi Phó tướng trung thành phải dùng chung một quy tắc tất định.

![Truyền đạt nhiều vòng trong mô hình Thông điệp miệng OM(m)](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-oral-messages-cd73f1c7.png)

Có thể dùng `m = 1` để xem vì sao thuật toán này cần tới 4 vị tướng.

Giả sử A là Tổng chỉ huy, B, C, D là Phó tướng, và hệ thống có tối đa 1 kẻ phản bội. Nếu A là kẻ phản bội, hắn có thể gửi lệnh Tấn công cho B, nhưng lại gửi lệnh Rút lui cho C và D. Tiếp theo, B, C, D sẽ thuật lại cho nhau nghe mệnh lệnh mà mình nhận từ A:

- B nói với C, D: A bảo tôi Tấn công.
- C nói với B, D: A bảo tôi Rút lui.
- D nói với B, C: A bảo tôi Rút lui.

Đối với B, thứ anh ta nhìn thấy là "Tấn công, Rút lui, Rút lui", đa số là Rút lui. C và D cũng nhìn thấy kết quả đa số y hệt như vậy. Nhờ đó, ngay cả khi Tổng chỉ huy A giở trò, các Phó tướng trung thành vẫn có thể đạt được sự đồng thuận.

Điểm mấu chốt ở đây không chỉ là "thiểu số phục tùng đa số". Nếu Tổng chỉ huy trung thành, các Phó tướng trung thành sẽ nhận và chuyển tiếp cùng một giá trị, phe trung thành tạo thành đa số, từ đó đảm bảo Validity. Nếu Tổng chỉ huy là kẻ phản bội, vai trò quan trọng hơn của giao thức là giúp tất cả các Phó tướng trung thành thu được cùng một vector giá trị, rồi áp dụng chung một hàm `majority` lên vector đó, qua đó đảm bảo Agreement.

Khi số lượng node không đủ, thông tin cục bộ mà các node trung thành nhìn thấy không thể phân biệt nổi các kịch bản lỗi khác nhau, lúc đó quy tắc bỏ phiếu có hay đến mấy cũng vô dụng.

Tuy nhiên, `OM(m)` giống một thuật toán lý thuyết giúp hiểu bản chất kết luận hơn, không phù hợp để bê thẳng vào hệ thống nghiệp vụ. Nó đòi hỏi phải biết trước giới hạn kẻ phản bội `m`, phải chuyển tiếp đệ quy qua nhiều vòng, khiến lưu lượng thông điệp phình to cực nhanh theo số node và mức chịu lỗi. Các hệ thống thực tế thường đổi sang những giao thức mang tính kỹ thuật tối ưu hơn.

## Thông điệp có chữ ký: Có chữ ký rồi thì bài toán có đơn giản đi không?

Bài báo tiếp tục thảo luận về **Signed Messages** (thông điệp có chữ ký).

Thông điệp có chữ ký bổ sung hai năng lực dựa trên nền tảng thông điệp miệng:

- Chữ ký của vị tướng trung thành không thể bị làm giả, và bất kỳ chỉnh sửa nào lên nội dung thông điệp đều bị phát hiện.
- Bất kỳ ai cũng có thể xác minh chữ ký đó có đúng là của vị tướng tương ứng hay không.

Khi có chữ ký, kẻ phản bội vẫn có thể nói dối, nhưng hắn rất khó thay mặt các node trung thành để nói dối. Nếu B nhận được một thông điệp nói rằng "C bảo A ra lệnh cho mọi người Rút lui", B có thể kiểm tra xem thông điệp đó có chữ ký của C hay không, đồng thời kiểm tra lệnh của A được thuật lại bên trong có chữ ký của A hay không.

Điều này tước đi năng lực rắc rối nhất của kẻ phản bội: bịa ra nhiều phiên bản khác nhau với từng người mà người khác lại không thể truy vết.

Chữ ký giải quyết bài toán xác thực nguồn gốc và tính toàn vẹn thông điệp, chứ không đảm bảo người ký là trung thực. Một Tổng chỉ huy phản bội vẫn có thể tự tay ký hai mệnh lệnh mâu thuẫn nhau; điểm khác biệt là cả hai mệnh lệnh đó đều để lại bằng chứng xác thực được, các node khác có thể tiếp tục chuyển tiếp các bằng chứng này để mọi Phó tướng trung thành cuối cùng đều nhìn thấy cùng một tập thông tin mâu thuẫn.

Dưới mô hình thông điệp có chữ ký, Lamport đưa ra thuật toán `SM(m)`. Nó có thể thỏa mãn IC1 và IC2 khi tồn tại tối đa `m` kẻ phản bội mà không còn cần tới `3m + 1` node như mô hình thông điệp miệng nữa. Bài báo gốc cũng chỉ ra rằng nếu tổng số node ít hơn `m + 2`, bài toán trở nên tầm thường (trivial), bởi lúc đó hệ thống có thể thậm chí không có nổi 2 vị tướng trung thành, nên việc bàn đến đồng thuận giữa các node trung thành mất hết ý nghĩa. Vì vậy, `n >= m + 2` nên được hiểu là "tồn tại ít nhất hai node trung thành để bài toán có ý nghĩa thực tế", đừng nhầm nó thành cận dưới chịu lỗi cùng loại với `3m + 1`.

`SM(m)` ở bước cuối cũng không phải biểu quyết đa số đơn thuần. Mỗi Phó tướng trung thành duy trì một tập hợp `V` chứa các mệnh lệnh đã nhận, rồi thực thi hàm `choice(V)` tất định đã thống nhất từ trước. Nếu Tổng chỉ huy phản bội ký cả hai lệnh "Tấn công" và "Rút lui", các Phó tướng trung thành cuối cùng đều lấy được tập hợp giống nhau, áp dụng cùng hàm `choice` lên tập hợp này, kết quả tự nhiên sẽ khớp nhau.

![Lan truyền thông tin trong mô hình Thông điệp có chữ ký SM(m)](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-signed-messages-fc1feabe.png)

Điều này không đồng nghĩa mọi hệ thống BFT ngoài thực tế chỉ cần `m + 2` node là đủ. Nội dung vừa bàn là bài toán Interactive Consistency một lần dưới mô hình đặc thù của bài báo Lamport. Hệ thống thực tế còn phải đối mặt với mạng bất đồng bộ, hiệu năng, request từ client, sao chép máy trạng thái (State Machine Replication), View Change, client độc hại, tấn công phát lại (Replay Attack)... Bài báo gốc cũng từng nhắc rằng nếu phải chạy `SM(m)` lặp đi lặp lại, cần gắn số thứ tự (Sequence Number) vào giá trị để tránh thông điệp đã ký cũ bị phát lại. Các giao thức thực tế như PBFT vẫn thường dùng `3f + 1` bản sao (replica) để chịu được tối đa `f` node lỗi Byzantine.

Chỗ này rất dễ gây nhầm lẫn: chữ ký giúp "ai đã nói gì" trở nên kiểm chứng được, nhưng nó không xóa bỏ được yêu cầu giao nhau của Quorum, độ trễ thông điệp không giới hạn hay các vấn đề của State Machine Replication.

## Lỗi Byzantine và lỗi thông thường khác nhau thế nào?

Trong kỹ thuật Backend người ta thường hay nói đến lỗi (Fault), nhưng lỗi có nhiều cấp độ khác nhau.

| Loại lỗi                                | Biểu hiện điển hình                                                    | Giải thích                                                        |
| --------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Lỗi sập máy (Crash Fault)               | Tiến trình dừng hoạt động, máy sập                                     | Node không tiếp tục thực thi nữa                                  |
| Lỗi mất/trễ thông điệp (Omission/Timing Fault) | Mất gói tin, độ trễ cao, phân vùng mạng, phản hồi quá chậm             | Node có thể vẫn sống, nhưng giao tiếp không hoàn tất như kỳ vọng  |
| Lỗi Byzantine (Byzantine Fault)         | Gửi thông tin mâu thuẫn, tính toán sai, hỏng trạng thái, phá hoại có chủ đích | Hành vi có thể sai lệch tùy ý so với giao thức                    |

![Lỗi Crash, lỗi Omission/Timing và lỗi Byzantine](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-fault-models-1b828256.png)

Paxos, Raft, ZAB thường thuộc phạm trù CFT (Crash Fault Tolerance — Chịu lỗi sập máy). Chúng giả định các node không cố tình giở trò xấu, cùng lắm là không phản hồi, phản hồi chậm, mất mạng hoặc sập máy. Lấy Raft làm ví dụ, tài liệu giới thiệu chính thức của Raft nêu một con số điển hình: cụm gồm 5 server vẫn tiếp tục làm việc bình thường khi 2 server gặp sự cố; nếu nhiều hơn nữa bị lỗi, hệ thống sẽ ngừng tiến triển chứ không trả về kết quả sai.

BFT (Byzantine Fault Tolerance — Chịu lỗi Byzantine) xử lý mô hình lỗi mạnh hơn. Node có thể vẫn sống và giao tiếp bình thường, nhưng nội dung nó phát ra không đáng tin cậy. PBFT là giao thức sao chép máy trạng thái chịu lỗi Byzantine mang tính thực tiễn kinh điển. Castro và Liskov trong bài báo OSDI năm 1999 [Practical Byzantine Fault Tolerance](https://www.usenix.org/conference/osdi-99/practical-byzantine-fault-tolerance) đã hiện thực hóa một dịch vụ NFS chịu lỗi Byzantine mà ở trạng thái bình thường chỉ chậm hơn 3% so với NFS chuẩn không sao chép.

PBFT cho phép thông điệp mạng bị mất, trễ, trùng lặp và đảo thứ tự, đồng thời cho phép các node lỗi hành xử sai lệch tùy ý khỏi giao thức. Tính an toàn (Safety) của nó không phụ thuộc vào giả định đồng bộ: ngay cả khi mạng bất ổn kéo dài, các bản sao bình thường cũng không bao giờ commit các thao tác xung đột nhau. Tuy nhiên, tính sống (Liveness) của nó phụ thuộc vào điều kiện đồng bộ cuối cùng tương đối yếu — các node và thông điệp bình thường không thể bị trễ vô thời hạn.

Trong mô hình chuẩn, PBFT dùng `3f + 1` bản sao để chịu tối đa `f` lỗi Byzantine. Chữ ký số và MAC dùng để xác thực thông điệp, chống giả mạo và phát lại; còn `3f + 1` dùng để đảm bảo phần giao nhau giữa các tập Quorum luôn chứa đủ số node bình thường. Hai yếu tố này giải quyết hai vấn đề khác nhau.

Có thể so sánh sơ bộ các mô hình phổ biến như sau:

| Mô hình                        | Số lỗi chịu được      | Số bản sao tối thiểu thường gặp | Nguyên nhân cốt lõi                                               |
| ------------------------------ | --------------------- | ------------------------------- | ----------------------------------------------------------------- |
| CFT                            | `f` lỗi sập máy       | `2f + 1`                        | Các node còn lại vẫn phải đủ tạo thành đa số (Majority)           |
| BFT State Machine Replication kinh điển | `f` lỗi Byzantine     | `3f + 1`                        | Phần giao của hai tập Quorum `2f + 1` luôn chứa ít nhất `f + 1` node bình thường |
| Mô hình Thông điệp có chữ ký của Lamport | `m` kẻ phản bội       | Không còn bắt buộc `3m + 1`     | Chữ ký giúp thông điệp mâu thuẫn có thể xác minh và lan truyền    |

![So sánh CFT, BFT và mô hình Thông điệp có chữ ký](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-cft-vs-bft-939329f6.png)

Bảng trên chỉ tóm tắt các mô hình phổ biến, không phải định luật vạn năng mà mọi giao thức đều phải tuân theo vô điều kiện. Phần cứng tin cậy (Trusted Hardware), mô hình lỗi hỗn hợp, các giả định mạng khác nhau và mục tiêu bảo mật khác nhau đều có thể làm thay đổi số lượng bản sao yêu cầu.

Phần lớn hệ thống Java Backend thông thường không cần dùng đến BFT, bởi các node dịch vụ thường thuộc cùng một tổ chức, dùng chung một hệ thống phân quyền và cùng một hạ tầng vận hành — giữa các node mặc định tin tưởng nhau. Vấn đề chính bạn cần giải quyết là tính sẵn sàng cao (High Availability), chuyển đổi Master-Slave (Failover), tính nhất quán log và tránh Split-brain, chứ không phải đề phòng chính node của mình chủ động nói dối các node khác.

Tuy vậy, trong các kịch bản sau, lỗi Byzantine không thể xem nhẹ:

- Public chain, Consortium chain và các hệ thống thanh toán bù trừ liên tổ chức.
- Nhiều bên cùng duy trì một sổ cái hoặc trạng thái chung nhưng không hoàn toàn tin tưởng lẫn nhau.
- Hệ thống cần chịu được tình huống node bị xâm nhập vẫn tiếp tục gửi thông điệp sai lệch nhưng đúng định dạng hợp lệ.
- Hệ thống Replicated State Machine có yêu cầu mức độ bảo mật rất cao.

Một số hệ thống tuyên bố mình dùng "đồng thuận", nhưng giả định lỗi đằng sau các thuật toán đồng thuận khác nhau rất xa. Chỉ nói "dùng Raft" không chứng minh được hệ thống chống lại được node độc hại; chỉ nói "có dùng chữ ký" cũng không chứng minh được hệ thống đã hiện thực đầy đủ Byzantine Fault Tolerance.

## Bài toán Các vị tướng Byzantine liên quan gì tới Blockchain?

Nhiều người lần đầu nghe tới Bài toán Các vị tướng Byzantine là từ các bài viết về Blockchain.

Mối liên hệ này đúng, nhưng đừng đánh đồng hai khái niệm với nhau. Bài toán Các vị tướng Byzantine là một bài toán đồng thuận phân tán mang tính nền tảng rộng hơn, còn Blockchain chỉ là một trong các lĩnh vực ứng dụng. Các node trong mạng lưới Public Blockchain đến từ nhiều chủ thể khác nhau, node có thể giở trò xấu và độ trễ mạng cũng có thể rất lớn, nên đương nhiên nó phải đối mặt với lỗi Byzantine.

Tuy nhiên, các giao thức trong Blockchain như PoW, PoS, BFT không nằm cùng một tầng với thông điệp miệng và thông điệp có chữ ký trong bài báo của Lamport:

- Bài báo của Lamport đưa ra bài toán hình thức và các lời giải sơ khai, tập trung vào việc làm sao các node trung thành đạt được đồng thuận khi có kẻ phản bội.
- Các giao thức như PBFT, HotStuff, Tendermint gần với hiện thực kỹ thuật hơn, tập trung vào sao chép bản sao, các pha bỏ phiếu, View Change và quy tắc Commit.
- PoW và PoS còn đưa thêm thiết kế về chi phí kinh tế, cổ phần (Stake), xác nhận theo xác suất (Probabilistic Confirmation), chuỗi dài nhất (Longest Chain) hoặc tính tất định cuối cùng (Finality).

Ngưỡng chịu lỗi trong Blockchain cũng không nhất thiết tính theo số lượng node. PoW thường quan tâm tới tỷ lệ sức mạnh tính toán (Hashrate) mà kẻ tấn công nắm giữ; các giao thức dạng PoS và Tendermint thường quan tâm tới lượng Stake hoặc trọng số phiếu bầu (Voting Weight) mà các Validator độc hại nắm giữ. Ngay cả khi kẻ tấn công chỉ kiểm soát một số lượng nhỏ node, chỉ cần nắm đủ trọng số lớn thì vẫn có thể vượt quá ngưỡng an toàn của giao thức.

![Ngưỡng trong Blockchain](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/byzantine-generals-problem-blockchain-weight-thr-64943ed6.png)

Ngoài ra, PoW và PoS giống cơ chế chống tấn công Sybil (Sybil Resistance), chọn Leader và phân bổ trọng số hơn. Một hệ thống hoàn chỉnh vẫn cần thêm cơ chế đề xuất block, lựa chọn nhánh (Fork Choice) và quy tắc bỏ phiếu hoặc Finality — không thể đánh đồng riêng PoW hay PoS với một giao thức đồng thuận hoàn chỉnh.

Vì vậy, trong lộ trình học tập, Bài toán Các vị tướng Byzantine phù hợp làm kiến thức tiền đề cho thuật toán đồng thuận. Hiểu rõ nó trước rồi mới xem tiếp Paxos, Raft, ZAB, PBFT hay đồng thuận Blockchain, rất nhiều khái niệm sẽ trở nên thông suốt hơn hẳn.

## Trong phỏng vấn nên trả lời thế nào?

Nếu người phỏng vấn hỏi "Bài toán Các vị tướng Byzantine là gì?", bạn có thể trả lời theo trình tự sau:

1. Nêu bài toán trước: trong hệ thống phân tán, một phần node có thể bị lỗi hoặc cố tình phá hoại, nhưng các node bình thường vẫn phải đạt đồng thuận trên một giá trị nhất định.
2. Nói tiếp điểm khó: node lỗi Byzantine có thể gửi những thông điệp mâu thuẫn nhau tới các node khác nhau, khiến các node bình thường rất khó phán đoán ai đang nói dối.
3. Bổ sung kết luận then chốt: trong mô hình chỉ dùng thông điệp miệng, muốn chịu được `m` kẻ phản bội thì cần ít nhất `3m + 1` node; 3 node không thể chịu được 1 kẻ phản bội.
4. Trình bày hướng giải quyết: bài báo của Lamport đưa ra hai hướng là thông điệp miệng và thông điệp có chữ ký; trong hệ thống thực tế, nhóm CFT có các thuật toán phổ biến như Paxos, Raft, ZAB, còn nhóm BFT có PBFT, HotStuff, Tendermint...
5. Cuối cùng chốt lại ở góc nhìn kỹ thuật: hệ thống Backend thông thường đa số dùng CFT vì các node mặc định tin cậy lẫn nhau; chỉ những kịch bản liên tổ chức, Blockchain hoặc đòi hỏi an toàn cực cao mới cần cân nhắc BFT.

Một câu trả lời tương đối đầy đủ có thể diễn đạt như sau:

> Bài toán Các vị tướng Byzantine mô tả cách một hệ thống phân tán đạt được sự đồng thuận khi tồn tại các node độc hại hoặc hành xử bất thường. Nó khó hơn lỗi sập máy thông thường vì node Byzantine có thể gửi những thông điệp khác nhau cho các node khác nhau, phá vỡ sự nhất quán trong phán đoán giữa các node bình thường. Bài báo của Lamport chứng minh rằng dưới mô hình thông điệp miệng, để chịu được `m` kẻ phản bội cần ít nhất `3m + 1` node; mô hình thông điệp có chữ ký không còn bắt buộc `3m + 1` nữa vì các mệnh lệnh mâu thuẫn có thể được xác minh và lan truyền. Paxos, Raft, ZAB chủ yếu xử lý lỗi sập máy (CFT) và mặc định các node không cố ý nói dối; các thuật toán như PBFT xử lý lỗi Byzantine (BFT), phù hợp với bối cảnh các node không hoàn toàn tin tưởng nhau và thường cần `3f + 1` bản sao để chịu được `f` lỗi Byzantine.

Mức độ trả lời này đã đủ đáp ứng phần lớn buổi phỏng vấn Backend. Trừ khi vị trí ứng tuyển liên quan trực tiếp đến Blockchain, nhân cơ sở dữ liệu phân tán hoặc hiện thực giao thức đồng thuận, không cần thiết phải chứng minh đệ quy đầy đủ cho `OM(m)` ngay tại buổi phỏng vấn.

## Tài liệu tham khảo

- [The Byzantine Generals Problem - Microsoft Research](https://www.microsoft.com/en-us/research/publication/byzantine-generals-problem/)
- [Bài báo The Byzantine Generals Problem (PDF)](https://lamport.azurewebsites.net/pubs/byz.pdf)
- [Leslie Barry Lamport - A.M. Turing Award Laureate](https://amturing.acm.org/award_winners/lamport_1205376.cfm)
- [Giới thiệu chính thức thuật toán đồng thuận Raft](https://raft.github.io/)
- [Practical Byzantine Fault Tolerance - USENIX](https://www.usenix.org/conference/osdi-99/practical-byzantine-fault-tolerance)
- [Impossibility of Distributed Consensus with One Faulty Process](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf)
- [HotStuff: BFT Consensus in the Lens of Blockchain](https://arxiv.org/abs/1803.05069)
- [What is Tendermint](https://docs.tendermint.com/master/introduction/what-is-tendermint.html)
- [Về Bài toán Các vị tướng Byzantine (tiếng Trung)](https://justinzhangonline.wordpress.com/2010/01/13/%E6%9C%89%E5%85%B3%E6%8B%9C%E5%8D%A0%E5%BA%AD%E5%B0%86%E5%86%9B%E9%97%AE%E9%A2%98/)
- [Minh họa chi tiết Bài toán Các vị tướng Byzantine phiên bản OM (tiếng Trung)](https://marslenjoy.medium.com/%E5%9B%BE%E7%A0%81%E5%B9%B6%E8%8C%82%E4%B8%80%E6%96%87%E7%9C%8B%E6%87%82%E6%8B%9C%E5%8D%A0%E5%BA%AD%E5%B0%86%E5%86%9B%E9%97%AE%E9%A2%98om%E7%89%88-49e2dcbb629c)
- [Bài toán Các vị tướng Byzantine - TheByte (tiếng Trung)](https://www.thebyte.com.cn/consensus/The-Byzantine-General-Problem.html)
