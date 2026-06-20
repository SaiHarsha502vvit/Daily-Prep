# Week 16 — Firebase Authentication
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

## 1. Setup

```yaml
# pubspec.yaml
dependencies:
  firebase_auth: ^5.0.0
  google_sign_in: ^6.2.0        # for Google Sign-In
```

```dart
// firebase_options.dart is already configured from Week 15
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

## Week 16 Verify

1. `FirebaseAuth.instance.authStateChanges()` returns a `Stream<User?>`. When does it emit a new value?
2. Why don't you call `Navigator.push(HomeScreen)` after sign-in? What handles navigation instead?
3. Google Sign-In takes 4 steps. Write them out without looking.
4. `FirebaseAuthException.code` is `'email-already-in-use'`. What does this error mean and what should you show the user?
5. `request.auth.uid` in Firestore security rules — where does this value come from?
6. You protect a screen with `AuthGuard`. The user is on `ProfileEditScreen` and then signs out. What happens to the screen?
7. Why do you use `FirebaseAuth.instance.authStateChanges()` instead of just reading `FirebaseAuth.instance.currentUser` in build?
8. Rank these login methods by friction (lowest to highest): Email+Password, Google Sign-In, Biometric, Magic Link. Which should a returning user see first?
9. `FirebaseAuthException.code` returns `'too-many-requests'`. What happened, what should you show the user, and what UX pattern prevents this from happening?

---

**Next → [Week 17: Local Storage](Week_17_Local_Storage.md)**
