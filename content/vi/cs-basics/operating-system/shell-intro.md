---
title: Tổng hợp kiến thức nền tảng về lập trình Shell (Shell Scripting)
description: Lập trình Shell cực kỳ thiết thực trong công việc phát triển phần mềm hàng ngày. Hiện nay trong hệ sinh thái Linux, Shell và Python là hai ngôn ngữ tự động hóa vận hành (DevOps/Ops) phổ biến nhất. Bài viết này sẽ tổng hợp các kiến thức cơ bản về lập trình Shell để giúp bạn nhanh chóng làm chủ nó!
category: Cơ sở máy tính
tag:
  - Hệ điều hành
  - Linux
head:
  - - meta
    - name: keywords
      content: Shell, script, câu lệnh, tự động hóa, vận hành, DevOps, Linux, cú pháp cơ bản
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/shell-intro.md
---

Lập trình Shell cực kỳ thiết thực trong công việc phát triển phần mềm hàng ngày của chúng ta. Hiện nay trong môi trường Linux, hai ngôn ngữ tự động hóa vận hành (DevOps/Ops) phổ biến nhất chính là Shell và Python.

Bài viết này sẽ tổng hợp ngắn gọn các kiến thức nền tảng về lập trình Shell, dẫn dắt bạn từng bước nhập môn lập trình Shell một cách vững chắc!

## Ghi chú về phiên bản

**Các ví dụ trong bài viết này áp dụng cho bash phiên bản 4.0 trở lên**. Các phiên bản bash khác nhau có thể có sự khác biệt về một số tính năng, đặc biệt là:

- **Mảng (Array)**: Hỗ trợ từ bash 2.0+, chuẩn POSIX sh thuần túy (như dash) không hỗ trợ mảng.
- **Một số thao tác chuỗi**: Ví dụ `${var:offset:length}` có thể không được hỗ trợ trên các phiên bản cũ.
- **Mở rộng số học `$((...))`**: Hỗ trợ từ bash 2.0+.

Kiểm tra phiên bản bash của bạn bằng lệnh:

```shell
bash --version
# hoặc
echo $BASH_VERSION
```

## Bước vào cánh cửa lập trình Shell

### Tại sao chúng ta nên học Shell?

Khi học bất cứ điều gì, phần lớn chúng ta đều hướng tới tính ứng dụng thực tế. Dưới góc độ công việc, học Shell là để nâng cao hiệu suất làm việc của bản thân, tăng năng suất đầu ra, giúp chúng ta hoàn thành nhiều công việc hơn trong thời gian ngắn hơn.

Nhiều người cho rằng lập trình Shell là kiến thức thuần về vận hành (Ops/SRE), thuộc trách nhiệm của đội ngũ kỹ sư hệ thống chứ dân lập trình backend không cần học. Quan điểm này hoàn toàn sai lầm. So với các chuyên gia quản trị Linux chuyên trách, yêu cầu về độ sâu đối với chúng ta có thể không cao bằng, nhưng lập trình Shell chắc chắn là kỹ năng cơ bản bắt buộc mà lập trình viên backend phải nắm vững!

Hiện nay trong hệ điều hành Linux, hai ngôn ngữ tự động hóa vận hành phổ biến nhất là Shell và Python.

Trong đó, Shell gần như là ngôn ngữ tự động hóa bắt buộc phải dùng tại các doanh nghiệp CNTT, đặc biệt trong các khâu giám sát dịch vụ, triển khai nhanh ứng dụng, khởi động/dừng service, sao lưu và xử lý dữ liệu, phân tích log file... Python phù hợp hơn cho việc xử lý logic nghiệp vụ phức tạp, phát triển các công cụ quản trị quy mô lớn hoặc các công cụ có giao diện web. Shell là một trình thông dịch lệnh (command interpreter), tiếp nhận và thực thi các câu lệnh do người dùng nhập vào theo phương thức tương tác đối thoại trực tiếp ngay lập tức.

Ngoài ra, hiểu biết về lập trình Shell cũng là yêu cầu tuyển dụng tiêu chuẩn của hầu hết các công ty công nghệ lớn đối với vị trí kỹ sư backend. Hình ảnh dưới đây trích dẫn một số yêu cầu tuyển dụng về kỹ năng Shell từ các doanh nghiệp công nghệ hàng đầu:

![Yêu cầu kỹ năng lập trình Shell từ các công ty công nghệ lớn](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/shell/60190220-a676e313.png)

### Shell là gì?

**Shell là trình thông dịch lệnh của hệ thống Linux/Unix**, đóng vai trò là cây cầu nối giữa người dùng và nhân hệ điều hành (kernel), chịu trách nhiệm tiếp nhận câu lệnh của người dùng và gọi các chương trình tương ứng để thực thi.

**Lập trình Shell (Shell Scripting)** là quá trình kết hợp các câu lệnh, cấu trúc điều khiển (`if`/`for`/`while`), biến số và hàm thông qua trình thông dịch Shell (như bash) để tạo thành các file kịch bản tự động hóa. Shell vừa là một trình thông dịch lệnh tương tác, vừa là một ngôn ngữ lập trình hoàn chỉnh (hỗ trợ biến, mảng, hàm, điều khiển luồng, đường ống pipe, chuyển hướng redirection...).

**Các loại Shell phổ biến**:

- **bash** (Bourne Again Shell): Shell mặc định trên hầu hết hệ thống Linux, được sử dụng phổ biến nhất.
- **sh** (Bourne Shell): Shell truyền thống của Unix, đạt chuẩn POSIX.
- **zsh**: Shell tương tác cực kỳ mạnh mẽ, hỗ trợ nhiều plugin và theme đẹp mắt.
- **dash**: Shell siêu nhẹ, tuân thủ nghiêm ngặt POSIX; `/bin/sh` trên Ubuntu mặc định trỏ tới dash.
- **csh/tcsh**: Dòng Shell mang phong cách cú pháp ngôn ngữ C.

### Chương trình Hello World trong lập trình Shell

Bước đầu tiên khi làm quen với bất kỳ ngôn ngữ lập trình nào luôn là xuất ra dòng chữ "HelloWorld"! Dưới đây là từng bước từ việc tạo file đến viết mã Shell để in ra Hello World.

(1) Tạo một file mới `helloworld.sh`: `touch helloworld.sh`, phần mở rộng là `.sh` đại diện cho Shell (phần mở rộng thực ra không ảnh hưởng đến việc thực thi script trong Linux, đặt tên chỉ để dễ hiểu; nếu viết script bằng PHP thì bạn đặt đuôi là `.php`).

(2) Cấp quyền thực thi cho file script: `chmod +x helloworld.sh`

(3) Dùng trình soạn thảo Vim để mở file `helloworld.sh`: `vim helloworld.sh` (Vim file ------> Mở file -----> Command Mode ------> Nhấn phím `i` để vào Insert Mode -----> Sửa nội dung file -------> Nhấn `Esc` để về Command Mode -----> Gõ `:wq` để lưu và thoát).

Nội dung file `helloworld.sh`:

```shell
#!/bin/bash
set -euo pipefail  # Chế độ nghiêm ngặt: gặp lỗi dừng ngay, biến chưa khai báo báo lỗi, lỗi đường ống báo lỗi
# Chương trình shell đầu tiên, echo là lệnh xuất văn bản trong Linux
echo "helloworld!"
```

Trong Shell, ký tự `#` dùng để chú thích (comment). **Dòng đầu tiên của script Shell rất đặc biệt, thường bắt đầu bằng `#!` (shebang) để chỉ định trình thông dịch Shell cần dùng. Trong Linux có rất nhiều phiên bản Shell như zsh, dash... nhưng bash vẫn là loại Shell chúng ta sử dụng nhiều nhất.**

(4) Chạy script: `./helloworld.sh`. (Lưu ý: Bắt buộc phải gõ `./helloworld.sh` chứ không được gõ `helloworld.sh`. Khi chạy bất kỳ chương trình nhị phân nào cũng vậy, nếu chỉ gõ `helloworld.sh`, hệ thống Linux sẽ tìm kiếm trong các thư mục nằm trong biến môi trường `$PATH` như `/bin`, `/sbin`, `/usr/bin`, `/usr/sbin`... Thư mục hiện tại của bạn thường không nằm trong `$PATH`, nên gõ trực tiếp sẽ báo không tìm thấy lệnh; tiền tố `./` nói cho hệ thống biết rằng hãy tìm và chạy file ngay tại thư mục hiện tại).

![Chương trình Hello World trong Shell](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/shell/55296212-513db469.png)

## Biến trong Shell (Shell Variables)

### Giới thiệu về biến trong lập trình Shell

**Lập trình Shell thường chia biến thành ba loại:**

1. **Biến tự định nghĩa (biến cục bộ - local variable)**: Mặc định chỉ có hiệu lực bên trong tiến trình Shell hiện tại, **tiến trình con không thể truy cập**. Nếu muốn truyền xuống tiến trình con, phải dùng lệnh `export` để chuyển thành biến môi trường.
2. **Biến môi trường (environment variable)**: Ví dụ như `PATH`, `HOME`..., được các tiến trình con kế thừa. Dùng lệnh `env` để xem toàn bộ biến môi trường, dùng `set` để xem tất cả các biến (bao gồm cả biến môi trường lẫn biến cục bộ).
3. **Biến đặc biệt của Shell (special variable)**: Do bản thân Shell tự động thiết lập (như `$?`, `$$`, `$!`...), dùng để lưu trạng thái tiến trình, tham số truyền vào...

**Các biến môi trường thông dụng:**

> `PATH`: Danh sách các thư mục mà Shell sẽ tìm kiếm các câu lệnh hoặc chương trình thực thi.
> `HOME`: Thư mục home của người dùng hiện tại.
> `HISTSIZE`: Số lượng câu lệnh tối đa được lưu trong lịch sử.
> `LOGNAME`: Tên đăng nhập của người dùng hiện tại.
> `HOSTNAME`: Tên máy chủ (hostname).
> `SHELL`: Trình thông dịch Shell mặc định của người dùng hiện tại.
> `LANGUAGE`: Biến môi trường ngôn ngữ hiển thị.
> `MAIL`: Thư mục lưu trữ hộp thư của người dùng.
> `PS1`: Chuỗi định dạng dấu nhắc lệnh (mặc định là `#` cho root và `$` cho người dùng thường).

**Sử dụng biến môi trường có sẵn trong Linux:**

Ví dụ, muốn xem thư mục cá nhân ta dùng: `echo $HOME`; muốn xem Shell hiện tại ta dùng: `echo $SHELL`. Cách dùng rất đơn giản và trực quan.

**Sử dụng biến do mình tự định nghĩa:**

```shell
#!/bin/bash
# Định nghĩa biến hello
hello="hello world"
echo $hello
echo  "helloworld!"
```

![Sử dụng biến tự định nghĩa](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/shell/19835037-f8f3a674.png)

**Quy tắc đặt tên biến trong lập trình Shell:**

- Chỉ được dùng chữ cái tiếng Anh, chữ số và dấu gạch dưới (`_`), ký tự đầu tiên không được là chữ số, nhưng có thể bắt đầu bằng dấu gạch dưới.
- Không được có khoảng trắng ở giữa tên biến và xung quanh dấu gán `=`.
- Không được chứa các ký tự dấu câu.
- Không được trùng với các từ khóa dành riêng của bash (dùng lệnh `help` để kiểm tra từ khóa).

### Nhập môn chuỗi trong Shell (String)

Chuỗi là kiểu dữ liệu phổ biến và hữu ích nhất trong lập trình Shell (ngoài số và chuỗi thì thực ra cũng chẳng còn mấy kiểu dữ liệu nguyên thủy khác). Chuỗi có thể được bao bọc bằng dấu nháy đơn hoặc dấu nháy kép, điều này có đôi chút khác biệt so với Java.

Trong dấu nháy đơn, tất cả các ký tự đặc biệt (như `$`, dấu nháy ngược backtick, `\`...) đều mất đi ý nghĩa đặc biệt và được coi là ký tự thuần túy (literal).

Trong dấu nháy kép, các ký tự sau vẫn giữ nguyên ý nghĩa đặc biệt:

- `$`: Mở rộng biến (`$var`) và thay thế lệnh (`$(cmd)` hoặc `` `cmd` ``)
- `\`: Ký tự thoát (escape)
- `` ` `` hoặc `$()`: Thay thế lệnh (khuyến nghị dùng cú pháp `$()`)
- `!`: Mở rộng lịch sử (mặc định chỉ bật trong Shell tương tác)
- `${}`: Mở rộng tham số (parameter expansion)

**Lưu ý**: Chuỗi đặt trong nháy đơn mang tính **nguyên văn tuyệt đối**, trong khi chuỗi trong nháy kép sẽ thực hiện nội suy biến và thay thế lệnh.

**Chuỗi trong nháy đơn:**

```shell
#!/bin/bash
name='SnailClimb'
hello='Hello, I am $name!'
echo $hello
```

Kết quả xuất ra:

```plain
Hello, I am $name!
```

**Chuỗi trong nháy kép:**

```shell
#!/bin/bash
name='SnailClimb'
hello="Hello, I am $name!"
echo $hello
```

Kết quả xuất ra:

```plain
Hello, I am SnailClimb!
```

### Các thao tác chuỗi thông dụng trong Shell

**Ghép chuỗi (Concatenation):**

```shell
#!/bin/bash
name="SnailClimb"
# Ghép bằng dấu nháy kép
greeting="hello, "$name" !"
greeting_1="hello, ${name} !"
echo $greeting  $greeting_1
# Ghép bằng dấu nháy đơn
greeting_2='hello, '$name' !'
greeting_3='hello, ${name} !'
echo $greeting_2  $greeting_3
```

Kết quả:

![Kết quả lệnh ghép chuỗi trong Shell](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/shell/51148933-18fe26ea.png)

**Lấy độ dài chuỗi:**

```shell
#!/bin/bash
# Lấy độ dài chuỗi
name="SnailClimb"
# Cách 1 (khuyến nghị): dùng cú pháp tích hợp của bash
echo ${#name}  # Xuất ra: 10
# Cách 2: dùng lệnh bên ngoài (hiệu năng kém hơn)
expr length "$name"
```

Kết quả:

```plain
10
10
```

**Giải thích**:

- Khuyến khích dùng cú pháp `${#var}`, đây là tính năng có sẵn (built-in) của bash nên hiệu năng tốt hơn nhiều.
- `expr` là một chương trình ngoài, đòi hỏi kernel phải fork một tiến trình mới nên hiệu năng kém hơn.
- **`expr length` là phần mở rộng của GNU**, không thuộc chuẩn POSIX. Trên macOS (dùng BSD expr) hoặc một số hệ thống Unix khác lệnh này có thể báo lỗi.
- Để đảm bảo tính tương thích cao nhất, hãy dùng `${#var}` hoặc `expr "$var" : '.*'` (chuẩn POSIX).

Khi sử dụng lệnh `expr`, bắt buộc phải có khoảng trắng ở hai bên toán tử trong biểu thức:

```shell
expr 5+6       # Xuất ra chữ 5+6 (không có khoảng trắng)
expr 5 + 6     # Xuất ra 11 (có khoảng trắng)
# Tốt nhất nên dùng mở rộng số học của bash:
echo $((5 + 6))  # Xuất ra 11
```

Với một số toán tử như phép nhân, chúng ta còn phải dùng ký tự `\` để thoát:

```shell
expr 5 * 6       # Báo lỗi cú pháp (chưa escape dấu sao)
expr 5 \* 6      # Xuất ra 30 (đã escape chuẩn xác)
```

**Cắt chuỗi con (Substring):**

Cắt chuỗi con đơn giản theo vị trí:

```shell
# Cắt 10 ký tự tính từ vị trí thứ 0 (chỉ số tính từ 0)
str="SnailClimb is a great man"
echo ${str:0:10} # Xuất ra: SnailClimb
```

Cắt chuỗi theo mẫu biểu thức:

```shell
#!/bin/bash
# tác giả: amau

var="https://www.runoob.com/linux/linux-shell-variable.html"
# % xóa khớp từ cuối chuỗi, lấy kết quả ngắn nhất
# %% xóa khớp từ cuối chuỗi, lấy kết quả dài nhất
# # xóa khớp từ đầu chuỗi, lấy kết quả ngắn nhất
# ## xóa khớp từ đầu chuỗi, lấy kết quả dài nhất
# Lưu ý: * là ký tự đại diện khớp với số lượng ký tự tùy ý
s1=${var%%t*} # h
s2=${var%t*}  # https://www.runoob.com/linux/linux-shell-variable.h
s3=${var%%.*} # https://www
s4=${var#*/}  # /www.runoob.com/linux/linux-shell-variable.html
s5=${var##*/} # linux-shell-variable.html
```

### Mảng trong Shell (Array)

**bash 2.0 trở lên** hỗ trợ mảng một chiều (không hỗ trợ mảng đa chiều) và không giới hạn kích thước tối đa của mảng.

**Lưu ý quan trọng**: Mảng là **tính năng mở rộng phi chuẩn POSIX** của bash; các Shell POSIX thuần túy (như dash) không hỗ trợ mảng. Nếu cần viết script đảm bảo tính tương thích cao trên mọi hệ thống, nên tránh dùng mảng.

Dưới đây là ví dụ minh họa toàn diện về các thao tác với mảng: khởi tạo, lấy độ dài, truy xuất/xóa phần tử cụ thể, xóa toàn bộ mảng và duyệt mảng.

```shell
#!/bin/bash
array=(1 2 3 4 5);
# Lấy độ dài mảng
length=${#array[@]}
# hoặc
length2=${#array[*]}
# In ra độ dài mảng
echo $length # Xuất ra: 5
echo $length2 # Xuất ra: 5
# In ra phần tử thứ ba trong mảng
echo ${array[2]} # Xuất ra: 3
unset 'array[1]' # Xóa phần tử có chỉ số 1, tức là phần tử thứ hai
for i in "${array[@]}"; do echo "$i"; done # Duyệt mảng, xuất ra: 1 3 4 5
unset array; # Xóa toàn bộ phần tử trong mảng
for i in "${array[@]}"; do echo "$i"; done # Duyệt mảng: mảng rỗng, không xuất gì cả
```

**Lưu ý quan trọng: Lỗ hổng chỉ số mảng (Sparse Array)**:

Sau khi dùng lệnh `unset array[1]` để xóa phần tử, mảng sẽ xuất hiện **lỗ hổng chỉ số** (chỉ số không còn liên tục):

```shell
#!/bin/bash
array=(1 2 3 4 5)
echo "Trước khi xóa: ${array[@]}"   # Xuất ra: 1 2 3 4 5
echo "Giá trị chỉ số 1: ${array[1]}" # Xuất ra: 2

unset array[1]  # Xóa phần tử tại chỉ số 1
echo "Sau khi xóa: ${array[@]}"     # Xuất ra: 1 3 4 5
echo "Giá trị chỉ số 1: ${array[1]}" # Xuất ra: (rỗng)
echo "Giá trị chỉ số 2: ${array[2]}" # Xuất ra: 3 (chỉ số 2 vẫn tồn tại)

# Khi duyệt, chỉ số không còn liên tục
for index in "${!array[@]}"; do
    echo "chỉ số[$index] = ${array[$index]}"
done
# Xuất ra:
# chỉ số[0] = 1
# chỉ số[2] = 3
# chỉ số[3] = 4
# chỉ số[4] = 5
```

**Lưu ý**: Sau khi xóa một phần tử, nếu truy cập bằng `${array[1]}` sẽ nhận về giá trị rỗng. Khi cần duyệt mảng, khuyến nghị dùng `"${!array[@]}"` để lấy các chỉ số hợp lệ, hoặc dùng trực tiếp `"${array[@]}"` để duyệt qua các giá trị.

## Các toán tử cơ bản trong Shell

Lập trình Shell hỗ trợ các nhóm toán tử sau:

- Toán tử số học
- Toán tử quan hệ
- Toán tử logic
- Toán tử boolean
- Toán tử chuỗi
- Toán tử kiểm tra tệp tin (File Test)

### Toán tử số học

| **Toán tử** | **Mô tả** | **Ví dụ** |
| --- | --- | --- |
| **+** | Phép cộng | `expr $a + $b` |
| **-** | Phép trừ | `expr $a - $b` |
| **\*** | Phép nhân | `expr $a \* $b` (lưu ý dấu sao phải được escape) |
| **/** | Phép chia | `expr $b / $a` |
| **%** | Chia lấy dư | `expr $b % $a` |
| **=** | Phép gán | `a=$b` gán giá trị của biến b cho biến a |
| **==** | So sánh bằng | `[ "$a" == "$b" ]` dùng so sánh chuỗi, bằng nhau trả về true |
| **!=** | So sánh khác | `[ "$a" != "$b" ]` dùng so sánh chuỗi, khác nhau trả về true |

**Khuyến nghị dùng mở rộng số học tích hợp của bash**:

```shell
#!/bin/bash
a=3; b=3
val=$((a + b))  # Mở rộng số học trong bash (khuyến nghị)
# Xuất ra: Total value: 6
echo "Total value: $val"
```

**Giải thích**:

- Cú pháp `$((...))` là tính năng tích hợp của bash, không cần fork tiến trình ngoài, tốc độ thực thi nhanh hơn.
- **Không khuyến nghị** dùng lệnh `expr` (tốn tài nguyên fork tiến trình và bắt buộc phải có khoảng trắng hai bên toán tử).
- **Không khuyến nghị** dùng dấu backtick `` `...` `` (đã lỗi thời), hãy dùng cú pháp `$(...)`.

**Nếu cần tương thích với POSIX sh chuẩn**, bạn có thể dùng:

```shell
val=$(expr "$a" + "$b")  # Tương thích POSIX nhưng hiệu năng kém hơn
```

### Toán tử quan hệ

Toán tử quan hệ chỉ áp dụng cho dữ liệu kiểu số, không hỗ trợ chuỗi văn bản (trừ khi chuỗi đó có giá trị là một con số).

| **Toán tử** | **Ý nghĩa** | **Từ tiếng Anh đối ứng** |
| --- | --- | --- |
| **-eq** | Kiểm tra hai số có **bằng nhau** không | equal |
| **-ne** | Kiểm tra hai số có **không bằng nhau** không | not equal |
| **-gt** | Kiểm tra số bên trái có **lớn hơn** số bên phải không | greater than |
| **-lt** | Kiểm tra số bên trái có **nhỏ hơn** số bên phải không | less than |
| **-ge** | Kiểm tra số bên trái có **lớn hơn hoặc bằng** số bên phải không | greater equal |
| **-le** | Kiểm tra số bên trái có **nhỏ hơn hoặc bằng** số bên phải không | less equal |

Ví dụ minh họa: nếu `score=100` thì in ra A, ngược lại in ra B.

```shell
#!/bin/bash
score=90;
maxscore=100;
if [[ $score -eq $maxscore ]]
then
   echo "A"
else
   echo "B"
fi
```

Kết quả:

```plain
B
```

### Toán tử logic

| **Toán tử** | **Ý nghĩa** | **Ví dụ** |
| --- | --- | --- |
| **&&** | Phép **AND** logic | `[[ $a -lt 100 && $b -gt 100 ]]` (cả hai cùng đúng mới trả về true) |
| **\|\|** | Phép **OR** logic | `[[ $a -lt 100 \|\| $b -gt 100 ]]` (chỉ cần một vế đúng là trả về true) |

**Phép toán logic trong mở rộng số học**:

```shell
#!/bin/bash
a=$(( 1 && 0 ))
# Xuất ra: 0; phép AND chỉ trả về 1 khi cả hai vế đều là 1; ngược lại trả về 0
echo $a;
```

**Thực thi ngắn mạch (Short-Circuit Execution - rất thông dụng trong production)**:

Trong tự động hóa vận hành và đường ống CI/CD, người ta thường dùng `&&` và `||` để điều khiển luồng thực thi giữa các lệnh, gọi là **thực thi ngắn mạch**:

```shell
#!/bin/bash
set -euo pipefail

# &&: Chỉ thực thi lệnh sau khi lệnh trước thành công (exit code bằng 0)
mkdir -p "/tmp/app_data" && echo "Thư mục đã sẵn sàng"

# ||: Chỉ thực thi lệnh sau khi lệnh trước thất bại (exit code khác 0)
mkdir -p "/tmp/app_data" || echo "Tạo thư mục thất bại"

# Kết hợp: mẫu hình phòng thủ kinh điển trong production
mkdir -p "/tmp/app_data" && echo "Thư mục đã sẵn sàng" || exit 1

# Các ví dụ thực tế:
# 1. Kiểm tra file tồn tại rồi mới xóa
[ -f "/tmp/old_file.log" ] && rm "/tmp/old_file.log"

# 2. Xuất thông báo lỗi và thoát khi lệnh thất bại
cd /app/config || { echo "Không thể vào thư mục cấu hình"; exit 1; }

# 3. Thực thi có điều kiện
command1 && command2 || command3
# ⚠️ Cảnh báo: Cách viết này tiềm ẩn bẫy nguy hiểm!
# - Khi command1 thành công, command2 được thực thi
# - Khi command1 thất bại, command3 được thực thi
# - NHƯNG nếu command1 thành công mà command2 THẤT BẠI, command3 VẪN SẼ ĐƯỢC THỰC THI!
#
# ✅ Cách viết an toàn hơn nhiều (khuyến nghị):
if command1; then
    command2
else
    command3
fi
#
# Hoặc chỉ dùng chuỗi && || khi bạn chắc chắn command2 không bao giờ thất bại
```

**Lưu ý quan trọng**:

- Thực thi ngắn mạch hoạt động dựa trên **Exit Code (mã thoát)** của lệnh: 0 đại diện cho thành công, khác 0 là thất bại.
- Khác với `&&` và `||` đặt bên trong `[[ ]]` vốn dùng để kiểm tra điều kiện logic boolean.
- Hãy cẩn thận với cái bẫy trong `command1 && command2 || command3`: nếu `command1` thành công nhưng `command2` gặp lỗi, `command3` vẫn sẽ bị kích hoạt chạy tiếp.
- Trong môi trường production, hãy ưu tiên dùng khối `if-then-else` tường minh để đảm bảo logic mạch lạc.

### Toán tử Boolean

| **Toán tử** | **Ý nghĩa** | **Ví dụ** |
| --- | --- | --- |
| **!** | Phủ định kết quả biểu thức. Nếu true trả về false, nếu false trả về true. | `[ ! false ]` trả về false, vì chữ `false` ở đây là một chuỗi không rỗng. |
| **-o** | Phép OR trong ngoặc đơn `[ ]`. Một vế đúng là trả về true. | `[ "$a" -lt 20 -o "$b" -gt 100 ]` trả về true. |
| **-a** | Phép AND trong ngoặc đơn `[ ]`. Cả hai vế đúng mới trả về true. | `[ "$a" -lt 20 -a "$b" -gt 100 ]` trả về false. |

### Toán tử chuỗi

| **Toán tử** | **Ý nghĩa** | **Ví dụ** |
| --- | --- | --- |
| **=** | Kiểm tra hai chuỗi có **bằng nhau** không | `[ "$a" = "$b" ]` |
| **!=** | Kiểm tra hai chuỗi có **khác nhau** không | `[ "$a" != "$b" ]` |
| **-z** | Kiểm tra độ dài chuỗi có bằng **0** không (zero) | `[ -z "$a" ]` chuỗi rỗng trả về true |
| **-n** | Kiểm tra độ dài chuỗi có **khác 0** không | `[ -n "$a" ]` chuỗi không rỗng trả về true |
| **str** | Kiểm tra trực tiếp chuỗi có rỗng hay không | `[ "$a" ]` chuỗi không rỗng trả về true |

Ví dụ đơn giản:

```shell
#!/bin/bash
a="abc";
b="efg";
if [[ "$a" = "$b" ]]
then
   echo "a bằng b"
else
   echo "a không bằng b"
fi
```

Kết quả xuất ra:

```plain
a không bằng b
```

### Các toán tử liên quan đến tệp tin (File Test Operators)

Dùng để kiểm tra các thuộc tính đa dạng của file trong hệ điều hành Unix/Linux (như quyền hạn, kiểu tệp...).

- **Kiểm tra sự tồn tại và loại tệp:**
  - **-e file**: Kiểm tra tệp (bao gồm cả thư mục) có tồn tại hay không.
  - **-f file**: Kiểm tra xem có phải là file thông thường (không phải thư mục cũng không phải file thiết bị) hay không.
  - **-d file**: Kiểm tra xem có phải là thư mục hay không.
  - **-s file**: Kiểm tra tệp có dữ liệu hay không (kích thước lớn hơn 0 byte trả về true).
  - **-b / -c / -p**: Lần lượt kiểm tra xem có phải là thiết bị khối, thiết bị ký tự hay đường ống (FIFO) hay không.
- **Kiểm tra quyền hạn:**
  - **-r file**: Kiểm tra tệp có quyền đọc hay không.
  - **-w file**: Kiểm tra tệp có quyền ghi hay không.
  - **-x file**: Kiểm tra tệp có quyền thực thi hay không.
- **Kiểm tra cờ đặc biệt:**
  - **-u / -g / -k**: Lần lượt kiểm tra xem tệp có thiết lập cờ SUID, SGID hay Sticky Bit hay không.

Cách sử dụng rất trực quan: ví dụ ta có đường dẫn `file="/usr/learnshell/test.sh"`, muốn kiểm tra xem file có đọc được không ta viết `if [ -r "$file" ]`; muốn kiểm tra có ghi được không ta viết `[ -w "$file" ]`.

## Cấu trúc điều khiển luồng trong Shell (Control Flow)

### Câu lệnh điều kiện `if`

Ví dụ câu lệnh rẽ nhánh `if`, `elif`, `else` cơ bản:

```shell
#!/bin/bash
a=3;
b=9;
if [[ $a -eq $b ]]
then
   echo "a bằng b"
elif [[ $a -gt $b ]]
then
   echo "a lớn hơn b"
else
   echo "a nhỏ hơn b"
fi
```

Kết quả:

```plain
a nhỏ hơn b
```

**Xử lý câu lệnh rỗng (No-op)**: Trong Shell, để tạo một nhánh rỗng không làm gì, ta có thể dùng lệnh `:` (dấu hai chấm) hoặc lệnh `true`:

```shell
if [[ condition ]]; then
    :  # Lệnh rỗng (không làm bất cứ điều gì)
fi

# hoặc
if [[ condition ]]; then
    true  # Lệnh rỗng
fi
```

Cách này rất hữu ích khi bạn cần một điểm giữ chỗ trong vòng lặp hoặc các nhánh rẽ dự phòng.

### Vòng lặp `for`

Ba ví dụ dưới đây minh họa các cách sử dụng phổ biến nhất của vòng lặp `for`.

**Duyệt qua danh sách dữ liệu cố định:**

```shell
for loop in 1 2 3 4 5
do
    echo "The value is: $loop"
done
```

**Sinh 10 số ngẫu nhiên:**

```shell
#!/bin/bash
for i in {0..9};
do
   echo $RANDOM;
done
```

**Vòng lặp từ 1 đến 5 theo phong cách C:**

Thông thường khi truy xuất giá trị biến trong Shell ta phải thêm dấu `$`, nhưng bên trong biểu thức `(())` của vòng lặp for thì không cần thiết:

```shell
#!/bin/bash
length=5
for((i=1;i<=length;i++));do
    echo $i;
done;
```

### Vòng lặp `while`

**Vòng lặp `while` cơ bản:**

```shell
#!/bin/bash
int=1
while (( int <= 5 ))  # Trong ngữ cảnh số học biến không cần dấu $
do
    echo $int
    (( int++ ))  # Khuyến nghị dùng (( )) thay cho let
done
```

**Vòng lặp `while` dùng để đọc dữ liệu từ bàn phím:**

```shell
echo 'Nhấn <CTRL-D> để thoát'
echo -n 'Nhập bộ phim yêu thích của bạn: '
while read -r FILM  # Cờ -r ngăn việc giải mã ký tự thoát gạch chéo ngược
do
    echo "Đúng vậy! $FILM là một bộ phim tuyệt vời"
done
```

Kết quả:

```plain
Nhấn <CTRL-D> để thoát
Nhập bộ phim yêu thích của bạn: Transformers
Đúng vậy! Transformers là một bộ phim tuyệt vời
```

**Vòng lặp vô tận (Infinite loop):**

```shell
while true
do
    command
done
```

## Hàm trong Shell (Shell Functions)

### Hàm không có tham số và không có giá trị trả về

```shell
#!/bin/bash
hello(){
    echo "Đây là hàm shell đầu tiên của tôi!"
}
echo "-----Bắt đầu thực thi hàm-----"
hello
echo "-----Thực thi hàm kết thúc-----"
```

Kết quả:

```plain
-----Bắt đầu thực thi hàm-----
Đây là hàm shell đầu tiên của tôi!
-----Thực thi hàm kết thúc-----
```

### Hàm có giá trị trả về

**Nhập hai số từ bàn phím, cộng lại và in ra kết quả:**

```shell
#!/bin/bash
set -euo pipefail

funWithReturn(){
    local aNum
    local anotherNum
    echo "Nhập số thứ nhất: "
    read -r aNum
    echo "Nhập số thứ hai: "
    read -r anotherNum
    echo "Hai số lần lượt là $aNum và $anotherNum !"
    result=$((aNum + anotherNum))
}
result=0
funWithReturn
echo "Tổng của hai số đã nhập là $result"
```

**Lưu ý quan trọng**:

- **Từ khóa `local`**: Giới hạn phạm vi biến hoàn toàn trong nội bộ hàm, tránh làm ô nhiễm không gian tên toàn cục (global scope).
- **Lệnh `read -r`**: Cờ `-r` vô hiệu hóa việc thông dịch dấu gạch chéo ngược, tăng độ bảo mật và an toàn.
- **Giá trị trả về của hàm**: Lệnh `return` trong Shell chỉ thiết lập mã trạng thái thoát (exit status) từ 0 đến 255, hoàn toàn không thích hợp để truyền kết quả tính toán. Khi cần truyền dữ liệu tính toán ra ngoài, hãy dùng xuất chuẩn (`echo`) hoặc gán vào biến.

**Tại sao bắt buộc nên dùng `local`?**

- Trong các script phức tạp hoặc khi import nhiều script ngoài, các biến không dùng `local` rất dễ bị vô tình ghi đè.
- Việc ô nhiễm biến toàn cục dẫn đến hiện tượng trôi dạt cấu hình (configuration drift) hoặc lỗi logic rất khó chẩn đoán.
- Dùng `local` là chuẩn mực thực hành tốt nhất trong lập trình hàm, tương tự như khái niệm biến cục bộ ở các ngôn ngữ khác.

Kết quả xuất ra:

```plain
Nhập số thứ nhất: 
1
Nhập số thứ hai: 
2
Hai số lần lượt là 1 và 2 !
Tổng của hai số đã nhập là 3
```

### Hàm có tham số truyền vào

```shell
#!/bin/bash
funWithParam(){
    echo "Tham số thứ nhất là $1"
    echo "Tham số thứ hai là $2"
    echo "Tên script là $0"
    echo "Tham số thứ mười là ${10}"   # Lưu ý: Khi tham số ≥ 10 bắt buộc phải dùng ${n}
    echo "Tham số thứ mười một là ${11}"
    echo "Tổng số tham số có $# cái"
    echo "Tất cả các tham số là $*"     # Xuất ra như một chuỗi đơn lẻ duy nhất
    echo "Tất cả các tham số là $@"     # Xuất ra như các tham số độc lập (khuyến nghị)
}
funWithParam 1 2 3 4 5 6 7 8 9 34 73
```

Kết quả xuất ra:

```plain
Tham số thứ nhất là 1
Tham số thứ hai là 2
Tên script là ./script.sh
Tham số thứ mười là 34
Tham số thứ mười một là 73
Tổng số tham số có 11 cái
Tất cả các tham số là 1 2 3 4 5 6 7 8 9 34 73
Tất cả các tham số là 1 2 3 4 5 6 7 8 9 34 73
```

**Lưu ý quan trọng**:

- **Tham số vị trí `$n` khi `n >= 10` bắt buộc phải dùng cú pháp `${n}`**.
- Ví dụ: nếu viết `$10` thì Shell sẽ phân tích cú pháp thành `$1` ghép nối với chữ số `0`, chứ không phải tham số thứ mười.
- `$0` đại diện cho tên file script hoặc hàm được gọi.
- `$#` trả về tổng số lượng tham số truyền vào.

**Sự khác biệt cốt lõi giữa `$*` và `$@`**:

| Biểu thức | Không đặt trong ngoặc kép | Bao bọc trong dấu nháy kép (`""`) |
| --- | --- | --- |
| `$*` | Tách rời các tham số theo IFS | Gom toàn bộ tham số thành **một chuỗi đơn lẻ duy nhất** |
| `$@` | Tách rời các tham số theo IFS | Giữ nguyên từng tham số thành **các đối số độc lập** |

**Ví dụ đối chiếu cụ thể**:

```shell
#!/bin/bash
test_args() {
    echo "--- Dùng \$* (không nháy) ---"
    for arg in $*; do
        echo "tham số: [$arg]"
    done

    echo -e "\n--- Dùng \$@ (không nháy) ---"
    for arg in $@; do
        echo "tham số: [$arg]"
    done

    echo -e "\n--- Dùng \"\$*\" (nháy kép) ---"
    for arg in "$*"; do
        echo "tham số: [$arg]"
    done

    echo -e "\n--- Dùng \"\$@\" (nháy kép, khuyến nghị) ---"
    for arg in "$@"; do
        echo "tham số: [$arg]"
    done
}

# Gọi hàm với các tham số có chứa khoảng trắng
test_args "hello world" "foo bar"
```

**Kết quả xuất ra**:

```plain
--- Dùng $* (không nháy) ---
tham số: [hello]
tham số: [world]
tham số: [foo]
tham số: [bar]

--- Dùng $@ (không nháy) ---
tham số: [hello]
tham số: [world]
tham số: [foo]
tham số: [bar]

--- Dùng "$*" (nháy kép) ---
tham số: [hello world foo bar]  # Gom tất cả tham số làm một chuỗi

--- Dùng "$@" (nháy kép, khuyến nghị) ---
tham số: [hello world]  # Từng tham số được giữ nguyên độc lập
tham số: [foo bar]
```

**Kết luận**: Khi chuyển tiếp tham số cho các lệnh hoặc hàm khác, **luôn luôn sử dụng `"$@"`** để bảo toàn tính toàn vẹn của từng tham số (đặc biệt là khi tham số có chứa dấu cách).

## Thực hành chuẩn mực trong lập trình Shell (Best Practices)

Sau khi đã nắm vững các kiến thức cú pháp cơ bản, việc áp dụng các chuẩn mực kỹ thuật dưới đây sẽ giúp bạn viết nên những đoạn mã an toàn và chuyên nghiệp hơn.

### Quy chuẩn cơ bản của script

**1. Quy chuẩn Shebang**:

```shell
#!/usr/bin/env bash
# Tìm kiếm bash thông qua PATH
set -euo pipefail
```

**Hai cách viết Shebang**:

- `#!/bin/bash`: Chỉ định trực tiếp đường dẫn cố định, thích hợp cho môi trường server chuẩn hóa đã biết rõ vị trí file bash.
- `#!/usr/bin/env bash`: Tìm kiếm bash thông qua `env`, có tính tương thích chuyển dịch (portability) cao hơn trên nhiều hệ điều hành khác nhau (như macOS / Linux / BSD).

**Cách lựa chọn trong bài viết**:

- Các ví dụ hướng dẫn cơ bản sử dụng `#!/bin/bash` cho ngắn gọn, dễ tiếp cận.
- Các ví dụ chuẩn production sử dụng `#!/usr/bin/env bash` để nhấn mạnh tính tương thích.

**2. Bọc biến cẩn thận**:

```shell
# Luôn bọc biến trong dấu nháy kép
echo "$var"     # Khuyến nghị
echo $var       # Dễ gây lỗi tách từ (word splitting) và bung mẫu (globbing)
```

**3. Sử dụng công cụ shellcheck**:

```bash
shellcheck your_script.sh  # Phân tích tĩnh mã nguồn, phát hiện kịp thời các lỗi tiềm ẩn phổ biến
```

**4. Cú pháp hiện đại được khuyến nghị**:

- Sử dụng `[[ ]]` thay vì `[ ]` (an toàn hơn, hỗ trợ khớp mẫu và biểu thức chính quy).
- Sử dụng `$((...))` thay vì `expr` (tốc độ cao hơn, cú pháp gọn gàng).
- Sử dụng `$(...)` thay vì dấu backtick (hỗ trợ lồng nhau, dễ đọc hơn).
- Sử dụng `${n}` khi truy cập tham số vị trí thứ 10 trở lên (`n >= 10`).

### Nguyên lý hoạt động của `pipefail`

Mặc định trong Bash, giá trị trả về của một chuỗi đường ống (pipeline) chỉ phụ thuộc vào kết quả của câu lệnh cuối cùng. Khi bật tùy chọn `pipefail`, mã trả về của toàn bộ chuỗi pipeline sẽ là mã lỗi của câu lệnh thất bại cuối cùng, giúp ngăn chặn việc che giấu các lỗi nghiêm trọng xảy ra ở các bước trung gian.

**Ví dụ đối chiếu**:

```shell
# Chế độ mặc định (nguy hiểm)
cat huge_file.txt | grep "pattern" | head -n 10
# Dù lệnh cat thất bại (do file không tồn tại), chỉ cần head thành công thì exit code vẫn là 0!

# Chế độ bật pipefail (an toàn)
set -o pipefail
cat huge_file.txt | grep "pattern" | head -n 10
# Lệnh cat thất bại sẽ lập tức khiến cả chuỗi trả về mã lỗi, không bị bỏ qua
```

## Trước khi đưa Shell Script vào môi trường Production

Viết đúng cú pháp cơ bản mới chỉ là bước khởi đầu. Khi script được đưa vào chạy tự động qua cron job, quy trình CI/CD hoặc các máy chủ production, bạn còn phải xử lý tình huống thoát lỗi bất ngờ, dọn dẹp file tạm, kiểm soát timeout mạng và bắt exit code của các tác vụ chạy nền (background task). Dưới đây là các ví dụ thực tế minh họa.

Tùy chọn `set -u` và `set -o pipefail` hoạt động tương đối rõ ràng; trong khi `set -e` lại có rất nhiều trường hợp ngoại lệ (trong câu lệnh điều kiện, hàm, subshell hay thay thế lệnh có thể dẫn đến hành vi bất ngờ). Hãy coi `set -euo pipefail` là điểm xuất phát chuẩn cho các script mới, nhưng không được ỷ lại vào nó để thay thế cho việc bắt lỗi tường minh bằng cấu trúc `if ! command; then ... fi`. Biến khi mở rộng vẫn phải bọc trong dấu nháy kép tùy theo ngữ cảnh, và biến nội bộ hàm bắt buộc phải dùng `local`.

### Thiết lập ngân sách thời gian (Timeout) cho yêu cầu mạng

Mọi request mạng cần phải giới hạn cả thời gian kết nối (connect timeout) lẫn tổng thời gian truyền tải dữ liệu (max time). Cơ chế thử lại (retry) chỉ nên thiết lập ở một tầng duy nhất: nếu vừa dùng vòng lặp bên ngoài vừa bật cờ `curl --retry`, số lần request thực tế sẽ bị nhân lên theo cấp số nhân và tổng thời gian chờ sẽ không thể kiểm soát nổi. Hàm mẫu dưới đây gom quyền điều khiển số lần thử lại về vòng lặp ngoài, đồng thời thêm độ trễ ngẫu nhiên (jitter) từ 0 đến 2 giây sau mỗi lần thất bại:

```shell
#!/usr/bin/env bash

retry_request() {
    local url="$1"
    local max_attempts=5
    local attempt=1
    local delay
    local jitter

    while (( attempt <= max_attempts )); do
        if curl --fail --silent --show-error \
                --connect-timeout 3 \
                --max-time 10 \
                "$url"; then
            return 0
        fi

        if (( attempt == max_attempts )); then
            break
        fi

        delay=$((1 << (attempt - 1)))
        (( delay > 16 )) && delay=16
        jitter=$((RANDOM % 3))
        delay=$((delay + jitter))
        printf 'Lần thử thứ %d thất bại, thử lại sau %d giây\n' "$attempt" "$delay" >&2
        sleep "$delay"
        ((attempt += 1))
    done

    return 1
}

command -v curl >/dev/null 2>&1 || {
    echo "curl chưa được cài đặt" >&2
    exit 1
}

[[ $# -eq 1 ]] || {
    echo "Cách dùng: $0 <url>" >&2
    exit 1
}

retry_request "$1" || {
    echo "Yêu cầu thất bại" >&2
    exit 1
}
```

Trong thực tế, kịch bản còn phải căn cứ theo ngữ nghĩa của API để xác định lỗi nào được phép retry. Các request ghi không có tính lũy thừa (non-idempotent), lỗi xác thực (401/403) hay sai tham số đầu vào (400) thông thường không được phép tự động gửi lại.

### Quản lý file tạm và Khóa loại trừ tương hỗ (Mutex Lock)

Tuyệt đối không dùng các đường dẫn dễ đoán trước như `/tmp/data_$$`. Lệnh `mktemp` sẽ tạo file hoặc thư mục tạm một cách nguyên tử (atomic), kết hợp cùng lệnh `trap` để tự động dọn dẹp sạch sẽ khi script kết thúc bình thường hoặc khi nhận được các tín hiệu ngắt phổ biến:

```shell
#!/usr/bin/env bash

temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/myapp.XXXXXXXX") || {
    echo "Không thể tạo thư mục tạm" >&2
    exit 1
}
cleanup() {
    rm -rf -- "$temp_dir"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

temp_file="$temp_dir/result.txt"
printf 'temporary data\n' > "$temp_file"
cat "$temp_file"
```

Khi cần ngăn chặn việc một script bị chạy trùng lặp nhiều tiến trình cùng lúc trên cùng một máy, ta có thể dùng tiện ích `flock` trên file khóa do ứng dụng tự quản lý:

```shell
exec 9>/var/lock/myapp.lock || exit 1
flock -n 9 || {
    echo "Script hiện đang chạy rồi" >&2
    exit 1
}
```

`flock` là dạng khóa phối hợp tự nguyện (advisory lock), các tiến trình khác hoàn toàn có thể cố tình phớt lờ nó. Client NFS của Linux có thể mô phỏng nó thành khóa `fcntl` cho toàn bộ file, nhưng hành vi thực tế còn bị chi phối bởi phiên bản kernel, server NFS và các tùy chọn mount như `local_lock`. Khi đặt file khóa trên network file system, bắt buộc phải kiểm thử thực tế bằng hai client độc lập trong môi trường đích. Tương tự, khóa phân tán giữa các máy chủ cũng không thể chỉ giải quyết bằng một câu lệnh Redis `SET NX PX` đơn giản: một triển khai chuẩn mực còn phải xử lý token định danh duy nhất, giải phóng khóa có điều kiện (Lua script), gia hạn thời gian thuê (lease renewal) và các tình huống phân vùng mạng.

### Thu thập Exit Code của các tác vụ chạy nền

Lệnh `wait` nếu không truyền tham số sẽ đợi tất cả các tác vụ chạy nền hoàn tất, nhưng Bash luôn trả về 0 nên không thể cho bạn biết tác vụ con nào trong số đó bị sập. Đoạn mã dưới đây thực hiện đếm số byte đồng thời trên nhiều file và thu thập chính xác trạng thái thoát của từng tiến trình con:

```shell
#!/usr/bin/env bash
set -u

pids=()
for file in "$@"; do
    wc -c -- "$file" &
    pids+=("$!")
done

exit_code=0
for pid in "${pids[@]}"; do
    if ! wait "$pid"; then
        echo "Tác vụ chạy nền $pid thực thi thất bại" >&2
        exit_code=1
    fi
done

exit "$exit_code"
```

Nếu chỉ viết dạng `while wait -n; do ...; done` thì vẫn chưa trọn vẹn: khi có một tác vụ thất bại, `wait -n` sẽ trả về mã khác 0 khiến vòng lặp kết thúc ngay lập tức, bỏ rơi việc thu thập kết quả của các tác vụ còn lại.

### Các sai lầm thường gặp

Đừng chuyển hướng toàn bộ cả stdout và stderr của một lệnh vào `/dev/null` trong thời gian dài, vì khi xảy ra sự cố bạn sẽ chỉ còn lại mỗi một mã lỗi mà không có bất kỳ thông tin nào để chẩn đoán. Chỉ tắt tiếng những luồng xuất đã chắc chắn không cần, còn thông tin lỗi phải được ghi vào log file hoặc giữ nguyên ở stderr. Khi script phụ thuộc vào các công cụ bên ngoài như `curl`, `jq`, hãy dùng `command -v` kiểm tra trước ở bước khởi tạo; chỉ bật `set -o pipefail` khi đường ống thực sự cần bắt lỗi ở các khâu trung gian.

### Kiểm thử trước khi đưa lên Production

Nội dung kiểm thử cần bám sát các phụ thuộc thực tế của script. Với các script mạng, tối thiểu phải kiểm tra kịch bản rớt kết nối, timeout và các mã lỗi HTTP không thể retry; với các script chạy song song, phải kiểm tra exit code của từng tiến trình con; với các script tạo tài nguyên tạm thời, phải xác nhận việc dọn dẹp sạch sẽ cả khi thoát bình thường lẫn khi nhận tín hiệu ngắt đột ngột. Các lệnh mô phỏng sự cố làm thay đổi tường lửa, giờ hệ thống hay trạng thái mount không thích hợp để sao chép như ví dụ thông thường, mà nên được thiết kế riêng biệt trong môi trường sandbox cô lập.

## Tổng kết

Shell rất phù hợp để xâu chuỗi các câu lệnh có sẵn thành các luồng quy trình tự động hóa gọn nhẹ. Hãy bắt đầu bằng việc nắm vững cách dùng biến, câu lệnh điều kiện, vòng lặp, hàm và mã thoát (exit status), sau đó bổ sung thêm cơ chế timeout, bẫy dọn dẹp và xử lý lỗi phòng thủ tương ứng với tài nguyên mạng, tệp tin và xử lý đồng thời mà script sử dụng.

### Ôn tập các điểm kiến thức cốt lõi

| Khối kiến thức | Trọng tâm cần ghi nhớ |
| --- | --- |
| **Biến** | Phân biệt biến cục bộ, biến môi trường và biến đặc biệt; dùng `local` để tránh ô nhiễm toàn cục; luôn bọc biến trong nháy kép |
| **Chuỗi** | Ưu tiên dùng nháy kép; hiểu rõ khác biệt giữa nháy đơn và nháy kép; dùng `${#var}` để lấy độ dài |
| **Mảng** | bash 2.0+ hỗ trợ mảng 1 chiều (phi POSIX); chú ý hiện tượng lỗ hổng chỉ số sau khi xóa phần tử |
| **Toán tử** | Ưu tiên dùng `$((...))` cho số học; `[[ ]]` an toàn hơn nhiều so với `[ ]` |
| **Điều khiển luồng** | Dùng `[[ ]]` để kiểm tra điều kiện; tránh cái bẫy nguy hiểm của chuỗi `command1 && command2 \|\| command3` |
| **Hàm** | Dùng `local` để giới hạn phạm vi biến; lệnh `return` chỉ trả về mã thoát từ 0 đến 255 |
| **Thay thế lệnh** | Dùng `$(...)` thay thế dấu backtick; dùng `read -r` để đọc dữ liệu an toàn |

### Lời khuyên học tập

Hãy bắt đầu từ những tác vụ nhỏ như lọc file log, đổi tên file hàng loạt hay thống kê dữ liệu. Sau khi viết xong, hãy dùng `bash -n` để kiểm tra cú pháp, rồi chạy ShellCheck để phát hiện các biến chưa được bọc nháy hay lỗi chuyển hướng luồng. Khi script bắt đầu quản lý các tiến trình chạy ngầm hoặc service hệ thống, hãy học sâu hơn về signal, job control, `sed`, `awk` và `grep`. Nếu script phình to lên tới vài trăm dòng, đòi hỏi cấu trúc dữ liệu phức tạp hoặc cần cơ chế khôi phục ngoại lệ tinh vi, việc chuyển sang một ngôn ngữ đa dụng như Python sẽ dễ bảo trì hơn rất nhiều.

### Tài nguyên tham khảo

- **Tài liệu chính thức**: Bash Reference Manual (GNU)
- **Kiểm tra mã nguồn**: ShellCheck - Shell Script Analysis Tool
- **Quy chuẩn lập trình**: Google Shell Style Guide
- **Các cạm bẫy thường gặp**: Bash Pitfalls (http://mywiki.wooledge.org/BashPitfalls)
