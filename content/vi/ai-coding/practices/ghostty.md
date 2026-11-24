---
title: "Terminal phù hợp cho Claude Code/Codex hơn cả iTerm2: Tôi đã chuyển sang Ghostty"
description: "Giới thiệu cách cài đặt terminal Ghostty, vị trí file cấu hình, font chữ và theme, Starship prompt, phím tắt chia màn hình (split screen), Quick Terminal, Shell Integration, SSH và giải đáp thắc mắc thường gặp—phù hợp cho người dùng Claude Code và Codex CLI dựng workbench terminal mượt mà."
category: Kỹ năng lập trình AI
tag:
  - Ghostty
  - Claude Code
  - Codex
  - Công cụ Terminal
head:
  - - meta
    - name: keywords
      content: Ghostty,cài đặt Ghostty,cấu hình Ghostty,hướng dẫn Ghostty,terminal Claude Code,Codex CLI,terminal AI coding,công cụ terminal,Starship,Shell Integration
lang: vi
sourceRef: zh-ref/ai-coding/practices/ghostty.md
---

Xin chào, mình là Tiểu G. Mình đã chuyển hẳn terminal chính từ iTerm2 sang Ghostty được ba tháng nay.

Trải nghiệm tổng thể thực sự rất ưng ý, bài viết này xin chia sẻ lại cùng các bạn.

Ghostty không phải là terminal do Claude Code chỉ định chính thức, nhưng quả thực nó đã nổi lên như cồn nhờ làn sóng Claude Code. Nhà sáng lập Claude Code - Boris Cherny khi chia sẻ về thói quen làm việc của đội ngũ đã đề cập rằng các kỹ sư trong team của họ cực kỳ yêu thích Ghostty.

![Boris Cherny nhắc đến việc đội ngũ Claude Code rất thích Ghostty](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/boris-ghostty-x-54173970.png)

Bản thân mình cũng từ bài chia sẻ đó, cộng thêm việc đã quá chán ngấy với việc cấu hình lằng nhằng trên iTerm2, mà quyết định chuyển qua.

Khi chạy Claude Code hoặc Codex CLI trong thời gian dài, terminal sẽ biến thành một bàn làm việc (workbench) thu nhỏ: một bên theo dõi Agent xuất dữ liệu, một bên chạy test, soi log, xử lý Git. iTerm2 dĩ nhiên cũng làm được, nhưng để tinh chỉnh cho vừa tay thường mất rất nhiều thời gian cấu hình font chữ, theme, phím tắt và chia màn hình (split). Điểm hay của Ghostty là tải về xong dùng luôn đã rất mượt mà, sau đó chỉ cần chỉnh sửa một chút xíu theo thói quen cá nhân.

Ghostty chỉ tập trung làm tốt một việc duy nhất: trở thành một trình giả lập terminal (terminal emulator) xuất sắc, không màu mè hoa mỹ. Nó không tích hợp sẵn AI, cũng không tham vọng trở thành một trình quản lý máy chủ.

Tất nhiên, iTerm2, Warp, Kitty... đều là những công cụ rất tốt, mình hy vọng các bạn đọc bài viết này không sa đà vào các cuộc tranh luận xem cái nào hơn; công cụ nào bạn dùng thuận tay nhất mới là điều quan trọng nhất!

![Trang chủ chính thức của Ghostty](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/ghostty-homepage-1fc7ec04.png)

## Cài đặt

Trên macOS, cài đặt trực tiếp qua Homebrew:

```bash
brew install --cask ghostty
```

Hoặc bạn có thể lên trang chủ tải file `.dmg` về rồi kéo vào thư mục Applications. Bản cài macOS chính thức được dự án Ghostty ký điện tử (code-signed) và kiểm duyệt notarize bởi Apple; Homebrew cask cũng sử dụng chính file `.dmg` chính thức này.

Cài xong, kiểm tra số hiệu phiên bản:

```bash
/Applications/Ghostty.app/Contents/MacOS/ghostty +version
```

Nếu binary CLI đã nằm trong biến môi trường `PATH`:

```bash
ghostty +version
```

![Kết quả kiểm tra phiên bản Ghostty](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/ghostty-version-f7543467.png)

> Lưu ý phiên bản: Cấu hình trong bài viết này được đối chiếu trên phiên bản Ghostty 1.3.1 (nhánh 1.3.x) trên máy của mình. Ghostty cập nhật rất nhanh, các thiết lập cấu hình cụ thể hãy lấy lệnh `ghostty +show-config --default --docs` trên máy bạn làm chuẩn. Phiên bản Ghostty 1.4.0 dự kiến bổ sung lệnh `ghostty +ssh`; phần dưới của bài viết giữ lại cách xử lý SSH của bản 1.3.x, người dùng 1.4 trở lên vui lòng tham khảo trước [Tài liệu Ghostty SSH](https://ghostty.org/docs/features/ssh), tránh sao chép mù quáng cấu hình cũ.

Cách cài đặt trên Linux tùy thuộc vào từng bản phân phối (distro). Với Arch Linux, có thể cài trực tiếp:

```bash
sudo pacman -S ghostty
```

Các distro khác hãy ưu tiên xem trang cài đặt chính thức. Đội ngũ Ghostty phân phối gói dựng sẵn trực tiếp cho macOS, còn các gói Linux phần lớn do người duy trì bản phân phối hoặc cộng đồng đóng gói; trên máy làm việc công ty, tuyệt đối không tùy tiện chạy các script cài đặt không rõ nguồn gốc.

## Hãy dùng thử cấu hình mặc định trong một ngày trước

Thực tế bạn không cần cấu hình bất kỳ thứ gì vẫn có thể dùng ngay, các thiết lập mặc định đã đủ đáp ứng nhu cầu của đa số lập trình viên.

Ghostty mặc định tích hợp sẵn font JetBrains Mono, đồng thời hỗ trợ đầy đủ các ký tự Nerd Fonts. Hầu hết mọi người không cần cài font ngoài vẫn hiển thị đẹp đẽ.

Khi mới bắt đầu, đừng vội vàng copy-paste hàng trăm dòng cấu hình trên mạng. Hãy mở lên và dùng thuần túy trong một ngày, sau đó mới từ từ tinh chỉnh font, theme, khoảng đệm cửa sổ (padding), độ trong suốt (opacity), clipboard, Shell Integration và phím tắt chia màn hình. File cấu hình terminal càng dài thì khi phát sinh lỗi càng khó truy xét; một ưu điểm rất lớn của Ghostty là bạn phải cấu hình rất ít.

## File cấu hình nằm ở đâu?

Cấu hình của Ghostty sử dụng cú pháp rất gọn gàng `key = value`. Tên file được khuyến nghị hiện nay là `config.ghostty`, tên file cũ `config` vẫn được hỗ trợ đọc. Các đường dẫn phổ biến:

```text
~/.config/ghostty/config.ghostty
~/.config/ghostty/config
```

Trên macOS, ứng dụng còn đọc thêm:

```text
~/Library/Application Support/com.mitchellh.ghostty/config.ghostty
~/Library/Application Support/com.mitchellh.ghostty/config
```

Nếu cả hai nơi đều có cấu hình, đường dẫn Application Support trên macOS sẽ được nạp sau, các giá trị trùng lặp sẽ ghi đè lên giá trị nạp trước đó. Nếu sửa cấu hình mà không thấy có tác dụng, hãy kiểm tra thứ tự ưu tiên này trước tiên.

Các lệnh kiểm tra hữu ích:

```bash
ghostty +list-fonts
ghostty +list-themes
ghostty +list-keybinds --default
ghostty +validate-config
```

Sau khi sửa xong file cấu hình, trên macOS bấm `Cmd + Shift + ,` để nạp lại (reload), trên Linux bấm `Ctrl + Shift + ,`. Các thuộc tính cửa sổ như độ trong suốt có thể không hỗ trợ hot-reload ngay lập tức, nếu chưa thấy thay đổi bạn chỉ cần khởi động lại Ghostty.

## Bản cấu hình tối giản của mình

Trước tiên tạo thư mục:

```bash
mkdir -p ~/.config/ghostty
```

Mở chỉnh sửa file cấu hình:

```bash
nano ~/.config/ghostty/config.ghostty
```

Bạn có thể sử dụng trực tiếp bản cấu hình tinh gọn này:

```ini
# Font chữ
font-family = "JetBrainsMono Nerd Font Mono"
font-size = 14
font-thicken = true
font-thicken-strength = 80
font-codepoint-map = U+2E80-U+9FFF,U+F900-U+FAFF,U+FF00-U+FFEF=PingFang SC

# Theme
theme = Catppuccin Mocha

# Cửa sổ
window-padding-x = 12
window-padding-y = 10
window-save-state = always
background-opacity = 0.95
background-blur = 20

# Con trỏ và thanh cuộn
cursor-style = bar
cursor-style-blink = true
scrollback-limit = 10000000
scrollbar = never

# Shell Integration
shell-integration = detect
shell-integration-features = cursor,sudo,title

# macOS
macos-option-as-alt = left
macos-titlebar-style = transparent
macos-titlebar-proxy-icon = hidden

# Chia màn hình
split-divider-color = #45475a
unfocused-split-opacity = 0.92

# Clipboard
copy-on-select = false
clipboard-paste-protection = true
clipboard-paste-bracketed-safe = true
```

Font chữ ở đây dùng JetBrainsMono Nerd Font Mono, chủ yếu để các biểu tượng nhánh Git, prompt Starship, icon Powerline không bị lỗi thành ô vuông. Nếu chưa cài đặt:

```bash
brew install --cask font-jetbrains-mono-nerd-font
```

Với các ký tự CJK (Trung/Nhật/Hàn), đừng vội nhét bừa `PingFang SC` làm font thứ hai trong `font-family`. Khi font chính bị thiếu glyph, chữ tiếng Anh cũng có thể bị fallback sang font tiếng Trung, khiến khoảng cách chữ (kerning) trở nên rất kỳ quặc. Thiết lập `font-codepoint-map` chỉ giao dải mã tiếng Trung cho `PingFang SC`, hiển thị sẽ ổn định hơn nhiều.

`copy-on-select = false` là thói quen cá nhân của mình. Ghostty mặc định cứ bôi đen chọn văn bản là tự sao chép, người dùng Linux có thể thích điều này; trên macOS, mình muốn chủ động nhấn `Cmd + C` hơn, tránh việc vô tình ghi đè nội dung clipboard quan trọng.

`clipboard-paste-protection = true` rất nên giữ lại. Sao chép nhiều dòng lệnh từ trang web dán vào terminal, vốn dĩ luôn cần thêm một bước xác nhận an toàn.

Lưu ý rằng đơn vị của `scrollback-limit` được tính bằng byte chứ không phải số dòng; giá trị `10000000` tương đương khoảng 10 MB, và mỗi phân vùng chia màn hình (split) hay tab đều được tính toán bộ nhớ đệm độc lập.

![Hiệu quả hiển thị của Ghostty kết hợp Catppuccin Mocha, JetBrainsMono Nerd Font và Starship](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/ghostty-terminal-demo-347f0be6.png)

## Chủ đề (Themes)

Liệt kê danh sách theme tích hợp sẵn:

```bash
ghostty +list-themes
```

Đổi theme chỉ cần đúng một dòng:

```ini
theme = TokyoNight
```

Mình thường dùng:

```ini
theme = Catppuccin Mocha
```

Nếu muốn tự động thích ứng theo chế độ sáng/tối của hệ thống:

```ini
theme = dark:Catppuccin Mocha,light:Catppuccin Latte
```

Số lượng theme tích hợp sẵn trong Ghostty đã quá đủ dùng. Theme tùy chỉnh về bản chất cũng chỉ là một đoạn cấu hình được Ghostty nạp vào, đa số chỉ đổi bảng mã màu; khi tải theme từ nguồn lạ trên mạng, hãy mở ra xem qua để đảm bảo nó không tự tiện can thiệp vào font chữ, độ trong suốt hay phím tắt của bạn.

## Starship (Tùy chọn)

Ghostty phụ trách cửa sổ terminal, font chữ, theme và các giao thức tầng thấp; còn Starship quản lý dòng nhắc lệnh (shell prompt).

Nếu muốn dòng prompt đồng bộ phong cách với Catppuccin, bạn có thể cài:

```bash
brew install starship
```

Thêm vào cuối file `~/.zshrc`:

```bash
command -v starship >/dev/null && eval "$(starship init zsh)"
```

Nếu muốn kiểm tra xem Starship đang thực sự hiển thị những module nào, hãy chạy lệnh sau trong một Git repository:

```bash
starship explain
```

![Starship explain thể hiện đường dẫn, nhánh và trạng thái Git trên prompt](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/starship-explain-3220819f.png)

Mình khuyên không nên bật toàn bộ các module của Starship ngay từ đầu. Hiển thị thư mục, nhánh Git, trạng thái Git, thời gian thực thi là đã quá đủ; còn Kubernetes, cloud credentials, container runtimes... khi nào thực sự cần hãy bật. Dòng prompt mỗi lần bạn gõ Enter đều phải tính toán lại, thông tin quá ôm đồm sẽ khiến cảm giác gõ lệnh bị giật cục.

## Chia màn hình và phím tắt thông dụng

Trên macOS, trước hết hãy ghi nhớ những phím tắt này:

| Phím tắt | Tác dụng |
| --- | --- |
| `Cmd + T` | Mở tab mới |
| `Cmd + W` | Đóng terminal hiện tại hoặc phân vùng chia |
| `Cmd + D` | Chia đôi màn hình sang phải |
| `Cmd + Shift + D` | Chia đôi màn hình xuống dưới |
| `Cmd + [` / `Cmd + ]` | Chuyển qua lại giữa các phân vùng trước / sau |
| `Cmd + Option + Phím mũi tên` | Chuyển phân vùng theo hướng mũi tên |
| `Cmd + Shift + Enter` | Phóng to (Zoom) / Khôi phục kích thước phân vùng hiện tại |
| `Cmd + F` | Tìm kiếm trong lịch sử output |
| `Cmd + Shift + ,` | Tải lại (Reload) file cấu hình |
| `Cmd + Shift + P` | Mở Command Palette |

Khi chạy Claude Code, bố cục 3 ô này là thuận tay nhất:

1. Bấm `Cmd + D` chia đôi màn hình trái - phải.
2. Đưa con trỏ sang ô bên phải, bấm `Cmd + Shift + D` chia tiếp thành trên - dưới.
3. Ô bên trái chạy Claude Code, ô trên bên phải chạy test, ô dưới bên phải theo dõi log hoặc trạng thái Git.
4. Khi output của Claude quá dài, bấm `Cmd + Shift + Enter` để phóng to toàn màn hình tạm thời.

Bố cục này không cần đụng đến tmux, cũng không cần kéo thả sắp xếp lỉnh kỉnh nhiều cửa sổ.

![Ghostty chia màn hình chạy Claude Code, dev server và log](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/ghostty-split-claude-code-130d93c9.png)

Nếu muốn tự định nghĩa phím tắt riêng, hãy dùng cú pháp này:

```ini
keybind = trigger=action
```

Ví dụ:

```ini
keybind = cmd+shift+e=equalize_splits
keybind = cmd+shift+f=toggle_split_zoom
```

## Quick Terminal

Quick Terminal là cửa sổ terminal tạm thời trượt xuống từ cạnh trên màn hình. Rất thích hợp để gõ nhanh một vài câu lệnh nhất thời, không phù hợp để làm bàn làm việc chính suốt cả ngày.

Cấu hình:

```ini
quick-terminal-position = top
quick-terminal-screen = main
quick-terminal-autohide = true
quick-terminal-animation-duration = 0.15
keybind = global:ctrl+grave_accent=toggle_quick_terminal
```

Quick Terminal không có phím tắt mặc định, bạn bắt buộc phải tự gán qua `toggle_quick_terminal`. Tiền tố `global:` không phải môi trường nào cũng chạy được: Trên macOS cần cấp quyền Trợ năng (Accessibility) cho Ghostty trong cài đặt hệ thống; trên Linux, Quick Terminal chỉ hỗ trợ Wayland và yêu cầu compositor hỗ trợ `wlr-layer-shell-v1` (X11 không được hỗ trợ). Hiệu ứng trượt trên Linux hiện chỉ hỗ trợ KDE khi bật plugin "Sliding Popups" của KWin và khởi động lại Ghostty; môi trường như GNOME dù có cấu hình `quick-terminal-animation-duration` cũng không xuất hiện hiệu ứng trượt. Nếu cấu hình không báo lỗi nhưng bấm phím tắt không phản hồi, hãy kiểm tra lại giao thức hiển thị, quyền hệ thống và xung đột phím tắt toàn cục.

Ngoài ra, trên macOS khi đổi `quick-terminal-position` cần khởi động lại Ghostty hoàn toàn.

## Shell Integration

Mục cấu hình này mình luôn luôn bật:

```ini
shell-integration = detect
```

Ghostty sẽ tự động chèn một đoạn script tích hợp cho zsh, fish, bash, nushell, elvish. Sau khi bật, khi mở một phân vùng mới, nó sẽ tự động kế thừa thư mục làm việc hiện tại; ví dụ bạn đang ở trong thư mục gốc dự án mà mở thêm phân vùng bên phải, ô bên phải sẽ giữ nguyên thư mục đó chứ không bị văng về thư mục home `~`. Các dòng prompt phức tạp khi xuống dòng hay co giãn kích thước cửa sổ cũng ít bị lỗi hiển thị hơn, đồng thời lịch sử output có thể nhảy bước theo từng mốc prompt.

Có hai điểm cần lưu ý:

Bản `/bin/bash` đi kèm sẵn của macOS quá cũ, tài liệu chính thức nêu rõ nó không hỗ trợ tự động inject; người dùng mặc định zsh thì không cần lo lắng. Điểm thứ hai là nếu bạn đổi shell thủ công ngay trong Ghostty, ví dụ nhảy vào `nix-shell`, khả năng tích hợp có thể bị mất, khi đó bạn phải nạp script tương ứng bằng tay.

## Đừng vội cấu hình SSH

Ghostty 1.3.x sở hữu terminfo và các giao thức mở rộng riêng biệt. Khi máy chủ từ xa không nhận diện được terminfo này, các công cụ TUI như Neovim hay htop có thể bị lỗi hiển thị ký tự.

Nếu bạn chỉ thỉnh thoảng mới SSH vào server, tốt nhất cứ để nguyên. Nếu thực sự gặp lỗi hiển thị từ xa, mới cân nhắc cấu hình:

```ini
shell-integration-features = cursor,title,ssh-env,ssh-terminfo
```

Môi trường SSH vốn dĩ rất đa dạng và phức tạp, khi mọi thứ đang chạy ổn thỏa thì hạn chế bọc thêm các lớp vỏ bên ngoài.

Sau khi Ghostty 1.4.0 ra mắt chính thức, hãy ưu tiên đánh giá phương thức tích hợp do `ghostty +ssh` cung cấp rồi mới quyết định có giữ cấu hình 1.3.x phía trên hay không.

## Thắc mắc thường gặp (FAQ)

Nếu sửa cấu hình không có tác dụng, hãy kiểm tra cả hai thư mục cấu hình trước, sau đó chạy lệnh kiểm tra cú pháp:

```bash
ls -la ~/.config/ghostty
ls -la "$HOME/Library/Application Support/com.mitchellh.ghostty"
ghostty +validate-config
```

Trên mạng có một số bài viết dùng dấu phân cách kiểu `=== Font chữ ===`, Ghostty sẽ báo lỗi cú pháp. Dòng comment bắt buộc phải viết chuẩn dạng `# Font chữ`.

Khoảng cách chữ tiếng Anh bị kỳ lạ, hãy kiểm tra xem tên font có khớp chính xác không:

```bash
ghostty +list-fonts | rg -i "JetBrains|Mono|Nerd"
```

Nếu bạn ghi `font-family = JetBrains Mono` nhưng máy chưa cài font này, Ghostty sẽ tự fallback. Khi fallback sang font tiếng Trung thì chữ tiếng Anh sẽ bị kéo giãn khoảng cách rất xấu. Hãy cài font chuẩn, hoặc đổi sang đúng tên font family mà Ghostty nhận diện được.

Tên theme bắt buộc phải lấy chuẩn xác từ output của `ghostty +list-themes`. Thấy ghi `Catppuccin Mocha` thì trong file cấu hình phải viết y nguyên:

```ini
theme = Catppuccin Mocha
```

Độ trong suốt (opacity) không đổi, hãy khởi động lại Ghostty hoàn toàn. Một khả năng khác là Neovim, tmux tự vẽ màu nền riêng của chúng; Ghostty mặc định chỉ làm trong suốt nền cửa sổ, không đảm bảo các ô (cell) có chỉ định màu nền tường minh cũng trong suốt. Nếu thực sự muốn các cell này cũng trong suốt theo, hãy tìm hiểu thêm tùy chọn `background-opacity-cells`.

Nếu việc bôi đen chọn văn bản làm ghi đè nội dung clipboard, hãy tắt đi:

```ini
copy-on-select = false
```

Phím tắt toàn cục Quick Terminal không phản hồi, kiểm tra 3 điều: File cấu hình đã có tiền tố `global:` chưa, quyền trợ năng của hệ điều hành đã cấp chưa, và phím tắt đó có bị phần mềm khác chiếm dụng hay không.

## Tổng kết

Nếu chỉ đơn thuần muốn tìm một terminal giao diện đẹp, iTerm2 hoàn toàn có thể tùy biến theme và độ trong suốt tương tự. Với cá nhân mình, Ghostty mang lại cảm giác nhẹ nhàng, thanh thoát hơn hẳn trong việc quản lý cửa sổ native, chia màn hình mặc định mượt mà, file cấu hình dễ đọc và khả năng xử lý output dài tốc độ cao. Đây là cảm nhận thực tế trên cấu hình máy và thói quen làm việc của riêng mình, không phải kết luận đo lường hiệu năng đại trà.

Lời khuyên là hãy cứ dùng các giá trị mặc định trong một ngày trước, sau đó dựa trên nhu cầu thực tế mà tinh chỉnh dần font chữ, theme và phím tắt; khi đã chia màn hình thuần thục rồi thì mới cân nhắc xem có cần bật Quick Terminal hay không. Bạn cũng có thể nhờ Coding Agent sinh cấu hình mẫu dựa trên bài viết này, nhưng trước khi ghi đè file hãy kiểm tra kỹ phiên bản Ghostty, hệ điều hành và các phím tắt hiện có trên máy của bạn để tránh làm mất các thiết lập cá nhân.
