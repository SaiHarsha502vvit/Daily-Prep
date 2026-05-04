# 19 - Frontend Integration

> Bringing it all together: debugging, performance, accessibility, build tools, and hands-on challenges.

## Reading Order

| # | File | What You'll Learn |
|---|------|-------------------|
| 1 | [React + JS + CSS Combined](01_React_JS_CSS_Combined.md) | Full-stack frontend integration |
| 2 | [Frontend Debugging](02_Frontend_Debugging.md) | Debugging strategies for frontend |
| 3 | [Build Tools & Ecosystem](03_Build_Tools_Ecosystem.md) | Webpack, Vite, npm, monorepos |
| 4 | [Frontend Mental Models](04_Frontend_Mental_Models_UI.md) | How to think about UI architecture |
| 5 | [DevTools Mastery](05_DevTools_Debugging_Mastery.md) | Chrome DevTools deep dive |
| 6 | [Web Performance](06_Web_Performance_CoreWebVitals.md) | Core Web Vitals, lighthouse, optimization |
| 7 | [Web Accessibility](07_Web_Accessibility_A11y.md) | WCAG, ARIA, screen readers |

## Hands-On Challenges

| # | Challenge | What's Broken | Data Flow Lesson |
|---|-----------|---------------|------------------|
| 1 | [Vanilla DOM Sync](frontend_challenges/challenge_1_vanilla_dom/) | innerHTML destroys event listeners | Array → DOM projection, optimistic vs pessimistic |
| 2 | [React Race Condition](frontend_challenges/challenge_2_react_race/) | Stale API responses overwrite newer | JS → URL → HTTP → SQL → JSON → state → render |
| 3 | [CSS Stacking Context](frontend_challenges/challenge_3_css_stacking/) | z-index trapped in parent context | Modal blocks form submission pipeline |
| 4 | [Stale Closure](frontend_challenges/challenge_4_stale_closure/) | setInterval captures old state | Polling with stale backend query params |
| 5 | [Deep Immutability](frontend_challenges/challenge_5_deep_immutability/) | Shallow spread corrupts nested objects | State → JSON → DTO → Entity → SQL chain |

See [Frontend Challenges README](frontend_challenges/README.md) for full details.

---
[← Back to Master Index](../00_MASTER_INDEX.md)
