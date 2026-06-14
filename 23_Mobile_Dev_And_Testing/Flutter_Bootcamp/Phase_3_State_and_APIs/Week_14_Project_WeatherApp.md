# Week 14 — Project: Weather App
### Phase 3 Capstone | Real API, real state management, real error handling

---

## What You're Building

A weather app that uses live data from OpenWeatherMap. The user searches for any city and sees current conditions plus a 5-day forecast. The app handles every state: loading, error, empty, and data.

This project ties together everything from Phase 3: Riverpod, HTTP with Dio, error handling, JSON parsing, and clean architecture.

---

## API Setup (Free — No Credit Card)

1. Go to `openweathermap.org` → Sign up (free)
2. Go to API Keys section → copy your key
3. The free tier allows 60 calls/minute — more than enough

**APIs you'll use:**

```
Current Weather:
GET https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units=metric

5-Day Forecast (every 3 hours):
GET https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={key}&units=metric

Weather by GPS coordinates:
GET https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric
```

**Storing your API key safely:**
Never hardcode API keys in source code. Use dart-define:

```bash
# Run with:
flutter run --dart-define=WEATHER_API_KEY=your_key_here

# In code:
const apiKey = String.fromEnvironment('WEATHER_API_KEY');
```

---

## Data Models

Parse the API response into these models:

```dart
class CurrentWeather {
  final String city;
  final String country;
  final double temperature;
  final double feelsLike;
  final double tempMin;
  final double tempMax;
  final int humidity;
  final double windSpeed;
  final int visibility;       // in metres
  final String condition;     // "clear sky", "light rain", etc.
  final String iconCode;      // "01d", "04n", etc.
  final DateTime sunrise;
  final DateTime sunset;
  final DateTime lastUpdated;

  const CurrentWeather({...});

  factory CurrentWeather.fromJson(Map<String, dynamic> json) {
    return CurrentWeather(
      city: json['name'] as String,
      country: json['sys']['country'] as String,
      temperature: (json['main']['temp'] as num).toDouble(),
      feelsLike: (json['main']['feels_like'] as num).toDouble(),
      tempMin: (json['main']['temp_min'] as num).toDouble(),
      tempMax: (json['main']['temp_max'] as num).toDouble(),
      humidity: json['main']['humidity'] as int,
      windSpeed: (json['wind']['speed'] as num).toDouble(),
      visibility: json['visibility'] as int,
      condition: json['weather'][0]['description'] as String,
      iconCode: json['weather'][0]['icon'] as String,
      sunrise: DateTime.fromMillisecondsSinceEpoch(
        (json['sys']['sunrise'] as int) * 1000,
      ),
      sunset: DateTime.fromMillisecondsSinceEpoch(
        (json['sys']['sunset'] as int) * 1000,
      ),
      lastUpdated: DateTime.now(),
    );
  }
}

class ForecastItem {
  final DateTime dateTime;
  final double temperature;
  final String condition;
  final String iconCode;
  final double windSpeed;
  final int humidity;
  final double precipitationProbability;

  const ForecastItem({...});

  factory ForecastItem.fromJson(Map<String, dynamic> json) {
    return ForecastItem(
      dateTime: DateTime.fromMillisecondsSinceEpoch(
        (json['dt'] as int) * 1000,
      ),
      temperature: (json['main']['temp'] as num).toDouble(),
      condition: json['weather'][0]['description'] as String,
      iconCode: json['weather'][0]['icon'] as String,
      windSpeed: (json['wind']['speed'] as num).toDouble(),
      humidity: json['main']['humidity'] as int,
      precipitationProbability: (json['pop'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

// Group forecast items by day
class DayForecast {
  final DateTime date;
  final List<ForecastItem> hourlyItems;

  double get minTemp => hourlyItems.map((i) => i.temperature).reduce(min);
  double get maxTemp => hourlyItems.map((i) => i.temperature).reduce(max);
  String get dominantCondition => hourlyItems.first.condition;
  String get dominantIconCode => hourlyItems.first.iconCode;
}
```

---

## Repository

```dart
class WeatherRepository {
  final Dio _dio;
  static const _apiKey = String.fromEnvironment('WEATHER_API_KEY');

  WeatherRepository()
      : _dio = Dio(BaseOptions(
          baseUrl: 'https://api.openweathermap.org/data/2.5',
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ));

  Future<CurrentWeather> getCurrentWeather(String city) async {
    try {
      final response = await _dio.get('/weather', queryParameters: {
        'q': city,
        'appid': _apiKey,
        'units': 'metric',
      });
      return CurrentWeather.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<DayForecast>> getForecast(String city) async {
    try {
      final response = await _dio.get('/forecast', queryParameters: {
        'q': city,
        'appid': _apiKey,
        'units': 'metric',
      });

      final items = (response.data['list'] as List)
          .map((json) => ForecastItem.fromJson(json as Map<String, dynamic>))
          .toList();

      // Group by day
      final grouped = <String, List<ForecastItem>>{};
      for (final item in items) {
        final key = DateFormat('yyyy-MM-dd').format(item.dateTime);
        grouped.putIfAbsent(key, () => []).add(item);
      }

      return grouped.entries
          .skip(1) // skip today (already shown in current weather)
          .take(5) // next 5 days
          .map((e) => DayForecast(
                date: DateTime.parse(e.key),
                hourlyItems: e.value,
              ))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  AppException _handleError(DioException e) {
    if (e.response?.statusCode == 404) {
      return const NotFoundException();
    }
    if (e.type == DioExceptionType.connectionError) {
      return const NoInternetException();
    }
    return NetworkException(e.message ?? 'Unknown error');
  }
}
```

---

## Riverpod Providers

```dart
// Repository singleton
final weatherRepositoryProvider = Provider<WeatherRepository>((_) => WeatherRepository());

// Currently searched city (persists across refreshes)
final cityProvider = StateProvider<String>((ref) => 'Hyderabad');

// Temperature unit preference
final tempUnitProvider = StateProvider<String>((ref) => 'C'); // 'C' or 'F'

// Current weather — re-fetches when city changes
final currentWeatherProvider = FutureProvider<CurrentWeather>((ref) async {
  final city = ref.watch(cityProvider);
  if (city.isEmpty) throw const ValidationException('Enter a city name');
  return ref.watch(weatherRepositoryProvider).getCurrentWeather(city);
});

// Forecast — re-fetches when city changes
final forecastProvider = FutureProvider<List<DayForecast>>((ref) async {
  final city = ref.watch(cityProvider);
  if (city.isEmpty) return [];
  return ref.watch(weatherRepositoryProvider).getForecast(city);
});

// Search history (last 5 searches)
class SearchHistoryNotifier extends Notifier<List<String>> {
  @override
  List<String> build() => [];

  void add(String city) {
    state = [city, ...state.where((c) => c != city)].take(5).toList();
  }
}

final searchHistoryProvider =
    NotifierProvider<SearchHistoryNotifier, List<String>>(SearchHistoryNotifier.new);
```

---

## Screens

### Screen 1: Home — Current Weather

**Layout (scrollable):**

```
┌──────────────────────────────────────────┐
│  [Search bar]          [Location icon]   │
├──────────────────────────────────────────┤
│                                          │
│           Hyderabad, IN                  │
│                                          │
│               ☁️                         │
│             34°C                         │
│         Partly Cloudy                    │
│      Feels like 38°C                     │
│                                          │
│  💧 72%   💨 14km/h   👁️ 10km            │
│  Humidity  Wind       Visibility         │
│                                          │
│  🌅 06:12 AM          🌇 06:48 PM        │
│  Sunrise              Sunset             │
│                                          │
├──────────────────────────────────────────┤
│  5-Day Forecast                          │
│  ┌──────┬──────┬──────┬──────┬──────┐   │
│  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │   │
│  │  🌤  │  🌧  │  ⛅  │  ☀  │  🌦  │   │
│  │32°/27│28°/24│31°/26│35°/29│29°/25│   │
│  └──────┴──────┴──────┴──────┴──────┘   │
├──────────────────────────────────────────┤
│  Hourly (tap a forecast day to see)     │
│  [12am][3am][6am][9am][12pm][3pm]...    │
└──────────────────────────────────────────┘
```

**Dynamic background:**
Change the background gradient based on weather and time:

```dart
LinearGradient _backgroundForWeather(CurrentWeather weather) {
  final hour = DateTime.now().hour;
  final isNight = hour < 6 || hour > 20;
  final code = weather.iconCode;

  if (isNight) {
    return const LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [Color(0xFF0F0C29), Color(0xFF302B63)],
    );
  }

  if (code.contains('01')) { // clear sky
    return const LinearGradient(
      colors: [Color(0xFF1A78C2), Color(0xFF00C6FB)],
    );
  }

  if (code.contains('09') || code.contains('10')) { // rain
    return const LinearGradient(
      colors: [Color(0xFF4B6CB7), Color(0xFF182848)],
    );
  }

  if (code.contains('11')) { // thunderstorm
    return const LinearGradient(
      colors: [Color(0xFF232526), Color(0xFF414345)],
    );
  }

  return const LinearGradient( // cloudy default
    colors: [Color(0xFF757F9A), Color(0xFFD7DDE8)],
  );
}
```

---

### Screen 2: Search Screen

- Auto-focused search field
- Recent searches shown as chips below the field (tap to search that city)
- Error state specifically for "city not found" (404): "Couldn't find [city]. Check the spelling."
- Error state for no internet: "No connection. Showing last known data." (if cached)

---

### Screen 3: Forecast Detail

Reached by tapping a day in the 5-day forecast row.

- Day name + date (Monday, 16 June)
- Hourly breakdown: horizontal scroll of time chips (12am, 3am, 6am...)
- Each chip shows: time, icon, temperature
- Below the hourly row: min/max temp, precipitation probability, humidity, wind for that day

---

## State Handling — Every Case

```dart
// In your weather widgets, handle every AsyncValue state
ref.watch(currentWeatherProvider).when(
  // Initial load
  loading: () => const WeatherLoadingSkeleton(),

  // API error
  error: (error, _) => WeatherErrorView(
    error: error,
    onRetry: () => ref.refresh(currentWeatherProvider),
  ),

  // Success
  data: (weather) => WeatherDisplay(weather: weather),
)

// WeatherErrorView shows different messages for different error types
class WeatherErrorView extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final (icon, message) = switch (error) {
      NoInternetException() => (Icons.wifi_off, 'No internet connection'),
      NotFoundException() => (Icons.location_off, 'City not found. Check the spelling.'),
      NetworkException(message: final msg) => (Icons.error_outline, msg),
      _ => (Icons.error, 'Something went wrong'),
    };

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 64, color: Colors.white54),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 24),
          OutlinedButton(
            style: OutlinedButton.styleFrom(foregroundColor: Colors.white),
            onPressed: onRetry,
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
}
```

---

## Weather Icon Helper

```dart
// OpenWeatherMap icon codes map to their CDN images
String weatherIconUrl(String iconCode) =>
    'https://openweathermap.org/img/wn/$iconCode@2x.png';

// Usage
Image.network(weatherIconUrl(weather.iconCode), width: 80, height: 80)

// OR map to local assets / emoji
String weatherEmoji(String iconCode) => switch (iconCode.substring(0, 2)) {
  '01' => '☀️',
  '02' => '🌤',
  '03' => '⛅',
  '04' => '☁️',
  '09' => '🌧',
  '10' => '🌦',
  '11' => '⛈',
  '13' => '❄️',
  '50' => '🌫',
  _ => '🌡',
};
```

---

## Packages to Add

```yaml
dependencies:
  flutter_riverpod: ^2.5.0
  dio: ^5.4.0
  intl: ^0.19.0          # date formatting
  geolocator: ^11.0.0    # GPS location (stretch goal)
  permission_handler: ^11.3.0
```

---

## Build Order

1. API key setup + WeatherRepository with just `getCurrentWeather()`
2. Providers: `cityProvider` + `currentWeatherProvider`
3. Home screen — hardcode city "Hyderabad", get it working first
4. Search bar on Home — update `cityProvider` on submit
5. All loading/error/data states on Home
6. Add `getForecast()` to repo + `forecastProvider`
7. 5-day forecast row on Home
8. Search history (recent cities)
9. Hourly forecast detail screen
10. Dynamic backgrounds
11. Temperature unit toggle (C/F)

---

## Quality Checklist

- [ ] Changing city re-fetches both current weather and forecast
- [ ] All 3 error types show different messages and have a retry button
- [ ] Loading state shows a skeleton or spinner (not a blank screen)
- [ ] Pull-to-refresh on Home triggers `ref.refresh()`
- [ ] Temperature unit toggle converts all temperatures everywhere
- [ ] App works without crashing on airplane mode
- [ ] `flutter analyze` — zero issues
- [ ] Recent searches persist across hot restarts (use `SharedPreferences`)

---

## Stretch Goals

- [ ] Location detection: "Use my location" button fetches weather by GPS
- [ ] Multiple cities: add cities to a watchlist, swipe through them with `PageView`
- [ ] Weather widgets / notifications using `home_widget` package
- [ ] Unit tests for `WeatherRepository` using a mock Dio client

---

**Phase 3 Complete. Next → [Phase 4: Firebase & Storage](../Phase_4_Firebase_and_Storage/Week_15_Firebase_Firestore.md)**
