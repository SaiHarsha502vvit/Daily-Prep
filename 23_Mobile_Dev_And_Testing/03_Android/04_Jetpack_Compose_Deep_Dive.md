# Android — Jetpack Compose Deep Dive

**Folder**: [03_Android](./) | **Previous**: [03_ViewModel_StateFlow_LiveData.md](./03_ViewModel_StateFlow_LiveData.md) | **Next**: [05_Room_Database_And_DataStore.md](./05_Room_Database_And_DataStore.md)

> **Reading contract**: Jetpack Compose is the current standard for Android UI. If you are joining any Android team after 2023, they are either using Compose or migrating to it. This file teaches you: the mental model behind declarative UI (why it exists), how Composables work, how recomposition works (the #1 misunderstood topic), state in Compose, navigation with Compose, interop with the old View system, and how to test Composables.

---

## Table of Contents

1. [Imperative vs Declarative UI — The Fundamental Shift](#1-imperative-vs-declarative-ui--the-fundamental-shift)
2. [What a Composable Function Is](#2-what-a-composable-function-is)
3. [Recomposition — How Compose Updates the UI](#3-recomposition--how-compose-updates-the-ui)
4. [State in Compose — remember and rememberSaveable](#4-state-in-compose--remember-and-remembersaveable)
5. [State Hoisting — The Right Way to Structure State](#5-state-hoisting--the-right-way-to-structure-state)
6. [Connecting Compose to ViewModel](#6-connecting-compose-to-viewmodel)
7. [Jetpack Compose Layouts](#7-jetpack-compose-layouts)
8. [LazyColumn and LazyRow — Lists in Compose](#8-lazycolumn-and-lazyrow--lists-in-compose)
9. [Side Effects in Compose](#9-side-effects-in-compose)
10. [Navigation in Compose](#10-navigation-in-compose)
11. [Compose vs XML Views — When to Use What](#11-compose-vs-xml-views--when-to-use-what)
12. [Testing Composables](#12-testing-composables)
13. [Common Compose Bugs and Their Tests](#13-common-compose-bugs-and-their-tests)
14. [Interview Q&A on Compose](#14-interview-qa-on-compose)

---

## 1. Imperative vs Declarative UI — The Fundamental Shift

### Imperative UI (XML + Views — the old way)

In the imperative model, you **describe HOW to change the UI** step by step:

```kotlin
// You: "Find the text view. Change its text. Find the button. Hide it. Find the spinner. Show it."
// You manage the transition between states manually

fun showLoadingState() {
    binding.citationList.visibility = View.GONE
    binding.errorView.visibility    = View.GONE
    binding.loadingSpinner.visibility = View.VISIBLE
    binding.retryButton.visibility  = View.GONE
}

fun showSuccessState(citations: List<Citation>) {
    binding.loadingSpinner.visibility = View.GONE
    binding.errorView.visibility      = View.GONE
    binding.citationList.visibility   = View.VISIBLE
    binding.retryButton.visibility    = View.GONE
    adapter.submitList(citations)
}

fun showErrorState(message: String) {
    binding.loadingSpinner.visibility = View.GONE
    binding.citationList.visibility   = View.GONE
    binding.errorView.visibility      = View.VISIBLE
    binding.errorText.text            = message
    binding.retryButton.visibility    = View.VISIBLE
}
// If you add a 4th UI element, you update EVERY function.
// Forgetting one = UI inconsistency bug.
```

### Declarative UI (Compose — the current way)

In the declarative model, you **describe WHAT the UI should look like** for a given state:

```kotlin
// You: "Given this state, the UI looks like THIS."
// Compose figures out the HOW — what to add, remove, update.

@Composable
fun CitationListScreen(uiState: CitationListUiState, onRetry: () -> Unit) {
    when (uiState) {
        is CitationListUiState.Loading ->
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        is CitationListUiState.Success ->
            LazyColumn {
                items(uiState.citations) { citation ->
                    CitationItem(citation = citation)
                }
            }
        is CitationListUiState.Error ->
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(uiState.message, color = MaterialTheme.colorScheme.error)
                Button(onClick = onRetry) { Text("Retry") }
            }
        is CitationListUiState.Empty ->
            Text("No citations found")
    }
    // Adding a 4th state: just add a branch to the when expression.
    // Existing branches don't change.
}
```

**The key insight**: In declarative UI, you never manually show/hide views. You describe the complete UI for each state and let the framework transition between them.

---

## 2. What a Composable Function Is

```kotlin
@Composable  // ← This annotation marks a Compose UI function
fun CitationItem(
    citation: Citation,
    onClick: () -> Unit,        // events flow UP (callbacks from UI to caller)
    modifier: Modifier = Modifier  // always accept a Modifier for flexibility
) {
    // Composable functions:
    // 1. Can call other Composable functions
    // 2. Cannot return useful values (they emit UI)
    // 3. Should be fast and side-effect-free
    // 4. May be called multiple times per second (recomposition)

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = citation.id,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = citation.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
        StatusBadge(status = citation.status)
    }
}

@Composable
fun StatusBadge(status: String) {
    val (color, label) = when (status) {
        "PENDING" -> MaterialTheme.colorScheme.tertiary to "Pending"
        "PAID"    -> MaterialTheme.colorScheme.primary to "Paid"
        "OVERDUE" -> MaterialTheme.colorScheme.error to "Overdue"
        else      -> MaterialTheme.colorScheme.outline to status
    }
    Surface(
        color = color.copy(alpha = 0.15f),
        shape = RoundedCornerShape(4.dp)
    ) {
        Text(
            text = label,
            color = color,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall
        )
    }
}
```

### Composable Naming Convention

```
Rule: Composables that emit UI → PascalCase (like class names)
Rule: Composables that return a value → camelCase (like functions)

@Composable fun CitationItem(...) { }         ← emits UI → PascalCase ✓
@Composable fun rememberCitationState() = ... ← returns value → camelCase ✓
```

### The Modifier Pattern

```kotlin
// ALWAYS accept a modifier parameter and apply it to the root composable
// This allows callers to customize layout behavior:

@Composable
fun CitationItem(
    citation: Citation,
    modifier: Modifier = Modifier  // default to empty Modifier
) {
    Row(modifier = modifier) {  // ← applied to root
        ...
    }
}

// Caller can now customize:
CitationItem(
    citation = citation,
    modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 16.dp)
        .animateItemPlacement()  // for LazyList animations
)
```

---

## 3. Recomposition — How Compose Updates the UI

### What Recomposition Is

When state changes, Compose **re-executes the affected Composable functions** to compute the new UI. This is called recomposition.

```
STATE CHANGES (e.g., citations list updated)
           │
           ▼
Compose identifies which Composables READ that state
           │
           ▼
Those Composables are recomposed (their functions re-run)
           │
           ▼
Compose diffs the old composition tree with the new one
           │
           ▼
Only the CHANGED parts of the UI are updated on screen
(similar to React's virtual DOM reconciliation)
```

### Composables Are Smart — They Skip Unchanged Parts

```kotlin
@Composable
fun CitationListScreen(uiState: CitationListUiState) {
    // Only recomposed when uiState changes

    when (uiState) {
        is CitationListUiState.Success -> {
            CitationList(citations = uiState.citations)  // recomposed if citations change
            Toolbar(title = "My Citations")              // NOT recomposed if title doesn't change
        }
        ...
    }
}

// Compose tracks which composable read which state.
// If Toolbar reads no state that changed, it is SKIPPED in recomposition.
// This is called "smart recomposition" or "skipping".
```

### The Rules of Recomposition

**Rule 1: Composables must be idempotent** — running them multiple times with the same input must produce the same output. No side effects inside composable functions.

```kotlin
// WRONG — side effect inside composable (network call):
@Composable
fun CitationList(citationId: String) {
    val data = fetchFromNetwork(citationId)  // called on EVERY recomposition — very wrong
    Text(data.description)
}

// CORRECT — use LaunchedEffect for side effects:
@Composable
fun CitationList(citationId: String) {
    var data by remember { mutableStateOf<Citation?>(null) }
    LaunchedEffect(citationId) {  // only runs when citationId changes
        data = fetchFromNetwork(citationId)
    }
    data?.let { Text(it.description) }
}
```

**Rule 2: Composables can recompose in any order** — never assume the order of recomposition.

**Rule 3: Recomposition can happen frequently** — on any state change, even 60+ times per second. Every composable must be FAST.

```kotlin
// WRONG — expensive computation in composable:
@Composable
fun SortedList(items: List<Citation>) {
    val sorted = items.sortedBy { it.amount }  // sorted on EVERY recomposition — expensive
    LazyColumn { items(sorted) { CitationItem(it) } }
}

// CORRECT — compute outside composable or use remember:
@Composable
fun SortedList(items: List<Citation>) {
    // remember caches the result and only recomputes when 'items' changes
    val sorted = remember(items) { items.sortedBy { it.amount } }
    LazyColumn { items(sorted) { CitationItem(it) } }
}
```

---

## 4. State in Compose — remember and rememberSaveable

### `remember` — Survive Recomposition

```kotlin
@Composable
fun Counter() {
    // WITHOUT remember: count is reset to 0 on EVERY recomposition
    var count = 0  // WRONG — always 0

    // WITH remember: count survives recompositions (but NOT rotation/process death)
    var count by remember { mutableStateOf(0) }  // CORRECT

    Column {
        Text("Count: $count")
        Button(onClick = { count++ }) { Text("Increment") }
    }
}
```

### `rememberSaveable` — Survive Recomposition AND Configuration Changes

```kotlin
@Composable
fun SearchBar(onSearch: (String) -> Unit) {
    // rememberSaveable: survives rotation AND process death (saved to Bundle)
    // Same mechanism as onSaveInstanceState — stores in the instance state Bundle
    var query by rememberSaveable { mutableStateOf("") }

    OutlinedTextField(
        value = query,
        onValueChange = { query = it },
        placeholder = { Text("Search citations...") },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = { query = "" }) {
                    Icon(Icons.Default.Clear, contentDescription = "Clear")
                }
            }
        }
    )
}
```

### remember vs rememberSaveable — When to Use Which

```
remember:
  ✓ Expensive object creation (adapters, CoroutineScope)
  ✓ Intermediate UI state that's cheap to rebuild (whether a menu is expanded)
  ✓ Anything that doesn't need to survive rotation
  ✗ Does NOT survive rotation or process death

rememberSaveable:
  ✓ Text field content
  ✓ Selected tab index
  ✓ Scroll position (important for UX)
  ✓ Any UI state the user would be annoyed to lose on rotation
  ✓ Survives rotation AND process death
  ✗ Cannot store large objects (same 1MB Bundle limit)
  ✗ Objects must be Parcelable or use custom Saver

RULE: For data-driven state → put in ViewModel
      For local UI state that user controls → use rememberSaveable
      For transient computed state → use remember
```

---

## 5. State Hoisting — The Right Way to Structure State

State hoisting is the pattern of **moving state up** to the lowest common ancestor of the composables that need it.

### The Pattern

```kotlin
// WRONG — state inside the composable (not hoisted):
@Composable
fun CitationSearchBar() {
    var query by remember { mutableStateOf("") }
    // Problem: this composable is stateful — hard to test, hard to reuse
    // The screen cannot observe 'query' from outside
    TextField(value = query, onValueChange = { query = it })
}

// CORRECT — stateless composable with hoisted state:
@Composable
fun CitationSearchBar(
    query: String,              // state flows DOWN (from parent to child)
    onQueryChange: (String) -> Unit  // events flow UP (from child to parent)
) {
    TextField(
        value = query,
        onValueChange = onQueryChange  // forward event up — don't handle here
    )
}

// Parent holds the state:
@Composable
fun CitationListScreen(viewModel: CitationListViewModel) {
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()

    CitationSearchBar(
        query = searchQuery,
        onQueryChange = viewModel::onSearchQueryChanged  // event goes to ViewModel
    )
}
```

### Why State Hoisting Matters

```
BENEFITS:
1. Testability: CitationSearchBar can be tested with any query/onQueryChange
   Without real state or ViewModel
2. Reusability: CitationSearchBar works anywhere, controlled by its parent
3. Single source of truth: state lives in ONE place (ViewModel or parent)
4. Composables become stateless (pure functions of their inputs)
   → Easier to reason about
   → Easier to preview in Android Studio
   → Easier to unit test
```

---

## 6. Connecting Compose to ViewModel

```kotlin
@Composable
fun CitationListScreen(
    // ViewModel is injected by Hilt at the Navigation destination level
    viewModel: CitationListViewModel = hiltViewModel()
) {
    // Collect StateFlow as State — automatically recomposed when value changes
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val filteredCitations by viewModel.filteredCitations.collectAsStateWithLifecycle()

    // Collect one-time events (SharedFlow)
    val navController = LocalNavController.current  // from CompositionLocal
    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is CitationListEvent.NavigateToDetail ->
                    navController.navigate("detail/${event.citationId}")
                is CitationListEvent.ShowErrorSnackbar ->
                    /* show snackbar */
                    Unit
            }
        }
    }

    // Render based on state:
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("My Citations") })
        }
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues)) {
            CitationSearchBar(
                query = searchQuery,
                onQueryChange = viewModel::onSearchQueryChanged
            )
            when (val state = uiState) {
                is CitationListUiState.Loading ->
                    LoadingContent()
                is CitationListUiState.Success ->
                    CitationList(
                        citations = filteredCitations,
                        onCitationClick = viewModel::onCitationClicked
                    )
                is CitationListUiState.Error ->
                    ErrorContent(message = state.message, onRetry = viewModel::onRetryClicked)
                is CitationListUiState.Empty ->
                    EmptyContent()
            }
        }
    }
}
```

### collectAsStateWithLifecycle vs collectAsState

```
collectAsState:
  Collects the Flow regardless of lifecycle
  Continues collecting even when app is in background
  → Can trigger unnecessary recomposition or resource use

collectAsStateWithLifecycle:
  Stops collecting when lifecycle drops below STARTED
  (when app is backgrounded or screen is not visible)
  → Lifecycle-safe, no wasted work, preferred for UI state

RULE: Always use collectAsStateWithLifecycle() for UI state collections
      It requires: implementation("androidx.lifecycle:lifecycle-runtime-compose:...")
```

---

## 7. Jetpack Compose Layouts

### The Three Core Layout Composables

```kotlin
// Row — horizontal layout (like LinearLayout horizontal)
Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.CenterVertically
) {
    Text("Citation ID: CIT-001")
    StatusBadge(status = "PENDING")
}

// Column — vertical layout (like LinearLayout vertical)
Column(
    modifier = Modifier.padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(8.dp)  // 8dp gap between items
) {
    Text("Amount Due", style = MaterialTheme.typography.titleMedium)
    Text("$150.00", style = MaterialTheme.typography.headlineLarge)
    Text("Due: Jan 15, 2024", style = MaterialTheme.typography.bodySmall)
}

// Box — overlap layout (like FrameLayout)
Box(
    modifier = Modifier.fillMaxSize(),
    contentAlignment = Alignment.Center
) {
    Image(painter = painterResource(R.drawable.bg), contentDescription = null)
    Text("Overlay text", color = Color.White)  // drawn on top of Image
}
```

### Modifier — The Layout Language

```kotlin
// Modifiers are applied in ORDER — order matters
Modifier
    .size(100.dp)            // size constraint
    .background(Color.Blue)  // fill with color (inside the size)
    .border(2.dp, Color.Red) // border (outside background, inside size)
    .padding(16.dp)          // inner padding (shrinks the content area)
    .clip(RoundedCornerShape(8.dp))  // clip to rounded corners

// PADDING ORDER MATTERS:
Modifier
    .padding(8.dp)           // outer padding (outside the background)
    .background(Color.Blue)  // background starts INSIDE the padding
    .padding(16.dp)          // inner padding (content pushed in from background edge)
    .fillMaxWidth()           // fill remaining width
```

---

## 8. LazyColumn and LazyRow — Lists in Compose

`LazyColumn` is the Compose equivalent of `RecyclerView`. It only composes items that are currently visible.

```kotlin
@Composable
fun CitationList(
    citations: List<Citation>,
    onCitationClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 8.dp),   // top/bottom padding for the list
        verticalArrangement = Arrangement.spacedBy(4.dp)   // space between items
    ) {
        // items(): key parameter is CRITICAL for performance and animation
        items(
            items = citations,
            key = { citation -> citation.id }  // ← stable key enables:
                                                //   1. Efficient diffing
                                                //   2. Correct animations
                                                //   3. Preserved scroll position
        ) { citation ->
            CitationItem(
                citation = citation,
                onClick = { onCitationClick(citation.id) },
                modifier = Modifier.animateItemPlacement()  // animate insertions/removals
            )
        }

        // Section headers:
        item { SectionHeader(title = "Overdue") }

        // Static items (non-list content in the scroll):
        item {
            Box(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("End of list", style = MaterialTheme.typography.bodySmall)
            }
        }

        // Conditional items:
        if (citations.isEmpty()) {
            item { EmptyStateView() }
        }
    }
}
```

### Pagination with LazyColumn

```kotlin
@Composable
fun PaginatedCitationList(
    citations: List<Citation>,
    isLoadingMore: Boolean,
    onLoadMore: () -> Unit
) {
    val listState = rememberLazyListState()

    LazyColumn(state = listState) {
        items(citations, key = { it.id }) { citation ->
            CitationItem(citation)
        }

        if (isLoadingMore) {
            item {
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(modifier = Modifier.padding(16.dp))
                }
            }
        }
    }

    // Detect when user is near the end of the list
    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisibleItem = listState.layoutInfo.visibleItemsInfo.lastOrNull()
            val totalItems = listState.layoutInfo.totalItemsCount
            lastVisibleItem != null && lastVisibleItem.index >= totalItems - 5
        }
    }

    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) onLoadMore()
    }
}
```

---

## 9. Side Effects in Compose

Side effects are operations that affect the outside world from inside a composable. They must be managed with effect handlers to avoid running on every recomposition.

```kotlin
// LaunchedEffect — run a coroutine as a side effect
// key: the effect re-runs whenever the key changes
@Composable
fun CitationDetailScreen(citationId: String, viewModel: CitationDetailViewModel) {

    // Run once when citationId changes (or when composable first appears)
    LaunchedEffect(citationId) {
        viewModel.loadCitation(citationId)
    }

    // Run once when composable enters composition (Unit = never changes)
    LaunchedEffect(Unit) {
        viewModel.trackScreenView("citation_detail")
    }

    // For ongoing event collection:
    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            // handle navigation events
        }
    }
}

// DisposableEffect — run code on enter AND on exit
@Composable
fun KeepScreenOn() {
    val context = LocalContext.current
    DisposableEffect(Unit) {
        // When composable enters composition:
        val window = (context as Activity).window
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        onDispose {
            // When composable leaves composition:
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }
}

// SideEffect — run a non-suspend side effect after every SUCCESSFUL recomposition
@Composable
fun SyncSystemBranding(toolbarColor: Color) {
    val view = LocalView.current
    // Called after every recomposition where no error occurred
    // Use for: syncing Compose state OUT to non-Compose systems
    SideEffect {
        val window = (view.context as Activity).window
        window.statusBarColor = toolbarColor.toArgb()
    }
}

// derivedStateOf — derived state that only recomputes when inputs change
@Composable
fun FilteredList(items: List<Citation>, filter: String) {
    // WITHOUT derivedStateOf: recomputes on EVERY recomposition of FilteredList
    // even if items and filter haven't changed
    val filtered = remember(items, filter) { items.filter { it.id.contains(filter) } }

    // WITH derivedStateOf: only recomputes when items or filter ACTUALLY change
    // AND only triggers recomposition of consumers when the result changes
    val filtered2 by remember { derivedStateOf { items.filter { it.id.contains(filter) } } }
}
```

---

## 10. Navigation in Compose

```kotlin
// build.gradle.kts:
// implementation("androidx.navigation:navigation-compose:2.8.4")

@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = "citations"
    ) {
        composable("citations") {
            CitationListScreen(
                onNavigateToDetail = { id -> navController.navigate("citation/$id") }
            )
        }

        // Route with argument:
        composable(
            route = "citation/{citationId}",
            arguments = listOf(navArgument("citationId") { type = NavType.StringType })
        ) { backStackEntry ->
            val citationId = backStackEntry.arguments?.getString("citationId") ?: return@composable
            CitationDetailScreen(
                citationId = citationId,
                onNavigateToPayment = { navController.navigate("payment/$citationId") },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = "payment/{citationId}",
            arguments = listOf(navArgument("citationId") { type = NavType.StringType })
        ) { backStackEntry ->
            val citationId = backStackEntry.arguments?.getString("citationId") ?: return@composable
            PaymentScreen(
                citationId = citationId,
                onPaymentSuccess = {
                    // Navigate to success and clear back stack to payment screen
                    // (user can't press back to re-submit payment)
                    navController.navigate("success") {
                        popUpTo("payment/$citationId") { inclusive = true }
                    }
                }
            )
        }
    }
}
```

### Type-Safe Navigation (Compose Navigation 2.8+)

```kotlin
// Define routes as serializable objects — no string typos
@Serializable object Citations
@Serializable data class CitationDetail(val citationId: String)
@Serializable data class Payment(val citationId: String)

NavHost(navController, startDestination = Citations) {
    composable<Citations> {
        CitationListScreen(
            onNavigateToDetail = { id -> navController.navigate(CitationDetail(id)) }
        )
    }
    composable<CitationDetail> { backStackEntry ->
        val args = backStackEntry.toRoute<CitationDetail>()
        CitationDetailScreen(citationId = args.citationId)
    }
}
// Type-safe: navController.navigate(CitationDetail("CIT-001")) — compile-time safety
```

---

## 11. Compose vs XML Views — When to Use What

```
CHOOSE COMPOSE when:
  ✓ Starting a new screen from scratch
  ✓ Complex dynamic UI that changes state frequently
  ✓ Lists with animations
  ✓ Custom UI components
  ✓ The team is Kotlin-first
  ✓ You want unit-testable UI without a device (Compose UI tests are faster)

KEEP XML VIEWS when:
  ✓ Legacy codebase with deep View-based architecture
  ✓ Complex custom views that are expensive to port
  ✓ Third-party libraries that only provide Views (MapView, WebView, etc.)
  ✓ Team not yet trained on Compose

INTEROP (both in same app):
  Compose inside XML: use ComposeView in your XML layout
  XML Views inside Compose: use AndroidView composable
```

```kotlin
// AndroidView — embed a legacy View inside Compose
// Needed for: WebView, MapView, Charts, Camera Preview
@Composable
fun WebViewContent(url: String) {
    val context = LocalContext.current
    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                settings.javaScriptEnabled = true
                webViewClient = WebViewClient()
            }
        },
        update = { webView ->
            // Called on recomposition when 'url' changes
            webView.loadUrl(url)
        }
    )
}
```

---

## 12. Testing Composables

### Compose UI Test Setup

```kotlin
// build.gradle.kts (test dependencies for Compose):
androidTestImplementation("androidx.compose.ui:ui-test-junit4")
debugImplementation("androidx.compose.ui:ui-test-manifest")
```

### Writing Compose UI Tests

```kotlin
@RunWith(AndroidJUnit4::class)
class CitationItemTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun citationItem_showsCorrectId() {
        // Arrange: set up the composable
        val citation = Citation(id = "CIT-001", amount = 150.0, status = "PENDING")

        composeTestRule.setContent {
            MaterialTheme {  // always wrap with theme for colors/typography
                CitationItem(citation = citation, onClick = {})
            }
        }

        // Assert: find by text
        composeTestRule
            .onNodeWithText("CIT-001")
            .assertIsDisplayed()
    }

    @Test
    fun citationItem_showsPendingBadge_whenStatusIsPending() {
        val citation = Citation(id = "CIT-001", amount = 150.0, status = "PENDING")

        composeTestRule.setContent {
            MaterialTheme { CitationItem(citation = citation, onClick = {}) }
        }

        composeTestRule
            .onNodeWithText("Pending")  // the status badge text
            .assertIsDisplayed()
    }

    @Test
    fun citationItem_callsOnClick_whenTapped() {
        val citation = Citation(id = "CIT-001", amount = 150.0, status = "PENDING")
        var clickedCitationId: String? = null

        composeTestRule.setContent {
            MaterialTheme {
                CitationItem(
                    citation = citation,
                    onClick = { clickedCitationId = citation.id }
                )
            }
        }

        composeTestRule
            .onNodeWithText("CIT-001")
            .performClick()

        assertEquals("CIT-001", clickedCitationId)
    }

    @Test
    fun citationListScreen_showsLoadingSpinner_whenStateIsLoading() {
        composeTestRule.setContent {
            MaterialTheme {
                CitationListScreen(
                    uiState = CitationListUiState.Loading,
                    onRetry = {}
                )
            }
        }

        // CircularProgressIndicator has a semantic description
        composeTestRule
            .onNodeWithContentDescription("Loading")
            .assertIsDisplayed()
    }

    @Test
    fun citationListScreen_showsAllItems_whenStateIsSuccess() {
        val citations = listOf(
            Citation(id = "CIT-001", amount = 150.0, status = "PENDING"),
            Citation(id = "CIT-002", amount = 75.0, status = "PAID")
        )

        composeTestRule.setContent {
            MaterialTheme {
                CitationListScreen(
                    uiState = CitationListUiState.Success(citations),
                    onRetry = {}
                )
            }
        }

        composeTestRule.onNodeWithText("CIT-001").assertIsDisplayed()
        composeTestRule.onNodeWithText("CIT-002").assertIsDisplayed()
    }
}
```

### Finders, Actions, and Assertions

```kotlin
// FINDERS — locate a node in the composition tree:
composeTestRule.onNodeWithText("CIT-001")           // by visible text
composeTestRule.onNodeWithContentDescription("Pay") // by accessibility description
composeTestRule.onNodeWithTag("loginButton")        // by test tag (most reliable)
composeTestRule.onAllNodesWithText("PENDING")       // multiple nodes
composeTestRule.onNode(hasText("CIT") and hasClickAction()) // combined matcher

// Test tags (set in production code for reliable test selectors):
Button(
    onClick = onLoginClick,
    modifier = Modifier.testTag("loginButton")  // use this in tests
) { Text("Login") }

// ACTIONS — interact with the node:
.performClick()
.performTextInput("test@email.com")
.performTextClearance()          // clear text field
.performScrollTo()               // scroll until visible
.performImeAction()              // press keyboard action button (Done, Search)
.performTouchInput { swipeLeft() }

// ASSERTIONS — verify the node:
.assertIsDisplayed()
.assertIsNotDisplayed()
.assertIsEnabled()
.assertIsNotEnabled()           // button disabled
.assertIsSelected()             // tab or checkbox selected
.assertTextEquals("Expected")
.assertContentDescriptionEquals("Pay Button")
.assertExists()                 // in composition but may not be visible
.assertDoesNotExist()           // not in composition at all
```

---

## 13. Common Compose Bugs and Their Tests

### Bug 1: Recomposition Loop (Infinite Recomposition)

```kotlin
// WRONG — creating a new lambda on every recomposition causes child to recompose:
@Composable
fun CitationListScreen(viewModel: CitationListViewModel) {
    val citations by viewModel.citations.collectAsStateWithLifecycle()

    CitationList(
        citations = citations,
        // This creates a NEW lambda object on every recomposition of CitationListScreen
        // CitationList sees a "new" onCitationClick → recomposes → loop
        onCitationClick = { id -> viewModel.onCitationClicked(id) }
    )
}

// CORRECT — stable reference:
@Composable
fun CitationListScreen(viewModel: CitationListViewModel) {
    val citations by viewModel.citations.collectAsStateWithLifecycle()

    CitationList(
        citations = citations,
        onCitationClick = viewModel::onCitationClicked  // stable method reference
        // OR: remember { { id: String -> viewModel.onCitationClicked(id) } }
    )
}
```

**QA test**: Profile the screen in Android Studio's Layout Inspector (Compose mode). If a composable is recomposing hundreds of times per second with no user interaction, there is a recomposition loop.

### Bug 2: State Not Preserved on Back Navigation

```kotlin
// WRONG — using remember instead of rememberSaveable for search query:
@Composable
fun CitationListScreen() {
    var searchQuery by remember { mutableStateOf("") }  // lost on rotation
    // User types "CIT-001", rotates device → query is empty
}

// CORRECT:
var searchQuery by rememberSaveable { mutableStateOf("") }
// Better: put it in ViewModel with SavedStateHandle
```

### Bug 3: LazyColumn Without Keys Causing Wrong Item Animations

```kotlin
// WRONG — no key:
LazyColumn {
    items(citations) { citation ->
        CitationItem(citation)
    }
    // When an item is deleted from the middle, Compose doesn't know which item
    // was removed — it animates the wrong items, or shows incorrect state
}

// CORRECT — stable key:
LazyColumn {
    items(citations, key = { it.id }) { citation ->
        CitationItem(citation, modifier = Modifier.animateItemPlacement())
    }
}
```

---

## 14. Interview Q&A on Compose

**Q: "What is recomposition and how does Compose minimize it?"**

> "Recomposition is the process of re-running composable functions when the state they read changes. Compose minimizes it through smart recomposition: it only re-executes composables that actually read changed state, skipping all others. A composable is skippable if its parameters are stable — meaning Compose can determine whether they've changed without running the composable. Data classes, primitive types, and StateFlow values are typically stable. Unstable types (mutable collections, non-data classes) force Compose to always recompose the consumer. The @Stable and @Immutable annotations can mark types as stable to help the compiler generate optimal code."

**Q: "What is the difference between remember and rememberSaveable?"**

> "Both cache values across recompositions, but they differ in survival scope. `remember` survives recompositions but is lost when the composable leaves the composition — so it doesn't survive rotation or process death. `rememberSaveable` persists its value in the instance state Bundle, the same mechanism as `onSaveInstanceState`, so it survives both configuration changes and process death. The tradeoff: rememberSaveable has a ~1MB size limit and requires the stored value to be Parcelable or serializable. For complex data, the ViewModel with SavedStateHandle is the right place, not rememberSaveable."

**Q: "What is state hoisting and why is it important?"**

> "State hoisting is moving state from a composable up to its caller, making the composable stateless — it receives state as input and emits events as output. The benefits: stateless composables are easier to test (no internal state to set up), easier to reuse (the caller controls the state), and easier to preview in Android Studio. The principle is 'state flows down, events flow up' — a child composable calls a callback when the user interacts, and the parent (or ViewModel) decides what to do with that event and updates the state that flows back down. This creates a unidirectional data flow that is easy to reason about and debug."

---

**Next in this folder**: [05_Room_Database_And_DataStore.md](./05_Room_Database_And_DataStore.md) — SQLite via Room, entities, DAOs, migrations, and DataStore for preferences.

**Back to**: [Android folder index](./) | [Series index](../)


---

## Reality Check

**"Compose is XML layouts in Kotlin"** — Compose is a DECLARATIVE, reactive paradigm ([15_React, SwiftUI, Flutter]'s shared model — UI as a function of state), fundamentally different from the imperative find-and-mutate-views of XML+View: you DESCRIBE the UI for the current state and Compose RECOMPOSES when state changes (no findViewById, no manual view mutation — the [15_React] mental shift), state drives UI (not the other way — the mutation goes through state, [15_React] one-way flow), and the composition is the tree Compose diffs. "XML in Kotlin" is the syntactic surface; the paradigm shift (imperative to declarative, mutate-views to describe-for-state) is the actual learning curve — and the developer who writes Compose with imperative thinking (trying to mutate, holding view references) fights the model exactly as the [15_React] imperative-thinker does.

**"Recomposition just re-runs my composable"** — Recomposition is SMART and its rules are what you must understand for correctness and performance ([15_React] re-render lessons, Compose flavor): it re-runs composables whose STATE inputs changed (skipping the unchanged — the stability and @Stable/@Immutable that decide skippability, the unstable parameter that forces unnecessary recomposition), it can run FREQUENTLY and in any order and in parallel (so composables must be side-effect-free — the side effect in the composable body that fires on every recomposition, the reason side effects go in LaunchedEffect/DisposableEffect with keys), and it can be SKIPPED or restarted. "Just re-runs" misses that recomposition skips based on stability (the performance model — the [15_React] memoization concern), demands side-effect-free composables (the correctness model — effects belong in the effect APIs), and its frequency-and-ordering assumptions are what naive Compose violates.

**"State in Compose is just variables"** — Compose state must be OBSERVABLE state (remember { mutableStateOf() }) for recomposition to trigger — a plain variable changes and nothing recomposes (the "I updated it but the UI did not change" — the state not wrapped in mutableStateOf), and remember is what SURVIVES recomposition (the value recomputed every recomposition without remember, the [15_React] useMemo/useState role): the remember for surviving recomposition, the rememberSaveable for surviving config change/process death ([02] savedInstanceState integration), and the state hoisting ([15_React] lift-state-up — the stateless composable taking state and callbacks, the reusable-and-testable pattern). "Just variables" produces the no-recomposition bug (plain variable) and the reset-every-recomposition bug (no remember) — Compose state is observable, remembered, and hoisted, and each of those three is a specific mechanic with a specific bug when missed.

**"Compose performance is automatic"** — Compose can be janky from the same over-rendering the whole declarative family has ([15_React, Flutter] performance): the recomposition scope too large (state read high in the tree recomposing everything — the [15_React] blast-radius, the state-read-placement that scopes recomposition), the unstable parameters defeating skipping (the lambda recreated each recomposition, the unstable class — the [15_React] identity lesson), the expensive work in composition (belongs in remember or derivedStateOf — the [15_React] derive-at-render), and the un-keyed lazy lists (the [15_React] key lesson). The Compose compiler and the stability system help, and they do not fix a design that reads state too high or passes unstable parameters. "Automatic" is the baseline; the performance discipline (scope recomposition, ensure stability, hoist expensive computation, key your lists, profile with the layout inspector) is the same as every declarative-UI framework because the over-recomposition failure mode is the same.

**"Testing Compose is like testing Views"** — Compose has its OWN test APIs and a different model ([21_SDET] behavior testing, Compose flavor): the semantics tree (Compose's accessibility-tree equivalent that tests query — the [21_SDET Ch61] aria-snapshot/getByRole cousin, the semantics that ARE the testability-and-accessibility surface), the finders and assertions (onNodeWithText, assertIsDisplayed — querying the semantics), the synchronization (Compose's test clock and idling — the [21_SDET Ch26] flakiness, the animation and async that need the test's synchronization), and the recomposition in tests. "Like testing Views" transfers the behavior-testing concept and misses that Compose tests query the semantics tree with Compose-specific APIs and synchronization — and the semantics-tree testability is itself a feature (the composable untestable-by-semantics is inaccessible-to-screen-readers, the [21_SDET Ch61, 19_FE a11y] one-signal-two-payoffs).
