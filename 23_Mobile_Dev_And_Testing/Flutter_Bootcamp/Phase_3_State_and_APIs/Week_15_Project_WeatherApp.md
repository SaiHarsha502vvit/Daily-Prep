# Week 15 — Project: Weather App
### Phase 3 Capstone | Real API + Riverpod + Repository Pattern + all error states

---

> Three lenses throughout:
> - 🧑‍💻 **Developer** — clean architecture, async state, error handling, `family` providers
> - 🎨 **Designer** — designing for all states, responsive weather UI, animated transitions
> - 🧪 **Tester** — mocking the API, testing error states, testing state transitions

---

## What You're Building

A weather app connected to the free OpenWeatherMap API. The user searches for any city and sees current conditions plus a 7-day forecast. Every network state is designed: loading skeletons, clear error messages, empty/first-launch state, and the live data view.

**OpenWeatherMap Setup:**
1. Create a free account at openweathermap.org
2. Get your API key from the API keys tab
3. Use the `Current Weather Data` and `One Call API 3.0` endpoints

---

## Why Weather Is the Canonical "First Real API App"

### OpenWeatherMap, Dark Sky, and the $49M Acquisition

Weather data was historically proprietary — national meteorological agencies charged for access. **OpenWeatherMap** (founded 2012, based in London) changed this: they aggregated public data sources and offered a free API tier. This made weather a tractable first-API project for developers who didn't have a budget.

Meanwhile, **Dark Sky** (founded 2012, YCombinator batch) built the most visually polished weather app iOS had ever seen. Hyperlocal minute-by-minute precipitation predictions. Beautiful gradients that changed with weather conditions. By 2015 they had 5 million users. In 2020, Apple acquired Dark Sky for an estimated $49 million and shut down the public API. Everyone migrated to OpenWeatherMap as the free alternative. The app you're building today uses the exact same API that replaced the one Apple killed.

### Why Weather Is the Best Learning Domain

Weather hits every technical pattern at once — in a domain every student can verify against the real world:

```
API Key authentication    → Required to call OpenWeatherMap (no credit card)
Async state management    → Loading / Success / Error → three distinct UI states
JSON parsing              → Nested objects (current + hourly + daily), array of forecast days
Multiple screens          → Search → Results → Detail, all navigable
Real user feedback        → "Is my app showing the right temperature right now?" Yes? Ship it.
Geographic reality        → Search "Mumbai" → temperature is 32°C → you can feel it
```

A todo app returns data you invented. A weather app returns data the real world validates. When your API call works and shows the right forecast for your city, the accomplishment is real in a way that a static mock cannot match.

### How Location Actually Works (The Invisible Machinery)

When you call `geolocator.getCurrentPosition()`, here is what happens before your `Lat/Lng` appears in Dart:

```
Device checks available location sources:
  → GPS chip: uses satellite signals (requires clear sky, 30–60s cold start)
  → Wi-Fi positioning: compares visible WiFi networks against a global DB (Google/Apple collected via Street View cars, maps to lat/lng within 10-30m)
  → Cell tower triangulation: compares signal strength from nearby towers (50–300m accuracy)
  → IP geolocation: last resort, city-level only
     
Android LocationManager / iOS CLLocationManager negotiates:
  → combines available sources, weights by accuracy and freshness
  → returns best estimate as CLLocation/Location object
     
Flutter geolocator plugin calls platform channel
  → converts to Dart Position{latitude, longitude, accuracy}
```

This is why `locationPermission` is not just a polite request — the OS is granting your app access to data from the GPS chip, the Wi-Fi card's scan results, and cell tower signal measurements. On iOS, this request can only be made once per app install in the "request" form — if the user denies, they must manually go to Settings to re-enable. This is why every serious app uses a **soft-ask screen** (your own explanation UI) before the OS permission dialog, so the user understands why location is needed before they see the system prompt they can only answer once.

---

## App Architecture

```
lib/
├── core/
│   ├── network/
│   │   ├── dio_client.dart
│   │   └── app_exception.dart
│   └── constants/
│       └── api_keys.dart         ← store your key here (add to .gitignore)
│
├── features/
│   └── weather/
│       ├── data/
│       │   ├── weather_api_client.dart
│       │   ├── weather_repository.dart
│       │   └── dto/
│       │       ├── current_weather_dto.dart   ← raw API model
│       │       └── forecast_dto.dart
│       │
│       ├── domain/
│       │   ├── weather.dart          ← clean domain model (no API specifics)
│       │   └── forecast_day.dart
│       │
│       └── presentation/
│           ├── providers/
│           │   └── weather_providers.dart
│           └── screens/
│               ├── weather_screen.dart
│               └── search_screen.dart
```

---

## Domain Models (Clean, API-Agnostic)

```dart
// lib/features/weather/domain/weather.dart

enum WeatherCondition {
  clear, cloudy, partlyCloudy, rainy, stormy, snowy, foggy, windy;

  static WeatherCondition fromCode(int code) {
    return switch (code) {
      800 => WeatherCondition.clear,
      801 || 802 => WeatherCondition.partlyCloudy,
      803 || 804 => WeatherCondition.cloudy,
      >= 300 && <= 321 => WeatherCondition.rainy,
      >= 500 && <= 531 => WeatherCondition.rainy,
      >= 600 && <= 622 => WeatherCondition.snowy,
      >= 700 && <= 781 => WeatherCondition.foggy,
      >= 200 && <= 232 => WeatherCondition.stormy,
      _ => WeatherCondition.clear,
    };
  }

  String get icon {
    return switch (this) {
      WeatherCondition.clear => '☀️',
      WeatherCondition.cloudy => '☁️',
      WeatherCondition.partlyCloudy => '⛅',
      WeatherCondition.rainy => '🌧️',
      WeatherCondition.stormy => '⛈️',
      WeatherCondition.snowy => '❄️',
      WeatherCondition.foggy => '🌫️',
      WeatherCondition.windy => '💨',
    };
  }
}

class Weather {
  final String city;
  final String country;
  final double temperatureCelsius;
  final double feelsLikeCelsius;
  final WeatherCondition condition;
  final String description;
  final int humidity;
  final double windSpeedMs;
  final int uvIndex;
  final double visibilityKm;
  final DateTime sunrise;
  final DateTime sunset;
  final DateTime fetchedAt;

  const Weather({
    required this.city,
    required this.country,
    required this.temperatureCelsius,
    required this.feelsLikeCelsius,
    required this.condition,
    required this.description,
    required this.humidity,
    required this.windSpeedMs,
    required this.uvIndex,
    required this.visibilityKm,
    required this.sunrise,
    required this.sunset,
    required this.fetchedAt,
  });

  String get temp => '${temperatureCelsius.round()}°';
  String get feelsLike => '${feelsLikeCelsius.round()}°';
  String get windSpeed => '${(windSpeedMs * 3.6).round()} km/h';
  bool get isDaytime {
    final now = DateTime.now();
    return now.isAfter(sunrise) && now.isBefore(sunset);
  }
}

class ForecastDay {
  final DateTime date;
  final double maxTempCelsius;
  final double minTempCelsius;
  final WeatherCondition condition;
  final int precipitationChance;

  const ForecastDay({
    required this.date,
    required this.maxTempCelsius,
    required this.minTempCelsius,
    required this.condition,
    required this.precipitationChance,
  });

  String get dayName {
    final now = DateTime.now();
    if (date.day == now.day) return 'Today';
    if (date.day == now.day + 1) return 'Tomorrow';
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.weekday - 1];
  }
}
```

---

## API Layer

```dart
// lib/features/weather/data/weather_api_client.dart

class WeatherApiClient {
  static const _baseUrl = 'https://api.openweathermap.org';
  final Dio _dio;
  final String _apiKey;

  WeatherApiClient(this._apiKey)
      : _dio = Dio(BaseOptions(
          baseUrl: _baseUrl,
          queryParameters: {'appid': _apiKey, 'units': 'metric'},
          connectTimeout: const Duration(seconds: 8),
          receiveTimeout: const Duration(seconds: 8),
        ));

  Future<Map<String, dynamic>> getCurrentWeather(String city) async {
    try {
      final response = await _dio.get('/data/2.5/weather', queryParameters: {'q': city});
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Map<String, dynamic>> getForecast(double lat, double lon) async {
    try {
      final response = await _dio.get(
        '/data/2.5/forecast',
        queryParameters: {'lat': lat, 'lon': lon, 'cnt': 40},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  AppException _mapError(DioException e) {
    if (e.response?.statusCode == 404) {
      return const NotFoundException('City');
    }
    if (e.response?.statusCode == 401) {
      return const ServerException(401, 'Invalid API key');
    }
    if (e.type == DioExceptionType.connectionError) {
      return const NetworkException();
    }
    return ServerException(e.response?.statusCode ?? 0, 'Unexpected error');
  }
}
```

```dart
// lib/features/weather/data/weather_repository.dart

class WeatherRepository {
  final WeatherApiClient _api;

  const WeatherRepository(this._api);

  Future<Weather> getWeather(String city) async {
    final raw = await _api.getCurrentWeather(city);
    return _parseWeather(raw);
  }

  Future<List<ForecastDay>> getForecast(String city) async {
    final weatherRaw = await _api.getCurrentWeather(city);
    final lat = weatherRaw['coord']['lat'] as double;
    final lon = weatherRaw['coord']['lon'] as double;

    final forecastRaw = await _api.getForecast(lat, lon);
    return _parseForecast(forecastRaw);
  }

  Weather _parseWeather(Map<String, dynamic> json) {
    final main = json['main'] as Map<String, dynamic>;
    final wind = json['wind'] as Map<String, dynamic>;
    final sys = json['sys'] as Map<String, dynamic>;
    final weatherList = json['weather'] as List;
    final weatherInfo = weatherList.first as Map<String, dynamic>;
    final conditionCode = weatherInfo['id'] as int;

    return Weather(
      city: json['name'] as String,
      country: sys['country'] as String,
      temperatureCelsius: (main['temp'] as num).toDouble(),
      feelsLikeCelsius: (main['feels_like'] as num).toDouble(),
      condition: WeatherCondition.fromCode(conditionCode),
      description: (weatherInfo['description'] as String).replaceFirstMapped(
        RegExp(r'^.'), (m) => m.group(0)!.toUpperCase(),
      ),
      humidity: main['humidity'] as int,
      windSpeedMs: (wind['speed'] as num).toDouble(),
      uvIndex: 0,    // requires One Call API
      visibilityKm: ((json['visibility'] as num? ?? 10000) / 1000).toDouble(),
      sunrise: DateTime.fromMillisecondsSinceEpoch((sys['sunrise'] as int) * 1000),
      sunset: DateTime.fromMillisecondsSinceEpoch((sys['sunset'] as int) * 1000),
      fetchedAt: DateTime.now(),
    );
  }

  List<ForecastDay> _parseForecast(Map<String, dynamic> json) {
    final List<dynamic> list = json['list'];

    // Group forecasts by day and take one entry per day (noon)
    final Map<String, List<dynamic>> byDay = {};
    for (final item in list) {
      final date = DateTime.fromMillisecondsSinceEpoch((item['dt'] as int) * 1000);
      final key = '${date.year}-${date.month}-${date.day}';
      byDay.putIfAbsent(key, () => []).add(item);
    }

    return byDay.entries.take(7).map((entry) {
      final dayItems = entry.value;
      final temps = dayItems.map((i) => (i['main']['temp'] as num).toDouble()).toList();
      final noonItem = dayItems.firstWhere(
        (i) {
          final hour = DateTime.fromMillisecondsSinceEpoch((i['dt'] as int) * 1000).hour;
          return hour >= 11 && hour <= 14;
        },
        orElse: () => dayItems.first,
      );
      final condCode = (noonItem['weather'] as List).first['id'] as int;
      final precipChance = ((noonItem['pop'] as num? ?? 0) * 100).round();

      return ForecastDay(
        date: DateTime.fromMillisecondsSinceEpoch((noonItem['dt'] as int) * 1000),
        maxTempCelsius: temps.reduce((a, b) => a > b ? a : b),
        minTempCelsius: temps.reduce((a, b) => a < b ? a : b),
        condition: WeatherCondition.fromCode(condCode),
        precipitationChance: precipChance,
      );
    }).toList();
  }
}
```

---

## Riverpod Providers

```dart
// lib/features/weather/presentation/providers/weather_providers.dart

// Current city being searched — persisted to shared_preferences (optional extension)
final selectedCityProvider = StateProvider<String?>((ref) => null);

// Weather data — reloads whenever the selected city changes
final weatherProvider = FutureProvider.autoDispose.family<Weather, String>((ref, city) async {
  // Keep the data alive for 10 minutes to avoid refetch on tab switch
  ref.keepAlive();

  final repo = ref.watch(weatherRepositoryProvider);
  return repo.getWeather(city);
});

// Forecast — reloads with city
final forecastProvider = FutureProvider.autoDispose.family<List<ForecastDay>, String>((ref, city) async {
  final repo = ref.watch(weatherRepositoryProvider);
  return repo.getForecast(city);
});

// Search history — recent searches
class SearchHistoryNotifier extends Notifier<List<String>> {
  @override
  List<String> build() => [];

  void addSearch(String city) {
    if (state.contains(city)) {
      state = [city, ...state.where((c) => c != city)];
    } else {
      state = [city, ...state.take(9)];  // keep last 10
    }
  }

  void remove(String city) {
    state = state.where((c) => c != city).toList();
  }
}

final searchHistoryProvider = NotifierProvider<SearchHistoryNotifier, List<String>>(
  SearchHistoryNotifier.new,
);

// Repository provider
final weatherRepositoryProvider = Provider<WeatherRepository>((ref) {
  return WeatherRepository(WeatherApiClient(ApiKeys.openWeather));
});
```

---

## Main Weather Screen

```dart
// lib/features/weather/presentation/screens/weather_screen.dart

class WeatherScreen extends ConsumerWidget {
  const WeatherScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final city = ref.watch(selectedCityProvider);

    if (city == null) {
      return const _FirstLaunchState();
    }

    return _WeatherContent(city: city);
  }
}

class _FirstLaunchState extends StatelessWidget {
  const _FirstLaunchState();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('🌤️', style: TextStyle(fontSize: 80)),
                const SizedBox(height: 24),
                Text('Check the Weather',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Text(
                  'Search for any city to see current conditions and forecast',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 32),
                FilledButton.icon(
                  icon: const Icon(Icons.search),
                  label: const Text('Search a city'),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SearchScreen()),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _WeatherContent extends ConsumerWidget {
  final String city;
  const _WeatherContent({required this.city});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weatherAsync = ref.watch(weatherProvider(city));
    final forecastAsync = ref.watch(forecastProvider(city));

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.refresh(weatherProvider(city));
          ref.refresh(forecastProvider(city));
        },
        child: weatherAsync.when(
          loading: () => const _WeatherSkeleton(),
          error: (error, _) => _WeatherError(
            message: error is AppException ? error.message : 'Could not load weather',
            city: city,
            onRetry: () => ref.refresh(weatherProvider(city)),
          ),
          data: (weather) => _WeatherData(
            weather: weather,
            forecastAsync: forecastAsync,
          ),
        ),
      ),
    );
  }
}

class _WeatherData extends StatelessWidget {
  final Weather weather;
  final AsyncValue<List<ForecastDay>> forecastAsync;
  const _WeatherData({required this.weather, required this.forecastAsync});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Background gradient changes based on condition and day/night
    final bgGradient = _backgroundGradient(weather);

    return Container(
      decoration: BoxDecoration(gradient: bgGradient),
      child: CustomScrollView(
        slivers: [
          // Header with city name and current temp
          SliverToBoxAdapter(
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Top row: back/settings
                    Row(
                      children: [
                        Text('${weather.city}, ${weather.country}',
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            )),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.search, color: Colors.white),
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const SearchScreen()),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 32),

                    // Big temperature
                    Text(
                      weather.condition.icon,
                      style: const TextStyle(fontSize: 80),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      weather.temp,
                      style: const TextStyle(
                        fontSize: 80,
                        fontWeight: FontWeight.w200,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      weather.description,
                      style: theme.textTheme.titleMedium?.copyWith(color: Colors.white70),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Feels like ${weather.feelsLike}',
                      style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white60),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Conditions strip
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _ConditionTile(icon: '💧', label: 'Humidity', value: '${weather.humidity}%'),
                    _ConditionTile(icon: '💨', label: 'Wind', value: weather.windSpeed),
                    _ConditionTile(icon: '👁️', label: 'Visibility', value: '${weather.visibilityKm.round()} km'),
                  ],
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Forecast section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text('7-Day Forecast',
                  style: theme.textTheme.titleMedium?.copyWith(color: Colors.white)),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 12)),
          SliverToBoxAdapter(
            child: forecastAsync.when(
              loading: () => const _ForecastSkeleton(),
              error: (_, __) => const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: Text('Could not load forecast', style: TextStyle(color: Colors.white60)),
              ),
              data: (forecast) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: forecast.map((day) => _ForecastRow(day: day)).toList(),
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  LinearGradient _backgroundGradient(Weather weather) {
    final isDaytime = weather.isDaytime;
    return switch (weather.condition) {
      WeatherCondition.clear => isDaytime
          ? const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
              colors: [Color(0xFF1E88E5), Color(0xFF64B5F6)])
          : const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
              colors: [Color(0xFF1A237E), Color(0xFF283593)]),
      WeatherCondition.rainy || WeatherCondition.stormy =>
          const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
              colors: [Color(0xFF37474F), Color(0xFF546E7A)]),
      WeatherCondition.snowy =>
          const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
              colors: [Color(0xFFB0BEC5), Color(0xFFCFD8DC)]),
      _ => const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [Color(0xFF546E7A), Color(0xFF78909C)]),
    };
  }
}
```

---

## Search Screen

```dart
// lib/features/weather/presentation/screens/search_screen.dart

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    // Auto-focus the search field when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _selectCity(String city) {
    ref.read(selectedCityProvider.notifier).state = city;
    ref.read(searchHistoryProvider.notifier).addSearch(city);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final history = ref.watch(searchHistoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          focusNode: _focusNode,
          decoration: const InputDecoration(
            hintText: 'Search city...',
            border: InputBorder.none,
            hintStyle: TextStyle(color: Colors.grey),
          ),
          textInputAction: TextInputAction.search,
          onSubmitted: (city) {
            if (city.trim().isNotEmpty) _selectCity(city.trim());
          },
        ),
        actions: [
          ValueListenableBuilder<TextEditingValue>(
            valueListenable: _controller,
            builder: (_, val, __) => val.text.isNotEmpty
                ? IconButton(icon: const Icon(Icons.clear), onPressed: _controller.clear)
                : const SizedBox.shrink(),
          ),
        ],
      ),
      body: history.isEmpty
          ? const Center(
              child: Text('Search for a city to see its weather',
                  style: TextStyle(color: Colors.grey)),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Text('Recent', style: Theme.of(context).textTheme.labelLarge),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: history.length,
                    itemBuilder: (context, index) {
                      final city = history[index];
                      return ListTile(
                        leading: const Icon(Icons.history),
                        title: Text(city),
                        trailing: IconButton(
                          icon: const Icon(Icons.close, size: 18),
                          onPressed: () => ref.read(searchHistoryProvider.notifier).remove(city),
                        ),
                        onTap: () => _selectCity(city),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}
```

---

## Phase 3 Concepts Exercised

| Concept | Where |
|---------|-------|
| Repository pattern | `WeatherRepository` — all API calls isolated here |
| Dio + error mapping | `WeatherApiClient` → `AppException` |
| `FutureProvider.family` | `weatherProvider(city)`, `forecastProvider(city)` |
| `StateProvider` | `selectedCityProvider` — simple nullable string |
| `NotifierProvider` | `SearchHistoryNotifier` — list with add/remove |
| `AsyncValue.when()` | Loading skeleton / error / data on both providers |
| `ref.refresh()` | Pull-to-refresh on `RefreshIndicator` |
| `keepAlive()` | Weather data survives tab switches |
| Domain models | `Weather`, `ForecastDay` — clean, no API coupling |
| Error types | `NotFoundException`, `NetworkException`, `ServerException` |
| `ConsumerStatefulWidget` | `SearchScreen` needs lifecycle (focus management) |

---

## Week 15 Verify — Project Self-Review

1. `weatherProvider` is a `FutureProvider.autoDispose.family<Weather, String>`. Break this down: what does each modifier (autoDispose, family) do?
2. Trace the call when the user searches for "Mumbai": what executes in what order — provider, repository, API client, parsing?
3. When a `NetworkException` is thrown in `WeatherApiClient`, how does it travel up to the widget's `.when(error: ...)` handler?
4. The `ForecastDay.dayName` getter returns "Today", "Tomorrow", or a weekday abbreviation. Where should this logic live — domain model, repository, or widget? Why?
5. Why does `_WeatherContent` use `ref.watch(weatherProvider(city))` but `SearchScreen._selectCity` uses `ref.read(selectedCityProvider.notifier)`?
6. `ref.keepAlive()` is called inside the provider. What problem does it solve for tab navigation?
7. Design review: The app shows a gradient background based on weather condition. A user with color blindness cannot distinguish between "cloudy" and "rainy" by color alone. How would you fix this for accessibility?
8. The weather API returns a 503 (server overload). Your app shows "Something went wrong." How would a `RetryInterceptor` with exponential backoff handle this before the error even reaches the UI? How many retries and what delays?
9. You want to track which cities users search for most. Where would you fire an analytics event — in the widget, the provider, or the repository? Why?

---

**Want to actually get fluent, not just informed?** → [Weather App Challenges](Week_15b_WeatherApp_Challenges.md) — extend, break, and stress-test the actual app you just built.

**Phase 3 Complete.**

**Next → [Phase 4: Firebase & Storage](../Phase_4_Firebase_and_Storage/Phase_4_Overview.md)**
