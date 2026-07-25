# Phase 3 — State Management & APIs
### Month 3 | Weeks 12-15

---

## What This Phase Is About

This phase separates beginners from intermediate developers. You'll stop storing state in widgets and start managing it properly. You'll call real APIs, parse real JSON, handle real errors. And you'll do it all with Riverpod — the industry standard in 2025.

The capstone: a **Weather App** using live OpenWeatherMap data.

---

## Week Map

| File | Topic | Core Skills |
|------|-------|-------------|
| [Week_12_State_Management_Deep_Dive.md](Week_12_State_Management_Deep_Dive.md) | State Deep Dive | InheritedWidget, ChangeNotifier, Provider, ListenableBuilder, ephemeral vs app state |
| [Week_13_Riverpod.md](Week_13_Riverpod.md) | Riverpod | All 5 provider types, ref.watch/read/listen, select, family, ConsumerWidget |
| [Week_14_HTTP_and_REST_APIs.md](Week_14_HTTP_and_REST_APIs.md) | HTTP & REST APIs | Dio, JSON parsing, Repository pattern, error handling, Interceptors |
| [Week_15_Project_WeatherApp.md](Week_15_Project_WeatherApp.md) | Project: Weather App | Live API + Riverpod + full error/loading/data states |

---

## What You'll Build This Phase

**Weekly labs:**
- Shared wishlist app using Provider + ChangeNotifier (Week 12)
- Shopping cart refactored to Riverpod (Week 13)
- GitHub User Explorer with search, profile, and repos (Week 14)

**Phase capstone:**
A weather app with live OpenWeatherMap data:
- City search with recent history
- Current conditions (temp, humidity, wind, sunrise/sunset)
- 5-day forecast row
- Hourly detail screen per day
- Dynamic background that changes with weather condition

---

## Phase 3 Self-Assessment

After completing all 4 weeks, you should be able to:

- Explain why `setState()` doesn't scale and what InheritedWidget does instead
- Use `FutureProvider`, `StateProvider`, and `AsyncNotifierProvider` correctly
- Write a Dio-based repository with proper error handling for all failure types
- Connect a repository to a Riverpod provider and display all 3 states (loading/error/data)
- Use `ref.watch()` in build and `ref.read()` in callbacks without mixing them up
- Refresh a provider without restarting the app

---

**Start → [Week 12: State Management Deep Dive](Week_12_State_Management_Deep_Dive.md)**
