**Navigation**: [< Previous](Ch29_Annotations_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch25_Spring_Boot_50Day_Plan.md)

# 🔥 Spring Boot Part 23 — Missing Essential Topics

**WHY this file?** Parts 0-22 cover a LOT, but these topics were missing.
Every topic here is asked in interviews or used in production.
**Framework:** WHY → HOW → EXAMPLE → PITFALL → INTERVIEW Q

---

### Historical Evolution

**Inventor / Originator:** WebSocket (RFC 6455, 2011); GraphQL (Facebook, 2012); gRPC (Google, 2015, open-sourced 2016).

**Predecessor context:** Pre-WebSocket (2011), real-time communication used polling (wasteful), long-polling (complex), or Flash (deprecated). REST APIs returned over-fetched data. SOAP XML was verbose for internal services. HTTP/1.1 head-of-line blocking forced connection-per-request overhead.

**Evolution narrative:** WebSocket (RFC 6455, Ian Fette and Alexis Douderakis, 2011) standardized bi-directional full-duplex communication over a single TCP connection. HTML5 adopted it in 2014. GraphQL (Facebook, 2012, open-sourced 2015) solved REST over-fetching by letting clients specify exact data needs. gRPC (Google, 2015/2016) used HTTP/2 multiplexing and Protocol Buffers for efficient service-to-service communication. Server-Sent Events (SSE, 2009 spec) offered one-way server-push over HTTP. Spring WebFlux (2018, Spring 5) added reactive non-blocking WebSocket support.

**Modern practice:** Spring Boot 3.x with WebSocket (`WebSocketHandler`), STOMP over WebSocket (`@MessageMapping`), or SSE (`ResponseBodyEmitter`). For microservices, gRPC with Spring Boot (`grpc-spring-boot-starter`). GraphQL with `spring-boot-starter-graphql` and `spring-graphql`. HTTP/2 (2015) is default in Spring Boot 2.x+.

- **WebSocket RFC 6455 — 2011**: IETF standard. Bi-directional, full-duplex. Replaced polling/long-polling.
- **GraphQL — Facebook 2012, open 2015**: Query language for APIs. Client specifies data needs. No over-fetching.
- **gRPC — Google 2015, Apache 2016**: HTTP/2 + Protocol Buffers. 10x faster than JSON/REST for internal calls.
- **SSE (Server-Sent Events) — 2009 spec**: One-way server-push over HTTP. Simpler than WebSocket for feeds.
- **HTTP/2 — 2015**: Multiplexing, header compression, server push. Built into all modern browsers.

---

# Table of Contents

1. [WebSockets & Server-Sent Events (SSE)](#1-websockets--server-sent-events-sse)
2. [GraphQL with Spring Boot](#2-graphql-with-spring-boot)
3. [gRPC with Spring Boot](#3-grpc-with-spring-boot)
4. [Spring Batch (Batch Processing)](#4-spring-batch-batch-processing)
5. [Pagination & Sorting Deep Dive](#5-pagination--sorting-deep-dive)
6. [HATEOAS (Hypermedia-Driven REST)](#6-hateoas-hypermedia-driven-rest)
7. [Internationalization (i18n)](#7-internationalization-i18n)
8. [Multi-Tenancy](#8-multi-tenancy)
9. [Spring Boot 3.x & Java 17+ Features](#9-spring-boot-3x--java-17-features)
10. [GraalVM Native Image](#10-graalvm-native-image)
11. [Spring Modulith (Modular Monolith)](#11-spring-modulith-modular-monolith)
12. [API Rate Limiting & Throttling](#12-api-rate-limiting--throttling)
13. [Spring Data REST](#13-spring-data-rest)
14. [Liquibase (DB Migrations Alternative)](#14-liquibase-db-migrations-alternative)

---


## Roadmap

This chapter covers 14 independent topics: WebSocket, SSE, GraphQL, gRPC, Spring Batch, Pagination, HATEOAS, i18n, Multi-Tenancy, Java 17+ features, GraalVM, Modulith, Rate Limiting, and Liquibase. Suggested future splits (approximate — actual breaks follow the file's `## ` headers):

- **Part A (lines ~1-400):** Real-time — WebSocket/SSE (WHY/HOW), GraphQL (WHY/HOW)
- **Part B (lines ~400-800):** Service communication — gRPC (WHY/HOW), Spring Batch fundamentals
- **Part C (lines ~800-1200):** Data patterns — Pagination, HATEOAS
- **Part D (lines ~1200-1911):** Platform features — i18n, Multi-Tenancy, Spring Boot 3.x upgrades, GraalVM Native Image, Modulith, Rate Limiting, Liquibase

Use these markers as approximation; the file has not been split yet.

# 1. WebSockets & Server-Sent Events (SSE)

## WHY WebSockets?

HTTP is **request-response** → client always initiates.
But what if the SERVER needs to push data to the client?

| Scenario             | HTTP Polling        | WebSocket    | SSE             |
| -------------------- | ------------------- | ------------ | --------------- |
| Chat app             | ❌ Wastes bandwidth | ✅ Perfect   | ❌ One-way only |
| Live scores          | ❌ Delayed          | ✅ Real-time | ✅ Good enough  |
| Stock prices         | ❌ Too slow         | ✅ Best      | ✅ Acceptable   |
| Notifications        | ❌ Polling overhead | ✅ Instant   | ✅ Perfect      |
| File upload progress | ❌                  | ✅           | ✅              |

### The Problem with HTTP Polling

```
Client: "Any new messages?" → Server: "No"       (wasted request)
Client: "Any new messages?" → Server: "No"       (wasted request)
Client: "Any new messages?" → Server: "Yes! Here" (finally useful)
```

**Flow:**

1. Client: 'Any new messages?'
2. Server: 'No' (wasted request)
3. Client: 'Any new messages?'
4. Server: 'No' (wasted request)
5. Client: 'Any new messages?'
6. Server: 'Yes! Here' (finally useful)

```text
+-------------------+                                +-------------------+
|                   |  --- (1) Any messages? ---->   |                   |
|      Client       |  <--------- (2) No ---------   |      Server       |
|                   |                                |                   |
|                   |  --- (3) Any messages? ---->   |                   |
|                   |  <--------- (4) No ---------   |                   |
|                   |                                |                   |
|                   |  --- (5) Any messages? ---->   |                   |
|                   |  <------ (6) Yes! Here -----   |                   |
+-------------------+                                +-------------------+
```

**1000 users polling every 2 seconds = 500 requests/second doing NOTHING**

### The Hidden Cost of WebSockets (Why Polling is Sometimes Better)

Many believe holding a WebSocket connection is "free" because it doesn't incur the HTTP header overhead. **It is not free.**

Every open WebSocket on the server eats persistent memory:

- **~1KB** for the OS File Descriptor (FD)
- **~128KB** (default) for TCP Send/Receive Buffers natively allocated by the OS
- **~2-5KB** for the application library state (Spring, Node, etc.)

When you have **100,000 idle users** holding open WebSockets, your server is constantly pinning **2 to 10 GB of RAM** just doing absolutely nothing.

**The Polling Advantage:**
With HTTP Polling, the connection is alive for maybe **50ms**. The server replies and _instantly_ recycles that memory for the next user.

**Architectural Takeaway:**
Before defaulting to WebSockets, ask: _Does this actually need a persistent two-way connection?_
If users only get a real notification every 2 hours, polling every 30 seconds uses **significantly less server memory** than holding a persistent pipe. WebSockets excel for **high-frequency, bidirectional exchanges** (multiplayer games, live trading), but fail as idle event listeners at scale.

---

### Production Reality Checks Before Choosing WebSockets

The exact memory numbers depend on OS socket buffer settings, TLS, compression, framework session objects, STOMP subscriptions, reverse proxy state, and Kubernetes/load-balancer connection tracking. The architectural point still holds: **an idle persistent connection is not free just because it is quiet.**

Hidden costs to remember:

- **Kernel state:** file descriptors, socket buffers, TCP keepalive metadata.
- **Runtime state:** WebSocket session objects, message queues, subscriptions, auth principal/context.
- **Network edge state:** load balancer connection tables, proxy buffers, sticky routing.
- **Operational state:** graceful deploy draining, reconnect storms, heartbeat traffic, backpressure handling.

### Choosing Polling vs SSE vs WebSocket

| Need                                                     | Best Fit       | Why                                                |
| -------------------------------------------------------- | -------------- | -------------------------------------------------- |
| User refreshes rarely and latency can be seconds/minutes | Normal polling | Simple, cheap, stateless between requests          |
| Server pushes events one-way                             | SSE            | One persistent HTTP stream, simpler than WebSocket |
| Client and server both send frequent events              | WebSocket      | True bidirectional low-latency pipe                |
| Mobile clients with unreliable networks                  | Polling or SSE | Easier reconnect/retry behavior                    |
| Multiplayer/editor/trading/typing indicators             | WebSocket      | Latency and bidirectionality matter                |
| Notification every few hours                             | Polling        | Persistent memory is usually wasteful              |

Rule:

```text
Low frequency + one-way-ish updates  -> polling or SSE
High frequency + bidirectional state -> WebSocket
```

For 100,000 users polling every 30 seconds, the average request rate is roughly:

```text
100,000 / 30 = 3,333 requests per second
```

If each request occupies the server for roughly `50ms`, the average active request concurrency is closer to:

```text
3,333 * 0.05 = about 167 active requests
```

That may sound high, but each request is short-lived and horizontally scalable through stateless HTTP. A WebSocket design may reduce request count, but it pins long-lived memory and connection state. The winning design depends on which resource is actually scarce: CPU/request handling, memory/connection count, latency, or operational simplicity.

### WebSocket = Persistent Two-Way Connection

```text
+-------------------+                                  +-------------------+
|                   |  <===== Persistent TCP Pipe ===> |                   |
|                   |                                  |                   |
|      Client       |  <------ (Msg pushed) ---------  |      Server       |
|                   |       "Hey, new message!"        |                   |
|                   |                                  |                   |
|                   |  ------- (Msg pushed) -------->  |                   |
|                   |         "I'm typing..."          |                   |
+-------------------+                                  +-------------------+
```

## HOW — WebSocket in Spring Boot

### Step 1: Add Dependency

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### Step 2: Configure WebSocket with STOMP

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // WHY: Define where the WebSocket connection is established
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")          // Client connects here
                .setAllowedOrigins("*")       // CORS for WebSocket
                .withSockJS();                // Fallback for old browsers
    }

    // WHY: Define message routing rules
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");      // Client → Server
        registry.enableSimpleBroker("/topic", "/queue");         // Server → Client
        // /topic = broadcast to all subscribers
        // /queue = private messages to specific user
    }
}
```

### Step 3: Create Message Controller

```java
@Controller
public class ChatController {

    // WHY @MessageMapping: Like @PostMapping but for WebSocket messages
    @MessageMapping("/chat.send")              // Client sends to /app/chat.send
    @SendTo("/topic/public")                   // Broadcast to all subscribers
    public ChatMessage sendMessage(@Payload ChatMessage message) {
        return message;  // This goes to EVERYONE subscribed to /topic/public
    }

    // WHY @SendToUser: Private message to specific user
    @MessageMapping("/chat.private")
    @SendToUser("/queue/private")              // Only sender gets the response
    public ChatMessage privateMessage(@Payload ChatMessage message,
                                       Principal principal) {
        message.setSender(principal.getName());
        return message;
    }
}
```

### Step 4: Send Messages from Backend (SimpMessagingTemplate)

```java
@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    // WHY: Send messages from ANY service, not just controllers
    public void notifyAll(String message) {
        messagingTemplate.convertAndSend("/topic/notifications", message);
    }

    // WHY: Send to specific user
    public void notifyUser(String userId, String message) {
        messagingTemplate.convertAndSendToUser(
            userId, "/queue/private", message
        );
    }
}
```

🔬 **Section Challenge — HOW — WebSocket in Spring Boot**

**Challenge 1 (Architecture Reasoning):** A notification feature sends a real update once every few hours, but a developer wants every browser tab to keep a WebSocket open all day. What hidden cost should you challenge?

<details><summary>Trace, Reasoning & Debug</summary>

Each open WebSocket keeps server-side state alive: file descriptor, TCP buffers, framework session objects, heartbeat timers, and load-balancer connection tracking. At 100k mostly idle users, "nothing happening" can still pin large amounts of memory and operational capacity.

WebSockets are excellent for high-frequency bidirectional flows such as chat typing indicators, trading dashboards, multiplayer games, and collaborative editing. For rare notifications, polling, long polling, SSE, or push notification infrastructure may be cheaper and simpler.

The decision rule: choose WebSocket when the product truly needs persistent two-way low-latency communication. If the server only occasionally informs the client, compare memory cost, reconnect behavior, proxy support, and acceptable notification delay before defaulting to a persistent pipe.

</details>

## HOW — Server-Sent Events (SSE)

**WHY SSE over WebSocket?**

- Simpler — just HTTP, no special protocol
- Auto-reconnect built-in
- Works through proxies/firewalls that block WebSocket
- Perfect when you only need SERVER → CLIENT (one-way)

```java
@RestController
public class SSEController {

    // WHY SseEmitter: Spring's way to hold HTTP connection open
    @GetMapping("/stream/events")
    public SseEmitter streamEvents() {
        SseEmitter emitter = new SseEmitter(30_000L); // 30sec timeout

        // WHY: Run in separate thread so we don't block Tomcat thread
        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    emitter.send(SseEmitter.event()
                            .name("stock-update")        // Event name
                            .id(String.valueOf(i))        // Event ID (for reconnect)
                            .data("AAPL: $" + (150 + i))  // Your data
                            .reconnectTime(3000));         // Retry after 3s
                    Thread.sleep(1000);
                }
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        executor.shutdown();
        return emitter;
    }

    // WHY Flux: WebFlux style — cleaner, non-blocking
    @GetMapping(value = "/stream/prices", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<StockPrice> streamPrices() {
        return Flux.interval(Duration.ofSeconds(1))
                   .map(i -> new StockPrice("AAPL", 150.0 + Math.random() * 10));
    }
}
```

### When to Use What?

| Feature           | WebSocket     | SSE                  | Long Polling     |
| ----------------- | ------------- | -------------------- | ---------------- |
| Direction         | Bidirectional | Server → Client      | Request-Response |
| Protocol          | ws://         | http://              | http://          |
| Reconnect         | Manual        | Automatic            | Manual           |
| Binary data       | ✅ Yes        | ❌ Text only         | ✅ Yes           |
| Firewall friendly | ❌ May block  | ✅ Normal HTTP       | ✅ Normal HTTP   |
| Use case          | Chat, Gaming  | Notifications, Feeds | Legacy systems   |
| Complexity        | High          | Low                  | Medium           |

### 📌 Pitfall

```java
// ❌ WRONG: Don't use WebSocket for everything
// If data flows only one way (server → client), use SSE
// WebSocket adds complexity with connection management

// ❌ WRONG: Blocking inside WebSocket handler
@MessageMapping("/chat")
public ChatMessage handle(ChatMessage msg) {
    Thread.sleep(5000); // BLOCKS the WebSocket thread pool!
    return msg;
}

// ✅ RIGHT: Use @Async or queue for heavy processing
@MessageMapping("/chat")
public ChatMessage handle(ChatMessage msg) {
    heavyProcessorService.processAsync(msg); // Non-blocking
    return msg;
}
```

### Interview Questions

1. **Q: WebSocket vs HTTP?** A: HTTP = stateless request-response. WebSocket = persistent bidirectional. Use WS for real-time (chat, gaming).
2. **Q: What is STOMP?** A: Simple Text Oriented Messaging Protocol — adds structure (headers, body) on top of raw WebSocket.
3. **Q: How to scale WebSocket across multiple servers?** A: Use a message broker like Redis/RabbitMQ as the STOMP broker instead of SimpleBroker.

---

# 2. GraphQL with Spring Boot

## WHY GraphQL?

REST problem: **Over-fetching** and **Under-fetching**

```
REST GET /api/users/1
Response: { id, name, email, phone, address, orders, preferences, ... }
→ You only needed name and email (OVER-FETCHING)

REST GET /api/users/1  → gets user
REST GET /api/users/1/orders → gets orders
REST GET /api/orders/5/items → gets items
→ 3 API calls for 1 page (UNDER-FETCHING)
```

**REST Example (Multiple Round-Trips):**

```text
[Client] ---- GET /api/users/1 --------------> [Server]
         <--- (User profile, 50 fields) ------

[Client] ---- GET /api/users/1/orders -------> [Server]
         <--- (List of order IDs) ------------

[Client] ---- GET /api/orders/5/items -------> [Server]
         <--- (Item details) -----------------
```

GraphQL solution: **Client asks for EXACTLY what it needs**

```graphql
query {
    user(id: 1) {
        name
        email
        orders {
            items { name, price }
        }
    }
}
→ ONE request, EXACT data
```

🔬 **Section Challenge — WHY GraphQL?**

**Challenge 1 (GraphQL Reasoning):** A mobile app migrates from REST to GraphQL to eliminate over-fetching, but the backend starts crashing with `OutOfMemoryError` when clients request deeply nested historical data. What went wrong?

<details><summary>Trace, Reasoning & Debug</summary>

GraphQL solves client over-fetching, but it can move the danger to the server. A single flexible query can ask for unbounded nested lists, causing the gateway to fetch, buffer, and serialize massive object graphs.

The server must treat query shape as an input constraint. Depth, complexity, list size, resolver fan-out, and pagination are part of the API contract.

Fix with query depth limits, query complexity analysis, mandatory cursor pagination for list fields, resolver timeouts, and DataLoader batching where nested fields call downstream services.

</details>

## HOW — Spring for GraphQL

### Step 1: Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-graphql</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### Step 2: Define Schema (src/main/resources/graphql/schema.graphqls)

```graphql
# WHY Schema First: Contract between frontend and backend
type Query {
  userById(id: ID!): User
  allUsers(page: Int, size: Int): [User!]!
  searchUsers(name: String!): [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

type User {
  id: ID!
  name: String!
  email: String!
  orders: [Order!]! # Resolved lazily (only if requested)
}

type Order {
  id: ID!
  total: Float!
  items: [OrderItem!]!
}

type OrderItem {
  productName: String!
  quantity: Int!
  price: Float!
}

input CreateUserInput {
  name: String!
  email: String!
}

input UpdateUserInput {
  name: String
  email: String
}
```

🔬 **Section Challenge — HOW — Spring for GraphQL**

**Challenge 1 (Resolver Reasoning):** A Spring for GraphQL gateway resolves `orders` for 50 users by calling the Order Service once per user. Latency jumps above 3 seconds. What is the bug shape?

<details><summary>Trace, Reasoning & Debug</summary>

The bug is distributed N+1. The top-level query fetches users once, then the nested `orders` field resolver fans out into 50 separate downstream calls.

GraphQL makes nested data easy to request, but every nested field has resolver cost. In a microservice gateway, resolver cost can become network cost.

Fix with the DataLoader pattern and Spring `@BatchMapping`: collect all user ids for the current query execution, make one bulk request to the Order Service, then map results back to each user.

</details>

### Step 3: Create Controllers (Spring way)

```java
@Controller
public class UserGraphQLController {

    private final UserService userService;
    private final OrderService orderService;

    // WHY @QueryMapping: Maps to Query type in schema
    @QueryMapping
    public User userById(@Argument Long id) {
        return userService.findById(id);
    }

    @QueryMapping
    public List<User> allUsers(@Argument int page, @Argument int size) {
        return userService.findAll(PageRequest.of(page, size)).getContent();
    }

    // WHY @MutationMapping: Maps to Mutation type in schema
    @MutationMapping
    public User createUser(@Argument CreateUserInput input) {
        return userService.create(input);
    }

    // WHY @SchemaMapping: Resolves nested fields (lazy loading!)
    // Only called if client REQUESTS the orders field
    @SchemaMapping(typeName = "User", field = "orders")
    public List<Order> getOrders(User user) {
        return orderService.findByUserId(user.getId());
    }
}
```

### Step 4: N+1 Problem Solution with DataLoader

```java
// WHY: Without DataLoader, fetching 100 users with orders = 101 queries
// With DataLoader, it's 2 queries (1 for users, 1 batch for all orders)

@Controller
public class UserGraphQLController {

    // WHY @BatchMapping: Batch-loads related data
    @BatchMapping(typeName = "User", field = "orders")
    public Map<User, List<Order>> orders(List<User> users) {
        // ONE query for ALL users' orders
        List<Long> userIds = users.stream().map(User::getId).toList();
        Map<Long, List<Order>> orderMap = orderService.findByUserIds(userIds);

        return users.stream().collect(Collectors.toMap(
            user -> user,
            user -> orderMap.getOrDefault(user.getId(), List.of())
        ));
    }
}
```

### Step 5: Error Handling

```java
@ControllerAdvice
public class GraphQLExceptionHandler {

    @GraphQlExceptionHandler
    public GraphQLError handleNotFound(UserNotFoundException ex) {
        return GraphQLError.newError()
                .errorType(ErrorType.NOT_FOUND)
                .message(ex.getMessage())
                .build();
    }
}
```

### Step 6: Configuration

```yaml
spring:
  graphql:
    graphiql:
      enabled: true # Interactive playground at /graphiql
    schema:
      inspection:
        enabled: true # Schema introspection
    path: /graphql # Default endpoint
```

### GraphQL vs REST Decision

| Criteria                | REST              | GraphQL          |
| ----------------------- | ----------------- | ---------------- |
| Simple CRUD             | ✅ Perfect        | Overkill         |
| Complex nested data     | ❌ Multiple calls | ✅ Single query  |
| Mobile apps (bandwidth) | ❌ Over-fetching  | ✅ Exact data    |
| Caching                 | ✅ HTTP caching   | ❌ Complex       |
| File uploads            | ✅ Native         | ❌ Workarounds   |
| Real-time               | WebSocket         | ✅ Subscriptions |
| Learning curve          | ✅ Easy           | ❌ Steeper       |

### 📌 Pitfall

```java
// ❌ WRONG: Allowing unlimited query depth
// A malicious query could crash your server:
// query { user { orders { items { product { reviews { author { orders { ... }}}}}}}

// ✅ RIGHT: Set max depth and complexity limits
spring.graphql.schema.introspection.enabled=false  // Disable in prod
// Use graphql-java-extended-validation for depth/complexity limiting
```

### Interview Questions

1. **Q: GraphQL vs REST?** A: REST = multiple endpoints, fixed structure. GraphQL = single endpoint, client-defined structure. Use GraphQL when frontend needs vary widely.
2. **Q: What is N+1 in GraphQL?** A: Each nested field triggers a separate query. Solution: @BatchMapping / DataLoader.
3. **Q: What are Subscriptions?** A: Real-time GraphQL — server pushes updates over WebSocket when data changes.

---

# 3. gRPC with Spring Boot

## WHY gRPC?

REST uses **JSON over HTTP/1.1** — human-readable but SLOW for service-to-service.

```
REST: Client → JSON text → HTTP/1.1 → Parse JSON → Server
gRPC: Client → Binary protobuf → HTTP/2 → Deserialize → Server
```

| Feature         | REST                | gRPC                  |
| --------------- | ------------------- | --------------------- |
| Format          | JSON (text)         | Protobuf (binary)     |
| Protocol        | HTTP/1.1            | HTTP/2                |
| Speed           | Baseline            | 7-10x faster          |
| Streaming       | No (SSE workaround) | Native (4 types)      |
| Contract        | OpenAPI (optional)  | .proto (required)     |
| Browser support | ✅ Native           | ❌ Needs proxy        |
| Use case        | Public APIs         | Microservice internal |

## HOW — gRPC in Spring Boot

### Step 1: Define .proto File (src/main/proto/user.proto)

```protobuf
syntax = "proto3";

package com.example.grpc;

// WHY: Contract-first — proto file IS the API documentation
service UserService {
    rpc GetUser (UserRequest) returns (UserResponse);           // Unary
    rpc ListUsers (ListRequest) returns (stream UserResponse);  // Server streaming
    rpc CreateUsers (stream UserRequest) returns (BatchResult);  // Client streaming
    rpc Chat (stream Message) returns (stream Message);          // Bidirectional
}

message UserRequest {
    int64 id = 1;
}

message UserResponse {
    int64 id = 1;
    string name = 2;
    string email = 3;
}

message ListRequest {
    int32 page = 1;
    int32 size = 2;
}

message BatchResult {
    int32 created_count = 1;
}

message Message {
    string content = 1;
    string sender = 2;
}
```

### Step 2: Implement Server

```java
@GrpcService
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {

    private final UserRepository userRepository;

    @Override
    public void getUser(UserRequest request,
                        StreamObserver<UserResponse> responseObserver) {
        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> new StatusRuntimeException(Status.NOT_FOUND));

        UserResponse response = UserResponse.newBuilder()
                .setId(user.getId())
                .setName(user.getName())
                .setEmail(user.getEmail())
                .build();

        responseObserver.onNext(response);     // Send response
        responseObserver.onCompleted();         // Signal completion
    }

    // WHY Server Streaming: Send multiple responses (e.g., large datasets)
    @Override
    public void listUsers(ListRequest request,
                          StreamObserver<UserResponse> responseObserver) {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            responseObserver.onNext(toResponse(user));   // Send one by one
        }
        responseObserver.onCompleted();
    }
}
```

### Step 3: gRPC Client

```java
@Service
public class UserGrpcClient {

    private final UserServiceGrpc.UserServiceBlockingStub blockingStub;

    public UserGrpcClient(@GrpcClient("user-service") Channel channel) {
        this.blockingStub = UserServiceGrpc.newBlockingStub(channel);
    }

    public UserResponse getUser(long id) {
        UserRequest request = UserRequest.newBuilder().setId(id).build();
        return blockingStub.getUser(request); // Type-safe call!
    }
}
```

### 4 Streaming Modes

```text
1. Unary:         [Client] --- (1 Request) ---> [Server]
                  [Client] <--- (1 Response) -- [Server]

2. Server Stream: [Client] --- (1 Request) ---> [Server]
                  [Client] <--- (N Responses) - [Server] (Streaming!)

3. Client Stream: [Client] --- (N Requests) --> [Server] (Streaming!)
                  [Client] <--- (1 Response) -- [Server]

4. Bidirectional: [Client] <=== (N Messages) => [Server] (Full Duplex)
```

### Interview Questions

1. **Q: When gRPC over REST?** A: Internal microservice communication where speed matters. REST for public/browser APIs.
2. **Q: What is Protocol Buffers?** A: Binary serialization format — smaller, faster than JSON. Needs .proto schema file.
3. **Q: 4 types of gRPC calls?** A: Unary, Server streaming, Client streaming, Bidirectional streaming.

---

🔬 **Section Challenge — HOW — gRPC in Spring Boot**

**Challenge 1 (Reasoning):** Why is gRPC significantly faster and more efficient than standard REST APIs over HTTP/1.1 for internal microservice communication?

<details><summary>Answer</summary>

Protocol Buffers and HTTP/2. REST typically serializes payloads as massive, human-readable JSON strings over HTTP/1.1 (which suffers from Head-of-Line blocking). gRPC uses Protocol Buffers (protobufs), a tightly packed binary serialization format that is much smaller to parse. Furthermore, gRPC runs strictly on HTTP/2, allowing true bidirectional streaming, multiplexed requests over a single TCP connection, and built-in header compression.

</details>

# 4. Spring Batch (Batch Processing)

## WHY Spring Batch?

Your app needs to:

- Process 10 million records from CSV → Database
- Generate monthly reports for 50,000 users
- Migrate data between systems
- Send 100,000 emails nightly

You can't do this with REST APIs. You need **batch processing**.

🔬 **Section Challenge — WHY Spring Batch?**

**Challenge 1 (Batch Reasoning):** An API endpoint tries to process 10 million CSV rows in one HTTP request. It times out, retries create duplicates, and partial failures are impossible to resume. Why is this a Spring Batch problem instead of a controller problem?

<details><summary>Trace, Reasoning & Debug</summary>

HTTP request/response is built for bounded interactive work. A massive import needs checkpointing, chunk commits, retry/skip policy, restartability, metrics, and a job execution history.

Spring Batch models the work as a `Job` made of `Step`s. Each step reads, processes, and writes chunks transactionally. If row 7,000,000 fails, the system can resume from the last committed checkpoint instead of restarting the entire import.

Use a controller only to submit/start the job and return a job id. Let Spring Batch own long-running processing, idempotency, restart behavior, and operational visibility.

</details>
</details>

## HOW — Core Concepts

```text
======================= SPRING BATCH JOB ========================
|                                                               |
|  [Step 1: Ingest Data]                                        |
|   +---------------+     +---------------+    +------------+   |
|   |  ItemReader   | --> | ItemProcessor | -> | ItemWriter |   |
|   | (Read 1 by 1) |     | (Transform)   |    | (By Chunk) |   |
|   +---------------+     +---------------+    +------------+   |
|           |                                                   |
|           V                                                   |
|  [Step 2: Validate Data]                                      |
|                                                               |
|  [Step 3: Generate Summary Report]                            |
|                                                               |
=================================================================
```

### Step 1: Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-batch</artifactId>
</dependency>
```

### Step 2: Define a Job

```java
@Configuration
public class UserImportJobConfig {

    @Bean
    public Job importUserJob(JobRepository jobRepository,
                              Step csvToDbStep,
                              Step validationStep) {
        return new JobBuilder("importUserJob", jobRepository)
                .start(csvToDbStep)               // Step 1
                .next(validationStep)              // Step 2
                .build();
    }

    @Bean
    public Step csvToDbStep(JobRepository jobRepository,
                            PlatformTransactionManager transactionManager,
                            ItemReader<UserCsv> reader,
                            ItemProcessor<UserCsv, User> processor,
                            ItemWriter<User> writer) {
        return new StepBuilder("csvToDbStep", jobRepository)
                .<UserCsv, User>chunk(100, transactionManager)  // Process 100 at a time
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .faultTolerant()
                .skipLimit(10)                     // Skip up to 10 bad records
                .skip(ParseException.class)        // Skip parse errors
                .retryLimit(3)                     // Retry up to 3 times
                .retry(DeadlockLoserDataAccessException.class)
                .build();
    }
}
```

### Step 3: ItemReader (Read from CSV)

```java
@Bean
public FlatFileItemReader<UserCsv> reader() {
    return new FlatFileItemReaderBuilder<UserCsv>()
            .name("userReader")
            .resource(new ClassPathResource("users.csv"))
            .delimited()
            .names("name", "email", "phone")     // CSV columns
            .targetType(UserCsv.class)
            .build();
}

// WHY: Also supports JDBC, JPA, JSON, XML readers
@Bean
public JdbcCursorItemReader<User> jdbcReader(DataSource dataSource) {
    return new JdbcCursorItemReaderBuilder<User>()
            .name("jdbcReader")
            .dataSource(dataSource)
            .sql("SELECT id, name, email FROM users WHERE processed = false")
            .rowMapper(new UserRowMapper())
            .build();
}
```

### Step 4: ItemProcessor

```java
@Component
public class UserProcessor implements ItemProcessor<UserCsv, User> {

    @Override
    public User process(UserCsv csv) throws Exception {
        // WHY: Return null to SKIP this record (filtering!)
        if (csv.getEmail() == null || csv.getEmail().isBlank()) {
            return null; // Skipped — not written
        }

        return User.builder()
                .name(csv.getName().trim().toUpperCase())
                .email(csv.getEmail().toLowerCase())
                .build();
    }
}
```

### Step 5: ItemWriter

```java
@Bean
public JdbcBatchItemWriter<User> writer(DataSource dataSource) {
    return new JdbcBatchItemWriterBuilder<User>()
            .sql("INSERT INTO users (name, email) VALUES (:name, :email)")
            .dataSource(dataSource)
            .beanMapped()
            .build();
}
```

### Step 6: Launch Job

```java
@RestController
public class JobController {

    private final JobLauncher jobLauncher;
    private final Job importUserJob;

    @PostMapping("/api/jobs/import")
    public String runJob() throws Exception {
        JobParameters params = new JobParametersBuilder()
                .addString("timestamp", Instant.now().toString()) // Unique run
                .toJobParameters();
        jobLauncher.run(importUserJob, params);
        return "Job started!";
    }
}
```

### Chunk Processing Visualization

```text
[ CSV File (10,000 records) ]
           |
           v
[ Read 1-by-1 ]  (ItemReader)
           |
           v
[ Process 1-by-1 ] (ItemProcessor)
           |
           v
[ Buffer until Chunk Size (100) Reached ]
           |
           +--> [ Chunk 1: Records 1..100 ]   ----> (INSERT 100 rows, 1 Commit)
           |
           +--> [ Chunk 2: Records 101..200 ] ----> (INSERT 100 rows, 1 Commit)
           |
           +--> ...
           |
           +--> [ Chunk 100: Records 9901..]  ----> (INSERT 100 rows, 1 Commit)
```

**WHY Chunks?**

- **Memory Efficient:** Avoid loading all 10,000 records into RAM at once.
- **Transaction Safety:** If Chunk 50 fails, only 100 records roll back.
- **Restartability:** Can resume processing from exactly where the job failed.

### Interview Questions

1. **Q: What is chunk processing?** A: Read items one by one, process one by one, then write in batches (chunks). Efficient + transactional.
2. **Q: Job vs Step?** A: Job = entire batch process. Step = one phase (read-process-write). A Job has 1+ Steps.
3. **Q: How to handle failures?** A: skip(), retry(), and restartability. Spring Batch tracks progress in its metadata tables.

---

# 5. Pagination & Sorting Deep Dive

## WHY Pagination?

```java
// ❌ NEVER do this in production
List<User> users = userRepository.findAll(); // 10 MILLION users in memory = OOM crash

// ✅ Always paginate
Page<User> users = userRepository.findAll(PageRequest.of(0, 20)); // Just 20 users
```

🔬 **Section Challenge — WHY Pagination?**

**Challenge 1 (Reasoning):** Without Pagination, what are the primary architectural bottlenecks that could cause a REST API endpoint returning a large database table to crash an application server?

<details><summary>Answer</summary>

Two primary bottlenecks occur:

1. **Memory Exhaustion (OOM):** The ORM (like Hibernate) will pull all millions of rows into JVM memory simultaneously to construct objects, causing a massive GC spike and an OutOfMemoryError.
2. **Network/Bandwidth Saturation:** Serializing 10 million entities into JSON and pushing them over the TCP socket will overwhelm the network buffer and cause widespread timeout failures for the client, blocking threads waiting for the operation to complete.
</details>

## HOW — Spring Data Pagination

### Basic Pagination

```java
// WHY Page: Contains data + metadata (totalPages, totalElements, hasNext)
@GetMapping("/api/users")
public Page<UserDTO> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "name") String sortBy,
        @RequestParam(defaultValue = "asc") String direction) {

    Sort sort = direction.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

    Pageable pageable = PageRequest.of(page, size, sort);
    return userRepository.findAll(pageable).map(userMapper::toDTO);
}

// WHY: Response looks like:
// {
//   "content": [{ user1 }, { user2 }, ...],
//   "totalPages": 500,
//   "totalElements": 10000,
//   "number": 0,          ← current page
//   "size": 20,           ← page size
//   "first": true,
//   "last": false,
//   "hasNext": true
// }
```

### Multi-Column Sorting

```java
// WHY: Sort by multiple fields — e.g., department ASC, then salary DESC
Sort sort = Sort.by(
    Sort.Order.asc("department"),
    Sort.Order.desc("salary"),
    Sort.Order.asc("name")
);
Pageable pageable = PageRequest.of(0, 20, sort);
```

### Slice vs Page

```java
// Page: Runs COUNT query (knows total) — EXPENSIVE for large tables
Page<User> page = userRepository.findAll(pageable);
// SELECT * FROM users LIMIT 20 OFFSET 0
// SELECT COUNT(*) FROM users          ← Extra query!

// Slice: No COUNT query — only knows hasNext — FASTER
Slice<User> slice = userRepository.findAll(pageable);
// SELECT * FROM users LIMIT 21 OFFSET 0   ← Fetches 21, shows 20, knows if more

// WHY Slice? Instagram-style "Load More" doesn't need total count
// WHY Page? Admin dashboards showing "Page 3 of 500"
```

### Cursor-Based Pagination (For Large Datasets)

```java
// WHY: OFFSET-based pagination gets SLOWER as pages increase
// Page 1: OFFSET 0     → Fast
// Page 500: OFFSET 10000 → DB skips 10,000 rows first!

// Cursor-based: Always fast, uses indexed column
@GetMapping("/api/users/cursor")
public List<UserDTO> getUsersCursor(
        @RequestParam(required = false) Long afterId,   // Last seen ID
        @RequestParam(defaultValue = "20") int limit) {

    if (afterId == null) {
        return userRepository.findTopNOrderById(limit);
    }
    // WHERE id > :afterId ORDER BY id LIMIT 20 → Always uses index!
    return userRepository.findByIdGreaterThanOrderByIdAsc(afterId,
            PageRequest.of(0, limit));
}
```

### 📌 Pitfall

```java
// ❌ WRONG: Paginating in Java instead of database
List<User> all = userRepository.findAll();              // Load ALL into memory
List<User> page = all.subList(0, 20);                    // Java pagination

// ✅ RIGHT: Let database do the pagination
Page<User> page = userRepository.findAll(PageRequest.of(0, 20)); // DB does LIMIT/OFFSET
```

### Interview Questions

1. **Q: Page vs Slice?** A: Page runs COUNT query (knows total). Slice doesn't (faster). Use Slice for infinite scroll, Page for numbered pages.
2. **Q: Why is OFFSET slow for large pages?** A: DB must scan and skip N rows. Solution: cursor-based (keyset) pagination.
3. **Q: How to sort by multiple columns?** A: `Sort.by(Order.asc("col1"), Order.desc("col2"))`.

---

🔬 **Section Challenge — HOW — Spring Data Pagination**

**Challenge 1 (Pagination Reasoning):** Your endpoint uses `Page<User>` for a table with 50 million rows, and every request is slow even though the page size is only 20. What hidden query can make `Page` expensive?

<details><summary>Trace, Reasoning & Debug</summary>

`Page` usually runs two queries: the data query and a `COUNT(*)` query to compute total pages. On huge filtered datasets, the count can dominate latency even when the returned page is small.

If the UI only needs "is there a next page?", use `Slice` instead of `Page`. If users paginate deeply, offset pagination can also become slow because the database must skip many rows.

For large feeds, prefer keyset/cursor pagination using a stable indexed sort key such as `(created_at, id)`. Keep offset pagination for small admin tables where total page counts are genuinely needed.

</details>
</details>

# 6. HATEOAS (Hypermedia-Driven REST)

## ❓ Why Hateoas?

Normal REST: Client must KNOW all URLs

```json
GET /api/users/1
{ "id": 1, "name": "Harsha" }
// Client must know: /api/users/1/orders, /api/users/1/profile, etc.
```

HATEOAS REST: Response TELLS client what's possible

```json
GET /api/users/1
{
    "id": 1,
    "name": "Harsha",
    "_links": {
        "self": { "href": "/api/users/1" },
        "orders": { "href": "/api/users/1/orders" },
        "update": { "href": "/api/users/1", "method": "PUT" },
        "delete": { "href": "/api/users/1", "method": "DELETE" }
    }
}
```

**The API is self-documenting — clients discover capabilities from responses.**

## HOW — Spring HATEOAS

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```

```java
@RestController
public class UserController {

    @GetMapping("/api/users/{id}")
    public EntityModel<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);

        return EntityModel.of(user,
            linkTo(methodOn(UserController.class).getUser(id)).withSelfRel(),
            linkTo(methodOn(OrderController.class).getOrders(id)).withRel("orders"),
            linkTo(methodOn(UserController.class).getAllUsers()).withRel("all-users")
        );
    }

    @GetMapping("/api/users")
    public CollectionModel<EntityModel<User>> getAllUsers() {
        List<EntityModel<User>> users = userService.findAll().stream()
            .map(user -> EntityModel.of(user,
                linkTo(methodOn(UserController.class).getUser(user.getId())).withSelfRel()))
            .toList();

        return CollectionModel.of(users,
            linkTo(methodOn(UserController.class).getAllUsers()).withSelfRel());
    }
}
```

### Interview Questions

1. **Q: What is HATEOAS?** A: Hypermedia As The Engine Of Application State — REST responses include links to related actions/resources.
2. **Q: Why use it?** A: Decouples client from URL structure. API is self-discoverable. Easier versioning.

---

🔬 **Section Challenge — HOW — Spring HATEOAS**

**Challenge 1 (API Design Reasoning):** A REST client hardcodes `/users/{id}/orders`, `/users/{id}/profile`, and `/users/{id}/disable`. What does HATEOAS change, and when is the extra response metadata worth it?

<details><summary>Trace, Reasoning & Debug</summary>

Without hypermedia, the client must know every URL and state transition ahead of time. If the API changes paths or allowed actions based on state, clients become brittle.

HATEOAS embeds links and affordances in the response, such as `self`, `orders`, `update`, or `disable`. The client discovers what it can do next instead of constructing every URL manually.

Use it when API discoverability, workflow state, or third-party client evolution matters. Skip it for simple internal APIs where typed clients, OpenAPI contracts, and direct endpoints are cheaper and clearer.

</details>
</details>

# 7. Internationalization (i18n)

## WHY i18n?

Your app serves users in India (Hindi), USA (English), Japan (Japanese).
Error messages, labels, emails — all need translation.

## HOW

### Step 1: Create Message Files

**src/main/resources/**

- messages.properties              # Default (Usually English)
- messages_hi.properties           # Hindi locale translations
- messages_ja.properties           # Japanese locale translations
- messages_te.properties           # Telugu locale translations

```properties
# messages.properties (English - default)
user.welcome=Welcome, {0}!
user.not.found=User not found with ID: {0}
validation.email.invalid=Email format is invalid
error.server=Internal server error

# messages_hi.properties (Hindi)
user.welcome=स्वागत है, {0}!
user.not.found=इस आईडी वाला उपयोगकर्ता नहीं मिला: {0}
```

### Step 2: Configure Locale Resolver

```java
@Configuration
public class LocaleConfig {

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.ENGLISH);
        return resolver;
    }

    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource source =
            new ReloadableResourceBundleMessageSource();
        source.setBasename("classpath:messages");
        source.setDefaultEncoding("UTF-8");
        return source;
    }
}
```

### Step 3: Use in Controller

```java
@RestController
public class UserController {

    private final MessageSource messageSource;

    @GetMapping("/api/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id, Locale locale) {
        // WHY Locale param: Spring auto-resolves from Accept-Language header
        User user = userService.findById(id)
            .orElseThrow(() -> new NotFoundException(
                messageSource.getMessage("user.not.found", new Object[]{id}, locale)
            ));

        String welcome = messageSource.getMessage(
            "user.welcome", new Object[]{user.getName()}, locale
        );
        return ResponseEntity.ok(Map.of("user", user, "message", welcome));
    }
}
```

### Step 4: Client sends language

```text
[Client] ---- GET /api/users/1 --------------> [Server]
         ---- Accept-Language: hi -----------> (MessageSource loads Hindi locale)
         <--- {"message": "स्वागत है, User"} --

[Client] ---- GET /api/users/1 --------------> [Server]
         ---- Accept-Language: en -----------> (MessageSource loads Default locale)
         <--- {"message": "Welcome, User"} ---
```

### Interview Questions

1. **Q: How does Spring resolve locale?** A: Accept-Language header → LocaleResolver → MessageSource lookup.
2. **Q: What is {0} in messages.properties?** A: Placeholder for dynamic values, replaced at runtime.

---

# 8. Multi-Tenancy

## WHY Multi-Tenancy?

One application serves MULTIPLE organizations (tenants):

- Tenant A (Company X): sees ONLY their data
- Tenant B (Company Y): sees ONLY their data
- Same codebase, same database (or separate databases)

**Real-world:** Slack, Salesforce, Shopify — one app, thousands of tenants.

## HOW — 3 Strategies

### Strategy 1: Separate Database per Tenant

```text
[Tenant A Config] -----> [ Database A (Company X) ]
[Tenant B Config] -----> [ Database B (Company Y) ]
```

✅ Best isolation, ✅ Easy compliance
❌ Expensive, ❌ Hard to manage 100+ databases

### Strategy 2: Shared Database, Separate Schema

**[Shared Database Server]**

- [ Schema A ] ---> Tables: users, orders (Company X)
- [ Schema B ] ---> Tables: users, orders (Company Y)

✅ Good isolation, ✅ Moderate cost
❌ Schema migrations must run for each tenant

### Strategy 3: Shared Everything + Tenant Column (Most Common)

```java
// WHY: Simplest, cheapest, most scalable
// Every table has a tenant_id column

@Entity
public class User {
    @Id
    private Long id;
    private String name;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;   // Discriminator
}
```

### Implementation (Strategy 3 — Discriminator Column)

```java
// Step 1: Tenant Context Holder (ThreadLocal)
public class TenantContext {
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    public static String getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void setCurrentTenant(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}

// Step 2: Extract tenant from request (Filter)
@Component
public class TenantFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws Exception {
        String tenantId = request.getHeader("X-Tenant-ID");
        if (tenantId == null) {
            response.sendError(400, "X-Tenant-ID header is required");
            return;
        }
        TenantContext.setCurrentTenant(tenantId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear(); // IMPORTANT: prevent memory leak
        }
    }
}

// Step 3: Hibernate Filter (auto-adds WHERE tenant_id = ?)
@FilterDef(name = "tenantFilter",
           parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Entity
public class User {
    // ... fields
}

// Step 4: Enable filter on every request
@Component
public class TenantHibernateFilter {
    @PersistenceContext
    private EntityManager entityManager;

    @EventListener(RequestHandledEvent.class)
    public void enableFilter() {
        Session session = entityManager.unwrap(Session.class);
        session.enableFilter("tenantFilter")
               .setParameter("tenantId", TenantContext.getCurrentTenant());
    }
}
```

### Interview Questions

1. **Q: 3 multi-tenancy strategies?** A: Separate DB, Shared DB separate schema, Shared everything with tenant_id column.
2. **Q: How to ensure data isolation?** A: Hibernate filters, row-level security, or separate connections per tenant.

---

# 9. Spring Boot 3.x & Java 17+ Features

## WHY Upgrade?

| Feature           | Java 8   | Java 17+ / Spring Boot 3         |
| ----------------- | -------- | -------------------------------- |
| Records           | ❌       | ✅ Immutable DTOs in 1 line      |
| Sealed Classes    | ❌       | ✅ Type-safe hierarchies         |
| Pattern Matching  | ❌       | ✅ Cleaner instanceof            |
| Text Blocks       | ❌       | ✅ Multi-line strings            |
| Virtual Threads   | ❌       | ✅ Millions of threads (Java 21) |
| Jakarta namespace | javax.\* | jakarta.\*                       |
| GraalVM Native    | Limited  | ✅ First-class support           |

## HOW — Key Features

### Records (Replace DTOs, Lombok for simple cases)

```java
// OLD WAY (Java 8): 50 lines for a simple DTO
public class UserDTO {
    private String name;
    private String email;
    public UserDTO(String name, String email) { ... }
    public String getName() { return name; }
    public String getEmail() { return email; }
    @Override public boolean equals(Object o) { ... }
    @Override public int hashCode() { ... }
    @Override public String toString() { ... }
}

// NEW WAY (Java 17+): 1 line!
public record UserDTO(String name, String email) {}
// Gets: constructor, getters, equals, hashCode, toString — ALL automatic
// WHY: Immutable, clear intent, zero boilerplate

// Use in Spring:
@GetMapping("/api/users/{id}")
public UserDTO getUser(@PathVariable Long id) {
    User user = userService.findById(id);
    return new UserDTO(user.getName(), user.getEmail());
}
```

### Sealed Classes (Type-Safe Hierarchies)

```java
// WHY: Limit WHO can extend a class — compiler verifies exhaustive switches
public sealed interface PaymentResult
    permits PaymentSuccess, PaymentFailed, PaymentPending {
}

public record PaymentSuccess(String transactionId) implements PaymentResult {}
public record PaymentFailed(String reason) implements PaymentResult {}
public record PaymentPending(String checkUrl) implements PaymentResult {}

// WHY: Compiler ERROR if you miss a case!
public String handlePayment(PaymentResult result) {
    return switch (result) {
        case PaymentSuccess s -> "Paid! TX: " + s.transactionId();
        case PaymentFailed f -> "Failed: " + f.reason();
        case PaymentPending p -> "Check: " + p.checkUrl();
        // No default needed — compiler knows all cases
    };
}
```

### Virtual Threads (Java 21 — Game Changer)

```java
// WHY: Traditional threads are expensive (1MB stack each)
// 10,000 requests = 10,000 threads = 10GB RAM
// Virtual threads: 10,000 requests ≈ 10MB RAM

// application.yml — ONE line to enable!
spring:
  threads:
    virtual:
      enabled: true

// That's it! Every HTTP request now uses virtual threads
// Your existing code works WITHOUT changes
// Blocking I/O (JDBC, HTTP calls) no longer wastes threads

// WHY this matters:
// Before: 200 threads max → 200 concurrent requests
// After:  Millions of virtual threads → millions of concurrent requests
```

### Pattern Matching

```java
// OLD WAY:
if (obj instanceof User) {
    User user = (User) obj;    // Explicit cast
    System.out.println(user.getName());
}

// NEW WAY:
if (obj instanceof User user) {    // Cast + assign in one step
    System.out.println(user.getName());
}

// Switch Pattern Matching:
public String describe(Object obj) {
    return switch (obj) {
        case Integer i -> "Integer: " + i;
        case String s when s.length() > 10 -> "Long string";
        case String s -> "String: " + s;
        case User u -> "User: " + u.getName();
        case null -> "null";
        default -> "Unknown";
    };
}
```

### Jakarta Namespace Migration

```java
// Spring Boot 2.x:
import javax.persistence.Entity;
import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.NotNull;

// Spring Boot 3.x:
import jakarta.persistence.Entity;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotNull;
// WHY: Java EE → Jakarta EE transfer. Just search-replace javax→jakarta
```

### Interview Questions

1. **Q: Records vs Lombok @Data?** A: Records are immutable (no setters), built into Java, no dependency. Use Records for DTOs, Lombok for entities.
2. **Q: What are Virtual Threads?** A: Lightweight threads managed by JVM, not OS. Enable millions of concurrent tasks without thread pool tuning.
3. **Q: javax vs jakarta?** A: Spring Boot 3 uses Jakarta EE namespace. Simple find-replace migration.

---

# 10. GraalVM Native Image

## WHY Native Image?

```
JVM Spring Boot App:
  Startup: 3-5 seconds
  Memory: 200-500 MB
  Size: 100+ MB JAR

GraalVM Native Image:
  Startup: 0.05 seconds (50ms!)
  Memory: 50-100 MB
  Size: 70-80 MB binary
```

**Use case:** Serverless (AWS Lambda), CLI tools, containers where fast startup matters.

## HOW

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
</plugin>
```

```bash
# Build native image
./mvnw -Pnative native:compile

# Run — starts in milliseconds!
./target/my-app
```

### Limitations

```
❌ No runtime reflection (must declare in reflect-config.json)
❌ No dynamic class loading
❌ Longer build time (5-15 minutes)
❌ Not all libraries are compatible

✅ Spring Boot 3.x has excellent native support
✅ Most Spring features work out of the box
```

### Interview Questions

1. **Q: What is AOT compilation?** A: Ahead-Of-Time — compiles to native binary at build time instead of JIT at runtime. Faster start, less memory.
2. **Q: Limitations?** A: No reflection, no dynamic proxies, limited library support. Must declare everything at build time.

---

# 11. Spring Modulith (Modular Monolith)

## WHY?

```
Monolith Problems:
- Everything is coupled
- Can't deploy features independently
- Testing is slow

Microservices Problems:
- Network complexity
- Distributed transactions
- DevOps overhead for small teams

Spring Modulith = Best of Both:
- Single deployment (like monolith)
- Clean module boundaries (like microservices)
- Can extract to microservices LATER when needed
```

## HOW

```java
// Project structure:
// com.example.app
// ├── order/          ← Module 1
// │   ├── Order.java
// │   ├── OrderService.java
// │   └── internal/   ← Not accessible by other modules!
// │       └── OrderRepository.java
// ├── inventory/      ← Module 2
// │   └── ...
// └── user/           ← Module 3

// WHY: Spring Modulith ENFORCES module boundaries at test time
@SpringBootTest
class ModularityTests {
    @Test
    void verifyModularity() {
        ApplicationModules.of(Application.class).verify();
        // FAILS if order module accesses inventory.internal package!
    }
}

// Communication between modules: Events (not direct calls)
@Service
public class OrderService {
    private final ApplicationEventPublisher events;

    public void placeOrder(Order order) {
        // ... save order
        events.publishEvent(new OrderPlacedEvent(order.getId()));
        // InventoryModule listens + reacts — no direct dependency!
    }
}
```

### Interview Questions

1. **Q: What is a modular monolith?** A: Single deployment with enforced internal module boundaries. Easier than microservices, cleaner than monolith.
2. **Q: How to communicate between modules?** A: Application events (async decoupling). NOT direct method calls.

---

# 12. API Rate Limiting & Throttling

## WHY?

Without rate limiting:

- One user makes 10,000 requests/second → server crash
- Bot scrapes your entire API → data stolen
- DDoS attack → all users affected

## HOW — Bucket4j Library

```xml
<dependency>
    <groupId>com.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.7.0</version>
</dependency>
```

```java
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // WHY ConcurrentHashMap: One bucket per user/IP
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket createBucket() {
        // WHY Bandwidth: 20 requests per minute per user
        return Bucket.builder()
                .addLimit(Bandwidth.classic(20, Refill.intervally(20, Duration.ofMinutes(1))))
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws Exception {
        String key = request.getRemoteAddr(); // Or extract from JWT token
        Bucket bucket = buckets.computeIfAbsent(key, k -> createBucket());

        if (bucket.tryConsume(1)) {
            // WHY: Add rate limit headers (standard practice)
            response.addHeader("X-Rate-Limit-Remaining",
                    String.valueOf(bucket.getAvailableTokens()));
            chain.doFilter(request, response);
        } else {
            response.setStatus(429); // Too Many Requests
            response.getWriter().write("Rate limit exceeded. Try again later.");
        }
    }
}
```

### With Spring Cloud Gateway

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://USER-SERVICE
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10 # 10 requests/second
                redis-rate-limiter.burstCapacity: 20 # Burst up to 20
                key-resolver: "#{@userKeyResolver}" # Rate limit per user
```

### Interview Questions

1. **Q: What is Token Bucket algorithm?** A: Bucket holds N tokens, each request consumes 1, tokens refill at fixed rate. If empty → reject.
2. **Q: Where to implement rate limiting?** A: API Gateway (global), Filter (per-service), or @Aspect (per-method).

---

# 13. Spring Data REST

## WHY?

Expose JPA repositories as REST APIs automatically — zero controller code.

## HOW

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-rest</artifactId>
</dependency>
```

```java
// WHY: This ALONE creates full CRUD REST API!
@RepositoryRestResource(path = "users")
public interface UserRepository extends JpaRepository<User, Long> {

    // Auto-exposed at: GET /users/search/findByEmail?email=...
    List<User> findByEmail(@Param("email") String email);
}

// Auto-generated endpoints:
// GET    /users          → findAll (paginated)
// GET    /users/{id}     → findById
// POST   /users          → create
// PUT    /users/{id}     → update
// DELETE /users/{id}     → delete
// GET    /users/search/findByEmail?email=... → custom query
```

### Interview Questions

1. **Q: When to use Spring Data REST?** A: Quick prototypes, admin panels, internal tools. NOT for complex business logic APIs.
2. **Q: How to customize?** A: @RepositoryRestResource for path, Projections for field selection, Events for hooks.

---

# 14. Liquibase (DB Migrations Alternative)

## WHY Liquibase vs Flyway?

| Feature         | Flyway        | Liquibase             |
| --------------- | ------------- | --------------------- |
| Format          | SQL only      | XML, YAML, JSON, SQL  |
| Rollback        | ❌ Pro only   | ✅ Free               |
| Diff generation | ❌            | ✅ Compare DB schemas |
| Complexity      | Simple        | More powerful         |
| Popularity      | Slightly more | Enterprise use        |

## HOW

```xml
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
</dependency>
```

```yaml
# src/main/resources/db/changelog/db.changelog-master.yaml
databaseChangeLog:
  - changeSet:
      id: 1
      author: harsha
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: BIGINT
                  autoIncrement: true
                  constraints:
                    primaryKey: true
              - column:
                  name: name
                  type: VARCHAR(255)
                  constraints:
                    nullable: false
              - column:
                  name: email
                  type: VARCHAR(255)
                  constraints:
                    unique: true

  - changeSet:
      id: 2
      author: harsha
      changes:
        - addColumn:
            tableName: users
            columns:
              - column:
                  name: phone
                  type: VARCHAR(20)
      rollback:
        - dropColumn:
            tableName: users
            columnName: phone
```

### Interview Questions

1. **Q: Flyway vs Liquibase?** A: Flyway = simple SQL migrations. Liquibase = more powerful, supports YAML/XML, free rollbacks, schema diffing.
2. **Q: How do rollbacks work?** A: Define rollback in each changeSet. Run `liquibase rollback <tag>` to undo changes.

---

# Summary: What's Now Covered

| #   | Topic                       | Level                 | Status |
| --- | --------------------------- | --------------------- | ------ |
| 1   | WebSockets & SSE            | Intermediate          | ✅ New |
| 2   | GraphQL                     | Intermediate-Advanced | ✅ New |
| 3   | gRPC                        | Advanced              | ✅ New |
| 4   | Spring Batch                | Intermediate          | ✅ New |
| 5   | Pagination & Sorting        | Beginner-Intermediate | ✅ New |
| 6   | HATEOAS                     | Intermediate          | ✅ New |
| 7   | Internationalization (i18n) | Beginner              | ✅ New |
| 8   | Multi-Tenancy               | Advanced              | ✅ New |
| 9   | Spring Boot 3.x / Java 17+  | All levels            | ✅ New |
| 10  | GraalVM Native Image        | Advanced              | ✅ New |
| 11  | Spring Modulith             | Advanced              | ✅ New |
| 12  | Rate Limiting & Throttling  | Intermediate          | ✅ New |
| 13  | Spring Data REST            | Beginner              | ✅ New |
| 14  | Liquibase                   | Intermediate          | ✅ New |

---

### Trade-offs: Real-Time Communication Protocols

| Protocol | Use Case | Latency | Throughput | Complexity | When to Prefer |
|----------|----------|---------|------------|------------|----------------|
| **WebSocket** | Bidirectional chat, collaborative editing, gaming | <5ms (persistent connection) | Very high (full-duplex) | Medium (stateful, reconnect logic) | Chat apps, live collaboration tools, gaming servers; need persistent bidirectional channel |
| **GraphQL** | Data fetching for mobile/web clients | <50ms (query parsing overhead) | High (query batching) | Medium (schema design, resolver logic) | Mobile clients that over-fetch REST; need flexible client-driven queries; aggregated APIs from multiple services |
| **gRPC** | Service-to-service internal communication | <5ms (HTTP/2 binary protocol) | Very high (multiplexed streams) | High (protobuf schema, code generation) | Internal microservice calls; high-performance inter-service communication; contract-first API design |
| **SSE (Server-Sent Events)** | One-way server push, live feeds | <10ms (HTTP/1.1 compatible) | Medium (one direction) | Low (HTTP-based, simple) | Live notifications, news feeds, stock tickers; simple browser-based push without WebSocket complexity |

**Key insight:** WebSocket is for true bidirectional communication. SSE is for server-push scenarios where the client never sends data back. GraphQL optimizes the client-server data contract. gRPC optimizes inter-service communication with strict contracts and high performance.

---

_Now Parts 0-23 cover EVERY important Spring Boot topic from beginner to expert level._


---

## Reality Check

**"WebSocket is the best choice for real-time features"** — WebSocket maintains persistent connections that consume server memory per connection. At 10000 concurrent users, you have 10000 open TCP connections on your server. Server-Sent Events (SSE) provides server-to-client streaming over standard HTTP/2 with automatic multiplexing, lower resource usage, and works through all HTTP proxies. Use WebSocket only when the CLIENT needs to send data frequently, not just receive.

**"GraphQL replaces REST"** — GraphQL solves over-fetching and under-fetching that are problems in mobile clients with limited bandwidth. But it introduces complexity: query cost analysis to prevent denial-of-service via deeply nested queries, N+1 problems in resolvers requiring DataLoader, no built-in caching since every query can be different, and more complex error handling. For server-to-server communication or simple CRUD APIs, REST is simpler and better cached.

**"gRPC is always faster than REST"** — gRPC uses Protocol Buffers (binary serialization) and HTTP/2 multiplexing, which is faster than JSON over HTTP/1.1. But the speed difference between JSON and Protobuf serialization is 2-5x — not 100x. If your bottleneck is database queries at 10 milliseconds per request, saving 0.1 milliseconds on serialization is irrelevant. gRPC benefits are strongest for high-throughput, low-latency service-to-service communication.

**"GraphQL subscriptions are production-ready out of the box"** — Spring for GraphQL supports subscriptions over WebSocket, but production deployment requires: connection authentication, subscription rate limiting, heartbeat/keepalive for connection health, graceful reconnection when the server restarts, and subscription state management across horizontally scaled instances. The getting-started guide skips all of these.

**"Protocol choice is a permanent decision"** — API gateway patterns allow exposing REST externally while using gRPC internally. A BFF (Backend For Frontend) layer can translate between GraphQL for the mobile app and REST for the web app while the backend services use gRPC. Protocol choice is per-boundary, not per-system. The internal protocol can differ from the external one.
