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

**Challenge 1 (Reasoning):** Why is Java NIO (Non-blocking I/O) vastly superior to traditional Java IO for building a high-concurrency web server like Tomcat or Netty?
<details><summary>Answer</summary>

Thread-per-connection vs Multiplexing. Traditional IO `InputStream.read()` blocks the current thread until data arrives. If you have 10,000 clients, you need 10,000 threads, which consumes gigabytes of memory and crashes the OS via context switching. NIO uses an `Epoll Selector` (Multiplexer) that monitors thousands of open SocketChannels using a single thread. It only wakes up a worker thread when a channel actually has data ready to be read.
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

**Challenge 1 (Reasoning):** Why is Java NIO (Non-blocking I/O) vastly superior to traditional Java IO for building a high-concurrency web server like Tomcat or Netty?
<details><summary>Answer</summary>

Thread-per-connection vs Multiplexing. Traditional IO `InputStream.read()` blocks the current thread until data arrives. If you have 10,000 clients, you need 10,000 threads, which consumes gigabytes of memory and crashes the OS via context switching. NIO uses an `Epoll Selector` (Multiplexer) that monitors thousands of open SocketChannels using a single thread. It only wakes up a worker thread when a channel actually has data ready to be read.
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

**Challenge 1 (Reasoning):** Why is Java NIO (Non-blocking I/O) vastly superior to traditional Java IO for building a high-concurrency web server like Tomcat or Netty?
<details><summary>Answer</summary>

Thread-per-connection vs Multiplexing. Traditional IO `InputStream.read()` blocks the current thread until data arrives. If you have 10,000 clients, you need 10,000 threads, which consumes gigabytes of memory and crashes the OS via context switching. NIO uses an `Epoll Selector` (Multiplexer) that monitors thousands of open SocketChannels using a single thread. It only wakes up a worker thread when a channel actually has data ready to be read.
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

**Challenge 1 (Reasoning — Who/When/What):** NIO `Selector` handles 10,000 connections on a single thread. Traditional I/O uses 1 thread per connection. **Who** blocks in each model? **When** does the Selector wake up? **What** is the trade-off?

<details><summary>Answer</summary>

**Traditional I/O:** EACH thread blocks on `socket.read()` waiting for data. 10,000 connections = 10,000 blocked threads = 10,000 MB stack space. **NIO Selector:** The Selector is the single thread that calls `selector.select()` — it blocks until ANY registered channel has data. **When wakes up?** When the OS delivers a read-ready event for any registered `SocketChannel`. **The Selector returns a `Set<SelectionKey>`** with all ready channels. **Trade-off:** NIO wins on memory and scalability (no per-connection thread). But all business logic runs on one thread — a slow handler blocks ALL connections. Solution: Reactor pattern (Netty) — Selector thread only dispatches; actual work goes to a separate worker thread pool.

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

**Challenge 1 (Reasoning):** Why is Java NIO (Non-blocking I/O) vastly superior to traditional Java IO for building a high-concurrency web server like Tomcat or Netty?
<details><summary>Answer</summary>

Thread-per-connection vs Multiplexing. Traditional IO `InputStream.read()` blocks the current thread until data arrives. If you have 10,000 clients, you need 10,000 threads, which consumes gigabytes of memory and crashes the OS via context switching. NIO uses an `Epoll Selector` (Multiplexer) that monitors thousands of open SocketChannels using a single thread. It only wakes up a worker thread when a channel actually has data ready to be read.
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

**Challenge 1 (Reasoning):** Why is Java NIO (Non-blocking I/O) vastly superior to traditional Java IO for building a high-concurrency web server like Tomcat or Netty?
<details><summary>Answer</summary>

Thread-per-connection vs Multiplexing. Traditional IO `InputStream.read()` blocks the current thread until data arrives. If you have 10,000 clients, you need 10,000 threads, which consumes gigabytes of memory and crashes the OS via context switching. NIO uses an `Epoll Selector` (Multiplexer) that monitors thousands of open SocketChannels using a single thread. It only wakes up a worker thread when a channel actually has data ready to be read.
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

**Challenge 1 (Reasoning):** Why is Java NIO (Non-blocking I/O) vastly superior to traditional Java IO for building a high-concurrency web server like Tomcat or Netty?
<details><summary>Answer</summary>

Thread-per-connection vs Multiplexing. Traditional IO `InputStream.read()` blocks the current thread until data arrives. If you have 10,000 clients, you need 10,000 threads, which consumes gigabytes of memory and crashes the OS via context switching. NIO uses an `Epoll Selector` (Multiplexer) that monitors thousands of open SocketChannels using a single thread. It only wakes up a worker thread when a channel actually has data ready to be read.
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

**Challenge 1 (Reasoning):** Why is Java NIO (Non-blocking I/O) vastly superior to traditional Java IO for building a high-concurrency web server like Tomcat or Netty?
<details><summary>Answer</summary>

Thread-per-connection vs Multiplexing. Traditional IO `InputStream.read()` blocks the current thread until data arrives. If you have 10,000 clients, you need 10,000 threads, which consumes gigabytes of memory and crashes the OS via context switching. NIO uses an `Epoll Selector` (Multiplexer) that monitors thousands of open SocketChannels using a single thread. It only wakes up a worker thread when a channel actually has data ready to be read.
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

