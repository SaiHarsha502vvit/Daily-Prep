# Async Patterns in Flutter — Complete Reference
### Future, async/await, Stream, Isolates — how asynchronous Dart actually works

---

## The Event Loop — How Dart Handles Concurrency

Dart is single-threaded per isolate. It does NOT block on I/O. Instead, it uses an event loop — the same model as JavaScript's event loop.

```
Dart Event Loop
───────────────

      ┌─────────────────────────────────────┐
      │         Dart Isolate (1 thread)      │
      │                                      │
      │  ┌──────────────────────────────┐   │
      │  │     Running Code (stack)     │   │
      │  └──────────────────────────────┘   │
      │              ↑ dequeues              │
      │  ┌──────────────────────────────┐   │
      │  │   Microtask Queue (high pri) │   │  ← Future.then() callbacks go here
      │  └──────────────────────────────┘   │
      │              ↑ dequeues              │
      │  ┌──────────────────────────────┐   │
      │  │   Event Queue (normal pri)   │   │  ← I/O completions, timers, UI events
      │  └──────────────────────────────┘   │
      └─────────────────────────────────────┘
```

When you `await` a Future:
1. Dart registers a callback for when the Future completes
2. Dart returns control to the event loop (can process other events)
3. When the awaited Future completes, the callback is scheduled on the microtask queue
4. Dart resumes your code where it left off

This is why `await` doesn't freeze the UI — Dart keeps processing frames while waiting for I/O.

---

## Future — One Value, Eventually

A `Future<T>` represents a value that will be available at some point in the future. Like Java's `CompletableFuture<T>`.

```dart
// Creating futures
Future<String> fetchUsername() async {
  await Future.delayed(const Duration(seconds: 1));  // simulate network delay
  return 'Harsha';
}

// Futures that can fail
Future<User> fetchUser(String id) async {
  final response = await dio.get('/users/$id');
  if (response.statusCode == 404) throw const NotFoundException();
  return User.fromJson(response.data);
}

// Creating a completed future immediately
final future1 = Future.value(42);           // already completed with 42
final future2 = Future.error('oops');       // already failed

// Delayed future
final future3 = Future.delayed(
  const Duration(seconds: 2),
  () => 'ready',  // value producer function (optional)
);
```

### async / await

```dart
// WITHOUT async/await — callback hell
fetchUser(id).then((user) {
  return fetchUserPosts(user.id);
}).then((posts) {
  setState(() => _posts = posts);
}).catchError((error) {
  setState(() => _error = error.toString());
});

// WITH async/await — reads like synchronous code
Future<void> _loadData() async {
  try {
    final user = await fetchUser(id);
    final posts = await fetchUserPosts(user.id);
    setState(() => _posts = posts);
  } catch (e) {
    setState(() => _error = e.toString());
  }
}
```

### Running Multiple Futures in Parallel

```dart
// SEQUENTIAL — waits for each one before starting the next
final user = await fetchUser(id);       // 1 second
final posts = await fetchPosts(id);     // 1 second
// Total: 2 seconds

// PARALLEL — starts all at once
final results = await Future.wait([
  fetchUser(id),
  fetchPosts(id),
  fetchFriends(id),
]);
// Total: max(1s, 1s, 1s) = 1 second
final user = results[0] as User;
final posts = results[1] as List<Post>;
final friends = results[2] as List<User>;

// Better with named results
final (user, posts, friends) = await (
  fetchUser(id),
  fetchPosts(id),
  fetchFriends(id),
).wait;  // Dart 3 record destructuring
```

### `Future.any` — First to Finish Wins

```dart
// Race multiple futures — take the first result
final result = await Future.any([
  apiServer1.fetchData(),
  apiServer2.fetchData(),  // whichever responds first wins
]);
```

### `Completer` — Complete a Future Manually

```dart
// Create a Future you complete yourself
class EventWaiter {
  final _completer = Completer<String>();

  Future<String> get result => _completer.future;

  void onEventReceived(String data) {
    if (!_completer.isCompleted) {
      _completer.complete(data);
    }
  }

  void onError(Object error) {
    if (!_completer.isCompleted) {
      _completer.completeError(error);
    }
  }
}
```

---

## Stream — Multiple Values Over Time

A `Stream<T>` emits zero or more values over time, then optionally completes or errors. Like Java's `Flux<T>` in Project Reactor.

```
Future:  ──────────────●
                       one value, done

Stream:  ──●──●──────●──●────────|
           values over time     done
```

### Creating Streams

```dart
// 1. StreamController — manual stream creation
final _controller = StreamController<String>();

// Add values
_controller.sink.add('Hello');
_controller.sink.add('World');

// Close the stream
_controller.close();

// Listen to the stream
_controller.stream.listen(
  (value) => print(value),
  onError: (error) => print('Error: $error'),
  onDone: () => print('Stream closed'),
);

// Broadcast stream — multiple listeners allowed
final _broadcastController = StreamController<String>.broadcast();

// 2. Generator function with yield
Stream<int> countdown(int from) async* {
  for (int i = from; i >= 0; i--) {
    await Future.delayed(const Duration(seconds: 1));
    yield i;  // emit one value
  }
}

// Usage
await for (final value in countdown(5)) {
  print(value); // 5, 4, 3, 2, 1, 0 — one per second
}

// 3. Stream.periodic — emit at intervals
final tickStream = Stream.periodic(
  const Duration(seconds: 1),
  (count) => count,  // transform: tick count → value
).take(10);  // only take first 10

// 4. Stream.fromFutures — combine multiple futures into a stream
final stream = Stream.fromFutures([
  fetchItem(1),
  fetchItem(2),
  fetchItem(3),
]);
// Emits each future's result as it completes (in completion order, not declaration order)

// 5. Stream.fromIterable
final stream = Stream.fromIterable([1, 2, 3, 4, 5]);
```

### Stream Operators (like RxJava)

```dart
// All stream operators return a new Stream — chains compose
final stream = Stream.fromIterable([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

final result = stream
    .where((n) => n.isEven)              // filter: keep only even numbers
    .map((n) => n * n)                   // transform: square each
    .take(3)                             // take only first 3 results
    .skip(1)                             // skip the first of those
    .distinct()                          // remove consecutive duplicates
    .timeout(const Duration(seconds: 5)) // error if no event for 5 seconds
    .handleError((error) => print('Error: $error'));

// Combining streams
final merged = StreamGroup.merge([stream1, stream2]);
final zipped = StreamZip([stream1, stream2]);
// (requires package:async for StreamGroup)
```

### StreamSubscription — Managing a Stream

```dart
StreamSubscription<Message>? _subscription;

@override
void initState() {
  super.initState();
  _subscription = _chatRepo.messageStream.listen(
    (message) => setState(() => _messages.add(message)),
    onError: (error) => _handleError(error),
    onDone: () => print('Stream ended'),
    cancelOnError: false,  // don't cancel on first error (default is false)
  );
}

@override
void dispose() {
  _subscription?.cancel();  // ALWAYS cancel subscriptions in dispose()
  super.dispose();
}
```

---

## StreamBuilder — Stream in the Widget Tree

```dart
StreamBuilder<List<Message>>(
  stream: _chatRepository.messagesStream(chatId),
  initialData: const [],  // optional: data before first event
  builder: (context, snapshot) {
    // snapshot.connectionState values:
    // ConnectionState.none    — no stream
    // ConnectionState.waiting — waiting for first event
    // ConnectionState.active  — stream is active, last event in snapshot.data
    // ConnectionState.done    — stream closed

    if (snapshot.connectionState == ConnectionState.waiting) {
      return const Center(child: CircularProgressIndicator());
    }

    if (snapshot.hasError) {
      return Center(child: Text('Error: ${snapshot.error}'));
    }

    final messages = snapshot.data ?? [];

    if (messages.isEmpty) {
      return const Center(child: Text('No messages yet'));
    }

    return ListView.builder(
      reverse: true,
      itemCount: messages.length,
      itemBuilder: (_, i) => MessageBubble(message: messages[i]),
    );
  },
)
```

**Important:** `StreamBuilder` automatically subscribes to the stream when built and cancels when disposed. You don't need to manage the subscription yourself.

---

## FutureBuilder — Future in the Widget Tree

```dart
// BAD: creating the future inside build() — new Future on every rebuild!
@override
Widget build(BuildContext context) {
  return FutureBuilder<User>(
    future: _fetchUser(), // Called on every rebuild — triggers new network request!
    builder: (_, snapshot) => ...,
  );
}

// GOOD: create the future once in initState()
class _UserScreenState extends State<UserScreen> {
  late Future<User> _userFuture;

  @override
  void initState() {
    super.initState();
    _userFuture = _fetchUser();  // only called once
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<User>(
      future: _userFuture,  // same Future object — no duplicate requests
      builder: (context, snapshot) {
        switch (snapshot.connectionState) {
          case ConnectionState.waiting:
            return const CircularProgressIndicator();
          case ConnectionState.done:
            if (snapshot.hasError) return ErrorWidget(snapshot.error!);
            return UserProfile(user: snapshot.data!);
          default:
            return const SizedBox.shrink();
        }
      },
    );
  }
}
```

**The real recommendation:** Use Riverpod's `FutureProvider` instead of `FutureBuilder` in production code. `FutureProvider` handles caching, deduplication, and re-fetching automatically.

---

## Dart Isolates — True Parallelism

Dart's single-threaded model means heavy computation blocks the UI thread. Isolates are separate threads with their own memory — they communicate by passing messages (no shared memory).

### `compute()` — Simple Isolate for One Task

```dart
import 'dart:isolate';
import 'package:flutter/foundation.dart';

// The function MUST be a top-level or static function
// (closures can't be sent to isolates)
List<int> _sortLargeList(List<int> data) {
  data.sort();
  return data;
}

// Usage in widget/service:
final sorted = await compute(_sortLargeList, hugeList);

// Another example: parse large JSON
Map<String, dynamic> _parseJson(String jsonString) {
  return json.decode(jsonString) as Map<String, dynamic>;
}

final data = await compute(_parseJson, veryLargeJsonString);
```

### Full Isolate — For Ongoing Work

```dart
import 'dart:isolate';

// Top-level function that runs in the isolate
void _isolateMain(SendPort mainSendPort) {
  final receivePort = ReceivePort();
  // Send our receive port to the main isolate so it can talk to us
  mainSendPort.send(receivePort.sendPort);

  receivePort.listen((message) {
    if (message == 'stop') {
      receivePort.close();
      return;
    }

    // Do heavy work
    final result = _heavyComputation(message as int);
    mainSendPort.send(result);
  });
}

class IsolateWorker {
  Isolate? _isolate;
  SendPort? _workerSendPort;
  ReceivePort? _receivePort;

  Future<void> start() async {
    _receivePort = ReceivePort();
    _isolate = await Isolate.spawn(_isolateMain, _receivePort!.sendPort);

    // First message from isolate is its SendPort
    _workerSendPort = await _receivePort!.first as SendPort;
  }

  Future<int> compute(int value) async {
    final replyPort = ReceivePort();
    _workerSendPort!.send({'value': value, 'replyPort': replyPort.sendPort});
    final result = await replyPort.first as int;
    replyPort.close();
    return result;
  }

  void stop() {
    _workerSendPort?.send('stop');
    _isolate?.kill();
    _receivePort?.close();
  }
}
```

### When to Use Each

| Scenario | Tool |
|----------|------|
| Network request (Dio, HTTP) | `async/await` — I/O is non-blocking, no isolate needed |
| Parse a small JSON response | `async/await` in repository |
| Parse a 5MB JSON response | `compute()` |
| Image processing / filtering | `compute()` |
| Cryptographic hashing | `compute()` |
| Ongoing background task (compression, analysis) | Full `Isolate.spawn()` |
| Timer-based work | `Timer` / `Timer.periodic` |
| Periodic sync in background | Workmanager plugin (platform background tasks) |

---

## Timer — Schedule Work Later

```dart
import 'dart:async';

class _DebounceSearchState extends State<DebounceSearch> {
  Timer? _debounceTimer;

  void _onSearchChanged(String query) {
    // Cancel previous timer
    _debounceTimer?.cancel();

    // Start new timer — only fires if user stops typing for 500ms
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performSearch(query);
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();  // ALWAYS cancel timers in dispose()
    super.dispose();
  }
}

// Periodic timer — fires repeatedly
class _CountdownState extends State<Countdown> {
  late Timer _timer;
  int _seconds = 60;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _seconds--;
        if (_seconds == 0) timer.cancel();
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }
}
```

---

## async* / yield — Generator Functions

Dart has generator functions that produce a sequence of values lazily:

```dart
// Sync generator — produces values immediately
Iterable<int> fibonacci() sync* {
  int a = 0, b = 1;
  while (true) {
    yield a;
    final temp = a + b;
    a = b;
    b = temp;
  }
}

// Take first 10 fibonacci numbers
final fibs = fibonacci().take(10).toList();
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

// Async generator — produces a Stream
Stream<WeatherUpdate> watchWeather(String city) async* {
  while (true) {
    yield await fetchCurrentWeather(city);      // emit one update
    await Future.delayed(const Duration(minutes: 10)); // wait between updates
  }
}

// Usage
StreamBuilder<WeatherUpdate>(
  stream: watchWeather('Hyderabad'),
  builder: (_, snapshot) => ...,
)
```

---

## Error Handling in Async Code

```dart
// try/catch works with await just like synchronous code
Future<void> _loadData() async {
  try {
    final data = await _repository.fetchData();
    setState(() => _data = data);
  } on NetworkException catch (e) {
    setState(() => _error = 'Network error: ${e.message}');
  } on NotFoundException {
    setState(() => _error = 'Not found');
  } catch (e, stackTrace) {
    // Catch-all — log the stack trace
    debugPrint('Unexpected error: $e\n$stackTrace');
    setState(() => _error = 'Something went wrong');
  } finally {
    setState(() => _isLoading = false);  // always runs
  }
}

// Handling errors in Future chains
fetchUser(id)
    .then((user) => _showUser(user))
    .catchError((error) => _showError(error),
        test: (error) => error is NetworkException)  // only catch this type
    .catchError((error) => _showGenericError());     // catch everything else

// whenComplete — like finally for Future chains
fetchUser(id)
    .then((user) => _showUser(user))
    .catchError((error) => _showError(error))
    .whenComplete(() => setState(() => _isLoading = false));
```

---

## Common Patterns in Flutter Apps

### Loading State Pattern

```dart
class _DataScreenState extends State<DataScreen> {
  bool _isLoading = false;
  String? _errorMessage;
  List<Item>? _items;

  Future<void> _loadItems() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final items = await _repository.getItems();
      if (!mounted) return;
      setState(() => _items = items);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = _formatError(e));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) return ErrorView(message: _errorMessage!, onRetry: _loadItems);
    if (_items == null) return const SizedBox.shrink();
    if (_items!.isEmpty) return const EmptyState();
    return ItemList(items: _items!);
  }
}
```

### Debounce Pattern

```dart
extension Debounce on Function {
  static final Map<Function, Timer> _timers = {};

  void call(Duration delay) {
    _timers[this]?.cancel();
    _timers[this] = Timer(delay, () {
      this();
      _timers.remove(this);
    });
  }
}

// Usage in TextField
TextField(
  onChanged: (query) {
    _search.call(const Duration(milliseconds: 300));
  },
)
```

### Polling Pattern (Refresh Every N Seconds)

```dart
class _LiveDataState extends State<LiveData> {
  Timer? _pollTimer;
  StreamSubscription? _sub;

  @override
  void initState() {
    super.initState();
    _loadData();
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) => _loadData());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _sub?.cancel();
    super.dispose();
  }
}
```

### StreamController as Event Bus

```dart
// Simple app-wide event bus — widgets can publish and subscribe
class AppEvents {
  static final _controller = StreamController<AppEvent>.broadcast();

  static Stream<AppEvent> get stream => _controller.stream;

  static void publish(AppEvent event) => _controller.add(event);

  // Subscribe to only a specific event type
  static Stream<T> on<T extends AppEvent>() =>
      stream.whereType<T>();
}

// Publish an event
AppEvents.publish(UserLoggedOutEvent());

// Subscribe in a widget
class _NavBarState extends State<NavBar> {
  StreamSubscription? _sub;

  @override
  void initState() {
    super.initState();
    _sub = AppEvents.on<UserLoggedOutEvent>().listen((_) {
      if (mounted) setState(() => _isLoggedIn = false);
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
```

---

## Quick Reference

| Tool | Use for | Java equivalent |
|------|---------|-----------------|
| `Future<T>` | Single async result | `CompletableFuture<T>` |
| `async/await` | Write async code linearly | `async/await` (Java 21+) |
| `Future.wait([...])` | Run multiple futures in parallel | `CompletableFuture.allOf()` |
| `Stream<T>` | Multiple values over time | `Flux<T>` / `Observable<T>` |
| `StreamController` | Create a stream you control | `Subject` in RxJava |
| `StreamBuilder` | React to stream in UI | LiveData observer |
| `FutureBuilder` | React to future in UI | ViewModel + LiveData |
| `compute(fn, arg)` | Offload heavy work to isolate | `CompletableFuture.supplyAsync()` |
| `Isolate.spawn()` | Long-running background thread | `Thread` / `ExecutorService` |
| `Timer` | Delayed or repeated execution | `ScheduledExecutorService` |
| `async*` / `yield` | Create a Stream lazily | Java 9 `Flow.Publisher` |
| `sync*` / `yield` | Create an `Iterable` lazily | Java `Iterable` with generator |

---

**→ Related files:**
- [DOC_06b_Async_Patterns_Challenges.md](DOC_06b_Async_Patterns_Challenges.md) — want to actually get fluent, not just informed? Challenges for this doc
- [DOC_01_Rendering_Pipeline.md](DOC_01_Rendering_Pipeline.md) — how Dart's event loop connects to Flutter frames
- [DOC_07_ADB_and_Dev_Tooling.md](DOC_07_ADB_and_Dev_Tooling.md) — how hot reload tunnels through ADB to reach the Dart VM Service this doc describes
- [Phase_3_State_and_APIs/Week_13_Riverpod.md](../Phase_3_State_and_APIs/Week_13_Riverpod.md) — FutureProvider and StreamProvider (preferred over FutureBuilder in production)
