# Week 4 — Project: Personal Profile App
### Phase 1, Month 1 | Your first complete Flutter app

---

## Project Brief

You are building your own personal profile app — the mobile equivalent of a portfolio website. This isn't a toy tutorial. Build it like you'd actually ship it.

**Target audience:** Recruiters, collaborators, and anyone you'd share your portfolio with.

**Core value:** Someone opens this app and in under 30 seconds knows who you are, what you build, and how to reach you.

---

## Screens

### Screen 1: Splash Screen
Auto-transitions to Home after 2 seconds.

**What it shows:**
- Your initials or name in large animated text (fade in)
- A subtle background gradient or pattern
- Your tagline in smaller text below

**Behavior:**
- Uses `Future.delayed` to auto-navigate after 2 seconds
- No back button (removes itself from the navigation stack)

---

### Screen 2: Home / Profile Screen
The main screen. Everything important lives here.

**Layout (top to bottom):**
```
┌─────────────────────────────────┐
│  [gradient header band]         │
│                                 │
│        [circular photo]         │
│        Harsha                   │
│        Flutter Developer        │
│   📍 Hyderabad, India          │
├─────────────────────────────────┤
│                                 │
│  ── About ──────────────────    │
│  A passionate developer who...  │
│                                 │
│  ── Stats ──────────────────    │
│  [Projects: 12] [Skills: 8]     │
│                                 │
│  ── Find Me ────────────────    │
│  [GitHub] [LinkedIn] [Twitter]  │
│                                 │
└─────────────────────────────────┘
```

**Key UI details:**
- The header band is a `Container` with a gradient (`LinearGradient`)
- The circular photo overlaps the header and body sections (`Stack` with `Positioned`)
- Social icons are tappable (use `url_launcher` package to open links)
- Stats row uses `Expanded` widgets to distribute evenly

---

### Screen 3: Skills Screen
Reached via bottom navigation or a button from Home.

**Layout:**
```
AppBar: "Skills & Tools"

Skill Categories:
  Frontend
    Flutter          ████████░░  80%
    Dart             ███████░░░  70%
    React            █████░░░░░  50%

  Backend
    Java             ██████░░░░  60%
    Spring Boot      █████░░░░░  50%
    SQL              ████████░░  80%

  Tools
    Git              █████████░  90%
    VS Code          █████████░  90%
    Figma            ████░░░░░░  40%
```

**Technical implementation:**
- Each skill is a custom `SkillBar` widget that takes `name`, `percentage`, and `color`
- The bar animates from 0 to `percentage` when the screen loads (`AnimationController`)
- Categories are separated by section headers
- The whole thing is scrollable

---

### Screen 4: Projects Screen
A scrollable feed of your projects.

**Each project card shows:**
- Project screenshot or icon
- Project name (bold)
- Short description (2 lines, truncated)
- Tech stack chips (Flutter, Firebase, Dart)
- GitHub icon (links to repo)
- "View" button

**Behavior:**
- Tapping "View" opens a Project Detail bottom sheet
- The bottom sheet shows: full description, all features, links, and a screen count

---

### Screen 5: Contact Screen
Simple, functional, clean.

**Layout:**
```
AppBar: "Get In Touch"

"I'm always open to interesting projects and conversations."

[Email card]     → opens mail app
[WhatsApp card]  → opens WhatsApp
[LinkedIn card]  → opens LinkedIn

[Message Form]
  Name field
  Email field
  Message field
  Send button → shows confirmation Snackbar
```

---

## Data Model

Define these Dart classes before building any UI:

```dart
class UserProfile {
  final String name;
  final String title;
  final String location;
  final String bio;
  final String? photoUrl;
  final List<SocialLink> socialLinks;
  final List<SkillCategory> skillCategories;
  final List<Project> projects;

  const UserProfile({
    required this.name,
    required this.title,
    required this.location,
    required this.bio,
    this.photoUrl,
    required this.socialLinks,
    required this.skillCategories,
    required this.projects,
  });
}

class Skill {
  final String name;
  final double percentage; // 0.0 to 1.0
  final Color color;
  const Skill({required this.name, required this.percentage, required this.color});
}

class SkillCategory {
  final String name;
  final List<Skill> skills;
  const SkillCategory({required this.name, required this.skills});
}

class Project {
  final String name;
  final String shortDescription;
  final String fullDescription;
  final List<String> techStack;
  final String? imageUrl;
  final String? githubUrl;
  const Project({ /* all fields required */ });
}

class SocialLink {
  final String platform;
  final String url;
  final IconData icon;
  final Color color;
  const SocialLink({ /* all fields required */ });
}
```

---

## Navigation Structure

```
SplashScreen
    ↓ (auto after 2s, replace splash)
MainScreen (BottomNavigationBar)
    ├── HomeTab
    │     └── (no sub-navigation, just scroll)
    ├── SkillsTab
    │     └── (no sub-navigation, just scroll)
    ├── ProjectsTab
    │     └── ProjectDetailBottomSheet (slides up)
    └── ContactTab
          └── (no sub-navigation)
```

---

## Theme Specification

Build your own design system. Here's a starter you should customize:

```dart
ThemeData get appTheme => ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF6C5CE7), // your brand color
    brightness: Brightness.dark,
  ),
  useMaterial3: true,
  scaffoldBackgroundColor: const Color(0xFF0F0F1E),
  cardTheme: CardTheme(
    color: const Color(0xFF1A1A2E),
    elevation: 0,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
  ),
  textTheme: const TextTheme(
    displayLarge: TextStyle(
      fontFamily: 'Poppins',
      fontWeight: FontWeight.bold,
      color: Colors.white,
    ),
    // define all levels
  ),
);
```

Add a custom font: put Poppins in your `assets/fonts/` folder and declare it in `pubspec.yaml`:
```yaml
flutter:
  fonts:
    - family: Poppins
      fonts:
        - asset: assets/fonts/Poppins-Regular.ttf
        - asset: assets/fonts/Poppins-Bold.ttf
          weight: 700
```

---

## Packages to Add

Add these to `pubspec.yaml` under `dependencies`:

```yaml
url_launcher: ^6.3.0     # open URLs, email, phone
google_fonts: ^6.1.0     # Google Fonts without downloading manually
```

Run `flutter pub get` after adding.

**Using google_fonts (alternative to local fonts):**
```dart
import 'package:google_fonts/google_fonts.dart';

TextStyle myStyle = GoogleFonts.poppins(
  fontSize: 24,
  fontWeight: FontWeight.bold,
  color: Colors.white,
);
```

---

## Animated Skill Bar (Build This Yourself)

This is your first custom animated widget:

```dart
class SkillBar extends StatefulWidget {
  final String name;
  final double percentage;
  final Color color;

  const SkillBar({
    super.key,
    required this.name,
    required this.percentage,
    required this.color,
  });

  @override
  State<SkillBar> createState() => _SkillBarState();
}

class _SkillBarState extends State<SkillBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _animation = Tween<double>(
      begin: 0.0,
      end: widget.percentage,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    _controller.forward(); // start animation when widget appears
  }

  @override
  void dispose() {
    _controller.dispose(); // always dispose animation controllers
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(widget.name, style: const TextStyle(color: Colors.white70)),
            AnimatedBuilder(
              animation: _animation,
              builder: (_, __) => Text(
                '${(_animation.value * 100).toInt()}%',
                style: TextStyle(color: widget.color, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        AnimatedBuilder(
          animation: _animation,
          builder: (_, __) => ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _animation.value,
              backgroundColor: Colors.white12,
              valueColor: AlwaysStoppedAnimation<Color>(widget.color),
              minHeight: 8,
            ),
          ),
        ),
      ],
    );
  }
}
```

---

## Build Order (Follow This Sequence)

1. Create all data classes and fill in your actual data
2. Set up `MaterialApp` with theme, bottom nav routing, and 4 tab widgets (just placeholders)
3. Build `SplashScreen` (auto-navigation, animation)
4. Build `HomeTab` (profile header, about, stats, social links)
5. Build `SkillsTab` (SkillBar widget + categories)
6. Build `ProjectsTab` (project cards + detail bottom sheet)
7. Build `ContactTab` (contact cards + message form)
8. Add `url_launcher` to social links and contact cards
9. Polish: consistent spacing, working back navigation, no overflow errors

---

## Stretch Goals (Do These After Core App Works)

- [ ] Add a dark/light mode toggle in the AppBar
- [ ] Add a splash animation using `AnimatedOpacity` or `TweenAnimationBuilder`
- [ ] Make the profile photo hero-animate into a full-screen view when tapped
- [ ] Add a "Download CV" button that opens a PDF URL
- [ ] Make the skills screen respond to scroll position (skills animate in when they become visible — look up `VisibilityDetector` package)

---

## Submission Checklist

Before you call this project done:

- [ ] All 4 tabs work without crashes
- [ ] Navigation back from any screen works correctly
- [ ] No text overflow (RenderFlex errors)
- [ ] App works in both portrait and landscape without layout breaks
- [ ] Social links open actual URLs
- [ ] The app compiles and runs without warnings in `flutter analyze`
- [ ] Code is organized: widgets in separate files, data in a separate file
- [ ] Git committed with a meaningful message

---

## Reflection Questions (Write Down Your Answers)

After completing the project:
1. Where did you spend the most time — and why?
2. What widget took you longest to understand?
3. What would you build differently knowing what you know now?
4. What feature were you most proud of?

These answers are your learning data. They tell you what to focus on in Phase 2.

---

**Phase 1 Complete. Next → [Phase 2: Core UI Mastery](../Phase_2_Core_UI/Phase_2_Overview.md)**
