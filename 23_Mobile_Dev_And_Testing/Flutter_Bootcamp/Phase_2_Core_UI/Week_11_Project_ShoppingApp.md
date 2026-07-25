# Week 10 — Project: Shopping App UI
### Phase 2 Capstone | Scrolling, Forms, Animations — all in one real app

---

> Three lenses throughout this project:
> - 🧑‍💻 **Developer** — composing all Phase 2 concepts into a working multi-screen app
> - 🎨 **Designer** — e-commerce UX conventions, visual hierarchy, empty states, loading states
> - 🧪 **Tester** — validating the cart flow, testing search, verifying quantity changes

---

## What You're Building

A shopping app with five screens and a persistent bottom navigation bar. All state is local (no network calls — we use seed data). The focus is UI architecture: slivers, forms, animations, gesture handling, and navigation patterns.

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   HOME          │   │  SEARCH         │   │  PRODUCT DETAIL │
│                 │   │                 │   │                 │
│ SliverAppBar    │   │ SearchBar       │   │ SliverAppBar    │
│ Category chips  │   │ Filter chips    │   │  hero image     │
│ Featured banner │   │ Results grid    │   │ Name + price    │
│ Products grid   │   │                 │   │ Size picker     │
│                 │   │                 │   │ Add to Cart btn │
└─────────────────┘   └─────────────────┘   └─────────────────┘

┌─────────────────┐   ┌─────────────────┐
│   CART          │   │  CHECKOUT       │
│                 │   │                 │
│ CartItem list   │   │ Delivery form   │
│ Quantity +/-    │   │ Payment method  │
│ Subtotal        │   │ Order summary   │
│ Checkout button │   │ Place Order btn │
└─────────────────┘   └─────────────────┘
```

---

## Models First

```dart
// lib/models/product.dart

enum ProductCategory { clothing, shoes, accessories, electronics }

class Product {
  final String id;
  final String name;
  final String brand;
  final String description;
  final double price;
  final double? originalPrice;     // null if no discount
  final String imageUrl;
  final List<String> imageUrls;    // gallery
  final ProductCategory category;
  final List<String> sizes;
  final double rating;
  final int reviewCount;
  final bool isWishlisted;

  const Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.description,
    required this.price,
    this.originalPrice,
    required this.imageUrl,
    required this.imageUrls,
    required this.category,
    required this.sizes,
    required this.rating,
    required this.reviewCount,
    this.isWishlisted = false,
  });

  double get discountPercent {
    if (originalPrice == null) return 0;
    return ((originalPrice! - price) / originalPrice! * 100).roundToDouble();
  }

  Product copyWith({bool? isWishlisted}) {
    return Product(
      id: id, name: name, brand: brand, description: description,
      price: price, originalPrice: originalPrice, imageUrl: imageUrl,
      imageUrls: imageUrls, category: category, sizes: sizes,
      rating: rating, reviewCount: reviewCount,
      isWishlisted: isWishlisted ?? this.isWishlisted,
    );
  }
}
```

```dart
// lib/models/cart_item.dart

class CartItem {
  final Product product;
  final String selectedSize;
  int quantity;

  CartItem({
    required this.product,
    required this.selectedSize,
    this.quantity = 1,
  });

  double get totalPrice => product.price * quantity;
}
```

---

## State Architecture

All state lives in `AppState` — a single `StatefulWidget` above the navigation. Each tab receives only the data it needs.

```
AppState (StatefulWidget)
│
│  _products: List<Product>     — source of truth, wishlist updates here
│  _cartItems: List<CartItem>   — cart state
│  _selectedCategory: enum      — active category filter
│
├── MainScreen (IndexedStack)
│   ├── HomeTab(products, onWishlist, onAddToCart)
│   ├── SearchTab(products, onAddToCart)
│   ├── CartTab(cartItems, onQuantityChange, onRemove)
│   └── ProfileTab()
```

```dart
// lib/main.dart

class ShopApp extends StatefulWidget {
  const ShopApp({super.key});

  @override
  State<ShopApp> createState() => _ShopAppState();
}

class _ShopAppState extends State<ShopApp> {
  List<Product> _products = List.from(sampleProducts);
  List<CartItem> _cartItems = [];

  void _toggleWishlist(String productId) {
    setState(() {
      _products = _products.map((p) {
        if (p.id == productId) return p.copyWith(isWishlisted: !p.isWishlisted);
        return p;
      }).toList();
    });
  }

  void _addToCart(Product product, String size) {
    setState(() {
      final existing = _cartItems.where(
        (item) => item.product.id == product.id && item.selectedSize == size
      ).firstOrNull;

      if (existing != null) {
        existing.quantity++;
      } else {
        _cartItems.add(CartItem(product: product, selectedSize: size));
      }
    });

    ScaffoldMessenger.of(navigatorKey.currentContext!).showSnackBar(
      SnackBar(
        content: Text('${product.name} (${size}) added to cart'),
        action: SnackBarAction(label: 'View Cart', onPressed: _goToCart),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _updateQuantity(String productId, String size, int delta) {
    setState(() {
      final item = _cartItems.firstWhere(
        (i) => i.product.id == productId && i.selectedSize == size
      );
      item.quantity += delta;
      if (item.quantity <= 0) {
        _cartItems.remove(item);
      }
    });
  }

  double get _cartTotal =>
      _cartItems.fold(0, (sum, item) => sum + item.totalPrice);

  int get _cartCount =>
      _cartItems.fold(0, (sum, item) => sum + item.quantity);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: MainScreen(
        products: _products,
        cartItems: _cartItems,
        cartCount: _cartCount,
        cartTotal: _cartTotal,
        onToggleWishlist: _toggleWishlist,
        onAddToCart: _addToCart,
        onUpdateQuantity: _updateQuantity,
      ),
    );
  }
}
```

---

## Screen 1 — Home Tab

Uses everything from Week 7 (Slivers) and Week 9 (Animations).

```dart
// lib/screens/home/home_tab.dart

class HomeTab extends StatefulWidget {
  final List<Product> products;
  final void Function(String) onToggleWishlist;
  final void Function(Product, String) onAddToCart;

  const HomeTab({super.key, required this.products, required this.onToggleWishlist, required this.onAddToCart});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  ProductCategory? _selectedCategory;

  List<Product> get _filtered {
    if (_selectedCategory == null) return widget.products;
    return widget.products.where((p) => p.category == _selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return CustomScrollView(
      slivers: [
        // Collapsing AppBar with search
        SliverAppBar(
          floating: true,
          snap: true,
          title: Text('ShopFlutter', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          actions: [
            Badge(
              label: Text(widget.products.where((p) => p.isWishlisted).length.toString()),
              child: IconButton(icon: const Icon(Icons.favorite_border), onPressed: () {}),
            ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(56),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: SearchBar(
                hintText: 'Search for products...',
                leading: const Icon(Icons.search),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => SearchScreen(products: widget.products))),
              ),
            ),
          ),
        ),

        // Category filter chips
        SliverToBoxAdapter(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _CategoryChip(
                  label: 'All',
                  isSelected: _selectedCategory == null,
                  onTap: () => setState(() => _selectedCategory = null),
                ),
                ...ProductCategory.values.map((cat) => _CategoryChip(
                  label: cat.name[0].toUpperCase() + cat.name.substring(1),
                  isSelected: _selectedCategory == cat,
                  onTap: () => setState(() => _selectedCategory = cat),
                )),
              ],
            ),
          ),
        ),

        // Featured banner (carousel — simplified to a PageView)
        SliverToBoxAdapter(
          child: SizedBox(
            height: 180,
            child: _FeaturedBanner(featuredProducts: widget.products.take(3).toList()),
          ),
        ),

        // Section header
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('All Products', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                Text('${_filtered.length} items', style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
        ),

        // Product grid
        _filtered.isEmpty
            ? SliverFillRemaining(child: _EmptyState(category: _selectedCategory))
            : SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 0.62,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => ProductCard(
                      product: _filtered[index],
                      onWishlistToggle: () => widget.onToggleWishlist(_filtered[index].id),
                      onTap: () => Navigator.push(
                        context,
                        PageRouteBuilder(
                          pageBuilder: (_, __, ___) => ProductDetailScreen(
                            product: _filtered[index],
                            onAddToCart: widget.onAddToCart,
                          ),
                          transitionsBuilder: (_, anim, __, child) =>
                              FadeTransition(opacity: anim, child: child),
                          transitionDuration: const Duration(milliseconds: 250),
                        ),
                      ),
                    ),
                    childCount: _filtered.length,
                  ),
                ),
              ),
      ],
    );
  }
}
```

---

## Screen 2 — Product Detail

Uses `SliverAppBar` + `Hero` animation + size picker + Add to Cart.

```dart
// lib/screens/product_detail/product_detail_screen.dart

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  final void Function(Product, String) onAddToCart;

  const ProductDetailScreen({super.key, required this.product, required this.onAddToCart});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  String? _selectedSize;
  int _currentImageIndex = 0;
  bool _isAddingToCart = false;

  Future<void> _addToCart() async {
    if (_selectedSize == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a size')),
      );
      return;
    }

    setState(() => _isAddingToCart = true);
    await Future.delayed(const Duration(milliseconds: 600));  // simulate network
    if (!mounted) return;

    widget.onAddToCart(widget.product, _selectedSize!);
    setState(() => _isAddingToCart = false);
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 380,
            pinned: true,
            leading: IconButton(
              icon: const CircleAvatar(
                radius: 16,
                backgroundColor: Colors.black38,
                child: Icon(Icons.arrow_back, color: Colors.white, size: 18),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Stack(
                children: [
                  // Main product image — Hero for smooth transition from grid
                  Hero(
                    tag: 'product-${product.id}',
                    child: PageView.builder(
                      itemCount: product.imageUrls.length,
                      onPageChanged: (i) => setState(() => _currentImageIndex = i),
                      itemBuilder: (_, i) => Image.asset(
                        product.imageUrls[i],
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => ColoredBox(
                          color: colorScheme.primaryContainer,
                          child: const Center(child: Icon(Icons.image, size: 80)),
                        ),
                      ),
                    ),
                  ),
                  // Image indicator dots
                  Positioned(
                    bottom: 12,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        product.imageUrls.length,
                        (i) => AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: _currentImageIndex == i ? 20 : 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: _currentImageIndex == i ? Colors.white : Colors.white60,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Brand + name
                  Text(product.brand.toUpperCase(),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.primary,
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.w700,
                      )),
                  const SizedBox(height: 4),
                  Text(product.name, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),

                  const SizedBox(height: 12),

                  // Price row
                  Row(
                    children: [
                      Text(
                        '₹${product.price.toStringAsFixed(0)}',
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      if (product.originalPrice != null) ...[
                        const SizedBox(width: 10),
                        Text(
                          '₹${product.originalPrice!.toStringAsFixed(0)}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            decoration: TextDecoration.lineThrough,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.green[100],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${product.discountPercent.round()}% OFF',
                            style: const TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Rating
                  Row(
                    children: [
                      ...List.generate(5, (i) => Icon(
                        i < product.rating.floor() ? Icons.star : Icons.star_border,
                        size: 16,
                        color: Colors.amber,
                      )),
                      const SizedBox(width: 6),
                      Text('${product.rating} (${product.reviewCount} reviews)',
                          style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
                    ],
                  ),

                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),

                  // Size picker
                  Text('Select Size', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: product.sizes.map((size) {
                      final isSelected = _selectedSize == size;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedSize = size),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 50,
                          height: 50,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isSelected ? colorScheme.primary : Colors.transparent,
                            border: Border.all(
                              color: isSelected ? colorScheme.primary : colorScheme.outline,
                              width: 2,
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            size,
                            style: TextStyle(
                              color: isSelected ? colorScheme.onPrimary : colorScheme.onSurface,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),

                  // Description
                  Text('About this product', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(product.description, style: theme.textTheme.bodyMedium?.copyWith(height: 1.6)),

                  const SizedBox(height: 100),  // space for bottom button
                ],
              ),
            ),
          ),
        ],
      ),

      // Sticky bottom action bar
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Wishlist button
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(minimumSize: const Size(56, 56)),
                child: const Icon(Icons.favorite_border),
              ),
              const SizedBox(width: 12),
              // Add to Cart button — full width
              Expanded(
                child: FilledButton(
                  onPressed: _isAddingToCart ? null : _addToCart,
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56)),
                  child: _isAddingToCart
                      ? const SizedBox(
                          height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Add to Cart', style: TextStyle(fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## Screen 3 — Cart Tab

Uses `AnimatedList` for item add/remove animations, quantity controls, and `SwipeToDelete` gesture.

```dart
// lib/screens/cart/cart_tab.dart

class CartTab extends StatelessWidget {
  final List<CartItem> cartItems;
  final void Function(String, String, int) onUpdateQuantity;
  final double cartTotal;

  const CartTab({
    super.key,
    required this.cartItems,
    required this.onUpdateQuantity,
    required this.cartTotal,
  });

  @override
  Widget build(BuildContext context) {
    if (cartItems.isEmpty) {
      return const _EmptyCartState();
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Cart (${cartItems.length})'),
        centerTitle: false,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: cartItems.length,
              itemBuilder: (context, index) {
                final item = cartItems[index];
                return Dismissible(
                  key: ValueKey('${item.product.id}-${item.selectedSize}'),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    color: Colors.red,
                    child: const Icon(Icons.delete_outline, color: Colors.white),
                  ),
                  onDismissed: (_) => onUpdateQuantity(item.product.id, item.selectedSize, -item.quantity),
                  child: _CartItemCard(
                    item: item,
                    onIncrease: () => onUpdateQuantity(item.product.id, item.selectedSize, 1),
                    onDecrease: () => onUpdateQuantity(item.product.id, item.selectedSize, -1),
                  ),
                );
              },
            ),
          ),
          // Order summary + checkout button
          _OrderSummary(total: cartTotal),
        ],
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  final CartItem item;
  final VoidCallback onIncrease;
  final VoidCallback onDecrease;

  const _CartItemCard({required this.item, required this.onIncrease, required this.onDecrease});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Product image
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                item.product.imageUrl,
                width: 80, height: 96,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 80, height: 96,
                  color: theme.colorScheme.primaryContainer,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.product.name, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text('Size: ${item.selectedSize}', style: theme.textTheme.bodySmall),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹${item.totalPrice.toStringAsFixed(0)}',
                        style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      // Quantity control
                      _QuantityControl(
                        quantity: item.quantity,
                        onDecrease: onDecrease,
                        onIncrease: onIncrease,
                      ),
                    ],
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

class _QuantityControl extends StatelessWidget {
  final int quantity;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;

  const _QuantityControl({required this.quantity, required this.onDecrease, required this.onIncrease});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          icon: Icon(quantity <= 1 ? Icons.delete_outline : Icons.remove),
          onPressed: onDecrease,
          style: IconButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
            minimumSize: const Size(32, 32),
            padding: EdgeInsets.zero,
          ),
          iconSize: 18,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 150),
            transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
            child: Text(
              '$quantity',
              key: ValueKey(quantity),  // ← required for AnimatedSwitcher to detect change
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.add),
          onPressed: onIncrease,
          style: IconButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.primary,
            foregroundColor: Theme.of(context).colorScheme.onPrimary,
            minimumSize: const Size(32, 32),
            padding: EdgeInsets.zero,
          ),
          iconSize: 18,
        ),
      ],
    );
  }
}
```

---

## Screen 4 — Checkout (Form Screen)

Uses everything from Week 8: form validation, focus management, keyboard handling.

```dart
// lib/screens/checkout/checkout_screen.dart

class CheckoutScreen extends StatefulWidget {
  final double total;
  const CheckoutScreen({super.key, required this.total});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameFocus = FocusNode();
  final _phoneFocus = FocusNode();
  final _addressFocus = FocusNode();
  final _cityFocus = FocusNode();
  final _pincodeFocus = FocusNode();

  String _paymentMethod = 'card';
  bool _isPlacingOrder = false;
  AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;

  // Saved form values
  String _name = '', _phone = '', _address = '', _city = '', _pincode = '';

  @override
  void dispose() {
    _nameFocus.dispose();
    _phoneFocus.dispose();
    _addressFocus.dispose();
    _cityFocus.dispose();
    _pincodeFocus.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    setState(() => _autovalidateMode = AutovalidateMode.onUserInteraction);
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() => _isPlacingOrder = true);
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    // Navigate to success screen, clearing entire back stack
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => OrderSuccessScreen(name: _name)),
      (route) => route.isFirst,  // keep only the home screen
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Form(
        key: _formKey,
        autovalidateMode: _autovalidateMode,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Delivery Address', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextFormField(
                focusNode: _nameFocus,
                decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline)),
                textInputAction: TextInputAction.next,
                onFieldSubmitted: (_) => FocusScope.of(context).requestFocus(_phoneFocus),
                validator: (v) => (v == null || v.isEmpty) ? 'Name required' : null,
                onSaved: (v) => _name = v!.trim(),
              ),
              const SizedBox(height: 16),
              TextFormField(
                focusNode: _phoneFocus,
                decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone_outlined)),
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                onFieldSubmitted: (_) => FocusScope.of(context).requestFocus(_addressFocus),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Phone required';
                  if (v.length != 10) return 'Enter 10-digit phone number';
                  return null;
                },
                onSaved: (v) => _phone = v!,
              ),
              const SizedBox(height: 16),
              TextFormField(
                focusNode: _addressFocus,
                decoration: const InputDecoration(labelText: 'Address', prefixIcon: Icon(Icons.home_outlined)),
                maxLines: 2,
                textInputAction: TextInputAction.next,
                onFieldSubmitted: (_) => FocusScope.of(context).requestFocus(_cityFocus),
                validator: (v) => (v == null || v.isEmpty) ? 'Address required' : null,
                onSaved: (v) => _address = v!.trim(),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      focusNode: _cityFocus,
                      decoration: const InputDecoration(labelText: 'City'),
                      textInputAction: TextInputAction.next,
                      onFieldSubmitted: (_) => FocusScope.of(context).requestFocus(_pincodeFocus),
                      validator: (v) => (v == null || v.isEmpty) ? 'City required' : null,
                      onSaved: (v) => _city = v!.trim(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      focusNode: _pincodeFocus,
                      decoration: const InputDecoration(labelText: 'Pincode'),
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        if (v.length != 6) return 'Invalid';
                        return null;
                      },
                      onSaved: (v) => _pincode = v!,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 28),
              Text('Payment Method', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                selected: {_paymentMethod},
                onSelectionChanged: (s) => setState(() => _paymentMethod = s.first),
                segments: const [
                  ButtonSegment(value: 'card', label: Text('Card'), icon: Icon(Icons.credit_card)),
                  ButtonSegment(value: 'upi', label: Text('UPI'), icon: Icon(Icons.qr_code)),
                  ButtonSegment(value: 'cod', label: Text('COD'), icon: Icon(Icons.money)),
                ],
              ),

              const SizedBox(height: 28),

              // Order summary
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _SummaryRow(label: 'Subtotal', value: '₹${widget.total.toStringAsFixed(0)}'),
                      _SummaryRow(label: 'Delivery', value: widget.total > 500 ? 'FREE' : '₹40'),
                      const Divider(height: 24),
                      _SummaryRow(
                        label: 'Total',
                        value: '₹${(widget.total + (widget.total > 500 ? 0 : 40)).toStringAsFixed(0)}',
                        isTotal: true,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),
              FilledButton(
                onPressed: _isPlacingOrder ? null : _placeOrder,
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56)),
                child: _isPlacingOrder
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Place Order', style: TextStyle(fontSize: 16)),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## Phase 2 Concepts Exercised

| Concept | Where in this project |
|---------|----------------------|
| `SliverAppBar` + parallax | Home tab header |
| `SliverGrid` + `SliverList` | Product grid, category filters |
| `SliverPersistentHeader` | Could be added for section headers |
| `ListView.builder` (lazy) | Cart items, search results |
| `AnimatedContainer` | Size picker selection, like button |
| `AnimatedSwitcher` | Quantity number changes |
| `Hero` animation | Grid thumbnail → detail screen |
| `PageRouteBuilder` | Custom fade transition |
| `TextFormField` + `Form` | Checkout screen |
| Focus management | Tab-through checkout fields |
| `Dismissible` | Swipe to remove cart item |
| State lifting | `_products` and `_cartItems` in root |
| `IndexedStack` | Bottom nav tabs |
| `SegmentedButton` | Payment method selector |
| `pushAndRemoveUntil` | After order placed |

---

## Week 10 Verify — Project Self-Review

1. The quantity number in the cart uses `AnimatedSwitcher` with a `ValueKey(quantity)`. What happens if you remove the key?
2. `Dismissible` removes the cart item from the UI immediately. But the actual `onUpdateQuantity` is called too. Why must both happen? What breaks if only one runs?
3. In the `ProductDetailScreen`, the `Add to Cart` button has `onPressed: _isAddingToCart ? null : _addToCart`. What does `null` do to a `FilledButton`?
4. The `Checkout` screen uses `pushAndRemoveUntil` after ordering. Trace exactly what happens to the Navigator stack if you used `pushReplacement` instead.
5. Why does `_autovalidateMode` start as `AutovalidateMode.disabled` and only switch to `AutovalidateMode.onUserInteraction` after the first submit attempt?
6. The `_cartTotal` getter is defined in the root `_ShopAppState`. Each time `setState` runs, it recomputes. Why is this fine? When would it NOT be fine?
7. Design question: the cart uses `Dismissible` for swipe-to-delete. What accessibility concern does this raise? How would you fix it?

---

**Phase 2 Complete.**

**Next → [Phase 3: State Management & APIs](../Phase_3_State_and_APIs/Phase_3_Overview.md)**
