# Week 22 — Advanced Animations + CustomPainter Charts
### When widgets aren't enough: paint pixels, choreograph sequences, breathe life into data

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — Canvas API, path construction, animation composition, flutter_animate
> - 🎨 **Designer** — motion language, chart readability, animation as communication
> - 🧪 **Tester** — golden tests for CustomPainter output, animation timing tests

---

## Why CustomPainter Exists

> 📄 **Flutter Docs — CustomPainter:**
> *"A delegate for painting. CustomPaint widgets call the paint method when the widget is being rendered. The canvas passed to paint is raster-backed: drawing on it is relatively cheap."*

Flutter's built-in widgets cover ~80% of UI needs. The other 20% — pie charts, line graphs, waveform displays, circular progress rings, custom dial controls, heat maps — require direct pixel drawing.

`CustomPainter` gives you a `Canvas` object. Canvas is a 2D drawing surface with methods for:
- `drawLine`, `drawRect`, `drawCircle`, `drawRRect` — basic shapes
- `drawPath` — arbitrary paths (arcs, curves, complex polygons)
- `drawArc` — segments of circles
- `drawParagraph` — text with full control
- `drawImage` — raster images

---

## The History of Drawing on Screen — From Sketchpad to CustomPainter

### Ivan Sutherland's Sketchpad (1963)

In 1963, **Ivan Sutherland** submitted his MIT PhD thesis and demonstrated **Sketchpad** — the first computer drawing program in history. Using a light pen on a cathode ray tube display, users could draw lines, circles, and arcs. Shapes could be constrained ("this line must stay horizontal"), copied, and organized hierarchically. Sutherland introduced the concepts of objects with properties, inheritance, and constraints — foundational to both object-oriented programming and UI design.

The API shape that emerged: `draw(shape, position, properties)`. Sixty years later, `canvas.drawCircle(center, radius, paint)` is still exactly this.

### The Same Pattern, Four Decades Running

Every graphics library generation converges on the same interface because it maps naturally to how drawing works: a surface, a state (color, stroke, transform), and drawing commands.

- **1984**: Apple Macintosh launched with **QuickDraw** (written by Bill Atkinson) — `DrawLine()`, `DrawRect()`, `DrawOval()`. The rendering engine for every Mac app for 20 years.
- **1995**: Java shipped `java.awt.Graphics` — `g.drawLine()`, `g.drawRect()`, `g.drawOval()`.
- **2001**: **Processing** — a language for creative coders, created by Casey Reas and Ben Fry at the MIT Media Lab. `void draw() { ellipse(mouseX, mouseY, 50, 50); }`. Called 60 times per second, drawing a circle that follows your mouse. Processing taught a generation of artists to code.
- **2004**: Apple added `<canvas>` to Safari for Mac OS X Dashboard widgets. Mozilla and Opera adopted it. HTML5 formalized it. Every data visualization library — D3.js, Chart.js, Recharts — runs on this canvas element.
- **Flutter**: `void paint(Canvas canvas, Size size) { canvas.drawArc(...); }`. Same shape. Sixty years of convergence.

### Florence Nightingale and Why Visualization Has Stakes

In 1854, **Florence Nightingale** was a nurse during the Crimean War. She collected mortality data and discovered that more soldiers were dying from preventable diseases (cholera, dysentery) than from battle wounds. She knew this — but she needed to *convince the British Parliament* to fund sanitation reforms. A table of numbers wasn't enough.

She invented the **polar area chart** (the "rose diagram") — the first data visualization explicitly designed to *persuade* rather than just report. Each wedge showed deaths by cause in a given month. The pattern was visually undeniable. Politicians who would have ignored a spreadsheet funded the reforms. Sanitation improved. Tens of thousands of lives were saved.

This is why `CustomPainter` matters beyond "making things look good." A chart that makes a pattern visible that was invisible in raw numbers is doing exactly what Nightingale's rose diagram did. The `ExpenseDonutPainter` showing "78% of your spending is food" communicates something in 0.1 seconds that would take 5 seconds of mental arithmetic from a table.

**Edward Tufte**'s 1983 book *The Visual Display of Quantitative Information* codified the principles that still apply to your charts: maximize the data-ink ratio (every pixel should carry information), eliminate chartjunk (3D effects, drop shadows, gradient fills that add no data), label directly rather than via a legend when possible.

---

## 1. CustomPainter Anatomy

```dart
class ExpenseDonutPainter extends CustomPainter {
  final Map<ExpenseCategory, double> breakdown;
  final double total;
  final double animationValue;  // 0.0 to 1.0 from AnimationController

  const ExpenseDonutPainter({
    required this.breakdown,
    required this.total,
    required this.animationValue,
  });

  static const _colors = {
    ExpenseCategory.food: Color(0xFF4CAF50),
    ExpenseCategory.transport: Color(0xFF2196F3),
    ExpenseCategory.entertainment: Color(0xFFFF9800),
    ExpenseCategory.utilities: Color(0xFF9C27B0),
    ExpenseCategory.health: Color(0xFFE91E63),
    ExpenseCategory.other: Color(0xFF607D8B),
  };

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.shortestSide / 2 - 16;
    const strokeWidth = 28.0;

    // Background ring
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = const Color(0xFFE0E0E0)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );

    if (total <= 0) return;

    double startAngle = -math.pi / 2;  // Start at 12 o'clock

    for (final entry in breakdown.entries) {
      final sweep = (entry.value / total) * 2 * math.pi * animationValue;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweep,
        false,  // useCenter: false = arc without spokes (donut shape)
        Paint()
          ..color = _colors[entry.key] ?? Colors.grey
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round,
      );

      startAngle += sweep;
    }

    // Center text — total amount
    _drawCenteredText(
      canvas,
      center,
      total > 0 ? '₹${total.toStringAsFixed(0)}' : '',
      const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1A1A1A)),
    );
  }

  void _drawCenteredText(Canvas canvas, Offset center, String text, TextStyle style) {
    final paragraphBuilder = ui.ParagraphBuilder(
      ui.ParagraphStyle(
        textAlign: TextAlign.center,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
      ),
    )
      ..pushStyle(ui.TextStyle(color: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight))
      ..addText(text);

    final paragraph = paragraphBuilder.build()
      ..layout(ui.ParagraphConstraints(width: 100));

    canvas.drawParagraph(
      paragraph,
      Offset(center.dx - 50, center.dy - paragraph.height / 2),
    );
  }

  @override
  bool shouldRepaint(ExpenseDonutPainter oldDelegate) {
    // Only repaint when data or animation value changes
    return oldDelegate.animationValue != animationValue ||
        oldDelegate.breakdown != breakdown;
  }
}
```

```dart
// Widget that uses it
class ExpenseDonutChart extends StatefulWidget {
  final Map<ExpenseCategory, double> breakdown;
  const ExpenseDonutChart({super.key, required this.breakdown});

  @override
  State<ExpenseDonutChart> createState() => _ExpenseDonutChartState();
}

class _ExpenseDonutChartState extends State<ExpenseDonutChart>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.forward();
  }

  @override
  void didUpdateWidget(ExpenseDonutChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.breakdown != widget.breakdown) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final total = widget.breakdown.values.fold(0.0, (a, b) => a + b);
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, _) {
        return CustomPaint(
          painter: ExpenseDonutPainter(
            breakdown: widget.breakdown,
            total: total,
            animationValue: _animation.value,
          ),
          size: const Size(220, 220),
        );
      },
    );
  }
}
```

🎨 **Designer:** Donut charts communicate proportions. Rules for this chart:
- Each category gets a distinct hue, not just saturation variations (accessible for color-blind users)
- Gap between segments (`strokeCap.round` with `startAngle +=` creates a slight gap)
- Label shows total in center — no legend needed for ≤5 categories
- Animation draws from 12 o'clock clockwise — the eye traces the "filling up" motion

---

## 2. Bar Chart With Path

```dart
class MonthlyBarChartPainter extends CustomPainter {
  final List<double> values;  // monthly totals, most recent last
  final double maxValue;
  final List<String> labels;  // e.g. ['Jan', 'Feb', 'Mar']
  final double highlightIndex;  // -1 = none, index = highlight that bar
  final Color barColor;
  final Color highlightColor;

  const MonthlyBarChartPainter({
    required this.values,
    required this.maxValue,
    required this.labels,
    this.highlightIndex = -1,
    required this.barColor,
    required this.highlightColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    const bottomPadding = 24.0;   // space for labels
    const topPadding = 16.0;
    const sidePadding = 8.0;

    final chartHeight = size.height - bottomPadding - topPadding;
    final barWidth = (size.width - sidePadding * 2) / values.length;
    const barSpacing = 4.0;

    // Horizontal grid lines
    final gridPaint = Paint()
      ..color = Colors.grey.withValues(alpha: 0.15)
      ..strokeWidth = 1;

    for (int i = 1; i <= 4; i++) {
      final y = topPadding + chartHeight * (1 - i / 4);
      canvas.drawLine(
        Offset(sidePadding, y),
        Offset(size.width - sidePadding, y),
        gridPaint,
      );
    }

    // Bars
    for (int i = 0; i < values.length; i++) {
      final barHeight = maxValue > 0 ? (values[i] / maxValue) * chartHeight : 0;
      final isHighlighted = i == highlightIndex.round();
      final barLeft = sidePadding + i * barWidth + barSpacing / 2;

      final rect = RRect.fromRectAndCorners(
        Rect.fromLTWH(
          barLeft,
          topPadding + chartHeight - barHeight,
          barWidth - barSpacing,
          barHeight,
        ),
        topLeft: const Radius.circular(4),
        topRight: const Radius.circular(4),
      );

      canvas.drawRRect(
        rect,
        Paint()
          ..color = isHighlighted ? highlightColor : barColor
          ..shader = isHighlighted
              ? null
              : LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [barColor.withValues(alpha: 0.9), barColor.withValues(alpha: 0.6)],
                ).createShader(rect.outerRect),
      );

      // Value label on top of bar
      if (values[i] > 0 && barHeight > 20) {
        _drawText(
          canvas,
          '₹${values[i].toStringAsFixed(0)}',
          Offset(barLeft + (barWidth - barSpacing) / 2, topPadding + chartHeight - barHeight - 14),
          const TextStyle(fontSize: 9, color: Colors.black54),
          align: TextAlign.center,
        );
      }

      // X-axis label
      if (i < labels.length) {
        _drawText(
          canvas,
          labels[i],
          Offset(barLeft + (barWidth - barSpacing) / 2, size.height - 14),
          TextStyle(
            fontSize: 10,
            color: isHighlighted ? highlightColor : Colors.black54,
            fontWeight: isHighlighted ? FontWeight.w600 : FontWeight.normal,
          ),
          align: TextAlign.center,
        );
      }
    }
  }

  void _drawText(Canvas canvas, String text, Offset center, TextStyle style,
      {TextAlign align = TextAlign.left}) {
    final span = TextSpan(text: text, style: style);
    final painter = TextPainter(text: span, textDirection: TextDirection.ltr, textAlign: align);
    painter.layout(maxWidth: 60);
    painter.paint(canvas, center - Offset(painter.width / 2, painter.height / 2));
  }

  @override
  bool shouldRepaint(MonthlyBarChartPainter old) =>
      old.values != values || old.highlightIndex != highlightIndex;
}
```

```dart
// Interactive bar chart — tap to highlight
class MonthlyBarChart extends StatefulWidget {
  final List<double> values;
  final List<String> labels;
  const MonthlyBarChart({super.key, required this.values, required this.labels});

  @override
  State<MonthlyBarChart> createState() => _MonthlyBarChartState();
}

class _MonthlyBarChartState extends State<MonthlyBarChart> {
  double _highlightIndex = -1;
  double get _barWidth => 280 / widget.values.length;  // approximate

  @override
  Widget build(BuildContext context) {
    final maxValue = widget.values.isEmpty ? 1.0 : widget.values.reduce(math.max);
    return GestureDetector(
      onTapDown: (details) {
        final index = ((details.localPosition.dx - 8) / _barWidth).floor();
        if (index >= 0 && index < widget.values.length) {
          setState(() => _highlightIndex = index.toDouble());
        }
      },
      onTapUp: (_) => setState(() => _highlightIndex = -1),
      child: CustomPaint(
        painter: MonthlyBarChartPainter(
          values: widget.values,
          maxValue: maxValue,
          labels: widget.labels,
          highlightIndex: _highlightIndex,
          barColor: Theme.of(context).colorScheme.primary,
          highlightColor: Theme.of(context).colorScheme.tertiary,
        ),
        size: const Size(double.infinity, 160),
      ),
    );
  }
}
```

---

## 3. Fluid Line Chart With Path

```dart
class SpendingLinePainter extends CustomPainter {
  final List<double> values;
  final double animationValue;  // 0.0→1.0, draws line progressively

  const SpendingLinePainter({required this.values, required this.animationValue});

  @override
  void paint(Canvas canvas, Size size) {
    if (values.length < 2) return;
    const padding = EdgeInsets.fromLTRB(16, 16, 16, 24);

    final chartWidth = size.width - padding.left - padding.right;
    final chartHeight = size.height - padding.top - padding.bottom;
    final maxVal = values.reduce(math.max);
    final stepX = chartWidth / (values.length - 1);

    Offset pointAt(int i) => Offset(
      padding.left + i * stepX,
      padding.top + chartHeight - (values[i] / maxVal) * chartHeight,
    );

    // Build smooth cubic bezier path
    final linePath = Path();
    linePath.moveTo(pointAt(0).dx, pointAt(0).dy);

    for (int i = 0; i < values.length - 1; i++) {
      final p0 = pointAt(i);
      final p1 = pointAt(i + 1);
      final controlX = (p0.dx + p1.dx) / 2;
      linePath.cubicTo(controlX, p0.dy, controlX, p1.dy, p1.dx, p1.dy);
    }

    // Animate the line using PathMetrics
    final metric = linePath.computeMetrics().first;
    final animatedPath = metric.extractPath(0, metric.length * animationValue);

    // Gradient fill under the line
    final fillPath = Path.from(animatedPath)
      ..lineTo(pointAt(values.length - 1).dx * animationValue + padding.left, size.height - padding.bottom)
      ..lineTo(padding.left, size.height - padding.bottom)
      ..close();

    canvas.drawPath(
      fillPath,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.blue.withValues(alpha: 0.3), Colors.blue.withValues(alpha: 0)],
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height)),
    );

    // The line itself
    canvas.drawPath(
      animatedPath,
      Paint()
        ..color = Colors.blue
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round,
    );

    // Dots at data points (only draw if animation has reached that point)
    for (int i = 0; i < values.length; i++) {
      final fraction = i / (values.length - 1);
      if (fraction > animationValue) break;
      canvas.drawCircle(
        pointAt(i),
        4,
        Paint()..color = Colors.white,
      );
      canvas.drawCircle(
        pointAt(i),
        3,
        Paint()..color = Colors.blue,
      );
    }
  }

  @override
  bool shouldRepaint(SpendingLinePainter old) =>
      old.animationValue != animationValue || old.values != values;
}
```

---

## 4. `flutter_animate` — Fast Choreography

> 📄 **flutter_animate Docs:**
> *"A library that makes it simple to animate almost anything in Flutter. Add effects such as fade, scale, slide, color, and more. Chain and sequence effects easily."*

```yaml
dependencies:
  flutter_animate: ^4.5.0
```

```dart
// Basic usage — chain effects with .animate()
Text('₹ 45,230')
  .animate()
  .fadeIn(duration: 400.ms)
  .slideY(begin: 0.3, end: 0, curve: Curves.easeOut)

// Number counter roll-up effect
Text(displayAmount)
  .animate(target: amount)
  .custom(
    builder: (context, value, child) => Text(
      '₹${(value * amount).toStringAsFixed(0)}',
      style: Theme.of(context).textTheme.headlineLarge,
    ),
  )

// Staggered list — each item enters with a delay
ListView.builder(
  itemCount: expenses.length,
  itemBuilder: (context, index) {
    return ExpenseTile(expense: expenses[index])
      .animate(delay: (index * 60).ms)
      .fadeIn(duration: 300.ms)
      .slideX(begin: 0.1, end: 0);
  },
)

// Conditional animation — trigger on data change
BlocBuilder<ExpenseBloc, ExpenseState>(
  builder: (context, state) {
    if (state is! ExpenseLoaded) return const SizedBox();
    return Column(
      children: state.expenses
          .map((e) => ExpenseTile(expense: e)
              .animate()
              .fadeIn()
              .scale(begin: const Offset(0.95, 0.95)))
          .toList(),
    );
  },
)

// Loop animation — pulsing notification badge
Container(
  width: 8,
  height: 8,
  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
)
  .animate(onPlay: (c) => c.repeat(reverse: true))
  .scaleXY(begin: 1, end: 1.4, duration: 600.ms, curve: Curves.easeInOut)
```

🎨 **Designer:** `flutter_animate` lets you implement motion specs exactly:
- `delay:` — offset items in a list to create cascade
- `duration:` — match your timing tokens
- `curve:` — match your easing tokens
- `onPlay: (c) => c.repeat(reverse: true)` — ping-pong animation

Every animation effect in Material Design 3 (`emphasized`, `emphasized-decelerate`) has an Easing + Duration pair. Use `flutter_animate` to implement them precisely.

---

## 5. Lottie Animations

```yaml
dependencies:
  lottie: ^3.1.0
```

```dart
// Play a Lottie animation once (e.g., success checkmark)
class SuccessAnimation extends StatefulWidget {
  final VoidCallback onComplete;
  const SuccessAnimation({super.key, required this.onComplete});

  @override
  State<SuccessAnimation> createState() => _SuccessAnimationState();
}

class _SuccessAnimationState extends State<SuccessAnimation>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Lottie.asset(
      'assets/animations/success.json',
      controller: _controller,
      onLoaded: (composition) {
        _controller
          ..duration = composition.duration
          ..forward().then((_) => widget.onComplete());  // callback when done
      },
      width: 200,
      height: 200,
    );
  }
}

// Infinite loading Lottie
Lottie.asset(
  'assets/animations/loading_dots.json',
  width: 80,
  height: 80,
  repeat: true,
)
```

**Rule:** Don't include large Lottie JSON files (>200KB) for simple animations. For bouncing dots or spinners, use Flutter's built-in widgets. Lottie is for brand illustrations, success states, and onboarding flows.

---

## 6. Parallax Scroll Effect

```dart
// Custom ScrollController-driven parallax
class ParallaxAppHeader extends StatefulWidget {
  final ScrollController scrollController;
  const ParallaxAppHeader({super.key, required this.scrollController});

  @override
  State<ParallaxAppHeader> createState() => _ParallaxAppHeaderState();
}

class _ParallaxAppHeaderState extends State<ParallaxAppHeader> {
  double _offset = 0;

  @override
  void initState() {
    super.initState();
    widget.scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (mounted) {
      setState(() => _offset = widget.scrollController.offset);
    }
  }

  @override
  void dispose() {
    widget.scrollController.removeListener(_onScroll);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Image moves at half the scroll speed → parallax effect
    return SizedBox(
      height: 200,
      child: ClipRect(
        child: Transform.translate(
          offset: Offset(0, _offset * 0.4),  // 0.4 = parallax factor
          child: Image.asset('assets/images/header_bg.jpg', fit: BoxFit.cover),
        ),
      ),
    );
  }
}
```

---

## Lab — Expense Breakdown Widget

Build the `ExpenseDonutChart` and `MonthlyBarChart` from this file. Add them to a `SummaryCard` widget:

```
┌─────────────────────────────────────────────────┐
│  June 2026                              ₹45,230  │
│  ┌─────────────────┐  ┌──────────────────────┐  │
│  │    DonutChart   │  │  Legend with %ages   │  │
│  └─────────────────┘  └──────────────────────┘  │
│  ─────────────────────────────────────────────  │
│  │  MonthlyBarChart (last 6 months)           │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

Requirements:
- Donut animates in on first render
- Bar chart tapping highlights a bar and shows the month's total
- Legend shows each category with colored dot + percentage
- Use `flutter_animate` for the legend items (staggered fade-in)

---

## Challenge — Line Chart With Touch Tooltip

Add a tooltip to the `SpendingLinePainter`. When the user drags their finger along the chart:
- Snap to the nearest data point
- Draw a vertical dashed line at that point
- Show a floating tooltip card above the line with the value
- Tooltip dismisses when finger lifts

Hint: Use `GestureDetector.onPanUpdate` to track the X position and calculate the nearest index.

---

## The Invisible Machinery — How Flutter Draws on the GPU

Your `canvas.drawArc(rect, startAngle, sweep, false, paint)` line is one of the most direct paths from Dart code to physical hardware in all of Flutter. Here is the full journey from your method call to lit-up pixels.

### From Widget Tree to Layer Tree (The Fourth Tree)

You know Flutter has three trees: Widget (description) → Element (live instance) → RenderObject (geometry). After RenderObject layout completes, Flutter builds a **fourth representation: the Layer Tree**. Layers are like transparent acetate sheets stacked on each other — each drawn independently, then composited into the final image.

```
Widget tree       → "what I want" (immutable descriptions, rebuilt often)
Element tree      → "live instances" (maintain identity and state)
RenderObject tree → "geometry" (size, position, clip regions)
Layer tree        → "drawing commands grouped for GPU compositing"
```

`RepaintBoundary` creates a new layer boundary. Everything inside it is drawn onto a **separate GPU texture** — a dedicated bitmap in GPU VRAM. When those widgets need to redraw, only their texture is regenerated. Widgets outside use their cached GPU textures unchanged.

```dart
// Without RepaintBoundary:
// DonutChart animates every frame → entire parent layer redraws
// → every sibling widget (title, legend, buttons) also repaints → wasted work

// With RepaintBoundary:
RepaintBoundary(
  child: AnimatedDonutChart(),  // → isolated GPU texture
)
// Chart redraws only its own texture.
// Everything else composites using their unchanged cached textures.
// On a complex screen this is the difference between 8ms and 2ms per frame.
```

### The Layer Tree Becomes GPU Commands

Flutter sends the Layer Tree to the **Raster thread** — a separate background thread the Flutter engine maintains purely for GPU work. Here, one of two backends converts it into actual GPU commands:

**Skia** (older backend):
- Converts drawing commands → OpenGL ES commands (Android) or Metal commands (iOS)
- Problem: fragment shaders are compiled the **first time a new shape is drawn** → visible hitch on first render (the infamous "shader jank")
- Every new app release, new shapes = new shaders = new jank on users' first launch

**Impeller** (new backend — default on iOS since Flutter 3.10, Android since Flutter 3.19):
- All shaders are **pre-compiled at app build time** and bundled in the binary
- Zero runtime shader compilation → no first-frame jank, ever
- Uses Metal (iOS) and Vulkan (Android) directly

### What the GPU Actually Does With Those Commands

The GPU receives a **stream of draw calls** — not "draw a circle" but low-level vertex data and shader programs:

```
Vertex shader program:    "Here are 64 triangles approximating an arc.
                           Vertex 0 at (150.0, 200.0),
                           vertex 1 at (154.9, 192.1)... [64 × 3 vertices]"

Fragment shader program:  "For every pixel whose (x,y) falls inside these triangles:
                           output RGBA(76, 175, 80, 255)"  ← the green segment
```

The GPU runs the fragment shader on **thousands of pixels simultaneously** using its dedicated shader cores. A typical mobile GPU has 1,000–10,000 shader cores. A CPU has 6–8 cores. This massive parallelism is why rasterization belongs on the GPU thread — the CPU simply cannot match it.

Results are written into the **framebuffer**: a region of GPU VRAM holding pixel values for the entire screen.

### The Display Reads the Framebuffer

The **display controller** — a dedicated chip on the phone PCB — reads the framebuffer at 60Hz or 120Hz and sends pixel values to the display panel via the MIPI DSI bus (a high-speed serial interface running at ~6 Gbps). The panel's OLED or LCD cells respond to the electrical signal and emit light.

```
GPU VRAM (framebuffer)
    ↓ display controller reads RGBA pixel values, 60 times per second
MIPI DSI bus (electrical signal)
    ↓ scan lines sent top-to-bottom, left-to-right
Display panel cells (OLED emits light; LCD modulates backlight)
    ↓
Photons → your retina
```

This is why DevTools shows **two performance bars per frame**: the UI thread bar (Dart code, widget builds) and the Raster thread bar (GPU rendering). **Both must finish within 16.67ms**. A complex `CustomPainter` producing slow Raster thread bars is distinct from a slow `build()` method producing slow UI thread bars.

### Why `CustomPainter` Bypasses the Widget System

When you write `canvas.drawCircle(center, 50, paint)` inside `paint()`, you are **not** going through Widget → Element → RenderObject. You are directly issuing drawing commands that Flutter translates to GPU instructions:

```dart
@override
void paint(Canvas canvas, Size size) {
  // Direct path: Dart method call → Skia/Impeller → GPU draw call → pixels
  // No build(), no element diffing, no layout pass — none of that
  canvas.drawArc(rect, startAngle, sweepAngle * animationValue, false, paint);
}

@override
bool shouldRepaint(ExpenseDonutPainter old) =>
  old.animationValue != animationValue;
  // false = GPU reuses the cached texture = zero work this frame
  // true  = full repaint = draw calls regenerated and sent to GPU
```

This is why `CustomPainter` is appropriate for highly dynamic content (charts, waveforms, games, drawing apps) — it skips every layer of the Flutter framework above it and goes straight to the GPU.

### RepaintBoundary: The Most Underused Optimization

```dart
// Every animated widget should be wrapped in RepaintBoundary
// if it sits inside a complex, static parent:

Stack(
  children: [
    // This is complex and static — built once, GPU-cached forever
    const DashboardBackground(),

    // This animates 60 times per second
    // Without RepaintBoundary: the entire Stack layer (including DashboardBackground) repaints
    // With RepaintBoundary: only this widget's isolated GPU texture repaints
    RepaintBoundary(
      child: AnimatedDonutChart(value: animationValue),
    ),
  ],
)
```

**Decision table — GPU rendering:**

| Symptom | Root cause | Fix |
|---------|------------|-----|
| Smooth on iPhone, stutters on first Android run | Skia compiles shaders at runtime | Enable Impeller (`--enable-impeller`) or upgrade to Flutter 3.19+ |
| Raster thread bar always high in DevTools | Too many repaints or complex paths | Audit `shouldRepaint` — return false when data unchanged; wrap in `RepaintBoundary` |
| `shouldRepaint` always returns `true` | Every animation frame triggers full repaint of unchanged painter | Compare all fields affecting output; return false when equal |
| Both bars are green but real device still stutters | Thermal throttling — device CPU/GPU clocked down from heat | Profile with cool device; reduce looping animations that run 24/7 |
| Chart looks correct in widget test but glitchy on device | Size passed to `paint()` differs from assumed size | Always use the `size` parameter; never hardcode pixel values |

---

## Week 22 Verify

1. What does `shouldRepaint` do? What happens if you always return `true`?
2. In the donut chart, `useCenter: false` in `drawArc` — what does this change?
3. `PathMetrics.extractPath(0, metric.length * animationValue)` — what does this do visually?
4. `flutter_animate`: how does `.animate(delay: (index * 60).ms)` create a staggered list effect?
5. When should you use Lottie vs a CustomPainter animation vs an implicit Flutter animation?
6. The parallax factor is `0.4` — what does this number mean? What would `1.0` do? What would `0.0` do?
7. `ClipRect` wraps the parallax image — remove it mentally. What visual artifact would you see?

---

**Want to actually get fluent, not just informed?** → [Advanced Animation Challenges](Week_22b_Advanced_Animation_Challenges.md) — fix a shouldRepaint bug, compute bar-chart coordinates by hand, prove RepaintBoundary isolation, Lottie-vs-code judgment calls.

**Next → [Week 23: Project — Expense Tracker App](Week_23_Project_ExpenseTracker.md)**
