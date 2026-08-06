# HTTP & REST API Challenges

### Companion to [Week 14: HTTP & REST APIs](Week_14_HTTP_and_REST_APIs.md)

---

## How This Works

Interceptor ordering and null-safety around real-world JSON are the two places developers get burned in production without ever having deliberately tested them. These challenges make you reproduce both on purpose. Paste starters into [DartPad](https://dartpad.dev) (add `dio` — DartPad supports package imports).

---

### W14-1 (Medium) — Interceptor execution order: predict before you run

**Problem:** two interceptors registered on the same `Dio` instance, in this order: `AuthInterceptor` first, `LoggingInterceptor` second.

```dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('AuthInterceptor: onRequest');
    options.headers['Authorization'] = 'Bearer token';
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('AuthInterceptor: onResponse');
    handler.next(response);
  }
}

class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('LoggingInterceptor: onRequest');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('LoggingInterceptor: onResponse');
    handler.next(response);
  }
}

final dio = Dio()
  ..interceptors.add(AuthInterceptor())
  ..interceptors.add(LoggingInterceptor());
```

**Task:** before running anything, write down the predicted print order for one request (all 4 lines). Then hit any real or mocked endpoint and check.

<details><summary>Answer & Explanation</summary>

```
AuthInterceptor: onRequest
LoggingInterceptor: onRequest
LoggingInterceptor: onResponse
AuthInterceptor: onResponse
```

🔴 **Explanation:** `onRequest` runs in **registration order** (first added, first to touch the outgoing request — makes sense, since `AuthInterceptor` needs to add the header *before* logging captures the final request). `onResponse` runs in **reverse registration order** — the response unwinds back through the interceptor chain the opposite way it went in, like a stack. This isn't an arbitrary Dio quirk; it's the same "wrap and unwrap" shape as nested middleware in any HTTP framework: the last interceptor added is the innermost wrapper around the actual network call, so it sees the raw response first on the way back out. Getting this order backwards in your head is a common source of "why is my auth header missing from the log line" confusion.

</details>

---

### W14-2 (Hard) — Repository pattern: never let `DioException` leak past the boundary

**Problem:** build a `Result<T>` sealed type and a repository that converts every possible `Dio` failure into a typed `Failure`, so consuming code never has to catch `DioException` directly.

```dart
sealed class Result<T> {}
class Success<T> extends Result<T> {
  Success(this.data);
  final T data;
}
class Failure<T> extends Result<T> {
  Failure(this.message);
  final String message;
}

class UserRepository {
  UserRepository(this._dio);
  final Dio _dio;

  Future<Result<String>> fetchUsername(String id) async {
    // TODO: call _dio.get('/users/$id'), catch DioException specifically,
    // and translate connection-timeout / 404 / other errors into
    // distinct, readable Failure messages. Never let DioException escape.
  }
}
```

**Task:** implement `fetchUsername`, distinguishing at least these three cases with different messages: connection timeout, HTTP 404, and "anything else." Then write the consuming widget code and note — does it need to know Dio exists at all?

<details><summary>Solution & Explanation</summary>

```dart
Future<Result<String>> fetchUsername(String id) async {
  try {
    final response = await _dio.get('/users/$id');
    return Success(response.data['username'] as String);
  } on DioException catch (e) {
    return switch (e.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.receiveTimeout => Failure('Request timed out — check your connection'),
      DioExceptionType.badResponse when e.response?.statusCode == 404 =>
          Failure('User not found'),
      _ => Failure('Something went wrong — please try again'),
    };
  }
}

// Consuming code — never imports dio at all:
final result = await userRepository.fetchUsername('42');
switch (result) {
  case Success(data: final username):
    print('Got: $username');
  case Failure(message: final msg):
    print('Error: $msg');
}
```

🔴 **Explanation:** this is [Week 21's Clean Architecture Dependency Inversion](../Phase_5_Advanced_Patterns/Week_21_Clean_Architecture.md) shown a phase early, in miniature — the repository is the **only** place in the codebase that imports `dio` and knows what a `DioException` is; everything above it deals exclusively in the app's own `Result<T>` type. This matters practically, not just architecturally: if you ever swap `Dio` for `http` or a hand-rolled client, only this one file changes. Every screen, every BLoC, every widget consuming `fetchUsername` is completely unaffected, because they were never coupled to Dio's exception types in the first place.

</details>

---

### W14-3 (Medium) — Retry with exponential backoff

**Problem:** write a generic retry wrapper: `Future<T> retryWithBackoff<T>(Future<T> Function() action, {int maxAttempts = 3})` that retries a failing `Future`-returning function, waiting longer between each attempt (exponential backoff), and rethrows only after exhausting all attempts.

```dart
Future<T> retryWithBackoff<T>(Future<T> Function() action, {int maxAttempts = 3}) async {
  // TODO
}

// Test with a flaky call that fails twice, then succeeds:
int _attempt = 0;
Future<String> flakyCall() async {
  _attempt++;
  if (_attempt < 3) throw Exception('Simulated failure #$_attempt');
  return 'Success on attempt $_attempt';
}
```

<details><summary>Solution & Explanation</summary>

```dart
Future<T> retryWithBackoff<T>(Future<T> Function() action, {int maxAttempts = 3}) async {
  for (int attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action();
    } catch (e) {
      if (attempt == maxAttempts) rethrow;
      final delay = Duration(milliseconds: 200 * (1 << (attempt - 1))); // 200ms, 400ms, 800ms...
      debugPrint('Attempt $attempt failed, retrying in ${delay.inMilliseconds}ms...');
      await Future.delayed(delay);
    }
  }
  throw StateError('unreachable');
}
```

🔴 **Explanation:** `1 << (attempt - 1)` is a bit-shift computing `2^(attempt-1)` — attempt 1 waits `200 * 1 = 200ms`, attempt 2 waits `200 * 2 = 400ms`, attempt 3 waits `200 * 4 = 800ms`. The *exponential* part matters for a real reason: if a server is struggling under load and every failed client retries after a fixed 1-second delay, all those clients hammer it again in near-perfect unison one second later, making the overload worse. Backing off exponentially (and, in a real production system, adding random jitter on top) spreads retries out and gives the struggling service actual room to recover. `rethrow` on the final attempt preserves the original stack trace — a plain `throw e` would replace it with a new one starting at this line, making the real failure point harder to trace.

</details>

---

### W14-4 (Medium) — The null-safety trap in real-world JSON

**Problem:** a "User" API response where `email` is sometimes present, sometimes `null`, and occasionally the key is missing entirely — but `id` and `name` are always guaranteed present.

```dart
class User {
  User({required this.id, required this.name, this.email});
  final String id;
  final String name;
  final String? email;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,        // TODO: is this safe as-is?
      name: json['name'] as String,    // TODO: is this safe as-is?
      email: json['email'] as String,  // BUG: crashes when email is null
    );
  }
}

void main() {
  final payloadWithEmail = {'id': '1', 'name': 'Alice', 'email': 'alice@example.com'};
  final payloadNoEmail = {'id': '2', 'name': 'Bob', 'email': null};
  final payloadMissingKey = {'id': '3', 'name': 'Charlie'};

  print(User.fromJson(payloadWithEmail).email);   // works
  print(User.fromJson(payloadNoEmail).email);      // TODO: crashes here — fix it
  print(User.fromJson(payloadMissingKey).email);   // and here
}
```

**Task 1:** run it, note the exact runtime error type on the second and third calls.

**Task 2:** fix `email` so it's genuinely optional. Then explain why `id` and `name` should probably stay as strict `as String` casts (crash-on-missing) rather than being made defensively nullable too.

<details><summary>Solution & Explanation</summary>

```dart
email: json['email'] as String?,
```

🔴 **Explanation:** the crash is a `type 'Null' is not a subtype of type 'String' in type cast` — `json['email']` evaluates to Dart `null` both when the key is missing and when it's present with a JSON `null` value (Dart's `Map` access returns `null` for a missing key, same as JSON `null` deserializes to), and casting `null as String` fails because `String` (without `?`) cannot hold `null` under null safety. `as String?` fixes it — casting `null` to a nullable type succeeds trivially.

The reason `id` and `name` should generally **stay** strict `as String` rather than becoming defensively nullable: if your API contract genuinely guarantees they're always present, a strict cast turns a violated contract into an immediate, loud crash with a clear stack trace pointing at the exact malformed response — which is far easier to debug than a `null` silently propagating three screens deep and causing a confusing `email` field to show blank text where a user's name should be. **Nullable types should model genuine optionality in your data, not paper over contract violations** — those deserve to fail loudly, close to the source.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The JSON Parser That Crashes on Real Data

```dart
class User {
  User({required this.name, required this.email, required this.age});
  final String name;
  final String email;
  final int age;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      name: json['name'] as String,
      email: json['email'] as String,
      age: json['age'] as int,
    );
  }
}
```

This works perfectly against your test data. It crashes in production the first time the API returns a user who hasn't set an age yet. Find the fix — and notice this is a "which field is genuinely optional" design question, not just a syntax fix.

<details><summary>Diagnosis & Fix</summary>

The crash: `type 'Null' is not a subtype of type 'int'` — `json['age']` is `null` (field omitted or explicitly null in the API response), and `as int` throws immediately on a `null` value, since `null` is not an `int`.

🔴 **Explanation:** `as String` / `as int` are **unconditional, unsafe casts** — they throw the instant the actual runtime value doesn't match, with no fallback. The fix isn't just "make everything nullable" — it's deciding, per field, which ones are truly required (crash loudly and immediately if missing — better than limping along with corrupt data) and which are genuinely optional:

```dart
factory User.fromJson(Map<String, dynamic> json) {
  return User(
    name: json['name'] as String,        // required — throw if missing, that's a real data problem
    email: json['email'] as String,      // required — same
    age: json['age'] as int? ?? 0,       // optional — default sensibly if absent
  );
}
```

`as int?` (note the `?`) safely casts to a nullable `int`, allowing `null` through instead of throwing, and `?? 0` supplies the fallback. The lesson: **a crash on a missing required field is a feature (fail fast, don't ship corrupted state) — a crash on a genuinely optional field is a bug.** Deciding which is which requires actually knowing your API's contract, not blindly making every field nullable "to be safe" (which just replaces crashes with silent `null`s propagating through your whole app instead).

</details>

---

### 🎭 Two Truths and a Lie — Dio Interceptors

**A.** Request interceptors run in the order they were registered; response interceptors run in the **reverse** of that order.

**B.** An interceptor can short-circuit a request entirely — resolving it with a fake/cached response without the request ever reaching the network.

**C.** If a request interceptor throws, the actual HTTP request is still sent, but the response is discarded and the error is what the caller sees.

<details><summary>Which one's the lie</summary>

**C is the lie.** If a request interceptor throws (or calls `handler.reject(...)`), the request is **never sent** at all — the interceptor chain stops right there, before the network call happens. This matters practically: an auth interceptor that fails to attach a valid token can reject the request outright rather than letting a doomed, token-less call hit the server and fail there instead (wasting a round trip and potentially exposing more than necessary to the server).

🔴 **Explanation:** A is true and genuinely non-obvious the first time you meet it — think of interceptors as nested layers wrapping the actual request, like an onion: request interceptors run outside-in (registration order), and response interceptors unwind inside-out (reverse registration order), the same way a stack of `try/finally` blocks unwinds. B is also true and is precisely how response caching, mock interceptors for testing, and offline-fallback strategies are commonly implemented in Dio — `handler.resolve(fakeResponse)` inside a request interceptor skips the network entirely.

</details>

---

### 👹 Boss Battle — A Repository With Retry, Timeout, and Typed Errors

**The spec:** build a `WeatherRepository` wrapping a Dio-based API call with: (1) automatic retry up to 3 times with exponential backoff (attempt 1: no delay, attempt 2: 500ms, attempt 3: 1000ms) — but **only** for network/timeout errors, never for 4xx client errors (retrying a malformed request is pointless), (2) a hard 5-second total timeout across all retries combined, not per-attempt, (3) a sealed `Result<T>` return type instead of throwing, so callers are compiler-forced to handle both success and failure.

<details><summary>One reasonable solution</summary>

```dart
sealed class Result<T> {}
class Success<T> extends Result<T> {
  Success(this.data);
  final T data;
}
class Failure<T> extends Result<T> {
  Failure(this.message);
  final String message;
}

class WeatherRepository {
  WeatherRepository(this._dio);
  final Dio _dio;

  Future<Result<Map<String, dynamic>>> getWeather(String city) async {
    final stopwatch = Stopwatch()..start();
    const maxAttempts = 3;

    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      if (stopwatch.elapsed > const Duration(seconds: 5)) {
        return Failure('Timed out after ${stopwatch.elapsedMilliseconds}ms');
      }
      try {
        final response = await _dio.get('/weather', queryParameters: {'city': city});
        return Success(response.data as Map<String, dynamic>);
      } on DioException catch (e) {
        final isClientError = e.response != null &&
            e.response!.statusCode! >= 400 &&
            e.response!.statusCode! < 500;
        if (isClientError) {
          return Failure('Request rejected: ${e.response?.statusCode}'); // don't retry
        }
        if (attempt == maxAttempts) {
          return Failure('Failed after $maxAttempts attempts: ${e.message}');
        }
        await Future.delayed(Duration(milliseconds: 500 * (attempt - 1)));
      }
    }
    return Failure('Unreachable'); // satisfies analyzer; loop always returns above
  }
}
```

🔴 **Explanation:** this Boss Battle threads together the sealed-class exhaustiveness lesson from [T3-3](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md#t3-3-medium--sealed-classes-let-the-compiler-catch-missing-cases) (a caller of `getWeather` must handle both `Success` and `Failure` via an exhaustive `switch` — no forgetting the error case), the retry-with-backoff shape from a general reliability pattern, and — the trickiest requirement — distinguishing retry-worthy failures (timeouts, connection errors, 5xx server errors) from retry-pointless ones (4xx client errors, where retrying the exact same malformed request just fails identically three times, wasting the user's 1.5 seconds of backoff for nothing). The overall 5-second budget (checked at the top of each loop iteration via `stopwatch.elapsed`) is what prevents "3 retries with backoff" from silently becoming "this call can take 10+ seconds under bad network conditions" — a real production concern this design forces you to confront explicitly rather than accidentally.

</details>

---

**Next → [Week 15: Project — Weather App](Week_15_Project_WeatherApp.md)**
