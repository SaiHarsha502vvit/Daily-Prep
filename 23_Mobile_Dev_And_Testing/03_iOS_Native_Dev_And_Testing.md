# 03. iOS Native — Development Concepts + Complete Testing Stack

**Navigation**: [← Android Native](02_Android_Native_Dev_And_Testing.md) | [📚 Index](00_INDEX.md) | [Flutter →](04_Flutter_Dev_And_Testing.md)

> **Reading contract**: This file teaches iOS development and iOS testing together, level by level. No iOS experience assumed. If you read the Android chapter first, you will see the same ideas expressed through Apple's design choices — a useful comparison. By the end you will understand the iOS app model, Swift essentials, UIKit and SwiftUI, and the complete testing stack: XCTest, XCUITest, and Appium.

---

## Table of Contents

1. [What Is an iOS App? The Mental Model](#1-what-is-an-ios-app-the-mental-model)
2. [Swift Essentials — Only What You Need](#2-swift-essentials--only-what-you-need)
3. [UIViewController — The Core Building Block](#3-uiviewcontroller--the-core-building-block)
4. [The UIViewController Lifecycle](#4-the-uiviewcontroller-lifecycle)
5. [Navigation — How Screens Connect](#5-navigation--how-screens-connect)
6. [SwiftUI — Modern Declarative UI](#6-swiftui--modern-declarative-ui)
7. [State Management in iOS](#7-state-management-in-ios)
8. [Networking — URLSession and async/await](#8-networking--urlsession-and-asyncawait)
9. [Core Data — Structured Local Storage](#9-core-data--structured-local-storage)
10. [iOS Testing Pyramid — Three Levels](#10-ios-testing-pyramid--three-levels)
11. [Level 1: Unit Tests with XCTest](#11-level-1-unit-tests-with-xctest)
12. [Level 2: UI Tests with XCUITest](#12-level-2-ui-tests-with-xcuittest)
13. [Level 3: E2E Tests with Appium XCUITest Driver](#13-level-3-e2e-tests-with-appium-xcuitest-driver)
14. [iOS vs Android — Side-by-Side Comparison](#14-ios-vs-android--side-by-side-comparison)
15. [Interview Questions on iOS](#15-interview-questions-on-ios)

---

## 1. What Is an iOS App? The Mental Model

### The App Bundle (.ipa / .app)

An iOS app is packaged as an `.ipa` file for distribution and an `.app` bundle during development. Like Android's APK, it is a directory of compiled code and resources:

```
MyApp.app/
├── Info.plist            ← THE most important file (like AndroidManifest.xml)
│                           - App name, bundle ID, version
│                           - Permissions declared (NSCameraUsageDescription, etc.)
│                           - Supported device orientations
│                           - URL schemes (for deep links)
│
├── MyApp                 ← Your compiled Swift/Objective-C code (Mach-O binary)
│                           (iOS doesn't use JVM/DEX — native ARM machine code)
│
├── Assets.xcassets/      ← Images, app icon, colors (in a compiled catalog)
│
├── Base.lproj/           ← Storyboard/XIB files (UIKit XML layout files)
│   └── Main.storyboard   ← Defines screen transitions visually
│
└── Frameworks/           ← Third-party libraries (CocoaPods / Swift Package Manager)
```

### Bundle Identifier — iOS's Package Name

```
com.mycompany.myapp
 ↑              ↑
 company        app name
```

Identical concept to Android's package name. Used in:

- Appium selectors: `bundleId: 'com.mycompany.myapp'`
- App Store (must be globally unique)
- Deep links: `myapp://citation/CIT-001`
- Keychain access groups (sharing secrets between apps)

### Key Difference from Android: No Sideloading Without Trust

On Android, you can install any APK if you enable "Unknown Sources". On iOS, every app must be:

1. Signed with an Apple developer certificate
2. Installed via TestFlight (for testers) or the App Store (for users)
3. Or: registered devices can install debug builds from Xcode directly

For Appium testing: you use **signed development builds** on real devices or **unsigned builds** on the iOS Simulator (macOS only).

---

### 🎯 Practice — Level 1

**Question**: Your Appium test declares `bundleId: 'com.mycompany.myapp'`. The QA team changes the bundle ID to `com.mycompany.myapp.staging` for the staging environment. What happens to the test, and what is the correct fix?

<details><summary>Answer</summary>

The test will fail at session creation with an error like: `"Application with bundle identifier 'com.mycompany.myapp' not found on device"`. The app is installed under a DIFFERENT bundle ID now.

The correct fix: **parameterize the bundle ID** via a configuration value, not hardcoded in the test:

```java
// Java — Appium setup
String bundleId = System.getProperty("app.bundleId", "com.mycompany.myapp");

XCUITestOptions options = new XCUITestOptions()
    .setBundleId(bundleId)
    .setDeviceName("iPhone 15 Simulator")
    .setPlatformVersion("17.0");
```

Then in CI:

```bash
# Production test run
mvn test -Dapp.bundleId=com.mycompany.myapp

# Staging test run
mvn test -Dapp.bundleId=com.mycompany.myapp.staging
```

**Why does the staging app have a different bundle ID?** Because iOS treats apps with different bundle IDs as completely separate apps. This lets staging and production coexist on the same device simultaneously.

</details>

---

## 2. Swift Essentials — Only What You Need

You need enough Swift to read iOS code and understand what you are testing. These are the patterns you will see constantly.

### Optionals — Swift's Answer to Null Safety

Swift does not allow variables to be `nil` (null) unless you explicitly declare them as Optional. This prevents the entire class of null pointer exceptions common in Java.

```swift
// Regular variable — CANNOT be nil
var username: String = "Harsha"
username = nil  // ❌ Compiler error: cannot assign nil to non-optional

// Optional variable — CAN be nil (declared with ?)
var username: String? = "Harsha"
username = nil  // ✅ Allowed

// Unwrapping optionals — four ways:

// 1. Force unwrap (!) — dangerous, crashes if nil
let count = username!.count  // CRASH if username is nil

// 2. Optional binding — safe, most common
if let name = username {
    print("Hello, \(name)")  // name is a non-optional String here
} else {
    print("No username")
}

// 3. Nil coalescing — provide a default
let displayName = username ?? "Guest"  // "Guest" if username is nil

// 4. Optional chaining — safely access properties on optionals
let count = username?.count  // Returns Int? (nil if username is nil)
```

### Closures — Swift's Lambdas

Closures are the iOS equivalent of Java lambdas. They appear everywhere: API callbacks, UI actions, animations.

```swift
// Basic closure — a function stored in a variable
let greet: (String) -> String = { name in
    return "Hello, \(name)!"
}
print(greet("Harsha"))  // "Hello, Harsha!"

// Trailing closure syntax — when the last argument is a closure
// This is what you see constantly in iOS code
button.addAction(UIAction { action in
    // This runs when button is tapped
    print("Button tapped!")
}, for: .touchUpInside)

// Completion handlers — iOS's pre-async/await callback pattern
func fetchUser(id: String, completion: @escaping (User?, Error?) -> Void) {
    URLSession.shared.dataTask(with: url) { data, _, error in
        if let error = error {
            completion(nil, error)
            return
        }
        let user = decode(data)
        completion(user, nil)
    }.resume()
}

// Calling it:
fetchUser(id: "USR-001") { user, error in
    if let user = user {
        self.displayUser(user)
    }
}
```

### Protocols — Swift's Interfaces

A protocol defines a contract — exactly like a Java interface:

```swift
// Protocol definition (like Java interface)
protocol AuthRepository {
    func login(username: String, password: String) async throws -> AuthResult
    func logout() async
}

// Concrete implementation
class NetworkAuthRepository: AuthRepository {
    func login(username: String, password: String) async throws -> AuthResult {
        // real network call
        let response = try await apiClient.post("/auth/login", body: ["username": username])
        return AuthResult(userId: response.userId)
    }

    func logout() async {
        try? await apiClient.post("/auth/logout", body: [:])
    }
}

// Fake for testing
class FakeAuthRepository: AuthRepository {
    var shouldSucceed = true

    func login(username: String, password: String) async throws -> AuthResult {
        if shouldSucceed { return AuthResult(userId: "USR-TEST") }
        throw AuthError.invalidCredentials
    }

    func logout() async {}
}
```

---

### 🎯 Practice — Level 1

**Question**: What does this Swift code do, and what bug does it contain?

```swift
func showCitationAmount(citation: Citation?) {
    let amount = citation!.amount
    amountLabel.text = "$\(amount)"
}
```

<details><summary>Answer</summary>

**What it does**: Takes an optional `Citation` and displays its amount in a label.

**The bug**: Force unwrap (`citation!`) will crash the app with a fatal error if `citation` is `nil`. This is the Swift equivalent of a `NullPointerException`.

**The fix** using optional binding:

```swift
func showCitationAmount(citation: Citation?) {
    // Safe unwrap — only execute if citation is not nil
    guard let citation = citation else {
        amountLabel.text = "Amount unavailable"
        return
    }
    amountLabel.text = "$\(citation.amount)"
}
```

Or with nil coalescing for the label:

```swift
func showCitationAmount(citation: Citation?) {
    let displayAmount = citation.map { "$\($0.amount)" } ?? "Amount unavailable"
    amountLabel.text = displayAmount
}
```

**Why this matters for testing**: If your Appium or XCUITest test navigates to a screen where `citation` is nil (unexpected state from a previous test), the app will crash — not show a graceful error. The test will fail with "Application not running" rather than an assertion error, making the root cause harder to diagnose.

</details>

---

## 3. UIViewController — The Core Building Block

### What Is a UIViewController?

A `UIViewController` manages one screen (or a portion of a screen). It is the iOS equivalent of Android's `Activity`. It owns:

- A `view` (the root `UIView` of the screen)
- The layout of that view (Auto Layout or SwiftUI)
- The logic that responds to user interaction

```swift
// A basic UIViewController
class LoginViewController: UIViewController {

    // IBOutlet — connects a UI element from the Storyboard to code
    @IBOutlet weak var usernameTextField: UITextField!
    @IBOutlet weak var passwordTextField: UITextField!
    @IBOutlet weak var loginButton: UIButton!
    @IBOutlet weak var errorLabel: UILabel!

    // viewDidLoad is the entry point — called once when the view is first loaded
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    private func setupUI() {
        errorLabel.isHidden = true
        loginButton.layer.cornerRadius = 8
    }

    // IBAction — connects a UI interaction (tap) from Storyboard to code
    @IBAction func loginButtonTapped(_ sender: UIButton) {
        guard
            let username = usernameTextField.text, !username.isEmpty,
            let password = passwordTextField.text, !password.isEmpty
        else {
            errorLabel.text = "Please fill in all fields"
            errorLabel.isHidden = false
            return
        }

        // Delegate to ViewModel (MVVM pattern)
        viewModel.login(username: username, password: password)
    }
}
```

### Programmatic UI (Without Storyboard)

Many modern iOS teams avoid Storyboards because they are binary XML files that cause git merge conflicts. Pure code UI:

```swift
class LoginViewController: UIViewController {

    // Create views in code
    private let usernameTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Email"
        tf.keyboardType = .emailAddress
        tf.borderStyle = .roundedRect
        tf.accessibilityIdentifier = "loginUsernameField"  // ← For XCUITest!
        tf.translatesAutoresizingMaskIntoConstraints = false
        return tf
    }()

    private let loginButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.setTitle("Login", for: .normal)
        btn.accessibilityIdentifier = "loginButton"  // ← For XCUITest!
        btn.translatesAutoresizingMaskIntoConstraints = false
        return btn
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        setupLayout()
        loginButton.addAction(UIAction { [weak self] _ in
            self?.handleLogin()
        }, for: .touchUpInside)
    }

    private func setupLayout() {
        view.addSubview(usernameTextField)
        view.addSubview(loginButton)

        // Auto Layout constraints
        NSLayoutConstraint.activate([
            usernameTextField.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            usernameTextField.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -50),
            usernameTextField.widthAnchor.constraint(equalToConstant: 280),

            loginButton.topAnchor.constraint(equalTo: usernameTextField.bottomAnchor, constant: 20),
            loginButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
        ])
    }
}
```

> **Key insight for testing**: `accessibilityIdentifier` is the iOS equivalent of Android's `contentDescription`. It is how XCUITest and Appium find elements. Always ask developers to set it on interactive elements.

---

## 4. The UIViewController Lifecycle

### Why It Exists

Same reason as Android's Activity lifecycle: iOS must manage memory, handle app switching, keyboard appearance, and device rotation.

### The Lifecycle Methods

```
App launches → UIViewController created
                       │
                       ▼
              ┌─────────────────┐
              │   viewDidLoad() │  ← Called ONCE. View hierarchy exists.
              └────────┬────────┘    Set up: add subviews, configure constraints,
                       │            initialize ViewModel, set up bindings.
                       ▼
              ┌─────────────────┐
              │viewWillAppear() │  ← Called EVERY TIME screen is about to appear.
              └────────┬────────┘    Refresh data, start animations, register
                       │            for keyboard notifications.
                       ▼
              ┌─────────────────┐
              │viewDidAppear()  │  ← Screen is fully visible.
              └────────┬────────┘    Start auto-play, analytics tracking, focus field.
                       │
              ┌────────┴────────────────────────┐
              │       USER INTERACTS             │
              └────────┬────────────────────────┘
                       │
              ┌────────┴────────┐
              │viewWillDisappear│  ← Save state, stop animations, pause media.
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │viewDidDisappear │  ← Screen gone. Deregister keyboard notifications.
              └────────┬────────┘    Unsubscribe from observers.
                       │
              ┌────────▼────────┐
              │  deinit         │  ← Object deallocated. Cancel network tasks.
              └─────────────────┘
```

### iOS vs Android Lifecycle Comparison

```
iOS                              Android equivalent
─────────────────────────────    ─────────────────────────────
viewDidLoad()                    onCreate()
viewWillAppear()                 onStart()
viewDidAppear()                  onResume()
viewWillDisappear()              onPause()
viewDidDisappear()               onStop()
deinit                           onDestroy()
```

### The Memory Warning — iOS's Kill-Under-Pressure

iOS does NOT have a garbage collector. It uses **ARC (Automatic Reference Counting)**. When memory is low, iOS sends `didReceiveMemoryWarning()`. If you ignore it and keep allocating, the OS kills your app:

```swift
override func didReceiveMemoryWarning() {
    super.didReceiveMemoryWarning()
    // Release any cached data, images, or objects that can be recreated
    imageCache.removeAll()
    // Do NOT release views or data that is actively displayed
}
```

---

### 🎯 Practice — Level 1

**Question**: An iOS app has a `HomeViewController` that loads a feed from the network in `viewDidLoad()`. The user navigates to `DetailViewController`, comes back, and the feed is STALE — it shows old data. Which lifecycle method should load the feed instead, and why?

<details><summary>Answer</summary>

Move the network fetch from `viewDidLoad()` to `viewWillAppear()`.

**Why `viewDidLoad()` is wrong here**: It is called only ONCE in the entire lifetime of the ViewController. When the user pushes `DetailViewController` and comes back (pops it off the navigation stack), `HomeViewController` is already loaded — `viewDidLoad()` does NOT fire again. The old data stays.

**Why `viewWillAppear()` is correct**: It fires every time the screen becomes visible — both on first appearance AND when returning from a pushed view controller. The feed refreshes each time.

```swift
override func viewDidLoad() {
    super.viewDidLoad()
    setupUI()          // layout, constraints, bindings — do this ONCE
    setupBindings()    // observe ViewModel — do this ONCE
}

override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    viewModel.fetchFeed()  // network call — do this EVERY time screen appears
}
```

**The parallel in Android**: This is like loading data in `onResume()` instead of `onCreate()`.

</details>

---

## 5. Navigation — How Screens Connect

iOS has two fundamental navigation patterns:

### Pattern 1: UINavigationController (Stack Navigation)

Push screens onto a stack. Back button pops them off. Used for hierarchical flows:

```swift
// LoginViewController → HomeViewController
class LoginViewController: UIViewController {

    func navigateToHome(userId: String) {
        // Create the destination ViewController
        let homeVC = HomeViewController(userId: userId)

        // Push it onto the navigation stack
        // This gives it a "< Back" button automatically
        navigationController?.pushViewController(homeVC, animated: true)
    }
}

// Or programmatically pass data via init:
class HomeViewController: UIViewController {
    private let userId: String

    init(userId: String) {
        self.userId = userId
        super.init(nibName: nil, bundle: nil)  // always call super
    }

    required init?(coder: NSCoder) {
        fatalError("Use init(userId:) instead")
    }
}
```

### Pattern 2: UITabBarController (Tab Navigation)

Multiple root screens, each with their own navigation stack. Used for apps with distinct sections (feed, search, profile):

```swift
class AppCoordinator {
    func makeRootViewController() -> UITabBarController {
        let tabBar = UITabBarController()

        let homeVC = UINavigationController(rootViewController: HomeViewController())
        homeVC.tabBarItem = UITabBarItem(title: "Home",
                                          image: UIImage(systemName: "house"),
                                          tag: 0)

        let profileVC = UINavigationController(rootViewController: ProfileViewController())
        profileVC.tabBarItem = UITabBarItem(title: "Profile",
                                             image: UIImage(systemName: "person"),
                                             tag: 1)

        tabBar.viewControllers = [homeVC, profileVC]
        return tabBar
    }
}
```

### Modal Presentation (Pop-up Screens)

```swift
// Present a screen as a modal (slides up from bottom)
func showPaymentModal() {
    let paymentVC = PaymentViewController()
    paymentVC.modalPresentationStyle = .pageSheet  // iOS 15+ card style
    paymentVC.modalTransitionStyle = .coverVertical
    present(paymentVC, animated: true)
}

// Dismiss from the modal itself
class PaymentViewController: UIViewController {
    func onPaymentComplete() {
        dismiss(animated: true)
    }
}
```

---

### 🎯 Practice — Level 2

**Scenario**: You are writing an Appium test that taps a "Pay" button which triggers a modal. The modal has a "Confirm" button. After confirming, the modal dismisses and the home screen shows "Payment Successful". Write the test strategy, noting where iOS navigation creates element visibility challenges.

<details><summary>Answer</summary>

**The challenge**: When a modal is presented in iOS, elements from the presenting view (home screen) are still in the XCUITest element tree, but they are NOT interactable — the modal is on top. You must ensure you interact with elements in the CORRECT layer.

```java
// Appium Java — modal interaction on iOS
@Test
public void paymentModal_confirmSuccessfulPayment() throws Exception {
    // Step 1: Tap Pay on the home screen
    // The home screen is the current view
    XCUIElement payButton = driver.findElement(
        AppiumBy.accessibilityId("payButton")
    );
    payButton.click();

    // Step 2: Wait for the modal to appear
    // Modal has a specific accessibilityIdentifier on its container
    WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
    XCUIElement modal = wait.until(
        ExpectedConditions.presenceOfElementLocated(
            AppiumBy.accessibilityId("paymentConfirmationModal")
        )
    );
    assertTrue(modal.isDisplayed(), "Payment modal should be visible");

    // Step 3: Verify the amount in the modal
    XCUIElement amountLabel = driver.findElement(
        AppiumBy.accessibilityId("modalAmountLabel")
    );
    assertEquals("$150.00", amountLabel.getText());

    // Step 4: Tap Confirm — this is INSIDE the modal
    driver.findElement(AppiumBy.accessibilityId("confirmPaymentButton")).click();

    // Step 5: Modal dismisses — wait for it to disappear
    wait.until(ExpectedConditions.invisibilityOfElementLocated(
        AppiumBy.accessibilityId("paymentConfirmationModal")
    ));

    // Step 6: Home screen's success message is now visible
    XCUIElement successBanner = wait.until(
        ExpectedConditions.presenceOfElementLocated(
            AppiumBy.accessibilityId("paymentSuccessBanner")
        )
    );
    assertTrue(successBanner.isDisplayed());
    assertTrue(successBanner.getText().contains("Payment Successful"));
}
```

**The key patterns**:

- Always wait for modal to appear (`presenceOfElementLocated`) before interacting
- Always wait for modal to disappear (`invisibilityOfElementLocated`) before asserting home state
- Use `accessibilityId` not XPath — iOS's XPath is fragile because the class hierarchy changes with UI updates
- Never assume timing — always use explicit waits

</details>

---

## 6. SwiftUI — Modern Declarative UI

SwiftUI (2019+) is Apple's answer to Jetpack Compose. It is entirely code-based, declarative, and reactive.

### UIKit vs SwiftUI

```swift
// UIKit (traditional — imperative)                SwiftUI (modern — declarative)
// ──────────────────────────────                  ──────────────────────────────

class LoginVC: UIViewController {                  struct LoginView: View {
    var loginButton: UIButton!

    override func viewDidLoad() {                      @State private var username = ""
        loginButton = UIButton()                       @State private var password = ""
        loginButton.setTitle("Login", for: .normal)
        view.addSubview(loginButton)                   var body: some View {
        // 10 lines of constraints...                      VStack(spacing: 16) {
    }                                                          TextField("Email", text: $username)
                                                               SecureField("Password", text: $password)
    func updateButtonState(enabled: Bool) {                    Button("Login") {
        loginButton.isEnabled = enabled                            viewModel.login(username, password)
        loginButton.alpha = enabled ? 1.0 : 0.5               }
    }                                                          .disabled(username.isEmpty || password.isEmpty)
}                                                          }
                                                       }
                                                   }
// You manually update the UI                      // UI automatically re-renders when @State changes
```

### A Real SwiftUI Screen

```swift
// CitationListView.swift
struct CitationListView: View {

    // @StateObject: ViewModel owned by THIS view (created here, lives with this view)
    @StateObject private var viewModel = CitationListViewModel()

    var body: some View {
        NavigationView {
            Group {
                // Conditional rendering based on state
                switch viewModel.state {
                case .loading:
                    ProgressView("Loading citations...")

                case .empty:
                    EmptyStateView(message: "No citations found")

                case .loaded(let citations):
                    List(citations) { citation in
                        // NavigationLink automatically handles push navigation
                        NavigationLink(destination: CitationDetailView(citation: citation)) {
                            CitationRowView(citation: citation)
                        }
                    }
                    .refreshable {
                        // Pull-to-refresh — calls async function
                        await viewModel.refresh()
                    }

                case .error(let message):
                    ErrorView(message: message, onRetry: { viewModel.fetchCitations() })
                }
            }
            .navigationTitle("Citations")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Filter") { viewModel.showFilter = true }
                }
            }
        }
        .onAppear {
            viewModel.fetchCitations()  // equivalent to viewWillAppear
        }
    }
}

// A reusable row component
struct CitationRowView: View {
    let citation: Citation

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(citation.id)
                    .font(.headline)
                    .accessibilityIdentifier("citationId_\(citation.id)")  // for XCUITest

                Text("$\(citation.amount, specifier: "%.2f")")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Status badge with color
            Text(citation.status)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(statusColor(for: citation.status))
                .foregroundColor(.white)
                .clipShape(Capsule())
                .accessibilityIdentifier("citationStatus_\(citation.id)")
        }
        .padding(.vertical, 4)
    }

    private func statusColor(for status: String) -> Color {
        switch status {
        case "PAID":      return .green
        case "PENDING":   return .orange
        case "CANCELLED": return .red
        default:          return .gray
        }
    }
}
```

---

## 7. State Management in iOS

iOS has a layered state system. Each layer solves a different scope of the problem.

### The Four Layers

```
Layer 1: @State          — Local to one View (e.g., "is this dropdown open?")
Layer 2: @StateObject    — ViewModel owned by a View (survives view redraws)
Layer 3: @ObservedObject — ViewModel passed into a View from outside
Layer 4: @EnvironmentObject — Shared state injected into the entire view tree
```

### Layer 1 and 2: @State and @StateObject

```swift
// @State — for simple local state (strings, bools, ints)
struct SearchBar: View {
    @State private var searchText = ""     // lives with this SearchBar instance
    @State private var isSearching = false

    var body: some View {
        HStack {
            TextField("Search citations", text: $searchText)
                // $searchText is a Binding — two-way connection
                // TextField writes to it, @State reads from it
            if isSearching {
                ProgressView()
            }
        }
    }
}

// @StateObject — for complex ViewModel state
// The View OWNS this ViewModel. Created once, lives until view leaves the tree.
struct CitationListView: View {
    @StateObject private var viewModel = CitationListViewModel()
    // ViewModel is NOT recreated on view redraws — unlike plain object creation
}
```

### Layer 3: @ObservedObject — Passing ViewModel In

```swift
// Use @ObservedObject when the ViewModel is CREATED ELSEWHERE and passed in
struct CitationDetailView: View {
    @ObservedObject var viewModel: CitationDetailViewModel
    // Parent creates the ViewModel and passes it in
    // This view does NOT own it — the parent does
}

// Parent view:
struct ParentView: View {
    @StateObject private var detailVM = CitationDetailViewModel(citationId: "CIT-001")

    var body: some View {
        CitationDetailView(viewModel: detailVM)
        // detailVM is still OWNED by ParentView (StateObject)
        // CitationDetailView just OBSERVES it (ObservedObject)
    }
}
```

### Layer 4: @EnvironmentObject — App-Wide Shared State

```swift
// Define the shared state (must be ObservableObject)
class AppSession: ObservableObject {
    @Published var currentUser: User? = nil
    @Published var isLoggedIn: Bool = false
    @Published var cartItemCount: Int = 0

    func login(user: User) {
        currentUser = user
        isLoggedIn = true
    }

    func logout() {
        currentUser = nil
        isLoggedIn = false
        cartItemCount = 0
    }
}

// Inject at the root level (once)
@main
struct MyApp: App {
    @StateObject private var session = AppSession()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(session)  // injected into entire view tree
        }
    }
}

// ANY view in the tree can access it — no prop drilling
struct ProfileView: View {
    @EnvironmentObject var session: AppSession  // automatically provided

    var body: some View {
        if let user = session.currentUser {
            Text("Hello, \(user.name)")
        }
        Button("Logout") {
            session.logout()
        }
    }
}

struct CartBadgeView: View {
    @EnvironmentObject var session: AppSession

    var body: some View {
        Text("\(session.cartItemCount)")
            .badge(session.cartItemCount)
    }
}
```

---

### 🎯 Practice — Level 2

**Question**: A developer uses `@State private var user: User?` in `HomeView` to store the logged-in user. When the user navigates to `ProfileView` (a child view), they change their display name. When they come back to `HomeView`, the name is NOT updated. Why? What is the correct fix?

<details><summary>Answer</summary>

**Why it fails**: `@State` is local to the view instance. When you change the user's name in `ProfileView`, you're changing a copy (or a separate view's state). The `@State` in `HomeView` has no connection to whatever `ProfileView` is modifying.

**Root cause**: State management scope mismatch. The user object is SHARED application state (needed by multiple views), not LOCAL view state. `@State` is only for values owned by ONE specific view.

**The correct fix**: Lift the state to an `@EnvironmentObject`:

```swift
// AppSession holds shared state (as shown above)
class AppSession: ObservableObject {
    @Published var currentUser: User? = nil
}

// HomeView — observes from environment
struct HomeView: View {
    @EnvironmentObject var session: AppSession

    var body: some View {
        Text("Hello, \(session.currentUser?.name ?? "Guest")")
        // Automatically updates when session.currentUser changes ANYWHERE
    }
}

// ProfileView — modifies the same shared state
struct ProfileView: View {
    @EnvironmentObject var session: AppSession
    @State private var displayName = ""

    var body: some View {
        TextField("Display Name", text: $displayName)
        Button("Save") {
            session.currentUser?.name = displayName
            // @Published triggers HomeView to rerender automatically
        }
    }
}
```

**The rule**:

- `@State` → one view owns the data, no other view needs it
- `@StateObject/@ObservedObject` → one view tree owns data, child views observe it
- `@EnvironmentObject` → multiple branches of the view tree need the same data

</details>

---

## 8. Networking — URLSession and async/await

### The Evolution of iOS Networking

iOS networking went through three generations:

```
Generation 1 (pre-2012): NSURLConnection — delegate-based, complex
Generation 2 (2013-2021): URLSession with completion handlers — closure-based
Generation 3 (2021+):    URLSession with async/await — clean, Swift native
```

Modern iOS uses async/await. Here is how it works:

```swift
// The data model
struct Citation: Codable, Identifiable {
    let id: String
    let amount: Double
    let status: String
}

// The API client
class CitationAPIClient {
    private let baseURL = URL(string: "https://api.myapp.com")!
    private let session = URLSession.shared

    // async throws — can be awaited, can throw errors
    func fetchCitations() async throws -> [Citation] {
        let url = baseURL.appendingPathComponent("/citations")
        var request = URLRequest(url: url)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(AuthToken.current)", forHTTPHeaderField: "Authorization")

        // await suspends the function without blocking the thread
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            return try JSONDecoder().decode([Citation].self, from: data)
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        default:
            throw APIError.serverError(statusCode: httpResponse.statusCode)
        }
    }

    func payCitation(id: String, amount: Double) async throws -> PaymentResult {
        let url = baseURL.appendingPathComponent("/citations/\(id)/pay")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["amount": amount])

        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(PaymentResult.self, from: data)
    }
}

// Error types
enum APIError: Error {
    case invalidResponse
    case unauthorized
    case notFound
    case serverError(statusCode: Int)
}
```

```swift
// The ViewModel — calls the API, updates state
class CitationListViewModel: ObservableObject {
    @Published var citations: [Citation] = []
    @Published var isLoading = false
    @Published var errorMessage: String? = nil

    private let apiClient: CitationAPIClient

    init(apiClient: CitationAPIClient = CitationAPIClient()) {
        self.apiClient = apiClient
    }

    func fetchCitations() {
        Task {  // Task creates an async context from sync code
            await MainActor.run { isLoading = true }  // UI updates on main thread

            do {
                let result = try await apiClient.fetchCitations()
                await MainActor.run {
                    self.citations = result
                    self.isLoading = false
                }
            } catch APIError.unauthorized {
                await MainActor.run {
                    self.errorMessage = "Session expired. Please login again."
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "Failed to load: \(error.localizedDescription)"
                    self.isLoading = false
                }
            }
        }
    }
}
```

---

## 9. Core Data — Structured Local Storage

Core Data is iOS's built-in persistence framework — the equivalent of Android's Room database. Both wrap SQLite but expose it differently.

```swift
// Core Data Model — defined in .xcdatamodeld file (like a schema)
// Then Core Data generates the NSManagedObject subclass:

// Citation+CoreDataProperties.swift (auto-generated)
extension CitationEntity: Identifiable {
    @NSManaged var id: String
    @NSManaged var amount: Double
    @NSManaged var status: String
    @NSManaged var createdAt: Date
}

// The Repository — abstracts Core Data operations
class CitationRepository {
    private let viewContext: NSManagedObjectContext

    init(context: NSManagedObjectContext = PersistenceController.shared.container.viewContext) {
        self.viewContext = context
    }

    func saveCitation(_ citation: Citation) throws {
        let entity = CitationEntity(context: viewContext)
        entity.id = citation.id
        entity.amount = citation.amount
        entity.status = citation.status
        entity.createdAt = Date()

        try viewContext.save()
    }

    func fetchAllCitations() throws -> [Citation] {
        let request: NSFetchRequest<CitationEntity> = CitationEntity.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]

        let entities = try viewContext.fetch(request)
        return entities.map { entity in
            Citation(id: entity.id, amount: entity.amount, status: entity.status)
        }
    }

    func fetchPendingCitations() throws -> [Citation] {
        let request: NSFetchRequest<CitationEntity> = CitationEntity.fetchRequest()
        request.predicate = NSPredicate(format: "status == %@", "PENDING")

        let entities = try viewContext.fetch(request)
        return entities.map { Citation(id: entity.id, amount: entity.amount, status: entity.status) }
    }
}

// Core Data in SwiftUI — @FetchRequest does reactive updates automatically
struct CitationListView: View {
    // @FetchRequest is like Room's Flow<List<T>> — auto-updates when DB changes
    @FetchRequest(
        sortDescriptors: [SortDescriptor(\.createdAt, order: .reverse)],
        predicate: NSPredicate(format: "status != %@", "CANCELLED"),
        animation: .default
    )
    private var citations: FetchedResults<CitationEntity>

    var body: some View {
        List(citations) { citation in
            Text("\(citation.id): $\(citation.amount)")
        }
    }
}
```

---

### 🎯 Practice — Level 2

**Question**: Compare Core Data's `NSFetchRequest` with Room's `@Query`. What is the SQL equivalent of `NSPredicate(format: "status == %@ AND amount > %@", "PENDING", 100.0)`?

<details><summary>Answer</summary>

**SQL equivalent**:

```sql
SELECT * FROM citations WHERE status = 'PENDING' AND amount > 100.0;
```

**Core Data vs Room comparison**:

```swift
// Core Data — NSPredicate syntax
let predicate = NSPredicate(format: "status == %@ AND amount > %@",
                            "PENDING", 100.0)
request.predicate = predicate
```

```kotlin
// Room — Kotlin @Query annotation (actual SQL)
@Query("SELECT * FROM citations WHERE status = :status AND amount > :minAmount")
fun getCitationsByStatusAndMinAmount(status: String, minAmount: Double): Flow<List<Citation>>
```

**Key differences**:

| Aspect         | Core Data NSPredicate       | Room @Query           |
| -------------- | --------------------------- | --------------------- |
| Query language | NSPredicate format string   | Raw SQL               |
| Type safety    | Runtime only                | Compile-time checked  |
| Readability    | Harder (format strings)     | Easier (familiar SQL) |
| Joins          | Via relationship properties | Explicit SQL JOIN     |
| Relationships  | `relationship.property`     | JOIN statement        |
| Auto-update    | `@FetchRequest` in SwiftUI  | `Flow<T>` in Kotlin   |

**Relationship query in Core Data**:

```swift
// "Find citations where the user's city is 'Austin'"
// Core Data traverses the relationship automatically
NSPredicate(format: "user.city == %@", "Austin")
```

```kotlin
// Room needs an explicit JOIN
@Query("""
    SELECT c.* FROM citations c
    INNER JOIN users u ON c.userId = u.id
    WHERE u.city = :city
""")
fun getCitationsByUserCity(city: String): Flow<List<Citation>>
```

</details>

---

## 10. iOS Testing Pyramid — Three Levels

```
                        ▲
                       / \
                      /   \
                     / E2E \      ← Appium XCUITest Driver (few, slow, high value)
                    /       \
                   /─────────\
                  / XCUITest  \   ← Apple's XCUITest framework (medium count)
                 /             \
                /───────────────\
               /   XCTest Units  \ ← Swift unit tests — no device needed (many)
              /___________________\
```

| Layer | Tool                   | Runs On                  | Speed     | Count  |
| ----- | ---------------------- | ------------------------ | --------- | ------ |
| Unit  | XCTest                 | macOS (no device)        | ~10-100ms | Many   |
| UI    | XCUITest               | Simulator or real device | ~2-15s    | Medium |
| E2E   | Appium XCUITest Driver | Simulator or real device | ~30-120s  | Few    |

---

## 11. Level 1: Unit Tests with XCTest

XCTest is Apple's built-in test framework. No third-party libraries needed for basic testing.

```swift
// CitationViewModelTests.swift
import XCTest
@testable import MyApp  // @testable exposes internal types to the test target

// XCTestCase — all test classes inherit from this
final class CitationListViewModelTests: XCTestCase {

    private var sut: CitationListViewModel!  // sut = System Under Test
    private var fakeAPI: FakeCitationAPIClient!

    // Runs before each test method
    override func setUp() {
        super.setUp()
        fakeAPI = FakeCitationAPIClient()
        sut = CitationListViewModel(apiClient: fakeAPI)
    }

    // Runs after each test method — clean up
    override func tearDown() {
        sut = nil
        fakeAPI = nil
        super.tearDown()
    }

    // Test method names start with "test" — XCTest discovers them automatically
    func test_initialState_citationsIsEmpty() {
        XCTAssertTrue(sut.citations.isEmpty)
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.errorMessage)
    }

    // Async test — uses async/await natively in XCTest
    func test_fetchCitations_success_populatesCitations() async throws {
        // Given: API returns 3 citations
        fakeAPI.citationsToReturn = [
            Citation(id: "CIT-001", amount: 150.0, status: "PENDING"),
            Citation(id: "CIT-002", amount: 200.0, status: "PAID"),
            Citation(id: "CIT-003", amount: 75.50, status: "PENDING"),
        ]

        // When: fetch is called
        sut.fetchCitations()

        // Await: wait for async Task to complete using expectation
        let expectation = expectation(description: "Citations loaded")
        var attempts = 0
        while sut.isLoading && attempts < 10 {
            try await Task.sleep(nanoseconds: 100_000_000)  // 100ms
            attempts += 1
        }

        // Then: citations are set, loading is false
        XCTAssertEqual(sut.citations.count, 3)
        XCTAssertEqual(sut.citations[0].id, "CIT-001")
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.errorMessage)
    }

    func test_fetchCitations_unauthorized_setsSessionExpiredError() async throws {
        // Given: API throws unauthorized
        fakeAPI.errorToThrow = APIError.unauthorized

        // When
        sut.fetchCitations()
        try await Task.sleep(nanoseconds: 200_000_000)  // 200ms for Task to complete

        // Then
        XCTAssertTrue(sut.citations.isEmpty)
        XCTAssertFalse(sut.isLoading)
        XCTAssertEqual(sut.errorMessage, "Session expired. Please login again.")
    }

    // Test helper assertion — custom assertion with a clear message
    func test_fetchCitations_emptyResponse_showsEmptyState() async throws {
        fakeAPI.citationsToReturn = []
        sut.fetchCitations()
        try await Task.sleep(nanoseconds: 200_000_000)

        XCTAssertTrue(sut.citations.isEmpty, "Expected empty citations array but got \(sut.citations.count) items")
        // The message appears in test output when the assertion fails — makes debugging easier
    }
}

// Fake API client for testing
class FakeCitationAPIClient: CitationAPIClient {
    var citationsToReturn: [Citation] = []
    var errorToThrow: Error? = nil

    override func fetchCitations() async throws -> [Citation] {
        if let error = errorToThrow { throw error }
        return citationsToReturn
    }
}
```

### Testing With Combine (If the Project Uses Combine Instead of async/await)

```swift
import Combine

func test_fetchCitations_publishesResultsToSubscribers() {
    let expectation = expectation(description: "Citations published")
    var cancellables = Set<AnyCancellable>()

    fakeAPI.citationsToReturn = [
        Citation(id: "CIT-001", amount: 150.0, status: "PENDING")
    ]

    // Subscribe to the Publisher
    sut.$citations
        .dropFirst()  // skip initial empty value
        .sink { citations in
            XCTAssertEqual(citations.count, 1)
            XCTAssertEqual(citations[0].id, "CIT-001")
            expectation.fulfill()  // signal completion
        }
        .store(in: &cancellables)

    sut.fetchCitations()
    waitForExpectations(timeout: 2.0)  // fail if expectation not fulfilled in 2s
}
```

---

### 🎯 Practice — Level 2

**Challenge**: Write XCTest unit tests for a `PaymentViewModel` that has:

- `func pay(amount: Double)` — calls the API and updates state
- State: `.idle`, `.loading`, `.success(receiptId: String)`, `.error(String)`
- Validation: amount must be > 0 and ≤ 10,000

<details><summary>Answer</summary>

```swift
enum PaymentState: Equatable {
    case idle
    case loading
    case success(receiptId: String)
    case error(String)
}

final class PaymentViewModelTests: XCTestCase {
    private var sut: PaymentViewModel!
    private var fakeAPI: FakePaymentAPIClient!

    override func setUp() {
        super.setUp()
        fakeAPI = FakePaymentAPIClient()
        sut = PaymentViewModel(apiClient: fakeAPI)
    }

    override func tearDown() {
        sut = nil
        fakeAPI = nil
        super.tearDown()
    }

    // Validation tests — pure logic, no async needed
    func test_pay_withZeroAmount_staysIdle_doesNotCallAPI() {
        sut.pay(amount: 0)
        XCTAssertEqual(sut.state, .idle)
        XCTAssertFalse(fakeAPI.payCalled, "API should NOT be called for zero amount")
    }

    func test_pay_withNegativeAmount_setsError() {
        sut.pay(amount: -50)
        if case .error(let msg) = sut.state {
            XCTAssertTrue(msg.contains("valid amount"))
        } else {
            XCTFail("Expected error state, got \(sut.state)")
        }
    }

    func test_pay_withAmountOver10000_setsError() {
        sut.pay(amount: 10_001)
        if case .error(let msg) = sut.state {
            XCTAssertTrue(msg.contains("10,000"))
        } else {
            XCTFail("Expected error state for amount over limit")
        }
    }

    // Success path
    func test_pay_validAmount_successSetsReceiptId() async throws {
        fakeAPI.receiptIdToReturn = "RCP-42"
        sut.pay(amount: 150.0)
        try await Task.sleep(nanoseconds: 200_000_000)

        XCTAssertEqual(sut.state, .success(receiptId: "RCP-42"))
    }

    // Error path
    func test_pay_apiError_setsErrorState() async throws {
        fakeAPI.errorToThrow = APIError.serverError(statusCode: 500)
        sut.pay(amount: 150.0)
        try await Task.sleep(nanoseconds: 200_000_000)

        if case .error = sut.state { /* pass */ }
        else { XCTFail("Expected error state") }
    }

    // Boundary values — always test the edges
    func test_pay_exactly10000_isAllowed() async throws {
        fakeAPI.receiptIdToReturn = "RCP-MAX"
        sut.pay(amount: 10_000)
        try await Task.sleep(nanoseconds: 200_000_000)

        XCTAssertEqual(sut.state, .success(receiptId: "RCP-MAX"))
    }

    func test_pay_exactlyOneDecimalCent_isAllowed() async throws {
        fakeAPI.receiptIdToReturn = "RCP-SMALL"
        sut.pay(amount: 0.01)  // smallest valid amount
        try await Task.sleep(nanoseconds: 200_000_000)

        XCTAssertEqual(sut.state, .success(receiptId: "RCP-SMALL"))
    }
}
```

</details>

---

## 12. Level 2: UI Tests with XCUITest

XCUITest is Apple's UI testing framework — runs on Simulator or real device. It is the iOS equivalent of Android's Espresso.

### How XCUITest Works

XCUITest runs as a SEPARATE process that drives the app. It queries the **accessibility tree** — the same tree Appium uses via its XCUITest driver.

```swift
// XCUITest test class
import XCTest

final class LoginUITests: XCTestCase {

    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false  // stop test on first failure (recommended)
        app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--reset-state"]
        // launchArguments let you put the app in test mode
        // e.g., use in-memory data, bypass animations
        app.launch()
    }

    override func tearDownWithError() throws {
        app.terminate()
    }

    func test_validLogin_navigatesToHomePage() throws {
        // Find elements by accessibilityIdentifier (set by developer)
        let usernameField = app.textFields["loginUsernameField"]
        let passwordField = app.secureTextFields["loginPasswordField"]
        let loginButton = app.buttons["loginButton"]

        // Assert elements exist before interacting
        XCTAssertTrue(usernameField.waitForExistence(timeout: 5))

        // Interact
        usernameField.tap()
        usernameField.typeText("valid@user.com")

        passwordField.tap()
        passwordField.typeText("correctpass")

        loginButton.tap()

        // Assert home screen appeared
        let homeTitle = app.navigationBars["Home"]
        XCTAssertTrue(homeTitle.waitForExistence(timeout: 10))
    }

    func test_emptyFields_loginButtonIsDisabled() throws {
        let loginButton = app.buttons["loginButton"]
        XCTAssertTrue(loginButton.waitForExistence(timeout: 5))
        XCTAssertFalse(loginButton.isEnabled, "Login button should be disabled when fields are empty")
    }

    func test_invalidLogin_showsErrorMessage() throws {
        app.textFields["loginUsernameField"].tap()
        app.textFields["loginUsernameField"].typeText("bad@user.com")
        app.secureTextFields["loginPasswordField"].tap()
        app.secureTextFields["loginPasswordField"].typeText("wrongpass")
        app.buttons["loginButton"].tap()

        // Error label should appear
        let errorLabel = app.staticTexts["loginErrorLabel"]
        XCTAssertTrue(errorLabel.waitForExistence(timeout: 5))
        XCTAssertTrue(errorLabel.label.contains("Invalid"))
    }
}
```

### Finding Elements in XCUITest

```swift
// XCUIElement query types — from most stable to least:

// 1. accessibilityIdentifier — BEST (explicit, stable)
app.buttons["loginButton"]
app.textFields["usernameField"]

// 2. Label/text — second best
app.buttons["Login"]
app.staticTexts["Welcome Back"]

// 3. Type + index — fragile (breaks if UI order changes)
app.buttons.element(boundBy: 0)  // first button on screen — AVOID

// 4. Predicate — flexible for complex conditions
let pred = NSPredicate(format: "label CONTAINS 'Login'")
app.buttons.matching(pred).firstMatch

// Finding elements in a specific container
let form = app.otherElements["loginForm"]  // accessibilityIdentifier on container
let field = form.textFields["usernameField"]  // scoped search — more precise

// Asserting a collection
let cells = app.cells  // all table/collection cells
XCTAssertGreaterThan(cells.count, 0, "List should have at least one item")

// Waiting for element
let button = app.buttons["confirmButton"]
XCTAssertTrue(button.waitForExistence(timeout: 5),
              "Confirm button should appear within 5 seconds")
```

### Testing a List (Table/Collection)

```swift
func test_citationList_displaysCorrectCount() throws {
    // Navigate to list (assume already logged in via launch arguments)
    let table = app.tables["citationListTable"]
    XCTAssertTrue(table.waitForExistence(timeout: 10))

    let cells = table.cells
    XCTAssertGreaterThan(cells.count, 0, "Citation list should not be empty")
}

func test_citationList_tapFirstCitation_opensDetail() throws {
    let table = app.tables["citationListTable"]
    XCTAssertTrue(table.waitForExistence(timeout: 10))

    // Tap first cell
    table.cells.firstMatch.tap()

    // Detail screen should appear
    let detailTitle = app.navigationBars.staticTexts.firstMatch
    XCTAssertTrue(detailTitle.waitForExistence(timeout: 5))

    // Amount label should be visible on detail
    let amountLabel = app.staticTexts["citationDetailAmount"]
    XCTAssertTrue(amountLabel.exists)
}

func test_pullToRefresh_triggersFeedReload() throws {
    let table = app.tables["citationListTable"]
    XCTAssertTrue(table.waitForExistence(timeout: 10))

    // Pull to refresh: swipe down from top of table
    table.swipeDown()

    // Loading indicator should appear briefly
    let loadingIndicator = app.activityIndicators.firstMatch
    // (it may be too fast to catch — just verify the list still shows)
    XCTAssertTrue(table.cells.count >= 0)
}
```

---

## 13. Level 3: E2E Tests with Appium XCUITest Driver

Appium's XCUITest driver wraps Apple's XCUITest framework and exposes it over WebDriver HTTP. This allows non-Apple languages (Java, Python, JavaScript) to drive iOS apps.

### Appium iOS Setup

```
What you need:
1. macOS machine (Xcode only runs on macOS)
2. Xcode 15+ (includes iOS Simulator)
3. Node.js — Appium server
4. appium driver install xcuitest
5. Your test language: Java + appium-java-client
```

```java
// Java — Full Appium iOS setup
public class BaseIOSTest {

    protected IOSDriver driver;

    @BeforeEach
    public void setUp() throws MalformedURLException {
        XCUITestOptions options = new XCUITestOptions()
            .setPlatformName("iOS")
            .setPlatformVersion("17.0")
            .setDeviceName("iPhone 15 Pro")     // must match Simulator name exactly
            .setApp(System.getProperty("user.dir") + "/apps/MyApp.app")
            .setBundleId("com.mycompany.myapp")
            .setAutomationName("XCUITest")
            .setWdaLaunchTimeout(Duration.ofSeconds(120))  // WDA startup can be slow
            .setNewCommandTimeout(Duration.ofSeconds(60));

        driver = new IOSDriver(new URL("http://127.0.0.1:4723"), options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) driver.quit();
    }
}
```

### A Full iOS E2E Test

```java
public class IOSCitationE2ETest extends BaseIOSTest {

    @Test
    public void completePaymentFlow() throws Exception {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));

        // ── Screen: Login ─────────────────────────────────────────────
        // iOS uses accessibilityId (from accessibilityIdentifier in Swift)
        WebElement usernameField = driver.findElement(
            AppiumBy.accessibilityId("loginUsernameField")
        );
        usernameField.click();
        usernameField.sendKeys("testuser@example.com");

        WebElement passwordField = driver.findElement(
            AppiumBy.accessibilityId("loginPasswordField")
        );
        passwordField.click();
        passwordField.sendKeys("TestPass123!");

        // Dismiss keyboard before tapping button (important on iOS)
        driver.hideKeyboard();

        driver.findElement(AppiumBy.accessibilityId("loginButton")).click();

        // ── Screen: Citation List ─────────────────────────────────────
        WebElement citationList = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("citationListTable")
            )
        );
        assertTrue(citationList.isDisplayed());

        // Scroll to find a specific citation
        // iOS doesn't have UiScrollable — use mobile: scroll command
        HashMap<String, Object> scrollArgs = new HashMap<>();
        scrollArgs.put("direction", "down");
        scrollArgs.put("element", citationList.getId());
        driver.executeScript("mobile: scroll", scrollArgs);

        // Tap the target citation by its accessibility label
        WebElement targetCitation = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("citationCell_CIT-001")
            )
        );
        targetCitation.click();

        // ── Screen: Citation Detail ────────────────────────────────────
        WebElement amountLabel = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("citationDetailAmount")
            )
        );
        assertEquals("$150.00", amountLabel.getText());

        driver.findElement(AppiumBy.accessibilityId("payButton")).click();

        // ── Modal: Payment Confirmation ────────────────────────────────
        WebElement confirmModal = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("paymentConfirmationModal")
            )
        );
        assertTrue(confirmModal.isDisplayed());
        driver.findElement(AppiumBy.accessibilityId("confirmPaymentButton")).click();

        // ── Screen: Success ────────────────────────────────────────────
        WebElement successBanner = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("paymentSuccessBanner")
            )
        );
        assertTrue(successBanner.isDisplayed());
        assertTrue(successBanner.getText().contains("Payment Successful"));
    }

    @Test
    public void scrollingList_findsItemBelowFold() throws Exception {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        loginAs("testuser@example.com", "TestPass123!");

        WebElement list = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("citationListTable")
            )
        );

        // iOS: scroll using mobile: scroll command with direction
        // Keep scrolling until element is found
        boolean found = false;
        for (int i = 0; i < 5; i++) {  // max 5 scrolls
            try {
                WebElement cell = driver.findElement(
                    AppiumBy.accessibilityId("citationCell_CIT-050")
                );
                if (cell.isDisplayed()) {
                    found = true;
                    cell.click();
                    break;
                }
            } catch (NoSuchElementException e) {
                // Scroll down and try again
                HashMap<String, Object> args = new HashMap<>();
                args.put("direction", "down");
                args.put("element", list.getId());
                driver.executeScript("mobile: scroll", args);
            }
        }
        assertTrue(found, "Could not find citationCell_CIT-050 after scrolling");
    }
}
```

---

### 🎯 Practice — Level 3 (Advanced)

**Challenge**: Your iOS Appium test must test a biometric authentication screen (Face ID). When Face ID succeeds, the app navigates to Home. When it fails, an error message appears. How do you test this with Appium — you can't actually present a face to the simulator?

<details><summary>Answer — Point by Point</summary>

The iOS Simulator supports Face ID simulation via `mobile: enrollBiometric` and `mobile: sendBiometricMatch`. Appium exposes these:

```java
// Java — Appium biometric testing on iOS Simulator

// Step 1: Enroll biometric (simulator must have biometric enrolled)
HashMap<String, Object> enrollArgs = new HashMap<>();
enrollArgs.put("isEnabled", true);
driver.executeScript("mobile: enrollBiometric", enrollArgs);

// Step 2: Launch app and reach the biometric prompt
driver.findElement(AppiumBy.accessibilityId("biometricLoginButton")).click();

// Face ID prompt appears — wait for it
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
// The Face ID dialog is system-level — detect it by checking for the alert
WebElement biometricAlert = wait.until(
    ExpectedConditions.alertIsPresent()  // system alert = Face ID dialog
);

// Step 3a: Simulate Face ID SUCCESS
HashMap<String, Object> matchArgs = new HashMap<>();
matchArgs.put("type", "touchId");  // or "faceId" depending on device
matchArgs.put("match", true);      // true = biometric MATCHES
driver.executeScript("mobile: sendBiometricMatch", matchArgs);

// Verify navigation to Home
WebElement homeScreen = wait.until(
    ExpectedConditions.presenceOfElementLocated(
        AppiumBy.accessibilityId("homeScreen")
    )
);
assertTrue(homeScreen.isDisplayed());

// ─────────────────────────────────────────────────────
// Separate test: Step 3b — Simulate Face ID FAILURE
@Test
public void faceIdFailure_showsErrorMessage() throws Exception {
    HashMap<String, Object> enrollArgs = new HashMap<>();
    enrollArgs.put("isEnabled", true);
    driver.executeScript("mobile: enrollBiometric", enrollArgs);

    driver.findElement(AppiumBy.accessibilityId("biometricLoginButton")).click();

    HashMap<String, Object> failArgs = new HashMap<>();
    failArgs.put("type", "faceId");
    failArgs.put("match", false);  // false = biometric FAILS
    driver.executeScript("mobile: sendBiometricMatch", failArgs);

    // Error message should appear
    WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
    WebElement errorMsg = wait.until(
        ExpectedConditions.presenceOfElementLocated(
            AppiumBy.accessibilityId("biometricErrorLabel")
        )
    );
    assertTrue(errorMsg.isDisplayed());
    assertTrue(errorMsg.getText().contains("Face ID failed"));
    // Fallback to PIN should be offered
    assertTrue(driver.findElement(AppiumBy.accessibilityId("usePinButton")).isDisplayed());
}
```

**Why this only works on Simulator, not real device**: The `mobile: enrollBiometric` command is a Simulator-specific API. On a real device, you cannot programmatically simulate biometric authentication — this is a security design decision by Apple. For real device testing, either:

1. Use a physical person to perform the authentication in a supervised test session
2. Use a test flag (`--uitesting`) in the app to bypass biometric in test mode (common pattern)
3. Test biometric failure by tapping "Cancel" on the system dialog

</details>

---

## 14. iOS vs Android — Side-by-Side Comparison

```
┌─────────────────────────────┬──────────────────────────┬───────────────────────────┐
│ Concept                     │ Android                  │ iOS                       │
├─────────────────────────────┼──────────────────────────┼───────────────────────────┤
│ Primary Language            │ Kotlin (Java legacy)     │ Swift (Obj-C legacy)      │
│ UI Framework (modern)       │ Jetpack Compose          │ SwiftUI                   │
│ UI Framework (traditional)  │ XML Layouts + Views      │ UIKit + Storyboards       │
│ Screen unit                 │ Activity + Fragment      │ UIViewController          │
│ Package/Bundle identifier   │ com.company.app          │ com.company.app           │
│ Distribution package        │ .apk / .aab              │ .ipa / .app               │
│ App store                   │ Google Play Store        │ Apple App Store           │
│ Memory management           │ JVM Garbage Collector    │ ARC (ref counting)        │
│ Null safety                 │ Kotlin ? operator        │ Swift Optional (?)        │
│ Async code                  │ Coroutines + Flow        │ async/await + Combine     │
│ Local DB                    │ Room (SQLite wrapper)    │ Core Data (SQLite wrapper)│
│ Reactive query              │ Flow<List<T>>            │ @FetchRequest / Publisher │
│ State management            │ ViewModel + StateFlow    │ @StateObject + @Published │
│ App-wide state              │ Hilt DI (ViewModel)      │ @EnvironmentObject        │
│ Unit testing                │ JUnit 5 + Mockito        │ XCTest (built-in)         │
│ UI testing (native)         │ Espresso                 │ XCUITest                  │
│ E2E testing                 │ Appium UIAutomator2      │ Appium XCUITest Driver    │
│ Selector for testing        │ Resource ID / contentDesc│ accessibilityIdentifier   │
│ Scroll in tests             │ UiScrollable             │ mobile: scroll command    │
│ Biometric in tests          │ Via Appium + emulator    │ mobile: sendBiometricMatch│
│ Test OS requirement         │ Any OS (CI friendly)     │ macOS ONLY (Xcode/Xcode)  │
└─────────────────────────────┴──────────────────────────┴───────────────────────────┘
```

> **Critical CI point**: iOS testing requires a macOS CI runner (e.g., GitHub Actions `macos-14`). Android can run on any Linux/Windows runner with the Android SDK. This is a significant operational cost difference — macOS runners are ~10x more expensive per minute on GitHub Actions.

---

## 15. Interview Questions on iOS

**Q: "What is the difference between `viewDidLoad` and `viewWillAppear`?"**

> "`viewDidLoad` is called exactly once when the view controller's view is first loaded into memory. It's the right place for one-time setup: adding subviews, configuring auto layout, initializing the ViewModel. `viewWillAppear` is called every time the screen becomes visible — including when returning from a pushed view controller. Data fetching that needs to be fresh every time the screen appears belongs in `viewWillAppear`, not `viewDidLoad`. A common bug is loading feed data in `viewDidLoad` — the feed becomes stale when the user navigates away and comes back."

**Q: "What is `@StateObject` vs `@ObservedObject`?"**

> "Both are used with `ObservableObject` ViewModels. `@StateObject` means this view OWNS the ViewModel — iOS creates it once and keeps it alive for the view's lifetime. `@ObservedObject` means the view is OBSERVING a ViewModel created elsewhere — it doesn't own it. If you use `@ObservedObject` for a ViewModel that should be owned by that view, SwiftUI might recreate it on redraws, losing state. The rule: if the view creates the ViewModel, use `@StateObject`. If the parent creates it and passes it in, use `@ObservedObject`."

**Q: "How do you test Face ID with Appium on iOS?"**

> "On the iOS Simulator, Appium exposes the `mobile: enrollBiometric` and `mobile: sendBiometricMatch` commands. I enroll biometric in the Simulator via `enrollBiometric`, trigger the authentication screen, then send `match: true` for success or `match: false` for failure. On a real device this isn't possible programmatically — Apple locks that down for security. So on real devices, I use a test launch argument that bypasses biometric in a test-only code path, verifying the post-authentication state directly."

---

**Navigation**: [← Android Native](02_Android_Native_Dev_And_Testing.md) | [📚 Index](00_INDEX.md) | [Flutter →](04_Flutter_Dev_And_Testing.md)


---

## Reality Check

**"iOS development is Swift and UIKit"** ? Modern iOS spans two UI paradigms and a rich framework ecosystem: the declarative SwiftUI ([15_React]'s reactive model, Apple's version � UI as a function of state, the @State/@Binding/@ObservedObject data flow) increasingly replacing or coexisting with imperative UIKit, the concurrency shift (Swift's async/await and actors [13_DE concurrency] replacing completion handlers and GCD), and the platform frameworks. The SwiftUI-versus-UIKit reality (the new apps in SwiftUI, the large existing apps in UIKit, the interop between them) mirrors the [Android] Compose-versus-Views transition. "Swift and UIKit" is one era; modern iOS is Swift with SwiftUI, structured concurrency, and the paradigm shift toward declarative reactive UI that the whole industry ([15_React, Compose]) converged on.

**"iOS is easier to test because there's less fragmentation"** ? Less device fragmentation than Android (fewer devices, controlled OS updates) is real and does NOT make iOS testing easy: the same lifecycle-and-state challenges ([Android]'s equivalents � the app backgrounding, the state restoration), the XCUITest flakiness (the UI tests slow and timing-sensitive [21_SDET Ch26], the same synchronization problems), the simulator-versus-device gap ([Ch61] � the simulator that misses the real touch, performance, and hardware behaviors), the OS-version spread (smaller than Android but real � the API availability checks), and the App Store review and signing complexity (the provisioning, certificates, and the release process that is its own operational burden). "Less fragmentation therefore easier" captures one genuine advantage and ignores that iOS testing shares most of mobile's hard problems (lifecycle, flaky UI tests, simulator gaps) plus adds Apple-specific friction (signing, review, the closed ecosystem).

**"SwiftUI and UIKit are interchangeable"** ? They are different paradigms with different models, and the interop is a real architectural concern: SwiftUI is declarative-reactive ([15_React] � recomposition on state change, the state-as-source-of-truth), UIKit is imperative (find and mutate views), and mixing them (the SwiftUI view hosting UIKit, the UIKit hosting SwiftUI � the UIHostingController/UIViewRepresentable bridges) is common in real apps and carries the impedance mismatch (the two data-flow models meeting). Plus SwiftUI's maturity gaps (the cases where you drop to UIKit for control SwiftUI does not expose). "Interchangeable" misses that they embody the imperative-versus-declarative split, that real apps bridge them, and that the choice and the bridging are architectural decisions with the same paradigm-mismatch considerations as [15_React]-in-a-legacy-app.

**"Memory management is automatic with ARC"** ? Automatic Reference Counting handles most memory and leaves the RETAIN CYCLE as a real, common bug: the two objects referencing each other strongly (neither ever deallocated � the leak ARC cannot break), the closure capturing self strongly (the [16_JS] closure-retention in Swift form � the [weak self] dance that iOS developers internalize precisely because forgetting it leaks the view controller and everything it holds), and the delegate that should be weak. ARC is not garbage collection (it does not detect cycles � it counts references, and a cycle keeps the count above zero forever). "Automatic with ARC" is true for the acyclic common case and false exactly where retain cycles form � and the weak/unowned reference discipline (knowing when to break the cycle) is a core iOS skill precisely because ARC's automation stops at cycles, which closures and delegates create constantly.

**"App Store submission is the last step"** ? The App Store review and release process is an ongoing operational reality that shapes development, not a final upload: the review that can REJECT (the guideline violation, the rejection that delays release by days � the [21_SDET Ch62] release gate with an external gatekeeper you do not control), the signing and provisioning complexity (the certificates, profiles, and entitlements that break builds and CI � the iOS-specific [22_DevOps] deployment friction), the phased release and the inability to instantly patch (the bug shipped to the App Store that takes a review cycle to fix � the reason feature flags [21_SDET Ch61] matter more, to disable without resubmitting), and the version fragmentation (users who do not update). "Last step" misunderstands that App Store review, signing, and the slow-patch reality are constraints that shape the whole development and release strategy � the feature-flag decoupling, the careful release process, and the signing automation are responses to an ecosystem where you cannot just push a fix.
