# Week 10 — Project: Shopping App UI Clone
### Phase 2 Capstone | Build a production-quality shopping experience

---

## The Mission

Pick a real shopping app — Myntra, Meesho, Zomato, or any app you use daily. Screenshot 6-8 screens. Rebuild them in Flutter, pixel as close as you can get.

This is not about logic. It's about UI craft. If the reference app has a 12dp gap between elements — yours should too. If the button has `borderRadius: 8` — measure it and match it.

---

## Reference App Options

| App | UI Complexity | Good for practicing |
|-----|--------------|---------------------|
| Zomato | Medium | Cards, filters, tabs, restaurant grid |
| Myntra | High | Product grid, detail page, filters sheet |
| Meesho | Medium | Feed layout, categories, horizontal scroll |
| Amazon | Very High | Complex layout, search, categories |
| Swiggy | Medium | Carousel, category chips, food cards |

Recommendation: **Zomato or Swiggy** — rich UI, clear sections, doable in a week.

---

## Screens to Build

### Screen 1: Splash Screen
- Your chosen app's logo centered
- Background color matching the brand
- Auto-transitions to Home after 2 seconds using `Navigator.pushReplacement`
- Logo fades in using `AnimatedOpacity`

---

### Screen 2: Home Feed

**Top section:**
- Location bar (city name + dropdown arrow icon)
- Search bar (tappable — pushes Search Screen)
- Greeting: "Good [morning/afternoon/evening], [Name]!" (based on time of day)

**Banner Carousel:**
- `PageView` with 3-4 promotional banners
- Auto-scrolls every 3 seconds using a `Timer`
- Dot indicators below it

**Category Chips:**
- Horizontal `ListView` of category icons + labels (Delivery, Dining, Nightlife, etc.)
- Each chip is an icon + text in a column, circular border

**Popular Restaurants / Products section:**
- Section header with "See All" button
- Horizontal `ListView` of cards (image, name, rating, delivery time)

**All Restaurants / Products:**
- Vertical `ListView` of larger cards
- Each card: image, name, cuisine tags, rating, delivery info, distance

---

### Screen 3: Search Screen

- Search TextField auto-focused when screen opens (use `FocusNode` + `autofocus: true`)
- Empty state: show "Popular Searches" as chip grid
- As user types: show filtered results list (filter your hardcoded data)
- Each result: small thumbnail, name, category, rating
- Recent searches: shown above popular searches when field is empty (use a list stored in State)

---

### Screen 4: Restaurant / Product Listing

**Header:**
- `SliverAppBar` — shows restaurant/store image when expanded, shows name when collapsed (pinned)
- Rating, cuisine type, delivery time in a row below
- "Order Now" or "Visit" button

**Content (below header):**
- Category tabs (horizontal scroll) — "Starters", "Main Course", "Beverages", etc.
- Tapping a tab scrolls the list to that section

**Item List:**
- Each item: name, description (2 lines), price, veg/non-veg indicator, "+" button
- Tapping "+" adds to cart (counter appears on the button)
- Sticky section headers (use `SliverPersistentHeader`)

---

### Screen 5: Item Detail / Product Detail

**Layout:**
- Full-width image (40% of screen height)
- Back button overlaid on the image (transparent AppBar)
- Below: item name, tags, price, description
- Customization options (if applicable): size selector, add-ons (chips with toggle state)
- Quantity selector: - / count / +
- Sticky bottom bar: total price + "Add to Cart" button

**Animation:**
- Hero transition on the image from the listing card

---

### Screen 6: Cart Screen

**Empty state:** Illustration + "Your cart is empty" + "Browse menu" button

**Cart with items:**
- List of added items with: thumbnail, name, customizations, price
- Quantity control (+ / -) per item — tapping - when quantity is 1 removes the item with `Dismissible`
- Section: "Add More Items" button

**Price breakdown section:**
- Item total
- Delivery fee
- Taxes & charges
- Discount (if any, shown in green)
- Grand Total (bold, larger)

**Checkout button:**
- Full-width at the bottom
- Shows grand total: "Proceed to Pay ₹349"
- Tapping shows an order confirmation dialog

---

### Screen 7: Profile / Account Screen

- User avatar (large, circular)
- Name and phone number
- Settings list:
  - My Orders (arrow icon)
  - Saved Addresses (arrow icon)
  - Payment Methods (arrow icon)
  - Notifications (switch toggle)
  - Dark Mode (switch toggle)
  - Help & Support (arrow icon)
  - Logout (red text, tap shows confirmation dialog)

---

## Data Models

Define these before building any UI:

```dart
class Restaurant {
  final String id;
  final String name;
  final String imageUrl;
  final double rating;
  final String deliveryTime;
  final String distance;
  final List<String> cuisines;
  final bool isOpen;
  final List<MenuCategory> menu;
  const Restaurant({...});
}

class MenuCategory {
  final String name;
  final List<MenuItem> items;
  const MenuCategory({...});
}

class MenuItem {
  final String id;
  final String name;
  final String description;
  final double price;
  final bool isVeg;
  final String imageUrl;
  const MenuItem({...});
}

class CartItem {
  final MenuItem item;
  int quantity;
  CartItem({required this.item, this.quantity = 1});
}
```

Create at least:
- 6 restaurants
- Each with 3-4 menu categories
- Each category with 4-5 items

---

## Navigation Structure

```
SplashScreen
    ↓
MainScreen (BottomNavigationBar — 4 tabs)
    ├── HomeTab
    │     ├── → SearchScreen (push)
    │     ├── → RestaurantListingScreen (push, with Hero on image)
    │     │       └── → ItemDetailScreen (push, with Hero on image)
    │     └── (cart FAB always visible)
    ├── SearchTab
    │     └── → RestaurantListingScreen
    ├── CartTab  (shows CartScreen directly)
    └── ProfileTab
```

Cart state must be shared across ALL tabs. Lift it to `MainScreen` or use a simple `InheritedWidget`. (You'll replace this with Riverpod in Phase 3.)

---

## UI Requirements

**Theming:**
```dart
// For Zomato clone:
const brandColor = Color(0xFFE23744);

// For Swiggy clone:
const brandColor = Color(0xFFFC8019);

// Build a complete ThemeData with:
// - colorScheme from your brand color
// - textTheme for all heading/body sizes
// - cardTheme with your corner radius
// - inputDecorationTheme for search fields
// - elevatedButtonTheme for action buttons
```

**Spacing:**
Pick ONE spacing scale and stick to it:
- 4, 8, 12, 16, 24, 32 dp
- No random values like `padding: EdgeInsets.only(top: 11)`

**Images:**
Use picsum.photos for placeholder restaurant images:
```dart
'https://picsum.photos/seed/${restaurant.id}/400/200'
```
This gives a consistent image for each restaurant ID.

---

## State to Manage

| State | Where it lives | How |
|-------|---------------|-----|
| Cart items | MainScreen State | Lifted state + callbacks |
| Selected tab | MainScreen State | `_selectedIndex` |
| Search query | SearchScreen State | `TextEditingController` |
| Item quantity (per item) | RestaurantListingScreen | Map<String, int> |
| Notification toggle | ProfileTab State | `bool` |
| Dark mode toggle | App level | pass to MaterialApp `themeMode` |

---

## Build Order

1. Data models + sample data (hardcode 6 restaurants)
2. Theme setup in MaterialApp
3. SplashScreen
4. MainScreen skeleton (4 empty tabs + BottomNavigationBar)
5. HomeTab — static layout first, then carousels, then horizontal scrolls
6. RestaurantListingScreen with SliverAppBar
7. ItemDetailScreen with Hero animation from listing
8. CartScreen (empty + with items state)
9. SearchScreen with filter logic
10. ProfileScreen

---

## Quality Checklist

Before calling it done:

- [ ] Hero animation works between listing and detail
- [ ] Cart updates across tabs (add from listing, see count update on Cart tab)
- [ ] Pull to refresh works on the home feed
- [ ] Search filters results in real time as user types
- [ ] App renders without RenderFlex overflow on standard phone size
- [ ] No placeholder `print()` statements left
- [ ] `flutter analyze` shows zero errors, zero warnings
- [ ] App theme matches your chosen reference app's colors
- [ ] Dark mode toggle in Profile actually changes the app theme

---

## Stretch Goals

- [ ] Animated cart count badge (bounces when item is added)
- [ ] Smooth category tab → list scroll synchronization (scrolling list updates active tab)
- [ ] Shimmer loading skeleton (use `shimmer` package) while "loading" the home data
- [ ] Save favorite restaurants (heart icon toggles, persists with SharedPreferences)
- [ ] Order tracking screen: 4-step progress indicator (placed → confirmed → preparing → delivered)

---

**Phase 2 Complete. Next → [Phase 3: State Management & APIs](../Phase_3_State_and_APIs/Week_11_State_Management_Deep_Dive.md)**
