---
title: "Chi tiết công nghệ AI Voice: Từ ASR, TTS đến triển khai thực chiến Voice Agent thời gian thực"
description: "Làm rõ toàn bộ chuỗi kỹ thuật của hệ thống AI Voice, bao gồm thu âm, VAD, ASR, LLM, TTS, phát âm thanh streaming, xử lý ngắt lời (barge-in), tối ưu độ trễ thấp và lựa chọn kiến trúc giữa Cloud API, Model local và kết hợp Edge-Cloud."
category: "Phát triển ứng dụng AI"
tag:
  - "AI Voice"
  - "ASR"
  - "TTS"
  - "VAD"
  - "Voice Agent"
head:
  - - meta
    - name: keywords
      content: "AI Voice,ASR,TTS,VAD,Voice Agent thời gian thực,Speech to Speech,Nhận dạng giọng nói,Tổng hợp giọng nói,Kết hợp Edge-Cloud,Realtime API"
lang: vi
sourceRef: zh-ref/ai/system-design/ai-voice.md
---

Chào mọi người, mình là Tiểu G.

Khi nhiều developer lần đầu bắt tay làm ứng dụng AI Voice, chuỗi xử lý hiện lên trong đầu thường rất đơn giản: người dùng nói chuyện, chuyển thành văn bản, ném cho mô hình lớn (LLM), rồi phát âm thanh câu trả lời ra loa.

Nghe như chỉ là 3 lời gọi hàm nối tiếp: **ASR -> LLM -> TTS**.

Nhưng khi đưa lên môi trường production, hàng loạt vấn đề sẽ lập tức ập tới: người dùng chưa nói xong thì hệ thống đã vội phán đoán là kết thúc câu; người dùng muốn ngắt lời nhưng AI vẫn cứ thao thao bất tuyệt đọc tiếp; trong phòng họp có tiếng điều hòa và tiếng gõ phím thì ASR bắt đầu phiên âm loạn xạ; mạng chỉ cần hơi chập chờn một chút là luồng âm thanh tải về bị giật cục ngắt quãng; câu trả lời dạng văn bản nhìn thì chuẩn chỉnh, nhưng trải nghiệm tương tác giọng nói lại chậm chạp y như hệ thống tổng đài tự động thời xưa.

Một Agent dạng văn bản nếu chỉ gắn thêm micro và loa thì cùng lắm cũng chỉ tạo ra được một bản Demo biết nói; còn một hệ thống thực chiến chuẩn production bắt buộc phải xử lý được luồng âm thanh thời gian thực (real-time audio), các mô hình tiếng nói, máy trạng thái hội thoại (dialogue state machine) và sự phối hợp nhịp nhàng giữa Edge và Cloud (đoạn cuối thiết bị và đám mây).

Dưới đây, trước tiên chúng ta sẽ làm rõ vai trò độc lập của ASR, TTS và VAD, sau đó kết hợp với dự án thực tế interview-guide để phân tích sâu về thu thập âm thanh, truyền tải streaming, hàng đợi phát và máy trạng thái. Cuối cùng, chúng ta sẽ đánh giá xem các giải pháp Cloud API, Model chạy local và mô hình kết hợp Edge-Cloud phù hợp với những kịch bản nào.

## Chú thích thuật ngữ

Để tránh gây bối rối trong quá trình theo dõi, các thuật ngữ cốt lõi được sử dụng trong bài viết này được quy ước như sau:

- **Phía Client (Client-side / Edge)** = Client (trình duyệt / App di động), chỉ mã nguồn frontend chạy trực tiếp trên thiết bị của người dùng
- **Barge-in** = Ngắt lời / nói chen ngang, tức hành động người dùng chủ động ngắt lời khi AI đang trong quá trình phát âm thanh phản hồi
- **Kết quả tăng dần (Partial results / Streaming output)** = Đầu ra dạng streaming, chỉ kết quả nhận dạng trung gian do ASR trả về liên tục theo thời gian thực
- **Mô hình ghép tầng (Cascaded architecture)** = Kiến trúc nối chuỗi tuần tự theo từng giai đoạn độc lập: ASR + LLM + TTS
- **Native Realtime API** = Giao diện giọng nói đa phương thức thời gian thực gốc, thường có dạng âm thanh vào - âm thanh ra (audio-in, audio-out), đồng thời có thể xuất kèm các sự kiện văn bản và tool calling

## Hệ thống AI Voice thực sự giải quyết bài toán gì?

Trước hết, hãy nói rõ chúng ta đang thực sự giải quyết bài toán gì.

Một Voice Agent có bản chất gần giống như một hệ thống cộng tác thời gian thực: trong lúc người dùng đang nói, hệ thống phải đồng thời tiến hành việc thấu hiểu, sinh câu trả lời và phát âm thanh. So với hội thoại dạng văn bản thuần túy, giọng nói mang theo nhiều chiều không gian phức tạp hơn:

- **Tính thời gian thực (Real-time)**: Ngay khi người dùng cất lời, hệ thống đã phải bắt đầu hoạt động, không thể chờ người dùng nói xong hoàn toàn mới lục đục phản ứng.
- **Thông tin đa phương thức (Multimodal)**: Ngữ điệu, điểm ngắt nghỉ, cảm xúc... tất cả những thứ này đều bị rơi rụng hoàn toàn nếu chỉ chuyển thành chữ viết.
- **Khả năng ngắt lời (Barge-in)**: Con người khi giao tiếp có thể nói chen ngang lẫn nhau, máy móc cũng bắt buộc phải hỗ trợ điều này.
- **Độ trễ End-to-End**: Chat bằng văn bản mà chậm 1 giây thì người dùng vẫn kiên nhẫn đợi được, nhưng giao tiếp bằng giọng nói mà chậm 1 giây là người dùng lập tức cảm thấy đối phương "bị đơ / không phản hồi".

Các hình thức tương tác giọng nói phổ biến trên thị trường hiện nay chia làm hai nhóm chính:

1. **Trợ lý giọng nói dạng mệnh lệnh (Command-based)**: Thường thấy trên nhà thông minh và điều khiển xe hơi. Người dùng nói "bật điều hòa", hệ thống sẽ ánh xạ giọng nói sang ý định định sẵn và phát lệnh tới thiết bị. Các sản phẩm như Siri hay Xiao AI hiện cũng đang tích hợp thêm khả năng hỏi đáp mở, không thể quy chụp đơn giản chúng chỉ là các menu cố định.
2. **LLM Voice Agent**: Có khả năng thấu hiểu các câu hỏi mở, gọi Tool bên ngoài và duy trì hội thoại nhiều lượt. Khi bạn hỏi "Hãy xem giúp tôi lỗi timeout của API tuần trước là do đâu", nó cần hiểu ý định, truy xuất ngữ cảnh, sinh câu trả lời và trao đổi qua lại bằng giọng nói để xác nhận thông tin với bạn.

Trọng tâm kỹ thuật của hai nhóm sản phẩm này khác nhau một trời một vực. Phần tiếp theo của bài viết sẽ tập trung bàn về việc đưa LLM Voice Agent vào triển khai thực chiến.

## Nhận dạng giọng nói (ASR) biến âm thanh thành văn bản như thế nào?

ASR (Automatic Speech Recognition) thoạt nhìn chỉ đơn thuần là "âm thanh vào, chữ viết ra", nhưng ẩn sâu bên trong nó chứa ít nhất ba tầng phán đoán:

1. Đoạn âm thanh này phát ra những chữ/từ ngữ nào.
2. Các từ này được ngắt thành từ ghép và câu văn ra sao.
3. Dấu câu, con số, từ tiếng Anh và thuật ngữ kỹ thuật chuyên ngành được chuẩn hóa (normalize) như thế nào.

Ví dụ khi người dùng nói: "Tra giúp tôi về Virtual Thread của Java 21", ASR phải đồng thời nhận dạng được cả tiếng Việt/Hoa, tiếng Anh, con số và thuật ngữ chuyên ngành. Nếu nhận dạng phiên âm sai thành những từ vô nghĩa, thì dù LLM phía sau có thông minh đến mấy cũng phải mất công đoán mò hồi lâu.

### Ba hướng tiếp cận kỹ thuật của ASR

| Phân loại | Giải pháp tiêu biểu | Ưu điểm | Hạn chế | Kịch bản phù hợp |
| --- | --- | --- | --- | --- |
| Cloud API | OpenAI Audio Transcriptions (`gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `whisper-1`, `gpt-4o-transcribe-diarize`), Azure Speech, Google Speech, Deepgram, Alibaba Cloud ASR | Tích hợp cực nhanh, độ phủ ngôn ngữ rộng, không tốn công vận hành hạ tầng | Chi phí định kỳ cao, độ trễ mạng, rủi ro tuân thủ dữ liệu nhạy cảm | CSKH, chuyển biên bản cuộc họp, trợ lý ảo giọng nói gọn nhẹ |
| Mô hình mã nguồn mở đa dụng | Whisper, faster-whisper, Whisper.cpp, FunASR | Tự deploy on-premise, quyền kiểm soát tuyệt đối, hỗ trợ mạng nội bộ; faster-whisper tích hợp sẵn Silero VAD | Tính thời gian thực đòi hỏi tự tối ưu sâu; Whisper turbo không được train cho tác vụ dịch, dịch rất kém | Phiên âm nội bộ bảo mật, phụ đề offline, mạng intranet doanh nghiệp |
| Mô hình tùy biến theo ngành | ASR chuyên dụng cho tài chính, y tế, ô tô thông minh | Tương thích vượt trội với thuật ngữ chuyên ngành và giọng địa phương | Chi phí chuẩn bị dữ liệu và huấn luyện mô hình rất cao | Kịch bản chuyên sâu tần suất cao, bộ từ điển nghiệp vụ khắt khe |

**Thuyết minh bổ sung**:

- Model `gpt-4o-transcribe-diarize` của OpenAI hỗ trợ gắn nhãn người nói (speaker diarization), rất thích hợp cho kịch bản nhiều người như biên bản cuộc họp. Hiện tại nó chỉ áp dụng cho endpoint `/v1/audio/transcriptions` và không hỗ trợ Realtime API; khi âm thanh dài hơn 30 giây, bắt buộc phải cấu hình `chunking_strategy`; nó cũng không hỗ trợ `prompt`, `logprobs`, `timestamp_granularities[]`. Nếu không cần phân biệt người nói, hãy ưu tiên dùng `gpt-4o-transcribe`, `gpt-4o-mini-transcribe` hoặc `whisper-1`.
- Whisper turbo (large-v3-turbo) là phiên bản tối ưu tốc độ suy luận của large-v3. Nó chạy rất nhanh nhưng **không được huấn luyện cho tác vụ dịch thuật (translation)**; khi chạy `--task translate`, nó sẽ xuất ra ngôn ngữ gốc thay vì tiếng Anh. Khi có nhu cầu dịch, hãy dùng bản medium hoặc large.
- Cần phân biệt rạch ròi giữa phiên âm streaming thời gian thực và phiên âm file ghi âm offline. Tài liệu hiện tại của OpenAI đặt phiên âm streaming độ trễ thấp vào mục Realtime transcription với model `gpt-realtime-whisper`; còn tác vụ upload file và phân tách người nói thì đi qua Audio Transcriptions.

**Lời khuyên chọn giải pháp**: Nếu nhu cầu cốt lõi của bạn là "hội thoại thời gian thực", đừng chỉ nhìn chăm chăm vào chỉ số WER (Word Error Rate - tỷ lệ lỗi từ) đo offline. Bạn cần đặc biệt quan tâm tới:

- **Độ trễ ký tự đầu tiên**: Thời gian từ lúc người dùng dứt lời đến khi chữ đầu tiên xuất hiện trên màn hình
- **Độ ổn định của kết quả trung gian**: Có nhìn thấy tiến độ nhận dạng mượt mà theo thời gian thực hay không
- **Độ chính xác của phát hiện điểm dừng (Endpointing)**: Có phán đoán chính xác khoảnh khắc người dùng đã nói xong hay chưa
- **Hiệu năng trong môi trường ồn**: Khả năng lọc tạp âm khi nói từ xa hoặc có nhiều người nói cùng lúc
- **Hỗ trợ từ khóa nóng (Hotwords)**: Khả năng nhận diện chính xác các thuật ngữ nghiệp vụ đặc thù của bạn

### Phân biệt giữa ASR Streaming và ASR Non-Streaming

Với các cuộc hội thoại thời gian thực đòi hỏi độ trễ ký tự đầu cực thấp và hỗ trợ ngắt lời tự nhiên, streaming ASR là lựa chọn tiêu chuẩn; còn các kịch bản phân lượt rõ ràng, đoạn thoại ngắn thì có thể dùng non-streaming. Điểm khác biệt cốt lõi:

- **Non-streaming ASR**: Chờ người dùng nói xong trọn một câu rồi mới nạp toàn bộ vào nhận dạng. Độ trễ = Thời lượng nói + Thời gian nhận dạng.
- **Streaming ASR**: Vừa nói vừa nhận dạng song song, người dùng vừa dứt lời là kết quả gần như đã có ngay lập tức. Độ trễ ≈ Thời gian phát hiện điểm dừng + Thời gian suy luận thời gian thực.

Dự án interview-guide sử dụng **qwen3-asr-flash-realtime của Alibaba Cloud DashScope**. Hình thức này liên tục đẩy các đoạn âm thanh qua kết nối WebSocket, và cơ chế VAD phía server sẽ tự động phán đoán thời điểm hoàn tất một lượt thoại:

```java
// QwenAsrService.java
OmniRealtimeConfig config = OmniRealtimeConfig.builder()
    .modalities(Collections.singletonList(OmniRealtimeModality.TEXT))
    .enableTurnDetection(true)  // Bật VAD phía server
    .turnDetectionType("server_vad")
    .turnDetectionSilenceDurationMs(400)  // 400 ms im lặng để xác định người dùng đã nói xong
    .transcriptionConfig(transcriptionParam)
    .build();
```

Ưu điểm của Server-side VAD là phía client không cần phải tự nhúng logic phát hiện hoạt động giọng nói phức tạp; nhưng cái giá phải trả thể hiện rất rõ ngay trong tham số: `turnDetectionSilenceDurationMs(400)` nghĩa là phải xuất hiện khoảng lặng liên tục 400 ms thì hệ thống mới coi là dứt câu. Tài liệu DashScope cho phép cấu hình từ 200–6000 ms. Giá trị càng thấp thì phản hồi càng nhanh, nhưng lại càng dễ ngắt nhầm các đoạn nghỉ lấy hơi tự nhiên của người dùng; giá trị càng cao thì việc ngắt câu an toàn hơn, nhưng độ trễ sẽ tăng lên trông thấy. VAD phía client và VAD phía server hoàn toàn có thể kết hợp với nhau: khi cần ngắt lời siêu nhạy, client có thể báo trước sự kiện `speech_start`, còn server sẽ dựa vào sự kiện ASR và VAD để chốt kết thúc lượt; khi client cần gọn nhẹ hoặc mạng ổn định, chỉ cần dùng cơ chế ngắt câu phía server là đủ.

## Tổng hợp giọng nói (TTS) biến chữ viết thành âm thanh như thế nào?

TTS (Text To Speech) chịu trách nhiệm tổng hợp câu trả lời dạng văn bản của mô hình thành luồng âm thanh. Thoạt nhìn đây chỉ là tầng output cuối cùng, nhưng thực tế nó lại chi phối cực lớn cảm nhận trực tiếp của người dùng về sự thông minh của toàn bộ Agent.

Cùng một câu "Để tôi kiểm tra giúp bạn", sự khác biệt giữa các bộ engine TTS có thể bộc lộ qua:

- Phải chờ bao lâu mới nhận được gói âm thanh đầu tiên (first chunk)
- Âm sắc có tự nhiên không, câu dài có biết ngắt nghỉ lấy hơi như người thật không
- Các con số, đoạn mã code, chữ viết tắt tiếng Anh đọc có chuẩn xác không
- Có hỗ trợ điều khiển cảm xúc, tốc độ nói, khoảng lặng ngắt nghỉ và cao độ hay không

### Quá trình tiến hóa kỹ thuật của TTS

Pipeline TTS truyền thống phải trải qua rất nhiều công đoạn thủ công:

```
Chuẩn hóa văn bản -> Phân tích ngôn ngữ -> Mô hình âm học -> Vocoder -> Xuất dạng sóng âm
```

Các mô hình Neural TTS, Neural Audio Codec và mô hình tạo giọng nói dạng sinh (Generative Voice Models) đang ngày càng tinh giản các module thủ công trong đường ống truyền thống. VALL-E, Fish Speech, CosyVoice sử dụng các phương pháp mô hình hóa khác nhau, và chất lượng âm thanh, độ trễ, khả năng streaming cùng chi phí triển khai không thể chỉ đem ra so sánh dựa trên mỗi tiêu chí "end-to-end". Đối với Voice Agent thời gian thực, ngoài chất lượng giọng đọc của từng câu đơn lẻ, bạn còn phải đặc biệt soi xét độ trễ gói đầu tiên, khả năng phát dạng streaming và cơ chế xử lý trạng thái khi bị người dùng ngắt lời.

Nếu hệ thống bắt buộc phải chờ LLM sinh xong toàn bộ đoạn văn bản dài ngoằng rồi mới bắt đầu tổng hợp âm thanh, người dùng sẽ cảm thấy hệ thống cực kỳ chậm chạp. Nếu có thể tổng hợp streaming theo từng câu ngắn, thậm chí theo từng cụm token, thì trải nghiệm nhận được gói âm thanh đầu tiên sẽ mượt mà hơn rất nhiều.

### Hai trường phái TTS thời gian thực

| Phân loại | Giải pháp tiêu biểu | Đặc điểm nổi bật |
| --- | --- | --- |
| Cloud Real-time TTS | OpenAI Speech, Alibaba Cloud qwen3-tts-flash-realtime / Qwen-TTS-Realtime, Azure TTS, ElevenLabs | Đầu ra dạng streaming, hỗ trợ tổng hợp âm thanh thời gian thực độ trễ thấp |
| Local TTS | piper1-gpl (GPL-3.0, bản Piper gốc đã lưu trữ), Fish Speech (Fish Audio Research License), CosyVoice | Khả năng kiểm soát cao, chạy offline; trước khi dùng thương mại cần soi kỹ license của code, model weights và tài nguyên giọng đọc |

Dự án interview-guide cũng sử dụng giải pháp TTS thời gian thực của Alibaba Cloud, tổng hợp âm thanh qua kết nối WebSocket. Trong các ví dụ Java SDK hiện hành của DashScope, tên mô hình được khuyến nghị là `qwen3-tts-flash-realtime`, còn class đóng gói trong dự án vẫn giữ tên là `QwenTtsRealtime`:

```java
// QwenTtsService.java
QwenTtsRealtimeConfig config = QwenTtsRealtimeConfig.builder()
    .voice(voice)  // Lựa chọn giọng đọc
    .responseFormat(QwenTtsRealtimeAudioFormat.PCM_24000HZ_MONO_16BIT)
    .mode("commit")  // Chế độ commit
    .languageType(languageType)
    .speechRate(speechRate)
    .volume(volume)
    .build();

// Gửi văn bản, nhận các chunk âm thanh theo thời gian thực
qwenTtsRealtime.appendText(text);
qwenTtsRealtime.commit();
```

Đoạn mã trên sử dụng chế độ `commit`, nghĩa là phía client sau khi đẩy thêm văn bản sẽ chủ động gọi `commit()` để kích hoạt việc tổng hợp. Tài liệu DashScope còn cung cấp thêm chế độ `server_commit`, trong đó server sẽ tự quyết định thời điểm commit, tạo ra sự đánh đổi khác biệt giữa độ trễ và độ trọn vẹn ngữ nghĩa của câu.

## VAD kiểm soát lượt đối thoại như thế nào?

VAD (Voice Activity Detection - Phát hiện hoạt động giọng nói) là thành phần thường bị xem nhẹ, nhưng nó lại mang tính quyết định sống còn tới trải nghiệm tương tác.

VAD hoàn toàn không nhận dạng nội dung lời nói, nó chỉ tính toán xác suất có tiếng người trong một lát cắt âm thanh cực ngắn, hoặc bắn ra các sự kiện bắt đầu/kết thúc giọng nói. Ứng dụng dựa vào các tín hiệu này để nhận biết:

- Người dùng đã bắt đầu nói hay chưa?
- Người dùng đã nói xong chưa?
- Hoạt động giọng nói hiện tại có đủ độ tin cậy để kích hoạt việc ngắt lời hoặc submit lượt thoại hay không.

VAD thông thường không thể tự mình phân biệt âm thanh phát ra là từ người dùng, người đứng bên cạnh, tiếng nhạc hay tiếng vọng từ chính loa ngoài của thiết bị. Tiếng vọng do hệ thống phát ra cần phải được triệt tiêu qua bộ AEC hoặc tín hiệu tham chiếu phát lại; kịch bản đông người còn cần thêm cơ chế tách người nói (diarization), nhận dạng vân giọng (voiceprint) hoặc Target-speaker VAD. Thói quen nói chuyện ngoài đời thực của con người cũng làm tăng độ khó cho việc bắt điểm dừng:

- Thường xuyên ngập ngừng giữa câu: "Vấn đề này... tôi muốn hỏi một chút..."
- Đệm các từ phản hồi rất ngắn: "Ừm", "Đúng", "Không phải"
- Vừa nghĩ vừa nói, âm lượng lúc to lúc nhỏ
- Xung quanh có tiếng người khác nói chen vào, hoặc loa ngoài đang phát tiếng của chính AI

**Nên chọn VAD phía Client hay VAD phía Server?**

| Phân loại | Giải pháp tiêu biểu | Ưu điểm | Hạn chế |
| --- | --- | --- | --- |
| VAD phía Client | WebRTC VAD, Silero VAD, @ricky0123/vad-web | Phản hồi siêu nhanh, không tốn tài nguyên server | Phải nhúng model lên client, ngưỡng kích hoạt và kịch bản ồn phải tự tinh chỉnh |
| VAD phía Server | DashScope ASR server_vad, OpenAI Realtime turn detection, VAD tích hợp trong Cloud ASR | Logic client cực kỳ đơn giản, tích hợp chặt chẽ với dịch vụ nhận dạng | Tăng tải cho server, chịu độ trễ mạng, chính sách ngắt câu bị phụ thuộc API nhà cung cấp |

> ⚠️ **Đừng chỉ đánh giá VAD qua độ chính xác offline**: Các đoạn âm thanh cực ngắn (<1 giây, như "Ừ", "Đúng", "Không"), tiếng nói chen âm lượng nhỏ, tiếng người từ xa, tiếng vọng từ loa... đều sẽ khiến hiệu năng thực tế trên production tụt dốc thảm hại so với tập thử nghiệm. Tài liệu README của faster-whisper cũng lưu ý rằng cấu hình mặc định của Silero VAD khá bảo thủ: mặc định chỉ loại bỏ khoảng lặng dài hơn 2 giây. Trong một Voice Agent, nếu chỉ dựa duy nhất vào VAD làm căn cứ ngắt lời, bạn sẽ rất dễ bỏ lọt các phản hồi ngắn của người dùng.

Frontend của interview-guide sử dụng thư viện **@ricky0123/vad-web**, một giải pháp VAD phía client chạy trên nền ONNX runtime:

```typescript
// AudioRecorder.tsx
const vadInstance = await window.vad.MicVAD.new({
  getStream: async () => stream,
  onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
  baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
  onSpeechStart: () => {
    onSpeechStart?.(); // Người dùng bắt đầu nói
  },
  onSpeechEnd: () => {
    onSpeechEnd?.(); // Người dùng nói xong
  },
});
```

Khi VAD phía client bắn sự kiện `onSpeechEnd`, tuyệt đối không nên submit ngay lập tức một cách mù quáng. Bạn nên đệm thêm một khoảng thời gian xác nhận im lặng (silence confirmation) có thể cấu hình được, hoặc kết hợp với sự kiện phiên âm cuối cùng từ server để tránh việc coi một thoáng ngập ngừng của người dùng là đã kết thúc câu. Khoảng thời gian xác nhận này cần được tinh chỉnh dựa trên mẫu dữ liệu thực tế theo từng ngôn ngữ, nhịp điệu giao tiếp và mục tiêu độ trễ, không nên coi 300–500 ms là ngưỡng thần thánh cho mọi trường hợp.

Lời khuyên của mình là: **Đừng coi VAD như một chiếc công tắc bật/tắt nhị phân, hãy xem nó là bộ phát tín hiệu điều khiển hội thoại**, ví dụ:

- `speech_start`: Người dùng bắt đầu nói
- `speech_end`: Phát hiện kết thúc hoạt động giọng nói (có thể kèm điểm tin cậy)
- `maybe_barge_in`: Có khả năng người dùng đang muốn ngắt lời
- `non_speech`: Phân đoạn âm thanh hiện tại không phát hiện tiếng người

## Một vòng hội thoại giọng nói hoàn chỉnh vận hành như thế nào?

Hãy đặt toàn bộ chuỗi xử lý lên một bức tranh tổng thể, khi đó các vấn đề về độ trễ, ngắt lời và phối hợp Edge-Cloud mới trở nên sáng tỏ.

Một lượt tương tác của Voice Agent thông thường sẽ trải qua các bước sau:

1. Thu âm: Micro thu tín hiệu âm thanh thô ban đầu
2. Tiền xử lý (Preprocessing): AEC khử tiếng vang, NS triệt tiêu tiếng ồn, AGC tự động bù âm lượng
3. Phát hiện VAD: Xác định người dùng có đang nói không và đã nói xong chưa
4. Upload âm thanh: Đẩy dữ liệu âm thanh đã qua xử lý lên server
5. Phiên âm ASR: Chuyển âm thanh thành văn bản (trả về kết quả trung gian dạng streaming)
6. Dựng ngữ cảnh (Context Assembly): Ghép System Prompt, lịch sử hội thoại và định nghĩa Tool
7. Suy luận LLM: Thấu hiểu ý định, sinh câu trả lời, gọi Tool khi cần thiết
8. Tổng hợp TTS: Biến văn bản câu trả lời thành âm thanh (xuất các chunk âm thanh dạng streaming)
9. Tải xuống âm thanh: Phía client vừa nhận chunk vừa phát ra loa lập tức
10. Đồng bộ trạng thái: Ghi nhận lượt đối thoại này để chuẩn bị ngữ cảnh cho lượt tiếp theo

Trong chuỗi âm thanh thời gian thực, một phần công việc hoàn toàn có thể được kích hoạt chạy trước khi người dùng dứt lời.

Một hệ thống xuất sắc sẽ tìm mọi cách làm trước những việc có thể làm trước:

- Ngay khi người dùng vừa cất lời, hãy tải sẵn trạng thái session và danh sách Tool vào bộ nhớ
- Khi ASR vừa xuất hiện tiền tố văn bản ổn định, hãy dự đoán trước ý định sơ bộ
- Khi LLM vừa nhả ra câu ngắn trọn vẹn đầu tiên, TTS lập tức tiến hành tổng hợp ngay
- Nếu việc gọi Tool mất nhiều thời gian, hãy phát trước một câu thoại đệm tự nhiên ("Đợi tôi kiểm tra một chút nhé...")

Bí quyết rất trực diện: Kích hoạt chạy trước các khâu có thể chạy song song, và dùng cơ chế streaming để bẻ vụn thời gian chờ đợi.

## Tại sao hội thoại giọng nói thời gian thực lại khó hơn chat văn bản rất nhiều?

Độ khó của tương tác giọng nói không nằm ở một mô hình AI đơn lẻ nào, mà nằm ở việc toàn bộ chuỗi mắt xích đều bị bóp nghẹt bởi chiếc vòng kim cô mang tên "thời gian thực".

### Thử thách 1: Quỹ thời gian (Latency Budget) cực kỳ eo hẹp

Chat bằng văn bản mà chậm 1 giây thì người dùng vẫn thấy bình thường. Nhưng nói chuyện bằng giọng nói mà trễ 1 giây thì người dùng sẽ lập tức cảm nhận rõ rệt đối phương "không phản ứng".

Độ trễ của một lượt giao tiếp giọng nói tích tụ qua từng mắt xích sau:

| Mắt xích | Thời gian tiêu tốn điển hình | Hướng tối ưu |
| --- | --- | --- |
| Thu âm & Mã hóa | Kích thước frame âm thanh, bộ đệm trình duyệt | Thu thập frame nhỏ, cắt giảm buffer thừa thãi |
| Bắt điểm dừng VAD | Chờ khoảng lặng để chốt người dùng đã nói xong | Ngưỡng im lặng động, submit thần tốc với câu ngắn |
| ASR | Upload audio, giải mã, ổn định kết quả streaming | Streaming ASR, từ khóa nóng (hotwords), tiền xử lý tại client |
| LLM | Độ trễ token đầu (TTFT), gọi Tool, ngữ cảnh quá dài | Prompt caching, câu trả lời súc tích, gọi Tool bất đồng bộ |
| TTS | Tổng hợp gói đầu, cắt câu dài, vocoder suy luận | Tổng hợp streaming cấp độ câu, làm ấm trước model giọng |
| Phát âm thanh | Rung pha mạng (jitter), giải mã, buffer player | Vừa nhận vừa phát, kiểm soát chặt chẽ hàng đợi phát |

Nếu mỗi mắt xích chỉ cần dây dưa thêm 200 ms, toàn bộ lượt hội thoại sẽ lập tức biến thành một trải nghiệm "chậm chạp nửa nhịp".

Do đó, việc tối ưu hệ thống voice thời gian thực bắt buộc phải dán mắt vào độ trễ P95/P99 end-to-end của toàn chuỗi, chứ không phải chỉ cố ép một component đơn lẻ đạt đỉnh lý thuyết. Người dùng cảm nhận toàn bộ đường ống, chứ không ngồi chấm điểm benchmark của riêng một model nào.

### Thử thách 2: Xử lý ngắt lời (Barge-in) không phải là bấm nút tạm dừng

Một Voice Agent bắt buộc phải hỗ trợ cơ chế **Barge-in (nói chen ngang ngắt lời)**.

Khi người dùng thốt lên "Khoan đã, ý tôi không phải thế", hệ thống cần phải đồng thời thực hiện một loạt thao tác:

1. Nhận diện chuẩn xác đây là tiếng người dùng đang nói, chứ không phải tạp âm nền hay tiếng vang từ loa
2. Ngay lập tức chặn đứng hàng đợi phát âm thanh tại local, không được tiếp tục phát nốt câu trả lời cũ
3. Hủy bỏ (cancel) các luồng LLM và TTS đang tiếp tục sinh dở dang trên server
4. Ghi nhận chuẩn xác vào trạng thái hội thoại: phần nào đã phát ra tai người dùng, phần nào chưa phát, và câu nói bị ngắt ở đâu
5. Dùng đoạn âm thanh mới của người dùng để mở ra lượt thấu hiểu tiếp theo

Nhiều hệ thống thất bại ở khâu ngắt lời không hẳn do VAD bắt sai, mà thường do máy trạng thái (state machine) chưa định nghĩa rành mạch ngữ nghĩa của việc hủy (cancellation). Ví dụ: loa đã dừng phát, nhưng server vẫn cắm đầu stream tiếp âm thanh TTS; hoặc LLM đã dừng, nhưng trong lịch sử hội thoại lại trót ghi nhận toàn bộ câu trả lời chưa kịp phát thành "đã nói".

Cách làm trong dự án interview-guide:

```typescript
// VoiceInterviewPage.tsx
const handleAudioData = (audioData: string) => {
  // Khi AI đang phát âm thanh thì tạm dừng gửi mic, tránh thu nhầm giọng của chính mình
  if (isAiSpeakingRef.current) {
    return;
  }
  if (wsRef.current && wsRef.current.isConnected()) {
    wsRef.current.sendAudio(audioData);
  }
};
```

Frontend dùng biến `isAiSpeakingRef` để đánh dấu AI có đang nói hay không, nếu đang nói thì ngắt đường gửi âm thanh. Phía backend khi nhận được message `control` sẽ tiến hành hủy việc sinh câu trả lời.

### Thử thách 3: Môi trường tạp âm thực tế khắc nghiệt hơn phòng lab rất nhiều

Bản demo giọng nói thường chạy trong phòng làm việc yên tĩnh, nhưng môi trường production thực tế có thể là:

- Trong cabin ô tô, nhà xưởng ầm ĩ, trung tâm thương mại, ga tàu điện ngầm
- Micro thu từ khoảng cách xa 2–3 mét
- Nhiều người xung quanh cùng nói chuyện một lúc
- Người dùng bật loa ngoài âm lượng lớn, tiếng của AI lại lọt ngược trở lại vào micro

Điều này sẽ hủy hoại toàn bộ chuỗi xử lý:

- VAD nhận nhầm tiếng ồn thành tiếng người, dẫn đến kích hoạt bậy
- ASR phiên âm tiếng người lạ xung quanh thành chữ, làm ô nhiễm ý định của người dùng
- Âm thanh TTS phát ra bị micro thu lại, dẫn đến tình trạng AI tự ngắt lời chính mình

Frontend của interview-guide đã bật 3 tùy chọn tiền xử lý âm thanh cơ bản thông qua hàm `getUserMedia`:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true, // AEC: Khử tiếng vang từ loa ngoài
    noiseSuppression: true, // NS: Triệt tiêu tạp âm môi trường
    autoGainControl: true, // AGC: Tự động điều chỉnh âm lượng ổn định
    sampleRate: 16000,
  },
});
```

Ba tham số này giải quyết được một phần vấn đề, nhưng đừng ảo tưởng chúng sẽ bao bọc được mọi trường hợp. Trình duyệt chỉ nhận các ràng buộc này và cố gắng đáp ứng tốt nhất có thể, hiệu quả thực tế phụ thuộc rất nhiều vào loại trình duyệt, phần cứng, micro và môi trường phát; AEC xử lý rất chật vật khi loa ngoài bật quá to, còn NS có thể vô tình gọt mất một phần giọng thật của người dùng. Nếu bạn làm giải pháp phần cứng chuyên dụng hoặc App mobile native, khâu tiền xử lý âm thanh phía client sẽ là một khoản đầu tư kỹ thuật cực kỳ tốn công sức.

### Thử thách 4: Ngữ cảnh không chỉ đơn thuần là lịch sử văn bản

Ngữ cảnh của một text Agent chủ yếu là lịch sử tin nhắn. Nhưng ngữ cảnh của một Voice Agent thì phong phú hơn rất nhiều:

- Hiện tại người dùng có đang nói hay không
- Câu trả lời trước đó đã phát ra loa đến đoạn nào rồi
- Người dùng đang hỏi câu mới bình thường hay đang cố tình ngắt lời câu cũ
- Văn bản streaming trả về từ ASR đã ổn định hay vẫn đang nhảy chữ
- Ngữ điệu người dùng thể hiện sự nghi vấn, phủ định, ngập ngừng hay mất kiên nhẫn
- Hiện tại có lời gọi Tool nào đang chạy dở dang hay không

Nếu chỉ vứt mỗi đoạn text ASR cuối cùng cho LLM, rất nhiều thông tin sống còn sẽ bị bốc hơi.

Ví dụ người dùng nói: "Không phải... ý tôi là đơn hàng tháng trước cơ", trên mặt chữ ta thấy câu đính chính, nhưng không thể biết họ vừa ngắt lời AI ở câu nào; nếu hệ thống không biết câu trả lời trước đã phát tới đâu, nó sẽ rất khó đoán xem người dùng đang phủ định mệnh đề nào.

interview-guide phân định các trạng thái này bằng các loại message WebSocket khác nhau:

```typescript
// voiceInterview.ts
export interface WebSocketSubtitleMessage {
  type: "subtitle";
  text: string;
  isFinal: boolean; // true chỉ biểu thị đoạn ASR này đã kết thúc hoặc đã ổn định
}

export interface WebSocketAudioResponseMessage {
  type: "audio";
  data: string; // Âm thanh mã hóa Base64
  text: string; // Văn bản chữ tương ứng
}

export interface WebSocketControlMessage {
  type: "control";
  action: string; // 'submit' | 'cancel' | 'pause'
  data?: Record<string, unknown>;
}
```

Cờ `isFinal` chỉ là trạng thái của sự kiện ASR, hoàn toàn không đồng nghĩa với việc người dùng đã bấm nút hoặc nói câu lệnh "submit". Nếu sản phẩm dùng cơ chế submit thủ công, lượt thoại phải được xác nhận bằng sự kiện `control: submit` độc lập; còn ở chế độ tự động ngắt lượt, việc submit phải do bộ phát hiện điểm dừng, sự kiện ASR hoàn tất và trạng thái nghiệp vụ cùng phối hợp quyết định, tuyệt đối không được dùng một biến boolean đơn lẻ để gánh vác cả hai tầng ý nghĩa.

### Thử thách 5: Tự ngắt lời do tiếng vọng từ loa ngoài

Âm thanh do chính AI phát ra nếu bị micro thu ngược trở lại, VAD hoặc ASR có thể nhận nhầm đó là người dùng đang nói, dẫn đến việc AI tự ngắt lời chính nó.

Cách xử lý hiện tại của interview-guide:

```typescript
if (isAiSpeakingRef.current) {
  return; // Khi AI đang nói thì âm thầm vứt bỏ âm thanh micro
}
```

Giải pháp "âm thầm vứt bỏ" này triệt tiêu được hiện tượng tự ngắt lời, nhưng nó cũng thẳng tay bóp chết luôn khả năng người dùng muốn nói chen ngang trong lúc AI đang nói.

Một giải pháp tinh tế hơn thường được triển khai theo hướng:

- Khi AI đang nói, micro vẫn tiếp tục thu âm, nhưng tạm thời không đẩy sang ASR
- Chạy VAD phía client trên luồng âm thanh đã qua xử lý AEC, chứ không chạy trên luồng micro thô ban đầu
- Kết hợp tín hiệu tham chiếu tiếng vọng, năng lượng các frame liên tiếp, độ tin cậy VAD và trạng thái hàng đợi phát để xác định xem có đúng là người dùng đang thực sự ngắt lời hay không

### Thử thách 6: Năng lực của Client quyết định giới hạn dưới của trải nghiệm

Nhiều đội ngũ dồn toàn bộ xử lý lên đám mây, kết quả là khi gặp mạng chập chờn, trải nghiệm người dùng sụp đổ ngay tắp lự.

Phía client tối thiểu phải gánh vác các trách nhiệm sau:

- Thu âm từ micro và tiền xử lý âm thanh cơ bản
- Chạy VAD hoặc bộ phát hiện ngắt lời gọn nhẹ
- Quản lý bộ đệm phát âm thanh và lệnh hủy phát lập tức
- Bắn thông báo khi mất kết nối mạng và cơ chế tự động kết nối lại

Mô hình đám mây quyết định giới hạn trên (trần nhà), còn kỹ thuật phía client quyết định giới hạn dưới (sàn nhà). Đạo lý này trong hệ thống giọng nói là chuẩn xác đến từng centimet.

## Nhìn từ interview-guide: Bản Voice Agent cơ bản được hiện thực hóa thế nào?

Dưới đây, chúng ta sẽ lấy dự án interview-guide làm ví dụ thực tế để xem một Voice Agent phỏng vấn cơ bản vận hành như thế nào.

### Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  AudioRecorder        WebSocket         VoiceInterviewPage   │
│  - getUserMedia       - sendAudio       - Quản lý state      │
│  - AudioWorklet       - sendControl     - Submit thủ công    │
│  - Nhận diện VAD      - Control message - Phát theo chunk    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Spring Boot)                   │
├─────────────────────────────────────────────────────────────┤
│  VoiceInterviewWebSocketHandler                             │
│  - Quản lý session (tạo mới, tạm dừng, khôi phục, kết thúc) │
│  - Đồng bộ trạng thái ASR ready / reconnect                  │
│  - Định tuyến audio đến ASR, kích hoạt LLM sau submit       │
│  - Stream câu từ LLM, vừa tổng hợp vừa đẩy TTS               │
├─────────────────────────────────────────────────────────────┤
│  QwenAsrService          DashscopeLlmService      QwenTtsService │
│  - qwen3-asr-flash-      - qwen-max / qwen-plus   - qwen-tts-    │
│    realtime              - Hỗ trợ Tool calling    realtime       │
└─────────────────────────────────────────────────────────────┘
```

### Phía Frontend: Thu âm và VAD

Trọng tâm của frontend nằm ở component `AudioRecorder`. Nó thực hiện các bước sau:

**Bước 1: Xin quyền micro và cấu hình tham số âm thanh:**

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000, // ASR yêu cầu chuẩn 16 kHz
  },
});
```

**Bước 2: Khởi tạo VAD phía client:**

```typescript
const vadInstance = await window.vad.MicVAD.new({
  getStream: async () => stream,
  onSpeechStart: () => {
    onSpeechStart?.(); // Kích hoạt callback khi bắt đầu nói
  },
  onSpeechEnd: () => {
    onSpeechEnd?.();
  },
});
await vadInstance.start();
```

**Bước 3: Dùng AudioWorklet để thu âm thanh phân mảnh:**

Sự kiện `onSpeechEnd` của VAD chỉ báo hiệu hoạt động giọng nói có thể đã kết thúc, còn các khối âm thanh thực tế vẫn phải được liên tục phân mảnh gửi lên server. interview-guide triển khai như sau:

```typescript
await audioContext.audioWorklet.addModule("/audio-worklet/pcm-processor.js");

const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
workletNode.port.onmessage = (event) => {
  if (!recordingActiveRef.current) {
    return;
  }
  const base64 = arrayBufferToBase64(event.data as ArrayBuffer);
  onAudioData(base64); // Đoạn 200 ms Int16 PCM, gửi lên ASR phía backend
};

source.connect(workletNode);
workletNode.connect(gainNode);
gainNode.connect(audioContext.destination);
```

File `pcm-processor.js` chạy trên một luồng render âm thanh riêng biệt của trình duyệt, chịu trách nhiệm chuyển đổi (resample) âm thanh Float32 đầu vào thành định dạng 16 kHz, Int16 PCM, rồi đóng gói thành từng khối 200 ms gửi về luồng chính qua `postMessage`. So với `ScriptProcessorNode` cũ kỹ đã bị deprecated, `AudioWorkletNode` không gây nghẽn luồng UI chính, giúp giảm thiểu tối đa hiện tượng giật lag và trễ âm.

Ở đây xuất hiện một câu hỏi thiết kế: **Tại sao không chờ VAD bắn sự kiện `onSpeechEnd` rồi mới bắt đầu gửi âm thanh?**

Bởi vì việc phát hiện VAD luôn có độ trễ xác nhận; nếu chờ nó khẳng định người dùng đã nói xong mới lục đục upload âm thanh thì hệ thống sẽ phải chịu thêm một khoảng trễ vô nghĩa. Cách làm chuẩn mực là liên tục gửi từng chunk âm thanh lên server, còn sự kiện `onSpeechEnd` của VAD chỉ đóng vai trò báo hiệu cho backend: "Đoạn thoại này khả năng đã hết, chuẩn bị nạp vào cho LLM xử lý đi".

Tuy nhiên, trong kịch bản phỏng vấn thử việc của interview-guide, hệ thống không áp dụng cơ chế "hễ thấy im lặng là tự động submit". Thay vào đó, nó chọn cách **ASR liên tục hiển thị chữ, còn người dùng chủ động bấm nút submit bằng tay**. Cách này giúp tránh việc ứng viên đang ngập ngừng suy nghĩ thì hệ thống đã nhanh nhảu cướp lời, đồng thời giải quyết triệt để vấn đề "câu nói sau đè bẹp câu nói trước": frontend chỉ coi kết quả ASR là bản nháp, còn việc chuyển sang câu hỏi phỏng vấn tiếp theo hoàn toàn do message điều khiển `submit` quyết định.

### Phía Frontend: Phát âm thanh

interview-guide áp dụng 2 chế độ phát âm thanh:

**Chế độ 1: Dùng thẻ HTMLAudioElement (Kịch bản đơn giản):**

```typescript
// VoiceInterviewPage.tsx
const onAudioResponse = (audioData: string, text: string) => {
  if (audioData && audioData.length > 0) {
    setAiAudio(audioData); // Gán src, kích hoạt tự động phát
    setAiText(text);
    setAiSpeaking(true);

    // Đặt watchdog chống treo nếu việc phát âm thanh gặp sự cố bất thường
    const durationMs = estimateWavDurationMs(audioData);
    audioPlaybackWatchdogRef.current = setTimeout(
      finishAiPlayback,
      Math.min(Math.max(durationMs + 1500, 4000), 60_000),
    );
  }
};
```

**Chế độ 2: Dùng AudioContext phát theo từng chunk (Kiểm soát chi tiết):**

```typescript
// Xử lý từng chunk âm thanh
const handleAudioChunk = (
  base64Wav: string,
  _index: number,
  isLast: boolean,
) => {
  // 1. Giải mã chuỗi WAV
  const binaryStr = atob(base64Wav);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  // Xử lý header WAV 44 byte chuẩn định dạng 24 kHz, Mono, 16-bit PCM.
  // Nếu server có thể trả về các định dạng WAV khác, cần parse header động.
  const pcmOffset = 44;
  const pcmData = new Int16Array(
    bytes.buffer,
    pcmOffset,
    (bytes.length - pcmOffset) / 2,
  );
  const float32 = new Float32Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    float32[i] = pcmData[i] / 32768;
  }

  const audioBuffer = ctx.createBuffer(1, float32.length, 24_000);
  audioBuffer.copyToChannel(float32, 0);

  // 2. Đưa vào hàng đợi phát
  chunkQueueRef.current.push(audioBuffer);
  if (!isChunkPlayingRef.current) {
    playNextChunk();
  }

  // 3. Khi nhận gói cuối hoặc nhận audio_complete từ server, chờ hàng đợi phát hết
  if (isLast) {
    scheduleChunkDrainCompletion();
  }
};

// Phát chunk kế tiếp
const playNextChunk = () => {
  if (chunkQueueRef.current.length === 0) {
    isChunkPlayingRef.current = false;
    return;
  }
  const buffer = chunkQueueRef.current.shift()!;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.onended = () => playNextChunk();
  source.start(0);
};
```

Ưu điểm của việc phát theo từng chunk là có thể phát ra tiếng sớm hơn rất nhiều, không cần đợi toàn bộ file âm thanh tải xong. Nhưng cái giá đi kèm là bạn phải tự quản lý hàng đợi, thứ tự, cơ chế hủy và ngữ nghĩa của "gói cuối cùng".

Trong phiên bản mới, server sau khi gửi xong toàn bộ các phân mảnh TTS sẽ chủ động bắn thêm một control message mang tên `audio_complete`. Nhờ vậy, frontend không còn bị lệ thuộc vào việc một chunk âm thanh nào đó bắt buộc phải mang cờ `isLast=true`; ngay cả khi một câu thoại TTS nào đó bị lỗi tổng hợp, hệ thống vẫn kết thúc chuẩn xác trạng thái "người phỏng vấn đang nói" sau khi các chunk đã nhận phát xong.

> ⚠️ **Lưu ý**: Trình duyệt áp dụng chính sách Autoplay rất nghiêm ngặt, đòi hỏi `AudioContext` phải được khởi tạo hoặc resume sau một thao tác tương tác của người dùng. Nếu khởi tạo `AudioContext` ngay khi load trang, đa số trình duyệt sẽ ép nó vào trạng thái `suspended`. Bạn nên gọi `audioContext.resume()` ngay khi người dùng bấm nút "Bắt đầu phỏng vấn" để đảm bảo âm thanh phát bình thường.

### Phía Backend: Quản lý Session qua WebSocket

Backend quản lý vòng đời session thông qua `VoiceInterviewWebSocketHandler`:

```java
// VoiceInterviewWebSocketHandler.java
public class VoiceInterviewWebSocketHandler {
    // Trạng thái session: idle -> listening -> thinking -> speaking -> completed
    // Hỗ trợ các hành động: pause (tạm dừng), resume (khôi phục), end (kết thúc)

    // Tiếp nhận âm thanh từ client
    public void handleAudioMessage(String sessionId, String audioBase64) {
        asrService.sendAudio(sessionId, decodeBase64(audioBase64));
    }

    // Tiếp nhận message điều khiển từ client
    public void handleControlMessage(String sessionId, String action, Map data) {
        switch (action) {
            case "submit" -> llmService.triggerResponse(sessionId, data);
            case "cancel" -> cancelCurrentGeneration(sessionId);
            case "pause" -> pauseSession(sessionId);
        }
    }
}
```

Máy trạng thái session trong interview-guide:

| Trạng thái | Ý nghĩa | Có thể chuyển sang |
| --- | --- | --- |
| IN_PROGRESS | Cuộc phỏng vấn đang diễn ra | PAUSED, COMPLETED |
| PAUSED | Tạm dừng (người dùng rời tab hoặc chủ động dừng) | IN_PROGRESS |
| COMPLETED | Cuộc phỏng vấn đã kết thúc | - |

Cơ chế tạm dừng / khôi phục này vô cùng hữu ích. Ví dụ người dùng có cuộc gọi đến hoặc chuyển sang tab khác thì có thể tạm dừng cuộc phỏng vấn, khi quay lại vẫn tiếp tục được mạch hội thoại mà không bị đứt đoạn.

### Phía Backend: Dịch vụ ASR

Dịch vụ ASR ở backend đóng gói các interface của Alibaba Cloud DashScope:

```java
// QwenAsrService.java
public void startTranscription(
    String sessionId,
    Consumer<String> onFinal,
    Consumer<String> onPartial,
    Runnable onReady,
    Consumer<Throwable> onError
) {
    // 1. Tạo phiên hội thoại và thiết lập kết nối WebSocket
    OmniRealtimeConversation conversation = new OmniRealtimeConversation(param, callback);
    conversation.connect();

    // 2. Cấu hình: bật VAD server, 400 ms im lặng để xác định kết thúc
    OmniRealtimeConfig config = OmniRealtimeConfig.builder()
        .enableTurnDetection(true)
        .turnDetectionSilenceDurationMs(400)
        .build();

    // 3. Gửi cấu hình session. Không được vội chuyển trạng thái local sang ready ngay lập tức
    conversation.updateSession(config);
}

// 4. Callback chỉ mở luồng upload audio sau khi nhận được sự kiện session.updated từ server
public void onSessionUpdated(String sessionId) {
    AsrSession asrSession = sessions.get(sessionId);
    asrSession.markReady();
    asrSession.getOnReady().run(); // Báo cho frontend biết: asr_ready
}

public void sendAudio(String sessionId, byte[] audioData) {
    AsrSession session = sessions.get(sessionId);
    if (!session.awaitReady(1200)) {
        throw new IllegalStateException("ASR session not ready");
    }
    String audioBase64 = Base64.getEncoder().encodeToString(audioData);
    session.getConversation().appendAudio(audioBase64);
}
```

Khâu phối hợp này cực kỳ then chốt. `new OmniRealtimeConversation(...)` chỉ là tạo đối tượng trong bộ nhớ, phải gọi `connect()` mới thực sự mở socket; sau khi gửi `updateSession(config)`, hệ thống vẫn phải kiên nhẫn chờ server bắn về sự kiện `session.updated`. Phía frontend trước khi nhận được tín hiệu `asr_ready` từ backend thì bắt buộc phải vô hiệu hóa micro; nếu chờ quá thời gian (timeout) hoặc nhận lỗi `error`, backend sẽ đóng kết nối cũ, thiết lập lại phiên mới và đẩy trạng thái reconnect về cho frontend.

Khi server trả về kết quả nhận dạng, Handler sẽ đẩy văn bản tăng dần (streaming subtitle) về cho frontend:

```java
// WebSocket đẩy phụ đề văn bản tăng dần
websocket.sendMessage(new WebSocketSubtitleMessage(
    "subtitle",
    transcript,
    isFinal  // true biểu thị đây là kết quả cuối cùng của đoạn
));
```

### Phía Backend: Dịch vụ TTS

```java
// QwenTtsService.java
public byte[] synthesize(String text) throws Exception {
    CountDownLatch latch = new CountDownLatch(1);
    ByteArrayContainer audioContainer = new ByteArrayContainer();

    QwenTtsRealtime qwenTts = new QwenTtsRealtime(param, callback);
    try {
        qwenTts.connect();

        QwenTtsRealtimeConfig config = QwenTtsRealtimeConfig.builder()
            .voice(voice)  // Ví dụ "Cherry"
            .responseFormat(QwenTtsRealtimeAudioFormat.PCM_24000HZ_MONO_16BIT)
            .speechRate(speechRate)
            .build();

        qwenTts.updateSession(config);
        qwenTts.appendText(text);
        qwenTts.commit();

        if (!latch.await(30, TimeUnit.SECONDS)) {
            throw new TimeoutException("TTS synthesis timed out");
        }
        return audioContainer.toByteArray();
    } finally {
        qwenTts.close();
    }
}
```

Ví dụ trên giản lược bớt callback và ánh xạ ngoại lệ, nhưng kiểm soát timeout rất nghiêm ngặt. Khi đưa vào thực tế, bạn cần đóng kết nối khi có lệnh hủy, và phục hồi cờ interrupt của thread khi bắt được `InterruptedException`.

Sau khi nhận được dữ liệu PCM, Handler sẽ chuyển thành chuẩn WAV rồi đẩy về cho frontend:

```java
// LLM cứ nhả ra được một câu hoàn chỉnh là submit ngay vào hàng đợi TTS song song
OrderedTtsChunkEmitter chunkEmitter = new OrderedTtsChunkEmitter(session, semaphore);
llmService.chatStreamSentences(userText, sentence -> {
    chunkEmitter.submit(sentence);
});

// Các phân mảnh TTS được đẩy theo đúng thứ tự câu, cuối cùng gửi message audio_complete
chunkEmitter.finish();
chunkEmitter.awaitCompletion();
```

Trọng tâm ở đây là nén tối đa thời gian chờ đợi: **LLM vừa sinh câu, TTS vừa tổng hợp, frontend vừa phát ra loa**. Phía backend dùng cấu hình `max-concurrent-tts-per-session` để giới hạn số lượng TTS chạy đồng thời trên mỗi session, và dùng `tts-timeout-seconds` để tránh việc một câu bị nghẽn làm tê liệt việc phát của cả lượt; nếu toàn bộ các câu đơn lẻ đều thất bại, hệ thống mới giáng cấp về phương án tổng hợp trọn vẹn cả đoạn văn bản để cứu nguy.

## Làm thế nào để Voice Agent hỗ trợ ngắt lời (Barge-in)?

Ngắt lời là điểm nghẽn kỹ thuật xảy ra như cơm bữa trong các hệ thống voice, một nút bấm tạm dừng đơn giản không thể giải quyết thỏa đáng vấn đề này.

### Ba tầng ngữ nghĩa của việc ngắt lời

1. **Ngắt lời ở tầng phát âm thanh**: Khi người dùng cất lời, lập tức dừng phát âm thanh hiện tại
2. **Ngắt lời ở tầng sinh nội dung**: Hủy bỏ các luồng sinh LLM và TTS đang chạy trên server
3. **Ngắt lời ở tầng ngữ cảnh hội thoại**: Ghi nhận chính xác phần nào đã nói và phần nào chưa nói vào lịch sử hội thoại

Phiên bản hiện tại của interview-guide chưa triển khai cơ chế barge-in thực thụ. Đoạn mã dưới đây chỉ đơn thuần là tạm dừng gửi âm thanh từ micro lên backend trong lúc AI đang nói, nhằm mục đích né việc tiếng loa ngoài kích hoạt ASR; hệ quả là nếu người dùng có nói chen vào thì câu nói đó cũng bị vứt bỏ hoàn toàn:

```typescript
// Triển khai hiện tại: Vứt bỏ âm thanh micro khi AI đang nói
const handleAudioData = (audioData: string) => {
  if (isAiSpeakingRef.current) {
    return;
  }
  wsRef.current.sendAudio(audioData);
};

// Khi phát xong toàn bộ âm thanh
const finishAiPlayback = () => {
  aiAudioPendingRef.current = false;
  clearAudioPlaybackWatchdog();
  setAiSpeaking(false);
  setIsSubmitting(false);

  // Chỉ submit trọn vẹn văn bản sau khi đã phát xong xuôi bình thường
  commitAiMessage(aiTextRef.current.trim());
};
```

Để hỗ trợ ngắt lời thực sự, VAD phía client bắt buộc phải tiếp tục lắng nghe giọng người dùng trong lúc âm thanh đang phát. Ngay khi phát hiện giọng người dùng, nó phải dừng ngay player âm thanh hiện tại, dọn sạch hàng đợi chưa phát, và bắn lệnh `cancel` lên server để hủy các luồng LLM/TTS đang chạy. Ngữ cảnh hội thoại cũng phải dựa vào tiến độ phát thực tế để chỉ lưu lại những câu chữ đã thực sự phát ra tai người dùng; hàm `finishAiPlayback()` hiện tại chỉ submit toàn bộ câu trả lời khi phát xong xuôi, hoàn toàn không có năng lực xử lý việc bị ngắt giữa chừng.

### Ngắt lời dưới góc nhìn của Máy trạng thái (State Machine)

Dưới lăng kính của máy trạng thái, ngắt lời là một sự kiện điều khiển có thể ập đến từ hầu như bất kỳ trạng thái nào:

| Trạng thái hiện tại | Người dùng ngắt lời | Phản ứng chuẩn mực của hệ thống |
| --- | --- | --- |
| listening | Người dùng tiếp tục nói | Tiếp tục thu âm và phiên âm; đây không phải là ngắt lời |
| thinking | Người dùng nói bổ sung ý | Hủy bỏ lượt suy luận hiện tại, nạp input mới để suy luận lại từ đầu |
| speaking | Người dùng nói chen ngang | Lập tức dừng phát ra loa, dọn sạch hàng đợi âm thanh |
| tool_calling | Người dùng bảo "Thôi bỏ đi" | Với truy vấn an toàn (read-only) thì hủy ngay; với thao tác có tác dụng phụ (side-effect) thì chuyển sang quy trình bù trừ, lũy đẳng hoặc nhờ người xác nhận |

Nếu hệ thống của bạn thiếu vắng ngữ nghĩa hủy bỏ rõ ràng, bạn sẽ nhanh chóng phải đối mặt với một trải nghiệm hỗn loạn: AI vừa nghe câu hỏi mới trong khi miệng vẫn bận rộn đọc nốt câu trả lời cũ.

## Thu âm và tiền xử lý trên trình duyệt đóng vai trò gì?

Thuật ngữ WebRTC thường bị đem ra dùng chung chung để chỉ toàn bộ năng lực âm thanh/hình ảnh trên trình duyệt. Trong một Voice Agent, bạn bắt buộc phải phân biệt rạch ròi giữa API thu âm/tiền xử lý của trình duyệt với Giao thức truyền tải thời gian thực WebRTC.

**Điểm phân biệt cốt tử**:

- **Media Capture and Streams API** (`getUserMedia`): Chịu trách nhiệm thu âm thanh từ micro, cho phép thiết lập các ràng buộc như AEC, NS, AGC, sample rate. Đây chính là thứ mà interview-guide thực tế đang sử dụng.
- **Giao thức WebRTC** (`RTCPeerConnection`): Chịu trách nhiệm truyền tải dữ liệu thời gian thực end-to-end qua mạng, bao gồm một chồng giao thức phức tạp như ICE, DTLS-SRTP, RTP. Chỉ khi bạn kết nối với chế độ WebRTC của OpenAI Realtime API, Azure Voice Live hoặc tự dựng server media thời gian thực thì bạn mới cần đụng tới tầng truyền tải này.

Đường truyền âm thanh trong interview-guide là:

```
getUserMedia → AudioWorklet → Mã hóa Base64 → Gửi qua WebSocket
```

Tầng truyền tải ở đây là **WebSocket (TCP)**, chứ không phải **RTP/SRTP** của WebRTC. WebSocket đảm bảo tính toàn vẹn và thứ tự của gói tin, nhưng khi gặp mạng yếu thì sẽ bị ảnh hưởng bởi cơ chế truyền lại (retransmission) của TCP gây ra giật lag; trong khi đó, WebRTC ưu tiên chạy trên UDP, phối hợp cùng cơ chế jitter buffer và bù mất gói (packet loss concealment) để giảm thiểu tối đa hiện tượng khựng tiếng, chỉ khi mạng bị chặn nó mới fallback về TCP/TURN.

### Đường ống tiền xử lý âm thanh trên trình duyệt

Trong kịch bản Voice Agent, bạn chủ yếu tận dụng các khả năng tiền xử lý này của trình duyệt:

```
Đầu vào micro
    │
    ▼
┌─────────────────────────┐
│  AEC (Khử tiếng vang)   │  Loại bỏ âm thanh từ loa phát ra
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  NS (Triệt tiêu tiếng ồn)│  Giảm bớt tạp âm môi trường
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  AGC (Tự động bù âm lượng)│ Giữ âm lượng ổn định
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  VAD (Phát hiện giọng nói)│ Xác định có tiếng người hay không
└─────────────────────────┘
    │
    ▼
Đầu ra mã hóa
```

### Lựa chọn cấu hình cho getUserMedia

interview-guide áp dụng cấu hình `getUserMedia` cơ bản nhất:

```typescript
navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000,
  },
});
```

Nhưng đây không phải là phương án duy nhất, mỗi kịch bản đòi hỏi một sự đánh đổi khác nhau:

| Tham số | true | false | Lời khuyên |
| --- | --- | --- | --- |
| echoCancellation | Triệt tiêu tiếng vang từ loa, nhưng làm suy giảm một phần độ trong của giọng nói | Giữ nguyên độ trung thực của âm thanh gốc, nhưng phải tự xử lý AEC | Nên BẬT |
| noiseSuppression | Giảm bớt tiếng ồn, nhưng có thể gọt nhầm một phần giọng người dùng | Phải tự xây dựng module NS riêng | Môi trường ồn thì BẬT, phòng thu yên tĩnh thì TẮT |
| autoGainControl | Tự động cân chỉnh âm lượng về mức phù hợp | Phụ thuộc hoàn toàn vào âm lượng gốc của micro | Nên BẬT |
| sampleRate | Càng cao chất lượng âm thanh càng tốt, nhưng dung lượng dữ liệu càng nặng | 16 kHz là hoàn toàn đủ dùng cho đa số ASR | Cấu hình theo yêu cầu của model; lưu ý trình duyệt không cam kết đáp ứng 100% |

AEC, NS, AGC trên các trình duyệt và thiết bị khác nhau có sự chênh lệch hiệu năng rất lớn. Chrome trên Desktop, Safari và các trình duyệt di động đều phải được kiểm thử độc lập, kịch bản test tối thiểu phải bao quát loa ngoài, tai nghe, phòng họp và mạng 4G/5G di động.

### Ranh giới của WebRTC

WebRTC cực kỳ phù hợp cho âm thanh thời gian thực trên trình duyệt web, nhưng nếu bạn làm ứng dụng mobile native hoặc thiết bị phần cứng thông minh, bạn phải cân nhắc tới năng lực nền tảng và giới hạn tiêu thụ pin.

Trên mobile native, bạn có thể tận dụng:

- **iOS**: `AVAudioEngine` kết hợp với các bộ xử lý âm thanh tích hợp sẵn của hệ điều hành Apple
- **Android**: `AudioRecord` + Oboe/AAudio, hoặc nhúng thư viện WebRTC của Google

Trong các kịch bản phần cứng chuyên dụng (loa thông minh, màn hình ô tô), hệ thống thường đòi hỏi chip DSP chuyên dụng hoặc thuật toán âm học frontend chuyên sâu để xử lý khử vang phần cứng, định hướng chùm sóng micro mảng (beamforming) và thu âm trường xa (far-field pickup); chỉ dựa vào thuật toán phần mềm kiểu trình duyệt là hoàn toàn không đủ.

## So sánh Mô hình ghép tầng và Mô hình Realtime gốc

Đây chính là bài toán cốt lõi nhất khi lựa chọn kiến trúc hệ thống.

### Phương án 1: Mô hình ghép tầng ASR + LLM + TTS

```
Âm thanh -> VAD -> Streaming ASR -> LLM -> Streaming TTS -> Âm thanh
```

Ưu điểm:

- Văn bản từ ASR có thể dễ dàng lưu trữ database, kiểm toán (audit), sửa lỗi
- Đầu vào/đầu ra của LLM đều là văn bản, cực kỳ thuận tiện để tái sử dụng các Agent framework sẵn có
- Engine TTS có thể thay thế giọng đọc và nhà cung cấp hoàn toàn độc lập
- Từng module riêng lẻ đều có thể test tải và tối ưu độc lập

Nhược điểm:

- Độ trễ tích tụ qua từng tầng
- Lỗi nhận dạng của ASR sẽ lan truyền trực tiếp vào LLM
- Tầng trung gian dạng text làm rơi rụng toàn bộ ngữ điệu, ngập ngừng và cảm xúc
- Việc ngắt lời đòi hỏi phải phối hợp hủy trên diện rộng: từ ASR, LLM, TTS cho tới player âm thanh

interview-guide chính là đại diện cho phương án này. Nó cực kỳ thích hợp cho các kịch bản: hỏi đáp tri thức doanh nghiệp, tiếp nhận ticket CSKH, và các hệ thống nghiệp vụ yêu cầu kiểm toán tuân thủ khắt khe.

### Phương án 2: Mô hình Realtime Speech-to-Speech gốc

```
Âm thanh -> Mô hình đa phương thức gốc -> Âm thanh
```

Các giải pháp tiêu biểu: OpenAI Realtime API, Gemini Live API, Alibaba Qwen-Omni.

Ưu điểm:

- Độ trễ End-to-End thấp hơn vượt bậc
- Giữ lại trọn vẹn các thông tin cận ngôn ngữ (paralinguistic) như ngữ điệu, ngắt nghỉ, cảm xúc
- Xử lý thống nhất luồng âm thanh đầu vào, sự kiện văn bản và gọi Tool trong cùng một phiên

Nhược điểm:

- Quá trình trung gian mang tính chất "hộp đen", việc điều tra lỗi phụ thuộc nặng nề vào log của nhà cung cấp
- Việc kiểm toán văn bản và kiểm soát câu từ đòi hỏi phải thiết kế kiến trúc bổ trợ phức tạp
- Mô hình tính phí thường tính theo token âm thanh hoặc thời lượng âm thanh
- Nếu nghiệp vụ bắt buộc phải deploy on-premise nội bộ, API của nhà cung cấp đám mây sẽ không thể đáp ứng

**Lựa chọn hình thức kết nối**:

Tài liệu hiện tại của OpenAI Realtime API cung cấp 3 hình thức kết nối:

| Hình thức | Kịch bản áp dụng |
| --- | --- |
| WebRTC | Ứng dụng web và mobile, thích hợp thu micro trực tiếp và phát âm thanh từ model |
| WebSocket | Kịch bản middleware giữa server-to-server, độ trễ thấp và kiểm soát linh hoạt |
| SIP | Tích hợp hệ thống tổng đài điện thoại VoIP, phù hợp cho call center và CSKH qua điện thoại |

### Lời khuyên của mình

Với các sản phẩm thoại tần suất cao, đòi hỏi tính thời gian thực cực gắt và tương tác sống động tự nhiên, bạn nên ưu tiên đánh giá các Native Realtime API. Còn khi nghiệp vụ đòi hỏi phải kiểm toán từng câu chữ của ASR, kiểm soát chặt chẽ kịch bản trả lời hoặc bắt buộc phải tự deploy on-premise, mô hình ghép tầng vẫn là lựa chọn dễ quan sát và dễ thay thế linh kiện hơn, dù cho việc có nhiều component hơn cũng sẽ kéo theo nhiều nguy cơ timeout và điểm lỗi hơn.

**Tuyệt đối đừng nhảy vào làm Edge-Cloud hybrid ngay từ ngày đầu tiên**. Hãy làm thông suốt một đường ống duy nhất trước, sau đó mới tiến hành thay thế và tối ưu từng phần.

## Tối ưu hóa hệ thống Voice trên Production như thế nào?

### 1. Tinh chỉnh Frame âm thanh và Chunk gửi lên

Thuật toán nén mã hóa và xử lý tiếng nói thường dùng các frame có độ dài 10 ms, 20 ms hoặc 30 ms; trong khi tầng ứng dụng có thể gộp nhiều frame lại thành một chunk gửi qua mạng. Độ dài frame và kích thước chunk gửi mạng là hai khái niệm hoàn toàn khác nhau: frame xử lý quá lớn sẽ làm tăng độ trễ thuật toán, còn chunk mạng quá nhỏ sẽ làm đội chi phí đóng gói message và mã hóa.

interview-guide lựa chọn kích thước **chunk 200 ms**:

```typescript
// pcm-processor.js
this.targetSampleRate = 16000;
this.samplesPerChunk = 3200; // 200 ms tại tần số 16 kHz
```

Con số này không bắt ASR phải đợi hết cả câu mới làm việc, nhưng nó sẽ cõng thêm độ trễ tối đa bằng một chu kỳ chunk vào luồng âm thanh tải lên; cộng dồn với thời gian im lặng để ngắt câu của VAD phía server, người dùng sẽ cảm thấy "dứt lời rồi mà vẫn phải khựng lại một nhịp". Nếu muốn làm tốt hơn, bạn có thể:

- Giảm kích thước chunk xuống 100 ms
- Phía frontend bắn trước một đoạn âm thanh ngắn để "khởi động ấm" cho ASR
- Dùng kết quả phiên âm tăng dần đã ổn định của ASR để đoán trước ý định; còn các sự kiện VAD chỉ làm nhiệm vụ cung cấp biên giới lượt thoại

### 2. Ép LLM ưu tiên nhả câu ngắn trước

Giao tiếp bằng giọng nói không phải là viết văn tế. Người dùng không bao giờ muốn vừa mở miệng ra là phải nghe một bài diễn thuyết tràng giang đại hải 500 chữ.

Chiến lược thông minh hơn:

- Xuất câu đệm xác nhận ngay lập tức: "Để tôi xem nào..."
- Trong lúc gọi Tool thì phát câu chuyển tiếp: "Đang tra cứu đơn hàng gần nhất của bạn..."
- Khi có kết quả thì đưa ra kết luận cốt lõi trước
- Đoạn giải thích dài phải được bẻ nhỏ thành nhiều câu độc lập, mỗi câu đều có thể đưa vào tổng hợp riêng lẻ

### 3. Cắt phân đoạn TTS theo biên giới ngữ nghĩa

Nếu cắt câu cho TTS quá vụn, giọng đọc nghe sẽ giật cục, rời rạc; nếu cắt quá dài thì độ trễ gói đầu tiên sẽ rất cao.

Thứ tự ưu tiên cắt câu được khuyến nghị:

1. Dấu chấm, dấu chấm hỏi, dấu chấm than
2. Dấu chấm phẩy, dấu hai chấm
3. Các vế câu ngăn cách bởi dấu phẩy có độ dài tương đối
4. Cưỡng chế ngắt nếu câu quá dài vượt ngưỡng

Đồng thời, tuyệt đối tránh việc bẻ gãy các con số, từ viết tắt tiếng Anh hoặc tên biến code. Ví dụ chuỗi "GPT-4o-mini-tts" không thể bị tùy tiện xé lẻ thành các âm tiết rời rạc.

interview-guide hiện tại đang áp dụng chuẩn xác tư duy này: trong quá trình LLM stream chữ ra, hễ phát hiện được một câu hoàn chỉnh là lập tức submit ngay cho `OrderedTtsChunkEmitter` để làm TTS cấp độ câu. Phía frontend hễ nhận được `audio_chunk` là lập tức xếp vào hàng đợi phát ngay, sau khi nhận được `audio_complete` thì kiên nhẫn chờ hàng đợi phát hết tự nhiên. Nhờ vậy, câu nói đầu tiên không hề phải đợi toàn bộ câu trả lời sinh xong xuôi mới cất tiếng.

### 4. Kiểm soát độ dài Context

Voice Agent rất dễ có thói quen nhét toàn bộ lịch sử phiên âm, kết quả Tool, trạng thái phát âm thanh vào trong context. Nhìn ngắn hạn thì có vẻ không sao, nhưng trong các phiên đàm thoại dài, điều này sẽ khiến độ trễ và chi phí Token phi mã chóng mặt.

Hãy chia context thành 3 tầng rành mạch:

- **Văn bản gốc ngắn hạn**: Toàn văn phiên âm và câu trả lời của vài lượt gần nhất
- **Tóm tắt phiên (Summary)**: Mục tiêu người dùng, các sự thật đã được xác nhận, các đầu việc chưa xong
- **Trạng thái sự kiện**: Tiến độ phát hiện tại, có bị ngắt lời hay không, kết quả gọi Tool

LLM không cần biết từng frame âm thanh đã diễn ra những gì, nó chỉ cần nắm bắt các trạng thái có tỷ lệ tín hiệu trên tạp âm (signal-to-noise ratio) cao nhất để phục vụ cho quyết định hiện tại.

### 5. Thiết lập Observability toàn diện cho cả chuỗi

interview-guide dùng Redis để cache trạng thái session:

```java
// VoiceInterviewService.java
private static final String SESSION_CACHE_KEY_PREFIX = "voice:interview:session:";

private void cacheSession(VoiceInterviewSessionEntity session) {
    String cacheKey = getSessionCacheKey(session.getId());
    RBucket<VoiceInterviewSessionEntity> bucket = redissonClient.getBucket(cacheKey);
    bucket.set(session, Duration.ofHours(CACHE_TTL_HOURS));
}
```

Trên môi trường production, bạn bắt buộc phải ghi nhận thêm:

- Thời lượng âm thanh gửi lên (uplink)
- Thời lượng tiếng người thực tế có hiệu lực
- Số Token hoặc số phút xử lý của ASR
- Lượng Token input và output của LLM
- Số ký tự TTS, số giây âm thanh đã phát, số giây âm thanh bị ngắt lời
- Độ trễ End-to-End và số lần hủy (cancellation) của từng lượt

Thiếu vắng các chỉ số này, chi phí vận hành của Voice Agent sẽ trở thành một hố đen không tài nào kiểm soát nổi.

## Voice Agent có thể tiếp tục tiến hóa theo những hướng nào?

interview-guide chỉ là một bản hiện thực hóa ở mức cơ bản, hệ thống này còn rất nhiều không gian để tiếp tục nâng cấp.

### Mô hình kết hợp Edge-Cloud

Hiện tại interview-guide chủ yếu đi theo thiết kế "Cloud làm trung tâm". Hướng tiến hóa tiếp theo là đẩy bớt năng lực xuống phía client:

| Khâu | Hiện tại | Hướng tiến hóa |
| --- | --- | --- |
| VAD | Client VAD + Server VAD | VAD hoàn toàn tại Client, giải tỏa áp lực cho server |
| ASR | 100% Cloud | Lệnh điều khiển đơn giản chạy ở Client, nhận dạng phức tạp đẩy lên Cloud |
| LLM | 100% Cloud | Small Language Model (SLM) chạy local làm cứu cánh khi mất mạng |
| TTS | 100% Cloud | Các câu thoại thông báo cố định lưu ở Client, hội thoại mở sinh trên Cloud |

Edge-Cloud hybrid không có nghĩa là nhồi nhét tất cả model vào máy người dùng. Cách làm vững chắc là: những tác vụ đòi hỏi thời gian thực cực cao, nhạy cảm quyền riêng tư hoặc cần hoạt động khi mất mạng thì ưu tiên đẩy xuống Client; những tác vụ đòi hỏi suy luận phức tạp, thấu hiểu ngữ cảnh sâu rộng hoặc kiểm toán tập trung thì giữ lại trên Cloud.

### Tự triển khai Model Local (On-Premise)

Nếu doanh nghiệp của bạn có yêu cầu khắt khe về bảo mật dữ liệu, bạn có thể cân nhắc tự host ASR và TTS trên hạ tầng nội bộ:

- **ASR**: faster-whisper, FunASR, SenseVoice
- **TTS**: piper1-gpl (repo Piper gốc đã lưu trữ), Fish Speech, CosyVoice

**Lưu ý quan trọng**: Kho lưu trữ Piper gốc (`rhasspy/piper`) đã chính thức được đưa vào lưu trữ (archived) từ tháng 10 năm 2025, công việc phát triển đã chuyển dịch sang [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl). Dự án piper1-gpl sử dụng giấy phép GPL-3.0, đòi hỏi các dự án thương mại phải đánh giá kỹ lưỡng về tính tuân thủ mã nguồn mở; dự án hiện cũng đang tìm kiếm maintainer mới nên việc hỗ trợ dài hạn vẫn còn bỏ ngỏ. Fish Speech không phải là Apache 2.0: model, code và tài liệu hiện tại của nó chịu sự ràng buộc của [Fish Audio Research License](https://github.com/fishaudio/fish-speech/blob/main/LICENSE), cho phép sử dụng miễn phí cho mục đích phi thương mại và nghiên cứu, còn mục đích thương mại bắt buộc phải có văn bản cấp phép riêng từ Fish Audio. Với CosyVoice, bạn cũng phải kiểm tra license độc lập của code, trọng số model và tài nguyên giọng đọc.

Lợi thế của việc tự deploy local là quyền kiểm soát tuyệt đối và khả năng chạy offline. Nhược điểm là **chi phí kỹ thuật công trình cực lớn**: bạn phải tự mình test tải dung lượng GPU/RAM/concurrency, tự xây dựng cơ chế suy luận streaming, nạp nóng mô hình và thu hồi bộ nhớ VRAM.

### Native Realtime API

Khi độ trễ và độ tự nhiên của mô hình ghép tầng đã chạm trần không thể tối ưu thêm, bạn nên đánh giá các Native Realtime API:

- OpenAI Realtime API (hỗ trợ WebRTC, WebSocket, SIP; tên model quản lý qua file config)
- Gemini Live API
- Alibaba Tongyi Qwen-Omni

Các API này hòa quyện ASR, LLM và TTS vào một luồng đa phương thức thống nhất, mang lại lợi thế vượt trội về độ trễ và sự tự nhiên. Nhưng thách thức đi kèm cũng rất rõ ràng: quy trình trung gian mang tính hộp đen, cơ chế giá biến động nhanh, và công tác debug cũng như kiểm toán đòi hỏi phải thiết kế kiến trúc riêng.

OpenAI đã chính thức đưa Realtime API lên bản GA vào tháng 8 năm 2025, đồng thời phát hành model giọng nói chuyên dụng `gpt-realtime`. Các model Realtime cập nhật rất nhanh, code production không nên rải rác tên model cứng vào logic nghiệp vụ mà nên quản lý tập trung qua Configuration Center hoặc Model Gateway, đồng thời kiểm tra lại danh mục model hiện hành trước khi release.

Bản GA của Realtime API cũng bổ sung thêm các tính năng đáng chú ý:

1. **Hỗ trợ máy chủ MCP từ xa**, cho phép gọi Tool bên ngoài y hệt như mô hình ghép tầng;
2. **Hỗ trợ đầu vào hình ảnh**, giúp model có thể nhìn màn hình hoặc camera của người dùng để trò chuyện;
3. **Tích hợp giao thức thoại SIP**, kết nối trực tiếp với mạng viễn thông truyền thống.

Về chi phí, đừng bao giờ fix cứng con số trong tài liệu. Các model Realtime thường tách biệt biểu phí giữa token text, token audio, token cache đầu vào và đầu ra, hãy luôn đối chiếu bảng giá chính thức trên trang pricing trước khi bấm nút triển khai.

### Nâng cấp trải nghiệm ngắt lời (Barge-in)

Hiện tại interview-guide áp dụng cách ngắt lời "âm thầm vứt bỏ": khi AI nói thì chặn micro. Cách này tuy đơn giản nhưng trải nghiệm còn thô cứng.

Hướng đi ưu việt hơn:

- Khi AI nói, micro vẫn tiếp tục thu âm, chỉ là tạm thời chưa gửi cho ASR
- Ngay khi phát hiện tiếng người dùng, hạ dần âm lượng (ducking / fade-out) tiếng phát của AI thay vì ngắt phụt một cái đột ngột
- Sau khi ngắt lời, lưu lại chuẩn xác ngữ cảnh những gì người dùng đã thực sự nghe được

### Mở rộng Đa phương thức (Multimodal)

interview-guide hiện tại thuần túy chỉ có âm thanh. Hoàn toàn có thể mở rộng thành:

- **Giọng nói + Chia sẻ màn hình**: Người phỏng vấn có thể nhìn thấy IDE của ứng viên theo thời gian thực
- **Giọng nói + Camera**: Quan sát biểu cảm khuôn mặt và ngôn ngữ cơ thể của ứng viên
- **Giọng nói + Bảng trắng cộng tác**: Cùng nhau vẽ sơ đồ kiến trúc hệ thống

Các năng lực đa phương thức này đòi hỏi tầng quản lý luồng dữ liệu và đồng bộ trạng thái phức tạp hơn rất nhiều.

## Trả lời các câu hỏi phỏng vấn về Hệ thống AI Voice như thế nào?

Nếu người phỏng vấn đặt câu hỏi: "Bạn sẽ thiết kế một Voice Agent thời gian thực như thế nào?"

Bạn có thể triển khai câu trả lời theo dàn ý mạch lạc sau:

1. **Bóc tách chuỗi kỹ thuật**: Client thu âm từ micro, VAD bắt điểm dừng câu, streaming ASR phiên âm ra chữ, LLM thấu hiểu ý định và gọi Tool, streaming TTS tổng hợp âm thanh, và client vừa nhận vừa phát ra loa.
2. **Nêu bật các điểm nghẽn cốt lõi**: Khó khăn thực sự của voice thời gian thực nằm ở quỹ thời gian độ trễ eo hẹp, cơ chế ngắt lời (barge-in), môi trường tạp âm khắc nghiệt, lưu vết trạng thái ngữ cảnh và sự phối hợp giữa Client và Server.
3. **Phân tích Máy trạng thái**: Cần quản lý chặt chẽ các trạng thái `listening`, `thinking`, `speaking`, `interrupted`. Khi người dùng ngắt lời, hệ thống phải đồng thời dừng phát âm thanh, hủy luồng sinh trên server, và xử lý ngữ cảnh giữa phần đã phát và phần chưa phát.
4. **Bàn về Lựa chọn kiến trúc**: Cloud API triển khai nhanh, model local bảo mật cao nhưng tốn công vận hành; việc kết hợp Edge-Cloud hay dùng Speech-to-Speech Realtime API cần được đánh giá dựa trên yêu cầu về độ trễ, tuân thủ pháp lý, khả năng kiểm toán văn bản và bài toán chi phí.

## Tổng kết

Một AI Voice Agent thực chất là một chuỗi đường ống xử lý luồng âm thanh thời gian thực: VAD quyết định biên giới lượt đối thoại, ASR, LLM và TTS bắt buộc phải nối đuôi nhau dạng streaming, trong khi việc phát âm thanh, ngắt lời, hủy tác vụ và trạng thái phiên hội thoại phải được điều phối ăn khớp với nhau. Mô hình ghép tầng giúp tầng trung gian dễ kiểm soát và kiểm toán hơn, trong khi mô hình Realtime gốc lại chiếm ưu thế tuyệt đối về độ trễ và sự sống động tự nhiên; việc phân chia ranh giới giữa Edge và Cloud cần căn cứ vào độ trễ mục tiêu, quyền riêng tư, khả năng chạy offline khi rớt mạng, chi phí và năng lực vận hành. Dù lựa chọn bất kỳ phương án kiến trúc nào, ngay từ ngày đầu tiên bạn cũng phải thiết kế nó như một hệ thống phân tán có khả năng hủy bỏ, có thể giám sát (observable) và có phương án giáng cấp (graceful degradation) an toàn—chứ tuyệt đối không phải là sự chắp vá ngây thơ của 3 lời gọi API riêng rẽ.
