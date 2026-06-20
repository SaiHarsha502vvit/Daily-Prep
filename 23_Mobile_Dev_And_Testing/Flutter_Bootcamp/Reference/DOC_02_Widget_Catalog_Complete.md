# Flutter Widget Catalog — Complete Reference
### Every widget you'll actually use, organized by what they do

---

## How to Read This File

For each widget: **what it is → key properties → when to use it → quick code snippet**. This is a lookup reference, not a tutorial. When you encounter an unfamiliar widget in code or docs, find it here first.

---

## 1. Layout Widgets

### `Container`
The Swiss Army knife of layout. Combines padding, margin, size constraints, decoration, and transform in one widget. When a `Container` has no child, it tries to fill its parent. With a child, it wraps the child's size.

```dart
Container(
  width: 200,
  height: 100,
  margin: const EdgeInsets.all(16),       // space OUTSIDE the box
  padding: const EdgeInsets.all(12),      // space INSIDE the box
  decoration: BoxDecoration(
    color: Colors.blue,
    borderRadius: BorderRadius.circular(12),
    boxShadow: [
      BoxShadow(
        color: Colors.black26,
        blurRadius: 8,
        offset: const Offset(0, 4),
      ),
    ],
    gradient: const LinearGradient(
      colors: [Colors.blue, Colors.purple],
    ),
    border: Border.all(color: Colors.white, width: 2),
    image: const DecorationImage(
      image: NetworkImage('https://example.com/bg.jpg'),
      fit: BoxFit.cover,
    ),
  ),
  transform: Matrix4.rotationZ(0.05),     // slight tilt
  clipBehavior: Clip.antiAlias,           // clip child to decoration shape
  child: const Text('Hello'),
)
```

**Use `Container` when:** you need decoration (color, border, shadow, gradient) OR margin/padding. **Use `SizedBox` when:** you just need size constraints or spacing.

---

### `Row` and `Column`
Linear layout along horizontal (Row) or vertical (Column) axis.

```dart
Row(
  mainAxisAlignment: MainAxisAlignment.spaceBetween, // horizontal distribution
  crossAxisAlignment: CrossAxisAlignment.center,     // vertical alignment
  mainAxisSize: MainAxisSize.min,   // shrink-wrap instead of fill width
  children: [
    const Text('Left'),
    const Spacer(),         // fills remaining space between children
    const Text('Right'),
  ],
)
```

**`mainAxisAlignment` values:**
| Value | Effect |
|-------|--------|
| `start` | Pack children to the start (default) |
| `end` | Pack children to the end |
| `center` | Center children as a group |
| `spaceBetween` | Equal space between children |
| `spaceAround` | Half-space on ends, full space between |
| `spaceEvenly` | Equal space everywhere including ends |

**`crossAxisAlignment` values:**
| Value | Effect |
|-------|--------|
| `start` | Align to top (Column) or left (Row) |
| `end` | Align to bottom (Column) or right (Row) |
| `center` | Center perpendicular to axis |
| `stretch` | Force children to fill cross-axis width/height |
| `baseline` | Align text baselines (Row only) |

---

### `Expanded` and `Flexible`
Both take up remaining space inside `Row`/`Column`. The difference:

```dart
Row(
  children: [
    Expanded(          // MUST fill all remaining space
      flex: 2,         // takes 2/3 of available space
      child: Container(color: Colors.blue),
    ),
    Flexible(          // CAN be smaller than available space
      flex: 1,         // can take up to 1/3, but won't force-fill
      child: Container(color: Colors.green, width: 20), // stays at 20 wide
    ),
  ],
)
```

**Rule:** `Expanded` is `Flexible` with `fit: FlexFit.tight`. Use `Expanded` when you want the child to fill space. Use `Flexible` when the child has its own preferred size and shouldn't be stretched.

---

### `Stack` and `Positioned`
Overlapping layout — children stack on top of each other.

```dart
Stack(
  alignment: Alignment.center, // default alignment for non-Positioned children
  clipBehavior: Clip.none,     // allow children to paint outside Stack bounds
  children: [
    // Bottom layer
    Image.asset('background.jpg'),

    // Positioned absolutely within the Stack
    const Positioned(
      top: 16,
      right: 16,
      child: Badge(label: Text('3')),
    ),

    // Positioned to fill the entire Stack
    const Positioned.fill(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.transparent, Colors.black87],
          ),
        ),
      ),
    ),
  ],
)
```

**Use `Stack` for:** overlapping elements, image overlays, badges on icons, floating widgets over content, loading overlays.

---

### `SizedBox`
Set exact dimensions or add spacing.

```dart
// Fixed size
const SizedBox(width: 200, height: 100, child: Widget())

// Spacing between children in Column/Row
const SizedBox(height: 16)  // vertical gap
const SizedBox(width: 8)    // horizontal gap

// Force expand to fill parent
const SizedBox.expand(child: Widget())

// Shrink to nothing (useful to hide widgets without removing them from tree)
const SizedBox.shrink()
```

---

### `Padding`
Adds padding around a child. Equivalent to `Container(padding: ...)` but more explicit and slightly more efficient.

```dart
Padding(
  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
  child: const Text('Hello'),
)

// EdgeInsets options:
EdgeInsets.all(16)                      // all sides
EdgeInsets.symmetric(h: 16, v: 8)      // h = left+right, v = top+bottom
EdgeInsets.only(left: 16, top: 8)      // specific sides
EdgeInsets.fromLTRB(8, 4, 8, 4)        // left, top, right, bottom
```

---

### `Center` and `Align`

```dart
// Center: exactly in the middle of parent
const Center(child: Text('Centered'))

// Align: anywhere in parent
Align(
  alignment: Alignment.bottomRight,
  child: const FloatingActionButton(...),
)

// Custom alignment (x: -1 to 1, y: -1 to 1)
Align(
  alignment: const Alignment(0.5, -0.8), // 75% from left, 10% from top
  child: const Widget(),
)
```

---

### `Wrap`
Like `Row`/`Column` but wraps to next line when out of space. Perfect for tags and chips.

```dart
Wrap(
  spacing: 8,       // horizontal gap between items
  runSpacing: 4,    // vertical gap between lines
  alignment: WrapAlignment.start,
  children: tags.map((tag) => Chip(label: Text(tag))).toList(),
)
```

---

### `LayoutBuilder`
Receives the parent's constraints so you can build different layouts for different sizes.

```dart
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth > 600) {
      // tablet: two columns
      return Row(children: [...]);
    } else {
      // phone: single column
      return Column(children: [...]);
    }
  },
)
```

---

### `FractionallySizedBox`
Size relative to parent — useful for responsive layouts.

```dart
// 80% of parent width
FractionallySizedBox(
  widthFactor: 0.8,
  child: ElevatedButton(...),
)
```

---

### `AspectRatio`
Force a specific width-to-height ratio.

```dart
AspectRatio(
  aspectRatio: 16 / 9,   // 16:9 video container
  child: VideoPlayer(...),
)
```

---

### `SafeArea`
Inset content to avoid device notches, status bars, and home indicators. Almost always should wrap your Scaffold body.

```dart
SafeArea(
  child: Column(...),
  // options:
  top: true,     // avoid status bar
  bottom: true,  // avoid home indicator on iPhone
  left: true,
  right: true,
)
```

---

## 2. Text and Typography

### `Text`
```dart
Text(
  'Hello World',
  style: const TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.blue,
    letterSpacing: 1.5,
    wordSpacing: 4,
    height: 1.5,        // line height multiplier
    decoration: TextDecoration.underline,
    shadows: [Shadow(color: Colors.black38, blurRadius: 4)],
    fontFamily: 'Roboto',
  ),
  textAlign: TextAlign.center,
  maxLines: 2,
  overflow: TextOverflow.ellipsis,  // ... at end if text overflows
  softWrap: true,
)
```

### `RichText` / `Text.rich`
Multiple styles within one text block.

```dart
Text.rich(
  TextSpan(
    children: [
      const TextSpan(text: 'Hello ', style: TextStyle(fontSize: 18)),
      TextSpan(
        text: 'Flutter',
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
        recognizer: TapGestureRecognizer()..onTap = () => print('tapped'),
      ),
      const TextSpan(text: '!'),
    ],
  ),
)
```

### `SelectableText`
Like `Text` but allows the user to select and copy text.

```dart
SelectableText('Email: user@example.com')
```

---

## 3. Input Widgets

### `TextField`
```dart
TextField(
  controller: _controller,
  focusNode: _focusNode,
  keyboardType: TextInputType.emailAddress,
  textInputAction: TextInputAction.next,       // keyboard "Next" button
  obscureText: _isPasswordHidden,              // for passwords
  maxLines: null,                              // null = unlimited (multiline)
  maxLength: 100,
  onChanged: (value) => setState(() => _text = value),
  onSubmitted: (value) => _focusNode.nextFocus(),
  inputFormatters: [
    FilteringTextInputFormatter.digitsOnly,
    LengthLimitingTextInputFormatter(10),
  ],
  decoration: const InputDecoration(
    labelText: 'Email',
    hintText: 'you@example.com',
    prefixIcon: Icon(Icons.email),
    suffixIcon: Icon(Icons.clear),
    border: OutlineInputBorder(),
    filled: true,
    fillColor: Colors.grey,
    errorText: _emailError,    // null = no error, String = show error
    helperText: 'We never share your email',
    counterText: '',           // hide character counter
  ),
)
```

### `TextFormField`
`TextField` inside a `Form`. Adds `validator` and participates in `Form.validate()`.

```dart
TextFormField(
  validator: (value) {
    if (value == null || value.isEmpty) return 'Required';
    if (value.length < 8) return 'Minimum 8 characters';
    return null;  // null means valid
  },
  autovalidateMode: AutovalidateMode.onUserInteraction,
)
```

### `Checkbox`, `Switch`, `Radio`

```dart
Checkbox(
  value: _isChecked,
  onChanged: (bool? value) => setState(() => _isChecked = value ?? false),
  activeColor: Colors.blue,
)

Switch(
  value: _isEnabled,
  onChanged: (bool value) => setState(() => _isEnabled = value),
)

// Radio group — only one can be selected
Radio<String>(
  value: 'option_a',
  groupValue: _selectedOption,  // current selection
  onChanged: (value) => setState(() => _selectedOption = value),
)
```

### `Slider`

```dart
Slider(
  value: _volume,
  min: 0.0,
  max: 1.0,
  divisions: 10,       // snap to 0.1 increments
  label: '${(_volume * 100).round()}%',
  onChanged: (value) => setState(() => _volume = value),
)
```

### `DropdownButton` / `DropdownButtonFormField`

```dart
DropdownButton<String>(
  value: _selectedCity,
  hint: const Text('Select city'),
  items: ['Mumbai', 'Delhi', 'Hyderabad']
      .map((city) => DropdownMenuItem(value: city, child: Text(city)))
      .toList(),
  onChanged: (value) => setState(() => _selectedCity = value),
)
```

### `DatePicker` and `TimePicker`
These are dialogs, not widgets.

```dart
// Show date picker
final date = await showDatePicker(
  context: context,
  initialDate: DateTime.now(),
  firstDate: DateTime(2000),
  lastDate: DateTime(2100),
  builder: (context, child) => Theme(     // custom theme
    data: ThemeData.dark(),
    child: child!,
  ),
);

// Show time picker
final time = await showTimePicker(
  context: context,
  initialTime: TimeOfDay.now(),
);
```

---

## 4. Scrolling Widgets

### `ListView`

```dart
// 1. Simple (use only for short, fixed lists)
ListView(
  padding: const EdgeInsets.all(8),
  children: items.map((item) => ListTile(title: Text(item))).toList(),
)

// 2. Builder (lazy — only builds visible items)
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ListTile(
    title: Text(items[index]),
  ),
)

// 3. Separated (with dividers)
ListView.separated(
  itemCount: items.length,
  itemBuilder: (_, i) => ListTile(title: Text(items[i])),
  separatorBuilder: (_, i) => const Divider(height: 1),
)

// 4. Infinite scroll with ScrollController
final _controller = ScrollController();

@override
void initState() {
  super.initState();
  _controller.addListener(() {
    if (_controller.position.pixels >= _controller.position.maxScrollExtent - 200) {
      _loadMore();
    }
  });
}

ListView.builder(
  controller: _controller,
  itemCount: _items.length + (_isLoading ? 1 : 0),
  itemBuilder: (_, i) {
    if (i == _items.length) return const CircularProgressIndicator();
    return ListTile(title: Text(_items[i]));
  },
)
```

### `GridView`

```dart
// Fixed column count
GridView.count(
  crossAxisCount: 2,
  mainAxisSpacing: 8,
  crossAxisSpacing: 8,
  childAspectRatio: 3 / 4,  // width/height ratio per cell
  children: items.map((item) => ItemCard(item: item)).toList(),
)

// Builder + responsive columns
GridView.builder(
  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
    maxCrossAxisExtent: 200,  // each cell at most 200px wide
    mainAxisSpacing: 8,
    crossAxisSpacing: 8,
  ),
  itemCount: items.length,
  itemBuilder: (_, i) => ItemCard(item: items[i]),
)
```

### `CustomScrollView` + Slivers

```dart
CustomScrollView(
  slivers: [
    // Collapsing app bar with background image
    SliverAppBar(
      expandedHeight: 250,
      pinned: true,                  // stays visible when collapsed
      floating: false,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text('Profile'),
        background: Image.network(coverUrl, fit: BoxFit.cover),
        collapseMode: CollapseMode.parallax,
      ),
      actions: [IconButton(icon: Icon(Icons.edit), onPressed: () {})],
    ),

    // Single widget in the sliver world
    SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: ProfileStats(),
      ),
    ),

    // Lazy list
    SliverList(
      delegate: SliverChildBuilderDelegate(
        (_, i) => PostCard(post: posts[i]),
        childCount: posts.length,
      ),
    ),

    // Lazy grid
    SliverGrid(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 4,
        crossAxisSpacing: 4,
      ),
      delegate: SliverChildBuilderDelegate(
        (_, i) => PhotoThumbnail(photo: photos[i]),
        childCount: photos.length,
      ),
    ),
  ],
)
```

### `PageView`
Horizontal (or vertical) page-by-page scrolling. Use for onboarding screens, image carousels.

```dart
final _controller = PageController(viewportFraction: 0.9);  // peek at next page

PageView.builder(
  controller: _controller,
  itemCount: pages.length,
  onPageChanged: (index) => setState(() => _currentPage = index),
  itemBuilder: (_, i) => PageCard(page: pages[i]),
)

// Dot indicators
Row(
  mainAxisAlignment: MainAxisAlignment.center,
  children: List.generate(
    pages.length,
    (i) => AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: i == _currentPage ? 24 : 8,
      height: 8,
      margin: const EdgeInsets.symmetric(horizontal: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        color: i == _currentPage ? Colors.blue : Colors.grey,
      ),
    ),
  ),
)
```

### `RefreshIndicator`
Pull-to-refresh. The `onRefresh` must return a `Future`.

```dart
RefreshIndicator(
  onRefresh: () async {
    await _loadData();  // must be async and awaited
  },
  child: ListView.builder(...),
)
```

### `SingleChildScrollView`
Make a non-list widget scrollable (e.g., a form that needs to scroll when keyboard appears).

```dart
SingleChildScrollView(
  physics: const BouncingScrollPhysics(),
  child: Column(
    children: [...formFields],
  ),
)
```

---

## 5. Image Widgets

### `Image`

```dart
// Network image
Image.network(
  'https://example.com/photo.jpg',
  width: 200,
  height: 200,
  fit: BoxFit.cover,      // how to fit within size bounds
  loadingBuilder: (context, child, progress) {
    if (progress == null) return child;  // loaded
    return CircularProgressIndicator(
      value: progress.expectedTotalBytes != null
          ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
          : null,
    );
  },
  errorBuilder: (context, error, stack) =>
      const Icon(Icons.broken_image, size: 48),
)

// Asset image
Image.asset('assets/images/logo.png')

// File image (picked from gallery)
Image.file(File(filePath))
```

**BoxFit values:**
| Value | Effect |
|-------|--------|
| `fill` | Stretch to fill exactly — may distort |
| `contain` | Fit entire image inside box — may letterbox |
| `cover` | Fill box, crop excess — most common |
| `fitWidth` | Fit width, crop height |
| `fitHeight` | Fit height, crop width |
| `none` | No scaling, original size |

### `CircleAvatar`
Quick circle avatar with image or initials fallback.

```dart
CircleAvatar(
  radius: 32,
  backgroundImage: NetworkImage(avatarUrl),  // null if no URL
  backgroundColor: Colors.blue,
  child: avatarUrl == null ? Text(initials) : null,
)
```

### `CachedNetworkImage` (package: `cached_network_image`)
Production-grade image with disk + memory caching. Essential for list views.

```dart
CachedNetworkImage(
  imageUrl: photo.url,
  placeholder: (context, url) => const Shimmer(...),
  errorWidget: (context, url, error) => const Icon(Icons.error),
  fit: BoxFit.cover,
)
```

---

## 6. Button Widgets

```dart
// Filled, primary action
ElevatedButton(
  onPressed: () {},     // null = disabled
  style: ElevatedButton.styleFrom(
    backgroundColor: Colors.blue,
    foregroundColor: Colors.white,
    minimumSize: const Size(double.infinity, 48),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
  ),
  child: const Text('Submit'),
)

// Outlined, secondary action
OutlinedButton(
  onPressed: () {},
  child: const Text('Cancel'),
)

// Text-only, tertiary
TextButton(
  onPressed: () {},
  child: const Text('Learn more'),
)

// Icon + label
ElevatedButton.icon(
  icon: const Icon(Icons.send),
  label: const Text('Send'),
  onPressed: () {},
)

// Icon button
IconButton(
  icon: const Icon(Icons.favorite),
  tooltip: 'Add to favorites',
  onPressed: () {},
)

// Ripple effect on any widget
InkWell(
  onTap: () {},
  borderRadius: BorderRadius.circular(8),
  child: Padding(
    padding: const EdgeInsets.all(8),
    child: Row(children: [...]),
  ),
)
```

---

## 7. Overlay / Modal Widgets

### Dialog

```dart
// Simple alert
showDialog(
  context: context,
  barrierDismissible: false,
  builder: (_) => AlertDialog(
    title: const Text('Delete item?'),
    content: const Text('This cannot be undone.'),
    actions: [
      TextButton(
        onPressed: () => Navigator.of(context).pop(false),
        child: const Text('Cancel'),
      ),
      ElevatedButton(
        onPressed: () => Navigator.of(context).pop(true),
        child: const Text('Delete'),
        style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
      ),
    ],
  ),
);

// Return value from dialog
final confirmed = await showDialog<bool>(
  context: context,
  builder: (_) => ConfirmDialog(),
);
if (confirmed == true) _deleteItem();
```

### SnackBar

```dart
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(
    content: const Text('Item deleted'),
    duration: const Duration(seconds: 4),
    behavior: SnackBarBehavior.floating,
    margin: const EdgeInsets.all(16),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    action: SnackBarAction(
      label: 'Undo',
      onPressed: _undoDelete,
    ),
  ),
);
```

### BottomSheet

```dart
// Persistent (not dismissable by tapping outside)
showBottomSheet(context: context, builder: (_) => MySheet());

// Modal (dismissable, dark scrim)
showModalBottomSheet(
  context: context,
  isScrollControlled: true,      // let sheet go full screen if needed
  backgroundColor: Colors.transparent,
  builder: (_) => DraggableScrollableSheet(
    initialChildSize: 0.5,
    minChildSize: 0.3,
    maxChildSize: 0.95,
    builder: (_, scrollController) => Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: ListView(..., controller: scrollController),
    ),
  ),
);
```

---

## 8. Animation Widgets

### Implicit (no controller needed)

```dart
// Animates ALL properties automatically
AnimatedContainer(
  duration: const Duration(milliseconds: 300),
  curve: Curves.easeInOut,
  width: _expanded ? 200 : 100,
  color: _selected ? Colors.blue : Colors.grey,
  child: ...,
)

AnimatedOpacity(
  duration: const Duration(milliseconds: 200),
  opacity: _isVisible ? 1.0 : 0.0,
  child: ...,
)

// Switches between two children with animation
AnimatedSwitcher(
  duration: const Duration(milliseconds: 300),
  child: _showA
      ? const Widget1(key: ValueKey('a'))    // MUST have different keys
      : const Widget2(key: ValueKey('b')),
)

// Animate a specific value
TweenAnimationBuilder<double>(
  tween: Tween(begin: 0, end: _progress),
  duration: const Duration(milliseconds: 600),
  builder: (_, value, child) => LinearProgressIndicator(value: value),
)
```

### Explicit (with AnimationController)

```dart
class _MyState extends State<My> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _scale = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: ...,
    );
  }
}
```

### Hero
Shared element transition between routes.

```dart
// Screen 1
Hero(
  tag: 'product-image-${product.id}',   // MUST match tag on screen 2
  child: Image.network(product.imageUrl),
)

// Screen 2
Hero(
  tag: 'product-image-${product.id}',
  child: Image.network(product.imageUrl, fit: BoxFit.cover),
)
```

---

## 9. Material Design Widgets

### `Scaffold`
The standard page wrapper.

```dart
Scaffold(
  appBar: AppBar(
    title: const Text('Page Title'),
    leading: IconButton(icon: const Icon(Icons.menu), onPressed: _openDrawer),
    actions: [IconButton(icon: const Icon(Icons.search), onPressed: () {})],
    bottom: TabBar(controller: _tabController, tabs: [Tab(text: 'A'), Tab(text: 'B')]),
    elevation: 0,
    backgroundColor: Theme.of(context).colorScheme.surface,
  ),
  body: ...,
  floatingActionButton: FloatingActionButton(
    onPressed: _add,
    child: const Icon(Icons.add),
  ),
  floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
  bottomNavigationBar: BottomNavigationBar(
    items: const [
      BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
      BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
    ],
    currentIndex: _selectedTab,
    onTap: (i) => setState(() => _selectedTab = i),
  ),
  drawer: const Drawer(child: NavigationMenu()),
  endDrawer: const Drawer(child: FilterPanel()),
)
```

### `Card`

```dart
Card(
  elevation: 4,
  margin: const EdgeInsets.all(8),
  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  clipBehavior: Clip.antiAlias,  // clip children to card shape
  child: Column(
    children: [
      Image.network(imageUrl, fit: BoxFit.cover, height: 200),
      ListTile(
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: IconButton(icon: Icon(Icons.more_vert), onPressed: () {}),
      ),
    ],
  ),
)
```

### `ListTile`
Standard list row with leading, title, subtitle, trailing.

```dart
ListTile(
  leading: CircleAvatar(backgroundImage: NetworkImage(avatarUrl)),
  title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
  subtitle: Text(lastMessage, maxLines: 1, overflow: TextOverflow.ellipsis),
  trailing: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [Text(time), const Badge(label: Text('3'))],
  ),
  onTap: () => Navigator.push(...),
  onLongPress: () => _showContextMenu(),
  tileColor: _isSelected ? Colors.blue.withOpacity(0.1) : null,
  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
)
```

### `Chip` and `FilterChip`

```dart
// Basic chip with close button
Chip(
  label: Text(tag),
  avatar: CircleAvatar(child: Text(tag[0])),
  onDeleted: () => _removeTag(tag),
  backgroundColor: Colors.blue.withOpacity(0.1),
  side: BorderSide.none,
)

// Selectable chip
FilterChip(
  label: Text(category),
  selected: _selectedCategories.contains(category),
  onSelected: (bool selected) {
    setState(() {
      if (selected) _selectedCategories.add(category);
      else _selectedCategories.remove(category);
    });
  },
)
```

### `TabBar` + `TabBarView`

```dart
DefaultTabController(
  length: 3,
  child: Scaffold(
    appBar: AppBar(
      bottom: const TabBar(
        tabs: [
          Tab(text: 'Trending'),
          Tab(text: 'Latest'),
          Tab(text: 'Saved'),
        ],
      ),
    ),
    body: const TabBarView(
      children: [
        TrendingScreen(),
        LatestScreen(),
        SavedScreen(),
      ],
    ),
  ),
)
```

### `Stepper`
Multi-step form or onboarding flow.

```dart
Stepper(
  currentStep: _currentStep,
  type: StepperType.vertical,
  onStepContinue: () {
    if (_currentStep < steps.length - 1) setState(() => _currentStep++);
    else _submit();
  },
  onStepCancel: () {
    if (_currentStep > 0) setState(() => _currentStep--);
  },
  steps: [
    Step(
      title: const Text('Personal Info'),
      content: PersonalInfoForm(),
      isActive: _currentStep >= 0,
      state: _currentStep > 0 ? StepState.complete : StepState.indexed,
    ),
    Step(
      title: const Text('Address'),
      content: AddressForm(),
      isActive: _currentStep >= 1,
    ),
  ],
)
```

---

## 10. Async / Data-Driven Widgets

### `FutureBuilder`
Build UI based on a `Future`'s state.

```dart
FutureBuilder<User>(
  future: _fetchUser(),
  builder: (context, snapshot) {
    // snapshot.connectionState: none, waiting, active, done
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const CircularProgressIndicator();
    }
    if (snapshot.hasError) {
      return Text('Error: ${snapshot.error}');
    }
    final user = snapshot.data!;  // safe after hasError check
    return UserCard(user: user);
  },
)
```

**Common mistake:** don't call `_fetchUser()` directly in `build()` — it would create a new Future on every rebuild. Store the Future in `initState()` or use Riverpod instead.

### `StreamBuilder`
Build UI from a `Stream` that emits values over time.

```dart
StreamBuilder<List<Message>>(
  stream: _chatRepository.messagesStream(chatId),
  builder: (context, snapshot) {
    if (!snapshot.hasData) return const Loading();

    final messages = snapshot.data!;
    return ListView.builder(
      reverse: true,
      itemCount: messages.length,
      itemBuilder: (_, i) => MessageBubble(message: messages[i]),
    );
  },
)
```

---

## 11. Gesture Widgets

### `GestureDetector`
Invisible layer that detects gestures on its child.

```dart
GestureDetector(
  onTap: () {},
  onDoubleTap: () {},
  onLongPress: () {},
  onPanUpdate: (details) {
    setState(() {
      _position += details.delta;   // Offset
    });
  },
  onScaleStart: (details) {},
  onScaleUpdate: (details) {
    // details.scale: 1.0 = no zoom, 2.0 = doubled
    // details.rotation: radians
  },
  child: Container(...),
)
```

### `Draggable` / `DragTarget`

```dart
// Draggable source
Draggable<String>(
  data: 'item_id',
  feedback: Material(
    child: Opacity(opacity: 0.7, child: ItemCard()),
  ),
  childWhenDragging: Opacity(opacity: 0.3, child: ItemCard()),
  child: ItemCard(),
)

// Drop target
DragTarget<String>(
  onWillAcceptWithDetails: (details) => !_isFull,
  onAcceptWithDetails: (details) => _addItem(details.data),
  builder: (context, accepted, rejected) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: accepted.isNotEmpty ? Colors.green : Colors.grey,
          width: 2,
        ),
      ),
      child: ...,
    );
  },
)
```

### `Dismissible`
Swipe to dismiss with optional confirmation.

```dart
Dismissible(
  key: ValueKey(item.id),
  direction: DismissDirection.endToStart,
  background: Container(
    color: Colors.red,
    alignment: Alignment.centerRight,
    padding: const EdgeInsets.only(right: 16),
    child: const Icon(Icons.delete, color: Colors.white),
  ),
  confirmDismiss: (direction) async {
    return await showDialog<bool>(context: context, builder: (_) => ConfirmDialog());
  },
  onDismissed: (direction) {
    setState(() => _items.remove(item));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${item.name} deleted'),
        action: SnackBarAction(label: 'Undo', onPressed: () => setState(() => _items.add(item))),
      ),
    );
  },
  child: ListTile(title: Text(item.name)),
)
```

---

## Widget Quick-Reference Table

| Widget | Use For |
|--------|---------|
| `Container` | Box with color, border, shadow, gradient, transform |
| `SizedBox` | Fixed size or spacing between widgets |
| `Padding` | Add space inside (wraps child) |
| `Center` | Center a child in parent |
| `Align` | Position child at any point in parent |
| `Row` | Horizontal linear layout |
| `Column` | Vertical linear layout |
| `Expanded` | Fill remaining space in Row/Column |
| `Flexible` | Flex space but allow shrinking |
| `Stack` | Overlap children |
| `Positioned` | Absolute positioning inside Stack |
| `Wrap` | Row/Column that wraps to next line |
| `LayoutBuilder` | Build different layouts based on available space |
| `AspectRatio` | Fixed width:height ratio |
| `FractionallySizedBox` | Size as fraction of parent |
| `SafeArea` | Inset from device edges (notch, home indicator) |
| `Text` | Display text |
| `RichText` | Multiple text styles in one block |
| `TextField` | User text input |
| `TextFormField` | Text input inside Form with validation |
| `Checkbox` | Boolean toggle |
| `Switch` | Boolean toggle (iOS-style) |
| `Slider` | Numeric range selection |
| `DropdownButton` | Select from a list |
| `ListView` | Scrollable list |
| `GridView` | Scrollable grid |
| `PageView` | Horizontal page-by-page scroll |
| `CustomScrollView` | Mix slivers for complex scroll effects |
| `SliverAppBar` | Collapsing app bar in CustomScrollView |
| `RefreshIndicator` | Pull-to-refresh |
| `Image` | Display images from network, assets, or files |
| `CircleAvatar` | Round avatar image |
| `ElevatedButton` | Primary action button |
| `OutlinedButton` | Secondary action button |
| `TextButton` | Tertiary action button |
| `IconButton` | Icon-only button |
| `InkWell` | Tap ripple on any widget |
| `Card` | Material card with elevation |
| `ListTile` | Standard list row |
| `Chip` | Compact tag/label |
| `FilterChip` | Selectable tag |
| `Scaffold` | Page wrapper with AppBar, FAB, Drawer |
| `TabBar` | Horizontal tabs |
| `Stepper` | Multi-step wizard |
| `AlertDialog` | Modal dialog |
| `SnackBar` | Temporary bottom notification |
| `BottomSheet` | Slide-up panel |
| `FutureBuilder` | Reactive UI for one-time async data |
| `StreamBuilder` | Reactive UI for ongoing data stream |
| `GestureDetector` | Detect taps, drags, scales |
| `Draggable` | Make a widget draggable |
| `DragTarget` | Accept dragged widgets |
| `Dismissible` | Swipe to dismiss |
| `Hero` | Shared element animation between screens |
| `AnimatedContainer` | Implicitly animate container properties |
| `AnimatedSwitcher` | Animate between two child widgets |
| `AnimatedOpacity` | Fade in/out |
| `RepaintBoundary` | Isolate painting for performance |
| `CustomPaint` | Draw directly on canvas |
| `Builder` | Get a BuildContext that sees ancestors |
| `ConstrainedBox` | Add min/max size constraints |
| `ClipRRect` | Clip child to rounded rectangle |
| `ClipOval` | Clip child to oval |
| `Opacity` | Make child transparent (prefer AnimatedOpacity) |
| `Transform` | Apply matrix transform to child |
| `Visibility` | Show/hide widget (keeps in tree vs Offstage) |
| `Offstage` | Hide widget but keep in tree (preserves state) |
| `IndexedStack` | Show one of many children, preserving all their state |
| `AbsorbPointer` | Block gestures from reaching child |
| `IgnorePointer` | Same as AbsorbPointer but child can still paint |
| `MediaQuery` | Get screen size, orientation, text scale |
| `Theme` | Access or override theme for a subtree |

---

**→ Related files:**
- [DOC_01_Rendering_Pipeline.md](DOC_01_Rendering_Pipeline.md) — how widgets become pixels
- [DOC_03_Material3_Theming.md](DOC_03_Material3_Theming.md) — style all these widgets consistently
