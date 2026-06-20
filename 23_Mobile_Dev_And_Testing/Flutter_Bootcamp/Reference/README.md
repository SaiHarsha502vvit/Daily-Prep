# Flutter Reference Library
### Documentation-level deep dives — look things up here when you need the full picture

---

These files are NOT tutorials. They are comprehensive references — the kind of thing you bookmark and come back to repeatedly throughout your Flutter career. When you want to know exactly how something works, come here.

## Files

| File | What's in it |
|------|-------------|
| [DOC_01_Rendering_Pipeline.md](DOC_01_Rendering_Pipeline.md) | Flutter's 4-layer architecture, Widget/Element/RenderObject trees, Build→Layout→Paint→Composite pipeline, Impeller, Dart Isolates, Platform Channels |
| [DOC_02_Widget_Catalog_Complete.md](DOC_02_Widget_Catalog_Complete.md) | Every widget you'll use — Layout, Text, Input, Scrolling, Images, Buttons, Overlays, Animations, Material, Gesture, Async — with key properties and when-to-use |
| [DOC_03_Material3_Theming.md](DOC_03_Material3_Theming.md) | Complete color role system (30+ roles), typography scale (15 styles), every component theme, dynamic theme switching, spacing tokens |
| [DOC_04_BuildContext_Deep_Dive.md](DOC_04_BuildContext_Deep_Dive.md) | What context truly is (handle to Element node), walk-up algorithm, why "No Scaffold found" happens, Builder widget pattern, mounted guard, GlobalKey |
| [DOC_05_InheritedWidget_Keys.md](DOC_05_InheritedWidget_Keys.md) | InheritedWidget mechanics, updateShouldNotify, all Key types (ValueKey/ObjectKey/UniqueKey/GlobalKey/PageStorageKey), reconciliation algorithm |
| [DOC_06_Async_Patterns_Complete.md](DOC_06_Async_Patterns_Complete.md) | Dart event loop, Future/async/await, Stream/StreamController/StreamBuilder, FutureBuilder pitfalls, Isolates, Timer, debounce, error handling |

---

## When to Use This vs the Weekly Files

**Weekly files** (Phase_1, Phase_2, etc.) → step-by-step teaching with "Try this" tasks and labs

**Reference files** (here) → when you're working on a project and need to quickly look up:
- "What properties does AnimatedSwitcher have?"
- "Why is BuildContext giving me a 'No Navigator found' error?"
- "What's the difference between ValueKey and ObjectKey?"
- "How does updateShouldNotify work?"
- "What color role should I use for card backgrounds?"

---

**← Back to [Master Roadmap](../00_MASTER_ROADMAP.md)**
