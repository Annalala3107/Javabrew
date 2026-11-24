---
title: Chi tiết về Hệ thống phân giải tên miền DNS (Tầng ứng dụng)
description: Phân tích chi tiết cấu trúc phân tầng và quy trình phân giải của DNS, bao gồm truy vấn đệ quy/lặp, bộ nhớ đệm, máy chủ có thẩm quyền, cổng tầng ứng dụng và các điểm tối ưu hóa hiệu năng.
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: DNS,phân giải tên miền,truy vấn đệ quy,truy vấn lặp,bộ nhớ đệm,DNS có thẩm quyền,cổng 53,UDP
lang: vi
sourceRef: zh-ref/cs-basics/network/dns.md
---

Sau khi nhập tên miền vào thanh địa chỉ của trình duyệt, trước khi thực sự khởi tạo HTTP request, thông thường yêu cầu phải trải qua quá trình phân giải DNS trước.

DNS giải quyết bài toán **ánh xạ giữa tên miền và địa chỉ IP**. Thoạt nhìn nó chỉ đơn giản là "dịch tên miền thành IP", nhưng đằng sau đó là cả một hệ thống cơ chế hoàn chỉnh bao gồm bộ nhớ đệm cục bộ (cache), truy vấn đệ quy (recursive query), truy vấn lặp (iterative query), máy chủ có thẩm quyền (authoritative server), máy chủ gốc (root server), cùng sự chuyển đổi linh hoạt giữa UDP và TCP.

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. Tại sao DNS lại cần một thiết kế phân tầng?
2. Một quá trình phân giải tên miền hoàn chỉnh thường trải qua các bước nào?
3. Truy vấn đệ quy và truy vấn lặp khác nhau như thế nào?
4. Tại sao DNS thường chạy trên nền UDP, và trong trường hợp nào nó sẽ chuyển sang dùng TCP?

![Tổng quan hệ thống DNS phân giải tên miền thành địa chỉ IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/dns-overview-4619e349.png)

Trong thực tế sử dụng, có một trường hợp mà trình duyệt không cần dùng đến DNS mà vẫn biết được ánh xạ giữa tên miền và địa chỉ IP. Trình duyệt và hệ điều hành duy trì một danh sách `hosts` cục bộ. Thông thường, hệ thống sẽ kiểm tra trước xem tên miền cần truy cập có nằm trong danh sách `hosts` hay không; nếu có, nó sẽ trực tiếp trích xuất bản ghi địa chỉ IP tương ứng. Chỉ khi danh sách `hosts` cục bộ không có bản ghi tương ứng thì DNS mới chính thức xuất hiện.

Hiện tại, thiết kế của DNS áp dụng cấu trúc cơ sở dữ liệu phân tán, phân tầng. **DNS là giao thức tầng ứng dụng, thường chạy trên giao thức UDP với cổng 53**. Khi dữ liệu phản hồi vượt quá giới hạn độ dài gói tin UDP (512 byte, có thể mở rộng lớn hơn qua EDNS0) hoặc khi thực hiện truyền vùng dữ liệu (Zone Transfer), DNS sẽ chuyển sang sử dụng giao thức TCP để đảm bảo tính toàn vẹn của dữ liệu.

![Tổng quan các giao thức từng tầng TCP/IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-protocol-overview-09ff1718.png)

## Các máy chủ DNS

DNS có thể được mô tả qua hai khía cạnh: phân tầng thẩm quyền và vai trò phía truy vấn. Phân tầng thẩm quyền bao gồm máy chủ gốc (Root), máy chủ tên miền cấp cao nhất (TLD) và máy chủ có thẩm quyền cho từng vùng (Zone) cụ thể; phía truy vấn bao gồm stub resolver, recursive resolver (trình phân giải đệ quy) và forwarder. Cùng một phần mềm hoặc một máy chủ vật lý có thể đảm nhận nhiều vai trò cùng lúc, do đó các phân loại này không phải là các "loại máy chủ phần cứng" loại trừ lẫn nhau.

- **Máy chủ DNS gốc (Root DNS Server)**: Máy chủ gốc cung cấp cho bên truy vấn thông tin giới thiệu chuyển tiếp (referral) đến các máy chủ tên miền cấp cao nhất (TLD).
- **Máy chủ DNS tên miền cấp cao nhất (TLD Server)**: Tên miền cấp cao nhất là phần hậu tố của tên miền, ví dụ như `com`, `org`, `net`, `edu`. Các quốc gia và vùng lãnh thổ cũng có tên miền cấp cao nhất riêng, như `uk`, `fr`, `ca`, `vn`. Máy chủ TLD thường trả về thông tin chuyển tiếp trỏ đến máy chủ có thẩm quyền của tên miền mục tiêu.
- **Máy chủ DNS có thẩm quyền (Authoritative DNS Server)**: Máy chủ có thẩm quyền lưu trữ dữ liệu của một hoặc nhiều vùng (DNS zone), và đưa ra câu trả lời chính thức, có thẩm quyền cho các truy vấn trong phạm vi các vùng đó.
- **Trình phân giải đệ quy (Recursive Resolver)**: Mạng nội bộ, nhà cung cấp dịch vụ Internet (ISP) hoặc các dịch vụ DNS công cộng thường cung cấp recursive resolver. Nó tiếp nhận truy vấn từ phía client, kiểm tra cache trước, và khi cần thiết sẽ lần lượt truy vấn từng cấp lên máy chủ gốc, TLD và máy chủ có thẩm quyền. Recursive resolver thuộc về vai trò phía truy vấn, chứ không phải là một tầng trong hệ thống thẩm quyền DNS.

**Trên thế giới có thực sự chỉ có 13 máy chủ gốc hay không?** Đây là một hiểu lầm kỹ thuật đã tồn tại từ rất lâu. Nếu bạn tìm kiếm trên mạng, bạn vẫn sẽ thấy rất nhiều bài viết cũ kỹ tuyên bố rằng "toàn cầu chỉ có 13 máy chủ gốc và toàn bộ đều do Mỹ kiểm soát".

**Sự thật hoàn toàn không phải như vậy.**

Về mặt logic, hệ thống máy chủ gốc có 13 định danh máy chủ gốc được đặt tên từ `a.root-servers.net` đến `m.root-servers.net`, do 12 tổ chức vận hành độc lập quản lý. Con số này liên quan đến các giới hạn về kích thước gói tin khi DNS thời kỳ đầu sử dụng giao thức UDP, nhưng tuyệt đối không được hiểu là toàn cầu chỉ có 13 máy chủ vật lý.

Đằng sau mỗi định danh máy chủ gốc có thể triển khai rất nhiều thực thể (instance) vật lý thông qua công nghệ **IP Anycast**. Giao thức định tuyến BGP sẽ dựa vào tuyến đường mạng hiện tại để điều hướng câu truy vấn đến instance phù hợp nhất trên đường truyền, không nhất thiết phải là instance gần nhất về mặt địa lý. Số lượng và vị trí của các instance thay đổi liên tục, và dữ liệu thời gian thực chính xác nhất nên được tham khảo tại **[Root-Servers.org](https://root-servers.org/)**.

![Root-Servers.org hiển thị phân bố các instance máy chủ gốc trên toàn cầu](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/root-servers-org-104d0b1d.png)

## Quy trình làm việc của DNS

Lấy hình dưới đây làm ví dụ để giới thiệu quy trình truy vấn và phân giải của DNS. Quy trình truy vấn phân giải DNS chia thành hai chế độ:

- **Lặp (Iterative)**
- **Đệ quy (Recursive)**

Hình dưới đây là phương thức thường được áp dụng trong thực tế: truy vấn từ máy chủ yêu cầu đến máy chủ DNS cục bộ là đệ quy, còn các truy vấn còn lại là lặp.

![Quy trình phân giải kết hợp giữa truy vấn đệ quy và truy vấn lặp trong DNS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/DNS-process-f2f3a36e.png)

Giả sử máy chủ `cis.poly.edu` muốn biết địa chỉ IP của `gaia.cs.umass.edu`. Giả định máy chủ DNS cục bộ của `cis.poly.edu` là `dns.poly.edu`, và máy chủ DNS có thẩm quyền của `gaia.cs.umass.edu` là `dns.cs.umass.edu`.

1. Đầu tiên, máy chủ `cis.poly.edu` gửi một DNS request đến máy chủ DNS cục bộ `dns.poly.edu`, gói tin truy vấn chứa tên miền cần chuyển đổi `gaia.cs.umass.edu`.
2. Máy chủ DNS cục bộ `dns.poly.edu` kiểm tra bộ nhớ cache cục bộ, thấy không có bản ghi nào, cũng không biết địa chỉ IP của `gaia.cs.umass.edu` ở đâu, buộc phải gửi request lên máy chủ gốc (Root Server).
3. Máy chủ gốc nhận thấy trong gói tin truy vấn có tên miền cấp cao nhất `edu`, do đó thông báo cho DNS cục bộ: bạn có thể gửi yêu cầu đến máy chủ TLD DNS của `edu`, vì địa chỉ IP của tên miền mục tiêu rất có thể nằm ở đó.
4. DNS cục bộ nhận được địa chỉ máy chủ TLD DNS của `edu`, gửi request đến đó hỏi địa chỉ IP của `gaia.cs.umass.edu`.
5. Máy chủ TLD DNS của `edu` vẫn chưa rõ địa chỉ IP của tên miền được yêu cầu, nhưng nhận thấy tên miền có tiền tố `umass.edu`, do đó phản hồi cho DNS cục bộ biết: máy chủ có thẩm quyền của `umass.edu` có thể đang lưu bản ghi địa chỉ IP của tên miền mục tiêu.
6. Lần này, DNS cục bộ gửi request trực tiếp đến máy chủ DNS có thẩm quyền `dns.cs.umass.edu`.
7. Cuối cùng, do `gaia.cs.umass.edu` đã đăng ký với máy chủ DNS có thẩm quyền và có bản ghi địa chỉ IP tại đây, DNS có thẩm quyền trả về địa chỉ IP thành công cho DNS cục bộ.
8. Cuối cùng, DNS cục bộ nhận được địa chỉ IP của tên miền mục tiêu và trả lại cho máy chủ yêu cầu ban đầu.

Bên cạnh truy vấn lặp, còn có một hình thức truy vấn hoàn toàn đệ quy như hình dưới đây, quy trình cụ thể tương tự như trên, chỉ khác về trình tự ủy quyền tiếp nhận.

![Quy trình phân giải tên miền bằng truy vấn đệ quy trong DNS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/DNS-process2-ff949d9c.png)

Recursive resolver sẽ lưu vào bộ nhớ đệm (cache) các thông tin chuyển tiếp và bản ghi tài nguyên thu được từ các lần truy vấn trước, vì vậy rất nhiều truy vấn không cần lần nào cũng phải bắt đầu lại từ máy chủ gốc. Chỉ cần bản ghi cache liên quan vẫn còn trong thời hạn TTL, resolver có thể liên hệ trực tiếp với máy chủ TLD hoặc máy chủ có thẩm quyền đã biết, giúp rút ngắn đường dẫn truy vấn và giảm tải cho các máy chủ thượng nguồn.

## Định dạng thông điệp DNS

Định dạng thông điệp của DNS được thể hiện như hình dưới đây:

![Định dạng các trường trong gói tin truy vấn và trả lời của DNS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/DNS-packet-ea94a1c1.png)

Thông điệp DNS chia thành thông điệp truy vấn (Query) và trả lời (Answer), cấu trúc của hai dạng thông điệp này là tương đồng.

- **Định danh (Identification / Transaction ID)**: 16 bit, dùng để định danh cho truy vấn. Định danh này sẽ được sao chép vào thông điệp trả lời tương ứng để client dùng khớp nối giữa request gửi đi và reply nhận về.
- **Các cờ (Flags)**: Bit cờ "Query/Response" 1 bit (`0` là thông điệp truy vấn, `1` là thông điệp trả lời); bit cờ "Authoritative" 1 bit (dùng trong thông điệp trả lời khi DNS server đó là máy chủ có thẩm quyền đối với tên miền được hỏi); bit cờ "Recursion Desired" 1 bit yêu cầu rõ ràng việc thực hiện truy vấn đệ quy; bit cờ "Recursion Available" 1 bit dùng trong thông điệp trả lời biểu thị máy chủ DNS hỗ trợ truy vấn đệ quy.
- **Số câu hỏi (Question Count), Số RR trả lời (Answer RR Count), Số RR thẩm quyền (Authority RR Count), Số RR bổ sung (Additional RR Count)**: Chỉ định số lượng bản ghi tài nguyên xuất hiện trong 4 vùng dữ liệu tiếp theo.
- **Vùng câu hỏi (Question Section)**: Chứa tên máy chủ đang được truy vấn cùng loại câu hỏi (ví dụ A, AAAA, MX) đang được hỏi.
- **Vùng trả lời (Answer Section)**: Chứa các bản ghi tài nguyên trả lời cho tên miền yêu cầu ban đầu. **Trong vùng trả lời có thể chứa nhiều RR, do đó một tên máy chủ có thể có nhiều địa chỉ IP.**
- **Vùng thẩm quyền (Authority Section)**: Chứa bản ghi của các máy chủ có thẩm quyền khác.
- **Vùng bổ sung (Additional Section)**: Chứa các bản ghi hữu ích khác (ví dụ như bản ghi glue giúp phân giải tên máy chủ có thẩm quyền thành địa chỉ IP).

## Bản ghi tài nguyên DNS (Resource Record)

Khi máy chủ DNS phản hồi truy vấn, nó cần tra cứu cơ sở dữ liệu của mình, các mục trong cơ sở dữ liệu được gọi là **Bản ghi tài nguyên (Resource Record, RR)**. RR cung cấp ánh xạ từ tên máy chủ đến địa chỉ IP. Một RR là một bộ 4 phần tử bao gồm `Name`, `Value`, `Type`, `TTL`.

![Bộ 4 trường của bản ghi tài nguyên DNS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/20210506174303797-6b425e8a.png)

`TTL` (Time To Live) là thời gian sống của bản ghi, quyết định thời điểm bản ghi tài nguyên cần phải bị xóa khỏi bộ nhớ cache.

Ý nghĩa của các trường `Name` và `Value` phụ thuộc vào trường `Type`:

![Ý nghĩa Name và Value theo từng loại bản ghi tài nguyên DNS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/20210506170307897-b39e793c.png)

- Nếu `Type=A`: `Name` là thông tin tên máy chủ, `Value` là địa chỉ IP (IPv4) tương ứng với tên máy chủ đó. Một RR như vậy ghi lại một ánh xạ từ tên máy chủ sang địa chỉ IP.
- Nếu `Type=AAAA`: Rất giống với bản ghi `A`, điểm khác biệt duy nhất là bản ghi `A` sử dụng IPv4, còn bản ghi `AAAA` sử dụng IPv6.
- Nếu `Type=CNAME` (Canonical Name Record, bản ghi tên chuẩn): `Value` là tên máy chủ chuẩn (canonical hostname) tương ứng với tên máy chủ bí danh (alias) trong `Name`. Giá trị `Value` mới là tên máy chủ chuẩn. Bản ghi `CNAME` ánh xạ một tên máy chủ sang một tên máy chủ khác, dùng để tạo bí danh cho các bản ghi `A` hiện có. Phía dưới có ví dụ cụ thể.
- Nếu `Type=NS`: `Name` là một miền (domain/zone), còn `Value` là tên máy chủ của một máy chủ DNS có thẩm quyền biết cách lấy địa chỉ IP của các máy chủ trong miền đó. Thông thường RR loại này do máy chủ TLD công bố.
- Nếu `Type=MX`: `Value` là tên máy chủ chuẩn của máy chủ thư tín có bí danh là `Name`. Nhờ có bản ghi `MX`, máy chủ thư tín có thể sử dụng cùng một bí danh với các máy chủ khác. Để lấy tên máy chủ chuẩn của máy chủ thư tín cần truy vấn bản ghi `MX`; để lấy tên máy chủ chuẩn của các máy chủ khác thì truy vấn bản ghi `CNAME`.

Bản ghi `CNAME` luôn trỏ tới một tên miền khác chứ không trỏ trực tiếp tới địa chỉ IP. Giả sử có cấu hình DNS zone như sau:

```plain
NAME                    TYPE   VALUE
--------------------------------------------------
bar.example.com.        CNAME  foo.example.com.
foo.example.com.        A      192.0.2.23
```

Khi người dùng truy vấn `bar.example.com`, DNS Server trên thực tế sẽ phân giải qua chuỗi bí danh và trả về địa chỉ IP của `foo.example.com`.

## Tài liệu tham khảo

- Các loại máy chủ DNS: <https://www.cloudflare.com/zh-cn/learning/dns/dns-server-types/>
- DNS Message Resource Record Field Formats: <http://www.tcpipguide.com/free/t_DNSMessageResourceRecordFieldFormats-2.htm>
- Understanding Different Types of Record in DNS Server: <https://www.mustbegeek.com/understanding-different-types-of-record-in-dns-server/>
