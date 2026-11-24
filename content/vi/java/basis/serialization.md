---
title: Giải thích chi tiết về Serialization trong Java
description: "Phân tích chuyên sâu cơ chế Serialization và Deserialization trong Java: giải thích giao diện Serializable, từ khóa transient, tác dụng của serialVersionUID, cách lựa chọn giao thức tuần tự hóa cùng các kịch bản ứng dụng như RPC và bộ nhớ đệm (cache)."
category: Java
tag:
  - Java cơ bản
lang: vi
sourceRef: zh-ref/java/basis/serialization.md
head:
  - - meta
    - name: keywords
      content: Java Serialization,Deserialization,giao diện Serializable,từ khóa transient,serialVersionUID,giao thức tuần tự hóa,lưu trữ đối tượng bền vững
---

## Serialization và Deserialization là gì?

Khi cần lưu trữ bền vững (persist) đối tượng Java — chẳng hạn lưu đối tượng Java vào tập tin — hoặc truyền đối tượng Java qua mạng, những kịch bản này đều cần đến tuần tự hóa (`Serialization`).

Nói một cách đơn giản:

- **Tuần tự hóa (`Serialization`)**: Chuyển đổi cấu trúc dữ liệu hoặc đối tượng thành dạng có thể lưu trữ hoặc truyền tải — thông thường là luồng byte nhị phân, hoặc cũng có thể là các định dạng văn bản như JSON, XML.
- **Giải tuần tự hóa (`Deserialization`)**: Quá trình chuyển đổi ngược lại dữ liệu được tạo ra trong quá trình tuần tự hóa về cấu trúc dữ liệu hoặc đối tượng ban đầu.

Đối với ngôn ngữ lập trình hướng đối tượng như Java, thứ chúng ta tuần tự hóa đều là đối tượng (Object), tức là lớp (`Class`) sau khi được khởi tạo thể hiện; còn trong ngôn ngữ bán hướng đối tượng như C++, `struct` định nghĩa kiểu cấu trúc dữ liệu, trong khi `class` mới tương ứng với kiểu đối tượng.

Dưới đây là các kịch bản ứng dụng phổ biến của `Serialization` và `Deserialization`:

- Trước khi truyền đối tượng qua mạng (chẳng hạn khi gọi hàm từ xa RPC), đối tượng cần được tuần tự hóa; sau khi nhận được dữ liệu đối tượng đã tuần tự hóa, bên nhận cần giải tuần tự hóa lại.
- Trước khi lưu đối tượng xuống tập tin cần tiến hành tuần tự hóa; khi đọc đối tượng từ tập tin lên cần tiến hành giải tuần tự hóa.
- Trước khi lưu đối tượng vào cơ sở dữ liệu (như Redis) cần dùng đến tuần tự hóa; khi đọc đối tượng từ cơ sở dữ liệu cache ra cần giải tuần tự hóa.
- Khi cần chuyển đối tượng thành biểu diễn dạng byte để lưu trữ lâu dài hoặc truyền giữa các thành phần khác nhau thì thường cần tuần tự hóa; các đối tượng Java thông thường chỉ sử dụng bên trong bộ nhớ JVM thì không cần tuần tự hóa.

Wikipedia mô tả về tuần tự hóa như sau:

> **Tuần tự hóa** (`serialization`) trong xử lý dữ liệu của khoa học máy tính là quá trình chuyển đổi cấu trúc dữ liệu hoặc trạng thái đối tượng sang một định dạng có thể lưu giữ (ví dụ lưu thành tập tin, lưu trong bộ đệm hoặc gửi qua mạng) nhằm phục vụ cho việc khôi phục lại trạng thái ban đầu sau này trong cùng môi trường máy tính hoặc trên một máy tính khác. Khi đọc lại chuỗi byte theo đúng định dạng tuần tự hóa, người ta có thể dùng nó để tạo ra một bản sao có cùng ngữ nghĩa với đối tượng gốc. Với nhiều đối tượng phức tạp, chẳng hạn những đối tượng sử dụng lượng lớn tham chiếu, quá trình tái tạo sau tuần tự hóa này không hề đơn giản. Tuần tự hóa đối tượng trong lập trình hướng đối tượng không bao gồm các hàm/phương thức gắn liền với đối tượng gốc trước đó. Quá trình này còn được gọi là đóng gói đối tượng (*marshalling*). Thao tác ngược lại — trích xuất cấu trúc dữ liệu từ một chuỗi byte — là giải tuần tự hóa (còn gọi là *unmarshalling* hoặc *deserialization*).

Tóm lại: **Mục đích chính của `Serialization` là chuyển đối tượng thành biểu diễn phù hợp để truyền qua mạng hoặc lưu trữ bền vững xuống hệ thống tập tin, cơ sở dữ liệu, bộ nhớ đệm (cache), v.v.**

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/a478c74d-2c48-40ae-9374-87aacf05188c-92692fb2.png)

<p style="text-align:right;font-size:13px;color:gray">https://www.corejavaguru.com/java/serialization/interview-questions-1</p>

**Giao thức tuần tự hóa tương ứng với tầng nào trong mô hình 4 tầng TCP/IP?**

Chúng ta đều biết hai bên giao tiếp mạng bắt buộc phải áp dụng và tuân thủ cùng một giao thức. Mô hình 4 tầng TCP/IP bao gồm các tầng dưới đây — vậy giao thức tuần tự hóa thuộc tầng nào?

1. Tầng Ứng dụng (Application Layer)
2. Tầng Giao vận (Transport Layer)
3. Tầng Mạng (Internet/Network Layer)
4. Tầng Giao diện Mạng (Network Interface Layer)

![Mô hình 4 tầng TCP/IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

Như minh họa ở hình trên, trong mô hình giao thức 7 tầng OSI, công việc chính của Tầng Trình diễn (Presentation Layer) là xử lý dữ liệu người dùng từ Tầng Ứng dụng và chuyển đổi thành luồng nhị phân; ở chiều ngược lại thì chuyển luồng nhị phân thành dữ liệu người dùng cho Tầng Ứng dụng. Điều này chẳng phải tương ứng chính xác với `Serialization` và `Deserialization` sao?

Bởi vì Tầng Ứng dụng, Tầng Trình diễn và Tầng Phiên (Session Layer) trong mô hình OSI 7 tầng đều tương ứng với Tầng Ứng dụng trong mô hình 4 tầng TCP/IP, nên giao thức tuần tự hóa thuộc về một phần của Tầng Ứng dụng trong bộ giao thức TCP/IP.

## Các giao thức tuần tự hóa phổ biến gồm những gì?

Cách tuần tự hóa mặc định đi kèm JDK thông thường không được dùng vì hiệu suất tuần tự hóa thấp và tồn tại vấn đề bảo mật. Các giao thức tuần tự hóa phổ biến hơn bao gồm Hessian, Kryo, Protobuf, ProtoStuff — tất cả đều là giao thức tuần tự hóa dựa trên nhị phân.

Các định dạng như JSON và XML thuộc nhóm tuần tự hóa dạng văn bản. Tuy khả năng đọc hiểu tốt hơn nhưng hiệu năng lại kém hơn, nên thông thường không được lựa chọn cho các giao thức tuần tự hóa hiệu năng cao.

### Cách tuần tự hóa mặc định của JDK

Với cơ chế tuần tự hóa mặc định của JDK, lớp chỉ cần triển khai giao diện `java.io.Serializable` là được.

```java
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Builder
@ToString
public class RpcRequest implements Serializable {
    private static final long serialVersionUID = 1905122041950251207L;
    private String requestId;
    private String interfaceName;
    private String methodName;
    private Object[] parameters;
    private Class<?>[] paramTypes;
    private RpcMessageTypeEnum rpcMessageTypeEnum;
}
```

**`serialVersionUID` có tác dụng gì?**

Mã định danh tuần tự hóa `serialVersionUID` đóng vai trò kiểm soát phiên bản (version control). Khi giải tuần tự hóa (`Deserialization`), hệ thống sẽ kiểm tra xem `serialVersionUID` trong luồng dữ liệu có khớp với `serialVersionUID` của lớp hiện tại hay không; nếu không khớp sẽ ném ra ngoại lệ `InvalidClassException`. Rất khuyến nghị mỗi lớp hỗ trợ tuần tự hóa đều nên khai báo thủ công `serialVersionUID` của riêng nó. Nếu không khai báo tường minh, runtime tuần tự hóa sẽ tính ra một giá trị mặc định dựa trên cấu trúc của lớp, chứ không phải do trình biên dịch sinh sẵn trường đó.

**Chẳng phải `serialVersionUID` đã được bổ từ `static` bổ nghĩa rồi sao? Tại sao vẫn bị "tuần tự hóa"?**

~~Biến được bổ từ `static` bổ nghĩa là biến tĩnh nằm ở Method Area, bản thân nó sẽ không bị tuần tự hóa. Biến `static` thuộc về lớp chứ không thuộc về đối tượng. Sau khi giải tuần tự hóa, giá trị biến `static` trông giống như mặc định được gán cho đối tượng khiến ta tưởng rằng biến `static` đã bị tuần tự hóa, nhưng thực ra đó chỉ là ảo giác mà thôi.~~

**🐛 Đính chính (xem: [issue#2174](https://github.com/Snailclimb/JavaGuide/issues/2174)):**

Trong trường hợp thông thường, biến `static` thuộc về lớp, không thuộc về bất kỳ thể hiện đối tượng riêng lẻ nào, nên bản thân chúng sẽ không được đưa vào luồng dữ liệu tuần tự hóa của đối tượng. Việc tuần tự hóa lưu giữ trạng thái của đối tượng (tức là giá trị của các biến thể hiện / instance variable). Tuy nhiên, `serialVersionUID` là một ngoại lệ — việc tuần tự hóa đối với `serialVersionUID` được xử lý đặc biệt. Điểm mấu chốt nằm ở chỗ: `serialVersionUID` không được tuần tự hóa như một phần trạng thái của đối tượng, mà được chính cơ chế tuần tự hóa dùng làm một "dấu vân tay" hoặc "số phiên bản" đặc biệt.

Khi một đối tượng được tuần tự hóa, `serialVersionUID` sẽ được ghi vào luồng nhị phân tuần tự hóa (giống như đang lưu một mã phiên bản chứ không phải lưu trạng thái của bản thân biến `static`); khi giải tuần tự hóa, nó cũng được đọc phân tích và kiểm tra tính nhất quán nhằm xác thực sự tương thích phiên bản của đối tượng đã tuần tự hóa. Nếu hai giá trị không khớp nhau, quá trình giải tuần tự hóa sẽ ném ngoại lệ `InvalidClassException`, bởi điều đó thường có nghĩa là định nghĩa của lớp đã tuần tự hóa bị thay đổi và có thể không còn tương thích nữa.

Tài liệu chính thức giải thích như sau:

> A serializable class can declare its own serialVersionUID explicitly by declaring a field named `"serialVersionUID"` that must be `static`, `final`, and of type `long`;
>
> Nếu muốn chỉ định tường minh `serialVersionUID`, cần dùng các từ khóa `static` và `final` trong lớp để khai báo một biến kiểu `long`, và tên biến bắt buộc phải là `"serialVersionUID"`.

Nghĩa là bản thân `serialVersionUID` (với tư cách là biến `static`) đúng là không bị tuần tự hóa như trạng thái đối tượng. Thế nhưng, giá trị của nó được cơ chế tuần tự hóa của Java xử lý đặc biệt — được ghi vào và đọc ra từ luồng tuần tự hóa như một mã định danh phiên bản để kiểm tra tính tương thích phiên bản khi giải tuần tự hóa.

**Nếu có một số trường (field) không muốn tuần tự hóa thì làm thế nào?**

Đối với các biến không muốn tuần tự hóa, bạn có thể dùng từ khóa `transient` để bổ nghĩa.

Tác dụng của từ khóa `transient` là: ngăn không cho những biến thể hiện được gắn từ khóa này bị tuần tự hóa; khi đối tượng được giải tuần tự hóa, giá trị của các biến có `transient` sẽ không được lưu giữ và khôi phục.

Cần lưu ý thêm một số điểm về `transient`:

- `transient` chỉ có thể gắn cho biến, không thể gắn cho lớp hay phương thức.
- Biến được gắn `transient` sau khi giải tuần tự hóa sẽ bị đặt về giá trị mặc định của kiểu dữ liệu đó. Ví dụ: nếu gắn cho kiểu `int`, kết quả sau khi giải tuần tự hóa sẽ là `0`.
- Biến `static` do không thuộc về bất kỳ đối tượng (`Object`) nào nên dù có gắn từ khóa `transient` hay không thì đều không bị tuần tự hóa.

**Vì sao không khuyến khích sử dụng cách tuần tự hóa mặc định của JDK?**

Chúng ta rất ít khi hoặc gần như không bao giờ dùng trực tiếp cơ chế tuần tự hóa mặc định của JDK, chủ yếu vì các nguyên nhân sau:

- **Không hỗ trợ gọi chéo ngôn ngữ**: Nếu dịch vụ được gọi được phát triển bằng ngôn ngữ lập trình khác thì sẽ không hỗ trợ được.
- **Hiệu năng kém**: So với các framework tuần tự hóa khác, hiệu năng thấp hơn rõ rệt, nguyên nhân chính là kích thước mảng byte sau tuần tự hóa khá lớn, làm tăng chi phí truyền tải.
- **Tồn tại lỗ hổng bảo mật**: Bản thân `Serialization` và `Deserialization` không có vấn đề gì. Nhưng khi dữ liệu đầu vào cho quá trình giải tuần tự hóa có thể bị người dùng kiểm soát, kẻ tấn công có thể tạo ra dữ liệu độc hại khiến quá trình giải tuần tự hóa sinh ra các đối tượng ngoài ý muốn và thực thi mã tùy ý được cài cắm trong quá trình đó. Đọc thêm: [Bảo mật ứng dụng: Nỗi đau lỗ hổng Java Deserialization - Cryin](https://cryin.github.io/blog/secure-development-java-deserialization-vulnerability/), [Lỗ hổng bảo mật Java Deserialization thực chất là gì? - Monica](https://www.zhihu.com/question/37562657/answer/1916596031).

### Kryo

Kryo là một công cụ `Serialization` / `Deserialization` hiệu năng cao; nhờ đặc tính lưu trữ độ dài biến thiên (variable-length) và sử dụng cơ chế sinh mã bytecode, nó đạt tốc độ thực thi cao cùng kích thước dữ liệu sau tuần tự hóa nhỏ gọn.

Ngoài ra, Kryo đã là một giải pháp tuần tự hóa rất chín muồi, được sử dụng rộng rãi tại Twitter, Groupon, Yahoo cũng như nhiều dự án mã nguồn mở nổi tiếng (như Hive, Storm).

[guide-rpc-framework](https://github.com/Snailclimb/guide-rpc-framework) sử dụng Kryo để tuần tự hóa; mã nguồn liên quan đến tuần tự hóa và giải tuần tự hóa như sau:

```java
/**
 * Kryo serialization class, Kryo serialization efficiency is very high, but only compatible with Java language
 *
 * @author shuang.kou
 * @createTime 2020-05-13 19:29:00
 */
@Slf4j
public class KryoSerializer implements Serializer {

    /**
     * Because Kryo is not thread safe. So, use ThreadLocal to store Kryo objects
     */
    private final ThreadLocal<Kryo> kryoThreadLocal = ThreadLocal.withInitial(() -> {
        Kryo kryo = new Kryo();
        kryo.register(RpcResponse.class);
        kryo.register(RpcRequest.class);
        return kryo;
    });

    @Override
    public byte[] serialize(Object obj) {
        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
             Output output = new Output(byteArrayOutputStream)) {
            Kryo kryo = kryoThreadLocal.get();
            // Object->byte: Tuần tự hóa đối tượng thành mảng byte
            kryo.writeObject(output, obj);
            kryoThreadLocal.remove();
            return output.toBytes();
        } catch (Exception e) {
            throw new SerializeException("Serialization failed");
        }
    }

    @Override
    public <T> T deserialize(byte[] bytes, Class<T> clazz) {
        try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(bytes);
             Input input = new Input(byteArrayInputStream)) {
            Kryo kryo = kryoThreadLocal.get();
            // byte->Object: Giải tuần tự hóa đối tượng từ mảng byte
            Object o = kryo.readObject(input, clazz);
            kryoThreadLocal.remove();
            return clazz.cast(o);
        } catch (Exception e) {
            throw new SerializeException("Deserialization failed");
        }
    }

}
```

Địa chỉ GitHub: [https://github.com/EsotericSoftware/kryo](https://github.com/EsotericSoftware/kryo).

### Protobuf

Protobuf xuất phát từ Google, có hiệu năng khá xuất sắc, hỗ trợ nhiều ngôn ngữ và cũng chạy đa nền tảng. Điểm hạn chế là cách sử dụng hơi rườm rà vì bạn phải tự định nghĩa file IDL rồi sinh mã tuần tự hóa tương ứng. Cách này tuy kém linh hoạt hơn, nhưng mặt khác lại tránh được rủi ro lỗ hổng bảo mật giải tuần tự hóa ở Protobuf.

> Protobuf bao gồm định nghĩa định dạng tuần tự hóa, thư viện cho nhiều ngôn ngữ và một trình biên dịch IDL. Thông thường bạn cần định nghĩa các file `.proto`, sau đó dùng trình biên dịch IDL để biên dịch sang ngôn ngữ bạn cần.

Một file `.proto` đơn giản như sau:

```protobuf
// Phiên bản Protobuf
syntax = "proto3";
// SearchRequest sẽ được biên dịch thành đối tượng tương ứng ở các ngôn ngữ lập trình khác nhau, ví dụ class trong Java hoặc struct trong Go
message Person {
  // Trường kiểu string
  string name = 1;
  // Trường kiểu int
  int32 age = 2;
}
```

Địa chỉ GitHub: [https://github.com/protocolbuffers/protobuf](https://github.com/protocolbuffers/protobuf).

### ProtoStuff

Do Protobuf hơi khó dùng nên người anh em của nó là Protostuff đã ra đời.

Protostuff dựa trên Google Protobuf nhưng cung cấp nhiều tính năng hơn và cách dùng đơn giản hơn. Dù dễ dùng hơn nhưng không đồng nghĩa hiệu năng của ProtoStuff kém hơn.

Địa chỉ GitHub: [https://github.com/protostuff/protostuff](https://github.com/protostuff/protostuff).

### Hessian

Hessian là một giao thức RPC nhị phân gọn nhẹ, tự mô tả (self-describing). Hessian là một triển khai tuần tự hóa khá lâu đời và cũng hỗ trợ đa ngôn ngữ.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/8613ec4c-bde5-47bf-897e-99e0f90b9fa3-b63315b5.png)

Giao thức tuần tự hóa được bật mặc định trong Dubbo 2.x là Hessian2; tuy nhiên, Dubbo đã chỉnh sửa lại Hessian2, dù về đại thể cấu trúc vẫn tương tự.

### Tổng kết

Kryo là phương thức tuần tự hóa chuyên biệt cho ngôn ngữ Java với hiệu năng rất tốt; nếu ứng dụng của bạn thuần Java thì có thể cân nhắc sử dụng, và một bài viết trên trang chủ của Dubbo cũng từng khuyến nghị dùng Kryo làm phương thức tuần tự hóa cho môi trường production (địa chỉ bài viết: <https://cn.dubbo.apache.org/zh-cn/docsv2.7/user/serialization/>).

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/569e541a-22b2-4846-aa07-0ad479f07440-20230814090-66ad225f.png)

Các giải pháp như Protobuf, ProtoStuff, Hessian đều là phương thức tuần tự hóa đa ngôn ngữ; nếu có nhu cầu giao tiếp chéo ngôn ngữ thì có thể cân nhắc sử dụng.

Ngoài những phương thức tuần tự hóa đã giới thiệu ở trên, còn có các giải pháp khác như Thrift hay Avro.
