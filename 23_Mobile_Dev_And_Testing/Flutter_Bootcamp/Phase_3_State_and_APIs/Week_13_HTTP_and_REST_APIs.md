# Week 13 — HTTP & REST APIs
### Calling real servers, parsing JSON, handling errors, and building a clean data layer

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — Dio, interceptors, repository pattern, error handling, caching
> - 🎨 **Designer** — designing for latency: skeleton screens, pull-to-refresh, optimistic updates
> - 🧪 **Tester** — mocking HTTP, testing error states, verifying retry behavior

---

## The Network Data Architecture

> 📄 **Flutter Docs:**
> *"Most non-trivial apps use the network to fetch data. In Dart, use the http package or a higher-level library like Dio. Parse JSON with dart:convert or code generation with json_serializable."*

Before writing a single network call, understand the layers:

```
Widget (shows data)
    ↓ watches
Riverpod Provider (holds AsyncValue<T>)
    ↓ calls
Repository (business logic — what data to get, from where)
    ↓ uses
API Client (Dio — the raw HTTP call + JSON parsing)
    ↓ talks to
REST API (server)
```

Each layer has one job. Widgets don't know about HTTP. Repositories don't know about Dio internals. This separation makes each layer independently testable.

---

## 1. Dio — The HTTP Client

> 📄 **pub.dev/packages/dio:**
> *"Dio is a powerful HTTP networking package for Dart/Flutter, supporting global configuration, interceptors, FormData, request cancellation, file downloading, timeout, and more."*

```yaml
# pubspec.yaml
dependencies:
  dio: ^5.4.0
  retrofit: ^4.0.0  # optional but recommended: generates API code from annotations
```

### Creating the Client

```dart
// lib/core/network/dio_client.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DioClient {
  final Dio _dio;

  DioClient(String baseUrl, {String? authToken})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            if (authToken != null) 'Authorization': 'Bearer $authToken',
          },
        )) {
    _dio.interceptors.addAll([
      _LoggingInterceptor(),
      _ErrorInterceptor(),
    ]);
  }

  Dio get dio => _dio;
}

// Riverpod provider for the Dio client
final dioClientProvider = Provider<DioClient>((ref) {
  // In a real app, get the auth token from an auth provider
  return DioClient('https://api.yourapp.com/v1');
});
```

---

## 2. Interceptors — Cross-Cutting Concerns

> 📄 **Dio Docs:**
> *"Interceptors allow you to intercept requests, responses, and errors before they're handled by then or catchError. This is useful for authentication, logging, and error normalization."*

Interceptors run on every request/response automatically — you write the logic once.

```dart
// Logging interceptor — prints every request and response in debug mode
class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('→ [${options.method}] ${options.path}');
    if (options.data != null) debugPrint('  Body: ${options.data}');
    handler.next(options);    // ← MUST call next() to continue the chain
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('← [${response.statusCode}] ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException error, ErrorInterceptorHandler handler) {
    debugPrint('✗ [${error.response?.statusCode}] ${error.requestOptions.path}: ${error.message}');
    handler.next(error);
  }
}

// Auth interceptor — retries with refreshed token on 401
class _AuthInterceptor extends Interceptor {
  final Ref _ref;
  _AuthInterceptor(this._ref);

  @override
  void onError(DioException error, ErrorInterceptorHandler handler) async {
    if (error.response?.statusCode == 401) {
      // Token expired — try to refresh
      try {
        final newToken = await _ref.read(authProvider.notifier).refreshToken();
        // Retry the original request with the new token
        final retryOptions = error.requestOptions;
        retryOptions.headers['Authorization'] = 'Bearer $newToken';
        final response = await _ref.read(dioClientProvider).dio.fetch(retryOptions);
        return handler.resolve(response);   // resolve with the retried response
      } catch (_) {
        // Refresh failed — log out
        _ref.read(authProvider.notifier).signOut();
        handler.next(error);
      }
    } else {
      handler.next(error);
    }
  }
}
```

---

## 3. The Repository Pattern

Repositories are the bridge between your app and the outside world. They:
- Own all network calls for a domain (products, orders, auth)
- Return typed Dart objects — never raw JSON
- Convert network errors to typed app exceptions
- Can add caching logic without widgets knowing

```dart
// lib/core/network/exceptions.dart

// Sealed class for all possible app exceptions
sealed class AppException implements Exception {
  final String message;
  const AppException(this.message);
}

class NetworkException extends AppException {
  const NetworkException([String message = 'No internet connection']) : super(message);
}

class ServerException extends AppException {
  final int statusCode;
  const ServerException(this.statusCode, String message) : super(message);
}

class UnauthorizedException extends AppException {
  const UnauthorizedException() : super('Please log in to continue');
}

class NotFoundException extends AppException {
  const NotFoundException(String resource) : super('$resource not found');
}

class ValidationException extends AppException {
  final Map<String, List<String>> errors;
  const ValidationException(this.errors) : super('Validation failed');
}
```

```dart
// lib/features/products/data/product_repository.dart

class ProductRepository {
  final DioClient _client;

  const ProductRepository(this._client);

  Future<List<Product>> getProducts({
    ProductCategory? category,
    String? searchQuery,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final response = await _client.dio.get(
        '/products',
        queryParameters: {
          if (category != null) 'category': category.name,
          if (searchQuery != null && searchQuery.isNotEmpty) 'q': searchQuery,
          'page': page,
          'per_page': pageSize,
        },
      );

      final List<dynamic> data = response.data['data'];
      return data.map((json) => Product.fromJson(json as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  Future<Product> getProduct(String id) async {
    try {
      final response = await _client.dio.get('/products/$id');
      return Product.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  Future<void> toggleWishlist(String productId) async {
    try {
      await _client.dio.post('/products/$productId/wishlist');
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  // Converts DioException (network-level) to AppException (app-level)
  AppException _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.connectionTimeout:
        return const NetworkException();
      case DioExceptionType.badResponse:
        return switch (e.response?.statusCode) {
          401 => const UnauthorizedException(),
          404 => const NotFoundException('Product'),
          422 => ValidationException(_parseValidationErrors(e.response!.data)),
          500 || _ => ServerException(e.response?.statusCode ?? 0, e.response?.data['message'] ?? 'Server error'),
        };
      default:
        return const NetworkException('Unexpected error occurred');
    }
  }

  Map<String, List<String>> _parseValidationErrors(dynamic data) {
    final errors = data['errors'] as Map<String, dynamic>? ?? {};
    return errors.map((key, value) => MapEntry(key, List<String>.from(value as List)));
  }
}

// Riverpod provider
final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository(ref.watch(dioClientProvider));
});
```

---

## 4. JSON Serialization

### Manual `fromJson`/`toJson` — For Small Models

```dart
// lib/features/products/domain/product.dart

class Product {
  final String id;
  final String name;
  final String brand;
  final double price;
  final double? originalPrice;
  final String imageUrl;
  final List<String> imageUrls;
  final ProductCategory category;
  final double rating;
  final int reviewCount;

  const Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.price,
    this.originalPrice,
    required this.imageUrl,
    required this.imageUrls,
    required this.category,
    required this.rating,
    required this.reviewCount,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String,
      name: json['name'] as String,
      brand: json['brand'] as String,
      price: (json['price'] as num).toDouble(),
      originalPrice: (json['original_price'] as num?)?.toDouble(),
      imageUrl: json['image_url'] as String,
      imageUrls: List<String>.from(json['image_urls'] as List? ?? [json['image_url']]),
      category: ProductCategory.values.byName(json['category'] as String),
      rating: (json['rating'] as num).toDouble(),
      reviewCount: json['review_count'] as int,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'brand': brand,
    'price': price,
    if (originalPrice != null) 'original_price': originalPrice,
    'image_url': imageUrl,
    'image_urls': imageUrls,
    'category': category.name,
    'rating': rating,
    'review_count': reviewCount,
  };
}
```

### `json_serializable` — For Complex Models (Code Generation)

```yaml
# pubspec.yaml
dependencies:
  json_annotation: ^4.8.0
dev_dependencies:
  json_serializable: ^6.7.0
  build_runner: ^2.4.0
```

```dart
// product.dart
import 'package:json_annotation/json_annotation.dart';
part 'product.g.dart';   // ← generated file

@JsonSerializable()
class Product {
  final String id;
  final String name;
  @JsonKey(name: 'original_price')   // map snake_case JSON to camelCase Dart
  final double? originalPrice;
  @JsonKey(name: 'image_url')
  final String imageUrl;

  const Product({
    required this.id,
    required this.name,
    this.originalPrice,
    required this.imageUrl,
  });

  // Generated by build_runner: dart run build_runner build
  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
  Map<String, dynamic> toJson() => _$ProductToJson(this);
}
```

```bash
# Run code generation
dart run build_runner build --delete-conflicting-outputs
```

🧑‍💻 **Developer:** Use manual `fromJson` for models under 8 fields. Use `json_serializable` for anything with 8+ fields, deeply nested structures, or when you need to maintain strict JSON key mapping. The generated code is type-safe and handles null safety correctly.

---

## 5. Connecting Repository to Riverpod

```dart
// lib/features/products/presentation/providers/products_provider.dart

// The provider state
@freezed  // optional: use freezed for immutable state classes
class ProductsFilter {
  const factory ProductsFilter({
    ProductCategory? category,
    @Default('') String searchQuery,
    @Default(1) int page,
  }) = _ProductsFilter;
}

final productsFilterProvider = StateProvider<ProductsFilter>(
  (ref) => const ProductsFilter(),
);

// The async notifier — fetches from repository, exposes state
class ProductsNotifier extends AsyncNotifier<List<Product>> {
  @override
  Future<List<Product>> build() async {
    // Watch filter — rebuilds automatically when filter changes
    final filter = ref.watch(productsFilterProvider);

    return ref.watch(productRepositoryProvider).getProducts(
      category: filter.category,
      searchQuery: filter.searchQuery,
      page: filter.page,
    );
  }

  Future<void> toggleWishlist(String productId) async {
    try {
      await ref.read(productRepositoryProvider).toggleWishlist(productId);
      // Update local state optimistically
      state = AsyncData(
        state.requireValue.map((p) {
          if (p.id == productId) return p.copyWith(isWishlisted: !p.isWishlisted);
          return p;
        }).toList(),
      );
    } on AppException catch (e) {
      // Show error without changing state
      ref.read(snackbarProvider.notifier).show(e.message, isError: true);
    }
  }
}

final productsProvider = AsyncNotifierProvider<ProductsNotifier, List<Product>>(ProductsNotifier.new);
```

```dart
// The widget — reads the provider, handles all states
class ProductGrid extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(productsProvider.future),
      child: productsAsync.when(
        loading: () => const ProductGridSkeleton(),    // skeleton screens, not spinners
        error: (error, _) => ErrorView(
          message: error is AppException ? error.message : 'Something went wrong',
          onRetry: () => ref.refresh(productsProvider),
        ),
        data: (products) => products.isEmpty
            ? const EmptyProductsView()
            : SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => ProductCard(
                    product: products[i],
                    onWishlistTap: () => ref.read(productsProvider.notifier).toggleWishlist(products[i].id),
                  ),
                  childCount: products.length,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, childAspectRatio: 0.65,
                ),
              ),
      ),
    );
  }
}
```

---

## 6. Skeleton Screens — Professional Loading UI

> 📄 **Flutter Docs:**
> *"Rather than showing a blank screen or a loading spinner, skeleton screens provide a placeholder that mimics the structure of the content being loaded."*

```dart
// A shimmer effect for loading states
class ShimmerBox extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius,
  });

  @override
  State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))
      ..repeat();
    _animation = Tween<double>(begin: -1, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final baseColor = Theme.of(context).colorScheme.surfaceVariant;
    final highlightColor = Theme.of(context).colorScheme.surface;

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, _) => Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            stops: [
              (_animation.value - 1).clamp(0.0, 1.0),
              _animation.value.clamp(0.0, 1.0),
              (_animation.value + 1).clamp(0.0, 1.0),
            ],
            colors: [baseColor, highlightColor, baseColor],
          ),
        ),
      ),
    );
  }
}

// Product card skeleton
class ProductCardSkeleton extends StatelessWidget {
  const ProductCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ShimmerBox(width: double.infinity, height: 180, borderRadius: BorderRadius.circular(12)),
        const SizedBox(height: 8),
        ShimmerBox(width: 120, height: 14),
        const SizedBox(height: 6),
        ShimmerBox(width: 80, height: 14),
      ],
    );
  }
}

class ProductGridSkeleton extends StatelessWidget {
  const ProductGridSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      padding: const EdgeInsets.all(16),
      childAspectRatio: 0.65,
      children: List.generate(6, (_) => const ProductCardSkeleton()),
    );
  }
}
```

🎨 **Designer:** Skeleton screens are always better than spinners for content that has a predictable layout:
- Products list → product card skeletons
- Profile screen → avatar circle + text lines
- Feed → post card skeletons

Use spinners for: actions (button loading, form submit), non-content loading (refresh), small inline loading.

---

## 7. Testing HTTP Layer

```dart
// test/product_repository_test.dart

import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';

// Generate mock with build_runner: @GenerateMocks([Dio])
@GenerateMocks([Dio])
void main() {
  late MockDio mockDio;
  late ProductRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = ProductRepository(DioClient.fromDio(mockDio));
  });

  test('getProducts returns list of products on success', () async {
    // Arrange
    when(mockDio.get('/products', queryParameters: anyNamed('queryParameters')))
        .thenAnswer((_) async => Response(
          requestOptions: RequestOptions(path: '/products'),
          statusCode: 200,
          data: {
            'data': [
              {'id': '1', 'name': 'Nike Air Max', 'brand': 'Nike',
               'price': 8999.0, 'image_url': 'url', 'image_urls': ['url'],
               'category': 'shoes', 'rating': 4.5, 'review_count': 123},
            ],
          },
        ));

    // Act
    final products = await repository.getProducts();

    // Assert
    expect(products, hasLength(1));
    expect(products.first.name, equals('Nike Air Max'));
    expect(products.first.price, equals(8999.0));
  });

  test('getProducts throws NetworkException on connection error', () async {
    when(mockDio.get(any, queryParameters: anyNamed('queryParameters')))
        .thenThrow(DioException(
          requestOptions: RequestOptions(path: '/products'),
          type: DioExceptionType.connectionError,
        ));

    expect(
      () => repository.getProducts(),
      throwsA(isA<NetworkException>()),
    );
  });

  test('getProducts throws UnauthorizedException on 401', () async {
    when(mockDio.get(any, queryParameters: anyNamed('queryParameters')))
        .thenThrow(DioException(
          requestOptions: RequestOptions(path: '/products'),
          response: Response(
            requestOptions: RequestOptions(path: '/products'),
            statusCode: 401,
          ),
          type: DioExceptionType.badResponse,
        ));

    expect(
      () => repository.getProducts(),
      throwsA(isA<UnauthorizedException>()),
    );
  });
}
```

---

## Lab — NewsApp With Real API

Use the [newsapi.org](https://newsapi.org) free tier (100 requests/day) or any mock JSON server.

**Build:**
1. `NewsApiClient` with Dio — base URL, API key in header, logging interceptor
2. `ArticleRepository` — methods: `getHeadlines(category)`, `searchArticles(query)`, `getArticle(url)`
3. `Article` model with `fromJson`
4. `headlinesProvider` (`FutureProvider.autoDispose.family<List<Article>, String>`) — `family` modifier lets you pass a category parameter
5. `HeadlinesScreen` using `ref.watch` + `.when()` skeleton/error/data
6. Pull-to-refresh with `RefreshIndicator` → `ref.refresh(headlinesProvider(category).future)`
7. `SearchScreen` with debounced search query (from Week 12 challenge)

**API response format you'll receive:**
```json
{
  "status": "ok",
  "articles": [
    {
      "title": "...",
      "description": "...",
      "url": "...",
      "urlToImage": "...",
      "publishedAt": "2024-01-15T10:30:00Z",
      "source": { "name": "BBC News" }
    }
  ]
}
```

---

## Challenge — Offline Support With Caching

Extend the NewsApp with a simple cache:

```dart
// Cache layer between Repository and API
class CachedArticleRepository implements ArticleRepository {
  final ArticleRepository _remote;
  final Map<String, _CacheEntry> _cache = {};
  static const _ttl = Duration(minutes: 10);

  CachedArticleRepository(this._remote);

  @override
  Future<List<Article>> getHeadlines(String category) async {
    final cacheKey = 'headlines_$category';
    final entry = _cache[cacheKey];

    if (entry != null && DateTime.now().difference(entry.fetchedAt) < _ttl) {
      return entry.data as List<Article>;
    }

    try {
      final fresh = await _remote.getHeadlines(category);
      _cache[cacheKey] = _CacheEntry(fresh, DateTime.now());
      return fresh;
    } catch (e) {
      // If network fails and we have stale cache, return stale data
      if (entry != null) return entry.data as List<Article>;
      rethrow;
    }
  }
}

class _CacheEntry {
  final dynamic data;
  final DateTime fetchedAt;
  _CacheEntry(this.data, this.fetchedAt);
}
```

---

## 8. Multipart File Upload — Images and Files to Server

```dart
// Uploading an image (e.g., profile picture) to a REST API
// Uses Dio's FormData with MultipartFile

class UserRepository {
  final Dio _dio;
  const UserRepository(this._dio);

  Future<String> uploadProfileImage({
    required String userId,
    required File imageFile,
    void Function(double progress)? onProgress,
  }) async {
    final fileExtension = imageFile.path.split('.').last.toLowerCase();
    final mimeType = _mimeTypeForExtension(fileExtension);

    final formData = FormData.fromMap({
      'userId': userId,
      'file': await MultipartFile.fromFile(
        imageFile.path,
        filename: 'profile_$userId.$fileExtension',
        contentType: DioMediaType.parse(mimeType),
      ),
    });

    final response = await _dio.post(
      '/users/$userId/avatar',
      data: formData,
      onSendProgress: (sent, total) {
        if (total != -1) {
          onProgress?.call(sent / total);
        }
      },
    );

    return response.data['url'] as String;
  }

  String _mimeTypeForExtension(String ext) => switch (ext) {
    'jpg' || 'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    'pdf' => 'application/pdf',
    _ => 'application/octet-stream',
  };
}

// Pick and upload image in a Widget
class _AvatarPickerState extends State<AvatarPicker> {
  double _uploadProgress = 0;
  bool _isUploading = false;

  Future<void> _pickAndUpload() async {
    // Use image_picker package
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,       // compress on client side before upload
      maxHeight: 1024,
      imageQuality: 85,     // 0-100, reduces file size ~60%
    );
    if (picked == null || !mounted) return;

    setState(() { _isUploading = true; _uploadProgress = 0; });

    try {
      final url = await sl<UserRepository>().uploadProfileImage(
        userId: currentUserId,
        imageFile: File(picked.path),
        onProgress: (p) => setState(() => _uploadProgress = p),
      );
      if (!mounted) return;
      widget.onUploaded(url);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
    } finally {
      if (mounted) setState(() { _isUploading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _isUploading ? null : _pickAndUpload,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircleAvatar(radius: 48, backgroundImage: NetworkImage(widget.currentUrl)),
          if (_isUploading)
            CircularProgressIndicator(value: _uploadProgress, strokeWidth: 3),
          if (!_isUploading)
            const Positioned(
              bottom: 0, right: 0,
              child: CircleAvatar(
                radius: 14,
                backgroundColor: Colors.white,
                child: Icon(Icons.edit, size: 16),
              ),
            ),
        ],
      ),
    );
  }
}
```

---

## 9. HTTP Caching — Avoid Redundant API Calls

```dart
// Simple in-memory cache in the repository
class ProductRepository {
  final Map<String, _CacheEntry<List<Product>>> _cache = {};
  static const _cacheDuration = Duration(minutes: 5);

  Future<List<Product>> getProducts({String? category}) async {
    final cacheKey = 'products_${category ?? 'all'}';
    final cached = _cache[cacheKey];

    // Return from cache if still fresh
    if (cached != null && !cached.isExpired) {
      return cached.data;
    }

    // Fetch from API
    final response = await _dio.get('/products', queryParameters: {'category': category});
    final products = (response.data as List)
        .map((j) => ProductModel.fromJson(j as Map<String, dynamic>))
        .toList();

    // Store in cache
    _cache[cacheKey] = _CacheEntry(products, DateTime.now());
    return products;
  }

  void invalidateCache() => _cache.clear();  // call after creating/updating products
}

class _CacheEntry<T> {
  final T data;
  final DateTime fetchedAt;
  _CacheEntry(this.data, this.fetchedAt);
  bool get isExpired => DateTime.now().difference(fetchedAt) > ProductRepository._cacheDuration;
}
```

---

## Week 13 Verify

1. What is the repository pattern? What is the repository's responsibility vs the API client's?
2. A Dio interceptor's `onError` method receives a `DioException`. What does `handler.next(error)` do? What does `handler.resolve(response)` do?
3. You call `await dio.get('/products')` and get a 404 response. What `DioExceptionType` is thrown?
4. Why do you map `DioException` to `AppException` in the repository? Why not just let widgets catch `DioException`?
5. `json_serializable` generates `fromJson` and `toJson`. What command do you run and what file is generated?
6. What is a skeleton screen? When should you use a skeleton instead of a `CircularProgressIndicator`?
7. In `FutureProvider.autoDispose.family<List<Article>, String>`, what does `family` do? Write the provider declaration.

---

**Next → [Week 14: Project — Weather App](Week_14_Project_WeatherApp.md)**
