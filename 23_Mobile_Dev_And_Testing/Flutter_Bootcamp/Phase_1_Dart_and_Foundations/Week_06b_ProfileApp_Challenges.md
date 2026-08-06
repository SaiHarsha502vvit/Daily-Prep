# Profile App — Project Challenges

### Companion to [Week 06: Project — Personal Profile App](Week_06_Project_ProfileApp.md)

---

## How This Works

Project weeks don't need "prove this mechanism" problems the way concept weeks do — you already proved the mechanisms building the app. These challenges extend, break, and stress-test the actual Profile App you built: the Skills filter, the Work tab's favourite-toggle, the tab navigation. Mixed formats throughout — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Favourite Star That Un-Favourites Itself

`WorkTab` passes `onToggleFavourite` down as a callback and pushes `ProjectDetailScreen(project: project)` on tap — the exact pattern from Step 6. Someone added a favourite star *inside* the detail screen too, so users don't have to go back just to favourite something:

```dart
class ProjectDetailScreen extends StatelessWidget {
  const ProjectDetailScreen({super.key, required this.project});
  final Project project;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(project.title),
        actions: [
          IconButton(
            icon: Icon(project.isFavourite ? Icons.star : Icons.star_border),
            onPressed: () {
              project.isFavourite = !project.isFavourite; // toggled locally
              (context as Element).markNeedsBuild(); // force this screen to repaint
            },
          ),
        ],
      ),
      body: Text(project.description),
    );
  }
}
```

The star visibly toggles on this screen. Press back to the Work tab list — the star there is back to whatever it was before, ignoring what you just did. Why, given that `project.isFavourite` was genuinely mutated?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `WorkTab` already has the *correct* mechanism sitting right there — `onToggleFavourite: () => onToggleFavourite(project.id)` — a callback that's meant to bubble the toggle **up** to whichever ancestor owns the actual `projects` list (per [Week 5's lifting-state-up pattern](../Phase_1_Dart_and_Foundations/Week_05_Navigation_and_State.md), the same lesson this project's own Step 6 is built on). `ProjectDetailScreen` bypasses that entirely — it mutates `project.isFavourite` on the **exact object instance** it received via its constructor, which is a private copy as far as the Work tab's list is concerned unless that list holds the *same* object reference *and* something tells the Work tab's own `State` to rebuild. `(context as Element).markNeedsBuild()` forces a rebuild of the detail screen itself (a genuinely unusual, borderline-hacky thing to do — a real warning sign, not just incidental to the bug) but does nothing for the Work tab underneath it, which never gets told anything changed. The fix restores the constructor-callback pattern the project already established:

```dart
class ProjectDetailScreen extends StatelessWidget {
  const ProjectDetailScreen({super.key, required this.project, required this.onToggleFavourite});
  final Project project;
  final VoidCallback onToggleFavourite;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(project.title),
        actions: [
          IconButton(
            icon: Icon(project.isFavourite ? Icons.star : Icons.star_border),
            onPressed: onToggleFavourite, // bubble up, same as WorkTab already does
          ),
        ],
      ),
      body: Text(project.description),
    );
  }
}

// WorkTab passes it through:
onTap: () => Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => ProjectDetailScreen(
      project: project,
      onToggleFavourite: () => onToggleFavourite(project.id),
    ),
  ),
),
```

Now toggling from the detail screen calls the *same* callback chain that ultimately updates whatever ancestor owns `projects` and calls `setState` there — the Work tab list rebuilds correctly on return, because the single source of truth was updated, not a disconnected local copy.

</details>

---

### 🎭 Two Truths and a Lie — Your Own Skills Tab

**A.** `_filteredSkills` being a **getter** (not a field re-assigned inside `setState`) means it's recomputed fresh every time `build()` runs — there's no risk of it holding a stale filtered list from before the user picked a new category.

**B.** If `SkillsTab` is rebuilt by its parent with a genuinely different `skills` list (not just the same list reference), the currently-selected `_selectedCategory` filter chip stays selected and immediately re-filters against the new list — no extra code needed.

**C.** Because `_selectedCategory` lives inside `_SkillsTabState`, navigating away from the Skills tab and back (if it were ever removed from the widget tree, e.g., without `IndexedStack`) would preserve whatever filter was selected.

<details><summary>Which one's the lie</summary>

**C is the lie** — and it's worth catching because it's the opposite of what [Week 5's IndexedStack challenge](../Phase_1_Dart_and_Foundations/Week_05b_Navigation_Challenges.md#w5-2-medium--indexedstack-vs-naive-tab-switching-lose-state-then-dont) already taught you: state living in a `State` object only survives across a tab switch **if** that widget stays mounted the whole time (which is exactly why the project brief's tab navigation should use `IndexedStack`, not a naive `tabIndex == 0 ? A() : B()` swap). If the Skills tab genuinely gets removed and recreated, `_SkillsTabState` is destroyed along with `_selectedCategory`, and the filter resets to "All" on return — the opposite of "preserved."

🔴 **Explanation:** A is true, and it's the entire reason the getter pattern was used instead of eagerly filtering inside `setState` and storing the *result* in a field — the getter can never go stale because it's recomputed from `_selectedCategory` and `widget.skills` fresh on every access. B is also true for the same reason: since `_filteredSkills` reads `widget.skills` live (not a cached copy taken once), a new `skills` list from the parent is picked up automatically on the very next `build()`, filtered by whatever category is currently selected.

</details>

---

### 🏗️ Build It Blind — A Testimonials Tab

No starter code. Spec only, staying within what Phase 1 has actually taught you (no state management packages, no local storage — just data models, widgets, navigation, and lifecycle):

> Add a fourth tab: "Testimonials." Each testimonial has an author name, a role/company, a quote, and an optional photo URL. The tab shows a scrollable list of testimonial cards; tapping one opens a detail screen showing the full quote larger, with a "Back" button. Design your own `Testimonial` data model (matching the style of this project's existing `Skill`/`Project` models), your own card widget, and your own detail screen — then wire it into the existing tab navigation from Step 2.

Before opening the solution, decide: does the detail screen need any interactive callback bubbled back up (like the favourite-toggle above), or is this screen genuinely just read-only — and does that change how you'd pass data to it?

<details><summary>One reasonable solution</summary>

```dart
// lib/models/testimonial.dart
class Testimonial {
  const Testimonial({
    required this.id,
    required this.authorName,
    required this.role,
    required this.quote,
    this.photoUrl,
  });
  final String id;
  final String authorName;
  final String role;
  final String quote;
  final String? photoUrl;
}

// lib/screens/testimonials/testimonial_detail_screen.dart
class TestimonialDetailScreen extends StatelessWidget {
  const TestimonialDetailScreen({super.key, required this.testimonial});
  final Testimonial testimonial; // read-only — no callback needed, nothing here mutates state

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(testimonial.authorName)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('"${testimonial.quote}"', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),
            Text('${testimonial.authorName} — ${testimonial.role}'),
          ],
        ),
      ),
    );
  }
}
```

🔴 **Explanation:** the design question worth having asked yourself — unlike the favourite-toggle Bug Hunt above, testimonials are purely display data with no mutable interaction, so `TestimonialDetailScreen` genuinely doesn't need a callback bubbled anywhere; a plain `const` constructor taking the `Testimonial` object is the *correct* level of complexity here, not a missing feature. Recognizing when a screen is legitimately read-only (and doesn't need the lifting-state-up machinery) is as much a real skill as recognizing when it does — over-engineering a callback chain for data that never changes is its own kind of mistake.

</details>

---

### 👹 Boss Battle — A Sortable Work Tab

**The spec:** add a sort control to the Work tab (by date, alphabetically, or favourites-first), combining everything this project already exercises: a data model (`Project` already has whatever date/title fields it needs), lifted state (the sort preference should probably live wherever `projects` itself lives, not buried inside `WorkTab`'s own `State`, following the same reasoning as the favourite-toggle bug above), and the existing `CustomScrollView`/`SliverList` structure from Step 6.

**The design question to answer before coding:** should `WorkTab` sort the list itself, or should it receive an *already-sorted* list from its parent? Think back to the favourite-toggle bug — which choice keeps a single source of truth, and which risks the same "local copy diverges from reality" mistake?

<details><summary>One reasonable solution</summary>

```dart
enum SortOrder { dateNewest, alphabetical, favouritesFirst }

class WorkTab extends StatelessWidget {
  const WorkTab({
    super.key,
    required this.projects, // ALREADY sorted by the parent — WorkTab stays dumb/display-only
    required this.sortOrder,
    required this.onSortOrderChanged,
    required this.onToggleFavourite,
  });
  final List<Project> projects;
  final SortOrder sortOrder;
  final ValueChanged<SortOrder> onSortOrderChanged;
  final void Function(String projectId) onToggleFavourite;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          title: const Text('Work'),
          actions: [
            PopupMenuButton<SortOrder>(
              onSelected: onSortOrderChanged,
              itemBuilder: (context) => const [
                PopupMenuItem(value: SortOrder.dateNewest, child: Text('Newest first')),
                PopupMenuItem(value: SortOrder.alphabetical, child: Text('A-Z')),
                PopupMenuItem(value: SortOrder.favouritesFirst, child: Text('Favourites first')),
              ],
            ),
          ],
        ),
        // ...same SliverList as Step 6, reading `projects` as-is — no sorting logic here at all
      ],
    );
  }
}

// Wherever `projects` actually lives (the ancestor owning the master list):
List<Project> get _sortedProjects {
  final list = [..._projects];
  switch (_sortOrder) {
    case SortOrder.dateNewest: list.sort((a, b) => b.date.compareTo(a.date));
    case SortOrder.alphabetical: list.sort((a, b) => a.title.compareTo(b.title));
    case SortOrder.favouritesFirst: list.sort((a, b) => (b.isFavourite ? 1 : 0) - (a.isFavourite ? 1 : 0));
  }
  return list;
}
```

🔴 **Explanation:** this is the favourite-toggle Bug Hunt's lesson applied proactively instead of after the fact — `WorkTab` receives an **already-sorted** list rather than sorting internally, keeping it a pure "display what I'm given" widget with no state of its own that could drift out of sync with wherever the real `projects` list and `isFavourite` flags actually live. The `_sortedProjects` getter (same shape as `SkillsTab`'s `_filteredSkills` from this project's own Step 5) computes fresh on every read rather than caching a stale sorted copy — one consistent pattern, reused a third time in this same app, for the same underlying reason each time: **derive from the source of truth on demand; don't cache a copy that can silently go stale.**

</details>

---

**Next → [Week 7: Scrolling & Slivers](../Phase_2_Core_UI/Week_07_Scrolling_and_Slivers.md)**
