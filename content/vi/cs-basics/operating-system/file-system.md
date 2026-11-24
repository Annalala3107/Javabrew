---
title: "Giải mã hệ thống file trong hệ điều hành: inode, VFS, Page Cache và Cơ chế ghi nhật ký (Journaling)"
description: "Tổng hợp câu hỏi phỏng vấn tần suất cao về hệ thống file (File System), từ file và thư mục, giải thích chi tiết inode, dentry, file descriptor, VFS, cấp phát khối đĩa, quản lý không gian trống, liên kết cứng, liên kết mềm, Page Cache, fsync và hệ thống file ghi nhật ký (Journaling)."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Linux
head:
  - - meta
    - name: keywords
      content: Hệ thống file,hệ thống file hệ điều hành,câu hỏi phỏng vấn hệ thống file,hệ thống file Linux,inode,dentry,VFS,file descriptor,liên kết cứng,liên kết mềm,Page Cache,fsync,ext4,hệ thống file ghi nhật ký,câu hỏi phỏng vấn hệ điều hành
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/file-system.md
---

Khi viết một hàm lưu trữ file, cách viết trực quan và tự nhiên nhất là: nhận đường dẫn file, gọi `open()` để mở file, ghi dữ liệu vào qua `write()`, và cuối cùng gọi `close()`. Khi số lượng file còn ít, mức độ đồng thời thấp, và phần cứng máy chủ không gặp trục trặc, quy trình này trông có vẻ chẳng có gì phức tạp.

Thế nhưng khi bước vào buổi phỏng vấn kỹ thuật, hàng loạt câu hỏi đào sâu sẽ lập tức xuất hiện: *Bộ mô tả file (fd) do hàm `open()` trả về thực chất trỏ tới cái gì?*, *Tên file có được lưu trong inode không?*, *Vì sao hai liên kết cứng (hard link) lại nhìn thấy cùng một nội dung?*, *Hàm `write()` trả về thành công thì dữ liệu đã thực sự nằm an toàn trên đĩa cứng chưa?*, *Vì sao file log đã bị xóa rồi mà lệnh `df -h` vẫn báo đĩa cứng bị đầy 100%?*

Tất cả các câu hỏi này đều bắt nguồn từ hệ thống file (File System). Nó phải phân giải chuỗi đường dẫn thành các đối tượng file trong Kernel, định vị byte thứ $N$ của file xuống khối lưu trữ vật lý tương ứng dưới đĩa, đồng thời quản lý quyền hạn, bộ đệm, xóa file, đổi tên và phục hồi sau sự cố sập nguồn.

Câu trả lời nằm gọn trong các cấu trúc inode, dentry, VFS, Page Cache và cơ chế ghi nhật ký (journaling).

Dưới đây chúng ta sẽ bắt đầu từ câu hỏi nền tảng nhất: Hệ thống file thực chất đang quản lý những gì?

## Hệ thống file thực chất đang quản lý những gì?

Khi viết code hàng ngày, những gì chúng ta nhìn thấy là đường dẫn, tên file, thư mục, hàm `read()`, hàm `write()`. Đối với các hệ thống file được xây dựng trên các thiết bị khối (block device) cục bộ, tầng dưới cùng thực tế là các khối logic (logical block), sector đĩa và thao tác I/O thiết bị; hệ thống file có nhiệm vụ tổ chức các tài nguyên tầng thấp này thành các file, thư mục và metadata hoàn chỉnh.

Tuy nhiên, không phải mọi hệ thống file đều tương ứng với đĩa cứng vật lý trên máy. `tmpfs` sử dụng bộ nhớ RAM làm nơi lưu trữ; `procfs` hiển thị trạng thái vận hành thời gian thực của Kernel dưới dạng file ảo; còn NFS thì ghép nối hệ thống file từ máy chủ từ xa vào cây thư mục cục bộ. Tầng VFS (Virtual File System) đứng trên tất cả các phương án hiện thực này để cung cấp một giao diện file thống nhất cho toàn bộ hệ thống.

Tôi khuyên bạn nên nhìn nhận hệ thống file dưới góc độ giải quyết đồng thời 4 bài toán cốt lõi:

![Tổng quan trách nhiệm của hệ thống file](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-system-responsibilities-e613f01c.webp)

- **Đặt tên (Naming)**: Dùng đường dẫn và tên file để tìm chính xác file mục tiêu, ví dụ `/var/log/app.log`.
- **Tổ chức (Organization)**: Dùng cây thư mục để quản lý file có tôn ti trật tự, giúp các file khác nhau được quy hoạch gọn gàng trong các thư mục riêng biệt.
- **Định vị (Locating)**: Ánh xạ byte thứ $N$ của file tới một khối dữ liệu cụ thể trên đĩa HDD hoặc SSD.
- **Bảo vệ (Protection)**: Ghi nhận quyền truy cập, chủ sở hữu (owner), các mốc thời gian (timestamps) và thực hiện kiểm tra quyền hạn nghiêm ngặt trong mỗi lần truy cập.

Nếu không có hệ thống file, ứng dụng sẽ phải tự ghi nhớ xem *"khối thứ mấy đến khối thứ mấy thuộc về file nào"*, đồng thời phải tự viết code xử lý xóa file, tăng dung lượng, phân quyền và phục hồi sau sự cố sập nguồn. Hệ thống file gói gọn toàn bộ những việc phức tạp này sau một giao diện thống nhất, ứng dụng chỉ cần cầm file descriptor để đọc ghi dữ liệu.

Bài viết này tập trung phân tích theo phong cách Linux/Unix. Dù cách hiện thực trên NTFS, APFS, Btrfs, XFS, hay ext4 có những nét dị biệt, nhưng các bài toán nền tảng về file, thư mục, metadata, bộ đệm, cấp phát khối và phục hồi sau sự cố là hoàn toàn tương đồng.

## File và Thư mục thực chất là gì?

Trong ngữ cảnh Unix/Linux, một file thông thường (regular file) có thể hiểu là một chuỗi các byte có tên gọi và metadata đi kèm, thường được lưu trữ trên các thiết bị bền vững. VFS cũng sử dụng cùng một giao diện file này để hiển thị thư mục, thiết bị phần cứng, FIFO (đường ống có tên), Unix domain socket, và các đối tượng file giả (pseudo-filesystems).

Vì thế, câu nói nổi tiếng **"mọi thứ đều là file"** cần được hiểu một cách chuẩn xác là: Linux cố gắng để các loại tài nguyên khác nhau có thể được truy cập thông qua các file descriptor và một giao diện I/O thống nhất, chứ không có nghĩa là mọi đối tượng đều sẽ thực sự được ghi dữ liệu xuống đĩa cứng. Dữ liệu trong pipe chỉ nằm trong bộ đệm RAM của Kernel, còn phần lớn nội dung trong `/proc` là do Kernel sinh ra theo thời gian thực khi được đọc.

Thư mục thực chất cũng là một loại file, chỉ có điều nội dung dữ liệu bên trong của nó khá đặc biệt. Trong các hệ thống file phong cách Unix như ext4, dữ liệu của thư mục chủ yếu lưu trữ bảng ánh xạ từ **"tên file sang số hiệu inode"**. Khi người dùng tìm file thông qua đường dẫn, hệ thống file sẽ lần lượt tra cứu từng cấp thư mục:

```text
/home/guide/a.txt
  -> Tra cứu thư mục gốc /
  -> Tìm thấy thư mục home
  -> Đi vào home, tìm thấy thư mục guide
  -> Đi vào guide, tìm thấy file a.txt
```

Cây thư mục giúp các file có được cấu trúc phân cấp. Cơ chế gắn kết (Mount) lại cho phép ghép nối nhiều hệ thống file khác nhau vào cùng một cây thư mục duy nhất. Ví dụ sau khi gắn phân vùng `/dev/sda2` vào thư mục `/data`, thì khi bạn truy cập `/data/app.log`, thực tế là bạn đang truy cập vào hệ thống file nằm trên một phân vùng đĩa khác.

Dù thư mục bên trong hệ thống file cũng sở hữu các khối dữ liệu và inode riêng, nhưng ở User Space bạn không thể gọi trực tiếp hàm `read()` như với file thông thường, mà bắt buộc phải thông qua các giao diện duyệt thư mục chuyên trách như `readdir()` hoặc `getdents()`.

## Mối quan hệ giữa inode, dentry và tên file là gì?

Trong hệ thống file Linux/Unix, việc hiểu thấu đáo khái niệm **inode** là tối quan trọng.

**inode (index node - nút chỉ mục) ghi nhận toàn bộ metadata của file**, nội dung phổ biến gồm có: loại file, quyền hạn truy cập, chủ sở hữu (UID/GID), kích thước file, các mốc thời gian (atime, mtime, ctime), số lượng liên kết (link count), và các con trỏ trỏ tới vị trí các khối dữ liệu trên đĩa.

Điều đặc biệt quan trọng cần ghi nhớ: **inode không hề lưu tên file**. Tên file thuộc về các mục thư mục (directory entry); cùng một inode có thể có nhiều tên file khác nhau cùng trỏ tới. Nội dung dữ liệu của file thông thường nằm trong các khối dữ liệu độc lập (data blocks) hoặc extents, inode chỉ lưu giữ thông tin ánh xạ dữ liệu. Tuy nhiên, một số hệ thống file có tối ưu hóa nội dòng (inline): ví dụ ext4 có thể nhét trực tiếp nội dung của các file cực nhỏ hoặc đích đến của liên kết mềm ngắn vào thẳng khoảng trống còn thừa bên trong cấu trúc inode.

Linux VFS còn duy trì cấu trúc **dentry** trong bộ nhớ RAM. dentry (directory entry) đại diện cho một thành phần trong đường dẫn, đóng vai trò làm bộ nhớ đệm (cache) tra cứu tên file; nó thường trỏ tới một inode, nhưng cũng có thể là một "negative dentry" biểu thị một đường dẫn không tồn tại. Có thể phân định ranh giới một cách khúc chiết như sau:

- **Tên file**: Được lưu trữ bên trong các mục thư mục trên đĩa cứng.
- **dentry**: Do VFS duy trì trong bộ nhớ RAM làm cấu trúc phân giải đường dẫn và bộ đệm tra cứu.
- **inode**: Đại diện cho đối tượng hệ thống file, lưu trữ metadata và thông tin ánh xạ khối dữ liệu.
- **Khối dữ liệu (Data Blocks / Extents)**: Lưu trữ nội dung dữ liệu thực tế của file thông thường.

Điều này giải thích vì sao thao tác đổi tên file thường diễn ra trong chớp mắt. Lệnh `mv a.txt b.txt` nếu diễn ra trong cùng một hệ thống file thì phần lớn trường hợp chỉ đơn thuần là sửa lại ánh xạ tên trong mục thư mục, còn bản thân nội dung file và inode không hề bị xê dịch.

![Mối quan hệ giữa tên file, dentry và inode](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-inode-dentry-relation-9ed196c7.webp)

Bạn có thể dùng các lệnh dưới đây để quan sát những thông tin này:

```bash
# Xem số hiệu inode của file
ls -li app.log

# Xem metadata chi tiết của file
stat app.log

# Xem tình trạng sử dụng inode của hệ thống file
df -i
```

Đối với các hệ thống file tạo sẵn bảng inode cố định từ lúc format như ext4, số lượng inode có thể bị cạn kiệt trước cả khi các khối dữ liệu bị dùng hết. Đĩa cứng máy chủ kiểm tra qua `df -h` trông có vẻ vẫn còn thừa hàng chục GB dung lượng, nhưng việc sinh ra hàng triệu file bé xíu đã làm cạn kiệt toàn bộ số inode khả dụng, khiến thao tác tạo file mới vẫn báo lỗi `No space left on device`. Do cách cấp phát inode ở các hệ thống file hiện đại không hoàn toàn giống nhau, việc giải thích kết quả `df -i` cũng cần đối chiếu với hệ thống file cụ thể.

## Điều gì xảy ra khi bạn gọi `open` một file?

Khi ứng dụng gọi hàm `open()`, Kernel không hề đọc toàn bộ nội dung file vào bộ nhớ. Nó chủ yếu thực hiện các bước sau:

1. Phân giải chuỗi đường dẫn, duyệt qua các dentry để tìm ra mục thư mục và inode tương ứng.
2. Kiểm tra xem quyền truy cập, các cờ mở file và loại file có hợp lệ hay không.
3. Tạo ra một đối tượng file đã mở (open file description - struct `file`) trong Kernel, ghi nhận độ lệch vị trí đọc ghi hiện tại (file offset), trạng thái mở và các cờ truy cập.
4. Cấp phát một số nguyên không âm nhỏ nhất còn trống trong bảng mô tả file của Process hiện tại, và trả về con số này chính là **fd**.

Tài liệu Linux man-pages giải thích rất rành mạch sự phân chia này: `open()` trả về chỉ số (index) trong bảng mô tả file riêng của Process; mỗi lần gọi `open()` thành công sẽ sinh ra một open file description trong phạm vi toàn hệ thống để quản lý con trỏ offset và cờ trạng thái.

Các cấu trúc này rất dễ bị hiểu lẫn lộn:

![Từ đường dẫn tới file descriptor](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-path-to-fd-2e2e40b2.webp)

| Cấu trúc | Thuộc phạm vi | Nội dung chính lưu trữ |
| --- | --- | --- |
| **Bảng mô tả file (FD Table)** | Riêng cho từng Process | Tham chiếu từ số hiệu fd sang đối tượng file đã mở |
| **Đối tượng file đã mở (`file`)** | Phạm vi toàn hệ thống | Con trỏ vị trí hiện tại (offset), trạng thái mở, cờ đọc/ghi |
| **Bảng/Cache inode** | Hệ thống file và Kernel | Metadata của file, vị trí các khối dữ liệu trên đĩa |

Sau khi gọi `dup()` hoặc `fork()`, nhiều fd có thể cùng trỏ về một đối tượng file đã mở duy nhất, do đó chúng dùng chung con trỏ offset đọc ghi. Ngược lại, nếu hai Process độc lập cùng gọi `open()` trên cùng một file, chúng sẽ nhận được hai đối tượng file đã mở hoàn toàn khác nhau, mỗi bên tự duy trì con trỏ offset của riêng mình.

Đây chính là nguồn gốc giải thích cho hiện tượng thực tế: **Một file đã bị xóa nhưng Process đang mở nó vẫn có thể tiếp tục ghi dữ liệu bình thường.** Lệnh `unlink()` chỉ xóa tên file khỏi thư mục và giảm biến đếm liên kết của inode đi 1. Chỉ khi liên kết cứng cuối cùng bị xóa BỎ VÀ toàn bộ các tham chiếu mở file, các vùng ánh xạ bộ nhớ trong Kernel được giải phóng hoàn toàn, thì không gian các khối đĩa thực tế mới được thu hồi.

## File được sắp xếp như thế nào trên đĩa cứng?

Đĩa cứng và SSD giao tiếp với bên ngoài theo đơn vị khối (block). Hệ thống file chia một phân vùng đĩa thành nhiều khối cố định, sau đó dùng các cấu trúc metadata để quản lý chúng. Lấy hệ thống file dòng ext làm ví dụ, bố cục đĩa thường bao gồm các phân khu sau:

- **Siêu khối (Superblock)**: Ghi lại thông tin tổng thể của hệ thống file, ví dụ kích thước khối, tổng số inode, số khối trống, trạng thái mount.
- **Vùng inode**: Chứa bảng lưu trữ các inode.
- **Vùng khối dữ liệu**: Chứa nội dung thực tế của file và dữ liệu thư mục.
- **Bitmap hoặc cấu trúc không gian trống**: Đánh dấu những inode nào và khối dữ liệu nào đang rảnh rỗi chưa dùng.

Trong sách giáo khoa, việc cấp phát khối file thường được chia thành ba phương thức: cấp phát liên tục, cấp phát liên kết và cấp phát chỉ mục. Chúng rất hữu ích để hiểu về tư duy đánh đổi kỹ thuật:

**Cấp phát liên tục (Contiguous Allocation)** đặt một file vào một chuỗi các khối đĩa vật lý liên tiếp nhau. Ưu điểm là cả đọc tuần tự lẫn truy cập ngẫu nhiên đều cực kỳ nhanh, chỉ cần biết khối bắt đầu và độ dài là định vị được ngay. Nhược điểm chí mạng là file rất khó mở rộng kích thước, và việc tạo/xóa liên tục sẽ để lại phân mảnh ngoại vi nghiêm trọng.

**Cấp phát liên kết (Linked Allocation)** cho phép các khối của file nằm rải rác khắp nơi trên đĩa, mỗi khối chứa một con trỏ trỏ tới khối tiếp theo. Nó không đòi hỏi không gian liên tục, mở rộng file dễ dàng, nhưng truy cập ngẫu nhiên cực kỳ tệ hại. Muốn đọc khối thứ 1000, hệ thống có thể phải lần mò theo con trỏ từ khối số 1 đi qua đủ 999 khối trước đó. Hệ thống file FAT gom các con trỏ này vào một bảng bảng cấp phát tập trung (File Allocation Table) để tăng tốc tra cứu, nhưng bản thân bảng này lại trở thành metadata phình to theo kích thước đĩa.

**Cấp phát chỉ mục (Indexed Allocation)** gom toàn bộ địa chỉ các khối dữ liệu vào các khối chỉ mục (index blocks). Muốn đọc khối thứ $i$, hệ thống chỉ cần tra cứu mục thứ $i$ trong khối chỉ mục rồi nhảy thẳng tới khối dữ liệu tương ứng. Nó hỗ trợ truy cập ngẫu nhiên rất tốt, không bị phân mảnh ngoại vi, nhưng phải tốn thêm không gian đĩa để lưu các khối chỉ mục.

Hệ thống ext2/ext3 kinh điển dùng cấu trúc con trỏ chỉ mục nhiều tầng: con trỏ trực tiếp (direct), gián tiếp cấp 1, cấp 2 và cấp 3. Sang ext4, kiến trúc này được thay thế bằng **cây extent (extent tree)**: một extent ghi nhận điểm bắt đầu logic, điểm bắt đầu vật lý và độ dài của một đoạn khối vật lý liên tục. Đối với các file lớn liên tục, extents tiết kiệm được lượng metadata ánh xạ khổng lồ so với việc phải lưu địa chỉ của từng khối riêng lẻ.

![Các phương thức định vị khối dữ liệu file](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-block-allocation-19a7c361.webp)

Các hệ thống file hiện đại khác có thể sử dụng cây B-tree, extent, cấp phát trễ (delayed allocation), copy-on-write... Do đó không nên coi cấu trúc khối trực tiếp/gián tiếp là hiện thực phổ quát của mọi hệ thống file ngày nay.

## Không gian đĩa trống được quản lý như thế nào?

Khi một file bị xóa, các khối dữ liệu nó từng chiếm dụng phải được trả lại cho hệ thống file; khi có file mới được ghi, hệ thống phải nhanh chóng tìm ra các khối trống để cấp phát. Đó là nhiệm vụ của việc quản lý không gian trống.

Các phương pháp phổ biến gồm:

- **Bảng vùng trống (Free Table)**: Ghi lại điểm bắt đầu và độ dài của từng khoảng trống liên tục. Hợp với cấp phát liên tục, nhưng bảng sẽ phức tạp dần khi phân mảnh tăng lên.
- **Danh sách liên kết vùng trống (Free List)**: Nối toàn bộ các khối trống thành một danh sách liên kết, việc cấp và thu hồi từng khối đơn lẻ rất nhanh, nhưng tìm một dải không gian liên tục thì rất bất tiện.
- **Mảng bit (Bitmap)**: Mỗi khối đĩa tương ứng với 1 bit: 0 là trống, 1 là đang dùng. Tìm kiếm không gian trống liên tục chỉ cần quét bit trên CPU, và chi phí dung lượng rất tiết kiệm.
- **Liên kết theo nhóm (Group Linking)**: Gom địa chỉ của một nhóm khối trống nhét vào trong một khối, rồi liên kết sang nhóm tiếp theo, rất phổ biến ở các hệ thống Unix đời đầu.

Bitmap là phương án cực kỳ thông dụng. Giả sử hệ thống file có dung lượng 1 TiB, kích thước khối là 4 KiB, tổng cộng sẽ có $2^{28}$ khối. Mỗi khối dùng 1 bit để đánh dấu, thì toàn bộ bitmap chỉ tốn khoảng 32 MiB. Chi phí bộ nhớ này là hoàn toàn chấp nhận được để đổi lấy khả năng quản lý trạng thái khối rõ ràng, tốc độ cao.

Các hệ thống file thực tế còn kết hợp thêm các chiến lược cấp phát thông minh để giảm phân mảnh. Ví dụ ưu tiên gom các file trong cùng một thư mục, hoặc các extent liên tục của một file lớn nằm gần nhau về mặt vật lý để tối ưu hóa việc đọc tuần tự. Dù SSD không gặp vấn đề thời gian tìm kiếm cơ học (seek time) như ổ HDD, nhưng việc ghi tuần tự, hiện tượng khuếch đại ghi (write amplification), ranh giới khối xóa (erase block) và lệnh TRIM vẫn ảnh hưởng sâu sắc đến hiệu năng và tuổi thọ của ổ cứng thể rắn.

## VFS giải quyết vấn đề gì?

Linux hỗ trợ hàng chục hệ thống file khác nhau: ext4, XFS, Btrfs, tmpfs, procfs, NFS... Chương trình người dùng không thể viết code phân nhánh kiểu gọi `open_ext4()`, `open_xfs()`.

**VFS (Virtual File System - Hệ thống file ảo)** chính là tầng trừu tượng hóa trung gian. Ứng dụng người dùng chỉ cần gọi các system call POSIX tiêu chuẩn như `open`, `read`, `write`, `close`, và VFS sẽ căn cứ vào hệ thống file cụ thể nơi file đang tọa lạc để chuyển tiếp thao tác tới driver hiện thực tương ứng.

Tài liệu chính thức của Linux VFS định nghĩa 4 đối tượng trừu tượng cốt lõi:

- **superblock**: Đại diện cho một hệ thống file đã được mount vào hệ thống.
- **inode**: Đại diện cho một đối tượng cụ thể trong hệ thống file (file thông thường, thư mục, FIFO...).
- **dentry**: Đại diện cho một thành phần trong đường dẫn, dùng để cache việc tra cứu tên.
- **file**: Đại diện cho đối tượng file đã mở tương ứng với một phiên mở file (nằm sau mỗi fd).

Nhờ có VFS, việc chạy lệnh `cat /proc/cpuinfo`, `cat /var/log/app.log`, hay đọc dữ liệu từ một thư mục mount qua mạng bằng NFS đều sử dụng chung một tập hợp giao diện User Space giống hệt nhau. Mọi khác biệt phức tạp đều bị nén chặt xuống dưới tầng trừu tượng của VFS.

## Liên kết cứng và Liên kết mềm khác nhau như thế nào?

Cả liên kết cứng (Hard Link) và liên kết mềm (Symbolic Link / Soft Link) đều cho phép gắn một đường dẫn tới một file, nhưng đối tượng mà chúng trỏ tới là hoàn toàn khác nhau.

| Tiêu chí | Liên kết cứng (Hard Link) | Liên kết mềm (Soft Link / Symlink) |
| --- | --- | --- |
| **Đối tượng trỏ tới** | Cùng một `inode` | Một chuỗi đường dẫn file khác |
| **Có tạo inode mới không?** | Không tạo inode mới; chỉ thêm một mục thư mục và tăng số đếm liên kết của inode | Có; liên kết mềm là một file độc lập có số hiệu inode của riêng nó |
| **Sau khi xóa file nguồn** | Dữ liệu vẫn tồn tại chừng nào còn ít nhất một liên kết cứng | Trở thành liên kết bị đứt (dangling link / link hỏng) |
| **Có thể liên kết xuyên hệ thống file không?** | Không | Có |
| **Có thể liên kết tới thư mục không?** | Linux không cho phép người dùng thông thường tạo liên kết cứng tới thư mục | Có |

![So sánh giữa Liên kết cứng và Liên kết mềm](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-hardlink-symlink-0dd2c4bf.webp)

Liên kết cứng tuyệt đối không thể đi xuyên qua các hệ thống file khác nhau, bởi vì số hiệu inode chỉ có ý nghĩa duy nhất bên trong hệ thống file chứa nó. Một hệ thống file khác sở hữu bảng inode độc lập của riêng mình, cùng một con số inode sang bên kia sẽ đại diện cho một file hoàn toàn xa lạ.

Bạn có thể tự mình làm một thí nghiệm nhỏ bằng các lệnh sau:

```bash
echo hello > a.txt
ln a.txt hard.txt
ln -s a.txt soft.txt

ls -li a.txt hard.txt soft.txt
```

Bạn sẽ thấy `a.txt` và `hard.txt` có số hiệu inode giống hệt nhau, trong khi `soft.txt` có số hiệu inode khác biệt hoàn toàn. Xóa `a.txt` đi, đọc `hard.txt` vẫn ra chữ "hello", còn `soft.txt` sẽ trỏ vào một đường dẫn không tồn tại.

## Vì sao Page Cache chi phối hiệu năng đọc ghi file?

Việc đọc ghi trực tiếp xuống đĩa cứng vật lý là quá chậm chạp. Linux sử dụng **Page Cache** để lưu tạm dữ liệu file trên bộ nhớ RAM vật lý.

Khi đọc file, nếu trang dữ liệu cần tìm đã nằm sẵn trong Page Cache, Kernel có thể sao chép trực tiếp dữ liệu từ RAM sang User Space mà không cần đụng tới đĩa cứng. Chỉ khi xảy ra cache miss, Kernel mới thực sự phát lệnh đọc từ đĩa nạp vào Page Cache rồi mới trả về cho ứng dụng.

Đối với các thao tác buffered I/O thông thường, lệnh `write()` trả về thành công thường chỉ mang ý nghĩa là dữ liệu đã được Kernel tiếp nhận an toàn — trường hợp phổ biến nhất là dữ liệu đã nằm trong Page Cache và được đánh dấu là **trang bẩn (dirty page)**. Nó hoàn toàn không cam kết toàn bộ số byte yêu cầu đã được ghi xuống đĩa, và cũng không đảm bảo dữ liệu đã được lưu trữ bền vững (persisted) vào phần cứng lưu trữ. Ứng dụng phải tự xử lý việc ghi thiếu byte (partial write); và nếu đòi hỏi tính bền vững, ứng dụng bắt buộc phải kiểm tra lỗi trả về từ `fsync()`, `fdatasync()` và `close()`.

`fdatasync()` cũng đồng bộ dữ liệu file xuống đĩa, nhưng chỉ đồng bộ phần metadata tối thiểu bắt buộc phải có cho các lần đọc tiếp theo (như kích thước file); trong khi `fsync()` đồng bộ cả dữ liệu file lẫn toàn bộ các metadata liên quan (như timestamp). Lưu ý rằng đây là hành vi của buffered I/O thông thường; các cờ như `O_DIRECT`, `O_SYNC` hay DAX sẽ làm thay đổi luồng xử lý này.

Cái giá phải trả ở đây là rủi ro mất dữ liệu khi hệ thống gặp sự cố sập nguồn. Nếu máy chủ đột ngột mất điện sau khi lệnh `write()` trả về thành công, dữ liệu còn nằm lại trong Page Cache sẽ bốc hơi hoàn toàn. Khi đòi hỏi tính bền vững khắt khe, ứng dụng buộc phải gọi `fsync()`, `fdatasync()` hoặc mở file với các cờ đồng bộ; tuy nhiên các thao tác này bắt buộc ứng dụng phải chờ dữ liệu xả xuống đĩa cứng (flush), khiến thông lượng tụt dốc rõ rệt.

Một chi tiết kỹ thuật thực chiến cực kỳ dễ bị bỏ sót: **Lệnh `fsync(fileFd)` chỉ đồng bộ bản thân file đó — nó KHÔNG đồng bộ sự thay đổi tên file bên trong thư mục cha!** Sau khi tạo một file mới, thực hiện `rename()`, hoặc gọi `unlink()`, nếu bạn yêu cầu sau khi mất điện thì mục thư mục đó cũng phải được lưu trữ bền vững tuyệt đối, bạn bắt buộc phải mở thư mục cha và gọi hàm `fsync()` trên file descriptor của chính thư mục cha đó.

Quy trình ghi đè file an toàn kinh điển trong kỹ thuật phần mềm bao gồm các bước: tạo một file tạm trong cùng thư mục, ghi toàn bộ dữ liệu vào file tạm, gọi `fsync()` trên file tạm, dùng lệnh `rename()` để thay thế nguyên tử (atomically) vào file đích, và cuối cùng gọi `fsync()` trên thư mục cha. Lệnh `rename()` trong cùng một hệ thống file cam kết việc thay thế tên trong không gian tên là nguyên tử, nhưng "thao tác không gian tên nguyên tử" không đồng nghĩa với "chắc chắn bền vững sau khi mất điện" nếu thiếu bước fsync thư mục cha.

Các hệ quản trị cơ sở dữ liệu, message queue, và hệ thống ghi log đều phải đối mặt với bài toán này: có bên theo đuổi việc mỗi commit giao dịch đều phải fsync xuống đĩa ngay lập tức, có bên lại chấp nhận một khoảng thời gian mất mát dữ liệu nhỏ để đổi lấy thông lượng cực đại.

![Đường đi từ ghi file tới lưu trữ bền vững](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-write-persistence-edfe5461.webp)

## Hệ thống file ghi nhật ký (Journaling) giảm thiểu hỏng hóc sau sự cố như thế nào?

Nỗi sợ hãi lớn nhất của hệ thống file là việc máy chủ bị sập nguồn giữa chừng khi đang ghi dữ liệu dở dang. Ví dụ khi tạo một file mới, hệ thống vừa phải cấp phát inode, vừa phải cấp phát khối dữ liệu, vừa phải cập nhật mục thư mục và sửa mảng bitmap. Nếu chỉ mới ghi xong một nửa mà mất điện, hệ thống file sẽ rơi vào trạng thái bất nhất cực kỳ nguy hiểm.

**Hệ thống file ghi nhật ký (Journaling File System)** giải quyết vấn đề này bằng cách ghi toàn bộ các thay đổi metadata sắp diễn ra vào một phân vùng nhật ký (journal) trước, sau đó mới tiến hành cập nhật vào vị trí chính thức trên đĩa. Khi hệ thống khởi động lại sau sự cố sập nguồn, nó sẽ quét phân vùng nhật ký: các transaction đã được commit đầy đủ vào nhật ký nhưng chưa kịp ghi vào vị trí chính thức sẽ được chạy phát lại (replay); còn các transaction chưa có commit record hoặc lỗi checksum sẽ bị loại bỏ thẳng tay. Mục tiêu của nhật ký là giữ cho cấu trúc hệ thống file không bao giờ bị dừng lại ở trạng thái "lửng lơ một nửa".

Lấy ext4 làm ví dụ, tài liệu chính thức liệt kê 3 chế độ ghi dữ liệu:

- **`data=writeback`**: Chỉ ghi nhật ký cho metadata, không đảm bảo các khối dữ liệu được ghi xuống đĩa trước khi metadata được commit vào nhật ký. Hiệu năng cao nhất, nhưng sau khi sập nguồn, các file vừa ghi có thể chứa dữ liệu rác cũ.
- **`data=ordered`**: Chế độ mặc định. Trước khi metadata được đưa vào nhật ký, toàn bộ các khối dữ liệu liên quan sẽ được ép ghi xuống hệ thống file chính trước. Nó không ghi dữ liệu file vào nhật ký nhưng loại bỏ được rủi ro metadata trỏ vào khối dữ liệu chưa được ghi.
- **`data=journal`**: Cả metadata lẫn dữ liệu file đều được ghi vào nhật ký trước, rồi mới ghi vào vị trí chính thức sau cùng. Mang lại sự đảm bảo nhất quán sau sự cố mạnh mẽ nhất, nhưng cái giá phải trả là hiện tượng khuếch đại ghi gấp đôi (double write) và hiệu năng suy giảm đáng kể.

Hệ thống file ghi nhật ký giải quyết bài toán "tính nhất quán của cấu trúc hệ thống file", chứ không đứng ra bảo đảm toàn bộ dữ liệu nghiệp vụ của ứng dụng không bao giờ bị mất mát. Muốn đảm bảo tính bền vững ở cấp độ giao dịch, ứng dụng vẫn bắt buộc phải sử dụng chuẩn xác các cơ chế `fsync()`, file tạm và đồng bộ thư mục cha.

## Khi xảy ra vấn đề hiệu năng hệ thống file thì kiểm tra ở đâu?

Khi điều tra các sự cố liên quan đến hệ thống file, đừng chỉ nhìn chằm chằm vào dung lượng đĩa còn trống. Các chỉ số dưới đây thường phản ánh vấn đề chính xác hơn nhiều:

**Kiểm tra xem inode có bị cạn kiệt hay không**:

```bash
df -i
```

Khi có quá nhiều file nhỏ, số lượng inode có thể bị dùng hết sạch trước cả khi dung lượng ổ đĩa chạm ngưỡng.

**Kiểm tra xem có bị rò rỉ File Descriptor (fd) hay không**:

```bash
ulimit -n
cat /proc/<pid>/limits
lsof -p <pid>
ls /proc/<pid>/fd | wc -l
```

Khi ứng dụng bắn lỗi `Too many open files`, bạn cần phân biệt rõ hai loại mã lỗi: `EMFILE` biểu thị Process hiện tại đã chạm trần giới hạn fd được phép mở; còn `ENFILE` biểu thị bảng file mở của toàn bộ hệ điều hành đã bị cạn kiệt.

Trong các chương trình đa luồng khi tạo fd, hãy luôn ưu tiên sử dụng các cờ nguyên tử như `O_CLOEXEC` để tránh việc fd vô tình bị rò rỉ sang tiến trình con sau lệnh `exec()`.

**Kích thước Page Cache và áp lực bộ nhớ**:

```bash
free -h
vmstat 1
```

`free -h` và `vmstat 1` hỗ trợ rất tốt trong việc đánh giá quy mô cache, áp lực RAM, hoạt động hoán đổi trang và I/O wait. Hãy nhớ rằng Linux luôn cố gắng tận dụng RAM trống để làm cache, nên giá trị `buff/cache` cao trong lệnh `free` là dấu hiệu hoàn toàn bình thường. Thứ thực sự cần cảnh giác là việc ứng dụng có đang liên tục bị khựng lại vì chờ đĩa I/O hay không, có lượng lớn trang bẩn đang bị dồn ứ xả đĩa hay không, và cache có đang bị thu hồi dữ dội do thiếu RAM hay không.

Nếu cần quan sát chi tiết các trang cache của một file cụ thể, các bản Linux mới cung cấp hàm `cachestat()`, hoặc bạn có thể dùng các công cụ dựa trên eBPF như `cachestat` (cần đánh giá chi phí thu thập trước khi dùng trên Production).

**Đĩa cứng có đang bị quá tải hay không**:

```bash
iostat -x 1
```

Đối với các ổ đĩa cơ truyền thống, chỉ số `%util` tiệm cận 100% trong thời gian dài đồng nghĩa với việc thiết bị đang bị nghẽn. Nhưng đối với các ổ NVMe SSD, mảng đĩa RAID hay các thiết bị có khả năng xử lý song song nhiều hàng đợi I/O cùng lúc, chỉ số `%util` không thể đánh đồng trực tiếp với độ bão hòa. Bạn cần kết hợp đánh giá song song cả `await`, `r_await`, `w_await`, `aqu-sz` (chiều dài hàng đợi), thông lượng (throughput), IOPS và độ trễ ở tầng ứng dụng.

**`df` báo đầy 100%, nhưng `du` lại không tìm thấy file dung lượng lớn**:

```bash
lsof +L1
ls -l /proc/<pid>/fd
```

Lệnh `du` duyệt cây thư mục và chỉ tính những file vẫn còn tên trong thư mục; còn lệnh `df` truy vấn trực tiếp số khối đã cấp phát từ superblock của hệ thống file. Nếu một file log khổng lồ đã bị xóa bằng lệnh `rm` (đã kích hoạt `unlink`), nhưng Process vẫn đang giữ mở file descriptor của nó, file đó sẽ biến mất khỏi danh sách thư mục (khiến `du` không nhìn thấy), nhưng không gian đĩa vật lý bên dưới vẫn chưa hề được giải phóng (khiến `df` vẫn báo đầy). Cách xử lý đúng đắn là yêu cầu Process mở lại file log (reopen), hoặc khởi động lại dịch vụ một cách an toàn; tuyệt đối không tự tiện thao tác hủy hoại thiếu kiểm chứng trên thư mục `/proc/<pid>/fd/*`.

Lưu ý thực chiến cuối cùng: Mỗi loại hệ thống file, phiên bản Kernel, tham số mount và chiến lược cache phần cứng đều sẽ làm thay đổi hiệu năng thực tế. Ví dụ cờ `O_DIRECT` trên Linux có yêu cầu căn chỉnh byte (alignment) rất khắt khe và các quy chuẩn này có thể biến đổi theo phiên bản Kernel. Khi đưa ra phán đoán hiệu năng, hãy luôn đối chiếu với kết quả từ `mount`, `uname -a`, công cụ đo `fio` hoặc kết quả kiểm thử tải thực tế của chính hệ thống.

## Trả lời thế nào trong buổi phỏng vấn?

Nếu người phỏng vấn hỏi *"Hệ thống file là gì?"*, hãy cấu trúc câu trả lời xoay quanh 4 trọng trách cốt lõi:

Hệ thống file chịu trách nhiệm tổ chức các khối lưu trữ tầng thấp trên thiết bị phần cứng thành các file và thư mục mà con người có thể hiểu và thao tác được. Nó quản lý việc đặt tên, tổ chức phân cấp, định vị khối dữ liệu, quản lý không gian trống, kiểm soát quyền truy cập, bộ nhớ đệm và phục hồi sau sự cố sập nguồn.

Khi nói về Linux, hãy bóc tách các tầng trừu tượng chính của VFS: superblock, inode, dentry và file. Giải thích rằng tên file nằm trong các mục thư mục; inode lưu trữ metadata và con trỏ định vị khối/extent; lệnh `open()` phân giải đường dẫn và trả về fd trỏ tới đối tượng file đã mở trong Kernel; và mọi thao tác đọc ghi đều được điều hướng trong suốt qua VFS xuống driver cụ thể bên dưới.

Nếu bị hỏi về **liên kết cứng và liên kết mềm**, hãy chốt hạ gọn gàng: Liên kết cứng là nhiều mục thư mục cùng trỏ về một inode duy nhất (dùng chung metadata và dữ liệu), còn liên kết mềm là một file độc lập lưu trữ chuỗi đường dẫn tới file mục tiêu.

Nếu bị hỏi **vì sao ghi file xong mà vẫn có thể bị mất dữ liệu**, hãy giải thích về cơ chế Page Cache và chiến lược ghi trả chậm (writeback): Lệnh `write()` trả về thành công chỉ có nghĩa là dữ liệu đã vào tới Page Cache của Kernel dưới dạng trang bẩn. Để đảm bảo dữ liệu không bị mất khi mất điện đột ngột, ứng dụng bắt buộc phải chủ động gọi `fsync()` hoặc `fdatasync()`, chú ý đồng bộ cả thư mục cha khi tạo/đổi tên file, và hiểu rõ các chế độ ghi nhật ký của hệ thống file.
