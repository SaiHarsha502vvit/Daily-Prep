**Navigation**: [< Previous](Ch14_Maven_Gradle.md) | [Back to Index](../00_MASTER_INDEX.md)

# 🌐 Chapter 46 — Java Networking & NIO: Sockets, HTTP, and Non-Blocking I/O

**"Every API call, database query, and microservice communication uses networking. Understanding Java's Socket API, the modern HttpClient, and NIO's non-blocking model explains how Spring Boot, Netty, and message brokers actually work under the hood."**

---

## Table of Contents

1. [Networking Fundamentals for Java Devs](#1-networking-fundamentals-for-java-devs)
2. [Classic Socket API — Blocking I/O](#2-classic-socket-api--blocking-io)
3. [ServerSocket — Building a Server](#3-serversocket--building-a-server)
4. [Java 11 HttpClient — Modern HTTP](#4-java-11-httpclient--modern-http)
5. [Java I/O vs NIO vs NIO.2](#5-java-io-vs-nio-vs-nio2)
6. [Buffers — The NIO Data Container](#6-buffers--the-nio-data-container)
7. [Channels — Bidirectional I/O](#7-channels--bidirectional-io)
8. [Selectors — Multiplexed Non-Blocking I/O](#8-selectors--multiplexed-non-blocking-io)
9. [Building a Non-Blocking Server](#9-building-a-non-blocking-server)
10. [SSL/TLS in Java](#10-ssltls-in-java)
11. [Real-World: How Frameworks Use NIO](#11-real-world-how-frameworks-use-nio)

---

## 1. Networking Fundamentals for Java Devs

```
  TCP/IP STACK — What happens when you call an API:
  ══════════════════════════════════════════════════
  
  Your Java App
       ↓
  Application Layer  (HTTP, WebSocket, gRPC)
       ↓
  Transport Layer    (TCP — reliable, ordered delivery)
       ↓
  Network Layer      (IP — routing packets across networks)
       ↓
  Link Layer         (Ethernet, WiFi — physical transmission)
  
  
  KEY CONCEPTS:
  ═════════════
  
  IP Address:  Identifies a machine (192.168.1.100)
  Port:        Identifies a service (8080 = your Spring Boot app)
  Socket:      IP + Port = endpoint (192.168.1.100:8080)
  TCP:         Reliable, ordered, connection-oriented (HTTP, DB)
  UDP:         Unreliable, fast, connectionless (DNS, video streaming)
```

---



🔬 **Section Challenge — 1. Networking Fundamentals for Java Devs**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## 2. Classic Socket API — Blocking I/O

```java
// CLIENT — Connect to a server and send/receive data:
import java.net.*;
import java.io.*;

try (Socket socket = new Socket("api.example.com", 80)) {
    // Get output stream (send data TO server):
    PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
    
    // Get input stream (receive data FROM server):
    BufferedReader in = new BufferedReader(
        new InputStreamReader(socket.getInputStream())
    );
    
    // Send HTTP request:
    out.println("GET / HTTP/1.1");
    out.println("Host: api.example.com");
    out.println("Connection: close");
    out.println();  // Empty line = end of headers
    
    // Read response:
    String line;
    while ((line = in.readLine()) != null) {  // BLOCKS until data arrives
        System.out.println(line);
    }
} // Auto-closes socket
```

```
  BLOCKING PROBLEM:
  ═════════════════
  
  in.readLine()  ← Thread BLOCKS here. Does nothing. Waits.
  socket.accept() ← Thread BLOCKS here. Waits for client.
  
  Thread per connection model:
  
  Client A → Thread 1 (blocked reading)
  Client B → Thread 2 (blocked reading)
  Client C → Thread 3 (blocked reading)
  ...
  Client 10000 → Thread 10000 (10K threads = ~10GB RAM!)
  
  Each thread ≈ 1MB stack → 10K connections = 10GB just for stacks.
  Most threads are WAITING. Massive waste.
```

---



🔬 **Section Challenge — 2. Classic Socket API — Blocking I/O**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## 3. ServerSocket — Building a Server

```java
// SIMPLE BLOCKING SERVER:
try (ServerSocket server = new ServerSocket(8080)) {
    System.out.println("Server listening on port 8080");
    
    while (true) {
        Socket client = server.accept();  // BLOCKS until client connects
        
        // Handle client in a new thread (thread-per-connection):
        new Thread(() -> handleClient(client)).start();
    }
}

void handleClient(Socket client) {
    try (
        BufferedReader in = new BufferedReader(
            new InputStreamReader(client.getInputStream()));
        PrintWriter out = new PrintWriter(client.getOutputStream(), true)
    ) {
        String request = in.readLine();  // BLOCKS until data arrives
        System.out.println("Received: " + request);
        
        // Send response:
        out.println("HTTP/1.1 200 OK");
        out.println("Content-Type: text/plain");
        out.println();
        out.println("Hello, World!");
    } catch (IOException e) {
        e.printStackTrace();
    }
}
```

```
  BETTER: Thread Pool instead of unlimited threads:
```

```java
ExecutorService pool = Executors.newFixedThreadPool(200);

try (ServerSocket server = new ServerSocket(8080)) {
    while (true) {
        Socket client = server.accept();
        pool.submit(() -> handleClient(client));
        // Max 200 concurrent connections handled.
        // Connection 201 waits in queue.
    }
}
```

---



🔬 **Section Challenge — 3. ServerSocket — Building a Server**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## 4. Java 11 HttpClient — Modern HTTP

```java
// Java 11+ HttpClient — THE modern way to make HTTP calls:
import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_2)       // HTTP/2 with fallback
    .connectTimeout(Duration.ofSeconds(10))
    .followRedirects(HttpClient.Redirect.NORMAL)
    .build();

// GET request:
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users/1"))
    .header("Accept", "application/json")
    .GET()
    .build();

// Synchronous (blocking):
HttpResponse<String> response = client.send(
    request, 
    HttpResponse.BodyHandlers.ofString()
);
System.out.println(response.statusCode());  // 200
System.out.println(response.body());        // JSON string


// Asynchronous (non-blocking):
client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
    .thenApply(HttpResponse::body)
    .thenAccept(body -> System.out.println("Got: " + body))
    .exceptionally(ex -> { 
        System.err.println("Failed: " + ex.getMessage()); 
        return null; 
    });


// POST with JSON body:
HttpRequest postRequest = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(
        "{\"name\": \"Harsha\", \"role\": \"developer\"}"
    ))
    .build();

HttpResponse<String> postResponse = client.send(
    postRequest, 
    HttpResponse.BodyHandlers.ofString()
);
```

---



🔬 **Section Challenge — 4. Java 11 HttpClient — Modern HTTP**

**Challenge 1 (Reasoning):** `Connection: keep-alive` vs HTTP/2 — what does each one do differently for multiplexing?
<details><summary>Answer</summary>

HTTP/1.1 keep-alive: reuse ONE TCP connection for sequential requests. Still head-of-line blocking — request 2 waits for response 1. HTTP/2: one TCP connection, but requests are multiplexed as frames with stream IDs. Multiple requests in-flight simultaneously. Response frames for different streams are interleaved. HTTP/2 also has header compression (HPACK) and server push. Still has TCP HOL blocking (one lost packet blocks all streams). HTTP/3 (QUIC): uses UDP, per-stream reliability, eliminates TCP HOL blocking entirely.
</details>


## 5. Java I/O vs NIO vs NIO.2

```
  ┌──────────────┬──────────────────┬──────────────────────────────┐
  │              │ Java I/O (java.io)│ Java NIO (java.nio)         │
  ├──────────────┼──────────────────┼──────────────────────────────┤
  │ Model        │ Stream-oriented  │ Buffer-oriented              │
  │ Blocking     │ Always blocking  │ Blocking AND non-blocking    │
  │ Multiplexing │ No (1 thread per │ Yes (Selector: 1 thread,     │
  │              │ connection)      │ many connections)            │
  │ Unit         │ byte or char     │ Buffer (chunk of bytes)      │
  │ Direction    │ One-way (Input   │ Bidirectional (Channel)      │
  │              │ OR Output)       │                              │
  │ When to use  │ Simple file I/O, │ Network servers, high        │
  │              │ small apps       │ concurrency, large files     │
  └──────────────┴──────────────────┴──────────────────────────────┘
  
  
  NIO KEY COMPONENTS:
  ═══════════════════
  
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │   BUFFER ← data container (read/write bytes)            │
  │     ↕                                                    │
  │   CHANNEL ← bidirectional pipe to I/O resource           │
  │     ↕                                                    │
  │   SELECTOR ← monitors multiple channels (multiplexing)  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## 6. Buffers — The NIO Data Container

```java
// ByteBuffer — most important NIO buffer:
ByteBuffer buffer = ByteBuffer.allocate(1024);  // 1KB buffer

// Buffer has 4 properties:
// capacity = max size (1024)
// limit    = current read/write boundary
// position = current read/write cursor
// mark     = saved position (optional)

// WRITE MODE (put data into buffer):
buffer.put("Hello".getBytes());
// position = 5, limit = 1024

// FLIP to READ MODE:
buffer.flip();
// position = 0, limit = 5

// READ data out:
byte[] data = new byte[buffer.remaining()];  // remaining = limit - position
buffer.get(data);
System.out.println(new String(data));  // "Hello"

// CLEAR to reuse:
buffer.clear();
// position = 0, limit = capacity
```

```
  BUFFER STATE DIAGRAM:
  ═════════════════════
  
  After allocate(10):
  [_][_][_][_][_][_][_][_][_][_]
   ↑ position=0                  ↑ limit=capacity=10
  
  After put("Hi"):
  [H][i][_][_][_][_][_][_][_][_]
         ↑ position=2             ↑ limit=10
  
  After flip():
  [H][i][_][_][_][_][_][_][_][_]
   ↑ position=0  ↑ limit=2
  
  Now you can READ: get() returns 'H', 'i'
  
  After clear():
  [_][_][_][_][_][_][_][_][_][_]
   ↑ position=0                  ↑ limit=10
  
  RULE: write → flip → read → clear → write → ...
```

```java
// DIRECT BUFFER — allocated outside JVM heap (faster for I/O):
ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);
// Pro: No copy between JVM heap and OS buffer
// Con: Slower to allocate, not garbage collected as eagerly
// Use for: Long-lived buffers, heavy I/O operations
```

---



🔬 **Section Challenge — 6. Buffers — The NIO Data Container**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## 7. Channels — Bidirectional I/O

```java
// CHANNEL types:
// FileChannel        — read/write files
// SocketChannel      — TCP client
// ServerSocketChannel — TCP server
// DatagramChannel    — UDP

// Reading a file with NIO:
try (FileChannel channel = FileChannel.open(
        Path.of("data.txt"), StandardOpenOption.READ)) {
    
    ByteBuffer buffer = ByteBuffer.allocate(4096);
    
    while (channel.read(buffer) != -1) {  // Read into buffer
        buffer.flip();                     // Switch to read mode
        
        while (buffer.hasRemaining()) {
            System.out.print((char) buffer.get());
        }
        
        buffer.clear();                    // Ready for next read
    }
}

// Writing a file:
try (FileChannel channel = FileChannel.open(
        Path.of("output.txt"), 
        StandardOpenOption.CREATE, 
        StandardOpenOption.WRITE)) {
    
    ByteBuffer buffer = ByteBuffer.wrap("Hello NIO!".getBytes());
    channel.write(buffer);
}

// Memory-mapped file (FAST for large files):
try (FileChannel channel = FileChannel.open(
        Path.of("large-file.dat"), StandardOpenOption.READ)) {
    
    MappedByteBuffer mapped = channel.map(
        FileChannel.MapMode.READ_ONLY, 0, channel.size()
    );
    // File is mapped to memory — OS handles paging
    // Access like a regular buffer:
    while (mapped.hasRemaining()) {
        byte b = mapped.get();
    }
}
```

---

## 8. Selectors — Multiplexed Non-Blocking I/O

```
  THE KEY INSIGHT:
  ════════════════
  
  Without Selector:  1 thread per connection (10K threads for 10K connections)
  With Selector:     1 thread handles ALL connections
  
  
  HOW IT WORKS:
  ═════════════
  
  ┌────────────────────────────────────────────┐
  │              SELECTOR                       │
  │                                            │
  │  Monitors multiple channels:               │
  │                                            │
  │  Channel A ──→ Ready to READ?   → Yes ✓   │
  │  Channel B ──→ Ready to READ?   → No       │
  │  Channel C ──→ Ready to WRITE?  → Yes ✓   │
  │  Channel D ──→ Ready to ACCEPT? → No       │
  │                                            │
  │  selector.select() returns: {A, C}        │
  │  → Process ONLY ready channels             │
  │  → Never blocks on unready channels        │
  └────────────────────────────────────────────┘
  
  
  SELECTABLE OPERATIONS:
  ═════════════════════
  
  SelectionKey.OP_ACCEPT  → ServerSocketChannel ready to accept
  SelectionKey.OP_CONNECT → SocketChannel finished connecting
  SelectionKey.OP_READ    → Channel has data to read
  SelectionKey.OP_WRITE   → Channel ready to write
```

---



🔬 **Section Challenge — 8. Selectors — Multiplexed Non-Blocking I/O**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## 9. Building a Non-Blocking Server

```java
import java.nio.*;
import java.nio.channels.*;
import java.net.*;
import java.util.*;

public class NioServer {
    public static void main(String[] args) throws Exception {
        // 1. Open a selector:
        Selector selector = Selector.open();
        
        // 2. Open server channel (non-blocking):
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(8080));
        serverChannel.configureBlocking(false);  // KEY: non-blocking mode
        
        // 3. Register with selector for ACCEPT events:
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);
        
        System.out.println("NIO Server on port 8080 (single thread!)");
        
        // 4. Event loop (single thread handles everything):
        while (true) {
            selector.select();  // Block until at least 1 channel is ready
            
            Set<SelectionKey> selectedKeys = selector.selectedKeys();
            Iterator<SelectionKey> iter = selectedKeys.iterator();
            
            while (iter.hasNext()) {
                SelectionKey key = iter.next();
                iter.remove();
                
                if (key.isAcceptable()) {
                    // New client connection:
                    SocketChannel client = serverChannel.accept();
                    client.configureBlocking(false);
                    client.register(selector, SelectionKey.OP_READ);
                    System.out.println("Client connected: " + client.getRemoteAddress());
                }
                
                if (key.isReadable()) {
                    // Client sent data:
                    SocketChannel client = (SocketChannel) key.channel();
                    ByteBuffer buffer = ByteBuffer.allocate(1024);
                    
                    int bytesRead = client.read(buffer);
                    if (bytesRead == -1) {
                        client.close();  // Client disconnected
                        continue;
                    }
                    
                    buffer.flip();
                    byte[] data = new byte[buffer.remaining()];
                    buffer.get(data);
                    String message = new String(data).trim();
                    System.out.println("Received: " + message);
                    
                    // Echo back:
                    ByteBuffer response = ByteBuffer.wrap(
                        ("Echo: " + message + "\n").getBytes()
                    );
                    client.write(response);
                }
            }
        }
    }
}
```

```
  ONE THREAD handles:
  • Accepting new connections
  • Reading from ALL connected clients
  • Writing responses to ALL clients
  
  This is how Netty, Tomcat NIO connector, and Node.js work!
  10K connections → 1 thread → ~1MB RAM (vs 10GB with blocking I/O)
```

---



🔬 **Section Challenge — 9. Building a Non-Blocking Server**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## 10. SSL/TLS in Java

```java
// HTTPS with HttpClient (easiest):
HttpClient secureClient = HttpClient.newBuilder()
    .sslContext(SSLContext.getDefault())  // Uses JVM's truststore
    .build();

// Custom SSL context (for self-signed certs in dev):
SSLContext sslContext = SSLContext.getInstance("TLS");
TrustManagerFactory tmf = TrustManagerFactory.getInstance(
    TrustManagerFactory.getDefaultAlgorithm()
);

KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
try (FileInputStream fis = new FileInputStream("truststore.jks")) {
    trustStore.load(fis, "changeit".toCharArray());
}

tmf.init(trustStore);
sslContext.init(null, tmf.getTrustManagers(), null);

HttpClient client = HttpClient.newBuilder()
    .sslContext(sslContext)
    .build();
```

```
  JVM TRUSTSTORE:
  ═══════════════
  
  Location: $JAVA_HOME/lib/security/cacerts
  Default password: "changeit"
  Contains: Root CA certificates (DigiCert, Let's Encrypt, etc.)
  
  Add a certificate:
  keytool -importcert -file cert.pem -alias myservice \
          -keystore $JAVA_HOME/lib/security/cacerts
  
  List certificates:
  keytool -list -keystore $JAVA_HOME/lib/security/cacerts
```

---



🔬 **Section Challenge — 10. SSL/TLS in Java**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## 11. Real-World: How Frameworks Use NIO

```
  SPRING BOOT (TOMCAT NIO):
  ═════════════════════════
  
  Tomcat's NIO connector:
  • 1 Acceptor thread → accepts connections
  • 1 Poller thread → NIO Selector monitors all connections
  • Worker thread pool (default 200) → processes ready requests
  
  HTTP request lifecycle:
  1. Client connects → Acceptor accepts → registers with Poller
  2. Client sends data → Poller detects → submits to worker pool
  3. Worker thread runs your @RequestMapping handler
  4. Response sent → worker returns to pool
  
  
  NETTY (foundation of Spring WebFlux, gRPC):
  ═════════════════════════════════════════════
  
  • Boss Group (1 thread) → accepts connections
  • Worker Group (N threads, usually CPU cores) → handles I/O
  • Each worker thread has its own Selector
  • Channel pipeline: chain of handlers (decode → business logic → encode)
  
  
  SPRING WEBFLUX (reactive, non-blocking):
  ════════════════════════════════════════
  
  Built on Netty. Fully non-blocking.
  Uses Project Reactor (Mono/Flux) for async composition.
  Can handle 100K+ connections with very few threads.
  
  @GetMapping("/users/{id}")
  public Mono<User> getUser(@PathVariable String id) {
      return userRepository.findById(id);  // Non-blocking DB call
  }
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  I/O MODEL COMPARISON:                                      ║
  ║                                                              ║
  ║  ┌────────────────┬──────────┬───────────┬────────────────┐ ║
  ║  │ Model          │ Threads  │ Connections│ Framework      │ ║
  ║  ├────────────────┼──────────┼───────────┼────────────────┤ ║
  ║  │ Blocking I/O   │ 1:1      │ ~200      │ Old Tomcat BIO │ ║
  ║  │ Thread pool    │ Pool:N   │ ~200      │ Tomcat BIO pool│ ║
  ║  │ NIO            │ Few      │ 10K+      │ Tomcat NIO     │ ║
  ║  │ Netty          │ Few      │ 100K+     │ WebFlux, gRPC  │ ║
  ║  │ Virtual threads│ 1M:N     │ 1M+       │ Java 21 Loom   │ ║
  ║  └────────────────┴──────────┴───────────┴────────────────┘ ║
  ║                                                              ║
  ║  Java 21 Virtual Threads (Project Loom):                     ║
  ║  Write blocking code, JVM makes it non-blocking.             ║
  ║  Best of both worlds — simple code + massive concurrency.    ║
  ╚══════════════════════════════════════════════════════════════╝
```

---

**Back to Index**: [Master Index](../00_MASTER_INDEX.md)

---

## 🏋️ Practice & Interview Questions — DevOps & Networking

### Predict / Trace
**Q1.** What happens when you type `https://google.com` in a browser?
<details><summary>Answer</summary>

1. DNS lookup: resolve `google.com` → IP (recursive resolver → root → TLD → authoritative NS)
2. TCP connection: 3-way handshake (SYN → SYN-ACK → ACK) to port 443
3. TLS handshake: ClientHello → ServerHello → certificate verification → key exchange → session keys
4. HTTP/2 GET request sent
5. Server responds with HTML (GZIP compressed)
6. Browser parses HTML → fetches CSS/JS → CSSOM + DOM → render tree → paint
</details>

**Q2.** `curl -I https://example.com` returns `Connection: keep-alive`. What does this mean?
<details><summary>Answer</summary>

The TCP connection won't be closed after the response — it stays open for reuse. Avoiding TCP+TLS handshake overhead for subsequent requests. HTTP/1.1 default; HTTP/2 always multiplexes on one connection.
</details>

### Coding / Commands
**Q3.** ⭐ Write a Dockerfile for a Java Spring Boot app — multi-stage build.
<details><summary>Solution</summary>

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle/
RUN ./gradlew dependencies --no-daemon
COPY src src/
RUN ./gradlew bootJar --no-daemon

# Stage 2: Runtime (smaller image)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```
</details>

**Q4.** ⭐ Write a Kubernetes deployment with liveness and readiness probes.
<details><summary>Solution</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: myapp:1.0
        resources:
          requests: { memory: "256Mi", cpu: "250m" }
          limits:   { memory: "512Mi", cpu: "500m" }
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          initialDelaySeconds: 10
          periodSeconds: 5
```
</details>

**Q5.** ⭐⭐ Design a zero-downtime deployment strategy.
<details><summary>Answer</summary>

**Blue-Green**: run two identical envs, switch load balancer. Instant rollback. Double the infra cost.
**Rolling**: replace pods one-by-one. K8s default. Slower, but no extra infra.
**Canary**: route 5% traffic to new version, monitor errors/latency, gradually increase. Most risk-controlled.
**Feature flags**: deploy code but disable feature — decouple deployment from release.
</details>

### Interview Questions
**Q6.** TCP vs UDP — when to use each?
<details><summary>Answer</summary>

**TCP**: reliable (acknowledgments, retransmission), ordered, connection-based. Use for: HTTP, databases, SSH, email — anywhere correctness matters more than speed.
**UDP**: unreliable, unordered, connectionless. Use for: video streaming, gaming, DNS, VoIP — where speed matters more than perfect delivery, or app handles reliability itself.
</details>

**Q7.** What is a memory limit vs memory request in Kubernetes?
<details><summary>Answer</summary>

`request`: guaranteed allocation — K8s won't schedule pod on node with less available. `limit`: maximum usage — if exceeded, pod is OOM-killed. Set requests for scheduling accuracy; set limits to prevent noisy neighbor problems. Best practice: requests=expected P50 usage, limits=expected P99 surge.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | HTTP status code 429 | Too Many Requests (rate limited) |
| 2 | HTTP status code 503 | Service Unavailable (server down/overloaded) |
| 3 | DNS record type for IP address | A record (IPv4), AAAA record (IPv6) |
| 4 | Load balancer Layer 4 vs 7 | L4: TCP/UDP level; L7: HTTP/application level (content-aware) |
| 5 | TLS/SSL terminates where | At load balancer (termination), or all the way to pod (passthrough) |
| 6 | `docker exec -it container bash` does | Opens interactive shell in running container |
| 7 | Kubernetes etcd stores | Cluster state (all K8s object definitions) |
| 8 | CI/CD — what triggers a pipeline? | Code push, PR, tag, schedule, or manual trigger |

---

## 🧠 Deep Conceptual Questions — Networking & DevOps Internals

**C1. TCP three-way handshake: WHY three steps? Can it be done in two?**
<details><summary>Deep Answer</summary>

Two-way fails: both sides need to confirm the OTHER side can send AND receive. 
- SYN (client→server): "I want to connect, my sequence starts at X"
- SYN-ACK (server→client): "Got your SYN, my sequence starts at Y, ack=X+1"  
- ACK (client→server): "Got your SYN-ACK, ack=Y+1"

Without the third ACK: client knows server is alive, but server doesn't know the client received the SYN-ACK. If SYN-ACK lost: server has allocated resources (TCB) thinking connection established, client doesn't know. The ACK confirms the server's sequence number was received. This asymmetric confirmation requires 3 messages minimum. Four-way teardown: TCP is full-duplex — each direction closed independently, hence 4 steps.
</details>

**C2. What happens when you run `docker run`? Trace the full execution path.**
<details><summary>Deep Answer</summary>

1. **Docker CLI** parses the command, sends REST API request to Docker daemon (`/run`)
2. **Docker daemon** (dockerd) receives the request
3. If image not local: **pull from registry** (Docker Hub → HTTPS, layer downloads)
4. Daemon calls **containerd** (container runtime interface)
5. containerd calls **runc** (OCI runtime)
6. runc creates **Linux namespaces**: PID, NET, MNT, UTS, IPC, USER — isolates the process
7. runc sets up **cgroups**: limits CPU, memory, I/O
8. runc **pivot_root**: changes the filesystem root to the container's overlay filesystem
9. runc executes the entrypoint process (PID 1 in the container)
10. Container stdout/stderr connected through Docker daemon to your terminal
</details>

**C3. Why does Kubernetes use etcd and what would happen if etcd went down?**
<details><summary>Deep Answer</summary>

etcd = distributed key-value store using the Raft consensus algorithm. Stores ALL cluster state: pod specs, deployments, services, secrets, configmaps, RBAC, CRDs. Raft ensures consistency across a cluster of 3-5 etcd nodes (quorum = (N/2)+1). **If etcd goes down**: API server can't read/write state. kubectl commands fail. Scheduler can't schedule new pods. Controller manager can't reconcile state. EXISTING running pods continue running (they don't constantly check etcd — they're managed by kubelet on each node). New pods can't be scheduled. No updates possible. This is why etcd backup + restore is the most critical K8s operation.
</details>

**C4. TLS handshake: what is forward secrecy and why does it matter?**
<details><summary>Deep Answer</summary>

Without forward secrecy: if attacker records encrypted traffic now, and later compromises the server's private key, they can decrypt ALL past traffic retroactively. The server's private key decrypts the session key which decrypts the data. **Forward secrecy** (TLS 1.3 default): each session uses an **ephemeral key pair** (ECDHE). Session keys derived from ephemeral keys + DH exchange. Session key is never stored. If private key compromised later: past sessions can't be decrypted (the ephemeral keys are gone). This is why TLS 1.3 mandates forward secrecy and deprecated non-FS cipher suites. Practically: enables safer long-term data archival.
</details>

**C5. DNS propagation: why does it take "up to 48 hours"?**
<details><summary>Deep Answer</summary>

DNS uses hierarchical caching. Each DNS record has a TTL (time-to-live). When you update a DNS record, authoritative NS serves the new value immediately. But: resolvers worldwide have cached the OLD value until their cache TTL expires. TTL varies: some ISPs set their resolver cache TTL aggressively (override your TTL), some ignore TTL and cache for hours regardless. "48 hours" = worst-case TTL of most records (common: 3600s=1hr, 86400s=1day). Reduce before migration: lower TTL to 60s a week before planned change → faster propagation. After change: most resolvers pick up the new value within minutes. "48 hours" is a legacy conservative estimate.
</details>

**C6. Load balancer: what is the difference between Layer 4 and Layer 7?**
<details><summary>Deep Answer</summary>

**Layer 4 (Transport)**: routes based on TCP/UDP. Sees: IP address, port. Doesn't read HTTP content. Faster (no packet inspection, can be done in-kernel). Can't do URL-based routing, auth injection, session affinity by cookie. Examples: AWS NLB, HAProxy in TCP mode. **Layer 7 (Application)**: reads HTTP headers, URL, body. Can route `/api` to one backend, `/static` to another. Can inject headers (`X-Real-IP`), handle SSL termination, do health checks on HTTP endpoints, session affinity by cookie. More CPU-intensive (full packet inspection). Examples: NGINX, AWS ALB, Envoy. Modern microservices use L7 (Envoy/Istio) for fine-grained traffic control.
</details>

