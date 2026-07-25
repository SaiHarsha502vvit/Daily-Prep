# Phase 1 — Dart & Flutter Foundations
### Month 1 | Weeks 1-6

---

## What This Phase Is About

Everything else in this bootcamp stands on this month. You learn Dart properly (not "enough Dart to copy tutorials"), then the four ideas that make Flutter *Flutter*: everything is a widget, the widget/element/render trees, the lifecycle of a StatefulWidget, and the constraints-based layout protocol. By the end you navigate between screens, manage local state, and ship your first complete app.

The capstone: a **Personal Profile App** — your first portfolio piece.

---

## Week Map

| File | Topic | Core Skills |
|------|-------|-------------|
| [Week_01_Dart_Language.md](Week_01_Dart_Language.md) | Dart Language | Types, OOP, async/await, null safety, collections, the Dart VM |
| [Week_02_Flutter_Core_Concepts.md](Week_02_Flutter_Core_Concepts.md) | Flutter Core Concepts | Widgets, the three trees, setState, hot reload, reconciliation |
| [Week_03_Widget_Lifecycle.md](Week_03_Widget_Lifecycle.md) | Widget Lifecycle | initState, dispose, mounted, didUpdateWidget, controllers |
| [Week_04_Layout_and_Constraints.md](Week_04_Layout_and_Constraints.md) | Layout & Constraints | Row/Column/Stack, tight vs loose constraints, Expanded, LayoutBuilder |
| [Week_05_Navigation_and_State.md](Week_05_Navigation_and_State.md) | Navigation & State | Navigator stack, routes, passing data, lifting state up |
| [Week_06_Project_ProfileApp.md](Week_06_Project_ProfileApp.md) | Project: Profile App | All Phase 1 skills combined in your first real app |

---

## What You'll Build This Phase

**Weekly labs:**
- Dart console programs exercising OOP, async, and null safety (Week 01)
- Counter and interactive widget experiments with setState (Week 02)
- A timer app with proper controller disposal (Week 03)
- Responsive card layouts from design mockups (Week 04)
- A multi-screen app with data passed forward and back (Week 05)

**Phase capstone:**
A personal profile app with:
- Profile header, skills grid, project showcase list
- Light/dark theme toggle
- Multi-screen navigation with a details page per project
- Clean widget decomposition (no 300-line build methods)

---

## Phase 1 Self-Assessment

After completing all 6 weeks, you should be able to:

- Explain `var` vs `final` vs `const` and where Dart runs your code (JIT vs AOT)
- Explain why Flutter rebuilds are cheap (widget vs element vs render tree)
- Place `initState`, `didChangeDependencies`, `build`, and `dispose` correctly
- Debug a layout by reasoning about constraints going down and sizes going up
- Push and pop routes, passing data in both directions
- Build a complete small app from a blank project without a tutorial

---

**Start → [Week 01: Dart Language](Week_01_Dart_Language.md)**
