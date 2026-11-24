---
title: Giải thích chi tiết về Thiết kế Hệ thống Phân quyền
description: "Kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC) cấp các quyền liên quan cho người dùng thông qua vai trò (Role) của họ, giúp thực hiện kiểm soát truy cập linh hoạt, đơn giản, hiệu quả và dễ mở rộng hơn nhiều so với việc cấp quyền trực tiếp cho từng người dùng."
category: Thiết kế hệ thống
tag:
  - Bảo mật
head:
  - - meta
    - name: keywords
      content: Thiết kế hệ thống phân quyền,RBAC,ABAC,Phân quyền vai trò người dùng,Phân quyền tài nguyên,Mô hình phân quyền,Kiểm tra quyền,Hệ thống ủy quyền
lang: vi
sourceRef: zh-ref/system-design/security/design-of-authority-system.md
---

> Tác giả: Đội ngũ Kỹ thuật Zhuanzhuan
>
> Bài viết gốc: <https://mp.weixin.qq.com/s/ONMuELjdHYa0yQceTj01Iw>

## Vấn đề và Hiện trạng của Hệ thống Phân quyền Cũ

Trước đây, công ty Zhuanzhuan chưa có một hệ thống quản lý phân quyền thống nhất; việc quản lý quyền do từng mảng nghiệp vụ tự phát triển hoặc dùng lại hệ thống phân quyền của mảng khác. Sự thiếu thống nhất này đã dẫn đến nhiều vấn đề:

1. Các mảng nghiệp vụ tự "phát minh lại bánh xe" (làm trùng lặp), chi phí bảo trì cao.
2. Mỗi hệ thống chỉ giải quyết được một phần kịch bản, giải pháp chưa đủ tổng quát; khi dự án mới lựa chọn giải pháp công nghệ thì không có phương án quản lý phân quyền đáng tin cậy.
3. Thiếu quản lý log và quy trình phê duyệt thống nhất, khiến việc truy vết thông tin cấp quyền vô cùng khó khăn.

Xuất phát từ các vấn đề trên, cuối năm ngoái công ty đã khởi động dự án xây dựng Hệ thống Phân quyền Thống nhất của Zhuanzhuan, với mục tiêu phát triển một hệ thống quản lý phân quyền linh hoạt, dễ sử dụng và an toàn cho tất cả các mảng nghiệp vụ sử dụng.

## Các phương pháp Thiết kế Hệ thống Phân quyền phổ biến hiện nay

Hiện nay có hai mô hình phân quyền chủ đạo trong ngành, lần lượt được giới thiệu dưới đây:

- **Kiểm soát truy cập dựa trên vai trò (RBAC)**
- **Kiểm soát truy cập dựa trên thuộc tính (ABAC)**

### Mô hình RBAC

**Kiểm soát truy cập dựa trên vai trò (Role-Based Access Control, viết tắt là RBAC)** chỉ việc cấp các quyền tương ứng cho người dùng thông qua vai trò (`Role`) của họ, đạt được kiểm soát truy cập linh hoạt, đơn giản, hiệu quả và dễ mở rộng hơn so với việc cấp quyền trực tiếp cho từng người dùng.

Một người dùng có thể sở hữu nhiều vai trò, và mỗi vai trò lại có thể được gán nhiều quyền — từ đó hình thành mô hình phân quyền `"Người dùng - Vai trò - Quyền"` (`User - Role - Permission`). Trong mô hình này, giữa người dùng và vai trò, cũng như giữa vai trò và quyền, tạo thành quan hệ nhiều-nhiều (many-to-many).

Có thể minh họa bằng sơ đồ dưới đây:

![Sơ đồ mô hình phân quyền RBAC](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/rbac-a304d5af.png)

Khi sử dụng mô hình `RBAC`, thông qua việc phân tích tình hình thực tế của người dùng dựa trên trách nhiệm và nhu cầu chung, ta cấp cho họ các vai trò khác nhau. Mối quan hệ `Người dùng -> Vai trò -> Quyền` này giúp ta không phải quản lý riêng lẻ quyền của từng người dùng nữa; người dùng tự nhận được các quyền cần thiết từ những vai trò được cấp.

Lấy một kịch bản đơn giản (hệ thống phân quyền của GitLab) làm ví dụ: hệ thống người dùng có ba vai trò `Admin`, `Maintainer` và `Operator`. Ba vai trò này nắm giữ các quyền khác nhau, chẳng hạn chỉ `Admin` mới có quyền tạo kho mã nguồn và xóa kho mã nguồn, các vai trò khác không có. Khi ta cấp cho một người dùng vai trò `Admin`, người đó sẽ có cả hai quyền **tạo kho mã nguồn** và **xóa kho mã nguồn**.

Nhờ mô hình `RBAC`, khi nhiều người dùng có cùng tập quyền, ta chỉ cần tạo sẵn một vai trò chứa các quyền đó rồi gán vai trò cho từng người dùng; sau này chỉ cần chỉnh sửa quyền của vai trò là quyền của toàn bộ người dùng mang vai trò đó sẽ tự động được cập nhật.

### Mô hình ABAC

**Kiểm soát truy cập dựa trên thuộc tính (Attribute-Based Access Control, viết tắt là ABAC)** là một mô hình cấp quyền linh hoạt hơn `RBAC`. Nguyên lý của nó là đánh giá động xem một thao tác có được phép thực hiện hay không dựa trên nhiều loại thuộc tính khác nhau. Mô hình này được sử dụng khá phổ biến trong các hệ thống đám mây như AWS, Alibaba Cloud, v.v.

Hãy xem xét các kịch bản kiểm soát quyền dưới đây:

1. Cấp cho một người cụ thể quyền chỉnh sửa đối với một cuốn sách cụ thể.
2. Khi phòng ban sở hữu tài liệu trùng với phòng ban của người dùng, người dùng được phép truy cập tài liệu đó.
3. Khi người dùng là chủ sở hữu của tài liệu và trạng thái tài liệu đang là bản nháp (`draft`), người dùng được phép chỉnh sửa tài liệu đó.
4. Cấm nhân viên phòng A truy cập hệ thống B trước 9 giờ sáng.
5. Cấm đăng nhập vào hệ thống A với tư cách quản trị viên tại bất kỳ nơi nào ngoài Thượng Hải.
6. Người dùng chỉ có quyền thao tác với các đơn hàng được tạo trước ngày `2022-06-07`.

Có thể thấy các kịch bản trên rất khó triển khai bằng mô hình `RBAC`, vì `RBAC` chỉ mô tả người dùng được làm thao tác gì, chứ bản thân `RBAC` không có ràng buộc về điều kiện thao tác hay dữ liệu cụ thể được thao tác. Nhưng đây lại chính là điểm mạnh của `ABAC`: tư tưởng của `ABAC` là dựa vào thuộc tính của người dùng, thuộc tính của dữ liệu được truy cập và các yếu tố môi trường để tính toán động xem người dùng có quyền thực hiện thao tác hay không.

#### Nguyên lý của mô hình ABAC

Trong mô hình `ABAC`, việc một thao tác có được phép hay không được quyết định dựa trên sự tính toán động kết hợp giữa Đối tượng (`Subject`), Tài nguyên (`Resource`), Thao tác (`Action`) và Môi trường (`Environment`).

- **Đối tượng (Subject):** Là người dùng hiện đang yêu cầu truy cập tài nguyên. Thuộc tính người dùng bao gồm ID, tài nguyên cá nhân, vai trò, phòng ban và tư cách thành viên tổ chức, v.v.
- **Tài nguyên (Resource):** Là tài sản hoặc thực thể mà người dùng hiện muốn truy cập, ví dụ như tệp tin, dữ liệu, máy chủ, thậm chí là API.
- **Thao tác (Action):** Là hành động người dùng định thực hiện trên tài nguyên. Các thao tác phổ biến gồm "đọc", "ghi", "chỉnh sửa", "sao chép" và "xóa".
- **Môi trường (Environment):** Là ngữ cảnh (context) của mỗi request truy cập. Thuộc tính môi trường gồm thời gian và vị trí truy cập, thiết bị của đối tượng, giao thức truyền thông và độ mạnh mã hóa, v.v.

Trong quá trình thực thi câu lệnh quyết định của mô hình `ABAC`, engine quyết định (decision engine) sẽ căn cứ vào các câu lệnh chính sách đã định nghĩa, kết hợp với Đối tượng, Tài nguyên, Thao tác, Môi trường và các yếu tố khác để tính toán động ra kết quả quyết định. Mỗi khi có request truy cập, hệ thống quyết định `ABAC` đều phân tích xem giá trị thuộc tính có khớp với chính sách (policy) đã thiết lập hay không. Nếu có chính sách phù hợp cho phép, request truy cập sẽ được thông qua.

## Tư tưởng Thiết kế của Hệ thống Phân quyền Mới

Kết hợp với hiện trạng nghiệp vụ của Zhuanzhuan, mô hình `RBAC` đã đáp ứng tuyệt đại đa số kịch bản nghiệp vụ, đồng thời chi phí phát triển thấp hơn rất nhiều so với hệ thống theo mô hình `ABAC`, vì vậy hệ thống phân quyền mới chọn triển khai dựa trên mô hình `RBAC`. Với một số ít hệ thống nghiệp vụ thực sự không thể đáp ứng được, chúng tôi lựa chọn tạm thời chưa hỗ trợ nhằm đảm bảo hệ thống phân quyền mới sớm đi vào hoạt động để các mảng nghiệp vụ nhanh chóng đưa vào sử dụng.

Mô hình `RBAC` tiêu chuẩn tuân thủ hoàn toàn chuỗi `Người dùng -> Vai trò -> Quyền`, tức là quyền của người dùng hoàn toàn do các vai trò mà người đó sở hữu chi phối. Tuy nhiên cách này có nhược điểm là muốn thêm một quyền cho người dùng thì bắt buộc phải tạo thêm một vai trò mới, khiến hiệu quả vận hành thực tế khá thấp. Do đó, trên nền tảng mô hình `RBAC`, chúng tôi bổ sung khả năng gán quyền trực tiếp cho người dùng — tức là vừa có thể gán vai trò cho người dùng, vừa có thể gán thẳng các điểm quyền cho người dùng. Quyền cuối cùng của người dùng là tổ hợp từ các vai trò và các điểm quyền được gán trực tiếp.

**Mô hình quyền của hệ thống phân quyền mới:** Quyền cuối cùng của người dùng = Quyền từ các vai trò người dùng sở hữu + Quyền cấu hình độc lập cho người dùng (lấy hợp của cả hai).

Kiến trúc giải pháp của hệ thống phân quyền mới như hình dưới đây:

![Kiến trúc hệ thống phân quyền mới](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-design-c2357b34.png)

- Trước hết, toàn bộ người dùng của tập đoàn (bao gồm cả người dùng bên ngoài) được quản lý tập trung thông qua chức năng **Đăng nhập và Đăng ký thống nhất**, đồng thời liên thông với module cơ cấu tổ chức của công ty, giúp thông tin cùng một nhân sự đồng nhất trên mọi hệ thống — tạo tiền đề khả thi cho việc quản lý quyền theo cơ cấu tổ chức về sau.
- Thứ hai, vì hệ thống phân quyền mới phải phục vụ mọi mảng nghiệp vụ trong tập đoàn nên cần hỗ trợ quản lý phân quyền đa hệ thống. Trước khi quản lý quyền, người dùng cần chọn hệ thống tương ứng rồi cấu hình thông tin **Quyền Menu** và **Quyền Dữ liệu** của hệ thống đó, thiết lập các điểm quyền của hệ thống. _Lưu ý: giải thích chi tiết về Quyền Menu và Quyền Dữ liệu sẽ được trình bày ở phần sau._
- Cuối cùng, tạo các vai trò khác nhau thuộc hệ thống đó và cấu hình các điểm quyền cho từng vai trò. Ví dụ vai trò Quản lý cửa hàng sở hữu quyền thao tác của nhân viên và quyền xem dữ liệu của cửa hàng mình; sau khi cấu hình xong vai trò này, về sau chỉ cần gán vai trò đó cho quản lý cửa hàng là họ sẽ có đủ các quyền tương ứng.

Sau khi hoàn tất các cấu hình trên là có thể tiến hành quản lý quyền cho người dùng. Có hai cách để cấp quyền cho người dùng:

1. Chọn người dùng trước, sau đó thêm quyền. Cách này có thể gán cho người dùng bất kỳ vai trò nào hoặc các điểm quyền menu/dữ liệu.
2. Chọn vai trò trước, sau đó liên kết người dùng. Cách này chỉ có thể gán vai trò cho người dùng, không thể gán riêng lẻ từng điểm quyền menu/dữ liệu.

Phương án thiết kế chi tiết cho cả hai cách này sẽ được trình bày cụ thể ở phần sau.

### Tự quản lý quyền của chính Hệ thống Phân quyền

Đối với một hệ thống phân quyền, trước tiên cần thiết kế tốt cơ chế phân quyền cho chính bản thân hệ thống đó — tức là quản lý xem "ai được phép vào hệ thống phân quyền, ai được phép quản lý quyền của các hệ thống khác". Người dùng của chính hệ thống phân quyền được chia thành ba nhóm:

1. **Siêu quản trị viên (Super Admin):** Có toàn bộ quyền thao tác trên hệ thống phân quyền, thực hiện được mọi thao tác của bản thân hệ thống và quản lý được các thao tác quản trị của mọi hệ thống ứng dụng đã tích hợp.
2. **Người dùng thao tác quyền (Permission Operator):** Là người dùng đang nắm giữ vai trò Siêu quản trị viên của ít nhất một hệ thống ứng dụng đã tích hợp. Các thao tác người này thực hiện bị giới hạn trong phạm vi quyền của các hệ thống ứng dụng mà họ sở hữu. Đây là một dạng tư cách (identity) không cần cấp phát thủ công mà được tự động có dựa trên quy tắc.
3. **Người dùng phổ thông (Regular User):** Cũng có thể xem là một loại tư cách; trừ 2 nhóm người kể trên, tất cả những người còn lại đều là người dùng phổ thông. Họ chỉ có thể gửi yêu cầu tích hợp hệ thống và truy cập trang xin cấp quyền.

### Định nghĩa các loại Quyền

Trong hệ thống phân quyền mới, chúng tôi chia quyền thành hai nhóm lớn:

- **Quyền chức năng Menu:** Bao gồm quyền truy cập danh mục điều hướng, menu của hệ thống, cũng như quyền thao tác nút bấm (button) và API.
- **Quyền dữ liệu:** Bao gồm quyền định nghĩa phạm vi truy vấn dữ liệu. Ở các hệ thống khác nhau, khái niệm này thường được gọi là "Tổ chức", "Trạm/Điểm", v.v.; trong hệ thống phân quyền mới, tất cả được gọi thống nhất là "Tổ chức" để quản lý quyền dữ liệu.

### Phân loại các Vai trò Mặc định

Mỗi hệ thống được thiết kế sẵn ba vai trò mặc định để đáp ứng các nhu cầu quản lý phân quyền cơ bản, cụ thể như sau:

- **Siêu quản trị viên (Super Admin):** Vai trò này sở hữu toàn bộ quyền của hệ thống đó, có thể sửa cấu hình vai trò/quyền của hệ thống và cấp quyền cho người dùng khác.
- **Quản trị viên hệ thống (System Admin):** Vai trò này có khả năng cấp quyền cho người dùng khác và chỉnh sửa cấu hình vai trò/quyền của hệ thống, nhưng bản thân vai trò này không nắm giữ bất kỳ quyền nghiệp vụ nào.
- **Quản trị viên ủy quyền (Authorization Admin):** Vai trò này có khả năng cấp quyền cho người dùng khác, nhưng phạm vi cấp quyền không được vượt quá các quyền mà chính họ đang sở hữu.

> Ví dụ: Quản trị viên ủy quyền A có thể thêm quyền cho người dùng B, nhưng phạm vi được thêm phải nhỏ hơn hoặc bằng các quyền mà người dùng A đang có.

Nhờ phân tách như vậy, phần **sở hữu quyền** và phần **có năng lực cấp quyền** được tách biệt rõ ràng, đáp ứng đầy đủ mọi kịch bản kiểm soát phân quyền.

## Thiết kế các Module Cốt lõi của Hệ thống Phân quyền Mới

Ở trên đã giới thiệu tư tưởng thiết kế tổng thể của hệ thống phân quyền mới; tiếp theo sẽ đi vào thiết kế chi tiết của từng module cốt lõi.

### Quản lý Hệ thống / Menu / Quyền dữ liệu

Để tích hợp một hệ thống mới vào hệ thống phân quyền gồm các bước sau:

1. Tạo hệ thống
2. Cấu hình quyền chức năng menu
3. Cấu hình quyền dữ liệu (tùy chọn)
4. Tạo vai trò cho hệ thống

Trong đó, các bước 1, 2, 3 đều được thực hiện trong module Quản lý Hệ thống, quy trình cụ thể như hình dưới đây:

![Lưu đồ tích hợp hệ thống](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-design-access-flow-chart-260abaf6.png)

Người dùng có thể thực hiện thêm, xóa, sửa, xem thông tin cơ bản của hệ thống; các hệ thống khác nhau được phân biệt duy nhất thông qua `Mã hệ thống` (`System Code`). Đồng thời, `Mã hệ thống` cũng được dùng làm tiền tố (prefix) cho mã quyền menu và mã quyền dữ liệu, qua đó đảm bảo tính duy nhất toàn cục (globally unique) cho mã quyền.

Ví dụ: nếu mã hệ thống là `test_online`, định dạng mã menu của hệ thống đó sẽ là `test_online:m_xxx`.

Thiết kế giao diện Quản lý Hệ thống như sau:

![Thiết kế giao diện quản lý hệ thống](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-management-interface-9a5a479e.png)

#### Quản lý Menu

Trước hết, hệ thống phân quyền mới phân loại menu thành ba cấp là `Danh mục` (`Directory`), `Menu` và `Thao tác` (`Operation`), minh họa như hình dưới:

![Giao diện quản lý menu](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-menu-8987e965.png)

Ý nghĩa cụ thể của từng loại là:

- **Danh mục (Directory):** Chỉ các danh mục cấp một ở trên cùng trong hệ thống ứng dụng, thường nằm bên phải Logo hệ thống.
- **Menu:** Chỉ cấu trúc menu đa cấp ở bên trái hệ thống ứng dụng, thường nằm phía dưới Logo hệ thống — đây cũng là cấu trúc menu phổ biến nhất.
- **Thao tác (Operation):** Chỉ các nút bấm, API endpoint và hàng loạt thành phần trên trang có thể định nghĩa thành thao tác hoặc phần tử giao diện.

Thiết kế giao diện Quản lý Menu như sau:

![Thiết kế giao diện quản lý menu](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-menu-management-interface-68647206.png)

Việc sử dụng dữ liệu quyền menu cũng cung cấp hai chế độ:

- **Chế độ Menu động (Dynamic Menu Mode):** Ở chế độ này, việc thêm/xóa menu hoàn toàn do hệ thống phân quyền tiếp quản. Nghĩa là khi thêm menu trong hệ thống phân quyền thì hệ thống ứng dụng sẽ tự động đồng bộ thêm theo. Ưu điểm của chế độ này là sửa menu không cần phát hành lại dự án ứng dụng.
- **Chế độ Menu tĩnh (Static Menu Mode):** Việc thêm/xóa menu do phía frontend của hệ thống ứng dụng kiểm soát, hệ thống phân quyền chỉ kiểm soát quyền truy cập. Ở chế độ này, hệ thống phân quyền chỉ đánh dấu xem người dùng có quyền đối với menu hiện tại hay không, còn việc hiển thị cụ thể sẽ do frontend quyết định dựa trên dữ liệu phân quyền.

Cần đặc biệt lưu ý: việc ẩn danh mục, menu hay nút bấm ở frontend chỉ nhằm cải thiện trải nghiệm người dùng, **tuyệt đối không thể** dùng làm ranh giới bảo mật thực sự. Dù sử dụng chế độ menu động hay tĩnh, backend đều phải mặc định từ chối các truy cập chưa được cấp quyền tường minh và kiểm tra trong mọi request xem người dùng hiện tại có quyền thực hiện thao tác tương ứng hay không. Khi liên quan đến dữ liệu cụ thể, backend còn phải kiểm tra tiếp quyền sở hữu tài nguyên, tenant, tổ chức và phạm vi dữ liệu; không được chỉ kiểm tra xem người dùng có quyền với một menu nào đó hay không, và càng không được tin tưởng ID người dùng, ID tổ chức hoặc ID tài nguyên do client truyền lên.

### Quản lý Vai trò và Người dùng

Quản lý vai trò và quản lý người dùng đều là các module cốt lõi có thể thay đổi trực tiếp quyền của người dùng. Ý tưởng thiết kế tổng thể như hình dưới:

![Thiết kế module quản lý vai trò và người dùng](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/role-and-user-management-b5d867fa.png)

Trọng tâm thiết kế của module này là phải tính đến **thao tác hàng loạt (batch operations)**. Dù là liên kết người dùng thông qua vai trò, hay thêm/xóa/đặt lại quyền hàng loạt cho người dùng, các kịch bản thao tác hàng loạt đều phải được hệ thống thiết kế bài bản.

### Xin cấp quyền

Ngoài việc cấp quyền cho người dùng khác, hệ thống phân quyền mới đồng thời hỗ trợ người dùng tự chủ động gửi yêu cầu xin cấp quyền. Bên cạnh luồng phê duyệt thông thường (gửi yêu cầu, phê duyệt, xem trạng thái), module này có một tính năng khá đặc biệt là làm sao giúp người dùng chọn đúng quyền mình cần. Vì vậy, khi thiết kế module này, ngoài việc cho chọn trực tiếp vai trò, hệ thống còn hỗ trợ chọn ngược lại vai trò thông qua các điểm quyền menu/dữ liệu, như hình dưới đây:

![Giao diện xin cấp quyền](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/permission-application-6c729eaf.png)

### Nhật ký Thao tác (Operation Logs)

Nhật ký thao tác của hệ thống được chia thành hai nhóm lớn:

1. **Nhật ký luồng thao tác (Operation Audit Logs):** Các log thao tác quan trọng mà người dùng có thể xem và tra cứu được.
2. **Nhật ký dịch vụ (Service Logs):** Các log được sinh ra trong quá trình dịch vụ hệ thống vận hành. Lượng thông tin của Service Log lớn hơn nhật ký luồng thao tác nhưng không thuận tiện cho việc tìm kiếm, xem xét. Do đó hệ thống phân quyền cần cung cấp chức năng nhật ký luồng thao tác.

Trong hệ thống phân quyền mới, toàn bộ thao tác của người dùng có thể chia thành ba loại: Thêm mới, Cập nhật và Xóa. Mọi module cũng đều có thể liệt kê cố định, ví dụ Quản lý người dùng, Quản lý vai trò, Quản lý menu, v.v. Sau khi xác định rõ các thông tin này, một bản ghi log có thể được trừu tượng hóa thành: Ai (`Who`), vào lúc nào (`When`), đối với đối tượng nào (`Target`), trên module nào, đã thực hiện thao tác gì.
Khi lưu toàn bộ các bản ghi như vậy vào cơ sở dữ liệu, việc tra cứu và lọc log sẽ trở nên rất thuận tiện.

## Tổng kết và Triển vọng

Đến đây, tư tưởng thiết kế cốt lõi và các module của hệ thống phân quyền mới đã được giới thiệu đầy đủ. Hệ thống mới đã được rất nhiều mảng nghiệp vụ nội bộ tại Zhuanzhuan tích hợp sử dụng, giúp việc quản lý phân quyền thuận tiện hơn trước rất nhiều. Là một hệ thống nền tảng của mỗi công ty, một thiết kế linh hoạt và hoàn chỉnh có thể hỗ trợ đắc lực cho sự phát triển hiệu quả hơn của các nghiệp vụ về sau.

Hai bài viết tiếp theo:

- [Thiết kế và Triển khai Hệ thống Phân quyền Thống nhất Zhuanzhuan (Phần triển khai Backend)](https://mp.weixin.qq.com/s/hFTDckfxhSnoM_McP18Vkg)
- [Thiết kế và Triển khai Hệ thống Phân quyền Thống nhất Zhuanzhuan (Phần triển khai Frontend)](https://mp.weixin.qq.com/s/a_P4JAwxgunhfmJvpBnWYA)

## Tài liệu tham khảo

- OWASP Authorization Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- Lựa chọn mô hình phân quyền phù hợp: <https://docs.authing.cn/v2/guides/access-control/choose-the-right-access-control-model.html>
