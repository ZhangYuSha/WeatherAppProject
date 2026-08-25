# Weather App

A responsive single-page weather application built with **Vue 3**, **TypeScript**, and the **Composition API**, integrating the [OpenWeatherMap API](https://openweathermap.org/api). Built as a practical test for the Senior Front-End Engineer role.

## Features

- **Search & discover** : debounced city/airport search with live autocomplete suggestions (`SearchBar`)
- **Current location weather** : auto-detects the user's location on load via the Geolocation Web API
- **Saved cities** : add or remove cities from a persistent list stored in `localStorage`, kept in sync across views through a shared composable
- **Weather detail view** — current conditions plus hourly and 7-day forecasts, with manual refresh
- **Forecast drill-down** : tapping any hourly/daily entry opens a detail page with min/avg/max precipitation, humidity, and wind speed, plus contextual "what to prepare" suggestions
- **Account / profile page** : editable profile with inline, real-time form validation (name, email, phone) and a country selector populated from a REST Countries–style API, complete with flag icons
- **Condition-aware theming** : each weather card and detail hero swaps its background image based on the current weather icon code (clear, cloudy, rain, thunderstorm, snow, mist — day/night variants)

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript (strict mode) |
| Build tool | Vite |
| Routing | Vue Router 4 |
| State management | Composition-API composables (`useSavedCities`) + `localStorage` persistence |
| Styling | Scoped component CSS, BEM naming |
| Weather data | OpenWeatherMap API |
| Advanced Web APIs | Geolocation API, Web Storage API (`localStorage`) |

## Project Structure

The codebase follows **Atomic Design**, so components are organized by complexity rather than by feature:

```
src/
├── assets/                  # Static assets (icons, weather background images)
├── components/
│   ├── atoms/                # BaseInput, etc. — smallest reusable building blocks
│   ├── molecules/             # SearchBar — atoms composed together
│   ├── organisms/             # WeatherCard — self-contained, reusable UI sections
│   └── templates/             # PageWithBackButton — page-level layout skeletons
├── composables/
│   └── useSavedCities.ts      # Shared reactive state: saved cities, current location
├── pages/
│   ├── AccountPage/            # Profile view + form validation
│   ├── CityListPage/           # Landing page: search + current location + saved cities
│   ├── WeatherDetailPage/       # Current conditions, hourly/daily forecast
│   └── ForecastDetailPage/      # Drill-down detail for a single hour/day
├── services/
│   ├── WeatherApi.ts           # OpenWeatherMap integration + response typing
│   └── CountryApi.ts           # Country list + typing for AccountPage
├── router/
└── App.vue
```

**Pages** compose **templates**, **organisms**, **molecules**, and **atoms** - they hold routing and page-level data-fetching logic but delegate presentation and reusable interaction patterns downward.

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn/pnpm — adjust commands accordingly)
- A free [OpenWeatherMap API key](https://openweathermap.org/api)

### Installation

```bash
git clone https://github.com/ZhangYuSha/WeatherAppProject.git
cd WeatherAppProject
npm install
```

### Environment variables

Create a `.env` file in the project root:

```
VITE_OPENWEATHER_API_KEY=<your-api-key>
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
npm run preview   # serve the production build locally
```

## Architecture & Approach

- **Composition API everywhere.** Every component uses `<script setup lang="ts">` for concise, type-inferred reactive state and lifecycle hooks.
- **State management without Vuex.** `useSavedCities` centralizes saved-city and current-location state as module-level `ref`s, exposed through a composable. This keeps state consistent across `CityListPage` and `WeatherDetailPage` (e.g. saving a city on one view is reflected immediately on the other) without the boilerplate of a full Vuex/Pinia store, since the app's shared state surface is small.
- **"MyLocation" handling.** The user's geolocated position is tracked separately from explicitly saved cities so it can be dismissed ("deleted") without discarding the underlying coordinates — re-adding the same location simply restores it rather than creating a duplicate saved entry. Two coordinates are treated as the same place using an approximate ~1km tolerance.
- **Typed API layer.** `WeatherApi` and `CountryApi` centralize all `fetch` calls and expose typed interfaces (`WeatherData`, `HourlyForecastData`, `DailyForecastData`, `DetailedForecastItem`, `LocationSuggestion`, `Country`) so components never handle raw API shapes directly.
- **Form validation.** `AccountPage` validates each field independently (required, max length, email pattern, phone pattern) so every invalid field surfaces its own message rather than short-circuiting on the first error, with `aria-invalid` and `role="alert"` wired up for accessibility.
- **Navigation-based data passing.** Forecast detail selection (`kind`, `index`) is passed via route query params, with the detail page refetching the forecast and resolving the specific entry — this keeps direct links and page refreshes working, at the cost of an extra network call.

## Web API Integration

**Geolocation API** : `CityListPage` requests the user's coordinates on mount via `navigator.geolocation.getCurrentPosition`, with graceful handling of unsupported browsers, permission denial, and timeouts, and a loading/error state surfaced in the UI.

**Web Storage API** : saved cities persist across sessions via `localStorage`, so the user's list survives page reloads without a backend.

## Testing

```bash
npm run test
```
Unit tests are written with [Vitest](https://vitest.dev/). Coverage for `getLocationLabel` in `WeatherApi.ts` is included; other services and composables are noted under Possible Improvements.

## Commit Convention

This project follows [Angular's Conventional Commits](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit) format:

```
<type>(<scope>): <short summary>

feat(search): add debounced location autocomplete
fix(account): correct phone number validation regex
refactor(composables): extract saved-city matching into isSameCity
docs(readme): document environment setup
```

Common types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`.

## Possible Improvements

- Extract global state into Pinia if the app's shared-state surface grows
- Expand unit test coverage beyond `getLocationLabel` — particularly `useSavedCities`'s location-matching logic and forecast formatting in `WeatherApi.ts`
- Cache weather responses to reduce redundant API calls on refresh
- Add a service worker for basic offline support