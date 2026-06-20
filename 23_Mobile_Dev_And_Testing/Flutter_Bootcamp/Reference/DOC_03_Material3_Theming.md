# Material 3 Theming — Complete Reference
### Color systems, typography scales, component themes — the full picture

---

## Why Theming Matters

Without theming, you hard-code `Colors.blue` everywhere. When the design changes, you change 47 files. With proper theming, you change one place and the entire app updates.

Flutter's Material 3 design system gives you:
- A color system with 30+ named color roles
- A type scale with 15 named text styles
- Component themes that override individual widget defaults

---

## The Minimal Theme Setup

```dart
MaterialApp(
  theme: ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFF1565C0),  // your brand color
      brightness: Brightness.light,
    ),
  ),
  darkTheme: ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFF1565C0),
      brightness: Brightness.dark,
    ),
  ),
  themeMode: ThemeMode.system,  // follows device setting
  home: const HomeScreen(),
)
```

`ColorScheme.fromSeed()` takes your brand color and generates a full harmonious palette using the Material You algorithm. You get light and dark variants, accessible contrast ratios, and all 30 color roles — automatically.

---

## The Material 3 Color System

Material 3 defines **color roles** — semantic names for colors. You use the role name, not a hex value, so the UI adapts automatically between light and dark mode.

```dart
// Access the color scheme anywhere
final cs = Theme.of(context).colorScheme;

// Then use cs.primary instead of Colors.blue
// — it's automatically correct for light and dark mode
```

### The Color Roles Explained

```
PRIMARY GROUP — your main brand color
────────────────────────────────────
primary          → filled buttons, selected tab indicator, key icons
onPrimary        → text/icons ON TOP of primary-colored surfaces
primaryContainer → lighter version of primary (chip backgrounds, selections)
onPrimaryContainer → text on primaryContainer

SECONDARY GROUP — accent color (auto-generated from seed)
──────────────────────────────────────────────────────────
secondary        → secondary buttons, badges
onSecondary      → text/icons on secondary
secondaryContainer → chip labels, toggles
onSecondaryContainer → text on secondaryContainer

TERTIARY GROUP — complementary accent
──────────────────────────────────────
tertiary / onTertiary / tertiaryContainer / onTertiaryContainer

ERROR GROUP — warnings and errors
──────────────────────────────────
error            → error icons, error borders
onError          → text on error-colored things
errorContainer   → error message background
onErrorContainer → text in error container

SURFACE GROUP — backgrounds
────────────────────────────
surface          → main screen background (replaces background in M3)
onSurface        → text and icons on surface (replaces onBackground)
surfaceVariant   → slightly different surface (search bars, cards)
onSurfaceVariant → secondary text on surface
surfaceContainerLowest  → cards in light mode (slightly off-white)
surfaceContainerLow     → cards with low elevation
surfaceContainer        → mid-level surfaces
surfaceContainerHigh    → elevated surfaces (bottom sheets)
surfaceContainerHighest → highest elevation
inverseSurface       → dark surface in light mode (for snack bars)
inverseOnSurface     → text on inverseSurface

OUTLINE GROUP — borders
────────────────────────
outline          → text field borders, dividers
outlineVariant   → subtle dividers, inactive borders

MISC
────
shadow          → shadow color
scrim           → modal overlay color
```

### Using Color Roles in Practice

```dart
// Correct — uses semantic color roles
AppBar(
  backgroundColor: Theme.of(context).colorScheme.surface,
  foregroundColor: Theme.of(context).colorScheme.onSurface,
)

// Correct — primary action is "primary"
ElevatedButton.styleFrom(
  backgroundColor: colorScheme.primary,
  foregroundColor: colorScheme.onPrimary,
)

// Correct — container variant for subtle emphasis
Chip(
  backgroundColor: colorScheme.secondaryContainer,
  label: Text(tag, style: TextStyle(color: colorScheme.onSecondaryContainer)),
)

// Anti-pattern — hard-coded color breaks dark mode
AppBar(backgroundColor: Colors.blue)  // DON'T do this
```

---

## Custom ColorScheme — Full Control

When `fromSeed()` isn't enough, define every role manually:

```dart
const lightColorScheme = ColorScheme(
  brightness: Brightness.light,
  primary: Color(0xFF1565C0),
  onPrimary: Color(0xFFFFFFFF),
  primaryContainer: Color(0xFFD6E4FF),
  onPrimaryContainer: Color(0xFF001B3D),
  secondary: Color(0xFF0288D1),
  onSecondary: Color(0xFFFFFFFF),
  secondaryContainer: Color(0xFFC9E8FF),
  onSecondaryContainer: Color(0xFF001E30),
  tertiary: Color(0xFF7C4DFF),
  onTertiary: Color(0xFFFFFFFF),
  tertiaryContainer: Color(0xFFE9DDFF),
  onTertiaryContainer: Color(0xFF22005D),
  error: Color(0xFFBA1A1A),
  onError: Color(0xFFFFFFFF),
  errorContainer: Color(0xFFFFDAD6),
  onErrorContainer: Color(0xFF410002),
  surface: Color(0xFFF8FDFF),
  onSurface: Color(0xFF001F25),
  surfaceVariant: Color(0xFFDCE4E9),
  onSurfaceVariant: Color(0xFF40484C),
  outline: Color(0xFF70787D),
  outlineVariant: Color(0xFFC0C8CD),
  shadow: Color(0xFF000000),
  scrim: Color(0xFF000000),
  inverseSurface: Color(0xFF00363F),
  onInverseSurface: Color(0xFFD6F6FF),
  inversePrimary: Color(0xFFAAC7FF),
);
```

---

## Typography — The Text Theme

Material 3 defines 15 text styles organized by scale:

```
Display — largest text, used sparingly (hero text, big numbers)
────────────────────────────────────────────────────────────────
displayLarge    → 57sp, weight 400 — massive hero text
displayMedium   → 45sp, weight 400 — large titles
displaySmall    → 36sp, weight 400 — page headings

Headline — prominent but smaller than display
──────────────────────────────────────────────
headlineLarge   → 32sp, weight 400 — section titles
headlineMedium  → 28sp, weight 400 — card titles
headlineSmall   → 24sp, weight 400 — dialog titles

Title — component titles
─────────────────────────
titleLarge    → 22sp, weight 400 — AppBar title
titleMedium   → 16sp, weight 500 — list tile titles
titleSmall    → 14sp, weight 500 — chip labels

Body — reading text
────────────────────
bodyLarge    → 16sp, weight 400 — paragraph text
bodyMedium   → 14sp, weight 400 — body text, captions
bodySmall    → 12sp, weight 400 — supporting text

Label — compact labels (buttons, tabs, form fields)
────────────────────────────────────────────────────
labelLarge   → 14sp, weight 500 — button text
labelMedium  → 12sp, weight 500 — navigation labels
labelSmall   → 11sp, weight 500 — overlines, tags
```

### Using Text Styles

```dart
// Use theme styles — adapts to user font size preferences
Text(
  'Product Name',
  style: Theme.of(context).textTheme.titleMedium,
)

// Common abbreviation
final tt = Theme.of(context).textTheme;
Text('Hello', style: tt.headlineMedium)
Text('Description', style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant))
```

### Custom Text Theme

```dart
ThemeData(
  textTheme: TextTheme(
    displayLarge: GoogleFonts.playfairDisplay(fontSize: 57, fontWeight: FontWeight.w300),
    headlineLarge: GoogleFonts.playfairDisplay(fontSize: 32),
    titleMedium: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
    bodyLarge: GoogleFonts.inter(fontSize: 16, height: 1.5),
    bodyMedium: GoogleFonts.inter(fontSize: 14, height: 1.5),
    labelLarge: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: 0.5),
  ),
)
```

**Package:** `google_fonts` — `flutter pub add google_fonts`

```dart
// Access any Google Font
GoogleFonts.roboto(fontSize: 16)
GoogleFonts.inter(fontWeight: FontWeight.bold)

// Use a Google Font for entire app (efficient — downloads once, uses memory font)
ThemeData(
  textTheme: GoogleFonts.interTextTheme(ThemeData().textTheme),
)
```

---

## Component Themes — Override Widget Defaults

Every widget in Flutter has a theme class. Set it once in `ThemeData` and all instances of that widget use it.

```dart
ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1565C0)),

  // --- Buttons ---
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    ),
  ),

  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      side: const BorderSide(width: 1.5),
    ),
  ),

  // --- Text Fields ---
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: colorScheme.surfaceVariant,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: colorScheme.primary, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: colorScheme.error, width: 1.5),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    labelStyle: TextStyle(color: colorScheme.onSurfaceVariant),
  ),

  // --- App Bar ---
  appBarTheme: AppBarTheme(
    elevation: 0,
    centerTitle: false,
    backgroundColor: colorScheme.surface,
    foregroundColor: colorScheme.onSurface,
    titleTextStyle: TextStyle(
      color: colorScheme.onSurface,
      fontSize: 20,
      fontWeight: FontWeight.w600,
    ),
  ),

  // --- Cards ---
  cardTheme: CardTheme(
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(color: colorScheme.outlineVariant),
    ),
    margin: EdgeInsets.zero,
  ),

  // --- Chips ---
  chipTheme: ChipThemeData(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    side: BorderSide.none,
    labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
  ),

  // --- Bottom Navigation Bar ---
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    type: BottomNavigationBarType.fixed,
    elevation: 0,
    backgroundColor: colorScheme.surface,
    selectedItemColor: colorScheme.primary,
    unselectedItemColor: colorScheme.onSurfaceVariant,
    selectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
  ),

  // --- Navigation Bar (M3 style) ---
  navigationBarTheme: NavigationBarThemeData(
    backgroundColor: colorScheme.surface,
    indicatorColor: colorScheme.secondaryContainer,
    labelTextStyle: MaterialStateProperty.all(
      const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
    ),
  ),

  // --- Floating Action Button ---
  floatingActionButtonTheme: FloatingActionButtonThemeData(
    backgroundColor: colorScheme.primaryContainer,
    foregroundColor: colorScheme.onPrimaryContainer,
    elevation: 2,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
  ),

  // --- Snack Bar ---
  snackBarTheme: SnackBarThemeData(
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    contentTextStyle: const TextStyle(fontSize: 14),
    actionTextColor: colorScheme.inversePrimary,
  ),

  // --- Dialogs ---
  dialogTheme: DialogTheme(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    titleTextStyle: TextStyle(
      color: colorScheme.onSurface,
      fontSize: 20,
      fontWeight: FontWeight.w600,
    ),
  ),

  // --- Dividers ---
  dividerTheme: DividerThemeData(
    color: colorScheme.outlineVariant,
    thickness: 1,
    space: 1,
  ),

  // --- List Tiles ---
  listTileTheme: const ListTileThemeData(
    contentPadding: EdgeInsets.symmetric(horizontal: 16),
    minVerticalPadding: 12,
  ),

  // --- Switches ---
  switchTheme: SwitchThemeData(
    thumbColor: MaterialStateProperty.resolveWith((states) {
      if (states.contains(MaterialState.selected)) return colorScheme.primary;
      return colorScheme.outline;
    }),
    trackColor: MaterialStateProperty.resolveWith((states) {
      if (states.contains(MaterialState.selected)) return colorScheme.primaryContainer;
      return colorScheme.surfaceVariant;
    }),
  ),

  // --- Progress Indicators ---
  progressIndicatorTheme: ProgressIndicatorThemeData(
    color: colorScheme.primary,
    linearTrackColor: colorScheme.surfaceVariant,
    linearMinHeight: 4,
    circularTrackColor: colorScheme.surfaceVariant,
  ),
)
```

---

## Accessing Theme in Widgets

```dart
// Full theme data
final theme = Theme.of(context);

// Color scheme shorthand
final cs = Theme.of(context).colorScheme;

// Text theme shorthand
final tt = Theme.of(context).textTheme;

// Check current brightness
final isDark = Theme.of(context).brightness == Brightness.dark;
```

---

## Local Theme Overrides

Override theme for a specific subtree without affecting the rest of the app:

```dart
// Override just colors for a specific section
Theme(
  data: Theme.of(context).copyWith(
    colorScheme: Theme.of(context).colorScheme.copyWith(
      primary: Colors.red,
    ),
  ),
  child: ElevatedButton(  // this button will be red
    onPressed: () {},
    child: const Text('Danger'),
  ),
)

// Override just button style for one button
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: Colors.red,
    foregroundColor: Colors.white,
  ).merge(Theme.of(context).elevatedButtonTheme.style),
  onPressed: () {},
  child: const Text('Delete'),
)
```

---

## Dynamic Theme Switching

Let users switch between light and dark (or even custom themes) at runtime:

```dart
// Using Riverpod to manage theme state
final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);

// In MaterialApp
Consumer(
  builder: (context, ref, child) {
    final themeMode = ref.watch(themeModeProvider);
    return MaterialApp(
      themeMode: themeMode,
      theme: lightTheme,
      darkTheme: darkTheme,
      home: const HomeScreen(),
    );
  },
)

// Settings screen to toggle
SegmentedButton<ThemeMode>(
  segments: const [
    ButtonSegment(value: ThemeMode.light, icon: Icon(Icons.light_mode), label: Text('Light')),
    ButtonSegment(value: ThemeMode.dark, icon: Icon(Icons.dark_mode), label: Text('Dark')),
    ButtonSegment(value: ThemeMode.system, icon: Icon(Icons.phone_android), label: Text('System')),
  ],
  selected: {ref.watch(themeModeProvider)},
  onSelectionChanged: (selection) {
    ref.read(themeModeProvider.notifier).state = selection.first;
  },
)
```

---

## Shimmer Loading (Non-Material, but Common)

Shimmer is the gray animated loading placeholder you see in apps while content loads. Not built into Flutter — use the `shimmer` package.

```dart
// pubspec.yaml: shimmer: ^3.0.0

import 'package:shimmer/shimmer.dart';

// Loading state placeholder
Shimmer.fromColors(
  baseColor: Colors.grey[300]!,
  highlightColor: Colors.grey[100]!,
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(height: 80, width: double.infinity, color: Colors.white),
      const SizedBox(height: 8),
      Container(height: 16, width: 200, color: Colors.white),
      const SizedBox(height: 4),
      Container(height: 16, width: 150, color: Colors.white),
    ],
  ),
)
```

---

## Spacing Constants — Use a Design Token System

Instead of magic numbers, define a spacing scale:

```dart
abstract class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
  static const double xxxl = 64;

  static const EdgeInsets screenPadding = EdgeInsets.all(md);
  static const EdgeInsets cardPadding = EdgeInsets.all(md);
  static const EdgeInsets listItemPadding =
      EdgeInsets.symmetric(horizontal: md, vertical: sm);
}

// Usage
Padding(
  padding: AppSpacing.screenPadding,
  child: ...,
)

SizedBox(height: AppSpacing.md)
```

```dart
abstract class AppRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double full = 100;  // pill shape

  static BorderRadius get cardRadius =>
      BorderRadius.circular(md);
  static BorderRadius get buttonRadius =>
      BorderRadius.circular(sm);
  static BorderRadius get bottomSheetRadius =>
      const BorderRadius.vertical(top: Radius.circular(xl));
}
```

---

## MediaQuery — Screen Information

```dart
// Screen size
final size = MediaQuery.of(context).size;
final width = size.width;
final height = size.height;

// Safe areas (notch, home indicator)
final padding = MediaQuery.of(context).padding;
final bottomPad = padding.bottom;  // for home indicator on iPhone

// Text scale (accessibility)
final textScale = MediaQuery.of(context).textScaleFactor;

// Orientation
final isLandscape =
    MediaQuery.of(context).orientation == Orientation.landscape;

// Keyboard visible? (height > 0 when keyboard is up)
final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
final isKeyboardVisible = keyboardHeight > 0;
```

**Avoid calling `MediaQuery.of(context)` multiple times** — use `MediaQueryData` once and read from it:

```dart
final mq = MediaQuery.of(context);
final width = mq.size.width;
final height = mq.size.height;
```

---

## Complete App Theme File

Put your theme in a separate file so it doesn't pollute `main.dart`:

```dart
// lib/core/theme/app_theme.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const _seedColor = Color(0xFF1565C0);

final lightTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: _seedColor,
    brightness: Brightness.light,
  ),
  textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  ),
  appBarTheme: const AppBarTheme(elevation: 0, centerTitle: false),
  cardTheme: CardTheme(
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
  ),
);

final darkTheme = lightTheme.copyWith(
  colorScheme: ColorScheme.fromSeed(
    seedColor: _seedColor,
    brightness: Brightness.dark,
  ),
);
```

```dart
// lib/main.dart
import 'core/theme/app_theme.dart';

MaterialApp(
  theme: lightTheme,
  darkTheme: darkTheme,
  themeMode: ThemeMode.system,
  home: const HomeScreen(),
)
```

---

**→ Related files:**
- [DOC_02_Widget_Catalog_Complete.md](DOC_02_Widget_Catalog_Complete.md) — all widgets that use these themes
- [DOC_04_BuildContext_Deep_Dive.md](DOC_04_BuildContext_Deep_Dive.md) — how `Theme.of(context)` works
