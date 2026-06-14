# Week 13 — HTTP & REST APIs
### Calling real servers, parsing JSON, handling errors like a professional

---

## 1. Add Dio

The built-in `http` package is fine for simple requests. `Dio` is what you use in production — it has interceptors, request cancellation, timeout handling, FormData support, and readable error types.

```bash
flutter pub add dio
```

---

## 2. Your First API Call

```dart
import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();

  try {
    final response = await dio.get('https://jsonplaceholder.typicode.com/posts/1');
    print(response.data);         // already decoded — it's a Map, not a String
    print(response.statusCode);   // 200
  } on DioException catch (e) {
    print('Error: ${e.message}');
  }
}
```

`Dio` automatically decodes JSON responses into Dart `Map` / `List`. No `jsonDecode()` needed.

---

## 3. JSON Parsing — The Right Way

Every API response becomes a Dart model class. This is non-negotiable in professional code.

```dart
// API returns:
// {
//   "id": 1,
//   "title": "Flutter Tips",
//   "body": "Use const wherever possible...",
//   "userId": 5
// }

class Post {
  final int id;
  final String title;
  final String body;
  final int userId;

  const Post({
    required this.id,
    required this.title,
    required this.body,
    required this.userId,
  });

  // Parse from JSON map
  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] as int,
      title: json['title'] as String,
      body: json['body'] as String,
      userId: json['userId'] as int,
    );
  }

  // Convert back to JSON (for POST/PUT requests)
  Map<String, dynamic> toJson() => {
    'title': title,
    'body': body,
    'userId': userId,
  };
}

// Parsing a single object
final post = Post.fromJson(response.data as Map<String, dynamic>);

// Parsing a list
// API returns: [ {...}, {...}, {...} ]
final posts = (response.data as List)
    .map((json) => Post.fromJson(json as Map<String, dynamic>))
    .toList();
```

**Nested objects:**
```dart
// API returns:
// {
//   "id": 1,
//   "name": "Harsha",
//   "address": {
//     "city": "Hyderabad",
//     "zipcode": "500001"
//   },
//   "company": { "name": "TechCorp" }
// }

class Address {
  final String city;
  final String zipcode;
  const Address({required this.city, required this.zipcode});

  factory Address.fromJson(Map<String, dynamic> json) => Address(
    city: json['city'] as String,
    zipcode: json['zipcode'] as String,
  );
}

class User {
  final int id;
  final String name;
  final Address address;

  const User({required this.id, required this.name, required this.address});

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] as int,
    name: json['name'] as String,
    address: Address.fromJson(json['address'] as Map<String, dynamic>),
  );
}
```

**→ Try this:** Call `https://jsonplaceholder.typicode.com/users` — it returns a list of 10 users with nested `address` and `company`. Parse it into a `List<User>` with proper model classes. Display the users in a `ListView` showing name, email, and city.

---

## 4. Repository Pattern — Isolate Your API Calls

Never call Dio directly from a widget or provider. Put all network calls in a Repository class. This makes testing easy (swap the real repo for a fake one) and keeps concerns separated.

```dart
class PostRepository {
  final Dio _dio;

  PostRepository({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: 'https://jsonplaceholder.typicode.com',
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 10),
              headers: {'Content-Type': 'application/json'},
            ));

  Future<List<Post>> getPosts() async {
    final response = await _dio.get('/posts');
    return (response.data as List)
        .map((json) => Post.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<Post> getPost(int id) async {
    final response = await _dio.get('/posts/$id');
    return Post.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Post> createPost(String title, String body) async {
    final response = await _dio.post('/posts', data: {
      'title': title,
      'body': body,
      'userId': 1,
    });
    return Post.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deletePost(int id) async {
    await _dio.delete('/posts/$id');
  }
}
```

---

## 5. Error Handling — Every Possible Failure

Network calls can fail in many ways. Handle them all:

```dart
sealed class AppException implements Exception {
  const AppException();
}

class NetworkException extends AppException {
  final String message;
  const NetworkException(this.message);
}

class ServerException extends AppException {
  final int statusCode;
  final String message;
  const ServerException({required this.statusCode, required this.message});
}

class NotFoundException extends AppException {
  const NotFoundException();
}

class NoInternetException extends AppException {
  const NoInternetException();
}

class ParseException extends AppException {
  final String message;
  const ParseException(this.message);
}
```

```dart
// In your repository — catch and convert all errors to AppException
Future<List<Post>> getPosts() async {
  try {
    final response = await _dio.get('/posts');
    return (response.data as List)
        .map((json) => Post.fromJson(json as Map<String, dynamic>))
        .toList();
  } on DioException catch (e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        throw const NetworkException('Request timed out. Check your connection.');
      case DioExceptionType.connectionError:
        throw const NoInternetException();
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode ?? 0;
        if (statusCode == 404) throw const NotFoundException();
        throw ServerException(
          statusCode: statusCode,
          message: e.response?.data?['message'] as String? ?? 'Server error',
        );
      default:
        throw NetworkException(e.message ?? 'Unknown network error');
    }
  } on TypeError catch (e) {
    throw ParseException('Failed to parse response: $e');
  }
}
```

---

## 6. Dio Interceptors — Run Code on Every Request/Response

Interceptors are middleware for your HTTP client. Use them for auth headers, logging, and token refresh.

```dart
class AuthInterceptor extends Interceptor {
  final TokenStorage _tokenStorage;
  AuthInterceptor(this._tokenStorage);

  // Runs before every request — add auth header
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _tokenStorage.accessToken;
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);  // continue the request
  }

  // Runs on every response
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    handler.next(response); // continue
  }

  // Runs on error — handle 401 Unauthorized (refresh token)
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      try {
        await _tokenStorage.refreshToken();
        // Retry the original request with new token
        final retryResponse = await _retry(err.requestOptions);
        handler.resolve(retryResponse);
        return;
      } catch (_) {
        // Refresh failed — log the user out
        _tokenStorage.clear();
      }
    }
    handler.next(err); // pass error through
  }

  Future<Response> _retry(RequestOptions options) async {
    final dio = Dio();
    dio.options.headers['Authorization'] = 'Bearer ${_tokenStorage.accessToken}';
    return dio.request(
      options.path,
      data: options.data,
      queryParameters: options.queryParameters,
      options: Options(method: options.method),
    );
  }
}

// Attach to Dio instance:
final dio = Dio();
dio.interceptors.add(AuthInterceptor(tokenStorage));
dio.interceptors.add(LogInterceptor(responseBody: true)); // built-in logger
```

---

## 7. Riverpod + Repository + API — The Full Stack

```dart
// 1. Repository provider (singleton)
final postRepositoryProvider = Provider<PostRepository>((ref) {
  return PostRepository();
});

// 2. Posts list provider
final postsProvider = FutureProvider<List<Post>>((ref) async {
  return ref.watch(postRepositoryProvider).getPosts();
});

// 3. Single post provider (with family)
final postDetailProvider = FutureProvider.family<Post, int>((ref, id) async {
  return ref.watch(postRepositoryProvider).getPost(id);
});

// 4. In widget
class PostsScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postsAsync = ref.watch(postsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Posts')),
      body: postsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(_errorMessage(error)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(postsProvider),  // retry
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (posts) => ListView.builder(
          itemCount: posts.length,
          itemBuilder: (_, i) => PostTile(post: posts[i]),
        ),
      ),
    );
  }

  String _errorMessage(Object error) => switch (error) {
    NoInternetException() => 'No internet connection',
    NetworkException(message: final msg) => msg,
    ServerException(statusCode: final code) => 'Server error ($code)',
    _ => 'Something went wrong',
  };
}
```

**`ref.refresh(provider)`** — invalidates and re-fetches the provider. Use for pull-to-refresh and retry buttons.

---

## 8. Query Parameters, Headers, FormData

```dart
// Query parameters (?page=1&limit=20)
final response = await _dio.get('/products', queryParameters: {
  'page': page,
  'limit': 20,
  'category': 'electronics',
  'sort': 'price_asc',
});

// Custom headers per request
final response = await _dio.get('/profile',
  options: Options(headers: {'X-Custom-Header': 'value'}),
);

// POST with JSON body
final response = await _dio.post('/register', data: {
  'name': name,
  'email': email,
  'password': password,
});

// POST with FormData (for file uploads)
final formData = FormData.fromMap({
  'name': 'profile_photo',
  'file': await MultipartFile.fromFile(
    filePath,
    filename: 'photo.jpg',
    contentType: MediaType('image', 'jpeg'),
  ),
});
final response = await _dio.post('/upload', data: formData);

// Track upload progress
final response = await _dio.post('/upload',
  data: formData,
  onSendProgress: (sent, total) {
    setState(() => _uploadProgress = sent / total);
  },
);
```

---

## Lab — GitHub User Explorer

Build a 3-screen app using the GitHub public API (no auth needed):

**Screen 1: Search Users**
- TextField to search GitHub usernames
- Calls `https://api.github.com/search/users?q={query}` when user submits
- Shows results in a list: avatar, username, profile URL
- Shows loading state while searching
- Shows error state if API fails (with retry button)
- Shows empty state if no results

**Screen 2: User Profile**
- Reached by tapping a user
- Calls `https://api.github.com/users/{username}`
- Shows: avatar (large), name, bio, location, followers, following, public repos
- A "View Repos" button pushes Screen 3

**Screen 3: User Repositories**
- Calls `https://api.github.com/users/{username}/repos?sort=updated`
- Lists repos: name, description, language (colored dot), stars, forks
- Sorted by most recently updated

**Architecture:**
```
GitHubRepository (Dio calls)
    ↓ used by
GitHubProvider (Riverpod FutureProvider.family)
    ↓ used by
Screens (ConsumerWidget)
```

---

## Challenge

Add **pagination** to the repositories list:
- Load 10 repos per page (`?per_page=10&page=1`)
- When user scrolls to bottom, load the next page and append
- Show a "Load more" spinner at the bottom
- Show "No more repos" when all pages are loaded

Also add **caching**: if the user goes back to Screen 1 and searches again for the same username they already viewed, use the cached data instead of hitting the API again. Use `ref.keepAlive()` to prevent the provider from being disposed:

```dart
final userProfileProvider = FutureProvider.family<GitHubUser, String>((ref, username) async {
  ref.keepAlive();  // this provider won't be disposed when not watched
  return ref.watch(gitHubRepositoryProvider).getUser(username);
});
```

---

## Before Week 14 — Verify

1. Why use `Dio` over the built-in `http` package?
2. What does a `factory Post.fromJson(Map<String, dynamic> json)` constructor do?
3. What is a Repository and why do you separate it from providers?
4. What does `ref.refresh(provider)` do?
5. What is an Interceptor and what are 3 things you'd use one for?

---

**Next → [Week 14: Project — Weather App](Week_14_Project_WeatherApp.md)**
