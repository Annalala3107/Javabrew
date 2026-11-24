---
title: Model Context Protocol (MCP) là gì? Có quan hệ gì với Function Calling và Agent?
description: Khái niệm cốt lõi của MCP (Model Context Protocol), kiến trúc phân tầng 4 lớp, cơ chế giao tiếp JSON-RPC 2.0 và thực tiễn phát triển MCP Server cấp độ production.
category: Phát triển ứng dụng AI
lang: vi
sourceRef: zh-ref/ai/agent/mcp.md
head:
  - - meta
    - name: keywords
      content: MCP,Model Context Protocol,JSON-RPC,Function Calling,AI Agent,Tích hợp công cụ,Anthropic
---

Khi kết nối cùng một công cụ Git vào Claude Desktop, Cursor và một Agent tự xây dựng, lập trình viên thường phải viết riêng một tầng adapter cho từng client. Mỗi khi tham số công cụ, phương thức xác thực hoặc phiên bản thay đổi, toàn bộ các client kết nối tới nó đều phải sửa đổi theo.

MCP quy định các hệ thống bên ngoài sẽ đóng vai trò Server để cung cấp năng lực, còn các Host hỗ trợ giao thức này sẽ thông qua Client để khám phá (discover) và gọi (invoke) các năng lực đó. Nó xử lý bài toán tích hợp công cụ và nguồn dữ liệu; còn việc mô hình quyết định gọi ra sao, tác vụ được điều phối thế nào vẫn thuộc về trách nhiệm của Function Calling và Agent.

![Sơ đồ minh họa MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

> Bài viết này chủ yếu dựa trên [revision 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) ổn định hiện tại. Revision thế hệ trước `2025-11-25` sử dụng cơ chế bắt tay khởi tạo (initialization handshake) và phiên làm việc ở tầng truyền tải (transport session); trong khi `2026-07-28` đã chuyển sang dạng request phi trạng thái (stateless), tự mô tả, loại bỏ bước bắt tay `initialize`/`initialized` cùng `Mcp-Session-Id`, đồng thời chuyển Tasks sang extension `io.modelcontextprotocol/tasks`. Các client và SDK tương thích ngược có thể vẫn sử dụng `2025-11-25`, vì vậy trước khi tích hợp hãy xác nhận đồng thời revision giao thức, phiên bản SDK và năng lực của Host.

## MCP thực chất là gì?

MCP là viết tắt của Model Context Protocol (Giao thức ngữ cảnh mô hình).

Khi tách các từ trong tên gọi MCP ra, ý nghĩa thực sự của nó trở nên rất rõ ràng:

- Model: Hướng tới các ứng dụng mô hình ngôn ngữ lớn (LLM);
- Context: Mang ngữ cảnh bên ngoài, công cụ và nguồn dữ liệu đến cho mô hình;
- Protocol: Định hình phương thức tương tác thông qua một bộ giao thức chuẩn hóa.

Tuy nhiên, đừng hiểu MCP một cách đơn giản chỉ là việc bổ sung plugin cho mô hình. Trước đây trong các cộng đồng lập trình viên, có không ít người từng hiểu theo cách như vậy.

Chuẩn xác hơn, MCP là **giao thức giao tiếp giữa MCP Client và MCP Server**. Host chịu trách nhiệm tương tác với người dùng và gọi mô hình, Client chịu trách nhiệm giao tiếp với Server, còn Server chịu trách nhiệm phơi bày (expose) các năng lực cụ thể ra ngoài.

Lấy một tình huống rất đỗi quen thuộc:

Người dùng hỏi: "Hãy xem giúp tôi commit gần nhất của dự án này đã thay đổi những gì."

Mô hình hoặc Agent mà bạn đang dùng dĩ nhiên không hề biết gì về lịch sử commit của kho mã nguồn Git cục bộ trên máy bạn. Nó bắt buộc phải nhờ vào năng lực bên ngoài để đọc Git log.

Khi chưa có MCP, mỗi ứng dụng AI đều phải tự định nghĩa một cách thức riêng về "làm sao để kết nối công cụ Git, truyền tham số thế nào và lấy kết quả ra sao".

Khi có MCP, các năng lực liên quan đến Git có thể được đóng gói thành một MCP Server. MCP Client nằm trong Host kết nối tới Server này, trước tiên sẽ khám phá xem có những công cụ nào, sau đó gọi công cụ theo đúng chuẩn giao thức, cuối cùng chuyển kết quả lại cho mô hình tiếp tục phân tích.

Khâu tương thích giao thức của công cụ Git được tập trung xử lý ở phía Server, còn Agent hoặc ứng dụng AI chỉ cần tập trung vào việc hiểu câu hỏi của người dùng, lựa chọn công cụ và tổng hợp kết quả. Hai bên không cần phải thỏa thuận lại một bộ interface riêng biệt cho từng client nữa.

## Mối quan hệ giữa MCP, Function Calling và Agent là gì?

Trong một tác vụ "đọc commit mới nhất của repository", Function Calling, MCP và Agent có thể cùng xuất hiện, nhưng mỗi bên nằm ở một vị trí hoàn toàn khác nhau: mô hình đưa ra ý định gọi có cấu trúc trước, Host chuyển ý định đó tới công cụ thực tế, và Agent sẽ căn cứ vào kết quả trả về để quyết định xem có tiếp tục hay không.

Lấy ví dụ về ý định gọi do mô hình sinh ra:

```json
{
  "name": "read_file",
  "arguments": {
    "path": "/repo/README.md"
  }
}
```

OpenAI gọi cơ chế này là Function Calling, còn Anthropic gọi là Tool Use. Mô hình nhờ vào nó để xuất ra dữ liệu có cấu trúc kiểu như "hãy gọi `read_file`, tham số là đường dẫn này".

MCP chịu trách nhiệm kết nối ý định này tới hệ thống bên ngoài: công cụ được khám phá từ Server nào, request truyền tải ra sao, kết quả trả về như thế nào.

Agent chịu trách nhiệm về bước tiếp theo của toàn bộ tác vụ. Nó sẽ đọc kết quả từ công cụ, quyết định gọi tiếp, kết thúc tác vụ, hay chờ con người xác nhận; việc lập kế hoạch (planning), bộ nhớ (memory) và vòng lặp (loop) cũng đều thuộc về tầng này.

![Sơ đồ 3 tầng quan hệ FC / MCP / Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-fc-agent-layer-c857389e.png)

Đặt cả ba vào trong một chuỗi request sẽ thấy rất trực quan: Function Calling sinh ra mệnh lệnh, MCP truyền tải mệnh lệnh và kết nối công cụ, còn Agent quyết định khi nào chuỗi này tiếp tục, khi nào kết thúc.

Trọng tâm quan tâm của các kịch bản khác nhau như sau:

| Kịch bản | Yếu tố mấu chốt hơn | Lý do |
| --- | --- | --- |
| Để mô hình phán đoán có cần tra thời tiết không | Function Calling | Trọng tâm là mô hình chuyển ý định thành tham số có cấu trúc |
| Để Claude Desktop đọc file cục bộ | MCP | Trọng tâm là có interface chuẩn giữa host và hệ thống file cục bộ |
| Để AI tự động điều tra sự cố online | Agent | Trọng tâm là quyết định nhiều bước, gọi công cụ và vòng lặp phản hồi |

Trong các dự án thực tế cả ba thường cùng xuất hiện, bảng trên chỉ nhằm mục đích phân định rõ ranh giới trách nhiệm chính.

## Bên trong MCP thực sự có những thành phần nào?

Tuyến giao tiếp của MCP bao gồm Host, Client và Server.

![Kiến trúc 4 lớp của MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-four-layer-architecture-fe3b7a7f.png)

Host là ứng dụng AI mà người dùng trực tiếp sử dụng, ví dụ Claude Desktop, Cursor, plugin AI trong VS Code hoặc nền tảng Agent tự xây dựng.

Client nằm bên trong Host, chịu trách nhiệm trao đổi message giao thức với MCP Server. Với revision `2025-11-25` trở về trước, Client thiết lập session thông qua bắt tay khởi tạo; còn với `2026-07-28`, nó sử dụng request phi trạng thái, không còn duy trì session tầng truyền tải MCP nữa. Một Host có thể kết nối với nhiều Server, thông thường mỗi Server tương ứng với một Client.

Lập trình viên chủ yếu viết mã cho Server. Các năng lực như đọc file, truy vấn SQL, tra cứu GitHub Issue và tra cứu ticket nội bộ đều do Server phơi bày cho Host sử dụng.

Phía sau Server mới là nguồn dữ liệu thực tế: file cục bộ, cơ sở dữ liệu, nền tảng nội bộ, GitHub hoặc API bên thứ ba. Chúng không thuộc về vai trò giao thức của MCP. Host chỉ gọi Server thông qua Client; các xử lý tầng dưới như truy vấn database, gọi API đều được đóng gói giải quyết bên trong Server.

## Một lượt gọi MCP diễn ra như thế nào?

Tiếp tục lấy ví dụ "phân tích commit mới nhất của repository này".

![Sơ đồ tuần tự cuộc gọi MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-call-seq-2ea44739.png)

Sau khi nhận thấy mình thiếu dữ liệu Git log, mô hình sẽ sinh ra một lệnh gọi công cụ. Host chuyển lời gọi này cho MCP Client, Client gửi request qua JSON-RPC tới Server; Server truy vấn Git, rồi trả kết quả ngược lại theo đúng đường đi ban đầu, từ đó mô hình tổng hợp câu trả lời.

Tên công cụ, `description`, mô tả tham số và kịch bản cấm dùng sẽ ảnh hưởng trực tiếp đến việc lựa chọn của mô hình. Các tham số mà Server nhận được cũng bắt buộc phải coi là đầu vào không đáng tin cậy: đọc file phải giới hạn thư mục, SQL phải dùng parameterized query, thao tác nguy hiểm phải có phê duyệt, dữ liệu trả về phải được khử nhạy (redact).

Trong revision `2026-07-28`, MCP không còn yêu cầu bắt tay `initialize`/`initialized` hay `Mcp-Session-Id`. Mỗi request đều tự chứa thông tin phiên bản giao thức và năng lực của client; [đặc tả kỹ thuật yêu cầu](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning) Server bắt buộc phải triển khai `server/discover`, nhưng Client có thể không gọi mà gửi thẳng các request khác. Các client tương thích dùng revision `2025-11-25` hoặc cũ hơn vẫn sẽ thực hiện bắt tay khởi tạo. Khi điều tra lý do công cụ không xuất hiện, trước hết hãy xác nhận revision mà Client và Server đang chọn, sau đó kiểm tra metadata năng lực trong request hiện đại hoặc kết quả bắt tay ở phiên bản cũ.

## Năng lực mà MCP phơi bày có phải chỉ duy nhất là Tools?

Trong cộng đồng kỹ thuật, nhiều người khi nói về MCP chỉ nhắc đến Tools, điều này cũng dễ hiểu vì gọi công cụ là trực quan nhất. Nhưng bên trong MCP không chỉ có mỗi công cụ.

### Resources, Tools và Prompts

Server có thể cung cấp ba nhóm năng lực cơ bản: Resources, Tools và Prompts.

Resources dùng để cung cấp ngữ cảnh chỉ đọc, ví dụ file cục bộ, đoạn trích log, database schema hoặc bản ghi cấu hình.

Tools dùng để thực thi hành động, ví dụ truy vấn cơ sở dữ liệu, gửi tin nhắn, tạo ticket hoặc gọi API nghiệp vụ. Các năng lực chủ động thực thi logic và có khả năng thay đổi trạng thái bên ngoài nên được xếp vào Tools.

Prompts là các mẫu prompt có thể tái sử dụng, ví dụ "thực hiện code review theo quy chuẩn của team" hoặc "chuyển tài liệu interface thành test case".

Tools thường do mô hình tự động lựa chọn và gọi; còn phương thức hiển thị và lựa chọn Resources cùng Prompts còn có thể do Host, giao diện người dùng hoặc logic ứng dụng quyết định.

Dùng một ví dụ đời thường để hiểu về Resources, Tools, Prompts:

Người dùng nói: "Tôi muốn ăn món nộm dưa chuột."

LLM đóng vai người đầu bếp, nó biết nộm dưa chuột đại khái làm như thế nào, nhưng nó vẫn cần các điều kiện bên ngoài:

- Resources giống như nguyên liệu và công thức: trong tủ lạnh có gì, nhà có dưa chuột không, gia vị để ở đâu;
- Tools giống như hành động cụ thể: thái dưa, trộn gia vị, bật bếp, đặt hàng mua rau;
- Prompts giống như khẩu vị quen thuộc của gia đình: ít cay, bắt buộc phải có rau mùi, không được cho tỏi.

Nếu mô tả công cụ bị viết sai, ví dụ mô tả "dưa chuột" thành "cà chua", mô hình có thể sẽ chọn nhầm công cụ.

Khi đưa vào production, tên công cụ, mô tả tham số và cấu trúc dữ liệu trả về đều trực tiếp ảnh hưởng đến quyết định và phán đoán tiếp theo của Agent. Server khởi động được mới chỉ là bước khởi đầu, ranh giới năng lực còn phải giúp mô hình hiểu một cách chuẩn xác.

### Roots, Sampling và Elicitation

Bên cạnh năng lực từ phía Server, phía Client cũng có thể cung cấp một số năng lực cho Server sử dụng, ví dụ như Roots, Sampling, Elicitation. Bản `2026-07-28` đã đánh dấu Roots, Sampling và Logging là deprecated (nhưng vẫn giữ lại ít nhất 12 tháng); Tasks thì được chuyển sang extension `io.modelcontextprotocol/tasks`. Các triển khai mới nên xác nhận trước mức độ hỗ trợ của Client/Host đích đối với các năng lực hoặc extension này.

Roots do Host thông qua Client thông báo cho Server biết: phạm vi làm việc hiện tại dự kiến nằm trong những thư mục gốc nào của filesystem. Ví dụ, Host có thể chỉ công bố thư mục dự án hiện tại, mà không để lộ thư mục home của người dùng. Đây là sự thỏa thuận năng lực và gợi ý phạm vi, chứ không tự động tạo ra một sandbox filesystem; Server vẫn phải thực hiện chuẩn hóa đường dẫn, kiểm tra vượt ranh giới và cách ly quyền hạn ở cấp độ hệ điều hành.

Sampling tương đối đặc biệt, nó cho phép Server yêu cầu LLM phía Host thực hiện một lần sinh nội dung. Ví dụ sau khi đọc được một đoạn log, Server muốn nhờ mô hình tóm tắt hoặc phân loại đoạn log đó.

Elicitation là năng lực mà Server trong quá trình thực thi có thể hỏi thêm thông tin từ người dùng. Ví dụ khi tham số chưa đầy đủ, tùy chọn mơ hồ, hoặc trước khi thực thi cần người dùng xác nhận, phía Host sẽ hiển thị giao diện tương tác để người dùng nhập.

Những năng lực này cần được lựa chọn tùy theo tình huống. Phần lớn MCP Server ban đầu có thể chỉ cần cung cấp Tools; khi cần ngữ cảnh chỉ đọc hoặc lối vào tác vụ tái sử dụng mới cân nhắc đến Resources, Prompts. Còn Roots, Sampling, Elicitation cũng như Tasks extension đều phụ thuộc vào việc Client/Host tương ứng có triển khai hay không, không thể chỉ nhìn vào việc Server SDK có interface hay không.

## Tại sao MCP sử dụng JSON-RPC?

MCP sử dụng JSON-RPC 2.0 cho việc giao tiếp ở tầng dưới.

REST thiên về tài nguyên, ví dụ `/users/1`, `/orders/100`. JSON-RPC thiên về gọi phương thức, ví dụ `tools/call`, `resources/read`. Việc AI gọi công cụ bản chất tự nhiên chính là "tôi muốn thực hiện một hành động nào đó", vì vậy JSON-RPC rất vừa vặn với kịch bản sử dụng của MCP.

Theo [các trường metadata request trong đặc tả 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/index), một request gọi công cụ có thể viết như dưới đây. `_meta` nằm bên trong `params`, cùng cấp với `name` và `arguments`; ở đây `my-app` và `1.0` là tên và phiên bản của client ví dụ, object capabilities rỗng biểu thị request lần này không khai báo các năng lực client tùy chọn:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/path/to/file.txt"
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "my-app",
        "version": "1.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  },
  "id": 1
}
```

Response thành công có thể trông như thế này:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "content": [
      {
        "type": "text",
        "text": "Nội dung file..."
      }
    ]
  }
}
```

Khi thất bại mới trả về `error`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params"
  }
}
```

Response thành công chỉ trả về `result`, response thất bại mới trả về `error`; tuyệt đối không đính kèm `error: null` trong response thành công.

Thông điệp của JSON-RPC là định dạng văn bản (text format), thuận tiện cho việc ghi log và không bị ràng buộc vào phương thức truyền tải cụ thể nào. Điểm đánh đổi là nó không có IDL mạnh mẽ và ràng buộc kiểu ở thời điểm biên dịch như gRPC. Mặc dù MCP có thể dùng JSON Schema để mô tả tham số công cụ, nhưng Schema vừa là quy tắc kiểm tra tại runtime, vừa là gợi ý cho mô hình; Server vẫn bắt buộc phải thực hiện kiểm tra chặt chẽ đối với toàn bộ tham số đầu vào.

## Lựa chọn giữa stdio và Streamable HTTP như thế nào?

Server chạy tại local thường sử dụng stdio. Host sẽ khởi động nó dưới dạng một tiến trình con (child process), sau đó trao đổi thông điệp qua stdin/stdout; rất nhiều Server local trong Claude Desktop sử dụng phương thức này. Nó không tốn chi phí triển khai mạng, nhưng vì Server chạy ngay trên máy local nên quyền hạn về file, Shell và cơ sở dữ liệu cần phải được siết chặt riêng biệt.

Nếu là Server của bên thứ ba, tốt nhất đừng chạy trần trực tiếp. Ít nhất hãy xem qua mã nguồn trước, hoặc dùng Docker, cgroups, namespace để cách ly. Đặc biệt là các Server liên quan đến filesystem, Shell, cơ sở dữ liệu, một khi đã cấp quyền quá rộng thì về sau rất khó khắc phục.

Trong chế độ stdio, stdout là kênh truyền thông điệp JSON-RPC, tuyệt đối không được dùng để in log debug. Chỉ một dòng lệnh `print()` cũng có thể phá vỡ định dạng thông điệp, khiến Host không thể parse được hoặc làm Server bị ngắt kết nối. Log debug bắt buộc phải ghi vào stderr hoặc file log; khi điều tra sự cố "Server khởi động thất bại", cũng cần xác nhận xem stdout có bị lẫn log vào hay không.

Server từ xa (remote) phù hợp hơn với Streamable HTTP. Thời kỳ đầu MCP thường dùng HTTP + SSE cho truyền tải từ xa, sau đó chuyển hướng sang Streamable HTTP; chuẩn HTTP+SSE cũ hiện đã bị đánh dấu deprecated. Bản `2026-07-28` tiếp tục sử dụng Streamable HTTP nhưng áp dụng request phi trạng thái, đồng thời yêu cầu request phải mang các header `Mcp-Method` và `Mcp-Name`, nhờ đó việc xác thực, cân bằng tải và tích hợp API gateway có thể kế thừa nguyên vẹn cách vận hành của dịch vụ HTTP thông thường.

```http
POST /mcp HTTP/1.1
Authorization: Bearer xxx
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: read_file
```

Đoạn trên là HTTP header tương ứng với lời gọi `read_file` đã nêu ở phần trước, phần body sử dụng payload JSON ở trên; `Mcp-Method` khớp với tên phương thức, `Mcp-Name` khớp với tên công cụ, tham khảo [Thông báo phiên bản chính thức](https://blog.modelcontextprotocol.io/posts/2026-07-28/). Response có thể là JSON thông thường hoặc SSE stream tùy theo loại request.

Khi lựa chọn phương thức truyền tải, có thể căn cứ vào vị trí triển khai và phạm vi truy cập:

- Công cụ cục bộ, file local, cá nhân sử dụng: Ưu tiên stdio.
- Dịch vụ của team, API từ xa, phục vụ nhiều người dùng: Ưu tiên Streamable HTTP.
- Khi liên quan đến thao tác ghi và dữ liệu nhạy cảm: Dù dùng phương thức nào cũng bắt buộc phải bổ sung xác thực, giới hạn tốc độ (rate limit) và kiểm toán (audit).

![Lựa chọn phương thức truyền tải MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-transport-decision-766dfe57.png)

## Ý nghĩa của MCP có phải chỉ là giúp mô hình biết gọi API?

Function Calling vốn đã giúp mô hình có thể biểu đạt "gọi API nào". MCP giải quyết vấn đề tích hợp lặp đi lặp lại khi cùng một công cụ cần bàn giao cho nhiều Host khác nhau.

Ví dụ, hệ thống ticket nội bộ sau khi tích hợp vào một Agent, nếu muốn đổi sang một Host khác thì thông thường lại phải viết lại toàn bộ khâu kết nối, xử lý tham số và kết quả. Khi đóng gói năng lực thành MCP Server, mọi ứng dụng hỗ trợ MCP Client đều có thể tích hợp theo cùng một phương thức khám phá và gọi chuẩn hóa.

Ranh giới này tương tự như sự hợp tác giữa Frontend và Backend thông qua hợp đồng giao diện (interface contract): Lập trình Agent tập trung vào tác vụ và tương tác, còn lập trình công cụ tập trung vào hiện thực hóa năng lực, phân quyền dữ liệu và ranh giới thao tác.

Các tài liệu hướng dẫn vận hành, trực ca, bài học sự cố và script kiểm tra trong team thường nằm rải rác trong wiki hoặc kho script. Khi tổ chức các năng lực truy vấn và điều tra được ủy quyền thành Server, Agent mới có thể tìm tài liệu, đọc cấu hình hoặc chạy công cụ trong phạm vi cho phép, chứ không chỉ đưa ra một đoạn giải thích chung chung.

## Sau khi tích hợp MCP xong, có thể đưa thẳng lên Production không?

Không thể. Trong bản Demo, chuỗi "cài một Server, hỏi một câu, nhận kết quả" rất ngắn; nhưng môi trường production bắt buộc phải hoàn thiện các ràng buộc interface, kiểm toán và quản trị vận hành.

Trường thời gian dùng ISO-8601 hay epoch timestamp, đơn vị tiền tệ là đồng hay xu, giá trị phân trang mặc định là gì, tất cả đều phải ghi rõ trong Schema, mô tả trường và ví dụ. Server phải dựa vào đó để validate tham số, đồng thời trả về thông tin lỗi giúp mô hình có thể tự sửa lại request.

Một câu trả lời của Agent có thể đi qua nhiều Server và công cụ khác nhau. Trace ID, structured log và call chain cần ghi lại tham số gọi, thời gian xử lý, tóm tắt kết quả và mã lỗi để định vị bước nào đã ảnh hưởng đến câu trả lời cuối cùng.

stdio local có thể có quyền truy cập file trên máy người dùng, còn Server remote có thể kết nối vào hệ thống nội bộ. Thư mục file, bảng được phép query, có được ghi vào API production hay không, có được gửi email không đều phải được phân quyền rõ ràng. Các thao tác ghi như xóa, sửa đổi, gửi tin và gọi production cần có xác nhận bước hai, kiểm toán và phương án rollback.

`description` của Server, template Prompt và nội dung trả về cũng cần được kiểm duyệt: nội dung độc hại hoặc cẩu thả có thể mang theo prompt injection, dẫn dụ mô hình đọc thêm file hoặc gửi dữ liệu nhạy cảm ra ngoài. Nguồn gốc Server, các package phụ thuộc, phạm vi quyền hạn và lịch sử cập nhật đều thuộc diện phải thẩm định trước khi release.

Token của mô hình, truy vấn vector, API bên thứ ba và tài nguyên đám mây đều phát sinh chi phí. Mỗi lần gọi phải liên kết được với người dùng, bộ phận nghiệp vụ và công cụ; nếu không, khi chi phí tăng vọt sẽ không thể xác định chi phí bắt nguồn từ đâu.

Những thay đổi không tương thích ngược về trường dữ liệu, enum hoặc cấu trúc trả về của công cụ cũng sẽ làm thay đổi phán đoán của mô hình. Versioning ở cấp độ công cụ, triển khai canary, duy trì phiên bản cũ và kiểm thử tương thích tự động cần được duy trì song hành cùng Server.

## Doanh nghiệp trước khi áp dụng MCP cần kiểm tra những vấn đề gì?

### Schema và Versioning

- Mỗi công cụ có Schema đầu vào và đầu ra rõ ràng không?
- Đơn vị của trường dữ liệu, định dạng thời gian, giá trị enum, giá trị mặc định đã được viết rõ ràng chưa?
- Interface của công cụ có số hiệu phiên bản không?
- Các thay đổi không tương thích ngược có phương án canary và rollback không?
- Có thể thực hiện kiểm tra tự động dựa trên Schema không?

### Phân quyền và Bảo mật

- Server có thể truy cập những file, thư mục, database và API nào?
- Đã phân tách rạch ròi giữa công cụ chỉ đọc và công cụ thao tác ghi chưa?
- Thao tác rủi ro cao có cần con người xác nhận không?
- Kết quả trả về đã được khử nhạy (data redaction) chưa?
- Đã phòng chống path traversal, SQL injection, command injection chưa?
- MCP Server của bên thứ ba đã qua thẩm định mã nguồn, dependency và quyền hạn chưa?

### Khả năng quan sát (Observability)

- Mỗi request của người dùng có Trace ID không?
- Tham số gọi công cụ, thời gian thực thi, tóm tắt kết quả, mã lỗi có được ghi structured log không?
- Có thể tái hiện lại toàn bộ chuỗi gọi công cụ đằng sau một câu trả lời của Agent không?
- Đã có chiến lược timeout, rate limit, circuit breaker và retry chưa?

### Quy kết chi phí (Cost Attribution)

- Mỗi lần gọi có thể liên kết với người dùng, bộ phận nghiệp vụ, công cụ và session không?
- Chi phí Token, chi phí API, chi phí tài nguyên cloud có thể thống kê bóc tách riêng biệt không?
- Đã có hạn mức (quota) và cảnh báo ngân sách chưa?
- Khi mô hình rơi vào vòng lặp gọi công cụ, đã có giới hạn trần số lần gọi chưa?

### Quản trị phụ thuộc (Dependency Governance)

- MCP SDK, thư viện bên thứ ba, Server bên thứ ba có người bảo trì và lịch sử cập nhật không?
- Ai chịu trách nhiệm theo dõi các lỗ hổng bảo mật?
- Việc nâng cấp Server có môi trường test và chiến lược rollback không?
- Đã tránh việc đặt cược năng lực cốt lõi vào các extension bên thứ ba không có người bảo trì chưa?

Những hạng mục kiểm tra này về bản chất không khác gì các dịch vụ backend thông thường. MCP thay đổi phương thức kết nối công cụ, chứ không thay thế việc xác thực, kiểm toán, ghi log, đánh phiên bản và giới hạn tốc độ.

## Cần lưu ý những gì khi viết MCP Server?

### Đừng vội theo đuổi sự ôm đồm, quá bao quát

Một sai lầm phổ biến khi viết Server là dùng một số ít "công cụ vạn năng" để ôm đồm mọi thao tác:

```text
execute_sql(sql)
file_operation(op, path, data)
call_api(url, method, body)
```

Các interface kiểu `execute_sql`, `file_operation` đẩy toàn bộ phạm vi thao tác và quyền hạn cho mô hình tự đoán, tham số càng nhiều thì rủi ro dùng sai và vượt quyền càng lớn. Chia tách theo hành động nghiệp vụ sẽ giúp Schema, quyền hạn và quy tắc kiểm toán gắn chặt vào từng công cụ cụ thể:

```text
get_user_by_id(id)
list_active_orders(user_id)
read_file(path)
write_report(path, content)
```

Tên công cụ nên dùng cấu trúc động từ + danh từ, còn `description` nêu rõ điều kiện áp dụng, tham số bắt buộc và tình huống cấm dùng.

Ví dụ, công cụ tra cứu slow SQL ngoài việc ghi "truy vấn log slow SQL", còn phải ghi rõ: sử dụng khi phản hồi dịch vụ bị chậm, database bị timeout, CPU tăng vọt và nghi ngờ liên quan đến database; tuyệt đối không gọi khi người dùng hỏi về mạng hoặc bộ nhớ. Những ràng buộc như vậy giúp giảm thiểu tình trạng mô hình chuyển các câu hỏi tương tự tới nhầm công cụ.

### Cẩn trọng với file dung lượng lớn và văn bản dài

Log, tài liệu Markdown, HTML trang web và file CSV có thể vượt xa context window của mô hình. Interface tài nguyên nên trả về trước các thông tin: tên file, kích thước, thời gian cập nhật, bản tóm tắt và phạm vi đọc khả dụng; khi thực sự cần nội dung mới đọc theo từng chunk.

Kích thước chunk cần được xác định dựa trên ngân sách context, giới hạn kích thước response và ngân sách tài nguyên của server; tài nguyên lớn ban đầu chỉ trả về tham chiếu, tóm tắt và tùy chọn đọc, khi cần mới đọc phân đoạn, không trả về toàn văn ngay lập tức. Làm vậy vừa tránh việc một request làm tràn ngập ngữ cảnh, vừa ngăn ngừa Server ngốn quá nhiều bộ nhớ hoặc băng thông mạng do file lớn.

Đừng ràng buộc giới hạn vào tokenizer của một mô hình cụ thể. Cách tính token của các mô hình là khác nhau, Server chỉ cần dùng số ký tự hoặc số byte để kiểm soát độ mịn thô; việc cắt gọt ngữ cảnh hãy để Host hoặc ứng dụng tầng trên đảm nhiệm.

### Không thể giải quyết vấn đề an toàn bằng cách tin tưởng mô hình

Thao tác đọc file bắt buộc phải kiểm tra ranh giới thư mục sau khi đã chuẩn hóa đường dẫn (path normalization), không được để `../` vượt ra khỏi phạm vi cho phép. Truy vấn SQL bắt buộc phải dùng câu lệnh parameterized, tuyệt đối không thực thi trực tiếp chuỗi ký tự do mô hình ghép nối.

Số điện thoại, email, token, secret key và đường link nội bộ trong dữ liệu trả về cần được khử nhạy. Các thao tác ghi như xóa file, sửa database, gửi email và gọi API production mặc định phải siết chặt quyền hạn, đồng thời thiết lập xác nhận thủ công và ghi log kiểm toán.

Khi mô hình rơi vào vòng lặp, nó có thể gọi lặp lại cùng một công cụ liên tục. Giới hạn tốc độ, timeout, ngắt mạch và hạn mức phải do chính Server tự thực thi, không thể mặc định cho rằng Host chắc chắn sẽ đỡ hộ.

Chuỗi hoàn chỉnh về Prompt Injection, Token Passthrough, phân quyền cấp tài nguyên, cách ly Server local và chuỗi cung ứng Skill/MCP bên thứ ba có thể xem tiếp tại [Thực chiến bảo mật LLM/Agent](../system-design/llm-security.md).

### Ví dụ tối thiểu về MCP Server: Chạy thông suốt một công cụ trước

Sử dụng phong cách FastMCP của Python SDK để viết một weather Server đại khái như sau. Lưu ý đường dẫn import và cách khởi động bên dưới cần đối chiếu theo phiên bản SDK của dự án, ở đây chưa kiểm chứng tính tương thích với phiên bản SDK hỗ trợ `2026-07-28`:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather-server")

@mcp.tool()
def get_weather(city: str) -> str:
    """Lấy thông tin thời tiết của thành phố chỉ định"""
    return f"{city} hôm nay trời nắng, nhiệt độ 25°C"

@mcp.resource("weather://forecast")
def weather_forecast() -> str:
    """Trả về dự báo thời tiết tuần tới"""
    return "Dự báo thời tiết 7 ngày tới..."

if __name__ == "__main__":
    mcp.run()
```

Trong Claude Desktop có thể cấu hình như sau:

```json
{
  "mcpServers": {
    "weather-server": {
      "command": "uv",
      "args": ["run", "--with", "mcp", "/path/to/weather_server.py"]
    }
  }
}
```

Khi debug tại local, khuyến nghị sử dụng trực tiếp MCP Inspector:

```bash
# Python Server
npx @modelcontextprotocol/inspector uv run --with mcp /path/to/weather_server.py

# Node Server
npx @modelcontextprotocol/inspector node build/index.js
```

Nó có thể giả lập Host để gửi request. Server có kết nối được không, công cụ có được khám phá không, kiểm tra tham số có báo lỗi không, cơ bản đều có thể thấy rõ ngay tại đây.

Trong môi trường production, đừng phụ thuộc vào việc môi trường `python` global tình cờ có cài `mcp`. Dùng interpreter của virtual environment, hoặc dùng `uv run --with mcp ...` như trên để khai báo dependency rõ ràng sẽ ổn định hơn. Nếu Claude Desktop khởi động thất bại, hãy xem `mcp.log` trước, đừng vội nghi ngờ giao thức có vấn đề, phần lớn trường hợp chỉ là do cấu hình sai đường dẫn hoặc thiếu dependency.

## Dùng Inspector để kiểm chứng Server từ xa

Các ví dụ trên khởi động tiến trình local thông qua stdio. Để quan sát việc thương lượng kết nối, khám phá công cụ và thực thi trên Server từ xa, bạn có thể tiếp tục dùng [MCP Inspector](https://github.com/modelcontextprotocol/inspector), chuyển sang kết nối Streamable HTTP.

Ở đây lấy [Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) làm ví dụ. Nó cung cấp tìm kiếm web `web_search` và trích xuất nội dung trang web `web_fetch`, endpoint ẩn danh là `https://search.parallel.ai/mcp`, không cần tài khoản hay API key của Parallel (truy cập miễn phí có rate limit).

Dưới đây sử dụng Inspector 2.5.0, yêu cầu Node.js từ phiên bản 22.19.0 trở lên. Trước tiên liệt kê các công cụ từ terminal:

```bash
npx --yes @modelcontextprotocol/inspector@2.5.0 --cli \
  https://search.parallel.ai/mcp --transport http --method tools/list
```

`--transport http` chỉ định giao thức Streamable HTTP. Inspector sẽ căn cứ vào revision giao thức mà Server hỗ trợ để chọn quy trình phi trạng thái hiện đại hoặc quy trình khởi tạo tương thích cũ, sau đó gửi `tools/list`; kết quả trả về sẽ hiển thị `web_search`, `web_fetch` cùng Schema tham số của chúng. Ví dụ ẩn danh này không truyền header `Authorization`.

Tiếp theo, gọi công cụ tìm kiếm một lần để tra cứu tài liệu chính thức về Java Virtual Thread:

```bash
npx --yes @modelcontextprotocol/inspector@2.5.0 --cli \
  https://search.parallel.ai/mcp --transport http \
  --method tools/call --tool-name web_search \
  --tool-arg 'objective=Tìm tài liệu chính thức của OpenJDK về Java Virtual Threads' \
  --tool-arg 'search_queries=["OpenJDK JEP 444 virtual threads"]'
```

`objective` và `search_queries` đều là tham số bắt buộc, trong đó tham số sau là mảng JSON. Kết quả công cụ sẽ chứa URL nguồn và đoạn trích nội dung, có thể kiểm chứng câu trả lời theo các liên kết đó. Khi điều tra sự cố, cần phân biệt giữa mất kết nối, lỗi JSON-RPC và việc công cụ trả về `isError: true`; chỉ nhận được HTTP 200 không đồng nghĩa với việc công cụ đã thực thi thành công.

Khi thực hiện tìm kiếm hoặc trích xuất, từ khóa truy vấn, URL đích và mô tả mục tiêu truyền vào sẽ được gửi tới Parallel, vì vậy chỉ sử dụng những nội dung phù hợp để chuyển cho bên thứ ba xử lý. Lệnh CLI ở đây sau khi thực thi xong sẽ ngắt kết nối, không cài đặt dịch vụ lâu dài lên các Host khác; nếu sau này kích hoạt các công cụ này trong Agent, Agent cũng có thể tự động gọi tùy theo nhu cầu tác vụ, dùng xong có thể tắt hoặc xóa kết nối trong Host tương ứng.

## Ghi nhận revision giao thức khi tích hợp

MCP thống nhất cách thức khám phá và gọi giữa Host với các công cụ và nguồn dữ liệu bên ngoài, nhưng không thay thế cho việc xác thực nghiệp vụ, phân quyền dữ liệu và kiểm toán thực thi. Một Server khả dụng trong một Host cụ thể không đồng nghĩa với việc khi đổi sang Host khác vẫn sẽ hỗ trợ các năng lực tùy chọn như Sampling, Elicitation, Tasks.

Khi xây dựng Server tối thiểu, hãy cố định revision giao thức và phiên bản SDK trước, dùng Inspector để kiểm chứng việc thương lượng kết nối, khám phá năng lực, kiểm tra tham số và phản hồi lỗi. Sau khi chuẩn bị kết nối dịch vụ từ xa, mới bổ sung tiếp OAuth, rate limit, Trace, tương thích phiên bản và rollback; đối với các công cụ thao tác với file và lệnh thì bắt buộc phải thực thi kiểm tra thư mục và sandbox ở phía Server.

## Tổng kết

MCP thiết lập phương thức khám phá và gọi năng lực chuẩn hóa cho Host, Client và Server, giải quyết bài toán tích hợp công cụ và nguồn dữ liệu bên ngoài. Còn việc mô hình quyết định gọi ra sao, nghiệp vụ được điều phối thế nào, request có được cấp phép hay không vẫn lần lượt do Function Calling, Agent/Workflow và chính sách bảo mật nghiệp vụ đảm nhiệm.

Khi tích hợp, hãy xác nhận revision giao thức, SDK cùng kết quả thương lượng năng lực của Host trước, dùng Server tối thiểu để kiểm chứng kết nối, Schema và xử lý lỗi. Khi bước vào môi trường production, quyền hạn công cụ, khử nhạy dữ liệu, kiểm tra thư mục hoặc SQL, giới hạn tốc độ, kiểm toán và tương thích phiên bản đều cần được Server và Host phối hợp triển khai chặt chẽ.
