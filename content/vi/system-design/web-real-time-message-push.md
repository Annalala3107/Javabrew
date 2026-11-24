---
title: Giải thích chi tiết đẩy tin nhắn thời gian thực trên Web
description: Đẩy tin nhắn (Message Push) thường chỉ việc nhân viên vận hành hoặc hệ thống chủ động gửi thông báo tới trang web hoặc ứng dụng di động hiện tại của người dùng thông qua một công cụ nào đó.
category: Thiết kế Hệ thống
icon: "mdi:message-text-outline"
head:
  - - meta
    - name: keywords
      content: Đẩy tin nhắn Web,Tin nhắn thời gian thực,WebSocket,SSE,Long Polling,Short Polling,MQTT,Giải pháp giao tiếp thời gian thực
lang: vi
sourceRef: zh-ref/system-design/web-real-time-message-push.md
---

> Bài viết gốc: <https://juejin.cn/post/7122014462181113887>. JavaGuide đã bổ sung và tổng hợp hoàn thiện bài viết này.

Tôi có một người bạn làm một trang web nhỏ, hiện đang muốn làm tính năng đẩy tin nhắn nội bộ trên Web — đúng rồi, chính là chấm đỏ thông báo nhỏ như hình dưới đây, một tính năng rất phổ biến.

![Đẩy tin nhắn nội bộ trên Web](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192380-7cc1157c.png)

Tuy nhiên cậu ấy vẫn chưa nghĩ ra nên dùng cách nào, nên ở đây tôi tổng hợp lại vài phương án kèm cách cài đặt đơn giản để cậu ấy tham khảo.

## Đẩy tin nhắn (Message Push) là gì?

Có khá nhiều kịch bản đẩy tin nhắn, ví dụ khi có người theo dõi tài khoản công khai (Official Account) của tôi, lúc đó tôi sẽ nhận được một thông báo đẩy để thu hút tôi bấm vào mở ứng dụng.

Đẩy tin nhắn thường chỉ việc đội ngũ vận hành website hoặc hệ thống chủ động đẩy thông báo tới trang web hoặc ứng dụng di động hiện tại của người dùng thông qua một công cụ nào đó.

Đẩy tin nhắn thường được chia thành đẩy phía Web và đẩy phía Mobile.

Ví dụ đẩy tin nhắn phía Mobile:

![Ví dụ đẩy tin nhắn phía Mobile](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/IKleJ9auR1Ojdicyr0bH-afbbb01a.png)

Ví dụ đẩy tin nhắn phía Web:

![Ví dụ đẩy tin nhắn phía Web](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/image-20220819100512941-836cf383.png)

Trước khi đi vào cài đặt cụ thể, hãy cùng phân tích lại yêu cầu ban đầu. Thực ra tính năng rất đơn giản: chỉ cần kích hoạt một sự kiện nào đó (người dùng chủ động chia sẻ tài nguyên hoặc hệ thống backend chủ động đẩy tin nhắn), chấm đỏ thông báo trên trang Web sẽ cộng thêm `+1` theo thời gian thực là được.

Thông thường ở phía server sẽ có một số bảng đẩy tin nhắn để ghi nhận các loại tin nhắn được đẩy khi người dùng kích hoạt các sự kiện khác nhau; phía frontend sẽ chủ động truy vấn (kéo - pull) hoặc bị động nhận (đẩy - push) tổng số tin nhắn chưa đọc của người dùng.

![Bảng đẩy tin nhắn](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192384-64f10f85.png)

Đẩy tin nhắn thực chất chỉ xoay quanh hai hình thức là đẩy (push) và kéo (pull). Dưới đây chúng ta sẽ lần lượt tìm hiểu từng phương án.

## Các phương án đẩy tin nhắn phổ biến

![Tổng quan các phương án đẩy tin nhắn thời gian thực trên Web](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/web-real-time-message-push-overview-e042ff41.webp)

### Short Polling (Thăm dò ngắn)

**Polling (thăm dò)** có lẽ là cách đơn giản nhất để triển khai đẩy tin nhắn. Ở đây chúng ta tạm chia polling thành Short Polling và Long Polling.

Short Polling rất dễ hiểu: theo một khoảng thời gian cố định, trình duyệt gửi HTTP request lên server, server trả về ngay dữ liệu tin nhắn chưa đọc cho client, rồi trình duyệt render và hiển thị lên giao diện.

Chỉ cần một bộ đếm thời gian JS đơn giản là giải quyết được: mỗi giây gọi API lấy số tin nhắn chưa đọc một lần rồi hiển thị dữ liệu trả về.

```typescript
setInterval(() => {
  // Gửi request lấy dữ liệu
  messageCount().then((res) => {
    if (res.code === 200) {
      this.messageCount = res.data;
    }
  });
}, 1000);
```

Hiệu quả cũng chấp nhận được, cách cài đặt Short Polling tuy đơn giản nhưng nhược điểm thì quá rõ ràng: vì dữ liệu đẩy không thay đổi liên tục, nên bất kể backend lúc đó có phát sinh tin nhắn mới hay không, client vẫn gửi request đều đặn, tất yếu gây áp lực lớn lên server, lãng phí băng thông và tài nguyên máy chủ.

### Long Polling (Thăm dò dài)

Long Polling là phiên bản cải tiến của Short Polling ở trên, giúp giảm tối đa sự lãng phí tài nguyên server mà vẫn đảm bảo tính thời gian thực tương đối. Long Polling được dùng rất rộng rãi trong các middleware, ví dụ như trung tâm cấu hình Nacos, Apollo hay các Message Queue như Kafka, RocketMQ đều sử dụng Long Polling.

Trong bài viết [Mô hình tương tác của trung tâm cấu hình Nacos là push hay pull?](https://mp.weixin.qq.com/s/94ftESkDoZI9gAGflLiGwg), tôi đã giới thiệu chi tiết nguyên lý triển khai Long Polling của Nacos, bạn nào quan tâm có thể xem thêm.

Về nguyên lý, Long Polling khá giống Polling thông thường ở chỗ vẫn hoạt động theo cơ chế hỏi lặp lại. Tuy nhiên, nếu dữ liệu phía server chưa có thay đổi, server sẽ giữ nguyên (hold) request đó cho đến khi dữ liệu thay đổi hoặc hết thời gian chờ (timeout) mới trả về. Sau khi nhận được phản hồi, client lập tức gửi tiếp request Long Polling tiếp theo.

Lần này tôi áp dụng cách của trung tâm cấu hình Apollo để triển khai Long Polling thông qua lớp `DeferredResult` — một cơ chế xử lý request bất đồng bộ được Spring đóng gói dựa trên Servlet 3.0, dịch sát nghĩa là "kết quả trì hoãn".

![Sơ đồ Long Polling](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192386-bdec04a2.png)

`DeferredResult` cho phép container giải phóng trước Servlet Thread đang xử lý request hiện tại, sau đó một Thread bất kỳ do ứng dụng lựa chọn, callback tin nhắn hoặc nguồn sự kiện khác sẽ gọi `setResult()` để tiếp tục xử lý response. Bản thân `DeferredResult` không tự khởi tạo worker thread; logic nghiệp vụ thực tế chạy trên Thread nào là do ứng dụng quyết định.

Dưới đây chúng ta sẽ cài đặt đẩy tin nhắn bằng Long Polling.

Vì một ID có thể được nhiều request Long Polling cùng lắng nghe, nên tôi dùng cấu trúc `Multimap` của thư viện Guava để lưu danh sách Long Polling — một key có thể ánh xạ tới nhiều value. Khi phát hiện key thay đổi, tất cả các request Long Polling tương ứng đều sẽ trả về phản hồi. Phía frontend sau khi nhận được số phiên bản (version) mới sẽ chủ động gọi API lấy số tin nhắn chưa đọc và cập nhật dữ liệu trang.

```java
@Controller
@RequestMapping("/polling")
public class PollingController {

    // Lưu tập hợp các request long polling đang lắng nghe một ID nào đó
    // Cấu trúc đồng bộ theo Thread
    private static final Multimap<String, DeferredResult<String>> watchRequests =
            Multimaps.synchronizedMultimap(HashMultimap.create());
    // Số version lưu trong bộ nhớ để minh họa; môi trường production thường phải dùng version bền vững của chính dữ liệu nghiệp vụ
    private static final Map<String, Long> versions = new HashMap<>();

    /**
     * Đăng ký lắng nghe
     */
    @GetMapping(path = "watch/{id}")
    @ResponseBody
    public DeferredResult<String> watch(@PathVariable String id,
                                        @RequestParam(defaultValue = "0") long version) {
        // Thiết lập thời gian timeout cho đối tượng deferred
        DeferredResult<String> deferredResult = new DeferredResult<>(TIME_OUT, "timeout");
        // Khi request bất đồng bộ hoàn tất thì xóa entry để tránh rò rỉ bộ nhớ
        deferredResult.onCompletion(() -> {
            watchRequests.remove(id, deferredResult);
        });
        // So sánh version và đăng ký lắng nghe phải nằm trong cùng một vùng găng (critical section) để tránh mất thông báo nếu publish xảy ra ở giữa
        synchronized (watchRequests) {
            long currentVersion = versions.getOrDefault(id, 0L);
            if (currentVersion != version) {
                deferredResult.setResult(Long.toString(currentVersion));
            } else {
                watchRequests.put(id, deferredResult);
            }
        }
        return deferredResult;
    }

    /**
     * Thay đổi dữ liệu
     */
    @PostMapping(path = "publish/{id}")
    @ResponseBody
    public String publish(@PathVariable String id) {
        // Trong cùng một khối synchronized, cập nhật version trước rồi xóa và sao chép snapshot các watcher
        Collection<DeferredResult<String>> deferredResults;
        long currentVersion;
        synchronized (watchRequests) {
            currentVersion = versions.merge(id, 1L, Long::sum);
            deferredResults = new ArrayList<>(watchRequests.removeAll(id));
        }
        for (DeferredResult<String> deferredResult : deferredResults) {
            deferredResult.setResult(Long.toString(currentVersion));
        }
        return "success";
    }
}
```

Ở đây khi `DeferredResult` hết giờ chờ (timeout), nó trả về chuỗi quy ước `"timeout"`; phía frontend nhận được sẽ mang theo số version cũ gọi ngay lần Long Polling tiếp theo. Khi nhận được số version mới, frontend truy vấn dữ liệu nghiệp vụ mới nhất trước rồi dùng version mới đó cho lần lắng nghe kế tiếp. Việc so sánh version, đăng ký lắng nghe và tăng version khi publish đều thực hiện trong cùng một vùng găng, nên dù cập nhật xảy ra đúng lúc giao thoa giữa hai request, lần lắng nghe sau vẫn phát hiện ngay sự thay đổi version. Version lưu trong bộ nhớ ở ví dụ này sẽ mất khi tiến trình khởi động lại; môi trường production nên ưu tiên dùng version trong database, offset của tin nhắn hoặc định danh bền vững khác kèm chiến lược dọn dẹp.

Không nên dùng mã HTTP 304 làm trạng thái "hết thời gian chờ request" thông thường: 304 dành riêng cho conditional request để báo rằng bản cache hiện tại chưa bị chỉnh sửa và không được phép chứa nội dung phản hồi. Dự án production có thể quy ước dùng mã không nội dung như 204; điều quan trọng là server và client thống nhất ngữ nghĩa timeout với nhau.

Hãy thử kiểm tra: trước tiên trang web mang theo version đã biết gọi request Long Polling `/polling/watch/10086?version=0` để lắng nghe thay đổi tin nhắn, request sẽ bị treo lại; ngay sau đó ta cập nhật dữ liệu thủ công qua `/polling/publish/10086`, Long Polling sẽ trả về version mới. Frontend truy vấn dữ liệu mới nhất rồi lại mang theo version mới gửi request tiếp theo, cứ thế lặp lại vòng tuần hoàn.

Long Polling cải thiện hiệu năng rất nhiều so với Short Polling, nhưng vẫn phát sinh tương đối nhiều request — đó là điểm chưa hoàn hảo của nó.

### iframe Stream (Luồng iframe)

iframe Stream là kỹ thuật chèn một thẻ `<iframe>` ẩn vào trang web, thiết lập thuộc tính `src` gọi tới API số lượng tin nhắn để tạo ra một kết nối dài (persistent connection) giữa server và client, từ đó server liên tục truyền dữ liệu vào `iframe`.

Dữ liệu truyền xuống thường là HTML hoặc các đoạn mã JavaScript nhúng để cập nhật giao diện trang theo thời gian thực.

![Sơ đồ iframe Stream](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192388-e3aa613f.png)

Cách này cài đặt rất đơn giản, phía frontend chỉ cần một thẻ `<iframe>` là xong:

```html
<iframe src="/iframe/message" style="display:none"></iframe>
```

Phía server cần giữ response mở, ghi dữ liệu ngay khi có dữ liệu mới và flush buffer kịp thời. Tuyệt đối không dùng vòng lặp `while (true)` không có cơ chế chờ, ngắt và xử lý ngoại lệ bên trong Servlet request thread để ghi liên tục: làm vậy sẽ quay vòng ngốn CPU, chiếm giữ Thread của container lâu dài và không thể thu hồi gọn gàng khi client ngắt kết nối. Nếu bắt buộc phải bảo trì iframe Stream kiểu cũ, cần dùng I/O bất đồng bộ của container và mô hình ghi hướng sự kiện (event-driven); hệ thống mới thường chọn thẳng SSE hoặc WebSocket.

iframe Stream tiêu tốn tài nguyên server rất lớn, hơn nữa các trình duyệt như IE, Chrome sẽ luôn ở trạng thái loading, biểu tượng xoay tròn quay không ngừng — đúng là cơn ác mộng cho người mắc chứng ám ảnh cưỡng chế.

![Hiệu ứng iframe Stream](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192389-5e02d5b3.gif)

iframe Stream mang lại trải nghiệm rất tệ và cực kỳ không được khuyến khích.

### SSE (Khuyến nghị)

Có lẽ nhiều người chưa biết, ngoài cơ chế quen thuộc là `WebSocket`, server đẩy tin nhắn về client còn có một cách khác là Server-Sent Events, viết tắt là SSE. Đây là cơ chế đẩy tin nhắn một chiều từ phía server tới client (trình duyệt).

Hội thoại dạng luồng (streaming chat) là một kịch bản ứng dụng điển hình của SSE. Server có thể ghi liên tục phần nội dung đã sinh ra vào luồng sự kiện, người dùng không cần chờ toàn bộ phép tính hoàn tất mới thấy kết quả.

![ChatGPT sử dụng SSE để thực hiện hội thoại](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/chatgpt-sse-ef8972ec.png)

SSE hoạt động dựa trên HTTP. Nó không phải là việc server tự nhiên mở kết nối tới client khi không có request, mà là client chủ động gửi request trước, server giữ HTTP response đó mở và liên tục ghi các sự kiện vào đó.

![Minh họa SSE](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192390-3f01b417.png)

SSE mở một kênh truyền một chiều giữa server và client. Phản hồi từ server không còn là một gói dữ liệu trả về một lần nữa mà là luồng dữ liệu có kiểu `text/event-stream`, truyền dạng luồng từ server xuống client mỗi khi có thay đổi dữ liệu.

Ý tưởng tổng thể hơi giống việc xem video trực tuyến: luồng video được đẩy liên tục về trình duyệt, bạn cũng có thể hình dung giống như client đang hoàn tất một lượt tải xuống kéo dài (khi mạng chậm).

![Sơ đồ SSE](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192391-794f9e59.png)

SSE và WebSocket có tác dụng tương tự nhau: đều thiết lập giao tiếp giữa server và trình duyệt để đẩy tin nhắn từ server về client, nhưng vẫn có một vài khác biệt:

- SSE sử dụng HTTP và `text/event-stream`, nên thường dễ tích hợp vào các dịch vụ Web hiện có hơn; WebSocket yêu cầu server hoặc container hỗ trợ nâng cấp giao thức (protocol upgrade) và WebSocket frame. Tuy nhiên WebSocket không bắt buộc phải triển khai một máy chủ riêng biệt.
- SSE giao tiếp một chiều, chỉ truyền được từ server tới client; WebSocket giao tiếp song công toàn phần (full-duplex), hai bên có thể đồng thời gửi và nhận thông tin.
- SSE cài đặt đơn giản, chi phí phát triển thấp, không cần đưa thêm thành phần phụ trợ; WebSocket truyền dữ liệu cần đóng gói/phân tích khung dữ liệu, ngưỡng triển khai cao hơn một chút.
- SSE mặc định hỗ trợ tự động kết nối lại khi đứt kết nối; WebSocket phải tự cài đặt cơ chế này.
- SSE chỉ truyền được tin nhắn văn bản, dữ liệu nhị phân cần mã hóa trước khi truyền; WebSocket mặc định hỗ trợ truyền dữ liệu nhị phân.

![So sánh SSE và WebSocket](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/sse-vs-websocket-comparison-317207a6.webp)

**Nên chọn SSE hay WebSocket như thế nào?**

> Không có công nghệ nào tốt hay xấu tuyệt đối, chỉ có công nghệ nào phù hợp hơn.

Một phần lý do khiến SSE ít được biết đến rộng rãi là sự xuất hiện của WebSocket, giao thức cung cấp khả năng phong phú hơn cho giao tiếp hai chiều, song công toàn phần. Với game, nhắn tin tức thời (IM) và các kịch bản cần cập nhật hai chiều gần như tức thời, việc sở hữu kênh truyền hai chiều sẽ hấp dẫn hơn.

Tuy nhiên, trong nhiều trường hợp bạn không cần gửi dữ liệu từ client lên, mà chỉ cần nhận cập nhật từ các thao tác phía server. Chẳng hạn như tin nhắn nội bộ, số lượng tin chưa đọc, cập nhật trạng thái, bảng giá chứng khoán, chỉ số giám sát..., SSE chiếm ưu thế rõ rệt cả về độ dễ triển khai lẫn chi phí. Hơn nữa, SSE có sẵn nhiều tính năng mà WebSocket thiếu theo thiết kế, ví dụ: tự động kết nối lại, Event ID và khả năng gửi các sự kiện tùy biến bất kỳ.

Frontend chỉ cần gửi một HTTP request mang theo ID duy nhất, mở luồng sự kiện và lắng nghe các sự kiện do server đẩy về là xong:

```javascript
<script>
    let source = null;
    let userId = 7777
    if (window.EventSource) {
        // Thiết lập kết nối
        source = new EventSource('http://localhost:7777/sse/sub/'+userId);
        setMessageInnerHTML("Kết nối người dùng=" + userId);
        /**
         * Ngay khi kết nối được thiết lập sẽ kích hoạt sự kiện open
         * Cách viết khác: source.onopen = function (event) {}
         */
        source.addEventListener('open', function (e) {
            setMessageInnerHTML("Đã thiết lập kết nối...");
        }, false);
        /**
         * Client nhận dữ liệu do server gửi về
         * Cách viết khác: source.onmessage = function (event) {}
         */
        source.addEventListener('message', function (e) {
            setMessageInnerHTML(e.data);
        });
    } else {
        setMessageInnerHTML("Trình duyệt của bạn không hỗ trợ SSE");
    }
</script>
```

Cách triển khai phía server còn đơn giản hơn: tạo một đối tượng `SseEmitter` rồi đưa vào `sseEmitterMap` để quản lý:

```java
private static Map<String, SseEmitter> sseEmitterMap = new ConcurrentHashMap<>();

/**
 * Tạo kết nối
 */
public static SseEmitter connect(String userId) {
    try {
        // 0 nghĩa là không đặt timeout ở tầng ứng dụng, không phải "mặc định 30 giây"
        SseEmitter sseEmitter = new SseEmitter(0L);
        // Đăng ký callback
        sseEmitter.onCompletion(completionCallBack(userId));
        sseEmitter.onError(errorCallBack(userId));
        sseEmitter.onTimeout(timeoutCallBack(userId));
        sseEmitterMap.put(userId, sseEmitter);
        count.getAndIncrement();
        return sseEmitter;
    } catch (Exception e) {
        log.info("Lỗi khi tạo kết nối SSE mới, người dùng hiện tại: {}", userId);
    }
    return null;
}

/**
 * Gửi tin nhắn cho người dùng chỉ định
 */
public static void sendMessage(String userId, String message) {

    if (sseEmitterMap.containsKey(userId)) {
        try {
            sseEmitterMap.get(userId).send(message);
        } catch (IOException e) {
            log.error("Lỗi đẩy tin cho người dùng [{}]: {}", userId, e.getMessage());
            removeUser(userId);
        }
    }
}
```

Ví dụ `Map<String, SseEmitter>` ở trên chỉ giữ một kết nối cho mỗi người dùng, kết nối mới sẽ ghi đè kết nối cũ. Nếu muốn hỗ trợ nhiều tab hoặc nhiều thiết bị, cần duy trì một tập hợp các `SseEmitter` cho từng người dùng và xóa đúng kết nối tương ứng trong các callback hoàn tất, hết hạn và lỗi. Giá trị `0L` cũng không có nghĩa là proxy, gateway và container sẽ không bao giờ ngắt kết nối; môi trường production cần cấu hình heartbeat, timeout và chiến lược kết nối lại ở phía client.

**Lưu ý:** SSE không hỗ trợ trình duyệt IE, nhưng độ tương thích với các trình duyệt phổ biến khác khá tốt.

![Độ tương thích SSE](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192393-32919365.png)

### WebSocket

WebSocket hẳn là cách triển khai đẩy tin nhắn khá quen thuộc với mọi người; ở trên khi nói về SSE chúng ta cũng đã so sánh nó với WebSocket.

Đây là giao thức giao tiếp song công toàn phần (full-duplex) trên kết nối TCP, thiết lập kênh liên lạc giữa client và server. Trình duyệt và máy chủ chỉ cần bắt tay (handshake) một lần là có thể tạo kết nối bền vững và truyền dữ liệu hai chiều trực tiếp.

![Sơ đồ WebSocket](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192394-99b6e344.png)

Quy trình hoạt động của WebSocket có thể chia thành các bước sau:

1. Client gửi một HTTP request lên server, trong header chứa các trường như `Upgrade: websocket` và `Sec-WebSocket-Key`, báo hiệu yêu cầu nâng cấp giao thức lên WebSocket;
2. Khi nhận được request này, server tiến hành nâng cấp giao thức. Nếu hỗ trợ WebSocket, server sẽ phản hồi mã trạng thái HTTP 101 cùng các response header như `Connection: Upgrade` và `Sec-WebSocket-Accept: xxx`, xác nhận đã nâng cấp thành công sang giao thức WebSocket.
3. Kết nối WebSocket được thiết lập giữa client và server, cho phép truyền dữ liệu hai chiều. Dữ liệu được truyền dưới dạng các frame (khung) thay vì HTTP request/response truyền thống. Mỗi tin nhắn WebSocket có thể được chia nhỏ thành nhiều data frame (đơn vị nhỏ nhất). Bên gửi tách tin nhắn thành nhiều frame rồi gửi cho bên nhận; bên nhận thu thập các frame và ghép các frame liên quan lại thành tin nhắn hoàn chỉnh.
4. Client hoặc server có thể chủ động gửi một close frame để báo ngắt kết nối. Bên kia sau khi nhận được cũng trả lời bằng một close frame, rồi cả hai bên đóng kết nối TCP.

Ngoài ra, sau khi thiết lập kết nối WebSocket, cơ chế heartbeat sẽ được dùng để duy trì sự ổn định và trạng thái hoạt động của kết nối.

Khi tích hợp WebSocket vào Spring Boot, trước hết cần thêm thư viện hỗ trợ WebSocket; so với SSE thì cách này tốn thêm chi phí phát triển.

```xml
<!-- Thêm dependency WebSocket -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

Phía server dùng annotation `@ServerEndpoint` để đánh dấu lớp hiện tại là một WebSocket endpoint, client có thể kết nối tới server qua `ws://localhost:7777/websocket/10086`. Việc đặt `userId` trong đường dẫn chỉ phù hợp để minh họa định tuyến; môi trường production bắt buộc phải xác thực danh tính người dùng lúc handshake và gắn kết nối với chủ thể đã được xác thực, tuyệt đối không tin tưởng `userId` do client tự điền.

```java
@Component
@Slf4j
@ServerEndpoint("/websocket/{userId}")
public class WebSocketServer {
    // Session kết nối với một client cụ thể, dùng nó để gửi dữ liệu cho client
    private Session session;
    private String userId;
    private static final CopyOnWriteArraySet<WebSocketServer> webSockets = new CopyOnWriteArraySet<>();
    // Dùng để lưu số lượng kết nối đang online
    private static final Map<String, Session> sessionPool = new ConcurrentHashMap<>();
    /**
     * Phương thức được gọi khi kết nối thành công
     */
    @OnOpen
    public void onOpen(Session session, @PathParam(value = "userId") String userId) {
        try {
            this.session = session;
            this.userId = userId;
            webSockets.add(this);
            sessionPool.put(userId, session);
            log.info("Tin nhắn WebSocket: có kết nối mới, tổng số là: " + webSockets.size());
        } catch (Exception e) {
            log.error("Khởi tạo kết nối WebSocket thất bại, userId={}", userId, e);
        }
    }
    /**
     * Dọn dẹp session hiện tại khi kết nối đóng
     */
    @OnClose
    public void onClose() {
        webSockets.remove(this);
        if (userId != null && session != null) {
            sessionPool.remove(userId, session);
        }
    }
    @OnError
    public void onError(Throwable error) {
        log.error("Lỗi kết nối WebSocket, userId={}", userId, error);
    }
    /**
     * Phương thức được gọi sau khi nhận được tin nhắn từ client
     */
    @OnMessage
    public void onMessage(String message) {
        log.info("Tin nhắn WebSocket: nhận tin nhắn từ client: " + message);
    }
    /**
     * Đây là gửi tin nhắn đơn điểm (unicast)
     */
    public static boolean sendOneMessage(String userId, String message) {
        Session session = sessionPool.get(userId);
        if (session != null && session.isOpen()) {
            try {
                log.info("Tin nhắn WebSocket: tin nhắn đơn điểm: " + message);
                session.getAsyncRemote().sendText(message);
                return true;
            } catch (Exception e) {
                log.error("Gửi tin nhắn WebSocket thất bại, userId={}", userId, e);
            }
        }
        return false;
    }
}
```

Tương tự, `sessionPool` trong ví dụ này cũng chỉ giữ một kết nối cho mỗi `userId`. Khi hỗ trợ nhiều tab hoặc nhiều thiết bị, cần đổi value thành tập hợp session và thực hiện logic gửi, heartbeat, backpressure và dọn dẹp độc lập cho từng kết nối.

Nếu muốn kích hoạt một lần đẩy tin từ server thông qua HTTP API, có thể thêm một controller khớp với tham số của frontend:

```java
@RestController
@RequestMapping("/socket")
public class SocketController {

    @PostMapping("/publish")
    public ResponseEntity<Void> publish(@RequestParam String userId,
                                        @RequestParam String message) {
        return WebSocketServer.sendOneMessage(userId, message)
                ? ResponseEntity.accepted().build()
                : ResponseEntity.notFound().build();
    }
}
```

Controller này chỉ dùng để minh họa contract của request. Môi trường production còn bắt buộc phải xác thực và phân quyền cho API publish, không thể cho phép bên gọi truyền `userId` tùy ý để đẩy tin nhắn tới người dùng khác; đồng thời cần giới hạn kích thước tin nhắn và tần suất gọi request.

Trong ứng dụng Spring Boot dùng Servlet container nhúng, thông thường còn phải inject `ServerEndpointExporter`, bean này chịu trách nhiệm đăng ký các WebSocket endpoint có gắn annotation `@ServerEndpoint`.

```java
@Configuration
public class WebSocketConfiguration {

    /**
     * Dùng để đăng ký các WebSocket server sử dụng annotation @ServerEndpoint
     */
    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }
}
```

Frontend khởi tạo và mở kết nối WebSocket, lắng nghe trạng thái kết nối, nhận dữ liệu từ server hoặc gửi dữ liệu lên server.

```javascript
<script>
    var ws = new WebSocket('ws://localhost:7777/websocket/10086');
    // Lấy trạng thái kết nối
    console.log('Trạng thái kết nối ws: ' + ws.readyState);
    // Lắng nghe sự kiện kết nối thành công
    ws.onopen = function () {
        console.log('Trạng thái kết nối ws: ' + ws.readyState);
        // Kết nối thành công thì gửi một dữ liệu
        ws.send('test1');
    }
    // Lắng nghe và hiển thị thông tin server gửi về
    ws.onmessage = function (data) {
        console.log('Nhận được tin nhắn từ server:');
        console.log(data);
        // Sau khi hoàn tất giao tiếp thì đóng kết nối WebSocket
        ws.close();
    }
    // Lắng nghe sự kiện đóng kết nối
    ws.onclose = function () {
        // Theo dõi trạng thái websocket trong suốt quá trình
        console.log('Trạng thái kết nối ws: ' + ws.readyState);
    }
    // Lắng nghe và xử lý sự kiện error
    ws.onerror = function (error) {
        console.log(error);
    }
    function sendMessage() {
        var content = $("#message").val();
        $.ajax({
            url: '/socket/publish',
            type: 'POST',
            data: { "userId": "10086", "message": content },
            success: function (data) {
                console.log(data)
            }
        })
    }
</script>
```

Khi trang khởi tạo sẽ thiết lập kết nối WebSocket, sau đó có thể giao tiếp hai chiều với hiệu quả khá tốt.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192395-a414d7e2.png)

### MQTT

**Giao thức MQTT là gì?**

MQTT là một giao thức nhắn tin gọn nhẹ dựa trên mô hình xuất bản/đăng ký (publish/subscribe), nhận tin nhắn thông qua việc đăng ký (subscribe) các chủ đề (topic), được ứng dụng rộng rãi trong các kịch bản IoT. Quy chuẩn OASIS hiện tại dùng trực tiếp tên gọi "MQTT", không còn mở rộng thành "Message Queue Telemetry Transport" nữa.

Giao thức này tách biệt bên xuất bản tin nhắn (publisher) và bên đăng ký nhận tin (subscriber), nhờ đó có thể cung cấp dịch vụ nhắn tin tin cậy cho các thiết bị kết nối từ xa trong môi trường mạng không ổn định; cách sử dụng khá giống với các MQ truyền thống.

![Ví dụ giao thức MQTT](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000022986325-742b7be4.png)

MQTT nằm ở tầng ứng dụng (Application Layer) và cần chạy trên tầng truyền tải luồng byte có thứ tự, không mất mát và hai chiều. Cách truyền tải phổ biến nhất là TCP (môi trường production thường kết hợp TLS), ngoài ra cũng có thể chạy qua WebSocket hoặc các tầng truyền tải cung cấp ngữ nghĩa luồng byte tương tự, nên không nên đơn giản hóa thành "cứ có TCP/IP là dùng thẳng được".

**Tại sao lại dùng giao thức MQTT?**

Tại sao giao thức MQTT lại được ưa chuộng như vậy trong Internet vạn vật (IoT) thay vì các giao thức khác, chẳng hạn giao thức HTTP quen thuộc hơn với chúng ta?

- Mô hình request-response kết nối ngắn cổ điển của HTTP đòi hỏi thiết bị phải gửi request định kỳ hoặc duy trì kết nối dài mới nhận được cập nhật từ server; trong khi MQTT cung cấp sẵn mô hình publish/subscribe bất đồng bộ trên kết nối dài. Bản thân HTTP không thể gom chung một cách khái quát là "giao thức đồng bộ", bởi các cơ chế như HTTP/2, HTTP/3, SSE và nâng cấp WebSocket không vận hành giống Short Polling cổ điển.
- HTTP request do client khởi tạo, nhưng điều đó không có nghĩa là server mãi mãi không thể stream dữ liệu về hoặc thiết bị không thể nhận lệnh. Ưu điểm của MQTT là đã chuẩn hóa sẵn các năng lực như kết nối dài, định tuyến theo topic, đăng ký (subscription), QoS và trạng thái session.
- Khi cần gửi lệnh tới nhiều thiết bị, MQTT broker có thể phân phối tin nhắn theo topic tới toàn bộ các subscriber; HTTP cũng làm được tính năng tương tự, nhưng ứng dụng thường phải tự quản lý kết nối, nhóm thiết bị và ngữ nghĩa thử lại (retry).

Phần giới thiệu chi tiết và thực hành giao thức MQTT tôi xin không nhắc lại dài dòng ở đây, các bạn có thể tham khảo hai bài viết trước của tôi, trong đó đã viết rất kỹ rồi:

- Giới thiệu giao thức MQTT: [Không ngờ làm Smart Home với SpringBoot + RabbitMQ lại đơn giản đến vậy](https://mp.weixin.qq.com/s/udFE6k9pPetIWsa6KeErrA)
- Triển khai đẩy tin nhắn bằng MQTT: [Tin nhắn chưa đọc (chấm đỏ), thực hành đẩy tin nhắn thời gian thực giữa Frontend và RabbitMQ, cực kỳ đơn giản~](https://mp.weixin.qq.com/s/U-fUGr9i1MVa4PoVyiDFCg)

## Tổng kết

> Nội dung dưới đây do JavaGuide bổ sung

|           | Giới thiệu                                                                                                                                      | Ưu điểm                       | Nhược điểm                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| Short Polling | Client định kỳ gửi request lên server, server trả về dữ liệu phản hồi ngay (kể cả khi không có dữ liệu cập nhật).                           | Đơn giản, dễ hiểu, dễ cài đặt | Tính thời gian thực quá kém, quá nhiều request thừa, tạo kết nối liên tục gây tốn tài nguyên |
| Long Polling | Khác với Short Polling, sau khi nhận request từ client, Long Polling đợi tới khi có dữ liệu cập nhật mới trả về phản hồi.                   | Giảm được các request vô ích  | Treo request sẽ gây lãng phí tài nguyên                                                   |
| iframe Stream | Tạo một kết nối dài giữa server và client, server liên tục truyền dữ liệu vào thẻ `iframe`.                                                 | Đơn giản, dễ hiểu, dễ cài đặt | Duy trì kết nối dài làm tăng chi phí hệ thống, trải nghiệm quá tệ (biểu tượng tab xoay liên tục) |
| SSE       | Cơ chế đẩy tin nhắn một chiều từ server tới client (trình duyệt).                                                                               | Đơn giản, dễ cài đặt, nhiều tính năng | Không hỗ trợ giao tiếp hai chiều                                                          |
| WebSocket | Ngoại trừ lúc mới thiết lập kết nối dùng giao thức HTTP, các lúc khác giao tiếp trực tiếp trên TCP, hỗ trợ giao tiếp song công toàn phần giữa client và server. | Hiệu năng cao, chi phí thấp   | Đòi hỏi trình độ lập trình viên cao hơn, cài đặt tương đối phức tạp hơn                   |
| MQTT      | Giao thức truyền thông gọn nhẹ dựa trên mô hình publish/subscribe, nhận tin nhắn bằng cách đăng ký topic tương ứng.                          | Trưởng thành ổn định, gọn nhẹ | Đòi hỏi trình độ lập trình viên cao hơn, cài đặt tương đối phức tạp hơn                   |
