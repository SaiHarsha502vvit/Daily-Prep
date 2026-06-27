**Navigation**: [< Previous Chapter](Ch61_SB_Microservices_Core.md) | [Back to Index](../00_MASTER_INDEX.md)

---

```yaml
# Config Server application.yml
server:
  port: 8888

spring:
  application:
    name: config-server
  cloud:
    config:
      server:
        git:
          uri: https://github.com/company/config-repo
          default-label: main
          search-paths: "{application}"
          clone-on-start: true
          force-pull: true
        encrypt:
          enabled: true

encrypt:
  key: ${ENCRYPT_KEY}
```

### Config Client Setup

```yaml
# bootstrap.yml for config client
spring:
  application:
    name: order-service
  cloud:
    config:
      uri: http://localhost:8888
      fail-fast: true
      retry:
        initial-interval: 1000
        max-attempts: 6
        max-interval: 2000
        multiplier: 1.1
```

### Configuration Repository Structure

```
config-repo/
├── application.yml              # Common configuration for all services
├── application-dev.yml          # Common dev configuration
├── application-prod.yml         # Common prod configuration
├── order-service/
│   ├── order-service.yml        # Order service specific
│   ├── order-service-dev.yml
│   └── order-service-prod.yml
├── user-service/
│   ├── user-service.yml
│   └── user-service-prod.yml
└── payment-service/
    └── payment-service.yml
```

### Dynamic Configuration Refresh

```java
@RestController
@RefreshScope  // Enables dynamic refresh
@RequiredArgsConstructor
public class ConfigController {

    @Value("${app.feature.enabled:false}")
    private boolean featureEnabled;

    @Value("${app.rate.limit:100}")
    private int rateLimit;

    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        return Map.of(
            "featureEnabled", featureEnabled,
            "rateLimit", rateLimit
        );
    }
}

// Trigger refresh via POST /actuator/refresh
// Or use Spring Cloud Bus for broadcast refresh to all instances
```

### Configuration Encryption

```bash
# Encrypt sensitive values
curl -X POST http://localhost:8888/encrypt -d "mySecret"
# Returns: AQA2jxK...encrypted...

# Use in configuration
spring:
  datasource:
    password: '{cipher}AQA2jxK...encrypted...'
```

---

## Saga Pattern

### Why Saga?

```
Problem with Distributed Transactions:
┌─────────────────────────────────────────────────────────────────┐
│  Order Service → Payment Service → Inventory Service            │
│  ❌ 2PC (Two-Phase Commit) doesn't work across services          │
│  ❌ Long-running transactions lock resources                     │
│  ❌ Single service failure blocks entire transaction             │
└─────────────────────────────────────────────────────────────────┘

Saga Solution:
┌─────────────────────────────────────────────────────────────────┐
│  Local transactions with compensating actions                   │
│  Each step can be rolled back independently                     │
│  ✅ Eventually consistent                                        │
│  ✅ No distributed locks                                         │
│  ✅ Better scalability                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Saga Patterns

```
CHOREOGRAPHY-BASED SAGA:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Order     ──event──▶    Payment    ──event──▶   Inventory      │
│   Service              Service               Service             │
│      │                      │                      │             │
│      └──────────────────────┴──────────────────────┘             │
│                   Event Bus (Kafka)                              │
│  ✅ Loose coupling                                                │
│  ❌ Hard to track overall progress                                │
└──────────────────────────────────────────────────────────────────┘

ORCHESTRATION-BASED SAGA:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    ┌─────────────────┐                           │
│                    │  Saga           │                           │
│                    │  Orchestrator   │                           │
│                    └────────┬────────┘                           │
│              ┌──────────────┼──────────────┐                     │
│              ▼              ▼              ▼                     │
│         Order           Payment       Inventory                  │
│         Service         Service       Service                    │
│  ✅ Clear flow visibility                                         │
│  ✅ Easier error handling                                         │
│  ❌ Orchestrator becomes single point                             │
└──────────────────────────────────────────────────────────────────┘
```

### Orchestration-Based Saga Implementation

```java
// Saga Orchestrator
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderSagaOrchestrator {

    private final OrderService orderService;
    private final PaymentClient paymentClient;
    private final InventoryClient inventoryClient;
    private final NotificationClient notificationClient;

    @Transactional
    public OrderResult executeOrderSaga(OrderRequest request) {
        SagaContext context = new SagaContext();

        try {
            // Step 1: Create Order
            Order order = createOrder(request, context);

            // Step 2: Reserve Inventory
            reserveInventory(order, context);

            // Step 3: Process Payment
            processPayment(order, context);

            // Step 4: Confirm Order
            confirmOrder(order);

            // Step 5: Send Notification
            sendNotification(order);

            log.info("Saga completed successfully for order: {}", order.getId());
            return OrderResult.success(order);

        } catch (Exception e) {
            log.error("Saga failed, initiating compensation", e);
            compensate(context);
            return OrderResult.failure(e.getMessage());
        }
    }

    private Order createOrder(OrderRequest request, SagaContext context) {
        log.info("Step 1: Creating order");
        Order order = orderService.create(request);
        context.setOrder(order);
        context.addCompensation(() -> orderService.cancel(order.getId()));
        return order;
    }

    private void reserveInventory(Order order, SagaContext context) {
        log.info("Step 2: Reserving inventory for order: {}", order.getId());
        InventoryReservation reservation = inventoryClient.reserve(
            new ReservationRequest(order.getId(), order.getItems())
        );
        context.setReservation(reservation);
        context.addCompensation(() ->
            inventoryClient.cancelReservation(reservation.getId()));
    }

    private void processPayment(Order order, SagaContext context) {
        log.info("Step 3: Processing payment for order: {}", order.getId());
        PaymentResult payment = paymentClient.process(
            new PaymentRequest(order.getId(), order.getTotalAmount())
        );

        if (!payment.isSuccess()) {
            throw new PaymentFailedException(payment.getMessage());
        }

        context.setPayment(payment);
        context.addCompensation(() ->
            paymentClient.refund(payment.getTransactionId()));
    }

    private void confirmOrder(Order order) {
        log.info("Step 4: Confirming order: {}", order.getId());
        orderService.confirm(order.getId());
    }

    private void sendNotification(Order order) {
        log.info("Step 5: Sending notification for order: {}", order.getId());
        try {
            notificationClient.sendOrderConfirmation(order);
        } catch (Exception e) {
            // Notification failure shouldn't fail the saga
            log.warn("Failed to send notification, will retry later", e);
        }
    }

    private void compensate(SagaContext context) {
        log.info("Starting compensation for failed saga");
        context.executeCompensations();
    }
}

// Saga Context to track state and compensations
@Data
public class SagaContext {
    private Order order;
    private InventoryReservation reservation;
    private PaymentResult payment;
    private final Deque<Runnable> compensations = new ArrayDeque<>();

    public void addCompensation(Runnable compensation) {
        compensations.push(compensation);
    }

    public void executeCompensations() {
        while (!compensations.isEmpty()) {
            try {
                compensations.pop().run();
            } catch (Exception e) {
                // Log but continue with other compensations
                log.error("Compensation failed", e);
            }
        }
    }
}
```

### Choreography-Based Saga with Events

```java
// Order Created Event
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderCreatedEvent {
    private String orderId;
    private String customerId;
    private List<OrderItem> items;
    private BigDecimal totalAmount;
}

// Order Service publishes events
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final StreamBridge streamBridge;

    public Order createOrder(OrderRequest request) {
        Order order = Order.builder()
            .customerId(request.getCustomerId())
            .items(request.getItems())
            .status(OrderStatus.PENDING)
            .build();

        Order savedOrder = orderRepository.save(order);

        // Publish event
        streamBridge.send("order-events-out-0",
            new OrderCreatedEvent(
                savedOrder.getId(),
                savedOrder.getCustomerId(),
                savedOrder.getItems(),
                savedOrder.getTotalAmount()
            )
        );

        return savedOrder;
    }

    @Bean
    public Consumer<PaymentCompletedEvent> handlePaymentCompleted() {
        return event -> {
            log.info("Payment completed for order: {}", event.getOrderId());
            orderRepository.updateStatus(event.getOrderId(), OrderStatus.PAID);

            streamBridge.send("inventory-reserve-out-0",
                new ReserveInventoryCommand(event.getOrderId()));
        };
    }

    @Bean
    public Consumer<PaymentFailedEvent> handlePaymentFailed() {
        return event -> {
            log.warn("Payment failed for order: {}", event.getOrderId());
            orderRepository.updateStatus(event.getOrderId(), OrderStatus.PAYMENT_FAILED);
        };
    }
}

// Payment Service listens and responds
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentGateway paymentGateway;
    private final StreamBridge streamBridge;

    @Bean
    public Consumer<OrderCreatedEvent> handleOrderCreated() {
        return event -> {
            log.info("Processing payment for order: {}", event.getOrderId());

            try {
                PaymentResult result = paymentGateway.process(
                    event.getOrderId(),
                    event.getTotalAmount()
                );

                if (result.isSuccess()) {
                    streamBridge.send("payment-events-out-0",
                        new PaymentCompletedEvent(
                            event.getOrderId(),
                            result.getTransactionId()
                        )
                    );
                } else {
                    streamBridge.send("payment-events-out-0",
                        new PaymentFailedEvent(
                            event.getOrderId(),
                            result.getErrorMessage()
                        )
                    );
                }
            } catch (Exception e) {
                streamBridge.send("payment-events-out-0",
                    new PaymentFailedEvent(event.getOrderId(), e.getMessage())
                );
            }
        };
    }
}
```

---

## Event-Driven Architecture

### Event Types

```
┌──────────────────────────────────────────────────────────────────┐
│                       EVENT TYPES                                │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN EVENTS                                                   │
│  Something that happened in the business domain                  │
│  Examples: OrderPlaced, PaymentReceived, UserRegistered          │
│                                                                  │
│  INTEGRATION EVENTS                                              │
│  Events shared between bounded contexts/services                 │
│  Examples: OrderCreatedIntegrationEvent                          │
│                                                                  │
│  EVENT COMMANDS                                                  │
│  Request for action (imperative)                                 │
│  Examples: ProcessPayment, ShipOrder                             │
│                                                                  │
│  EVENT QUERIES                                                   │
│  Request for data                                                │
│  Examples: GetOrderStatus                                        │
└──────────────────────────────────────────────────────────────────┘
```

### Spring Cloud Stream with Kafka

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-stream-kafka</artifactId>
</dependency>
```

```yaml
spring:
  cloud:
    stream:
      bindings:
        order-events-out-0:
          destination: order-events
          producer:
            partition-key-expression: headers['partitionKey']
        order-events-in-0:
          destination: order-events
          group: order-service-group
        payment-events-in-0:
          destination: payment-events
          group: order-service-group
      kafka:
        binder:
          brokers: localhost:9092
          auto-create-topics: true
          replication-factor: 3
        bindings:
          order-events-out-0:
            producer:
              configuration:
                acks: all
```

```java
// Event Publisher
@Service
@RequiredArgsConstructor
public class EventPublisher {

    private final StreamBridge streamBridge;

    public void publishOrderCreated(Order order) {
        OrderCreatedEvent event = new OrderCreatedEvent(
            order.getId(),
            order.getCustomerId(),
            order.getItems(),
            order.getTotalAmount(),
            Instant.now()
        );

        streamBridge.send("order-events-out-0",
            MessageBuilder.withPayload(event)
                .setHeader("partitionKey", order.getCustomerId())
                .setHeader("eventType", "OrderCreated")
                .build()
        );
    }
}

// Event Consumer
@Configuration
public class EventConsumers {

    @Bean
    public Consumer<Message<OrderCreatedEvent>> orderCreatedConsumer(
            InventoryService inventoryService) {
        return message -> {
            OrderCreatedEvent event = message.getPayload();
            log.info("Received OrderCreatedEvent: {}", event.getOrderId());

            inventoryService.reserveInventory(
                event.getOrderId(),
                event.getItems()
            );
        };
    }

    @Bean
    public Function<OrderCreatedEvent, PaymentRequestEvent> orderToPayment() {
        return order -> new PaymentRequestEvent(
            order.getOrderId(),
            order.getTotalAmount()
        );
    }
}
```

### Event Sourcing

```java
// Event Store
@Entity
@Table(name = "event_store")
@Data
public class StoredEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String aggregateId;
    private String aggregateType;
    private String eventType;

    @Lob
    private String payload;

    private int version;
    private Instant timestamp;
}

@Repository
public interface EventStoreRepository extends JpaRepository<StoredEvent, String> {
    List<StoredEvent> findByAggregateIdOrderByVersionAsc(String aggregateId);
    Optional<StoredEvent> findTopByAggregateIdOrderByVersionDesc(String aggregateId);
}

// Event Store Service
@Service
@RequiredArgsConstructor
public class EventStore {

    private final EventStoreRepository repository;
    private final ObjectMapper objectMapper;

    public void append(String aggregateId, String aggregateType,
                       Object event, int expectedVersion) {
        Optional<StoredEvent> lastEvent = repository
            .findTopByAggregateIdOrderByVersionDesc(aggregateId);

        int currentVersion = lastEvent.map(StoredEvent::getVersion).orElse(0);

        if (currentVersion != expectedVersion) {
            throw new OptimisticLockingException(
                "Expected version " + expectedVersion + " but found " + currentVersion
            );
        }

        StoredEvent storedEvent = new StoredEvent();
        storedEvent.setAggregateId(aggregateId);
        storedEvent.setAggregateType(aggregateType);
        storedEvent.setEventType(event.getClass().getSimpleName());
        storedEvent.setPayload(serialize(event));
        storedEvent.setVersion(currentVersion + 1);
        storedEvent.setTimestamp(Instant.now());

        repository.save(storedEvent);
    }

    public List<Object> getEvents(String aggregateId) {
        return repository.findByAggregateIdOrderByVersionAsc(aggregateId)
            .stream()
            .map(this::deserialize)
            .collect(Collectors.toList());
    }

    private String serialize(Object event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            throw new EventSerializationException(e);
        }
    }

    private Object deserialize(StoredEvent storedEvent) {
        try {
            Class<?> eventClass = Class.forName(
                "com.example.events." + storedEvent.getEventType()
            );
            return objectMapper.readValue(storedEvent.getPayload(), eventClass);
        } catch (Exception e) {
            throw new EventDeserializationException(e);
        }
    }
}

// Order Aggregate using Event Sourcing
@Data
public class OrderAggregate {
    private String id;
    private String customerId;
    private List<OrderItem> items = new ArrayList<>();
    private OrderStatus status;
    private BigDecimal totalAmount;
    private int version;

    // Apply events to rebuild state
    public void apply(Object event) {
        if (event instanceof OrderCreatedEvent e) {
            this.id = e.getOrderId();
            this.customerId = e.getCustomerId();
            this.items = e.getItems();
            this.status = OrderStatus.PENDING;
            this.totalAmount = e.getTotalAmount();
        } else if (event instanceof OrderPaidEvent e) {
            this.status = OrderStatus.PAID;
        } else if (event instanceof OrderShippedEvent e) {
            this.status = OrderStatus.SHIPPED;
        } else if (event instanceof OrderCancelledEvent e) {
            this.status = OrderStatus.CANCELLED;
        }
        this.version++;
    }

    // Rebuild from events
    public static OrderAggregate fromEvents(List<Object> events) {
        OrderAggregate aggregate = new OrderAggregate();
        events.forEach(aggregate::apply);
        return aggregate;
    }
}
```

---

## CQRS Pattern

### CQRS Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CQRS PATTERN                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌─────────────┐                               │
│                    │   Client    │                               │
│                    └──────┬──────┘                               │
│              Commands     │     Queries                          │
│           ┌───────────────┴───────────────┐                      │
│           ▼                               ▼                      │
│   ┌───────────────┐               ┌───────────────┐              │
│   │   Command     │               │    Query      │              │
│   │   Handler     │               │    Handler    │              │
│   └───────┬───────┘               └───────┬───────┘              │
│           │                               │                      │
│           ▼                               ▼                      │
│   ┌───────────────┐               ┌───────────────┐              │
│   │   Write DB    │ ──events──▶   │   Read DB     │              │
│   │  (PostgreSQL) │               │   (MongoDB)   │              │
│   │  Normalized   │               │   Denormalized│              │
│   └───────────────┘               └───────────────┘              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### CQRS Implementation

```java
// Commands
public sealed interface OrderCommand {
    record CreateOrder(String customerId, List<OrderItem> items)
        implements OrderCommand {}
    record CancelOrder(String orderId, String reason)
        implements OrderCommand {}
    record UpdateOrderStatus(String orderId, OrderStatus status)
        implements OrderCommand {}
}

// Queries
public sealed interface OrderQuery {
    record GetOrderById(String orderId) implements OrderQuery {}
    record GetOrdersByCustomer(String customerId, int page, int size)
        implements OrderQuery {}
    record SearchOrders(OrderSearchCriteria criteria) implements OrderQuery {}
}

// Command Handler
@Service
@RequiredArgsConstructor
public class OrderCommandHandler {

    private final EventStore eventStore;
    private final ApplicationEventPublisher eventPublisher;

    public String handle(OrderCommand.CreateOrder command) {
        String orderId = UUID.randomUUID().toString();

        OrderCreatedEvent event = new OrderCreatedEvent(
            orderId,
            command.customerId(),
            command.items(),
            calculateTotal(command.items()),
            Instant.now()
        );

        eventStore.append(orderId, "Order", event, 0);
        eventPublisher.publishEvent(event);  // For read model update

        return orderId;
    }

    public void handle(OrderCommand.CancelOrder command) {
        OrderAggregate order = loadAggregate(command.orderId());

        if (order.getStatus() == OrderStatus.SHIPPED) {
            throw new BusinessException("Cannot cancel shipped order");
        }

        OrderCancelledEvent event = new OrderCancelledEvent(
            command.orderId(),
            command.reason(),
            Instant.now()
        );

        eventStore.append(command.orderId(), "Order", event, order.getVersion());
        eventPublisher.publishEvent(event);
    }

    private OrderAggregate loadAggregate(String orderId) {
        List<Object> events = eventStore.getEvents(orderId);
        if (events.isEmpty()) {
            throw new OrderNotFoundException(orderId);
        }
        return OrderAggregate.fromEvents(events);
    }
}

// Query Handler (uses optimized read model)
@Service
@RequiredArgsConstructor
public class OrderQueryHandler {

    private final OrderReadRepository readRepository;

    public OrderView handle(OrderQuery.GetOrderById query) {
        return readRepository.findById(query.orderId())
            .orElseThrow(() -> new OrderNotFoundException(query.orderId()));
    }

    public Page<OrderView> handle(OrderQuery.GetOrdersByCustomer query) {
        return readRepository.findByCustomerId(
            query.customerId(),
            PageRequest.of(query.page(), query.size())
        );
    }

    public Page<OrderView> handle(OrderQuery.SearchOrders query) {
        return readRepository.search(query.criteria());
    }
}

// Read Model (optimized for queries)
@Document(collection = "orders")
@Data
public class OrderView {
    @Id
    private String id;
    private String customerId;
    private String customerName;  // Denormalized
    private List<OrderItemView> items;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    public static class OrderItemView {
        private String productId;
        private String productName;
        private int quantity;
        private BigDecimal price;
        private String imageUrl;  // Denormalized
    }
}

// Read Model Updater (Event Handler)
@Component
@RequiredArgsConstructor
public class OrderReadModelUpdater {

    private final OrderReadRepository readRepository;
    private final UserClient userClient;
    private final ProductClient productClient;

    @EventListener
    public void on(OrderCreatedEvent event) {
        UserDTO user = userClient.getUser(event.getCustomerId());

        List<OrderView.OrderItemView> itemViews = event.getItems().stream()
            .map(item -> {
                ProductDTO product = productClient.getProduct(item.getProductId());
                OrderView.OrderItemView view = new OrderView.OrderItemView();
                view.setProductId(item.getProductId());
                view.setProductName(product.getName());
                view.setQuantity(item.getQuantity());
                view.setPrice(item.getPrice());
                view.setImageUrl(product.getImageUrl());
                return view;
            })
            .collect(Collectors.toList());

        OrderView view = new OrderView();
        view.setId(event.getOrderId());
        view.setCustomerId(event.getCustomerId());
        view.setCustomerName(user.getName());
        view.setItems(itemViews);
        view.setStatus(OrderStatus.PENDING);
        view.setTotalAmount(event.getTotalAmount());
        view.setCreatedAt(event.getTimestamp());
        view.setUpdatedAt(event.getTimestamp());

        readRepository.save(view);
    }

    @EventListener
    public void on(OrderCancelledEvent event) {
        readRepository.updateStatus(event.getOrderId(), OrderStatus.CANCELLED);
    }
}
```

---

## Service Mesh

### Service Mesh Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      SERVICE MESH                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Traditional:  Service A ──────────────▶ Service B               │
│                                                                  │
│  With Mesh:    ┌─────────┐          ┌─────────┐                  │
│                │Service A│          │Service B│                  │
│                └────┬────┘          └────┬────┘                  │
│                     │                    │                       │
│                ┌────┴────┐          ┌────┴────┐                  │
│                │ Sidecar │──────────│ Sidecar │                  │
│                │ Proxy   │          │ Proxy   │                  │
│                └─────────┘          └─────────┘                  │
│                     │                    │                       │
│                     └────────┬───────────┘                       │
│                          Control Plane                           │
│                   (Configuration, Policies)                      │
│                                                                  │
│  Benefits:                                                       │
│  ✅ Traffic management (routing, load balancing)                  │
│  ✅ Security (mTLS, authorization)                                │
│  ✅ Observability (metrics, tracing, logging)                     │
│  ✅ Reliability (retries, circuit breakers)                       │
│                                                                  │
│  Popular: Istio, Linkerd, Consul Connect                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Istio Configuration Example

```yaml
# Virtual Service for traffic routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
    - order-service
  http:
    - match:
        - headers:
            x-user-type:
              exact: premium
      route:
        - destination:
            host: order-service
            subset: v2
          weight: 100
    - route:
        - destination:
            host: order-service
            subset: v1
          weight: 90
        - destination:
            host: order-service
            subset: v2
          weight: 10

---
# Destination Rule for subsets
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

---

## Security Patterns

### OAuth2 / JWT Authentication

```
┌──────────────────────────────────────────────────────────────────┐
│                   OAUTH2 FLOW WITH GATEWAY                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Client → Auth Server: Login (username/password)              │
│  2. Auth Server → Client: JWT Token                              │
│  3. Client → API Gateway: Request + JWT                          │
│  4. Gateway: Validate JWT, extract claims                        │
│  5. Gateway → Service: Request + User Context headers            │
│  6. Service: Process request                                     │
│                                                                  │
│  ┌────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐        │
│  │ Client │───▶│  Auth    │───▶│ Gateway │───▶│ Service │        │
│  │        │◀───│  Server  │◀───│         │◀───│         │        │
│  └────────┘    └──────────┘    └─────────┘    └─────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Gateway Security Configuration

```java
@Configuration
@EnableWebFluxSecurity
public class GatewaySecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/api/auth/**").permitAll()
                .pathMatchers("/api/public/**").permitAll()
                .pathMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .pathMatchers("/api/admin/**").hasRole("ADMIN")
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter()))
            )
            .build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder(@Value("${jwt.secret}") String secret) {
        return NimbusReactiveJwtDecoder.withSecretKey(
            new SecretKeySpec(secret.getBytes(), "HmacSHA256")
        ).build();
    }

    private Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthConverter() {
        return jwt -> {
            Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
            return Mono.just(
                new JwtAuthenticationToken(jwt, authorities, jwt.getSubject())
            );
        };
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles == null) {
            return Collections.emptyList();
        }
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
            .collect(Collectors.toList());
    }
}
```

---

## Observability Patterns

### The Three Pillars

```
┌──────────────────────────────────────────────────────────────────┐
│              THREE PILLARS OF OBSERVABILITY                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐             │
│  │   METRICS   │   │   LOGGING   │   │   TRACING   │             │
│  │             │   │             │   │             │             │
│  │ What?       │   │ What?       │   │ What?       │             │
│  │ Quantitative│   │ Event data  │   │ Request     │             │
│  │ measurements│   │ & context   │   │ journey     │             │
│  │             │   │             │   │             │             │
│  │ Tools:      │   │ Tools:      │   │ Tools:      │             │
│  │ Prometheus  │   │ ELK Stack   │   │ Jaeger      │             │
│  │ Grafana     │   │ Loki        │   │ Zipkin      │             │
│  │ Micrometer  │   │ Fluentd     │   │ Tempo       │             │
│  └─────────────┘   └─────────────┘   └─────────────┘             │
│                                                                  │
│  Combined: Full visibility into system behavior                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Metrics with Micrometer

```java
@Configuration
public class MetricsConfig {

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config()
            .commonTags("application", "order-service")
            .commonTags("environment", System.getenv("ENV"));
    }
}

@Service
@RequiredArgsConstructor
public class OrderService {

    private final MeterRegistry meterRegistry;
    private final Counter orderCounter;
    private final Timer orderProcessingTimer;

    public OrderService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.orderCounter = Counter.builder("orders.created")
            .description("Number of orders created")
            .register(meterRegistry);
        this.orderProcessingTimer = Timer.builder("orders.processing.time")
            .description("Time to process orders")
            .register(meterRegistry);
    }

    public Order createOrder(OrderRequest request) {
        return orderProcessingTimer.record(() -> {
            Order order = processOrder(request);
            orderCounter.increment();

            // Custom metrics
            meterRegistry.gauge("orders.pending",
                orderRepository.countByStatus(OrderStatus.PENDING));

            return order;
        });
    }
}
```

---

## Deployment Patterns

### Blue-Green Deployment

```
┌──────────────────────────────────────────────────────────────────┐
│                   BLUE-GREEN DEPLOYMENT                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Before:                                                         │
│  Load Balancer ──▶ Blue (v1.0) ✅ Active                          │
│                    Green (v1.1) 🔳 Staged                         │
│                                                                  │
│  After:                                                          │
│  Load Balancer ──▶ Blue (v1.0) 🔳 Standby                         │
│                    Green (v1.1) ✅ Active                         │
│                                                                  │
│  ✅ Zero downtime                                                 │
│  ✅ Instant rollback                                              │
│  ❌ Needs 2x infrastructure                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Canary Deployment

```
┌──────────────────────────────────────────────────────────────────┐
│                    CANARY DEPLOYMENT                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: 5% to new version                                      │
│  ┌─────────────────────────────────────────────────────┐         │
│  │  v1.0: ██████████████████████████████████████ 95%  │          │
│  │  v1.1: ██ 5%                                        │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                  │
│  Phase 2: 25% to new version (if metrics good)                   │
│  ┌─────────────────────────────────────────────────────┐         │
│  │  v1.0: ████████████████████████████████ 75%        │          │
│  │  v1.1: ████████ 25%                                 │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                  │
│  Phase 3: 100% to new version                                    │
│  ┌─────────────────────────────────────────────────────┐         │
│  │  v1.0: 0%                                           │         │
│  │  v1.1: ██████████████████████████████████████ 100% │          │
│  └─────────────────────────────────────────────────────┘         │
│                                                                  │
│  ✅ Gradual rollout                                               │
│  ✅ Real traffic validation                                       │
│  ✅ Quick rollback if issues                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Beginner

**Q1: What is service discovery and why is it needed?**

```
Service discovery allows services to find each other dynamically without
hard-coded URLs. It's needed because:
- Services can scale up/down
- IP addresses change
- Services can move to different hosts
- Enables load balancing across instances
```

**Q2: What is an API Gateway?**

```
API Gateway is a single entry point for all clients that:
- Routes requests to appropriate services
- Handles cross-cutting concerns (auth, logging, rate limiting)
- Aggregates responses from multiple services
- Provides protocol translation
```

**Q3: Explain the Circuit Breaker pattern**

```
Circuit breaker prevents cascading failures:
- CLOSED: Normal operation, requests pass through
- OPEN: Failure threshold exceeded, fail fast
- HALF-OPEN: Test if service recovered

Benefits:
- Fast failure instead of waiting for timeout
- Gives failing service time to recover
- Prevents resource exhaustion
```

### Advanced

**Q4: Compare choreography vs orchestration saga**

```
Choreography:
- Services communicate via events
- Loose coupling
- No central coordinator
- Hard to track progress
- Best for: Simple workflows

Orchestration:
- Central coordinator manages flow
- Clear visibility
- Easier error handling
- Single point of failure
- Best for: Complex workflows
```

**Q5: What is CQRS and when to use it?**

```
Command Query Responsibility Segregation separates read and write operations.

Use when:
- Different read/write patterns
- Need different optimization for queries vs commands
- High read/write ratio
- Complex domain logic

Don't use when:
- Simple CRUD operations
- Small scale application
- Team unfamiliar with pattern
```

**Q6: How do you handle distributed transactions?**

```
Options:
1. Saga Pattern - Compensating transactions
2. Two-Phase Commit (2PC) - Not recommended for microservices
3. Eventual Consistency - Accept temporary inconsistency
4. Outbox Pattern - Reliable event publishing

Best practices:
- Design for idempotency
- Use correlation IDs
- Implement retry with exponential backoff
- Handle partial failures gracefully
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│                 MICROSERVICES PATTERNS CHEAT SHEET                  │
├─────────────────────────────────────────────────────────────────────┤
│ COMMUNICATION PATTERNS                                              │
│  Synchronous     │ REST, gRPC, GraphQL                              │
│  Asynchronous    │ Message queues (Kafka, RabbitMQ)                 │
│  Event-driven    │ Events/Event Sourcing                            │
├─────────────────────────────────────────────────────────────────────┤
│ RESILIENCE PATTERNS                                                 │
│  Circuit Breaker │ Fail fast when service down                      │
│  Retry           │ Automatic retry with backoff                     │
│  Bulkhead        │ Isolate failures                                 │
│  Timeout         │ Don't wait forever                               │
│  Rate Limiter    │ Protect from overload                            │
├─────────────────────────────────────────────────────────────────────┤
│ DATA PATTERNS                                                       │
│  Saga            │ Distributed transactions                         │
│  CQRS            │ Separate read/write models                       │
│  Event Sourcing  │ Store events, derive state                       │
│  Outbox          │ Reliable event publishing                        │
├─────────────────────────────────────────────────────────────────────┤
│ DEPLOYMENT PATTERNS                                                 │
│  Blue-Green      │ Zero downtime, instant rollback                  │
│  Canary          │ Gradual rollout                                  │
│  Rolling         │ Sequential instance updates                      │
├─────────────────────────────────────────────────────────────────────┤
│ DISCOVERY & ROUTING                                                 │
│  Service Registry│ Eureka, Consul                                   │
│  API Gateway     │ Spring Cloud Gateway                             │
│  Load Balancer   │ Client-side with discovery                       │
│  Service Mesh    │ Istio, Linkerd                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

Microservices patterns solve distributed system challenges:

1. **Service Discovery** - Dynamic service location
2. **API Gateway** - Single entry point, cross-cutting concerns
3. **Circuit Breaker** - Resilience against failures
4. **Saga** - Distributed transaction management
5. **CQRS** - Optimized read/write separation
6. **Event-Driven** - Loose coupling through events

**Remember**: "Start with a monolith, break into microservices when you understand the domain boundaries" - Martin Fowler

---

_Next: Part 21 - Cloud Deployment (AWS/Azure/GCP Integration)_

---

---

🔬 **Section Challenge — Summary**

**Challenge 1 (Reasoning):** The circuit breaker has three states: CLOSED → OPEN → HALF-OPEN. The HALF-OPEN state is the most dangerous. Why? What happens if you allow too many requests through in HALF-OPEN, and what happens if you allow too few?

<details><summary>Answer</summary>

HALF-OPEN is dangerous because it's a **probe state** — you're testing if the downstream service has recovered. **Too many requests in HALF-OPEN:** If you allow 100 probe requests and the service is still down, all 100 fail, wasting resources and potentially cascading the failure to YOUR callers (they're waiting for your timeouts). You also hammer the recovering service with 100 requests when it can barely handle 1 — preventing recovery. **Too few requests:** If you allow only 1 probe and it fails due to a transient network glitch (not because the service is actually down), the circuit opens again for another `waitDurationInOpenState` (e.g., 60s). The service may have recovered at second 2, but you don't retry until second 62 — unnecessary downtime. **Best practice:** `permittedNumberOfCallsInHalfOpenState: 3-5`, `slowCallDurationThreshold: 2s`, `slowCallRateThreshold: 80`. If 3 out of 5 probes succeed within 2s, close the circuit. Resilience4j also supports `automaticTransitionFromOpenToHalfOpenEnabled: true` to avoid needing a request to trigger the transition.

</details>


---

## Reality Check

**"Circuit breaker prevents cascading failures"** ? A circuit breaker stops calling a FAILED service, but it does not handle what YOUR service should do when the dependency is unavailable. Without a fallback strategy (cached data, default response, queue for later retry), your service returns 503 to the caller, who also needs a fallback, creating the cascade you tried to prevent. Circuit breaker is the detection mechanism; fallback is the recovery mechanism.

**"Saga pattern solves distributed transactions"** ? Sagas provide eventual consistency, not transactional consistency. Between saga steps, the system is in a partially committed state visible to other operations. Compensating actions (rollbacks) may fail themselves, requiring manual intervention. A saga that books a flight, then fails to book a hotel, then fails to cancel the flight, leaves the system in an inconsistent state that requires human resolution.

**"API Gateway is just a reverse proxy"** ? A reverse proxy forwards requests. An API Gateway adds: authentication, rate limiting, request transformation, response aggregation, protocol translation (REST to gRPC), SSL termination, and API versioning. But putting too much logic in the gateway creates a single point of failure and a bottleneck. Keep the gateway thin � authentication and routing only. Business logic belongs in services.

**"Service discovery eliminates configuration"** ? Service discovery (Eureka, Consul) automates finding service instances, but it introduces its own operational complexity: what happens when the discovery server is down? (Services cache the last known registry.) What about split-brain in a discovery cluster? What about stale registrations from crashed instances? Health check intervals mean newly deployed instances are invisible for 30 seconds and crashed instances remain registered for 30 seconds.

**"Event-driven architecture is always better than synchronous"** ? Events add latency (message broker round-trip), complexity (ordering, deduplication, dead letter queues), and debugging difficulty (no request-response trace). A user clicking Submit and waiting 5 seconds for an event to propagate through 3 services is worse UX than a synchronous 200ms response. Use events for operations where the caller does not need an immediate result: notifications, analytics, eventual updates.
