# 48. Java Events, Listeners & Observer Pattern — How to Understand Event Objects

> **Navigation**: [< Reflection & Annotations](47_Java_Reflection_Annotations_Deep.md) | [Back to Index](../00_MASTER_INDEX.md) | [Enums, Records & Sealed >](49_Java_Enums_Records_Sealed_Deep.md)

---

## 🎯 The 5W1H Framework for Events

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = An event is a MESSAGE that says "something happened"     ║
║         An event object CARRIES DATA about what happened         ║
║                                                                  ║
║  WHY  = Decoupling: the thing that HAPPENED doesn't need to      ║
║         know who CARES about it                                  ║
║                                                                  ║
║  WHEN = User clicks button, order is placed, file changes,       ║
║         timer fires, data arrives, state transitions             ║
║                                                                  ║
║  WHERE = GUI (Swing/JavaFX), Spring events, message queues,      ║
║          WebSocket, file watchers, custom business logic         ║
║                                                                  ║
║  WHO  = Publisher (fires event) → Event (data) → Listener        ║
║         (reacts to event)                                        ║
║                                                                  ║
║  HOW  = Observer pattern / Listener pattern / Pub-Sub            ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 1. The Mental Model — Events in Real Life

```
REAL LIFE:
┌───────────────────────────────────────────────────-┐
│ Fire Alarm (EVENT SOURCE)                          │
│   ↓ fires alarm                                    │
│ Alarm Sound (EVENT) ← carries data: which floor    │
│   ↓ heard by                                       │
│ People (LISTENERS)                                 │
│   → Person A: evacuates building                   │
│   → Person B: calls fire department                │
│   → Person C: grabs fire extinguisher              │
│                                                    │
│ The alarm doesn't KNOW who's listening             │
│ Listeners decide WHAT to do independently          │
│ New listeners can be added WITHOUT changing alarm  │
└───────────────────────────────────────────────────-┘

IN CODE:
┌───────────────────────────────────────────────────┐
│ OrderService (EVENT SOURCE)                       │
│   ↓ publishes OrderPlacedEvent                    │
│ OrderPlacedEvent (EVENT) ← data: orderId, amount  │
│   ↓ received by                                   │
│ Listeners:                                        │
│   → EmailListener: sends confirmation email       │
│   → InventoryListener: reduces stock              │
│   → AnalyticsListener: tracks purchase            │
│                                                   │
│ OrderService doesn't know about email/inventory!  │
│ Adding new listener = ZERO changes to OrderService│
└───────────────────────────────────────────────────┘
```

---

## 2. How to Understand ANY Event Object

When you see an event object for the first time, ask these 4 questions:

```
┌──────────────────────────────────────────────────────────┐
│ QUESTION 1: WHAT happened?                               │
│   → The event CLASS NAME tells you                       │
│   → OrderPlacedEvent, ButtonClickEvent, FileChangedEvent │
│                                                          │
│ QUESTION 2: WHAT data does it carry?                     │
│   → Look at the FIELDS of the event class                │
│   → orderId, timestamp, userId, previousValue, newValue  │
│                                                          │
│ QUESTION 3: WHO fired this event?                        │
│   → Look for getSource() or similar method               │
│   → Returns the object that created the event            │
│                                                          │
│ QUESTION 4: WHEN did it happen?                          │
│   → Look for timestamp field                             │
│   → Or check event creation time                         │
└──────────────────────────────────────────────────────────┘
```

### Example: Dissecting a Java SE Event Object

```java
// java.util.EventObject — the ROOT of all Java events
public class EventObject {
    protected transient Object source;   // WHO fired it
    
    public EventObject(Object source) {
        this.source = source;
    }
    
    public Object getSource() {
        return source;    // Get the object that fired this event
    }
}

// When you see ANY event extending EventObject, you know:
// → It has a source (the thing that fired it)
// → It carries data through its own fields
```

---

## 3. Building an Event System From Scratch

### Step 1: Define the Event

```java
// The event = a data carrier
public class OrderPlacedEvent {
    private final String orderId;
    private final String customerId;
    private final double amount;
    private final LocalDateTime timestamp;
    
    public OrderPlacedEvent(String orderId, String customerId, double amount) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.timestamp = LocalDateTime.now();
    }
    
    // Getters only — events should be IMMUTABLE
    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public double getAmount() { return amount; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
```

### Step 2: Define the Listener Interface

```java
// The contract: "I can handle OrderPlacedEvent"
public interface OrderEventListener {
    void onOrderPlaced(OrderPlacedEvent event);
}
```

### Step 3: Build the Event Publisher

```java
public class OrderService {
    // List of listeners (observers)
    private final List<OrderEventListener> listeners = new ArrayList<>();
    
    // Register listener
    public void addListener(OrderEventListener listener) {
        listeners.add(listener);
    }
    
    // Remove listener
    public void removeListener(OrderEventListener listener) {
        listeners.remove(listener);
    }
    
    // Business logic
    public void placeOrder(String customerId, double amount) {
        String orderId = UUID.randomUUID().toString();
        
        // ... save order to database ...
        
        // Fire event — notify all listeners
        OrderPlacedEvent event = new OrderPlacedEvent(orderId, customerId, amount);
        for (OrderEventListener listener : listeners) {
            listener.onOrderPlaced(event);
        }
    }
}
```

### Step 4: Implement Listeners

```java
public class EmailNotifier implements OrderEventListener {
    @Override
    public void onOrderPlaced(OrderPlacedEvent event) {
        System.out.printf("📧 Sending email for order %s, amount: $%.2f%n",
            event.getOrderId(), event.getAmount());
    }
}

public class InventoryUpdater implements OrderEventListener {
    @Override
    public void onOrderPlaced(OrderPlacedEvent event) {
        System.out.printf("📦 Reducing inventory for order %s%n",
            event.getOrderId());
    }
}

public class AnalyticsTracker implements OrderEventListener {
    @Override
    public void onOrderPlaced(OrderPlacedEvent event) {
        System.out.printf("📊 Tracking purchase: customer=%s, amount=$%.2f%n",
            event.getCustomerId(), event.getAmount());
    }
}
```

### Step 5: Wire It Together

```java
public class Main {
    public static void main(String[] args) {
        OrderService orderService = new OrderService();
        
        // Register listeners
        orderService.addListener(new EmailNotifier());
        orderService.addListener(new InventoryUpdater());
        orderService.addListener(new AnalyticsTracker());
        
        // Place order — all 3 listeners react!
        orderService.placeOrder("CUST-001", 299.99);
        
        // Output:
        // 📧 Sending email for order abc-123, amount: $299.99
        // 📦 Reducing inventory for order abc-123
        // 📊 Tracking purchase: customer=CUST-001, amount=$299.99
    }
}
```

```
The Flow:
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ OrderService │────→│ OrderPlacedEvent │────→│ EmailNotifier     │
│ (Publisher)  │     │ (Data Carrier)   │────→│ InventoryUpdater  │
│              │     │                  │────→│ AnalyticsTracker   │
└─────────────┘     └──────────────────┘     └──────────────────┘
  Fires event        Carries: orderId,         Each reacts
                     customerId, amount,       independently
                     timestamp
```

---

## 4. Generic Event System — Production Grade

```java
// Step 1: Generic event interface
public interface Event {
    LocalDateTime getTimestamp();
}

// Step 2: Generic listener
@FunctionalInterface
public interface EventListener<E extends Event> {
    void handle(E event);
}

// Step 3: Event Bus (central event manager)
public class EventBus {
    private final Map<Class<?>, List<EventListener<?>>> listeners = new ConcurrentHashMap<>();
    
    // Register listener for a specific event type
    public <E extends Event> void subscribe(Class<E> eventType, EventListener<E> listener) {
        listeners.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>())
                 .add(listener);
    }
    
    // Unregister
    public <E extends Event> void unsubscribe(Class<E> eventType, EventListener<E> listener) {
        List<EventListener<?>> list = listeners.get(eventType);
        if (list != null) {
            list.remove(listener);
        }
    }
    
    // Publish event to all registered listeners
    @SuppressWarnings("unchecked")
    public <E extends Event> void publish(E event) {
        List<EventListener<?>> list = listeners.get(event.getClass());
        if (list != null) {
            for (EventListener<?> listener : list) {
                ((EventListener<E>) listener).handle(event);
            }
        }
    }
}

// Usage
EventBus bus = new EventBus();

bus.subscribe(OrderPlacedEvent.class, event -> 
    System.out.println("Order: " + event.getOrderId()));

bus.subscribe(UserRegisteredEvent.class, event -> 
    System.out.println("Welcome: " + event.getUsername()));

bus.publish(new OrderPlacedEvent("ORD-1", "CUST-1", 99.99));
bus.publish(new UserRegisteredEvent("harsha", "h@mail.com"));
```

---

## 5. Spring ApplicationEvent — The Professional Way

### Built-in Event System

```java
// Step 1: Define event (extend ApplicationEvent or use any POJO in Spring 4.2+)

// Classic way (extends ApplicationEvent)
public class OrderPlacedEvent extends ApplicationEvent {
    private final String orderId;
    private final double amount;
    
    public OrderPlacedEvent(Object source, String orderId, double amount) {
        super(source);
        this.orderId = orderId;
        this.amount = amount;
    }
    
    public String getOrderId() { return orderId; }
    public double getAmount() { return amount; }
}

// Modern way (just a POJO — Spring 4.2+)
public record OrderPlacedEvent(String orderId, String customerId, double amount) {}
```

### Step 2: Publish

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    private final ApplicationEventPublisher eventPublisher;
    
    public void placeOrder(CreateOrderRequest request) {
        // ... save order ...
        
        // Publish event — Spring delivers to all listeners
        eventPublisher.publishEvent(
            new OrderPlacedEvent(request.orderId(), request.customerId(), request.amount())
        );
    }
}
```

### Step 3: Listen

```java
// Way 1: @EventListener annotation (RECOMMENDED)
@Component
public class OrderEventHandlers {
    
    @EventListener
    public void sendConfirmationEmail(OrderPlacedEvent event) {
        // Spring calls this when OrderPlacedEvent is published
        System.out.println("Email sent for order: " + event.orderId());
    }
    
    @EventListener
    public void updateInventory(OrderPlacedEvent event) {
        System.out.println("Inventory updated for: " + event.orderId());
    }
    
    // Conditional listening
    @EventListener(condition = "#event.amount() > 1000")
    public void notifyManager(OrderPlacedEvent event) {
        System.out.println("Manager notified: high-value order $" + event.amount());
    }
}

// Way 2: Async event handling (non-blocking)
@Component
public class AsyncEventHandlers {
    
    @Async
    @EventListener
    public void sendSlackNotification(OrderPlacedEvent event) {
        // Runs in a separate thread — doesn't block the publisher
        System.out.println("Slack notification sent");
    }
}

// Way 3: @TransactionalEventListener
@Component
public class TransactionalHandlers {
    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterOrderCommitted(OrderPlacedEvent event) {
        // Only fires AFTER the transaction commits successfully
        // If transaction rolls back → this NEVER fires
        System.out.println("Order committed, sending external notification");
    }
}
```

```
Spring Event Flow:
┌─────────────┐   publishEvent()   ┌──────────────────┐
│ OrderService │──────────────────→│ ApplicationEvent  │
│              │                    │ Publisher          │
└─────────────┘                    └────────┬───────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              ↓             ↓             ↓
                    ┌─────────────┐ ┌────────────┐ ┌─────────────┐
                    │ @EventList. │ │ @Async     │ │ @Transact.  │
                    │ sendEmail() │ │ sendSlack()│ │ afterCommit │
                    └─────────────┘ └────────────┘ └─────────────┘
                     Same thread     New thread     After TX commit
```

---

## 6. Spring Built-in Events — What You Can Listen To

```java
@Component
public class AppLifecycleListener {
    
    @EventListener
    public void onStartup(ApplicationReadyEvent event) {
        System.out.println("🚀 Application is READY to serve requests");
    }
    
    @EventListener
    public void onContextRefreshed(ContextRefreshedEvent event) {
        System.out.println("🔄 Context refreshed (all beans created)");
    }
    
    @EventListener
    public void onContextClosed(ContextClosedEvent event) {
        System.out.println("🛑 Application shutting down");
    }
    
    @EventListener
    public void onServletRequest(ServletRequestHandledEvent event) {
        System.out.printf("📡 %s %s → %dms %n", 
            event.getMethod(), event.getRequestUrl(), event.getProcessingTimeMillis());
    }
}
```

```
Spring Boot Startup Event Order:
┌────────────────────────────────┐
│ ApplicationStartingEvent       │ ← Before anything
│ ApplicationEnvironmentPrepared │ ← Environment ready
│ ApplicationContextInitialized  │ ← Context created
│ ApplicationPreparedEvent       │ ← Beans defined
│ ContextRefreshedEvent          │ ← All beans created
│ ApplicationStartedEvent        │ ← Context refreshed
│ ApplicationReadyEvent          │ ← READY to serve ✅
└────────────────────────────────┘
```

---

## 7. Observer Pattern — The Design Pattern Behind Events

```
╔══════════════════════════════════════════════════════════════╗
║ Observer Pattern = the FORMAL name for the event/listener    ║
║ pattern. Same concept, different vocabulary:                 ║
║                                                              ║
║ Publisher  = Subject  = Observable   (fires events)          ║
║ Listener   = Observer                (reacts to events)      ║
║ Event      = Notification = Message  (data carrier)          ║
╚══════════════════════════════════════════════════════════════╝
```

### Classic Observer Pattern

```java
// Subject interface
public interface Subject<T> {
    void attach(Observer<T> observer);
    void detach(Observer<T> observer);
    void notifyObservers(T data);
}

// Observer interface
@FunctionalInterface
public interface Observer<T> {
    void update(T data);
}

// Concrete subject: Stock Price Monitor
public class StockPriceMonitor implements Subject<StockPrice> {
    private final List<Observer<StockPrice>> observers = new CopyOnWriteArrayList<>();
    private final String symbol;
    
    public StockPriceMonitor(String symbol) {
        this.symbol = symbol;
    }
    
    @Override
    public void attach(Observer<StockPrice> observer) {
        observers.add(observer);
    }
    
    @Override
    public void detach(Observer<StockPrice> observer) {
        observers.remove(observer);
    }
    
    @Override
    public void notifyObservers(StockPrice price) {
        for (Observer<StockPrice> observer : observers) {
            observer.update(price);
        }
    }
    
    public void updatePrice(double newPrice) {
        StockPrice price = new StockPrice(symbol, newPrice, LocalDateTime.now());
        notifyObservers(price);  // Tell everyone!
    }
}

// Event data
public record StockPrice(String symbol, double price, LocalDateTime timestamp) {}

// Usage
StockPriceMonitor tesla = new StockPriceMonitor("TSLA");

// Observer 1: Display on screen
tesla.attach(price -> 
    System.out.printf("📺 %s: $%.2f%n", price.symbol(), price.price()));

// Observer 2: Alert if price drops
tesla.attach(price -> {
    if (price.price() < 200) {
        System.out.println("🚨 ALERT: TSLA below $200!");
    }
});

// Observer 3: Log to database
tesla.attach(price -> 
    System.out.printf("💾 Logged: %s at %s%n", price.symbol(), price.timestamp()));

tesla.updatePrice(250.50);
// 📺 TSLA: $250.50
// 💾 Logged: TSLA at 2026-03-08T10:00:00

tesla.updatePrice(195.00);
// 📺 TSLA: $195.00
// 🚨 ALERT: TSLA below $200!
// 💾 Logged: TSLA at 2026-03-08T10:01:00
```

---

## 8. Property Change Events — Java Beans Standard

```java
import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;

public class UserProfile {
    private final PropertyChangeSupport pcs = new PropertyChangeSupport(this);
    
    private String name;
    private String email;
    private int age;
    
    // Add/Remove listeners
    public void addPropertyChangeListener(PropertyChangeListener listener) {
        pcs.addPropertyChangeListener(listener);
    }
    
    public void removePropertyChangeListener(PropertyChangeListener listener) {
        pcs.removePropertyChangeListener(listener);
    }
    
    // When property changes → fire event with OLD and NEW value
    public void setName(String name) {
        String oldName = this.name;
        this.name = name;
        pcs.firePropertyChange("name", oldName, name);
    }
    
    public void setAge(int age) {
        int oldAge = this.age;
        this.age = age;
        pcs.firePropertyChange("age", oldAge, age);
    }
    
    // ... getters
}

// Usage
UserProfile profile = new UserProfile();

// Listen to ALL property changes
profile.addPropertyChangeListener(event -> {
    System.out.printf("Property '%s' changed: %s → %s%n",
        event.getPropertyName(), event.getOldValue(), event.getNewValue());
});

profile.setName("Harsha");    // Property 'name' changed: null → Harsha
profile.setAge(25);           // Property 'age' changed: 0 → 25
profile.setName("Sai");       // Property 'name' changed: Harsha → Sai
```

### Understanding the PropertyChangeEvent Object

```
PropertyChangeEvent contains:
┌──────────────────────────────────────────┐
│ getSource()        → UserProfile object  │ ← WHO fired it
│ getPropertyName()  → "name"              │ ← WHAT changed
│ getOldValue()      → "Harsha"            │ ← Previous value
│ getNewValue()      → "Sai"               │ ← Current value
│                                          │
│ This pattern is used in:                 │
│ • JavaFX bindings                        │
│ • Swing UI components                    │
│ • JMX monitoring                         │
│ • Any reactive data binding              │
└──────────────────────────────────────────┘
```

---

## 9. Event-Driven Architecture — The Big Picture

```
LAYERED (Traditional):
┌──────────────┐
│ Controller   │ → directly calls →  Service  → directly calls →  Repository
└──────────────┘
Problem: Tight coupling. Adding email? Change Service code.

EVENT-DRIVEN:
┌──────────────┐
│ Controller   │ → calls → Service → publishes event → 
└──────────────┘                            ↓
                              ┌─────────────┼──────────────┐
                              ↓             ↓              ↓
                          EmailHandler  InventoryHandler  AnalyticsHandler
                          
Benefit: Service doesn't know about handlers.
         Add new handler → ZERO changes to Service.
```

### When to Use Events vs Direct Calls

```
┌──────────────────────────────────────────────────────────────┐
│ DIRECT CALL (method invocation)                               │
│ ✅ Use when: caller NEEDS the result immediately              │
│ ✅ Use when: operation is core business logic                 │
│ ✅ Use when: simple, 1-to-1 relationship                     │
│ Example: orderService.calculateTotal(items)                   │
│                                                               │
│ EVENT-DRIVEN                                                   │
│ ✅ Use when: multiple things react to one action               │
│ ✅ Use when: reactions are INDEPENDENT of each other           │
│ ✅ Use when: you want to add reactions WITHOUT changing source │
│ ✅ Use when: async processing is acceptable                    │
│ Example: order placed → email + inventory + analytics          │
│                                                               │
│ ❌ DON'T use events for:                                     │
│ • Simple getter/setter calls                                  │
│ • When you need the result synchronously                      │
│ • When there's only one listener (just call the method!)      │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Java NIO File Watch Events — Real-World Example

```java
// Watch a directory for file changes
public class FileWatcher {
    
    public void watchDirectory(Path dir) throws IOException, InterruptedException {
        WatchService watcher = FileSystems.getDefault().newWatchService();
        
        dir.register(watcher,
            StandardWatchEventKinds.ENTRY_CREATE,
            StandardWatchEventKinds.ENTRY_MODIFY,
            StandardWatchEventKinds.ENTRY_DELETE
        );
        
        System.out.println("Watching: " + dir);
        
        while (true) {
            WatchKey key = watcher.take();  // Blocks until event
            
            for (WatchEvent<?> event : key.pollEvents()) {
                WatchEvent.Kind<?> kind = event.kind();
                Path filename = (Path) event.context();
                
                // Understanding the event object:
                // kind()    → WHAT happened (CREATE/MODIFY/DELETE)
                // context() → WHICH file was affected
                // count()   → HOW MANY times (overflow detection)
                
                System.out.printf("Event: %s → File: %s%n", kind.name(), filename);
            }
            
            key.reset();  // Must reset to receive more events
        }
    }
}
```

---

## 11. CompletableFuture as Events — Modern Async Pattern

```java
// CompletableFuture are essentially "future events"
// "When X completes, THEN do Y"

CompletableFuture<Order> orderFuture = CompletableFuture
    .supplyAsync(() -> orderService.createOrder(request))
    
    // WHEN order created → THEN send email
    .thenApply(order -> {
        emailService.sendConfirmation(order);
        return order;
    })
    
    // WHEN email sent → THEN update inventory
    .thenApply(order -> {
        inventoryService.reduce(order.getItems());
        return order;
    })
    
    // WHEN everything done → THEN track analytics
    .thenAccept(order -> 
        analyticsService.trackPurchase(order))
    
    // IF anything fails → handle error
    .exceptionally(ex -> {
        log.error("Order pipeline failed", ex);
        return null;
    });
```

```
Event Chain:
supplyAsync → thenApply → thenApply → thenAccept
    │             │            │            │
  Order       + Email     + Inventory   + Analytics
  Created      Sent        Updated       Tracked
    
Each step is an "event handler" for the previous step's completion
```

---

## 12. Reactive Streams — The Ultimate Event Pattern

```java
// Reactive = continuous stream of events
// Using Project Reactor (Spring WebFlux foundation)

Flux<StockPrice> stockPrices = Flux.interval(Duration.ofSeconds(1))
    .map(tick -> new StockPrice("TSLA", 200 + Math.random() * 50, LocalDateTime.now()));

// Subscribe = register event listener
stockPrices
    .filter(price -> price.price() > 230)          // Only high prices
    .map(price -> "🚨 TSLA high: $" + price.price())
    .subscribe(
        message -> System.out.println(message),     // onNext (event handler)
        error -> System.err.println("Error: " + error), // onError
        () -> System.out.println("Stream complete")      // onComplete
    );
    
// This is event-driven at the STREAM level:
// Publisher  = Flux (emits stock prices every second)
// Event      = Each StockPrice object
// Subscriber = The lambda in subscribe()
```

---

## 13. How to Read/Understand ANY Event System

When you encounter a new event system (in any framework), follow this checklist:

```
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: Find the EVENT CLASS                                   │
│   → What fields does it have? (that's the data)                │
│   → Does it extend a base event class?                         │
│   → Is it immutable? (events should be)                        │
│                                                                │
│ STEP 2: Find WHO PUBLISHES it                                  │
│   → Search for: new EventClassName(                            │
│   → Or: eventPublisher.publish(                                │
│   → Or: fireEvent( / notifyObservers(                          │
│                                                                │
│ STEP 3: Find WHO LISTENS                                       │
│   → Search for: @EventListener                                 │
│   → Or: implements Listener<EventType>                         │
│   → Or: addEventListener( / subscribe(                         │
│                                                                │
│ STEP 4: Trace the FLOW                                         │
│   → Publisher creates event                                    │
│   → Event carries data through the system                      │
│   → Each listener receives and processes independently         │
│                                                                │
│ STEP 5: Check ORDERING & THREADING                             │
│   → Are listeners called synchronously or async?               │
│   → Is there a guaranteed order?                               │
│   → What happens if a listener throws an exception?            │
└────────────────────────────────────────────────────────────────┘
```

---

## 14. Common Event Patterns Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│ PATTERN         │ COUPLING  │ THREAD    │ USE CASE              │
│─────────────────│───────────│───────────│───────────────────────│
│ Direct call     │ Tight     │ Same      │ Core business logic   │
│ Observer        │ Loose     │ Same      │ In-process notif.     │
│ Event Bus       │ Very loose│ Same/Async│ In-app decoupling     │
│ Spring Events   │ Very loose│ Same/@Async│ Spring apps          │
│ Message Queue   │ Zero      │ Separate  │ Microservices         │
│ Reactive Stream │ Zero      │ Scheduled │ High-throughput       │
│─────────────────│───────────│───────────│───────────────────────│
│                                                                 │
│ Coupling gets LOOSER as you go down                             │
│ Complexity gets HIGHER as you go down                           │
│ Choose the SIMPLEST that meets your needs                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. Interview Questions & Answers

**Q: What is the Observer pattern? Give a real example.**
> Subject maintains a list of observers. When state changes, it notifies all. Example: Stock price monitor notifies display, alert, and logging components.

**Q: Explain Spring's event system.**
> Any bean can publish events via `ApplicationEventPublisher`. Other beans use `@EventListener` to react. Events can be sync/async and transactional.

**Q: When would you use events vs direct method calls?**
> Events when multiple independent reactions to one action, when you want decoupling, or when reactions might change. Direct calls when you need the result, or there's a 1-to-1 relationship.

**Q: What is @TransactionalEventListener?**
> It fires AFTER the transaction phase (usually AFTER_COMMIT). If the transaction rolls back, the listener never fires. Used for external side-effects like sending emails.

**Q: How do you handle event listener failures?**
> Sync: exception propagates to publisher (dangerous). Async (@Async): exception logged, publisher unaffected. Best practice: use try-catch in listeners, dead-letter queue for critical events.

**Q: How do events relate to eventual consistency in microservices?**
> Service A publishes event → message queue → Service B consumes. B is eventually consistent with A. If B fails, event stays in queue for retry. This is the foundation of event-driven microservices.

---

> **Key Takeaway**: Events are everywhere in Java — from Swing buttons 
> to Spring beans to Kafka messages. The core pattern is always the same:
> **Publisher fires → Event carries data → Listener reacts**.
> Learn to identify these 3 parts in ANY system.

> **Navigation**: [< Reflection & Annotations](47_Java_Reflection_Annotations_Deep.md) | [Back to Index](../00_MASTER_INDEX.md) | [Enums, Records & Sealed >](49_Java_Enums_Records_Sealed_Deep.md)
