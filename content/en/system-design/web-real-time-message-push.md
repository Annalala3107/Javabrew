---
title: Real-Time Web Message Push Explained
description: Message push generally refers to proactive delivery of notifications by site operators or backend systems through specific tools to users' active web pages or mobile apps.
category: System Design
icon: "mdi:message-text-outline"
head:
  - - meta
    - name: keywords
      content: Web Message Push,Real-Time Messaging,WebSocket,SSE,Long Polling,Short Polling,MQTT,Real-Time Communication Solutions
lang: en
sourceRef: zh-ref/system-design/web-real-time-message-push.md
---

> Original source: <https://juejin.cn/post/7122014462181113887>. JavaGuide expanded and refined this article.

A friend of mine built a small site and now wants to implement an in-site Web message push feature—yes, the little red notification dot shown below, which is a very common requirement.

![In-Site Web Message Push](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192380-7cc1157c.png)

However, he hasn't decided which approach to use yet. Here, I've organized several common solutions for him along with simple implementations.

## What Is Message Push?

Push scenarios are quite common. For example, when someone follows my WeChat Official Account, I receive a push notification to entice me to click and open the app.

Message push usually refers to website operators or backend systems proactively pushing messages to a user's current web page or mobile app through some mechanism.

Message push is generally divided into Web-side push and mobile-side push.

Mobile message push example:

![Mobile Message Push Example](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/IKleJ9auR1Ojdicyr0bH-afbbb01a.png)

Web message push example:

![Web Message Push Example](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/image-20220819100512941-836cf383.png)

Before diving into implementation, let's analyze the requirement mentioned earlier. The feature itself is straightforward: whenever a specific event is triggered (such as actively sharing a resource or the backend proactively pushing a message), the red notification dot on the web page should increment by `+1` in real time.

Typically, the server maintains several message push tables to record different types of messages pushed when users trigger different events, while the frontend either proactively queries (pulls) or passively receives (pushes) the user's total unread message count.

![Message Push Tables](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192384-64f10f85.png)

Message push boils down to two modes: push and pull. Let's explore each solution one by one below.

## Common Message Push Solutions

![Web Real-Time Message Push Solutions Overview](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/web-real-time-message-push-overview-e042ff41.webp)

### Short Polling

**Polling** is arguably the simplest approach to implement message push. Here, we divide polling into short polling and long polling.

Short polling is easy to understand: at a fixed time interval, the browser sends an HTTP request to the server, the server immediately returns the unread message data to the client, and the browser renders and displays it.

A simple JS timer gets the job done—requesting the unread message count endpoint once per second and displaying the returned data.

```typescript
setInterval(() => {
  // Execute request
  messageCount().then((res) => {
    if (res.code === 200) {
      this.messageCount = res.data;
    }
  });
}, 1000);
```

It works reasonably well, and short polling is certainly easy to implement, but its drawbacks are obvious. Because push data does not change frequently, the client sends requests regardless of whether the backend has produced any new messages. This puts heavy pressure on the server and wastes bandwidth and server resources.

### Long Polling

Long polling is an improved version of short polling that wastes fewer server resources while preserving relative real-time delivery. Long polling is widely used in middleware—for instance, Nacos and Apollo configuration centers, as well as message queues like Kafka and RocketMQ, all use long polling.

In [Is the Nacos Configuration Center Interaction Model Push or Pull?](https://mp.weixin.qq.com/s/94ftESkDoZI9gAGflLiGwg), I explained the implementation principles of Nacos long polling in detail—feel free to check it out if you're interested.

In principle, long polling is similar to regular polling in that it still polls repeatedly. However, if the server-side data has not changed, the server holds the request open until the data changes or a timeout period expires before returning a response. Once the response returns, the client immediately initiates the next long-polling request.

Here, I adopt the approach used by the Apollo configuration center to implement long polling via the `DeferredResult` class—an asynchronous request mechanism introduced in Servlet 3.0 and wrapped by Spring, literally meaning "deferred result."

![Long Polling Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192386-bdec04a2.png)

`DeferredResult` lets the container release the Servlet thread handling the current request first, and later any thread chosen by the application, a message callback, or another event source can call `setResult()` to resume response processing. `DeferredResult` itself does not automatically spawn a worker thread; which thread executes the actual business logic is decided by the application.

Below, let's implement message push using long polling.

Because one ID may be watched by multiple long-polling requests, I use Guava's `Multimap` structure to hold the long-polling requests, where one key can map to multiple values. Once a change is detected for that key, all corresponding long-polling requests respond. After receiving the new version number, the frontend proactively queries the unread message count API and updates the page data.

```java
@Controller
@RequestMapping("/polling")
public class PollingController {

    // Stores the collection of long-polling requests watching a given ID
    // Thread-synchronized structure
    private static final Multimap<String, DeferredResult<String>> watchRequests =
            Multimaps.synchronizedMultimap(HashMultimap.create());
    // In-memory version number for demonstration; production environments should typically use the persistent version of the business data itself
    private static final Map<String, Long> versions = new HashMap<>();

    /**
     * Register a watcher
     */
    @GetMapping(path = "watch/{id}")
    @ResponseBody
    public DeferredResult<String> watch(@PathVariable String id,
                                        @RequestParam(defaultValue = "0") long version) {
        // Set timeout on the deferred object
        DeferredResult<String> deferredResult = new DeferredResult<>(TIME_OUT, "timeout");
        // Remove entry upon async request completion to prevent memory leaks
        deferredResult.onCompletion(() -> {
            watchRequests.remove(id, deferredResult);
        });
        // Version comparison and watcher registration must be in the same critical section to prevent lost notifications if a publish occurs in between
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
     * Mutate data
     */
    @PostMapping(path = "publish/{id}")
    @ResponseBody
    public String publish(@PathVariable String id) {
        // Update version first, then remove and copy the watcher snapshot inside the same synchronized block
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

Here, when `DeferredResult` times out, it returns the agreed `"timeout"` result; upon receiving it, the frontend immediately initiates the next long-polling request carrying the original version number. When a new version number is received, the frontend first queries the latest business data and then uses that new version number for the next watch request. Version comparison, watcher registration, and version increment on publish are all performed inside the same critical section, so even if an update happens right between two handoff requests, the next watch will immediately detect the version change. The in-memory versions in the example are lost on process restart; production environments should prefer persistent identifiers such as database versions or message offsets and design a cleanup strategy.

Do not use HTTP 304 as a generic "request timeout" status: 304 is specifically meant for conditional requests to indicate that a cached representation has not been modified, and it must not contain a response body. Production projects can agree on a no-content status like 204 instead—the key is keeping the server and client consistent on timeout semantics.

Let's test this: first, the page sends a long-polling request with a known version `/polling/watch/10086?version=0` to watch for message changes, and the request is suspended; next, we manually mutate the data via `/polling/publish/10086`, and the long-polling request returns the new version. After querying the latest data, the frontend initiates the next request with the new version, repeating the cycle.

Long polling improves performance significantly compared to short polling, though it still generates a fair number of requests—which is a slight imperfection.

### iframe Streaming

iframe streaming works by inserting a hidden `<iframe>` tag into the page and setting its `src` to the message count API endpoint, thereby establishing a persistent connection between the server and client over which the server continuously transmits data to the `iframe`.

The transmitted data is typically HTML or embedded JavaScript snippets to achieve real-time page updates.

![iframe Streaming Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192388-e3aa613f.png)

This approach is simple to implement—on the frontend, a single `<iframe>` tag does the trick:

```html
<iframe src="/iframe/message" style="display:none"></iframe>
```

The server needs to keep the response open, write whenever new data arrives, and flush the buffer promptly. Never use a busy `while (true)` loop without waiting, interruption handling, or exception handling inside a Servlet request thread to continuously write responses: doing so spins CPU, ties up container threads for long periods, and fails to clean up gracefully when the client disconnects. If you must maintain legacy iframe streaming, use the container's asynchronous I/O and an event-driven write model; new systems should generally choose SSE or WebSocket directly.

iframe streaming incurs high server overhead, and browsers like IE and Chrome stay stuck in a loading state with the tab spinner rotating endlessly—a nightmare for anyone with OCD.

![iframe Streaming Effect](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192389-5e02d5b3.gif)

iframe streaming provides a very poor user experience and is strongly discouraged.

### SSE (Recommended)

Many people may not realize that besides the well-known `WebSocket` mechanism, there is another way for a server to push messages to clients: Server-Sent Events, abbreviated as SSE. It provides unidirectional message pushing from the server to the client (browser).

Streaming chat is a classic use case for SSE. The server can continuously write partially generated content into the event stream, allowing users to see results without waiting for the entire computation to finish.

![ChatGPT Using SSE for Conversations](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/chatgpt-sse-ef8972ec.png)

SSE is built on top of HTTP. Instead of the server creating a connection out of thin air without a request, the client initiates an HTTP request first, and the server keeps that HTTP response open and continuously writes events to it.

![SSE Illustration](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192390-3f01b417.png)

SSE opens a unidirectional channel between the server and the client. Instead of a one-off payload, the server responds with a `text/event-stream` data stream, streaming data from the server to the client whenever data changes occur.

The overall concept is somewhat similar to online video playback, where the video stream is continuously pushed to the browser—you can also think of it as the client completing a very long download (over a slow connection).

![SSE Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192391-794f9e59.png)

SSE and WebSocket serve similar purposes—both establish communication between the server and the browser to push messages from server to client—yet they have several differences:

- SSE uses HTTP and `text/event-stream`, making it generally easier to integrate into existing web services; WebSocket requires the server or container to support protocol upgrade and WebSocket frames. It does not strictly require deploying a separate server.
- SSE is unidirectional, allowing communication only from server to client; WebSocket is full-duplex, meaning both sides can send and receive messages simultaneously.
- SSE is simple to implement with low development cost and requires no extra components; WebSocket requires secondary framing/parsing of transmitted data and has a slightly higher development barrier.
- SSE supports automatic reconnection on disconnect out of the box; WebSocket requires implementing reconnection yourself.
- SSE can only transmit text messages, so binary data must be encoded first; WebSocket natively supports transmitting binary data.

![SSE vs WebSocket Comparison](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/sse-vs-websocket-comparison-317207a6.webp)

**How to choose between SSE and WebSocket?**

> There is no absolute "better" or "worse" technology—only what fits best.

Part of why SSE has historically been less well known is the arrival of WebSocket, which provides a richer protocol for bidirectional, full-duplex communication. For games, instant messaging, and scenarios requiring near-real-time bidirectional updates, having a two-way channel is more compelling.

However, in many situations you do not need to send data from the client—you only need updates from server-side operations. For scenarios like in-site notifications, unread message counts, status updates, stock tickers, and monitoring metrics, SSE is far more advantageous in both implementation simplicity and cost. Moreover, SSE includes several features that WebSocket lacks by design, such as automatic reconnection, event IDs, and the ability to send arbitrary custom events.

The frontend simply makes one HTTP request with a unique ID, opens the event stream, and listens for events pushed by the server:

```javascript
<script>
    let source = null;
    let userId = 7777
    if (window.EventSource) {
        // Establish connection
        source = new EventSource('http://localhost:7777/sse/sub/'+userId);
        setMessageInnerHTML("Connecting user=" + userId);
        /**
         * Once the connection is established, the open event is triggered
         * Alternative syntax: source.onopen = function (event) {}
         */
        source.addEventListener('open', function (e) {
            setMessageInnerHTML("Connection established...");
        }, false);
        /**
         * Client receives data sent by the server
         * Alternative syntax: source.onmessage = function (event) {}
         */
        source.addEventListener('message', function (e) {
            setMessageInnerHTML(e.data);
        });
    } else {
        setMessageInnerHTML("Your browser does not support SSE");
    }
</script>
```

The server-side implementation is even simpler: create an `SseEmitter` object and store it in `sseEmitterMap` for management.

```java
private static Map<String, SseEmitter> sseEmitterMap = new ConcurrentHashMap<>();

/**
 * Create a connection
 */
public static SseEmitter connect(String userId) {
    try {
        // 0 means no application-layer timeout is set, not "default 30 seconds"
        SseEmitter sseEmitter = new SseEmitter(0L);
        // Register callbacks
        sseEmitter.onCompletion(completionCallBack(userId));
        sseEmitter.onError(errorCallBack(userId));
        sseEmitter.onTimeout(timeoutCallBack(userId));
        sseEmitterMap.put(userId, sseEmitter);
        count.getAndIncrement();
        return sseEmitter;
    } catch (Exception e) {
        log.info("Exception creating new SSE connection, current user: {}", userId);
    }
    return null;
}

/**
 * Send a message to a specified user
 */
public static void sendMessage(String userId, String message) {

    if (sseEmitterMap.containsKey(userId)) {
        try {
            sseEmitterMap.get(userId).send(message);
        } catch (IOException e) {
            log.error("Push exception for user [{}]: {}", userId, e.getMessage());
            removeUser(userId);
        }
    }
}
```

The `Map<String, SseEmitter>` example above keeps only one connection per user, so a new connection overwrites the old one. To support multiple tabs or multiple devices, you should maintain a collection of `SseEmitter` instances per user and remove the specific connection inside completion, timeout, and error callbacks. Nor does `0L` guarantee that proxies, gateways, and containers will never drop the connection—production environments need heartbeats, timeouts, and client reconnection strategies.

**Note:** SSE is not supported by Internet Explorer, though compatibility across other mainstream browsers is quite good.

![SSE Compatibility](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192393-32919365.png)

### WebSocket

WebSocket is probably a familiar way to implement message push; we also compared it with SSE above.

It is a protocol for full-duplex communication over a TCP connection, establishing a communication channel between the client and server. With just a single handshake, the browser and server can establish a persistent connection and perform bidirectional data transmission.

![WebSocket Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192394-99b6e344.png)

The WebSocket workflow can be broken down into the following steps:

1. The client sends an HTTP request to the server containing headers such as `Upgrade: websocket` and `Sec-WebSocket-Key`, requesting to upgrade the protocol to WebSocket;
2. Upon receiving this request, the server performs the protocol upgrade. If WebSocket is supported, it responds with HTTP status code 101 and response headers including `Connection: Upgrade` and `Sec-WebSocket-Accept: xxx`, indicating a successful upgrade to the WebSocket protocol.
3. A WebSocket connection is established between client and server, enabling bidirectional data transfer. Data is transmitted as frames rather than traditional HTTP requests and responses. Each WebSocket message may be split into multiple data frames (the smallest unit). The sender splits a message into frames and transmits them to the receiver, which receives the frames and reassembles related frames back into the complete message.
4. Either the client or the server can proactively send a close frame to indicate disconnection. Upon receiving it, the other party replies with a close frame as well, and both sides close the TCP connection.

Additionally, after a WebSocket connection is established, a heartbeat mechanism is used to keep the connection stable and alive.

To integrate WebSocket with Spring Boot, first add the WebSocket starter dependency—this introduces extra development cost compared to SSE.

```xml
<!-- Add WebSocket dependency -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

On the server side, annotate the class with `@ServerEndpoint` to expose it as a WebSocket endpoint, allowing clients to connect to the server via `ws://localhost:7777/websocket/10086`. Putting `userId` in the path is suitable only for routing demonstrations; production environments must authenticate the user's identity during the handshake and bind the connection to the authenticated principal rather than trusting a client-supplied `userId`.

```java
@Component
@Slf4j
@ServerEndpoint("/websocket/{userId}")
public class WebSocketServer {
    // Session connection with a specific client, used to send data to that client
    private Session session;
    private String userId;
    private static final CopyOnWriteArraySet<WebSocketServer> webSockets = new CopyOnWriteArraySet<>();
    // Stores active online connections
    private static final Map<String, Session> sessionPool = new ConcurrentHashMap<>();
    /**
     * Method invoked on successful connection
     */
    @OnOpen
    public void onOpen(Session session, @PathParam(value = "userId") String userId) {
        try {
            this.session = session;
            this.userId = userId;
            webSockets.add(this);
            sessionPool.put(userId, session);
            log.info("WebSocket message: new connection established, total count: " + webSockets.size());
        } catch (Exception e) {
            log.error("WebSocket connection initialization failed, userId={}", userId, e);
        }
    }
    /**
     * Clean up the current session when the connection closes
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
        log.error("WebSocket connection error, userId={}", userId, error);
    }
    /**
     * Method invoked upon receiving a message from the client
     */
    @OnMessage
    public void onMessage(String message) {
        log.info("WebSocket message: received client message: " + message);
    }
    /**
     * Unicast message to a single user
     */
    public static boolean sendOneMessage(String userId, String message) {
        Session session = sessionPool.get(userId);
        if (session != null && session.isOpen()) {
            try {
                log.info("WebSocket message: unicast message: " + message);
                session.getAsyncRemote().sendText(message);
                return true;
            } catch (Exception e) {
                log.error("Failed to send WebSocket message, userId={}", userId, e);
            }
        }
        return false;
    }
}
```

Similarly, `sessionPool` in this example retains only one connection per `userId`. To support multiple tabs or multiple devices, change the map value to a collection of sessions and execute sending, heartbeats, backpressure handling, and cleanup independently per connection.

If you want to trigger a server push via an HTTP endpoint, you can add a controller aligned with the frontend parameters:

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

This controller only demonstrates the request contract. Production environments must also enforce authentication and authorization on the publish endpoint so callers cannot push messages to arbitrary users by passing any `userId`; message size limits and rate limiting should also be applied.

In a Spring Boot application using an embedded Servlet container, you typically also need to register a `ServerEndpointExporter` bean, which registers WebSocket endpoints annotated with `@ServerEndpoint`.

```java
@Configuration
public class WebSocketConfiguration {

    /**
     * Used to register WebSocket servers annotated with @ServerEndpoint
     */
    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }
}
```

The frontend initializes and opens the WebSocket connection, listens for connection state events, receives data from the server, or sends data to the server.

```javascript
<script>
    var ws = new WebSocket('ws://localhost:7777/websocket/10086');
    // Get connection state
    console.log('ws connection state: ' + ws.readyState);
    // Listen for successful connection
    ws.onopen = function () {
        console.log('ws connection state: ' + ws.readyState);
        // Send data once connected
        ws.send('test1');
    }
    // Listen for and display messages from the server
    ws.onmessage = function (data) {
        console.log('Received message from server: ');
        console.log(data);
        // Close the WebSocket connection after communication finishes
        ws.close();
    }
    // Listen for connection close event
    ws.onclose = function () {
        // Track the WebSocket state throughout its lifecycle
        console.log('ws connection state: ' + ws.readyState);
    }
    // Listen for and handle error events
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

When the page initializes, it establishes a WebSocket connection, after which bidirectional communication works smoothly with good results.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000042192395-a414d7e2.png)

### MQTT

**What is the MQTT protocol?**

MQTT is a lightweight messaging protocol based on the publish/subscribe pattern that retrieves messages by subscribing to topics, widely used in IoT scenarios. Current OASIS specifications use "MQTT" directly as the official name and no longer expand it as "Message Queue Telemetry Transport."

The protocol decouples message publishers from subscribers, enabling reliable messaging services for remotely connected devices over unreliable networks, with usage somewhat similar to traditional MQs.

![MQTT Protocol Example](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/web-real-time-message-push/1460000022986325-742b7be4.png)

MQTT sits at the application layer and must run over an ordered, lossless, bidirectional byte stream transport. The most common transport is TCP (typically paired with TLS in production), or it can run over WebSocket or another transport providing those byte-stream semantics—so it should not be oversimplified as "usable directly over anything with TCP/IP."

**Why use the MQTT protocol?**

Why is MQTT so favored in the Internet of Things (IoT) over other protocols—such as the HTTP protocol we are much more familiar with?

- The classic short-lived HTTP request-response model requires devices to poll periodically or hold long connections open to receive server updates; MQTT directly provides an asynchronous publish/subscribe model over persistent connections. HTTP itself cannot be swept broadly under "synchronous protocol," as mechanisms like HTTP/2, HTTP/3, SSE, and WebSocket upgrades behave differently from classic short polling.
- HTTP requests are initiated by the client, though that does not mean the server can never stream data back or that devices can never receive commands. MQTT's advantage lies in standardizing persistent connections, topic routing, subscriptions, QoS, and session state out of the box.
- When sending commands to multiple devices, an MQTT broker can fan out messages by topic to all subscribers; HTTP can achieve similar functionality, but applications often have to manage connections, device groups, and retry semantics themselves.

I won't go further into the detailed introduction and hands-on practice of MQTT here—you can refer to my two previous articles, which cover everything in detail:

- Introduction to MQTT: [I Never Thought Spring Boot + RabbitMQ for Smart Home Could Be This Simple](https://mp.weixin.qq.com/s/udFE6k9pPetIWsa6KeErrA)
- Implementing message push with MQTT: [Unread Messages (Red Dot): Frontend + RabbitMQ Real-Time Push Practice, Super Simple~](https://mp.weixin.qq.com/s/U-fUGr9i1MVa4PoVyiDFCg)

## Summary

> The section below was added by JavaGuide

|           | Overview                                                                                                                                      | Pros                           | Cons                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| Short Polling | The client periodically sends requests to the server, and the server immediately returns a response (even if there is no updated data).       | Simple, easy to understand and implement | Poor real-time responsiveness, too many wasted requests, frequent connection setup consumes heavy resources |
| Long Polling | Unlike short polling, the server holds the client request until new data updates arrive before responding.                                    | Reduces wasted requests        | Holding requests open wastes resources                                              |
| iframe Streaming | A persistent connection is created between server and client, with the server continuously pushing data into an `iframe`.                     | Simple, easy to understand and implement | Maintaining a persistent connection increases overhead, poor UX (tab loading icon keeps spinning) |
| SSE       | Unidirectional message push from server to client (browser).                                                                                  | Simple, easy to implement, feature-rich | Does not support bidirectional communication                                        |
| WebSocket | Uses HTTP only for the initial handshake, then communicates directly over TCP for full-duplex client-server communication.                    | High performance, low overhead | Demands more from developers, relatively more complex to implement                  |
| MQTT      | A lightweight communication protocol based on the publish/subscribe pattern that retrieves messages by subscribing to corresponding topics.   | Mature, stable, lightweight    | Demands more from developers, relatively more complex to implement                  |
