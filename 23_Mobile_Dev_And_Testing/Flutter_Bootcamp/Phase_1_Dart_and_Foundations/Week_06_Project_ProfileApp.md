# Week 6 — Project: Personal Profile App
### Phase 1 Capstone | Everything from Weeks 1–5 in one real app

---

> This is not a tutorial where you follow along. You build the whole thing yourself, using what you've learned. Every requirement maps to a concept from this phase.
>
> Three lenses for the project:
> - 🧑‍💻 **Developer** — architecture, widget composition, state management, navigation
> - 🎨 **Designer** — visual hierarchy, spacing, Material 3 components, UX decisions
> - 🧪 **Tester** — verification, edge cases, what can go wrong

---

## Why Your First Project Should Be Your Portfolio

**The portfolio/profile format** was codified by LinkedIn (2003) and adapted to mobile by apps like Behance, Dribbble, and LinkedIn itself. A mobile profile is the 2024 equivalent of the 2001 personal website: photo, skills, work, contact. Every developer has seen dozens of them. That familiarity is a feature — you can evaluate your own work against a clear mental model.

The reason this is Week 6's project instead of a "Todo App": a portfolio requires all five Phase 1 concepts simultaneously:
- **Dart fundamentals** → your data models (`Project`, `Skill`, `Experience`)
- **Flutter core concepts** → widget composition (the header, the skills list, the work grid)
- **Widget lifecycle** → `AnimationController` in `initState`, disposed in `dispose`
- **Layout and constraints** → the collapsing header, the skill progress bars
- **Navigation and state** → tab navigation, the contact action sheet

A Todo App exercises none of the UI challenge. A portfolio does. And when you finish, you have a real thing to show someone.

---

## Project Brief

> 📄 **Flutter Docs:**
> *"Building a layout in Flutter means composing widgets. Widgets describe what their view should look like given their current configuration and state."*

You are building a **Personal Profile App** — the mobile equivalent of a portfolio website. It has three screens, persistent tab navigation, and real interaction. Build it like you'd actually show it to someone.

**Who uses it:** Recruiters, collaborators, or anyone you'd share a portfolio link with.

---

## What You're Building

```
┌─────────────────────────────────────┐
│  BottomNavigation                   │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │About │  │Skills│  │Work  │     │
│  └──────┘  └──────┘  └──────┘     │
└─────────────────────────────────────┘

ABOUT TAB:
  ┌──────────────────────────────┐
  │ [Hero Image - blurred bg]   │
  │   [Avatar - circular]       │
  │   Name          Role        │
  │   Location  ·  GitHub icon  │
  │ ─────────────────────────── │
  │  98 Projects  12 Repos  4yr │
  │ ─────────────────────────── │
  │  About Me                   │
  │  "I'm a Flutter developer..."│
  │ ─────────────────────────── │
  │  Contact                    │
  │  [Email] [LinkedIn] [GitHub]│
  └──────────────────────────────┘

SKILLS TAB:
  ┌──────────────────────────────┐
  │  Skills                     │
  │  [Filter: All] [Mobile] [Web]│
  │                             │
  │  Flutter        ████████░░  │
  │  Dart           ███████░░░  │
  │  Firebase       █████░░░░░  │
  │  ...                        │
  └──────────────────────────────┘

WORK TAB:
  ┌──────────────────────────────┐
  │  Projects  [Sort ▼]         │
  │                             │
  │  ┌────────────────────────┐ │
  │  │  [Project Thumbnail]   │ │
  │  │  App Name              │ │
  │  │  Flutter · Firebase    │ │
  │  │  "Description..."      │ │
  │  └────────────────────────┘ │
  │  ┌────────────────────────┐ │
  │  │  ...                   │ │
  │  └────────────────────────┘ │
  │                             │
  │  Tap card → Detail Screen   │
  └──────────────────────────────┘

PROJECT DETAIL SCREEN (navigated to from Work tab):
  ┌──────────────────────────────┐
  │  ← Back         ⭐ Favourite │
  │  [Full-width hero image]    │
  │  App Name                   │
  │  Flutter · Firebase · Riverpod│
  │  "Full description..."      │
  │  Key Features               │
  │  • Offline support          │
  │  • Real-time sync           │
  │  [View on GitHub]           │
  └──────────────────────────────┘
```

---

## Data Models — Define First

> 📄 **Flutter Docs (State):**
> *"In Flutter, you separate state from the UI that displays it. Think of state as data that can be read synchronously at the time the widget is built and that might change during the lifetime of the widget."*

Start by defining your data. No UI yet. Just classes.

```dart
// lib/models/profile.dart

class Profile {
  final String name;
  final String role;
  final String location;
  final String bio;
  final String avatarUrl;
  final String heroImageUrl;
  final String githubUrl;
  final String linkedinUrl;
  final String email;
  final int projectCount;
  final int repoCount;
  final int yearsExperience;

  const Profile({
    required this.name,
    required this.role,
    required this.location,
    required this.bio,
    required this.avatarUrl,
    required this.heroImageUrl,
    required this.githubUrl,
    required this.linkedinUrl,
    required this.email,
    required this.projectCount,
    required this.repoCount,
    required this.yearsExperience,
  });
}
```

```dart
// lib/models/skill.dart

enum SkillCategory { mobile, web, backend, tools }

class Skill {
  final String name;
  final double level;        // 0.0 to 1.0
  final SkillCategory category;
  final String iconPath;     // asset path

  const Skill({
    required this.name,
    required this.level,
    required this.category,
    required this.iconPath,
  });
}
```

```dart
// lib/models/project.dart

class Project {
  final String id;
  final String name;
  final String description;
  final String fullDescription;
  final String thumbnailUrl;
  final String heroImageUrl;
  final List<String> techStack;
  final List<String> features;
  final String? githubUrl;
  final bool isFavourite;    // mutable — user can star projects

  const Project({
    required this.id,
    required this.name,
    required this.description,
    required this.fullDescription,
    required this.thumbnailUrl,
    required this.heroImageUrl,
    required this.techStack,
    required this.features,
    this.githubUrl,
    this.isFavourite = false,
  });

  Project copyWith({bool? isFavourite}) {
    return Project(
      id: id,
      name: name,
      description: description,
      fullDescription: fullDescription,
      thumbnailUrl: thumbnailUrl,
      heroImageUrl: heroImageUrl,
      techStack: techStack,
      features: features,
      githubUrl: githubUrl,
      isFavourite: isFavourite ?? this.isFavourite,
    );
  }
}
```

**Rule:** Define models before UI. Models are the source of truth. UI reads from them; state management writes to them. `copyWith` lets you create updated versions without mutation.

---

## Seed Data — Use Realistic Content

```dart
// lib/data/seed_data.dart

final sampleProfile = Profile(
  name: 'Harsha Alasai',
  role: 'Flutter Developer',
  location: 'Hyderabad, India',
  bio: 'Building production-grade Flutter apps with a focus on performance and clean architecture. '
       'Passionate about cross-platform development and Material Design.',
  avatarUrl: 'assets/images/avatar.jpg',  // add a real image to assets/
  heroImageUrl: 'assets/images/hero_bg.jpg',
  githubUrl: 'https://github.com/yourusername',
  linkedinUrl: 'https://linkedin.com/in/yourname',
  email: 'alasaiharsha@gmail.com',
  projectCount: 12,
  repoCount: 34,
  yearsExperience: 2,
);

final sampleSkills = [
  const Skill(name: 'Flutter', level: 0.85, category: SkillCategory.mobile, iconPath: 'assets/icons/flutter.png'),
  const Skill(name: 'Dart', level: 0.80, category: SkillCategory.mobile, iconPath: 'assets/icons/dart.png'),
  const Skill(name: 'Firebase', level: 0.70, category: SkillCategory.backend, iconPath: 'assets/icons/firebase.png'),
  const Skill(name: 'Riverpod', level: 0.65, category: SkillCategory.mobile, iconPath: 'assets/icons/dart.png'),
  const Skill(name: 'React', level: 0.50, category: SkillCategory.web, iconPath: 'assets/icons/react.png'),
  const Skill(name: 'Git', level: 0.80, category: SkillCategory.tools, iconPath: 'assets/icons/git.png'),
];

final sampleProjects = [
  Project(
    id: '1',
    name: 'Notes App',
    description: 'Offline-first notes with Firebase sync',
    fullDescription: 'A production-grade notes application built with Flutter and Firebase. '
                     'Features offline support using Hive, real-time sync when connected, '
                     'rich text editing, tag-based organization, and end-to-end encryption.',
    thumbnailUrl: 'assets/images/notes_thumb.jpg',
    heroImageUrl: 'assets/images/notes_hero.jpg',
    techStack: ['Flutter', 'Firebase', 'Riverpod', 'Hive'],
    features: ['Offline support', 'Real-time sync', 'Rich text editor', 'Tag filtering'],
    githubUrl: 'https://github.com/yourusername/notes-app',
  ),
  Project(
    id: '2',
    name: 'Expense Tracker',
    description: 'Personal finance tracking with charts',
    fullDescription: 'Track daily expenses and income with beautiful charts. '
                     'Built with fl_chart for visualizations and Riverpod for state management.',
    thumbnailUrl: 'assets/images/expense_thumb.jpg',
    heroImageUrl: 'assets/images/expense_hero.jpg',
    techStack: ['Flutter', 'SQLite', 'fl_chart'],
    features: ['Monthly reports', 'Category breakdown', 'CSV export', 'Budget alerts'],
  ),
];
```

---

## App Architecture — File Structure

```
lib/
├── main.dart
├── models/
│   ├── profile.dart
│   ├── skill.dart
│   └── project.dart
├── data/
│   └── seed_data.dart
├── screens/
│   ├── main_screen.dart          ← hosts IndexedStack + BottomNav
│   ├── about/
│   │   └── about_tab.dart
│   ├── skills/
│   │   └── skills_tab.dart
│   ├── work/
│   │   ├── work_tab.dart
│   │   └── project_detail_screen.dart
├── widgets/
│   ├── stat_card.dart
│   ├── skill_bar.dart
│   ├── project_card.dart
│   └── tech_chip.dart
└── theme/
    └── app_theme.dart
```

🎨 **Designer:** This structure follows "feature folders" — every screen has its own folder with its widgets. As the app grows, you won't have a flat list of 40 files in one folder.

---

## Step 1 — App Theme

```dart
// lib/theme/app_theme.dart

import 'package:flutter/material.dart';

class AppTheme {
  static const _seed = Color(0xFF6750A4);  // Material 3 purple

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _seed,
        brightness: Brightness.light,
      ),
      textTheme: const TextTheme(
        displaySmall: TextStyle(fontWeight: FontWeight.w700),
        titleLarge: TextStyle(fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(height: 1.6),
      ),
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _seed,
        brightness: Brightness.dark,
      ),
    );
  }
}
```

```dart
// lib/main.dart

import 'package:flutter/material.dart';
import 'screens/main_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const ProfileApp());
}

class ProfileApp extends StatelessWidget {
  const ProfileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Profile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      home: const MainScreen(),
    );
  }
}
```

---

## Step 2 — Main Screen With Tab Navigation

```dart
// lib/screens/main_screen.dart

import 'package:flutter/material.dart';
import '../data/seed_data.dart';
import '../models/project.dart';
import 'about/about_tab.dart';
import 'skills/skills_tab.dart';
import 'work/work_tab.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  // Projects list lives here — shared across tabs
  // (WorkTab displays them, favouriting updates this list)
  List<Project> _projects = List.from(sampleProjects);

  void _toggleFavourite(String projectId) {
    setState(() {
      _projects = _projects.map((p) {
        if (p.id == projectId) return p.copyWith(isFavourite: !p.isFavourite);
        return p;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // IndexedStack keeps all three tabs alive
      // — switching tabs is instant, no rebuild, no scroll reset
      body: IndexedStack(
        index: _currentIndex,
        children: [
          AboutTab(profile: sampleProfile),
          SkillsTab(skills: sampleSkills),
          WorkTab(
            projects: _projects,
            onToggleFavourite: _toggleFavourite,
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'About',
          ),
          NavigationDestination(
            icon: Icon(Icons.code_outlined),
            selectedIcon: Icon(Icons.code),
            label: 'Skills',
          ),
          NavigationDestination(
            icon: Icon(Icons.work_outline),
            selectedIcon: Icon(Icons.work),
            label: 'Work',
          ),
        ],
      ),
    );
  }
}
```

🧑‍💻 **Developer:** Notice `_projects` and `_toggleFavourite` live in `MainScreen` — the parent. This is "lifting state up" from Week 5. WorkTab receives them as constructor parameters. If you favourited a project but the state lived inside WorkTab, navigating away from the tab and back would reset the state. With `IndexedStack` that wouldn't happen, but keeping shared state in the parent is the correct architectural pattern regardless.

---

## Step 3 — About Tab

```dart
// lib/screens/about/about_tab.dart

import 'package:flutter/material.dart';
import '../../models/profile.dart';
import '../../widgets/stat_card.dart';

class AboutTab extends StatelessWidget {
  final Profile profile;
  const AboutTab({super.key, required this.profile});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 280,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                // Hero background image with blur effect
                Image.asset(
                  profile.heroImageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => ColoredBox(
                    color: colorScheme.primaryContainer,
                  ),
                ),
                // Dark gradient so text is readable over the image
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Color(0xCC000000),
                      ],
                    ),
                  ),
                ),
                // Name and role over the gradient
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile.name,
                        style: theme.textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        profile.role,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Avatar floats over the SliverAppBar
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(40),
            child: Transform.translate(
              offset: const Offset(0, 40),
              child: CircleAvatar(
                radius: 44,
                backgroundColor: colorScheme.surface,
                child: CircleAvatar(
                  radius: 40,
                  backgroundImage: AssetImage(profile.avatarUrl),
                  onBackgroundImageError: (_, __) {},
                  child: Icon(Icons.person, size: 40, color: colorScheme.onSurface),
                ),
              ),
            ),
          ),
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 56, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Location row
                Row(
                  children: [
                    Icon(Icons.location_on_outlined, size: 16, color: colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text(profile.location, style: theme.textTheme.bodyMedium),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.code),
                      tooltip: 'GitHub',
                      onPressed: () {/* open URL */},
                    ),
                    IconButton(
                      icon: const Icon(Icons.link),
                      tooltip: 'LinkedIn',
                      onPressed: () {/* open URL */},
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Stats row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    StatCard(value: profile.projectCount.toString(), label: 'Projects'),
                    _VerticalDivider(),
                    StatCard(value: profile.repoCount.toString(), label: 'Repos'),
                    _VerticalDivider(),
                    StatCard(value: '${profile.yearsExperience}yr', label: 'Experience'),
                  ],
                ),

                const SizedBox(height: 28),
                const Divider(),
                const SizedBox(height: 20),

                // About section
                Text('About', style: theme.textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(profile.bio, style: theme.textTheme.bodyLarge),

                const SizedBox(height: 28),
                const Divider(),
                const SizedBox(height: 20),

                // Contact section
                Text('Contact', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                _ContactTile(
                  icon: Icons.email_outlined,
                  label: profile.email,
                  onTap: () {/* launch mailto */},
                ),
                _ContactTile(
                  icon: Icons.link,
                  label: 'LinkedIn',
                  onTap: () {/* open URL */},
                ),
                _ContactTile(
                  icon: Icons.code,
                  label: 'GitHub',
                  onTap: () {/* open URL */},
                ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: VerticalDivider(width: 1, color: Theme.of(context).dividerColor),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ContactTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon),
      title: Text(label),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14),
      onTap: onTap,
    );
  }
}
```

---

## Step 4 — Shared Widgets

```dart
// lib/widgets/stat_card.dart

import 'package:flutter/material.dart';

class StatCard extends StatelessWidget {
  final String value;
  final String label;

  const StatCard({super.key, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Text(value, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 2),
        Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      ],
    );
  }
}
```

```dart
// lib/widgets/skill_bar.dart

import 'package:flutter/material.dart';
import '../models/skill.dart';

class SkillBar extends StatelessWidget {
  final Skill skill;
  const SkillBar({super.key, required this.skill});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(skill.name, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
              Text('${(skill.level * 100).round()}%',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: skill.level,
              minHeight: 8,
              backgroundColor: colorScheme.surfaceVariant,
              valueColor: AlwaysStoppedAnimation<Color>(colorScheme.primary),
            ),
          ),
        ],
      ),
    );
  }
}
```

```dart
// lib/widgets/tech_chip.dart

import 'package:flutter/material.dart';

class TechChip extends StatelessWidget {
  final String label;
  const TechChip({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      visualDensity: VisualDensity.compact,
      side: BorderSide.none,
      backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
    );
  }
}
```

```dart
// lib/widgets/project_card.dart

import 'package:flutter/material.dart';
import '../models/project.dart';
import 'tech_chip.dart';

class ProjectCard extends StatelessWidget {
  final Project project;
  final VoidCallback onTap;
  final VoidCallback onToggleFavourite;

  const ProjectCard({
    super.key,
    required this.project,
    required this.onTap,
    required this.onToggleFavourite,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,  // thumbnail respects card border radius
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.asset(
                project.thumbnailUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => ColoredBox(
                  color: theme.colorScheme.primaryContainer,
                  child: Icon(Icons.image, size: 40, color: theme.colorScheme.onPrimaryContainer),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(project.name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                      ),
                      IconButton(
                        icon: Icon(
                          project.isFavourite ? Icons.star : Icons.star_border,
                          color: project.isFavourite ? Colors.amber : null,
                        ),
                        onPressed: onToggleFavourite,
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(project.description, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: project.techStack.map((t) => TechChip(label: t)).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## Step 5 — Skills Tab With Filter

```dart
// lib/screens/skills/skills_tab.dart

import 'package:flutter/material.dart';
import '../../models/skill.dart';
import '../../widgets/skill_bar.dart';

class SkillsTab extends StatefulWidget {
  final List<Skill> skills;
  const SkillsTab({super.key, required this.skills});

  @override
  State<SkillsTab> createState() => _SkillsTabState();
}

class _SkillsTabState extends State<SkillsTab> {
  SkillCategory? _selectedCategory;  // null = All

  List<Skill> get _filteredSkills {
    if (_selectedCategory == null) return widget.skills;
    return widget.skills.where((s) => s.category == _selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          title: const Text('Skills'),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(52),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _FilterChip(
                    label: 'All',
                    isSelected: _selectedCategory == null,
                    onSelected: () => setState(() => _selectedCategory = null),
                  ),
                  ...SkillCategory.values.map((cat) => _FilterChip(
                    label: cat.name[0].toUpperCase() + cat.name.substring(1),
                    isSelected: _selectedCategory == cat,
                    onSelected: () => setState(() => _selectedCategory = cat),
                  )),
                ],
              ),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => SkillBar(skill: _filteredSkills[index]),
              childCount: _filteredSkills.length,
            ),
          ),
        ),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onSelected;

  const _FilterChip({required this.label, required this.isSelected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onSelected(),
        showCheckmark: false,
      ),
    );
  }
}
```

---

## Step 6 — Work Tab and Project Detail

```dart
// lib/screens/work/work_tab.dart

import 'package:flutter/material.dart';
import '../../models/project.dart';
import '../../widgets/project_card.dart';
import 'project_detail_screen.dart';

class WorkTab extends StatelessWidget {
  final List<Project> projects;
  final void Function(String projectId) onToggleFavourite;

  const WorkTab({
    super.key,
    required this.projects,
    required this.onToggleFavourite,
  });

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        const SliverAppBar(pinned: true, title: Text('Work')),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final project = projects[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: ProjectCard(
                    project: project,
                    onToggleFavourite: () => onToggleFavourite(project.id),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ProjectDetailScreen(project: project),
                      ),
                    ),
                  ),
                );
              },
              childCount: projects.length,
            ),
          ),
        ),
      ],
    );
  }
}
```

```dart
// lib/screens/work/project_detail_screen.dart

import 'package:flutter/material.dart';
import '../../models/project.dart';
import '../../widgets/tech_chip.dart';

class ProjectDetailScreen extends StatelessWidget {
  final Project project;
  const ProjectDetailScreen({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(project.name),
              background: Image.asset(
                project.heroImageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => ColoredBox(
                  color: theme.colorScheme.primaryContainer,
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 6,
                    children: project.techStack.map((t) => TechChip(label: t)).toList(),
                  ),
                  const SizedBox(height: 20),
                  Text('About', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(project.fullDescription, style: theme.textTheme.bodyLarge),
                  const SizedBox(height: 24),
                  Text('Key Features', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 8),
                  ...project.features.map((f) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.check_circle_outline, size: 18, color: theme.colorScheme.primary),
                        const SizedBox(width: 8),
                        Expanded(child: Text(f, style: theme.textTheme.bodyMedium)),
                      ],
                    ),
                  )),
                  if (project.githubUrl != null) ...[
                    const SizedBox(height: 32),
                    FilledButton.icon(
                      icon: const Icon(Icons.code),
                      label: const Text('View on GitHub'),
                      onPressed: () {/* launch url */},
                    ),
                  ],
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## Concepts Exercised — Checklist

Every concept from Phase 1 appears in this project:

| Concept | Where |
|---------|-------|
| `StatelessWidget` | `AboutTab`, `ProjectCard`, `TechChip`, `StatCard` |
| `StatefulWidget` | `MainScreen` (tab index + projects list), `SkillsTab` (filter) |
| `setState` | `_toggleFavourite`, filter selection |
| `BuildContext` for `Theme.of()` | Every widget uses `Theme.of(context)` |
| Widget lifecycle | `MainScreen` — `IndexedStack` children built once, persist |
| `BoxConstraints` / Layout | `Column`, `Row`, `Expanded`, `SliverAppBar`, `AspectRatio`, `Stack` |
| `Navigator.push` | WorkTab → ProjectDetailScreen |
| Constructor data passing | `Profile`, `Skill`, `Project` passed from parent to child everywhere |
| Lifting state up | `_projects` and `_toggleFavourite` in `MainScreen`, passed down |
| `IndexedStack` | `MainScreen` — preserves tab state |
| `CustomScrollView` / Slivers | `AboutTab`, `SkillsTab`, `WorkTab` all use `SliverAppBar` |

---

## Week 6 Verify — Project Self-Review

Answer these before marking the project done:

1. Why does `_projects` live in `MainScreen` instead of `WorkTab`? What would break if it lived in `WorkTab`?
2. What does `project.copyWith(isFavourite: !p.isFavourite)` do differently than `p.isFavourite = true`? Why does it matter?
3. Why does `AboutTab` use `CustomScrollView` + `SliverAppBar` instead of a simple `Scaffold` + `AppBar`? What does the user experience differently?
4. The `ProjectCard` takes `onToggleFavourite` as a `VoidCallback`. Trace the call: user taps the star → what runs → in which class → what changes → which widget rebuilds?
5. In `SkillsTab`, `_filteredSkills` is a getter (not a field). Why is this better than storing the filtered list in `setState`?
6. If you remove `const` from `StatCard` construction inside `AboutTab` — what changes at runtime? Would the user notice?
7. What would happen if you used a regular `ListView` in `AboutTab` inside a `Column` without any height constraint?

---

**Want to actually get fluent, not just informed?** → [Profile App Challenges](Week_06b_ProfileApp_Challenges.md) — extend, break, and stress-test the actual app you just built.

**Phase 1 Complete.** You now have the foundations. Next phase covers the widget toolkit — deep dives into every widget category Flutter offers.

**Next → [Phase 2 Overview: Core UI Mastery](../Phase_2_Core_UI/Phase_2_Overview.md)**
