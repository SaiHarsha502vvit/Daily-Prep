# Weather App — Project Challenges

### Companion to [Week 15: Project — Weather App](Week_15_Project_WeatherApp.md)

---

## How This Works

These stress-test the actual Weather App you built — the `weatherProvider`'s `autoDispose.family` + `keepAlive()` combination, the search screen's provider wiring, the repository layer. One of these Bug Hunts is aimed at a real subtlety hiding in this project's own code comments. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Comment That Lies About What the Code Does

This project's own `weatherProvider`:

```dart
final weatherProvider = FutureProvider.autoDispose.family<Weather, String>((ref, city) async {
  // Keep the data alive for 10 minutes to avoid refetch on tab switch
  ref.keepAlive();

  final repo = ref.watch(weatherRepositoryProvider);
  return repo.getWeather(city);
});
```

Read the comment. Then read `ref.keepAlive()`'s actual behavior in the [Riverpod core content on `autoDispose`](../Phase_3_State_and_APIs/Week_13_Riverpod.md) — does `ref.keepAlive()` alone, with no other code, actually implement "keep it alive for 10 minutes," or something different?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `ref.keepAlive()` returns a `KeepAliveLink` and, called with no follow-up, disables auto-disposal **indefinitely** — not for 10 minutes, forever, until something explicitly calls `.close()` on that link (or the app restarts). The comment describes an *intent* the code never actually implements. This is a genuinely realistic bug category — not a crash, not even wrong behavior in the short term, just a silent gap between what a comment promises and what the code does, the kind of thing that survives code review because the code "looks right" at a glance and nobody re-derives what `keepAlive()` actually does from first principles. The fix, to make the comment true:

```dart
final weatherProvider = FutureProvider.autoDispose.family<Weather, String>((ref, city) async {
  final link = ref.keepAlive();
  final timer = Timer(const Duration(minutes: 10), link.close); // NOW it's actually 10 minutes
  ref.onDispose(timer.cancel); // if the provider disposes some other way first, don't leak the Timer

  final repo = ref.watch(weatherRepositoryProvider);
  return repo.getWeather(city);
});
```

The general lesson: **a comment is a claim, not a guarantee — when a comment describes specific timing/behavior, trace through what the code actually does rather than trusting the comment's summary of itself.** This is precisely the kind of gap a thorough Code Review (see the format below) exists to catch.

</details>

---

### 🎭 Two Truths and a Lie — This Project's Provider Wiring

**A.** `weatherProvider` and `forecastProvider` are both `.family`, keyed by city — searching "London" then "Paris" then back to "London" means the third lookup reuses the already-fetched London data rather than re-fetching, as long as the London provider instance hasn't been disposed.

**B.** `_focusNode.requestFocus()` inside `SearchScreen`'s `initState` is wrapped in `WidgetsBinding.instance.addPostFrameCallback` because calling it synchronously inside `initState` would throw an exception.

**C.** `searchHistoryProvider`'s `addSearch` moving an already-searched city to the front of the list (rather than adding a duplicate entry) is a deliberate design choice, not an accident of how `Notifier.state` reassignment works.

<details><summary>Which one's the lie</summary>

**B is the lie.** Calling `_focusNode.requestFocus()` directly and synchronously inside `initState` does **not** throw — it's a common enough mistake to assume it would, but the real reason for the post-frame callback is different and more subtle: at the point `initState` runs, the widget's `RenderObject` hasn't been attached/laid out yet, so the `FocusNode` genuinely can't be granted OS-level keyboard focus meaningfully — attempting it synchronously either silently fails to actually raise the keyboard or produces inconsistent behavior depending on platform/timing. `addPostFrameCallback` defers the call until *after* the first frame has been built and laid out, at which point requesting focus reliably works and the keyboard actually appears.

🔴 **Explanation:** A is true and is the entire point of `.family` as covered in [Week 13's caching-identity challenge](Week_13b_Riverpod_Challenges.md#w13-2-medium--family-provider-identity-prove-the-caching) — the `(provider, argument)` pair is the cache key, so returning to a previously-fetched city hits the existing cache entry rather than re-fetching, provided it's still alive (which is exactly what the `keepAlive()` call in the Bug Hunt above is trying, imperfectly, to guarantee for a bounded window). C is also true — `state = [city, ...state.where((c) => c != city)]` deliberately filters out any existing occurrence of `city` before prepending it fresh, which is what produces "move to front" instead of "duplicate entry" behavior; it's not a side effect of Riverpod's mechanics, it's explicit list logic the project's own code wrote on purpose.

</details>

---

### ⚔️ Refactor Duel — Stop Calling Dio Directly From a Widget

Someone needed weather data on a new screen fast and didn't bother going through the existing provider layer:

```dart
class QuickWeatherWidget extends StatefulWidget {
  const QuickWeatherWidget({super.key, required this.city});
  final String city;
  @override
  State<QuickWeatherWidget> createState() => _QuickWeatherWidgetState();
}

class _QuickWeatherWidgetState extends State<QuickWeatherWidget> {
  Weather? _weather;

  @override
  void initState() {
    super.initState();
    Dio().get('https://api.openweathermap.org/data/2.5/weather?q=${widget.city}').then((response) {
      setState(() => _weather = Weather.fromJson(response.data));
    });
  }

  @override
  Widget build(BuildContext context) => Text(_weather?.temp.toString() ?? 'Loading...');
}
```

**Task:** refactor this to go through the existing `weatherProvider` instead. What, concretely, does this version lose by bypassing it — beyond just "it's not the established pattern"?

<details><summary>Solution & Explanation</summary>

```dart
class QuickWeatherWidget extends ConsumerWidget {
  const QuickWeatherWidget({super.key, required this.city});
  final String city;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weather = ref.watch(weatherProvider(city));
    return weather.when(
      data: (w) => Text(w.temp.toString()),
      loading: () => const Text('Loading...'),
      error: (e, st) => const Text('Failed to load'),
    );
  }
}
```

🔴 **Explanation:** concretely, not just stylistically, the original loses: **caching** (a second `QuickWeatherWidget` for the same city makes a completely separate, redundant network call, where `weatherProvider(city)` would have returned the already-cached result); **error handling** (the raw `Dio().get(...).then(...)` has no `.catchError` or try/catch at all — a failed request just leaves `_weather` permanently `null` with the UI stuck on "Loading..." forever, no error state ever surfaces); and **the API key/base URL centralization** that `weatherRepositoryProvider` presumably wraps (hardcoding the raw URL here means updating the API endpoint or key rotation logic requires hunting down every place someone bypassed the repository, instead of one place). This is [Week 21's dependency-inversion lesson](../Phase_5_Advanced_Patterns/Week_21b_Clean_Architecture_Challenges.md#-bug-hunt--spot-the-layer-violation-nothing-crashes-here) arriving early, in a project that predates that week — the instinct to "just call the API directly, it's faster" has the same real cost here that it does in a formally layered architecture.

</details>

---

### 🏗️ Build It Blind — Which City Is Warmer Today

No starter code. Spec only:

> Add a feature: the user selects two cities from their search history, and the app shows which one is currently warmer, and by how many degrees. Design this using the *existing* `weatherProvider` and `searchHistoryProvider` — don't build a new data-fetching path.

Before opening the solution: does watching `weatherProvider` twice (once per city) inside one widget cause any problems, given what you know about `.family` from the Two Truths and a Lie above?

<details><summary>One reasonable solution</summary>

```dart
class CityComparisonScreen extends ConsumerWidget {
  const CityComparisonScreen({super.key, required this.cityA, required this.cityB});
  final String cityA;
  final String cityB;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weatherA = ref.watch(weatherProvider(cityA));
    final weatherB = ref.watch(weatherProvider(cityB));

    return weatherA.when(
      data: (a) => weatherB.when(
        data: (b) {
          final diff = (a.temp - b.temp).abs();
          final warmer = a.temp > b.temp ? cityA : cityB;
          return Text('$warmer is warmer by ${diff.toStringAsFixed(1)}°');
        },
        loading: () => const CircularProgressIndicator(),
        error: (e, st) => const Text('Failed to load comparison city'),
      ),
      loading: () => const CircularProgressIndicator(),
      error: (e, st) => const Text('Failed to load first city'),
    );
  }
}
```

🔴 **Explanation:** watching `weatherProvider(cityA)` and `weatherProvider(cityB)` in the same widget causes **no problems at all** — each `.family` argument is an independent cache entry (the exact mechanism proven in [Week 13's `WidgetA`/`WidgetB`/`WidgetC` challenge](Week_13b_Riverpod_Challenges.md#w13-2-medium--family-provider-identity-prove-the-caching)), so this widget simply subscribes to two separate providers, each managing its own loading/data/error lifecycle independently. The nested `.when()` calls are the honest way to combine two independent `AsyncValue`s — there's no built-in "combine two AsyncValues" helper in base Riverpod, so explicitly nesting (or nesting differently if you want to show a spinner only when *both* are still loading) is the real pattern, not a workaround.

</details>

---

### 👹 Boss Battle — Pull-to-Refresh With Honest Stale Data

**The spec:** add pull-to-refresh to the main weather screen, and fix the `keepAlive()` bug from this file's own Bug Hunt properly along the way. Requirements: (1) pulling down triggers a genuine re-fetch, not just re-reading the cache, (2) while that re-fetch is in flight, the screen keeps showing the **previous** weather data (not a blank loading spinner replacing everything) with a small "Updating..." indicator, and a "Last updated: X minutes ago" timestamp, (3) the 10-minute keep-alive from the Bug Hunt fix actually works now — the cache genuinely expires after 10 minutes of no manual refresh.

<details><summary>One reasonable solution</summary>

```dart
final weatherProvider = FutureProvider.autoDispose.family<Weather, String>((ref, city) async {
  final link = ref.keepAlive();
  final timer = Timer(const Duration(minutes: 10), link.close);
  ref.onDispose(timer.cancel);

  final repo = ref.watch(weatherRepositoryProvider);
  final weather = await repo.getWeather(city);
  return weather.copyWith(fetchedAt: DateTime.now());
});

class WeatherScreen extends ConsumerWidget {
  const WeatherScreen({super.key, required this.city});
  final String city;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weather = ref.watch(weatherProvider(city));

    return RefreshIndicator(
      onRefresh: () => ref.refresh(weatherProvider(city).future),
      child: weather.when(
        data: (w) => _WeatherContent(weather: w, isRefreshing: false),
        loading: () {
          // Show STALE previous data while refreshing, if we have it —
          // AsyncValue exposes this via `.valueOrNull` on the current AsyncValue object,
          // which still holds the prior successful value during a refresh-triggered reload.
          final stale = weather.valueOrNull;
          return stale != null
              ? _WeatherContent(weather: stale, isRefreshing: true)
              : const Center(child: CircularProgressIndicator());
        },
        error: (e, st) => const Text('Failed to load weather'),
      ),
    );
  }
}
```

🔴 **Explanation:** `ref.refresh(weatherProvider(city).future)` is what makes requirement (1) genuine — it forces the provider to actually re-run its body (a real network call), not just re-read whatever's cached, which is a meaningfully different operation from `ref.watch` alone. Requirement (2)'s "show stale data while refreshing" is where `AsyncValue`'s richer state (beyond the simple three-way `.when()` from [Week 13's exhaustiveness lesson](Week_13b_Riverpod_Challenges.md#w13-4-medium--asyncvaluewhen-exhaustiveness-vs-maybewhens-trap)) becomes genuinely useful — `weather.valueOrNull` can still hold the *previous* successful value even while a fresh `AsyncLoading` state is technically in progress, letting the UI show old-but-real data instead of nothing at all during a refresh. Requirement (3) is the Bug Hunt fix from earlier in this file, now actually load-bearing rather than a comment describing behavior the code didn't implement.

</details>

---

**Next → [Week 16: Firebase & Firestore](../Phase_4_Firebase_and_Storage/Week_16_Firebase_Firestore.md)**
