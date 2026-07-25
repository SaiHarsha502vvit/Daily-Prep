# Week 17 — Firebase Authentication
### Sign in, sign up, Google OAuth, auth state management, protected routes

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — Firebase Auth flows, Riverpod auth state, route guarding
> - 🎨 **Designer** — auth UX patterns, error feedback, loading states during auth
> - 🧪 **Tester** — mocking auth state, testing protected routes, testing sign-in flows

---

## How Firebase Auth Works

> 📄 **Firebase Docs:**
> *"Firebase Authentication provides backend services to securely authenticate users. It supports authentication using passwords, phone numbers, popular federated identity providers like Google, Facebook and Twitter, and more."*

Firebase Auth is not just a login screen. It's a token system:

1. User signs in (email+password, Google, etc.)
2. Firebase returns a **User** object with a **UID** (unique ID that never changes)
3. Firebase issues a **JWT token** (expires every hour, auto-refreshed by the SDK)
4. Your Firestore security rules use `request.auth.uid` — this comes from the token
5. The User's auth state **persists across app restarts** — Firebase stores it in secure local storage

```
User signs in
     ↓
FirebaseAuth.instance.currentUser (non-null while logged in)
     ↓
FirebaseAuth.instance.authStateChanges() → Stream<User?> that emits whenever auth changes
     ↓
Riverpod StreamProvider watches this → your entire app reacts
```

---

## The Authentication Origin Story — From Passwords to Face ID to Sign In With Apple

### Passwords Were Invented in 1961 (And They've Been Broken Ever Since)

The first computer password was created in 1961 at MIT's CTSS (Compatible Time-Sharing System) — the first operating system that gave multiple users individual accounts on one machine. **Robert Morris Sr.** (whose son would later write the Morris Worm, the first internet worm) designed the password system.

The fundamental problem was identified almost immediately: passwords are secrets that humans must memorize, and humans are bad at keeping secrets and memorizing random strings. Every solution since 1961 has been trying to fix this:

- **1986**: RSA Security released the **SecurID** — a key fob that showed a 6-digit code that changed every 60 seconds based on a shared secret. The code was only valid for 60 seconds, so stolen credentials expired instantly. The precursor to modern TOTP (the codes your Google Authenticator generates).
- **2004**: Gmail, Flickr, and the web 2.0 era normalized "one account per site" — creating password reuse across hundreds of sites. A single breach meant all your accounts were compromised.
- **2011**: LinkedIn breached (6.5M passwords). 2012: Dropbox (68M). 2013: Adobe (153M). Passwords at scale were failing catastrophically.

### Touch ID and the Biometric Revolution (September 2013)

In 2012, Apple secretly acquired **AuthenTec** for $356 million — the world's leading fingerprint sensor company. No one knew why until the iPhone 5s launched with **Touch ID**.

The implementation details were extraordinary: the sensor used **radio frequency** to read beneath the outer dead skin layer to the live dermis below — making it resistant to fake fingerprints made from gelatin or tape. Recognition took under 0.5 seconds. Error rate: 1 in 50,000.

More important than the hardware was the **security architecture**: the fingerprint template was stored in a dedicated **Secure Enclave** chip — isolated hardware on the same die as the A7 processor, but with its own secure memory that no OS process could access. No iOS API could read a fingerprint template. No iCloud backup included Secure Enclave data. The design principle: the most sensitive data never leaves the hardware that protects it.

This principle defines how biometric auth works in Flutter today. `LocalAuthentication().authenticate()` returns `true`/`false`. You cannot receive the fingerprint data because the API is intentionally designed to make it impossible. The authentication happens in hardware; your app only gets the result.

### Face ID — From 2D to 3D (iPhone X, November 2017)

Apple removed the Home button and the fingerprint sensor. In the notch lived a **TrueDepth camera system**: an infrared camera, a flood illuminator, and a dot projector that fired 30,000 invisible infrared dots onto the user's face, creating a precise 3D map. Attention detection: Face ID only works when you are looking at the phone (eyes open, facing the screen). It works in the dark.

The face geometry map was also stored in the Secure Enclave — never sent to Apple, never accessible to apps, never included in backups. The API was identical: `authenticate()` → `true`/`false`.

Android followed with in-display fingerprint sensors (Synaptics, 2018) and 3D face recognition (various implementations, 2018-present). Flutter's `local_auth` plugin abstracts all of these with a single API — `authenticate()` works whether the device has Touch ID, Face ID, an in-display fingerprint sensor, or an Android fingerprint sensor.

### Sign In With Apple — Privacy as a Product (WWDC, June 2019)

Apple launched **Sign In With Apple** and simultaneously announced **App Store Guideline 4.8**: any app offering third-party login (Google, Facebook, Twitter) must also offer Sign In With Apple. Rejection otherwise.

The privacy differentiator Apple added: **Hide My Email**. Sign In With Apple can generate a random relay email address (`xyz123@privaterelay.appleid.com`) that forwards to the user's real address. The app never learns the user's real email. The relay can be disabled instantly, cutting the app off from email contact permanently.

This was Apple's direct response to the data economy of Google and Facebook, who used OAuth to track users across the web. Sign In With Apple gives users a way to use apps without feeding data to the social platforms that operate the identity system.

For you as a Flutter developer: **if your iOS app offers Google Sign-In, Sign In With Apple is not optional**. It is a mandatory App Store requirement. The `sign_in_with_apple` package exists precisely because Apple made it so.

---

## 1. Setup

```yaml
# pubspec.yaml
dependencies:
  firebase_auth: ^5.0.0
  google_sign_in: ^6.2.0        # for Google Sign-In
```

```dart
// firebase_options.dart is already configured from Week 16
// No additional setup needed for email/password auth
// For Google Sign-In: add SHA-1 fingerprint in Firebase Console
```

---

## 2. Auth State Provider — The Source of Truth

> 📄 **Firebase Docs:**
> *"firebase.auth().onAuthStateChanged is an observer for changes to the user's sign-in state. Use this observer to guard secure routes in your app."*

```dart
// lib/features/auth/presentation/providers/auth_providers.dart

// The auth state stream — emits User? on every auth change
// null = logged out, non-null = logged in
final authStateProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

// Convenience provider — current user or null
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authStateProvider).whenData((user) => user).value;
});

// Is the user signed in?
final isSignedInProvider = Provider<bool>((ref) {
  return ref.watch(currentUserProvider) != null;
});
```

```dart
// lib/main.dart — route the user based on auth state
class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return MaterialApp(
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: authState.when(
        loading: () => const SplashScreen(),    // brief — just while Firebase initializes
        error: (_, __) => const ErrorScreen(),
        data: (user) => user != null
            ? const MainScreen()     // logged in → main app
            : const LoginScreen(),   // logged out → auth flow
      ),
    );
  }
}
```

🎨 **Designer:** The auth state pattern means you never manually navigate between login and home — the `MaterialApp.home` changes automatically based on auth state. When a user signs in, `authStateChanges()` emits a non-null User and the home widget switches to `MainScreen`. This is cleaner than `pushReplacement(HomeScreen)` in the login callback.

---

## 3. Email & Password Authentication

```dart
// lib/features/auth/data/auth_repository.dart

class AuthRepository {
  final FirebaseAuth _auth;

  const AuthRepository(this._auth);

  Future<UserCredential> signUp({required String email, required String password}) async {
    try {
      return await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
    } on FirebaseAuthException catch (e) {
      throw _mapError(e);
    }
  }

  Future<UserCredential> signIn({required String email, required String password}) async {
    try {
      return await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
    } on FirebaseAuthException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> signOut() => _auth.signOut();

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
    } on FirebaseAuthException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> updateDisplayName(String name) async {
    await _auth.currentUser?.updateDisplayName(name);
  }

  // Firebase error codes → readable messages
  AuthException _mapError(FirebaseAuthException e) {
    final message = switch (e.code) {
      'email-already-in-use' => 'An account with this email already exists.',
      'invalid-email' => 'Please enter a valid email address.',
      'weak-password' => 'Password must be at least 6 characters.',
      'user-not-found' => 'No account found with this email.',
      'wrong-password' => 'Incorrect password. Please try again.',
      'user-disabled' => 'This account has been disabled.',
      'too-many-requests' => 'Too many failed attempts. Please wait and try again.',
      'network-request-failed' => 'No internet connection.',
      _ => 'Authentication failed. Please try again.',
    };
    return AuthException(message);
  }
}

class AuthException implements Exception {
  final String message;
  const AuthException(this.message);
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(FirebaseAuth.instance);
});
```

---

## 4. Sign-In Screen

```dart
// lib/features/auth/presentation/screens/login_screen.dart

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  bool _isLoading = false;
  bool _isPasswordObscured = true;
  AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    setState(() => _autovalidateMode = AutovalidateMode.onUserInteraction);
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      await ref.read(authRepositoryProvider).signIn(
        email: _emailController.text,
        password: _passwordController.text,
      );
      // No navigation needed — authStateProvider emits non-null User
      // MaterialApp.home switches to MainScreen automatically
    } on AuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.message),
          backgroundColor: Theme.of(context).colorScheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            autovalidateMode: _autovalidateMode,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 48),
                // Logo / app name
                Text('Welcome back',
                    style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Text('Sign in to continue',
                    style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),

                const SizedBox(height: 40),

                TextFormField(
                  controller: _emailController,
                  focusNode: _emailFocus,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autocorrect: false,
                  onFieldSubmitted: (_) => FocusScope.of(context).requestFocus(_passwordFocus),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Email is required';
                    if (!RegExp(r'^[\w.-]+@[\w-]+\.\w{2,}$').hasMatch(v)) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  focusNode: _passwordFocus,
                  obscureText: _isPasswordObscured,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_isPasswordObscured ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _isPasswordObscured = !_isPasswordObscured),
                    ),
                  ),
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _signIn(),
                  validator: (v) => (v == null || v.isEmpty) ? 'Password is required' : null,
                ),

                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                    ),
                    child: const Text('Forgot password?'),
                  ),
                ),

                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _isLoading ? null : _signIn,
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Sign In', style: TextStyle(fontSize: 16)),
                ),

                const SizedBox(height: 20),

                // Divider with "or"
                Row(children: [
                  const Expanded(child: Divider()),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('or', style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                  ),
                  const Expanded(child: Divider()),
                ]),

                const SizedBox(height: 20),
                _GoogleSignInButton(),

                const SizedBox(height: 32),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text("Don't have an account? "),
                  TextButton(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SignUpScreen()),
                    ),
                    child: const Text('Sign Up'),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## 5. Google Sign-In

> 📄 **Firebase Docs:**
> *"To sign in users using their Google accounts, you must first obtain a Google ID token, then use that token to create a Firebase credential and sign in the user with that credential."*

```dart
// In AuthRepository
Future<UserCredential> signInWithGoogle() async {
  try {
    // 1. Trigger the Google Sign-In flow
    final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();

    // User cancelled the sign-in
    if (googleUser == null) throw const AuthException('Sign-in was cancelled.');

    // 2. Get authentication tokens
    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

    // 3. Create Firebase credential
    final OAuthCredential credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    // 4. Sign in with Firebase using the Google credential
    return await _auth.signInWithCredential(credential);
  } on FirebaseAuthException catch (e) {
    throw _mapError(e);
  }
}
```

```dart
// Google Sign-In Button Widget
class _GoogleSignInButton extends ConsumerStatefulWidget {
  @override
  ConsumerState<_GoogleSignInButton> createState() => _GoogleSignInButtonState();
}

class _GoogleSignInButtonState extends ConsumerState<_GoogleSignInButton> {
  bool _isLoading = false;

  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(authRepositoryProvider).signInWithGoogle();
      // Auth state changes → app navigates automatically
    } on AuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: _isLoading ? null : _signInWithGoogle,
      icon: _isLoading
          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
          : Image.asset('assets/icons/google.png', height: 20),
      label: const Text('Continue with Google'),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        side: BorderSide(color: Theme.of(context).colorScheme.outline),
      ),
    );
  }
}
```

🎨 **Designer:** Google's branding requirements:
- Google button must show the Google logo (download from Google's brand assets)
- Button text: "Sign in with Google" or "Continue with Google"
- Google's brand colors: blue (#4285F4), red (#DB4437), yellow (#F4B400), green (#0F9D58) — for the colored Google "G" icon
- Never use "Login with Google" — Google's guidelines require "Sign in"

---

## 6. Forgot Password

```dart
// Simple forgot password screen
class ForgotPasswordScreen extends ConsumerStatefulWidget { ... }

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _controller = TextEditingController();
  bool _isSent = false;
  bool _isLoading = false;

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  Future<void> _sendReset() async {
    if (_controller.text.trim().isEmpty) return;
    setState(() => _isLoading = true);
    try {
      await ref.read(authRepositoryProvider).sendPasswordResetEmail(_controller.text);
      if (mounted) setState(() => _isSent = true);
    } on AuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: _isSent
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.mark_email_read, size: 64, color: Colors.green),
                  const SizedBox(height: 16),
                  Text('Check your email',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text('We sent a password reset link to ${_controller.text}',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyLarge),
                  const SizedBox(height: 24),
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('Back to Login')),
                ],
              )
            : Column(
                children: [
                  const SizedBox(height: 24),
                  Text('Enter your email address and we\'ll send you a link to reset your password.',
                      style: Theme.of(context).textTheme.bodyLarge),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _controller,
                    decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _sendReset(),
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _isLoading ? null : _sendReset,
                    style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                    child: _isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Send Reset Link'),
                  ),
                ],
              ),
      ),
    );
  }
}
```

---

## 7. Protecting Routes — Auth Guard

```dart
// A reusable auth guard widget
class AuthGuard extends ConsumerWidget {
  final Widget child;
  const AuthGuard({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    if (user == null) {
      return const LoginScreen();  // redirect to login
    }

    return child;
  }
}

// Usage — wrap any screen that requires auth
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => AuthGuard(child: ProfileEditScreen()),
  ),
);
```

```dart
// For the whole app — in main.dart
class App extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authStateProvider);

    return MaterialApp(
      home: authAsync.when(
        loading: () => const SplashScreen(),
        error: (_, __) => const ErrorScreen(),
        data: (user) {
          if (user == null) return const LoginScreen();
          // User is logged in — initialize user-specific providers
          return ProviderScope(
            overrides: [
              // Override notesRepositoryProvider with the current user's ID
              notesRepositoryProvider.overrideWithValue(
                NotesRepository(db: FirebaseFirestore.instance, userId: user.uid),
              ),
            ],
            child: const MainScreen(),
          );
        },
      ),
    );
  }
}
```

🧪 **Tester:** Testing auth-dependent screens:

```dart
testWidgets('shows MainScreen when user is signed in', (tester) async {
  // Create a mock User
  final mockUser = MockUser();
  when(mockUser.uid).thenReturn('test-uid');
  when(mockUser.email).thenReturn('test@example.com');

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        // Override the auth stream with a logged-in user
        authStateProvider.overrideWith((ref) => Stream.value(mockUser)),
      ],
      child: const MaterialApp(home: App()),
    ),
  );
  await tester.pumpAndSettle();

  expect(find.byType(MainScreen), findsOneWidget);
  expect(find.byType(LoginScreen), findsNothing);
});

testWidgets('shows LoginScreen when signed out', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authStateProvider.overrideWith((ref) => Stream.value(null)),
      ],
      child: const MaterialApp(home: App()),
    ),
  );
  await tester.pumpAndSettle();

  expect(find.byType(LoginScreen), findsOneWidget);
});
```

---

## 9. Auth UX — Academy Principles

> 🍎 **Academy Golden Rule — Reduce Friction, Protect Trust:**
> *"Every extra step in your login flow loses users. Biometrics > single tap social login > email+password. But when something goes wrong, the error message must tell the user exactly what to do — never 'invalid credentials'."*

```dart
// Error messages that help vs. error messages that frustrate
String authErrorMessage(FirebaseAuthException e) {
  return switch (e.code) {
    'user-not-found' => 'No account found with this email. Would you like to sign up?',
    'wrong-password' => 'Incorrect password. Tap "Forgot password?" to reset.',
    'email-already-in-use' => 'An account with this email already exists. Try logging in.',
    'weak-password' => 'Password must be at least 8 characters with a number and uppercase letter.',
    'too-many-requests' => 'Too many attempts. Please wait a moment and try again.',
    'network-request-failed' => 'No internet connection. Check your Wi-Fi and try again.',
    'invalid-email' => 'Please enter a valid email address.',
    'user-disabled' => 'This account has been disabled. Contact support for help.',
    _ => 'Something went wrong. Please try again.',
  };
}
```

```dart
// Biometric authentication — fastest possible login for returning users
import 'package:local_auth/local_auth.dart';

class BiometricService {
  final _auth = LocalAuthentication();

  Future<bool> isBiometricAvailable() async {
    final canCheck = await _auth.canCheckBiometrics;
    final isDeviceSupported = await _auth.isDeviceSupported();
    return canCheck && isDeviceSupported;
  }

  Future<bool> authenticate() async {
    return _auth.authenticate(
      localizedReason: 'Verify your identity to access your account',
      options: const AuthenticationOptions(
        stickyAuth: true,           // keep auth dialog up if app goes to background
        biometricOnly: false,       // allow PIN/pattern fallback
      ),
    );
  }
}

// Login flow with biometric shortcut
Future<void> handleLogin() async {
  final hasToken = await secureStorage.read(key: 'auth_token');
  if (hasToken != null && await biometricService.isBiometricAvailable()) {
    final authenticated = await biometricService.authenticate();
    if (authenticated) {
      // Skip the login screen entirely — user is verified
      router.go('/home');
      return;
    }
  }
  // Fall through to email/password or social login
}
```

**The Academy Auth UX Hierarchy:**
```
1. Biometric (Face ID / fingerprint) — instant, returning users
2. Social login (Google / Apple) — one tap, new users
3. Magic link (email) — no password to remember
4. Email + password — last resort, highest friction
```

---

## 10. Token Refresh Architecture — Enterprise Session Management

> 🏢 **Enterprise Reality:**
> *"Firebase Auth handles token refresh for you. But if you're integrating with your company's own backend API (which most enterprises do), YOU must handle token expiry, refresh, and retry transparently."*

```dart
// Auth interceptor — transparently refreshes expired tokens
class AuthInterceptor extends QueuedInterceptor {
  final SecureStorageService _storage;
  final AuthService _authService;
  final Dio _dio;

  AuthInterceptor(this._storage, this._authService, this._dio);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired — try to refresh
      try {
        final refreshToken = await _storage.read(key: 'refresh_token');
        if (refreshToken == null) {
          _authService.forceLogout();
          return handler.next(err);
        }

        // Get new access token using refresh token
        final response = await _dio.post('/auth/refresh', data: {
          'refresh_token': refreshToken,
        });

        final newAccessToken = response.data['access_token'] as String;
        final newRefreshToken = response.data['refresh_token'] as String;

        // Save new tokens
        await _storage.write(key: 'access_token', value: newAccessToken);
        await _storage.write(key: 'refresh_token', value: newRefreshToken);

        // Retry the original request with the new token
        err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
        final retryResponse = await _dio.fetch(err.requestOptions);
        return handler.resolve(retryResponse);

      } on DioException {
        // Refresh token also expired — force logout
        _authService.forceLogout();
        return handler.next(err);
      }
    }
    handler.next(err);
  }
}
```

```dart
// QueuedInterceptor is CRITICAL here — without it, if 5 API calls fail with 401
// simultaneously, you'd trigger 5 refresh token requests. QueuedInterceptor
// queues them: first request refreshes, remaining 4 retry with the new token.

// Session timeout — automatically log out inactive users
class SessionManager {
  Timer? _inactivityTimer;
  static const _timeout = Duration(minutes: 15);

  void onUserActivity() {
    _inactivityTimer?.cancel();
    _inactivityTimer = Timer(_timeout, () {
      logger.i('Session timed out due to inactivity');
      _authService.forceLogout();
    });
  }

  void dispose() => _inactivityTimer?.cancel();
}
```

---

## 11. Multi-Provider Auth — Enterprise SSO

```dart
// Enterprise apps often support multiple auth providers
// Users might link Google + Email, or use company SSO (SAML/OIDC)

class AuthService {
  Future<UserCredential> signInWithSSO(String ssoProvider) async {
    // For enterprise OIDC/SAML providers
    final provider = OAuthProvider(ssoProvider);
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({'tenant': 'your-company-tenant-id'});

    return FirebaseAuth.instance.signInWithProvider(provider);
  }

  // Link additional providers to existing account
  Future<void> linkGoogleAccount() async {
    final googleUser = await GoogleSignIn().signIn();
    if (googleUser == null) return;

    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    // Link to current user — they can now sign in with either method
    await FirebaseAuth.instance.currentUser?.linkWithCredential(credential);
  }

  // Account deletion — GDPR + App Store requirement
  Future<void> deleteAccount() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    // 1. Delete all user data from Firestore
    await _deleteUserData(user.uid);

    // 2. Delete from Firebase Auth
    await user.delete();

    // 3. Clear all local storage
    await _secureStorage.deleteAll();
    await Hive.deleteFromDisk();

    // 4. Track for compliance audit
    analytics.trackEvent('account_deleted', params: {'method': 'user_initiated'});
  }
}
```

---

## Lab — Complete Auth Flow

Build a complete authentication system:

**Screens:**
1. **OnboardingScreen** — 3-page `PageView` shown only on first launch (save to SharedPreferences)
2. **LoginScreen** — email+password + Google Sign-In + link to sign up + forgot password
3. **SignUpScreen** — name + email + password + confirm password + terms checkbox
4. **ForgotPasswordScreen** — email input → sends reset link → confirmation state
5. **SplashScreen** — 1.5 second delay while Firebase initializes

**Requirements:**
- After first launch, `OnboardingScreen` never shows again (SharedPreferences flag)
- Error messages use the mapped Firebase error codes (not raw Firebase strings)
- Loading states on ALL async buttons — never let user tap twice
- Auth state drives routing — no manual navigation on sign-in success
- Sign-out accessible from Settings screen
- After sign-up: send email verification (`user.sendEmailVerification()`)
- Block unverified users: show "Please verify your email" screen if `user.emailVerified == false`

---

## 7. Apple Sign-In — Required for App Store

> 📄 **Apple Developer Docs:**
> *"If your app exclusively uses a third-party or social login service (such as Facebook Login or Google Sign-In), you must offer Sign in with Apple as an equivalent option."*

Apple rejects apps that offer Google Sign-In without also offering Apple Sign-In. This is mandatory for App Store submission.

```yaml
dependencies:
  sign_in_with_apple: ^6.0.0
```

**iOS setup:** Add `Sign in with Apple` capability in Xcode: Select Runner → Signing & Capabilities → + Capability → Sign In with Apple.

```dart
// In AuthRepository
Future<UserCredential> signInWithApple() async {
  try {
    // Step 1: Generate a secure random nonce (prevents replay attacks)
    final rawNonce = _generateNonce();
    final nonce = _sha256ofString(rawNonce);

    // Step 2: Request Apple ID credentials
    final appleCredential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,      // first sign-in only
        AppleIDAuthorizationScopes.fullName,   // first sign-in only
      ],
      nonce: nonce,
    );

    // Step 3: Create Firebase OAuth credential
    final oauthCredential = OAuthProvider('apple.com').credential(
      idToken: appleCredential.identityToken,
      rawNonce: rawNonce,
    );

    // Step 4: Sign in to Firebase
    final userCredential = await FirebaseAuth.instance.signInWithCredential(oauthCredential);

    // Apple only sends name on FIRST sign-in
    // Save it because subsequent calls won't include it
    if (appleCredential.givenName != null) {
      final displayName = '${appleCredential.givenName} ${appleCredential.familyName}';
      await userCredential.user?.updateDisplayName(displayName);
    }

    return userCredential;
  } on SignInWithAppleAuthorizationException catch (e) {
    if (e.code == AuthorizationErrorCode.canceled) {
      throw const AuthException('Sign-in cancelled');
    }
    throw AuthException('Apple Sign-In failed: ${e.message}');
  } on FirebaseAuthException catch (e) {
    throw AuthException(_mapFirebaseError(e.code));
  }
}

// Nonce generation (required by Apple for security)
String _generateNonce([int length = 32]) {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
  final random = Random.secure();
  return List.generate(length, (_) => charset[random.nextInt(charset.length)]).join();
}

String _sha256ofString(String input) {
  final bytes = utf8.encode(input);
  final digest = sha256.convert(bytes);
  return digest.toString();
}
```

```dart
// In LoginScreen — show both Google and Apple buttons on iOS
// On Android, only show Google (Apple Sign-In not available)

import 'dart:io' show Platform;

// Inside LoginScreen build():
if (Platform.isIOS || Platform.isMacOS) ...[
  const SizedBox(height: 12),
  SignInWithAppleButton(
    onPressed: () async {
      context.read<AuthBloc>().add(AppleSignInRequested());
    },
  ),
],
```

---

## 8. Phone Authentication (OTP)

```dart
// Phone auth flow:
// 1. Send OTP to phone number
// 2. User enters 6-digit OTP
// 3. Verify OTP → Firebase creates/signs in the user

// Step 1: Send OTP
Future<void> sendOtp(String phoneNumber) async {
  await FirebaseAuth.instance.verifyPhoneNumber(
    phoneNumber: '+91$phoneNumber',
    timeout: const Duration(seconds: 60),

    verificationCompleted: (PhoneAuthCredential credential) async {
      // Android only: auto-retrieves OTP (SMS Retriever API)
      // Signs in the user without them typing the OTP
      await FirebaseAuth.instance.signInWithCredential(credential);
    },

    verificationFailed: (FirebaseAuthException e) {
      switch (e.code) {
        case 'invalid-phone-number': throw const AuthException('Invalid phone number');
        case 'too-many-requests': throw const AuthException('Too many requests. Try later.');
        default: throw AuthException(e.message ?? 'Phone auth failed');
      }
    },

    codeSent: (String verificationId, int? resendToken) {
      // Store verificationId — you'll need it to verify the OTP
      _verificationId = verificationId;
      _resendToken = resendToken;
      // Navigate to OTP input screen
    },

    codeAutoRetrievalTimeout: (String verificationId) {
      _verificationId = verificationId;
      // Auto-retrieval timed out — user must enter OTP manually
    },
  );
}

// Step 2: Verify the OTP the user entered
Future<void> verifyOtp(String otp) async {
  if (_verificationId == null) throw const AuthException('Verification ID not found');

  final credential = PhoneAuthProvider.credential(
    verificationId: _verificationId!,
    smsCode: otp,
  );

  try {
    await FirebaseAuth.instance.signInWithCredential(credential);
    // authStateChanges() fires → your StreamProvider routes user to home
  } on FirebaseAuthException catch (e) {
    if (e.code == 'invalid-verification-code') {
      throw const AuthException('Wrong OTP. Please check and try again.');
    }
    throw AuthException(e.message ?? 'Verification failed');
  }
}
```

---

## The Invisible Machinery — How Firebase Auth and OAuth 2.0 Actually Work

You tap "Sign in with Google." A moment later you have a `User` with a UID. What happened in that moment is one of the most important security mechanisms on the internet — and once you understand it, every auth-related decision you make becomes clearer.

### The Problem OAuth 2.0 Solves

Before OAuth (pre-2006), "sign in with Google" meant: give the third-party app your Google username and password. The app logged into Google on your behalf. This was catastrophic — every app you used held your Google credentials. One breached app meant all your accounts were compromised.

OAuth 2.0 (finalized in RFC 6749, 2012) solved this with **delegation without credential sharing**: your app proves that a user authenticated with Google — without ever seeing the user's Google password. The user's password stays entirely inside Google's systems.

### The Full Authorization Code Flow (Unfolded)

```
User taps "Sign in with Google"
     ↓
Firebase SDK opens accounts.google.com in a browser or system webview
─────────────────────────────────────────────────────────────────────
YOUR APP CANNOT SEE THIS WEBVIEW — Google controls it
─────────────────────────────────────────────────────────────────────
User types their Google password into Google's own UI
(Your app process never receives these keystrokes)
     ↓
Google verifies the password
→ generates a single-use authorization code: 4/0AbCDefg123xyz
→ redirects back: yourapp://oauth-callback?code=4/0AbCDefg123xyz
     ↓
Firebase SDK captures the redirect, extracts the code
     ↓
Firebase SDK sends the code to Firebase's servers (NOT directly to Google):
  POST https://us-central1-your-project.cloudfunctions.net/auth/token
     ↓
Firebase's servers forward to Google's token endpoint:
  POST https://oauth2.googleapis.com/token
  Body: {
    code: "4/0AbCDefg123xyz",
    client_secret: "ABC_SECRET",       ← stored on Firebase's servers ONLY
    grant_type: "authorization_code"   ← never inside your Flutter binary
  }
     ↓
Google verifies code + client_secret → returns:
  { access_token: "...", id_token: "<JWT>", refresh_token: "..." }
     ↓
Firebase creates or signs in the user account
Returns UserCredential to your Flutter app
```

The authorization code is single-use and expires in minutes. Even if intercepted in transit, it is useless without the `client_secret` — which lives on Firebase's servers and never touches your device.

### What a JWT Is (Inside the ID Token)

Every `await user.getIdToken()` call returns a **JWT** (JSON Web Token, pronounced "jot"). It looks opaque, but it is three base64url-encoded sections separated by dots: `header.payload.signature`

```
eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleTEyMyJ9          ← header
.eyJ1aWQiOiJhYmMxMjMiLCJlbWFpbCI6Imhhc3NoYUBnbWFpbC5jb20iLCJleHAiOjE3MDQwNjcyMDB9  ← payload
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c      ← signature
```

**Decoded header:**
```json
{
  "alg": "RS256",    // signing algorithm: RSA with SHA-256 hash
  "kid": "key123"    // which of Google's signing keys was used (they rotate)
}
```

**Decoded payload — this is what Firestore security rules read:**
```json
{
  "uid": "abc123def456",
  "email": "harsha@gmail.com",
  "email_verified": true,
  "iss": "https://securetoken.google.com/your-project",
  "aud": "your-project-id",
  "iat": 1704063600,     // issued at (Unix timestamp)
  "exp": 1704067200      // expires at (iat + 3600 seconds = exactly 1 hour)
}
```

**The signature — why this is tamper-proof:**

Google's private key — stored in their HSM (Hardware Security Module, hardware that never lets the key leave its memory) — cryptographically signs the concatenation `base64(header) + "." + base64(payload)` using RSA-SHA256.

Firestore downloads Google's **public key** from a well-known URL (`https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`) and mathematically verifies the signature.

If you change even one character in the payload, the signature verification fails. You cannot forge a JWT without Google's private key. This is why `request.auth.uid` in Firestore rules is trustworthy — Firestore cryptographically verified the entire token before extracting the UID.

### Why Tokens Expire in 1 Hour

If your ID token is stolen (man-in-the-middle, leaked in a log file, device compromise), the attacker has access for **at most 1 hour**. Short expiry = small attack window. Firebase's SDK handles renewal invisibly:

```dart
// SDK's internal logic (not your code):
// Every call to user.getIdToken() runs this:
// 1. Decode the JWT, read the "exp" field
// 2. If current time > exp (or within 5 minutes of exp):
//    POST refresh_token to Firebase → receive a new JWT
// 3. Return the valid JWT

// This is why getIdToken() is always async:
final token = await FirebaseAuth.instance.currentUser!.getIdToken();
// ^ May be instant (cached, still valid) or take ~200ms (silent network refresh)
```

The **refresh token** is long-lived (valid until the user signs out or you revoke it server-side). Firebase SDK stores it in platform secure storage: **iOS Keychain** or **Android EncryptedSharedPreferences backed by the Keystore**. Other apps cannot read it. Even on rooted Android, the Android Keystore protects keys with hardware-backed encryption that makes them unextractable in plaintext.

### How Biometric Auth Fits In (It's Not What You Think)

Face ID and fingerprint don't re-authenticate with Firebase. They prove the physical user is present before your app proceeds with the existing Firebase session:

```
Firebase Auth already has a valid refresh token (from previous login)
     ↓
Your app calls local_auth.authenticate()
     ↓ OS sends the biometric request to the Secure Enclave (Apple Silicon)
       or Trusted Execution Environment — TEE (Android)
     ↓ Secure Enclave / TEE compares the live scan against the stored template
       ─────────────────────────────────────────────────────────
       TEMPLATES NEVER LEAVE THE SECURE ENCLAVE
       Your app, Firebase, and even the main OS never see raw biometric data
       ─────────────────────────────────────────────────────────
Secure Enclave signs a challenge proving verification succeeded → returns true
     ↓
Your app receives `true` → proceeds to use the existing Firebase session
Firebase is not involved at this step at all
```

Biometric authentication is a **local presence check** — it gates access to an already-authenticated session. This is why biometrics can work offline: they don't contact any server.

**Decision framework:**

| Situation | What it means | What to do |
|-----------|---------------|------------|
| `getIdToken()` takes 200ms intermittently | Refresh token being exchanged for new JWT | Normal — show loading state before sensitive API calls that need fresh tokens |
| User deleted from Firebase Console, but app still works | Refresh token still valid in device Keychain | Call `user.reload()` to force auth state sync; revoke tokens server-side for immediate effect |
| `email_verified: false` in the JWT payload | User registered but never clicked verification email | Block sensitive features behind `user.emailVerified == true` check |
| Firestore `request.auth != null` passes but UID rule fails | JWT valid, but rule condition checks a different field | Use Firebase Console → Firestore → Rules Playground to debug with actual token payload |
| Token works in dev, fails in prod | `aud` (audience) claim mismatch — different Firebase project | Ensure `google-services.json` / `GoogleService-Info.plist` match the project in use |

---

## Week 17 Verify

1. `FirebaseAuth.instance.authStateChanges()` returns a `Stream<User?>`. When does it emit a new value?
2. Why don't you call `Navigator.push(HomeScreen)` after sign-in? What handles navigation instead?
3. Google Sign-In takes 4 steps. Write them out without looking.
4. `FirebaseAuthException.code` is `'email-already-in-use'`. What does this error mean and what should you show the user?
5. `request.auth.uid` in Firestore security rules — where does this value come from?
6. You protect a screen with `AuthGuard`. The user is on `ProfileEditScreen` and then signs out. What happens to the screen?
7. Why do you use `FirebaseAuth.instance.authStateChanges()` instead of just reading `FirebaseAuth.instance.currentUser` in build?
8. Rank these login methods by friction (lowest to highest): Email+Password, Google Sign-In, Biometric, Magic Link. Which should a returning user see first?
9. `FirebaseAuthException.code` returns `'too-many-requests'`. What happened, what should you show the user, and what UX pattern prevents this from happening?
10. Five API calls hit 401 simultaneously. Without a `QueuedInterceptor`, all five try to refresh the token at once. What goes wrong? How does `QueuedInterceptor` fix this?
11. Your app supports Google, Apple, and enterprise SSO (OIDC). A user signs in with Google, then later tries Apple with the same email. What is "account linking"? What must you show the user before merging accounts?
12. A user requests GDPR account deletion. List three things your app must delete beyond just calling `user.delete()` — both client-side and server-side.

---

**Next → [Week 18: Local Storage](Week_18_Local_Storage.md)**
