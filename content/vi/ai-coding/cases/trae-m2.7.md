---
title: "Thực chiến đa kịch bản Trae + MiniMax: Khắc phục sự cố Redis và tái cấu trúc xuyên ngôn ngữ"
description: "Sử dụng Trae IDE kết nối mô hình lớn MiniMax, thông qua hai tình huống thực tế gồm khắc phục sự cố Redis Connection Pool và tái cấu trúc mã nguồn Redis từ C sang Go, chia sẻ kinh nghiệm thực chiến và kỹ năng làm việc với AI hỗ trợ lập trình."
category: Thực chiến AI Coding
head:
  - - meta
    - name: keywords
      content: Trae,AI coding,AI IDE,khắc phục sự cố Redis,tái cấu trúc xuyên ngôn ngữ,Go,lập trình hỗ trợ bởi AI,lập trình với LLM
lang: vi
sourceRef: zh-ref/ai-coding/cases/trae-m2.7.md
---

Xin chào mọi người, mình là Tiểu G. Trước đó mình đã chia sẻ bài viết [Thực chiến đa kịch bản IDEA kết hợp plugin Qoder](./idea-qoder-plugin.md), bài đó chủ yếu bàn về việc dùng AI hỗ trợ viết code trong hệ sinh thái JetBrains. Bài này đổi một góc nhìn khác, cùng trò chuyện về trải nghiệm thực tế khi **kết nối Trae IDE với mô hình lớn (LLM)**.

Trae là AI IDE do ByteDance phát triển, dựa trên hệ sinh thái VS Code, hỗ trợ kết nối đa dạng các dòng mô hình lớn. Bài viết này lấy MiniMax M2.7 làm ví dụ minh họa, tuy nhiên phương thức kết nối của Trae mang tính phổ quát—dù bạn đổi sang Claude, GPT hay các mô hình khác thì quy trình cơ bản cũng tương tự.

Lý do mình dùng MiniMax ở đây chỉ vì mình vừa đăng ký gói MiniMax Code Plan và muốn đem ra kiểm thử thực tế, hoàn toàn không phải quảng cáo. Bạn có thể thay bằng các mô hình khác, tư duy và phương pháp đều hoàn toàn tương đồng.

Mình chọn hai kịch bản phức tạp mang tính đại diện cao để kiểm chứng thực tế:

- **Kịch bản 1**: API đột ngột báo lỗi timeout hàng loạt, log chỉ trỏ về Redis, nhưng trong dự án lại có quá nhiều nơi sử dụng Redis khiến việc định vị nguyên nhân gốc rễ (root cause) cực kỳ khó khăn.
- **Kịch bản 2**: Tái hiện toàn bộ tập lệnh truy vấn chậm (slow query / slowlog) của Redis từ mã nguồn C sang mã Go, thử thách năng lực tái cấu trúc xuyên ngôn ngữ và thấu hiểu ngữ cảnh.

## Nhập môn nhanh: Kết nối Trae với mô hình lớn

Trae hỗ trợ kết nối nhiều mô hình lớn khác nhau, dưới đây lấy việc thêm mô hình tùy chỉnh (custom model) làm ví dụ để thị phạm quy trình cấu hình chung.

**Bước 1**: Truy cập trang chủ Trae để tải về, cài đặt và hoàn tất các bước khởi tạo ban đầu, đồng thời truy cập nền tảng mô hình tương ứng để đăng ký và tạo API Key (bài viết này lấy nền tảng MiniMax làm ví dụ):

<https://platform.minimaxi.com/subscribe/token-plan>

**Bước 2**: Trong Trae, nhấp vào "Add Model" để thêm mô hình tùy chỉnh:

![Lối vào thêm mô hình trong Trae](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/trae-add-model-entry-f2f28610.png)

**Bước 3**: Chọn "Other Models" và nhập thủ công Model ID cùng API Key:

![Chọn Other Models](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/select-other-models-2932772a.png)

**Bước 4**: Nhập Model ID (ví dụ `MiniMax-M2.7`) và API Key vừa xin được, nhấp vào "Add Model". Nếu không xuất hiện thông báo lỗi tức là đã kết nối thành công:

![Nhập Model ID và API Key](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/input-minimax-m2.7-api-key-45b6864f.png)

Sau khi kết nối hoàn tất, bạn đã có thể sử dụng mô hình này trong Trae để hỗ trợ lập trình. Tiếp theo, thông qua hai kịch bản thực tế, mình sẽ chia sẻ phương thức sử dụng và những kỹ năng cụ thể.

## Kịch bản 1: "Cầm máu" khẩn cấp sự cố API timeout và định vị nguyên nhân gốc rễ

### Định vị sự cố

Ca thực tế đầu tiên là việc tái hiện lại một sự cố online có thật (đã được khử định danh dữ liệu nhạy cảm). Khi đó, các bạn trong nhóm phản ánh rằng một API truy vấn danh sách người dùng báo lỗi, trang web không load được dữ liệu. Hệ thống giám sát online khoanh vùng thông tin API như sau:

API: `GET http://localhost:8080/api/rbac/user/list`

Kết quả trả về:

```json
{
    "code": 500,
    "message": "系统繁忙，请稍后重试",
    "data": null,
    "timestamp": "2026-03-19T10:11:02.632242"
}
```

Kết hợp từ khóa trong Exception Stack Trace là `Read timed out`, cùng thao tác `get(key)` trong đoạn mã tương ứng, chúng ta có thể sơ bộ nhận định lỗi này chỉ là hiện tượng bề mặt chứ chưa phải nguyên nhân gốc rễ:

```java
@Override
public String getConfigValue(String configKey, String environment) {
    String cacheKey = CONFIG_CACHE_PREFIX + configKey + ":" + environment;
    String value = stringRedisTemplate.opsForValue().get(cacheKey);
    if (value != null) {
        return value;
    }
    // Logic phía sau được lược bớt
}
```

Theo quy trình xử lý thông thường, chúng ta cần nhanh chóng định vị nguyên nhân gốc rễ, thực hiện các biện pháp "cầm máu" (ngăn ngừa sự cố lan rộng), sau đó phối hợp với đội ngũ vận hành (Ops) điều tra sâu hơn. Nhưng trong dự án có quá nhiều nơi gọi Redis, việc rà soát thủ công từng chỗ mất rất nhiều thời gian, trong lúc đó có thể làm tổn hại đến tính ổn định của hệ thống.

Để kiểm chứng hiệu quả thực tế của AI trong việc hỗ trợ điều tra, mình tái hiện lại kịch bản sự cố này và giao cho mô hình xử lý. Theo quy trình xử lý sự cố online chuẩn doanh nghiệp, trước hết cần định vị nguyên nhân và "cầm máu" khẩn cấp. Vì vậy mình đưa ra chỉ thị đầu tiên cho mô hình:

```text
Đối với lỗi 500 xuất hiện khi truy cập API http://localhost:8080/api/rbac/user/list (thông báo lỗi: "Hệ thống bận, vui lòng thử lại sau"), hãy thực hiện các thao tác sau:
1. Phân tích thông tin stack trace ngoại lệ được cung cấp, định vị chính xác nguyên nhân gốc rễ dẫn đến lỗi nội bộ máy chủ;
2. Cung cấp phương án "cầm máu" khẩn cấp chi tiết trên production, bao gồm nhưng không giới hạn ở: chiến lược rollback tạm thời, biện pháp giới hạn lưu lượng (rate limiting), phương án hạ cấp dịch vụ (degradation/fallback) hoặc quy trình khởi động lại khẩn cấp;
3. Giải thích nguyên nhân kỹ thuật gây ra lỗi, chỉ rõ module code hoặc cấu hình cụ thể;

...... Thông tin then chốt từ stack trace ngoại lệ: `java.net.SocketTimeoutException: Read timed out`
```

![Ảnh chụp chỉ thị chẩn đoán gửi cho M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-diagnostic-instruction-e3bc63b8.png)

Mô hình sau khi nhận request đã rất nhanh chóng định vị được ngữ cảnh của đoạn code chỉ định và suy luận ra 4 nguyên nhân gốc rễ khả dĩ:

- Redis server bị treo (down) hoặc không phản hồi
- Cấu hình Connection Pool quá nhỏ, bị cạn kiệt (exhausted) khi tải đồng thời cao
- Rò rỉ kết nối Redis (kết nối không được giải phóng/đóng đúng cách)
- Tải trên Redis server quá cao

![Ảnh chụp kết quả suy luận của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-inference-result-232177a2.png)

Đến bước này, mô hình đã thu hẹp không gian bài toán từ "hàng chục chỗ gọi Redis" xuống còn "4 nguyên nhân tiềm tàng"—năng lực **nhanh chóng cô lập phạm vi sự cố** này chính là giá trị cốt lõi của việc dùng AI hỗ trợ xử lý sự cố. Tiếp theo, hãy xem mạch tư duy "cầm máu" của nó.

### Cầm máu sự cố

Mô hình nhắm vào các frame trong exception stack để phân tích nhanh logic gọi hàm, và chỉ ra rất chuẩn xác: API truy vấn danh sách bị một Aspect (AOP) chặn lại, và việc cạn kiệt Connection Pool chính là nguyên nhân gốc rễ của lỗi 500. Một điểm then chốt khác, nó chỉ ra đoạn code này đang thiếu chiến lược hạ cấp (fallback)—đây là điểm mà mãi tới buổi họp rút kinh nghiệm (post-mortem) mình mới nhận ra.

![Ảnh chụp phân tích chuỗi gọi code của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-call-chain-analysis-faa17a8e.png)

Đối với sự cố online, chiến lược "cầm máu" là khâu then chốt nhất. Mô hình đưa ra vài giải pháp, giải pháp đầu tiên là tạm thời tắt toggle kiểm tra phân quyền—bởi vì phương án một đòi hỏi xóa sạch dữ liệu cache trong Redis. Dù phương án này có phần hơi mạo hiểm, nhưng nó đã liệt kê chi tiết chuỗi gọi hàm và cấu trúc bảng, giúp mình phán đoán các tình huống nghiệp vụ khả dĩ.

![Phân tích chuỗi gọi hàm của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-call-chain-analysis-2-eed8537e.png)

Dựa trên thông tin chuỗi gọi do mô hình cung cấp, mình hỏi sâu thêm về cơ sở kỹ thuật của phương án một để đảm bảo hiểu đúng bản chất nghiệp vụ:

```bash
Kết hợp với quy trình phát triển mã nguồn hoàn chỉnh, hãy trình bày chi tiết cơ sở kỹ thuật, ý tưởng thiết kế và tính hợp lý khi triển khai của phương án một.
```

Đây cũng là điểm khiến mình tương đối hài lòng: mô hình đã xuất ra sơ đồ chuỗi gọi hàm của đoạn code gặp sự cố, giúp mình nhanh chóng nắm bắt toàn bộ các Aspect đi qua trong quá trình truy vấn danh sách và vị trí chính xác xảy ra lỗi, hỗ trợ đánh giá phạm vi ảnh hưởng cũng như nguyên nhân trực tiếp của ngoại lệ lần này.

Chưa đầy 10 phút tương tác, mình không chỉ nhanh chóng có được góc nhìn kiến trúc vĩ mô, hiểu rõ lỗi trong kiến trúc phức tạp hiện tại và cơ sở của từng phương án giải quyết, ví dụ phương án 1: né tránh việc kiểm tra quyền bằng cách sửa cấu hình database và khởi động lại để làm mới cache.

![Ảnh chụp sơ đồ chuỗi gọi hàm của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-call-chain-diagram-3a4c69b2.png)

Chúng ta hãy xem tiếp hướng tư duy của phương án 3: Khi Redis không khả dụng, sử dụng Local Cache hoặc giá trị mặc định để tránh lỗi lan chuyền (cascading failure). Mô hình kết hợp với đoạn code thực tế của dự án để đưa ra gợi ý chỉnh sửa:

![Đoạn code phương án 3 của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-solution-3-code-7896d94b.png)

Sau khi phân tích, chúng ta đã có phán đoán sơ bộ: Connection Pool của Redis client bị cạn kiệt, khiến logic đọc cấu hình kiểm tra quyền dựa trên cache bị sụp đổ, từ đó gây ra hiệu ứng tuyết lở (avalanche effect). Tổng hợp nhiều gợi ý của mô hình, trên nguyên tắc bảo thủ, cầm máu nhanh, và không làm sập database trong khung giờ cao điểm, kế hoạch hotfix sau đây được thống nhất:

```bash
Dựa trên các phương án được cung cấp, hãy tạo một nhánh hotfix để xử lý khẩn cấp ngoại lệ Redis. Các bước triển khai cụ thể như sau:
1. Dựa trên code production hiện tại tạo nhánh hotfix, đặt tên là "hotfix/redis-exception-handler"
2. Triển khai cơ chế bắt ngoại lệ Redis theo phương án 3, thêm khối try-catch tại toàn bộ các thao tác gọi Redis
3. Khi bắt được ngoại lệ Redis, tự động hạ cấp (fallback) sang truy vấn trực tiếp từ cơ sở dữ liệu
4. Triển khai cơ chế JVM Local Cache, lưu kết quả truy vấn vào bộ nhớ trong, thiết lập thời gian hết hạn (TTL) hợp lý
5. Hoàn thành unit test và integration test, độ bao phủ (coverage) phải đạt trên 80%
6. Chuẩn bị phương án rollback, đảm bảo có thể khôi phục nhanh về phiên bản trước trong tình huống khẩn cấp
```

![Chỉ thị phương án hotfix](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/hotfix-instruction-c0b08cee.png)

Mô hình sau khi nhận chỉ thị đã hiểu đúng vấn đề, hoàn thành việc bóc tách nhiệm vụ và từng bước thực thi:

![Quá trình bóc tách nhiệm vụ của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-task-breakdown-fd94e816.png)

Kết quả mã nguồn cuối cùng được xuất ra như sau: mô hình đã tích hợp luồng truy vấn hạ cấp xuống database ngay trong logic kiểm tra quyền ban đầu, việc hiểu logic kiểm tra quyền và tích hợp vào thiết kế phức tạp được thực hiện rất bài bản:

```java
@Around("permissionCheck()")
public Object checkPermission(ProceedingJoinPoint joinPoint) throws Throwable {
    try {
        // Đọc toggle kiểm tra quyền từ trung tâm cấu hình
        String checkEnabled = configService.getConfigValue("permission.check.enabled", "PROD");
        if (!"true".equalsIgnoreCase(checkEnabled)) {
            return joinPoint.proceed();
        }

        // ... logic kiểm tra quyền ban đầu ...

        // Thử lấy thông tin quyền từ Redis cache
        Boolean hasPermission = checkPermissionFromCache(redisKey);

        if (hasPermission != null) {
            // ... xử lý khi trúng cache (cache hit) ...
        }

        // Hạ cấp (fallback): truy vấn quyền từ cơ sở dữ liệu
        boolean hasPermissionFromDB = checkPermissionFromDatabase(userId, apiPath, httpMethod);
        // ... xử lý logic hạ cấp (fallback) ...

    } catch (Exception e) {
        if (e instanceof RuntimeException && "无权限访问".equals(e.getMessage())) {
            throw e;
        }
        // Khi xảy ra ngoại lệ, kích hoạt cảnh báo giám sát và áp dụng chiến lược thận trọng cho phép đi qua
        AlertManager.notify("PERMISSION_CHECK_ERROR", e.getMessage());
        return joinPoint.proceed();
    }
}
```

Hàm `getConfigValue` cũng được bổ sung logic Local Cache tương tự; thiết kế bộ nhớ đệm đa tầng (multi-level cache) này xử lý khả năng chịu lỗi rất tốt.

```java
/**
 * Lấy giá trị cấu hình (môi trường chỉ định)
 */
@Override
public String getConfigValue(String configKey, String environment) {
    String cacheKey = CONFIG_CACHE_PREFIX + configKey + ":" + environment;

    // 【Bước 1: Thử lấy từ local cache】
    String localValue = localCacheManager.get(cacheKey);
    if (localValue != null) {
        return localValue;
    }

    // 【Bước 2: Thử lấy từ Redis】
    try {
        if (isRedisAvailable()) {
            String value = stringRedisTemplate.opsForValue().get(cacheKey);
            if (value != null) {
                localCacheManager.put(cacheKey, value, LOCAL_CACHE_TTL);
                return value;
            }
        }
    } catch (Exception e) {
        // Ngoại lệ Redis, hạ cấp xuống cơ sở dữ liệu
        handleRedisFailure(e);
    }

    // 【Bước 3: Hạ cấp xuống cơ sở dữ liệu】
    // ... logic khác ...
    return getConfigValueFromDatabaseWithFallback(configKey, environment);
}
```

Một chi tiết rất đáng khen là thiết kế của Local Cache: mô hình áp dụng nguyên lý Đóng/Mở (Open-Closed Principle), dựa trên `ConcurrentHashMap` để đóng gói một utility cache cục bộ, tính toán đến nguy cơ tràn bộ nhớ Heap (OOM) và tích hợp thuật toán LRU để dọn dẹp bộ nhớ đệm:

```java
@Component
public class LocalCacheManager {
    // Lưu trữ cốt lõi: ConcurrentHashMap đảm bảo thread-safe
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanupExecutor;

    // Cấu hình cache
    private static final long DEFAULT_TTL_MILLIS = 300000; // 5 phút
    private static final long MAX_CACHE_SIZE = 10000;

    public LocalCacheManager() {
        // Daemon thread thực thi dọn dẹp định kỳ
        this.cleanupExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "local-cache-cleanup");
            t.setDaemon(true);
            return t;
        });
        this.cleanupExecutor.scheduleAtFixedRate(this::cleanupExpiredEntries, 1, 1, TimeUnit.MINUTES);
    }

    public void put(String key, String value) {
        put(key, value, DEFAULT_TTL_MILLIS);
    }

    public void put(String key, String value, long ttlMillis) {
        // Kích hoạt dọn dẹp LRU khi đầy dung lượng
        if (cache.size() >= MAX_CACHE_SIZE) {
            cleanupExpiredEntries();
            if (cache.size() >= MAX_CACHE_SIZE) {
                evictOldestHalf();
            }
        }
        cache.put(key, new CacheEntry(value, System.currentTimeMillis() + ttlMillis));
    }

    public String get(String key) {
        CacheEntry entry = cache.get(key);
        if (entry == null || entry.isExpired()) {
            cache.remove(key);
            return null;
        }
        return entry.getValue();
    }

    // ... lược bớt các phương thức khác ...

    // Dọn dẹp LRU: xóa 50% dữ liệu cũ nhất
    private void evictOldestHalf() {
        // ...... lược bớt logic sắp xếp và dọn dẹp ......
    }

    // Mục bản ghi cache
    private static class CacheEntry {
        private final String value;
        private final long expirationTime;

        public CacheEntry(String value, long expirationTime) {
            this.value = value;
            this.expirationTime = expirationTime;
        }

        public String getValue() {
            return value;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expirationTime;
        }
    }
}
```

### Định vị nguyên nhân gốc rễ

Sau khi hoàn tất việc "cầm máu" sự cố online thông qua nhánh hotfix, chúng ta mới bắt đầu đào sâu điều tra lý do tại sao Redis Connection Pool lại bị cạn kiệt. Dựa theo phán đoán và suy luận của mô hình, một lệnh `get` thông thường đối chiếu với mức hiệu năng 100.000 QPS của Redis, với 10 kết nối (trung bình mỗi lệnh 1~2ms), trong điều kiện lý tưởng có thể xử lý khoảng 6.600 lệnh/giây, thấp hơn rất nhiều so với giới hạn của Redis. Do đó vấn đề chắc chắn nằm ở tầng code, chúng ta cần truy xét xem trong dự án có thao tác Redis nào bất hợp lý hay không:

```bash
Kết hợp với hiện tượng và đặc trưng cụ thể của sự cố lần này, hãy tiến hành phân tích toàn cục có hệ thống đối với toàn bộ dự án. Phạm vi phân tích cần bao quát kiến trúc dự án, triển khai mã nguồn, quản lý phụ thuộc, cấu hình môi trường, tương tác dữ liệu, tập trung nhận diện và chỉ ra nguyên nhân trực tiếp dẫn đến sự cố production.
```

![Chỉ thị phân tích toàn cục cho M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-global-analysis-instruction-7cf22872.png)

Lúc này, mô hình bắt đầu đọc hiểu và suy luận chi tiết dựa trên toàn bộ cấu trúc dự án và ngữ cảnh:

![Phân tích cấu trúc dự án của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-project-structure-analysis-3f497d6f.png)

Cuối cùng, mô hình xuất ra báo cáo phân tích sự cố chi tiết, chỉ rõ nguyên nhân gốc rễ: Việc thiết kế cấu trúc dữ liệu Redis không phù hợp dẫn đến việc sử dụng lệnh `scan`, làm tắc nghẽn (hang) toàn bộ Connection Pool. Đồng thời, nó còn kết hợp ngữ cảnh để đưa ra luồng nghiệp vụ của thao tác đó, giúp chúng ta hiểu ngay chuỗi sự cố này:

![Phân tích nguyên nhân gốc rễ của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-root-cause-analysis-81c7eb27.png)

Và giải pháp đưa ra cũng rất dứt khoát: tối ưu hóa cấu trúc dữ liệu để giảm độ phức tạp thời gian của các thao tác đọc ghi Redis, triệt tiêu nguy cơ nghẽn Connection Pool:

![Gợi ý phương án tối ưu của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-optimization-suggestion-a8279b21.png)

Trải nghiệm tổng thể ở Kịch bản 1 rất ấn tượng. Từ vô số điểm gọi Redis khoanh vùng chính xác nguyên nhân, đến việc đưa ra phương án cầm máu toàn diện, toàn bộ chuỗi suy luận đều sáng tỏ, chặt chẽ.

Tuy nhiên cũng phát hiện một số hạn chế: Phương án 1 nó đưa ra (xóa sạch cache Redis) hơi quá mạo hiểm, trong môi trường production thực tế cần giải pháp bảo thủ hơn. Ngoài ra, code phòng vệ cho các trường hợp biên vẫn cần con người bổ sung—AI có thể giúp bạn đi 90% chặng đường, 10% còn lại bạn vẫn phải tự chịu trách nhiệm.

## Kịch bản 2: Tái cấu trúc xuyên ngôn ngữ từ mã nguồn Redis C sang Go

### Bối cảnh

Tiếp theo, chúng ta cùng đến với một kịch bản độ khó cao hơn—tái hiện lệnh Slow Query (truy vấn chậm) của Redis. `mini-redis` là middleware lưu trữ đệm bằng Go áp dụng triết lý goroutine-per-connection để tăng thông lượng, đồng thời hiện thực theo phong cách C nhằm tuân thủ giao thức RESP. Do hai ngôn ngữ có sự khác biệt về triết lý thiết kế, bài toán này đòi hỏi việc bóc tách logic phức tạp và hiện thực hóa trên kiến trúc dị thể—cực kỳ phù hợp để kiểm chứng năng lực thiết kế kiến trúc xuyên ngôn ngữ của mô hình lớn.

### Bóc tách yêu cầu và thiết kế giải pháp

Đối với các bài toán tái cấu trúc dự án, theo quy trình truyền thống, chúng ta tốn rất nhiều thời gian đọc mã nguồn để nắm logic, trong khi mã cũ không có comment đòi hỏi phải suy luận debug theo ngữ cảnh. Sau khi hiểu logic cũ, lại phải kết hợp kiến trúc dự án mới để lập kế hoạch triển khai, rồi viết unit test để đảm bảo logic hiện tại hoạt động ổn định. Toàn bộ quy trình (từ dev, test đến release) ước tính dè dặt cũng mất 3 ngày làm việc. Với tinh thần thử nghiệm, mình giao phó khâu đọc mã nguồn và viết tài liệu kỹ thuật cho AI.

```bash
Tôi hiện cần tái hiện tập lệnh truy vấn chậm (slowlog) của Redis bằng ngôn ngữ Go. Vui lòng đọc kỹ mã nguồn Redis, hiểu sâu sắc toàn bộ nguyên lý hiện thực, thiết kế cấu trúc dữ liệu, quy trình xử lý và các bước then chốt của tính năng slowlog. Cụ thể bao gồm nhưng không giới hạn ở: cơ chế lưu trữ slowlog, cấu hình và điều chỉnh ngưỡng slowlog, quy trình thu thập và ghi nhận lệnh slowlog, thiết kế và triển khai các API liên quan, cùng phương thức truy vấn và hiển thị thông tin slowlog. Dựa trên những hiểu biết đó, hãy biên soạn một tài liệu kỹ thuật rõ ràng, bao gồm giải thích nguyên lý cốt lõi, phân tích cấu trúc dữ liệu then chốt, bóc tách các bước triển khai và những lưu ý tối ưu hiệu năng khả dĩ.
```

Chỉ sau ít phút, mô hình đã nêu bật các yêu cầu kỹ thuật, giới thiệu từ cấu trúc dữ liệu cơ bản cho đến chuỗi thực thi từ dưới lên trên (bottom-up), thực hiện phân tích vô cùng cặn kẽ:

![Phân tích cấu trúc dữ liệu slowlog của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-slowlog-data-structure-6448d884.png)

Kiểm tra vị trí Aspect ghi nhận slowlog được nó định vị rất chuẩn xác, các comment cần thiết được thêm vào luồng chính giúp mình nhanh chóng nắm bắt bức tranh toàn cảnh:

![Logic Aspect của slowlog qua M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-slowlog-aspect-logic-166e8f4e.png)

Xem tiếp cách nó hiểu về lệnh `slot get`, cũng rất chuẩn mực, tư duy giống hệt một senior developer: nắm bắt cái lớn, buông cái nhỏ, làm rõ logic cốt lõi và chú thích cẩn thận vào luồng chính:

![Phân tích lệnh slot get qua M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-slot-get-instruction-cd53d1dd.png)

Sau khi xác nhận mô hình đã hiểu đúng về slowlog, mình yêu cầu nó đóng vai trò chuyên gia phát triển để lập tài liệu thiết kế hoàn chỉnh: bóc tách chức năng, triển khai mã nguồn và kiểm thử hồi quy:

```bash
Tuân thủ phương pháp luận Phát triển hướng kiểm thử (TDD), sử dụng ngôn ngữ Go để tạo một tài liệu hướng dẫn phát triển toàn diện và chi tiết, dẫn dắt việc tái hiện Redis. Bản hướng dẫn phải tuân thủ các quy chuẩn sau:

1. Phương pháp phát triển:
   - Thực thi nghiêm ngặt quy trình TDD: viết test thất bại trước, sau đó viết code tối thiểu để pass test, cuối cùng tiến hành refactor
   - Áp dụng phong cách lập trình hướng thủ tục tương tự như mã C ban đầu của Redis
   - Tối đa hóa việc sử dụng cú pháp Go thuần và thư viện chuẩn

2. Cấu trúc tài liệu:
   - Bắt đầu từ hướng dẫn thiết lập dự án và cấu hình môi trường
   - Bóc tách thành các module logic theo chức năng của Redis
   - Đối với mỗi module/tính năng, cung cấp:
     a. Định nghĩa test case rõ ràng, gồm input và output kỳ vọng
     b. Triển khai code từng bước, kèm giải thích từng dòng
     c. Lệnh test rõ ràng và quy trình xác thực
     d. Kết quả test kỳ vọng và tiêu chí thành công

3. Yêu cầu kỹ thuật:
   - Bao gồm toàn bộ các đoạn code hoàn chỉnh cho mọi component
   - Chỉ định chính xác cấu trúc file và quy ước đặt tên
   - Thuyết minh chi tiết các lệnh biên dịch và kiểm thử
   - Giải thích quy trình debug các vấn đề thường gặp
   - Khi thích hợp, dẫn chiếu tới các pattern tương ứng trong mã nguồn C của Redis

4. Chi tiết triển khai:
   - Bắt đầu từ các cấu trúc dữ liệu cốt lõi (string, list, hash...)
   - Từng bước tiến tới xử lý lệnh và giao thức
   - Bao gồm tầng mạng và giao tiếp client-server
   - Bao gồm cơ chế lưu trữ bền vững (RDB/AOF)
   - Triển khai các lệnh Redis cơ bản theo cùng khuôn mẫu hành vi

5. Yêu cầu kiểm thử:
   - Cung cấp mã test đầy đủ cho từng component
   - Giải thích assertion và phương pháp xác thực
   - Bao gồm unit test và integration test
   - Chỉ dẫn cách chạy test và đọc hiểu kết quả
   - Thuyết minh chi tiết cách xác thực hành vi chuẩn xác theo đặc tả của Redis

Bản hướng dẫn phải đủ toàn diện để một lập trình viên có kiến thức Go trung cấp có thể làm theo và xây dựng thành công một hệ thống tương tự Redis.
```

Chờ đợi một lúc, chúng ta nhận được một tài liệu thiết kế chi tiết. Mô hình kết hợp ngữ cảnh mã nguồn Redis để phác thảo các mạch ngầm cốt lõi và định nghĩa trọng yếu của slowlog, đồng thời lập kế hoạch đầy đủ cho các bước phát triển:

![Tài liệu thiết kế slowlog](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-slowlog-design-doc-3dacedc4.png)

### Viết code triển khai

Sau khi trích xuất tài liệu thiết kế từ mã nguồn Redis, để đảm bảo tư duy thiết kế của dự án C có thể hạ cánh chuẩn xác vào quy chuẩn dự án Go của cá nhân, mình sao chép tài liệu vào dự án `mini-redis`, yêu cầu mô hình phân tích tính khả thi và đưa ra gợi ý chỉnh sửa:

![Phân tích tính khả thi của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-feasibility-analysis-4f0486b1.png)

Sau khi mô hình hoàn thành phân tích khả thi và sắp xếp lại tài liệu, chúng ta tiến hành rà soát lại phương án thiết kế. Từ phần tổng quan, mô hình đã phân tích cấu trúc dự án `mini-redis`, định vị chính xác cấu trúc danh sách liên kết (linked list struct) có thể tái sử dụng trực tiếp cho slowlog và tinh chỉnh tài liệu:

![Phân tích struct danh sách liên kết qua M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-linked-list-structure-c0f0cf51.png)

Xem tiếp ý tưởng hiện thực cấu trúc dữ liệu then chốt nhất, mô hình cũng kết hợp với quy chuẩn của `mini-redis` để sinh ra struct chuẩn phong cách Go:

![Struct phong cách Go của M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-go-style-struct-61844029.png)

Đối với việc đo thời gian thực thi của slowlog, có một chi tiết rất đáng nói. Điểm vào xử lý lệnh do cá nhân mình triển khai có đôi chút khác biệt với Redis nguyên bản: do đặc tính cú pháp của Go, mình đã xử lý đặc biệt đối với con trỏ (pointer), hàm trả về con trỏ và bố cục file. Mô hình đã dựa vào mô hình goroutine của mình để định vị chuẩn xác Aspect đo thời gian, thêm bộ đếm giờ phía trước và thống kê phía sau, hiện thực hóa việc giám sát truy vấn chậm:

![Aspect đo thời gian qua M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-time-measurement-aspect-c2e6c581.png)

Cuối cùng là việc triển khai tập lệnh slowlog cốt lõi, từ phân tích tham số cho đến hàm xử lý truy vấn và phản hồi, mô hình đều bám sát các logic đã được đóng gói trong dự án để đưa ra giải pháp viết code rõ ràng:

![Triển khai lệnh slowlog qua M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-slowlog-command-implementation-cc8c097c.png)

Qua rà soát kỹ lưỡng tài liệu thiết kế, ý tưởng tổng thể cơ bản là đồng nhất, nhưng trong chi tiết tổ chức mã nguồn vẫn có điểm cần tinh chỉnh—ví dụ mô hình tách riêng lệnh `slowlog` ra một file độc lập thay vì gom vào file `command.go` theo thói quen của dự án. Xét thấy slowlog không phải là lệnh đọc ghi bộ nhớ cốt lõi và logic quản lý log của nó tương đối độc lập, cách tổ chức này cũng là một sự thỏa hiệp chấp nhận được. Cân nhắc kỹ, mình quyết định giữ lại cấu trúc của mô hình, đồng thời tinh chỉnh thủ công một số bố cục file để khớp với quy chuẩn hiện có, sau đó tiến hành các phần việc phát triển còn lại.

Chi tiết này cũng minh chứng rằng: Kiến trúc code do AI sinh ra tuy hợp lý, nhưng việc khớp nối với quy chuẩn công trình sẵn có vẫn đòi hỏi con người phải trực tiếp kiểm tra và đánh giá.

Bên cạnh đó, trong suốt quá trình viết code cho slowlog, mô hình có 2 lần sinh ra code không đúng phong cách của dự án (chẳng hạn như cách xử lý lỗi), bắt buộc phải can thiệp sửa tay. Đây không phải lỗi nghiêm trọng, nhưng chứng minh việc phó mặc 100% cho AI sinh code là điều không tưởng.

### Nghiệm thu

Vì mình đã chỉ định rõ mô hình phát triển TDD, nên mô hình trong suốt quá trình này đã tự vận hành vòng lặp tự sửa lỗi (self-healing) dựa trên feedback từ test và tài liệu hướng dẫn, cuối cùng kết hợp phong cách của `mini-redis` để hoàn thành việc tái hiện lệnh slowlog.

Nhờ vào khả năng suy luận và tái cấu trúc của AI, trong quá trình nghiệm thu chúng ta có nhiều không gian để triển khai thêm các ý tưởng. Trước đây, do chi phí đọc hiểu mã nguồn và nghiệm thu kỹ thuật quá lớn, nên logic nạp cấu hình `redis.conf` vẫn chưa được triển khai.

Do mình cần đặt thời gian slowlog về 0 để tiện nghiệm thu lệnh slowlog, nên mình tiện thể yêu cầu nó viết luôn tính năng nạp file cấu hình:

![Triển khai nạp cấu hình qua M2.7](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/m2.7-config-loading-c87b29d2.png)

Toàn bộ quá trình bóc tách logic và phát triển chỉ mất chưa đầy 1 giờ, mình đã hoàn thành trọn vẹn việc tái hiện và nghiệm thu lệnh slowlog. Để demo tính năng, mình cấu hình ngưỡng slowlog của `mini-redis` về 0:

```bash
# Ngưỡng truy vấn chậm (microsecond)
# Các lệnh có thời gian thực thi vượt quá giá trị này sẽ được ghi vào slow log
# Giá trị âm để vô hiệu hóa slow log, 0 để ghi lại toàn bộ các lệnh
# Giá trị mặc định: 10000 (10 millisecond)
slowlog-log-slower-than 0
```

Khởi động server `mini-redis`, gõ lệnh `slowlog get`, mặc định trả về danh sách rỗng:

![Trạng thái ban đầu của slowlog get](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/slowlog-get-initial-state-fbe64eda.png)

Thực hiện một lệnh `set` đơn giản, sau đó gõ `slowlog get`, lệnh này ngay lập tức được xác định là slow query và xuất ra đúng như kỳ vọng:

![slowlog get ghi nhận lệnh set](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/slowlog-get-record-set-command-6e448204.png)

Tương tự, chúng ta gõ tiếp vài lệnh tiếp theo, toàn bộ đều được chèn vào đầu danh sách liên kết một cách chuẩn xác, xuất ra theo thứ tự thời gian giảm dần:

![slowlog get nhiều bản ghi](/media/jg/ext/oss.javaguide.cn/ai/coding/m2.7/slowlog-get-multiple-records-7f8923b7.png)

## Tổng kết thực chiến: Suy ngẫm về workflow lập trình hỗ trợ bởi AI

Thông qua thực chiến ở hai kịch bản điển hình, mình đúc kết lại một số kinh nghiệm và suy ngẫm khi sử dụng Trae + LLM hỗ trợ viết code.

### AI hỗ trợ lập trình có thể làm được những gì?

Trong hai kịch bản trên, AI đã thể hiện rõ các năng lực cốt lõi:

| Chiều không gian năng lực | Thể hiện trong kịch bản | Thuyết minh |
| --- | --- | --- |
| Chẩn đoán và cầm máu sự cố | Kịch bản 1: Định vị nhanh lỗi Connection Pool, đề xuất giải pháp hạ cấp | Chuỗi suy luận hoàn chỉnh, bóc tách từ exception stack đến chuỗi gọi hàm |
| Hiểu ngữ cảnh mã nguồn | Kịch bản 1: Kết hợp Database Schema phân tích điểm nghẽn truy vấn | Không giới hạn trong một file đơn lẻ, liên kết được phụ thuộc xuyên module |
| Chuyển đổi mã xuyên ngôn ngữ | Kịch bản 2: Tái hiện slow query từ C sang Go | Logic cốt lõi chuẩn xác, sự thích ứng với quy chuẩn công trình cần tinh chỉnh |
| Đọc hiểu hệ thống phức tạp | Kịch bản 2: Phân tích mã nguồn Redis | Nắm bắt được ý đồ thiết kế, xuất ra tài liệu kỹ thuật có cấu trúc |

### Kinh nghiệm thực tế và những "hố" cần tránh

**Điểm làm tốt**:

- **Thu hẹp phạm vi bài toán cực nhanh**: Ở kịch bản 1, mô hình từ vô số điểm gọi Redis đã nhanh chóng khoanh vùng 4 nguyên nhân khả dĩ, rồi xác định chính xác thao tác `scan` làm treo Connection Pool; toàn bộ chuỗi suy luận rất mạch lạc.
- **Xuất phương án đa tầng**: Phương án cầm máu, phân tích nguyên nhân gốc rễ, gợi ý tối ưu dài hạn được phân tầng rõ ràng, đúng chuẩn quy trình xử lý sự cố thực tế.
- **Vòng lặp TDD tự sửa lỗi**: Ở kịch bản 2, khi áp dụng TDD, mô hình có thể tự sửa lỗi dựa trên feedback từ bài test, giảm thiểu tối đa sự can thiệp thủ công.

**Điểm cần đặc biệt chú ý**:

- **Phương án có thể quá mạo hiểm**: Một số phương án mô hình đưa ra (như xóa sạch cache Redis) có thể quá liều lĩnh; môi trường production luôn cần chiến lược an toàn và bảo thủ hơn, điều này bắt buộc con người phải cầm trịch.
- **Khớp nối quy chuẩn dự án**: Cấu trúc code sinh ra tuy hợp lý, nhưng mức độ hòa hợp với quy chuẩn sẵn có của cá nhân/đội ngũ vẫn cần gọt giũa (ví dụ bố cục file cho lệnh `slowlog`).
- **Xử lý tình huống biên**: Khuyến nghị con người tự tay bổ sung code phòng vệ cho các trường hợp biên ngặt nghèo—AI có thể giúp bạn 90%, 10% còn lại bạn phải tự chịu trách nhiệm.
- **Tính nhất quán trong quy trình dài**: Trong quá trình lặp liên tục ở các dự án lớn, cần hết sức chú ý đến hiện tượng suy giảm bộ nhớ ngữ cảnh.

### Lời khuyên khi dùng Trae + LLM

1. **Cung cấp ngữ cảnh đầy đủ**: Nêu rõ các điều kiện ràng buộc, quy chuẩn viết code, cấu trúc dự án; chất lượng đầu ra của mô hình sẽ tốt hơn rất nhiều.
2. **Xác nhận theo từng giai đoạn**: Với kiến trúc phức tạp, đừng để AI sinh ra quá nhiều code trong một lần; hãy chia nhỏ thành từng chặng để xác nhận và điều chỉnh, mọi thứ sẽ trong tầm kiểm soát hơn.
3. **Quyết định then chốt do con người nắm giữ**: Các lựa chọn ở tầng kiến trúc (như chiến lược cache, giải pháp fallback) đòi hỏi lập trình viên phải tự phán đoán theo bối cảnh nghiệp vụ; AI không thể quyết định thay bạn.
4. **Tận dụng tối đa mô hình TDD**: Chỉ định quy trình phát triển hướng kiểm thử, để mô hình tự sửa lỗi dựa trên phản hồi của test case, hiệu suất sẽ cao hơn hẳn.

## Lời kết

Trae với tư cách là một AI IDE, khi kết nối với mô hình lớn đem lại trải nghiệm tương đối mượt mà—chế độ Agent hình thành một workflow trọn vẹn từ hiểu ngữ cảnh, bóc tách nhiệm vụ, sinh mã nguồn đến nghiệm thu kiểm thử.

Thế nhưng công cụ rốt cuộc vẫn chỉ là công cụ. Nhìn lại hai tình huống trong bài viết:

- **Khắc phục sự cố Redis ở kịch bản 1**: Đòi hỏi bạn phải hiểu rõ cơ chế Connection Pool của Redis, độ phức tạp thời gian của lệnh `scan`, thì mới đánh giá được phân tích của mô hình có đúng đắn hay không.
- **Tái cấu trúc xuyên ngôn ngữ ở kịch bản 2**: Đòi hỏi bạn phải hiểu sâu triết lý thiết kế mã nguồn của Redis, nắm vững quy chuẩn công trình của ngôn ngữ Go, thì mới thẩm định được chất lượng phương án tái cấu trúc.

Các công cụ lập trình AI giúp rút ngắn thời gian "từ ý tưởng đến dòng code", nhưng việc làm chủ các nguyên lý nền tảng và năng lực phán đoán kiến trúc hệ thống vẫn luôn đòi hỏi chính lập trình viên phải tự tích lũy. Tiên quyết để dùng tốt AI là bạn phải hiểu rõ những gì mình đang làm hơn cả chính AI.
