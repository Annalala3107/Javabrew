---
title: Tổng hợp kiến thức nền tảng về Linux
description: Giới thiệu ngắn gọn các khái niệm Linux cốt lõi và các câu lệnh thông dụng mà lập trình viên Java nhất định phải nắm vững.
category: Cơ sở máy tính
tag:
  - Hệ điều hành
  - Linux
head:
  - - meta
    - name: keywords
      content: Linux, lệnh cơ bản, bản phân phối, hệ thống tệp, file system, quyền hạn, tiến trình, mạng
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/linux-intro.md
---

Giới thiệu ngắn gọn các khái niệm Linux cốt lõi và các câu lệnh thông dụng mà lập trình viên Java nhất định phải biết.

## Khám phá Linux

### Giới thiệu về Linux

Có thể khái quát Linux là gì thông qua ba điểm chính sau:

- **Hệ điều hành tương tự Unix (Unix-like)**: Linux là một hệ điều hành mã nguồn mở, miễn phí và hoạt động theo phong cách Unix.
- **Bản chất của Linux là Linux Kernel (Nhân Linux)**: Nói một cách chặt chẽ, từ "Linux" ban đầu chỉ dùng để chỉ Linux kernel. Riêng một Linux kernel đơn lẻ không thể tạo thành một hệ điều hành hoàn chỉnh có thể sử dụng ngay được. Vì vậy, các bản phân phối Linux (Linux distribution / distro) mới ra đời.
- **Cha đẻ của Linux (Linus Benedict Torvalds)**: Một huyền thoại sống trong giới lập trình, một "đại thần" đích thực mà mọi thế hệ kỹ sư đều kính trọng và ngưỡng mộ! Ông là tác giả ban đầu của **Linux kernel**, người khởi xướng dự án mã nguồn mở này và giữ vai trò kiến trúc sư trưởng của nhân Linux. Ông cũng chính là người khởi xướng và là nhà phát triển chính của hệ thống quản lý phiên bản Git.

![Nhà sáng lập Linux - Linus Torvalds](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/linux-father-b8753a27.png)

### Sự ra đời của Linux

Năm 1989, Linus Torvalds gia nhập Lữ đoàn Uusimaa thuộc Quân đội Phần Lan để thực hiện 11 tháng nghĩa vụ quân sự bắt buộc, mang quân hàm thiếu úy, chủ yếu làm việc tại bộ phận máy tính với nhiệm vụ tính toán đường đạn pháo. Trong thời gian tại ngũ, ông đã mua cuốn sách giáo trình hệ điều hành của tác giả Andrew S. Tanenbaum cùng mã nguồn Minix để bắt đầu nghiên cứu về hệ điều hành. Năm 1990, sau khi xuất ngũ trở về trường đại học, ông bắt đầu tiếp xúc sâu với Unix.

> **Minix** là một hệ điều hành kiểu Unix thu nhỏ do Giáo sư Tanenbaum viết nhằm mục đích giảng dạy, áp dụng kiến trúc vi nhân (microkernel). Chính nó đã truyền cảm hứng trực tiếp cho sự ra đời của Linux kernel.

Năm 1991, Linus Torvalds chính thức mở mã nguồn của Linux kernel. Linux chọn một chú chim cánh cụt dễ thương (Tux) làm biểu tượng chính thức, tượng trưng cho sự dũng cảm dấn thân và tình yêu cuộc sống.

![Logo của hệ điều hành Linux](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/Linux-Logo-26f92e87.jpg)

### Các bản phân phối Linux phổ biến

![Giao diện desktop và giao diện dòng lệnh của hệ điều hành Linux](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/linux-95faaf8a.jpg)

Những gì Linus Torvalds phát hành mã nguồn mở ban đầu chỉ là Linux kernel; ở phần trên chúng ta cũng đã nhắc tới vai trò của một kernel hệ điều hành. Một số tổ chức hoặc công ty thương mại đã đóng gói Linux kernel cùng với nhiều phần mềm ứng dụng, tài liệu hướng dẫn, giao diện cài đặt hệ thống và các công cụ cấu hình, quản trị để tạo thành các bản phân phối Linux hoàn chỉnh.

> Kernel chịu trách nhiệm chính trong việc quản lý bộ nhớ, quản lý thiết bị phần cứng, quản lý hệ thống tệp (file system) và quản lý vòng đời của các ứng dụng/tiến trình.

Các bản phân phối Linux có thể được chia thành hai nhóm lớn:

- **Bản phân phối do công ty thương mại duy trì và hỗ trợ**: Ví dụ như Red Hat Enterprise Linux (RHEL) do công ty Red Hat phát triển.
- **Bản phân phối do cộng đồng duy trì**: Ví dụ như CentOS (trước đây dựa trên RHEL), hoặc Ubuntu (dựa trên Debian).

Đối với người mới bắt đầu học Linux, không nên tiếp tục chọn CentOS một cách mù quáng nữa. CentOS Linux 8 đã ngừng hỗ trợ (EOL) vào cuối năm 2021, và CentOS Linux 7 cũng đã kết thúc vòng đời vào tháng 6 năm 2024; CentOS Stream hiện tại là nhánh phát hành liên tục (upstream continuous delivery) cho RHEL, định vị hoàn toàn khác với phiên bản "CentOS tương thích ổn định và đóng gói lại từ RHEL" trong quá khứ.

Lựa chọn an toàn và thực tế hơn hiện nay là:

- Muốn học môi trường server doanh nghiệp, hệ sinh thái RHEL: Ưu tiên chọn Rocky Linux hoặc AlmaLinux.
- Muốn làm quen nhanh chóng, tài liệu phong phú, phổ biến ở cả desktop lẫn server: Chọn Ubuntu LTS.
- Muốn sự ổn định tuyệt đối, nhẹ nhàng, thuần chất bản phân phối cộng đồng: Chọn Debian.

Nếu môi trường công ty của bạn vẫn đang sử dụng CentOS, bạn có thể học phiên bản tương ứng dựa theo môi trường thực tế; nhưng khi dựng môi trường học tập mới, hãy ưu tiên các bản phân phối vẫn đang được duy trì và cập nhật liên tục.

## Hệ thống tệp (File System) trong Linux

### Giới thiệu về Linux File System

Trong hệ điều hành Linux, mọi tài nguyên được hệ điều hành quản lý—như card mạng, ổ đĩa, máy in, thiết bị vào ra (I/O), file thông thường hay thư mục—đều được coi là file. Đây chính là triết lý cực kỳ quan trọng trong Linux: "Mọi thứ đều là file" (Everything is a file).

Khái niệm này bắt nguồn từ triết lý UNIX, tức là trừu tượng hóa tất cả các tài nguyên thành dạng file để quản lý và truy cập một cách thống nhất. Hệ thống tệp của Linux cũng kế thừa sâu sắc tư tưởng thiết kế này. Nhờ đó, Linux có thể sử dụng một giao diện file chuẩn hóa (`read`, `write`, `open`, `close`) để thao tác với nhiều loại tài nguyên khác nhau. Ví dụ, bạn có thể thao tác với card mạng, ổ đĩa hay các thiết bị ngoại vi theo cách tương tự như khi đọc/ghi file thông thường, giúp việc quản lý trở nên đơn giản và nhất quán hơn rất nhiều.

Triết lý thiết kế lấy file làm trung tâm này mang lại tính linh hoạt và khả năng mở rộng phi thường cho Linux, biến nó thành một hệ điều hành mạnh mẽ được đông đảo lập trình viên yêu thích và tin dùng.

### Giới thiệu về inode

inode là nền tảng cốt lõi của hệ thống tệp Linux/Unix. Vậy inode thực chất là gì và có tác dụng như thế nào?

Có thể tóm tắt về inode qua 5 điểm cốt lõi sau:

1. Ổ đĩa cứng lấy sector (khối cung vật lý) làm đơn vị lưu trữ vật lý nhỏ nhất, trong khi hệ điều hành và file system thường đọc ghi theo block (khối dữ liệu), mỗi block gồm nhiều sector gộp lại. Sector truyền thống thường có kích thước 512 byte, trong khi đĩa cứng hiện đại phổ biến mức sector vật lý 4 KB (ví dụ định dạng 512e/4Kn); block của file system cũng thường là 4 KB, nhưng hai khái niệm này là khác nhau. Metadata (siêu dữ liệu) của file—như quyền hạn, kích thước, thời gian sửa đổi và con trỏ ánh xạ tới các block dữ liệu hoặc extent—được lưu trữ trong một cấu trúc gọi là inode (index node). Mã số inode chỉ đảm bảo duy nhất trong phạm vi của một file system nhất định; nhiều thư mục mục lục (hard link) có thể trỏ tới cùng một inode. Ổ cứng thể rắn (SSD) dù không có sector cơ học truyền thống nhưng vẫn hiển thị giao diện block logic ra bên ngoài.
2. Trong các file system như ext2/ext3/ext4, kích thước của bản ghi inode trên đĩa được xác định cố định khi định dạng file system; các file system khác có thể có cấu trúc metadata khác.
3. Tốc độ truy cập inode rất nhanh vì hệ thống có thể trực tiếp định vị metadata của file thông qua số hiệu inode mà không cần duyệt qua toàn bộ cây thư mục.
4. Các file system như ext2/ext3/ext4 sẽ chốt số lượng inode khả dụng ngay từ lúc format. Khi toàn bộ inode bị dùng hết, bạn sẽ không thể tạo thêm file mới dù dung lượng block dữ liệu vẫn còn trống. Không phải mọi file system của Linux đều dùng bảng inode cố định; khi kiểm tra sự cố cần đối chiếu với triển khai của từng file system cụ thể.
5. Có thể sử dụng lệnh `stat` để xem thông tin chi tiết về inode của một file, bao gồm số inode, kiểu file, quyền hạn, người sở hữu, kích thước và các mốc thời gian.

Nói một cách đơn giản: inode dùng để theo dõi xem file được chia thành mấy block, từng block nằm ở địa chỉ nào trên đĩa, ai sở hữu file, thời điểm tạo, quyền truy cập và kích thước của file.

Tóm tắt sự khác biệt giữa inode và block:

- **inode**: Lưu trữ các thuộc tính metadata của file, có thể dùng lệnh `stat` để kiểm tra.
- **block / extent**: Dùng để lưu trữ nội dung thực tế của file hoặc mô tả một dải block liên tục. Cơ chế cấp phát và chia sẻ phụ thuộc vào từng file system cụ thể, không nên khái quát hóa thành "một block chỉ luôn thuộc về duy nhất một file".

![Kiểm tra thông tin inode của file bằng lệnh stat](/media/jg/local/cs-basics/operating-system/images/inode-2a480a.png)

Hệ thống tệp Linux/Unix dùng inode để định danh các đối tượng. Khi đổi tên file trong cùng một file system, hệ thống thực chất chỉ thay đổi mục từ trong thư mục chứ số hiệu inode không đổi; khi hard link cuối cùng bị xóa và không còn tiến trình nào mở file, inode sẽ được giải phóng và số hiệu này có thể được tái sử dụng sau đó. Việc truy cập file theo đường dẫn vẫn phải phân giải thư mục trước, không thể bỏ qua bước tra cứu đường dẫn để dùng số inode như một mã định danh toàn cục ổn định.

Mặt khác, việc sử dụng mã số inode cũng khiến hệ thống tệp trở nên trừu tượng và phức tạp hơn ở góc độ người dùng và ứng dụng, đòi hỏi phải thông qua các lệnh hệ thống hoặc API system call để truy vấn và quản lý.

### Hard Link (Liên kết cứng) và Soft Link (Liên kết mềm)

Trên Linux và các hệ thống Unix-like, cơ chế triển khai của liên kết cứng (hard link) và liên kết mềm (symbolic link) hoàn toàn khác biệt: Hard link là một mục thư mục khác cùng trỏ tới một inode đã có; trong khi Soft link là một file độc lập có inode riêng.

**1. Liên kết cứng (Hard Link)**

- Trong file system Linux/Unix, mỗi file và thư mục đều có một số inode duy nhất để định danh. Hard link thiết lập liên kết thông qua số inode này; hard link và file gốc có số inode hoàn toàn giống hệt nhau, và đối với file system, chúng có vị thế bình đẳng tuyệt đối (có thể coi là các hard link của nhau, cùng trỏ về một file vật lý duy nhất). Xóa bất kỳ một liên kết nào cũng không làm ảnh hưởng đến liên kết còn lại, vì vậy có thể tạo hard link để bảo vệ các file quan trọng khỏi bị vô tình xóa mất.
- Chỉ khi nào file gốc và tất cả các file hard link tương ứng đều bị xóa (đồng thời không còn tiến trình nào đang mở file), nội dung thực tế của file mới thực sự bị xóa khỏi đĩa.
- Hard link có một số hạn chế: Không thể tạo hard link cho thư mục, không thể trỏ tới file chưa tồn tại, và quan trọng nhất là **không thể tạo hard link vượt qua các file system khác nhau**.
- Dùng lệnh `ln` (không có cờ `-s`) để tạo hard link.

**2. Liên kết mềm (Soft Link / Symbolic Link / Symlink)**

- Soft link có số inode khác với file gốc, nội dung bên trong của nó thực chất là một chuỗi đường dẫn trỏ tới file đích.
- Khi file gốc bị xóa, soft link vẫn tồn tại nhưng sẽ trỏ tới một đường dẫn không còn hợp lệ (liên kết gãy - broken/dangling symlink).
- Soft link tương tự như shortcut trong hệ điều hành Windows.
- Khác với hard link, soft link có thể trỏ tới thư mục hoặc các file chưa tồn tại, và **hoàn toàn có thể liên kết xuyên qua các file system khác nhau**.
- Dùng lệnh `ln -s` để tạo soft link (chữ `s` đại diện cho symbolic).

**Tại sao Hard Link không thể liên kết xuyên file system?**

Như đã giải thích, hard link hoạt động dựa trên số inode dùng chung với file nguồn.

Mỗi file system quản lý một không gian số inode hoàn toàn độc lập; mục thư mục của file system này chỉ có thể tham chiếu đến các inode thuộc chính nó, chứ không thể trỏ trực tiếp sang inode của một file system khác. Do đó, hard link không thể vượt qua ranh giới file system—đây là hạn chế về mặt kiến trúc, chứ không đơn thuần chỉ là vấn đề trùng lặp mã số inode.

### Các loại file trong Linux

Linux hỗ trợ nhiều loại file khác nhau, trong đó quan trọng nhất gồm: **file thông thường**, **file thư mục**, **file liên kết**, **file thiết bị**, **file đường ống (pipe)** và **file socket**.

- **File thông thường (`-`, regular file)**: Dùng để lưu trữ dữ liệu hoặc văn bản. Người dùng có thể đọc, sửa, xóa tùy theo quyền hạn. Ví dụ: hình ảnh, âm thanh, PDF, text, video, mã nguồn, file thực thi nhị phân.
- **File thư mục (`d`, directory file)**: Thư mục thực chất cũng là một dạng file đặc biệt dùng để tổ chức hệ thống; file thư mục chứa danh sách tên các file con và thư mục con. Mở thư mục bản chất là mở file thư mục.
- **File liên kết mềm (`l`, symbolic link)**: Lưu chuỗi đường dẫn tới file/thư mục đích. Khi truy cập, kernel sẽ phân giải đường dẫn này để chuyển hướng đến đích.
- **Thiết bị ký tự (`c`, character device)**: Dùng để truy cập các thiết bị vào ra dạng luồng ký tự không đệm, ví dụ như bàn phím, cổng nối tiếp.
- **Thiết bị khối (`b`, block device)**: Dùng để truy cập các thiết bị lưu trữ theo khối có bộ đệm, ví dụ như đĩa cứng, SSD.
- **File đường ống (`p`, FIFO / named pipe)**: Loại file đặc biệt dùng để giao tiếp liên tiến trình (IPC - Inter-Process Communication).
- **File socket (`s`, socket)**: Dùng để giao tiếp mạng giữa các tiến trình, hoặc giao tiếp cục bộ tốc độ cao trên cùng máy (Unix Domain Socket).

Mỗi loại file đều có thuộc tính và công dụng riêng, có thể kiểm tra qua các lệnh như `ls -l` hoặc `file`.

```bash
# File thông thường (-)
-rw-r--r--  1 user  group  1024 Apr 14 10:00 file.txt

# File thư mục (d, directory file)
drwxr-xr-x  2 user  group  4096 Apr 14 10:00 directory/

# File socket (s, socket)
srwxrwxrwx  1 user  group    0 Apr 14 10:00 socket
```

### Cây thư mục Linux (Directory Tree)

Linux tổ chức tất cả các file và thư mục theo một cấu trúc phân cấp thống nhất gọi là cây thư mục. Điểm khởi đầu của cây thư mục là thư mục gốc (`/`), từ đó đâm nhánh xuống các thư mục con và tệp tin, trông như một cái cây ngược.

![Cấu trúc thư mục của Linux](/media/jg/local/cs-basics/operating-system/images/Linux-835de3.png)

**Mô tả các thư mục phổ biến:**

- **/bin:** Chứa các file thực thi nhị phân cơ bản (`ls`, `cat`, `mkdir`...), các câu lệnh thông dụng nhất nằm ở đây.
- **/etc:** Chứa các file cấu hình và quản trị hệ sinh thái của hệ thống.
- **/home:** Thư mục gốc chứa dữ liệu cá nhân của các người dùng thông thường. Ví dụ thư mục của user `user` sẽ là `/home/user`, có thể viết tắt là `~user` hoặc `~`.
- **/usr:** Chứa các ứng dụng, tiện ích và thư viện chia sẻ cấp người dùng.
- **/opt:** Nơi cài đặt các gói phần mềm ứng dụng bổ sung tùy chọn bên thứ ba (thường dùng để đặt Tomcat, middleware tự cài...).
- **/proc:** Thư mục hệ thống tệp ảo trong bộ nhớ, phản ánh trạng thái của kernel và các tiến trình đang chạy.
- **/root:** Thư mục cá nhân (home directory) của superuser (quản trị viên `root`).
- **/sbin:** Chứa các file nhị phân quản trị hệ thống, thường chỉ người dùng root mới có quyền thực thi (như `ifconfig`, `fdisk`, `reboot`).
- **/dev:** Chứa các file đại diện cho các thiết bị phần cứng.
- **/mnt:** Điểm gắn kết (mount point) tạm thời để quản trị viên mount các hệ thống tệp khác từ bên ngoài.
- **/boot:** Chứa các file phục vụ cho quá trình khởi động máy tính (kernel image, GRUB...).
- **/lib và /lib64:** Chứa các thư viện liên kết động cần thiết cho các chương trình trong `/bin` và `/sbin`.
- **/tmp:** Nơi lưu trữ các file tạm thời, dùng chung cho mọi tiến trình và người dùng.
- **/var:** Chứa các dữ liệu thường xuyên thay đổi trong quá trình hệ thống hoạt động, như log của các dịch vụ (`/var/log`), hàng đợi thư điện tử...
- **/lost+found:** Nằm trên các file system dạng ext; chứa các mảnh file mồ côi được khôi phục sau sự cố mất điện hoặc lỗi hệ thống tệp (`fsck`).

## Các lệnh Linux thông dụng

Dưới đây tổng hợp các câu lệnh được sử dụng với tần suất cao nhất trong thực tế.

Một trang tra cứu nhanh lệnh Linux rất hữu ích: <https://wangchujiang.com/linux-command/>.

![Tra cứu nhanh lệnh Linux](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/linux-command-search-518ebe2b.png)

Ngoài ra, trang [shell.how](https://www.shell.how/) giúp giải thích ý nghĩa các câu lệnh, rất tiện lợi khi học các lệnh shell, Git hay NPM.

![Ví dụ sử dụng shell.how](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/shell-now-3faa8c8a.png)

### Chuyển đổi thư mục

- `cd usr`: Chuyển vào thư mục `usr` nằm trong thư mục hiện tại.
- `cd ..` (hoặc `cd ../`): Chuyển lên thư mục cha phía trên.
- `cd /`: Chuyển thẳng về thư mục gốc của hệ thống.
- `cd ~`: Chuyển về thư mục home của người dùng hiện tại.
- **`cd -`:** Chuyển về thư mục làm việc ở thao tác trước đó.

### Thao tác với thư mục

- `ls`: Liệt kê danh sách file và thư mục con. Ví dụ: `ls /home`.
- `ll`: Là bí danh (alias) của `ls -l`, hiển thị danh sách kèm thông tin chi tiết (quyền, chủ sở hữu, dung lượng, thời gian).
- `mkdir [tùy chọn] tên_thư_mục`: Tạo thư mục mới. Ví dụ: `mkdir -m 755 my_directory` tạo thư mục với quyền 755 (chủ sở hữu có toàn quyền rwx; group và others chỉ có quyền đọc rx). Nếu muốn mở toàn quyền cho mọi người thì dùng `mkdir -m 777 my_directory`.
- `find [đường dẫn] [biểu thức]`: Tìm kiếm file hoặc thư mục theo tiêu chí, cực kỳ mạnh mẽ. Ví dụ: ① Liệt kê mọi file/thư mục: `find .`; ② Tìm file có đuôi `.txt` trong `/home`: `find /home -name "*.txt"`, không phân biệt hoa thường: `find /home -iname "*.txt"`; ③ Tìm cả file `.txt` và `.pdf`: `find . \( -name "*.txt" -o -name "*.pdf" \)`.
- `pwd`: Hiển thị đường dẫn tuyệt đối của thư mục làm việc hiện tại.
- `rmdir [tùy chọn] tên_thư_mục`: Xóa thư mục rỗng. Ví dụ: `rmdir -p my_directory` xóa thư mục rỗng và xóa đệ quy các thư mục cha nếu chúng cũng rỗng.
- `rm [tùy chọn] tên_file_hoặc_thư_mục`: Xóa file hoặc thư mục. Ví dụ: `rm -r my_directory` dùng cờ `-r` (recursive) để xóa đệ quy thư mục cùng toàn bộ file bên trong.
- `cp [tùy chọn] nguồn đích`: Sao chép file hoặc thư mục. Ví dụ: `cp file.txt /home/file.txt`. Để copy cả thư mục kèm nội dung: `cp -r source destination`.
- `mv [tùy chọn] nguồn đích`: Di chuyển hoặc đổi tên file/thư mục. Ví dụ: `mv file.txt /home/file.txt`. Khác với `cp`, lệnh `mv` "chuyển nhà" cho file mà không làm tăng thêm số lượng file.

### Thao tác với file

Các lệnh như `mv`, `cp`, `rm` áp dụng chung cho cả file lẫn thư mục nên sẽ không nhắc lại ở đây.

- `touch [tùy chọn] tên_file...`: Tạo file rỗng mới hoặc cập nhật timestamp của file đã có. Ví dụ: `touch file1.txt file2.txt file3.txt`.
- `ln [tùy chọn] <file_nguồn> <file_link>`: Tạo liên kết cứng hoặc liên kết mềm. Ví dụ: `ln -s file.txt file_link` tạo một soft link tên `file_link` trỏ tới `file.txt`.
- `cat / more / less / tail tên_file`: Xem nội dung file. Lệnh `tail -f file` cho phép theo dõi nội dung ghi thêm vào file theo thời gian thực, rất thích hợp để soi log dịch vụ như Tomcat (`tail -f catalina-2016-11-11.log`).
- `vim tên_file`: Chỉnh sửa nội dung file. Vim là trình soạn thảo văn bản cực kỳ mạnh mẽ trong Linux. Trong phát triển backend, Vim chủ yếu dùng để sửa file cấu hình. Quy trình thông dụng: `vim file ------> Mở file -----> Command Mode (Chế độ lệnh) ------> Nhấn phím 'i' để vào Insert Mode -----> Sửa file -------> Nhấn phím 'Esc' để về Command Mode -----> Gõ ':wq' hoặc ':q!'` (`:wq` là lưu và thoát; `:q!` là thoát bắt buộc không lưu).

### Nén và giải nén file

**1) Đóng gói và nén file:**

Trong Linux, file đóng gói lưu trữ thường có đuôi `.tar`, còn nén bằng gzip thường có đuôi `.gz`. Thao tác đóng gói và nén thường đi liền với nhau, tạo ra file có phần mở rộng `.tar.gz`.

Cú pháp: `tar -zcvf tên_file_nén.tar.gz danh_sách_file_cần_nén`, trong đó:

- `z`: Sử dụng gzip để nén.
- `c`: Tạo gói lưu trữ mới (create).
- `v`: Hiển thị chi tiết tiến trình thực hiện (verbose).
- `f`: Chỉ định tên file lưu trữ (file).

Ví dụ: Để nén thư mục `test` chứa `aaa.txt`, `bbb.txt`, `ccc.txt` thành `test.tar.gz`, chạy: `tar -zcvf test.tar.gz aaa.txt bbb.txt ccc.txt` hoặc `tar -zcvf test.tar.gz /test/`.

**2) Giải nén file:**

Cú pháp: `tar [-xvf] file_nén`

Trong đó chữ `x` đại diện cho giải nén (extract).

Ví dụ:

- Giải nén `test.tar.gz` vào thư mục hiện tại: `tar -xvf test.tar.gz`.
- Giải nén vào thư mục `/usr`: `tar -xvf test.tar.gz -C /usr` (cờ `-C` chỉ định thư mục đích).

### Truyền tải file

- `scp [tùy chọn] nguồn đích` (Secure Copy): Truyền file an toàn qua giao thức SSH giữa máy cục bộ và máy chủ từ xa. Ví dụ: `scp -r my_directory user@remote:/home/user` tải thư mục lên server; `scp -r user@remote:/home/user/my_directory .` tải từ server về máy. Cần đảm bảo server từ xa đã cài đặt SSH service và được cấu hình xác thực hợp lệ.
- `rsync [tùy chọn] nguồn đích`: Đồng bộ file hiệu năng cao giữa hai máy, có khả năng chỉ truyền các phần dữ liệu sai lệch (incremental sync), giúp tiết kiệm băng thông và thời gian. Ví dụ: `rsync -r my_directory user@remote:/home/user`.
- `ftp` (File Transfer Protocol): Kết nối với FTP server từ xa để upload, download hoặc xóa file (`put`, `get`, `delete`).

### Phân quyền file (File Permissions)

Mỗi file trong hệ điều hành đều gắn liền với quyền truy cập, người sở hữu (owner) và nhóm sở hữu (group). Quyền hạn là cơ chế hệ thống dùng để kiểm soát truy cập tài nguyên, chia thành 3 quyền: đọc (`r` - readable), ghi (`w` - writable) và thực thi (`x` - executable). Ba quyền này được áp dụng cho ba đối tượng: chủ sở hữu (`u` - user/owner), nhóm (`g` - group) và người dùng khác (`o` - others).

Dùng lệnh **`ls -l`** để xem quyền hạn chi tiết của các file và thư mục.

Ví dụ: Chạy `ls -l` trong một thư mục bất kỳ:

![Ví dụ kiểm tra quyền file Linux](/media/jg/local/cs-basics/operating-system/images/Linux-c747b4.png)

Ý nghĩa các trường trong cột đầu tiên:

![Giải thích các trường quyền file Linux](/media/jg/local/cs-basics/operating-system/images/Linux-efdb5f.png)

> Giải thích chi tiết về kiểu file, quyền hạn và các đối tượng:

**Kiểu file:**

- `d`: Thư mục (directory).
- `-`: File thông thường (regular file).
- `l`: Liên kết mềm (symbolic link).

**Các mức quyền trong Linux:**

- `r`: Quyền đọc, tương ứng giá trị số là 4.
- `w`: Quyền ghi, tương ứng giá trị số là 2.
- `x`: Quyền thực thi, tương ứng giá trị số là 1.

**Sự khác biệt giữa quyền trên File và Thư mục:**

Quyền đọc, ghi, thực thi có ý nghĩa khác nhau đối với file và thư mục:

Đối với file:

| Tên quyền | Thao tác cho phép |
| :--- | ---: |
| `r` | Xem nội dung file (dùng `cat`, `less`...) |
| `w` | Sửa đổi hoặc thêm nội dung vào file |
| `x` | Chạy file như một chương trình nhị phân hoặc script |

Đối với thư mục:

| Tên quyền | Thao tác cho phép |
| :--- | ---: |
| `r` | Xem danh sách file trong thư mục (`ls`) |
| `w` | Tạo, đổi tên hoặc xóa file trong thư mục |
| `x` | Đi vào thư mục (`cd`) hoặc duyệt qua thư mục |

Tài khoản `root` truyền thống thường sở hữu các capability giúp bỏ qua các kiểm tra kiểm soát truy cập tùy ý (DAC) thông thường; tuy nhiên, điều này không có nghĩa là root có thể vượt qua mọi rào cản như Linux Capabilities, LSM (SELinux/AppArmor), mount options (`ro`, `noexec`) hay cờ immutable (`chattr +i`). Một đối tượng có quyền `000` cũng không thể bị coi đơn giản là root chắc chắn luôn thực thi hay truy cập được trong mọi trường hợp.

**Mỗi người dùng trong Linux bắt buộc phải thuộc về một nhóm. Mỗi file có khái niệm Owner, Group và Others:**

- **Chủ sở hữu (Owner - `u`)**: Thường là người tạo ra file. Xem bằng lệnh `ls -ahl`; đổi chủ sở hữu bằng lệnh `chown username filename`.
- **Nhóm sở hữu (Group - `g`)**: Nhóm của người tạo file tại thời điểm tạo. Xem bằng `ls -ahl`; đổi nhóm bằng lệnh `chgrp groupname filename`.
- **Khác (Others - `o`)**: Tất cả các người dùng khác không phải là owner và cũng không nằm trong group của file.

**Lệnh thay đổi quyền file/thư mục: `chmod`**

Ví dụ: Cấp cho file `aaa.txt` quyền owner toàn quyền (`rwx`), group có quyền đọc/ghi (`rw`), others chỉ có quyền đọc (`r`):

**`chmod u=rwx,g=rw,o=r aaa.txt`** hoặc **`chmod 764 aaa.txt`**

![Ví dụ lệnh chmod thay đổi quyền file Linux](/media/jg/local/cs-basics/operating-system/images/asset-3daf07.png)

**Bổ sung kiến thức thiết lập dịch vụ khởi động cùng hệ thống:**

Nếu cài đặt ZooKeeper, làm thế nào để nó tự động chạy mỗi khi máy khởi động?

Các bản phân phối Linux hiện đại hầu hết đều sử dụng `systemd` để quản lý service. Cách làm chuẩn mực là tạo một file unit `zookeeper.service`, sau đó dùng các lệnh sau:

```bash
sudo systemctl enable zookeeper
sudo systemctl start zookeeper
sudo systemctl status zookeeper
```

Nếu có chỉnh sửa file service, bạn phải chạy `sudo systemctl daemon-reload` trước để systemd tải lại cấu hình. Các lệnh như `chkconfig --add zookeeper` hay `chkconfig --list` thuộc về thời kỳ SysV init cũ, chỉ còn dùng trên các distro cổ điển hoặc môi trường tương thích ngược.

### Quản lý người dùng (User Management)

Linux là hệ điều hành chia sẻ thời gian (time-sharing), đa người dùng và đa nhiệm. Bất kỳ ai muốn sử dụng tài nguyên đều phải có tài khoản do quản trị viên cấp để đăng nhập vào hệ thống.

Tài khoản người dùng giúp quản trị viên theo dõi hoạt động, phân bổ tài nguyên và bảo vệ an toàn cho hệ thống.

**Các lệnh quản trị người dùng:**

- `useradd [tùy chọn] tên_người_dùng`: Tạo tài khoản mới. Thông tin tài khoản được lưu trữ trong file `/etc/passwd`.
- `userdel [tùy chọn] tên_người_dùng`: Xóa tài khoản người dùng.
- `usermod [tùy chọn] tên_người_dùng`: Chỉnh sửa thuộc tính của tài khoản như UID, shell mặc định, thư mục home.
- `passwd [tùy chọn] tên_người_dùng`: Thiết lập mật khẩu và chính sách mật khẩu. Ví dụ: `passwd -S tên_user` hiển thị trạng thái mật khẩu; `passwd -d tên_user` xóa mật khẩu (việc cho phép đăng nhập không mật khẩu phụ thuộc vào PAM); `passwd -l tên_user` khóa xác thực bằng mật khẩu (vẫn có thể đăng nhập bằng SSH key); `passwd tên_user` đổi mật khẩu.
- `su [tùy chọn] tên_người_dùng` (Switch User): Chuyển đổi danh tính người dùng trong phiên làm việc hiện tại.

### Quản lý nhóm người dùng (Group Management)

Mỗi người dùng đều thuộc về một nhóm, giúp hệ thống quản lý phân quyền tập trung cho nhiều người cùng lúc. Danh sách các nhóm và thành viên được lưu trữ trong `/etc/group`.

**Các lệnh quản trị nhóm:**

- `groupadd [tùy chọn] tên_nhóm`: Tạo một nhóm người dùng mới.
- `groupdel tên_nhóm`: Xóa một nhóm đã tồn tại.
- `groupmod [tùy chọn] tên_nhóm`: Sửa thuộc tính của nhóm (tên nhóm, GID).

### Trạng thái hệ thống (System Status)

- `top [tùy chọn]`: Xem theo thời gian thực mức sử dụng CPU, RAM, danh sách tiến trình và load average.
- `htop [tùy chọn]`: Bản nâng cấp trực quan, tương tác thân thiện hơn của `top`, hỗ trợ cuộn chuột, màu sắc và thao tác trực tiếp.
- `uptime [tùy chọn]`: Xem thời gian máy đã hoạt động liên tục và mức tải trung bình (load average 1, 5, 15 phút).
- `vmstat [chu_kỳ] [số_lần]`: Báo cáo thống kê bộ nhớ ảo, độ dài run queue (`r`), tiến trình bị block (`b`), context switch (`cs`) và I/O đĩa.
- `free [tùy chọn]`: Xem tình trạng sử dụng bộ nhớ RAM vật lý và Swap, bao gồm cả buffer và cache.
- `df [tùy chọn] [hệ_thống_tệp]`: Xem dung lượng đĩa còn trống của các file system (`df -h`, `df -a`).
- `du [tùy chọn] [tệp/thư_mục]`: Thống kê dung lượng đĩa thực tế mà một file hoặc thư mục đang chiếm dụng.
- `sar [tùy chọn] [chu_kỳ] [số_lần]`: Công cụ mạnh mẽ thu thập, báo cáo và lưu trữ số liệu hiệu năng hệ thống (CPU, RAM, Disk I/O, Network) theo thời gian dài với chi phí tài nguyên cực thấp.
- `ps [tùy chọn]`: Chụp ảnh nhanh các tiến trình đang chạy. `ps -ef` hoặc `ps aux` hiển thị danh sách tiến trình với các định dạng khác nhau. Ví dụ: `ps aux | grep redis` hoặc `pgrep redis -a`.
- `systemctl [lệnh] [tên_dịch_vụ]`: Quản lý các dịch vụ systemd (start, stop, restart, status, enable).
- `journalctl [tùy chọn]`: Xem log của systemd, công cụ hàng đầu để điều tra lỗi khởi động dịch vụ hoặc sự cố hệ thống. Ví dụ: `journalctl -u nginx -f` theo dõi log Nginx trực tiếp; `journalctl -xe` xem ngữ cảnh lỗi hệ thống gần nhất.

### Giao tiếp mạng (Networking)

- `ping [tùy chọn] máy_đích`: Kiểm tra kết nối mạng tới host đích qua gói tin ICMP.
- `ifconfig` hoặc `ip`: Xem và cấu hình thông tin card mạng, địa chỉ IP, MAC và trạng thái cổng mạng.
- `netstat [tùy chọn]`: Xem các kết nối mạng, cổng đang lắng nghe (listening ports) và bảng định tuyến.
- `ss [tùy chọn]`: Công cụ hiện đại thay thế cho `netstat`, trích xuất thông tin socket trực tiếp từ kernel với tốc độ nhanh hơn nhiều.
- `nload`: Công cụ theo dõi lưu lượng mạng thời gian thực trong terminal với biểu đồ trực quan. `nload` không lưu dữ liệu lịch sử và cần cài đặt thủ công.
- `sudo hostnamectl set-hostname tên_máy_mới`: Đổi hostname của máy vĩnh viễn, vẫn có hiệu lực sau khi reboot. Dùng lệnh `sudo hostname tên_mới` chỉ có tác dụng tạm thời cho đến khi máy khởi động lại.

### Các lệnh khác

- `sudo + lệnh`: Thực thi câu lệnh với đặc quyền của superuser (`root`).
- `grep [tùy chọn] "chuỗi_tìm_kiếm" đường_dẫn_file`: Lệnh tìm kiếm văn bản cực kỳ mạnh mẽ theo chuỗi hoặc biểu thức chính quy (regex). Ví dụ: `grep -i "error" /var/log/syslog` tìm các dòng có chữ error không phân biệt hoa thường; `ps -ef | grep "java"` lọc các tiến trình Java.
- `kill -9 <PID>`: Gửi tín hiệu `SIGKILL` (-9) để buộc dừng ngay lập tức một tiến trình theo PID.
- `shutdown`: `shutdown -h now` tắt máy ngay lập tức; `shutdown +5 "System will shutdown after 5 minutes"` hẹn giờ tắt máy sau 5 phút kèm thông báo cho người dùng.
- `reboot`: Khởi động lại hệ điều hành. Lệnh `reboot -w` chỉ ghi log mô phỏng chứ không khởi động lại thật.

## Biến môi trường trong Linux (Environment Variables)

Trong Linux, biến môi trường dùng để định nghĩa các tham số vận hành cho hệ thống, chẳng hạn như thư mục home của từng người dùng (`HOME`) hay đường dẫn tìm kiếm lệnh thực thi (`PATH`).

### Phân loại biến môi trường

Theo phạm vi tác dụng:

- Biến môi trường cấp người dùng: Cấu hình trong `~/.bashrc`, `~/.bash_profile`.
- Biến môi trường cấp hệ thống: Cấu hình trong `/etc/bashrc`, `/etc/environment`, `/etc/profile`, `/etc/profile.d/`.

Thứ tự nạp các file cấu hình phụ thuộc vào việc shell đó là login shell, interactive non-login shell, hay non-interactive shell. Với Bash, một login shell thường đọc `/etc/profile`, rồi đọc file đầu tiên tồn tại và đọc được trong danh sách `~/.bash_profile`, `~/.bash_login`, hoặc `~/.profile`; interactive non-login shell thường nạp `~/.bashrc`. Nhiều bản phân phối cấu hình sẵn việc nạp `~/.bashrc` từ trong `~/.bash_profile`, do đó chuỗi nạp thực tế còn bị chi phối bởi cấu hình mặc định của từng distro.

Để sửa đổi các file biến môi trường cấp hệ thống, người dùng cần có quyền root hoặc quyền ghi tương ứng.

Khuyến nghị: Cấu hình biến môi trường cấp người dùng trong `~/.bash_profile`, và cấu hình biến môi trường cấp hệ thống trong các script đặt tại `/etc/profile.d/`.

Theo vòng đời:

- Vĩnh viễn: Khai báo trong các file cấu hình, có hiệu lực lâu dài qua các phiên làm việc.
- Tạm thời: Khai báo trực tiếp trong terminal bằng lệnh `export`, sẽ mất đi ngay khi đóng cửa sổ terminal.

### Đọc biến môi trường

Dùng lệnh `export` để xem danh sách toàn bộ các biến môi trường đã được xuất ra trong shell hiện tại:

```bash
# Liệt kê các biến môi trường hiện tại
export -p
```

Ngoài ra, lệnh `env` cũng có thể hiển thị tất cả các biến môi trường.

Dùng lệnh `echo` để in ra giá trị của một biến cụ thể:

```bash
# In giá trị biến môi trường PATH
echo $PATH
# In giá trị biến môi trường HOME
echo $HOME
```

### Sửa đổi biến môi trường

Dùng lệnh `export` để sửa đổi biến môi trường trong phiên hiện tại. Cách này chỉ có hiệu lực với terminal hiện tại, đóng terminal sẽ mất, nhưng có hiệu lực tức thì.

```bash
export JAVA_HOME="/path/to/jdk"
export PATH="$JAVA_HOME/bin:$PATH"
```

Dùng `vim` để sửa file cấu hình nếu muốn lưu biến môi trường vĩnh viễn:

```bash
vim ~/.bash_profile
```

Nếu sửa file cấp hệ thống thì có hiệu lực với mọi user, nếu sửa file cấp người dùng thì chỉ áp dụng cho user đó.

Sau khi sửa xong, dùng lệnh `source` để nạp lại cấu hình ngay lập tức hoặc đăng xuất rồi đăng nhập lại:

```bash
source ~/.bash_profile
```
