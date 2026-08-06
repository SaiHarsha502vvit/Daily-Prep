# Week 8 — Forms & Input
### Text fields, validation, keyboard handling, and pickers — the complete picture

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — controllers, validators, form state, focus management
> - 🎨 **Designer** — input states (default, focused, error, disabled), label animations, helper text
> - 🧪 **Tester** — entering text, triggering validation, testing form submission

---

## Why Forms Are Tricky

Users make mistakes. Networks fail. Keyboards overlap content. Validation must be clear and immediate but not annoying. Flutter's form system is built to handle all of this — but only if you understand the architecture.

> 📄 **Flutter Docs:**
> *"A Form widget allows you to group and validate multiple FormFields. Changes in the Form widget are saved by calling FormState.save(), which cascades down to each FormField. Validation is triggered by calling FormState.validate()."*

---

## The History of Mobile Input — From T9 to Touch ID to Sign In With Apple

### How We Got Here: T9, Touchscreens, and Steve Jobs's Gamble

Before touchscreen keyboards, mobile text input was **T9** (Tegic Communications, 1995): press "7" once for "p", twice for "q", three times for "r", four times for "s". Writing "stop" required 28 key presses. Entire text messages were typed this way. A generation of teenagers got alarmingly fast at it.

The first iPhone (2007) replaced the physical keyboard with a full touchscreen. Steve Jobs opened that section of the keynote directly: *"The most advanced phones out there are called smartphones. The problem is: they're not so smart... they all have these keyboards that are there whether you need them or not. What we're going to do is get rid of all these buttons and just make a giant screen."* The audience laughed nervously.

What made the virtual keyboard work was not the layout — it was the error correction. Apple modeled each keystroke as a **probability distribution**: a Gaussian curve centered on the touch point, spread across the keys near it. The software calculated which key you *most likely intended* based on both your tap position and the word you were probably forming. The keyboard forgave you.

### HTML Forms Meet Mobile (2010-2013): The `type=` Attribute

Web forms had existed since 1996 (HTML 2.0). When smartphones arrived, the mismatch was painful: forms designed for physical keyboards showed the wrong keyboard type on mobile. A phone number field showed a QWERTY keyboard. A search field showed a number pad.

HTML5 (2010 draft, finalized 2014) added `<input type="email">`, `<input type="tel">`, `<input type="number">`, `<input type="search">` — type hints that told mobile browsers which keyboard to show. This is the direct ancestor of Flutter's `TextInputType.emailAddress` and `TextInputType.phone`. Same problem, 14 years later, same solution.

### Touch ID — When Biometrics Went Mainstream (September 2013)

In 2012, Apple quietly acquired **AuthenTec** — the world's leading fingerprint sensor company — for **$356 million**. Nobody outside Apple knew why. The answer appeared 14 months later: **iPhone 5s with Touch ID**.

The sensor was embedded in the Home button. It read fingerprints in under 0.5 seconds. It used radio frequency to scan beneath the outer skin layer to the dermis — making it resistant to fake fingerprints. The Secure Enclave stored templates in isolated hardware that no iOS app could access.

The architecture principle that Touch ID established: **you never handle biometric data**. The OS mediates everything. Your app calls `authenticate()` and receives `true` or `false`. The fingerprint template stays in hardware. This is why `LocalAuthentication().authenticate()` has no way to return a fingerprint image — the API is intentionally designed to make it impossible to access the raw data.

Android manufacturers scrambled to add fingerprint sensors. The race to match iPhone biometrics drove the diversity of fingerprint implementations (front-mounted, rear-mounted, in-display) that you need to test Flutter apps against today.

### Sign In With Apple — The Forced Hand (WWDC, June 2019)

At WWDC 2019, Apple announced **Sign In With Apple** and simultaneously announced **App Store Review Guideline 4.8**: any app offering third-party sign-in (Google, Facebook, Twitter) must also offer Sign In With Apple as an equivalent option.

Apple's differentiator: **Hide My Email**. Sign In With Apple can generate a random relay address (`xyz123@privaterelay.appleid.com`) that forwards to your real address. The app never sees your real email. You can disable the relay at any time, revoking the app's ability to email you with one tap.

This is why `sign_in_with_apple` is a mandatory package for any Flutter app on iOS that offers Google Sign-In. It is an **App Store submission requirement** — missing it triggers a rejection with Guideline 4.8 cited.

**Auth method requirement matrix:**

```
What you offer     iOS App Store            Android Play Store
──────────────     ──────────────────────   ──────────────────────
Google Sign-In     MUST also offer Apple    No extra requirements
Facebook Sign-In   MUST also offer Apple    No extra requirements  
Email + password   No extra requirements    No extra requirements
Only Apple         Fine                     N/A (Apple not on Android)
```

---

## 1. `TextField` vs `TextFormField`

```dart
// TextField — standalone, no form coordination
TextField(
  controller: _myController,   // you manage the value
  onChanged: (value) => print(value),
)

// TextFormField — designed to live inside a Form
TextFormField(
  validator: (value) {
    if (value == null || value.isEmpty) return 'Required';
    return null;  // null = valid
  },
  onSaved: (value) => _savedEmail = value!,
  // value management handled by Form — no controller needed
)
```

**Rule:** Use `TextField` when you need a standalone input with manual control. Use `TextFormField` inside a `Form` — it participates in the form's `validate()` and `save()` lifecycle automatically.

---

## 2. The Full Form Pattern

> 📄 **Flutter Docs:**
> *"An optional container for grouping together multiple form field widgets. Each individual form field should be wrapped in a FormField widget, with the Form widget as a common ancestor. Call methods on FormState to save, reset, or validate each FormField that is a descendant of this Form."*

```dart
class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  // The GlobalKey gives you access to the FormState — required to call validate() and save()
  final _formKey = GlobalKey<FormState>();

  // These hold the saved values after form.save()
  String _email = '';
  String _password = '';
  String _name = '';
  bool _isLoading = false;

  Future<void> _submit() async {
    // 1. Validate all TextFormFields in this Form
    //    Each validator runs; if any returns a non-null string, validate() returns false
    if (!_formKey.currentState!.validate()) return;

    // 2. Trigger onSaved on all TextFormFields — populates _email, _password, _name
    _formKey.currentState!.save();

    setState(() => _isLoading = true);
    try {
      await AuthService.signUp(name: _name, email: _email, password: _password);
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomeScreen()));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Theme.of(context).colorScheme.error),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SingleChildScrollView(   // ← keyboard pushes content up; this allows scrolling
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline),
                  helperText: 'First and last name',
                ),
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,   // ← "Next" on keyboard → focus moves down
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Name is required';
                  if (v.trim().split(' ').length < 2) return 'Enter your full name';
                  return null;
                },
                onSaved: (v) => _name = v!.trim(),
              ),
              const SizedBox(height: 20),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autocorrect: false,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Email is required';
                  final emailRegex = RegExp(r'^[\w.-]+@[\w-]+\.\w{2,}$');
                  if (!emailRegex.hasMatch(v)) return 'Enter a valid email';
                  return null;
                },
                onSaved: (v) => _email = v!.trim(),
              ),
              const SizedBox(height: 20),
              _PasswordField(
                onSaved: (v) => _password = v,
              ),
              const SizedBox(height: 32),
              FilledButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading
                    ? const SizedBox(
                        height: 20, width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Create Account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

🎨 **Designer:** `InputDecoration` gives you every state automatically:
- **Default:** floating label above the field (when focused), placeholder behavior
- **Focused:** colored bottom border / outline
- **Error:** red border + error text below the field (the validator's returned string)
- **Disabled:** greyed out, user can't interact

Material 3 style: wrap your entire app with `InputDecorationTheme` in `ThemeData` to set consistent borders. The most common:

```dart
// In your ThemeData:
inputDecorationTheme: InputDecorationTheme(
  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
  filled: true,
  fillColor: colorScheme.surfaceVariant.withOpacity(0.5),
),
```

---

## 3. Password Field With Show/Hide Toggle

```dart
// Extracted as a reusable StatefulWidget — has its own _isObscured state
class _PasswordField extends StatefulWidget {
  final void Function(String) onSaved;

  const _PasswordField({required this.onSaved});

  @override
  State<_PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<_PasswordField> {
  bool _isObscured = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      obscureText: _isObscured,
      decoration: InputDecoration(
        labelText: 'Password',
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          icon: Icon(_isObscured ? Icons.visibility_off : Icons.visibility),
          onPressed: () => setState(() => _isObscured = !_isObscured),
          tooltip: _isObscured ? 'Show password' : 'Hide password',
        ),
      ),
      textInputAction: TextInputAction.done,
      validator: (v) {
        if (v == null || v.isEmpty) return 'Password is required';
        if (v.length < 8) return 'At least 8 characters required';
        if (!v.contains(RegExp(r'[A-Z]'))) return 'Include at least one uppercase letter';
        if (!v.contains(RegExp(r'[0-9]'))) return 'Include at least one number';
        return null;
      },
      onSaved: (v) => widget.onSaved(v!),
    );
  }
}
```

**→ Try this:** Add a password strength indicator below this field using a `LinearProgressIndicator`. Calculate strength (0.0–1.0) based on: length > 8 = +0.25, has uppercase = +0.25, has number = +0.25, has special char = +0.25. Color it red → yellow → green.

---

## 4. `TextEditingController` — When You Need Direct Control

```dart
// Use a controller when you need to:
// 1. Read the current value at any point (not just onSaved)
// 2. Set the value programmatically
// 3. Watch every keystroke with addListener
// 4. Control cursor position

class SearchScreen extends StatefulWidget { ... }

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    // Fires on every keystroke
    final query = _searchController.text;
    _performSearch(query);
  }

  void _clearSearch() {
    _searchController.clear();   // empties the field
  }

  void _setQuery(String query) {
    _searchController.text = query;    // sets a value programmatically
    // OR to also control cursor position:
    _searchController.value = TextEditingValue(
      text: query,
      selection: TextSelection.collapsed(offset: query.length),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();  // ALWAYS dispose controllers
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _searchController,
      decoration: InputDecoration(
        hintText: 'Search...',
        prefixIcon: const Icon(Icons.search),
        suffixIcon: ValueListenableBuilder<TextEditingValue>(
          valueListenable: _searchController,
          builder: (context, value, _) {
            return value.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: _clearSearch,
                  )
                : const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}
```

🧑‍💻 **Developer:** `ValueListenableBuilder<TextEditingValue>` — this listens to the controller and only rebuilds the suffix icon area (not the entire widget tree) when the text changes. More efficient than `addListener` + `setState` for UI updates.

---

## 5. Focus Management — Keyboard Navigation

> 📄 **Flutter Docs:**
> *"A FocusNode represents the focus tree for a widget, which is used by the focus system to track which widget has focus. A widget has focus when it is the one that can receive keyboard input."*

```dart
class LoginForm extends StatefulWidget { ... }

class _LoginFormState extends State<LoginForm> {
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();

  @override
  void dispose() {
    _emailFocus.dispose();      // ALWAYS dispose FocusNodes
    _passwordFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextFormField(
          focusNode: _emailFocus,
          decoration: const InputDecoration(labelText: 'Email'),
          textInputAction: TextInputAction.next,
          onFieldSubmitted: (_) {
            // When user presses "Next" on keyboard, move focus to password
            FocusScope.of(context).requestFocus(_passwordFocus);
          },
        ),
        TextFormField(
          focusNode: _passwordFocus,
          decoration: const InputDecoration(labelText: 'Password'),
          textInputAction: TextInputAction.done,
          onFieldSubmitted: (_) {
            // When user presses "Done" on keyboard, submit the form
            _submit();
          },
        ),
      ],
    );
  }
}
```

🎨 **Designer:** The keyboard action button in the bottom-right of the software keyboard:
| `TextInputAction` | Button Shows | Use When |
|-------------------|-------------|----------|
| `.next` | "Next" | More fields below |
| `.done` | "Done" | Last field in form |
| `.search` | "Search" | Search field |
| `.send` | "Send" | Chat input |
| `.go` | "Go" | URL field |
| `.newline` | Return | Multiline text |

Getting this right makes forms feel professional. Getting it wrong (showing "Done" when there are more fields) frustrates users.

---

## 6. Handling the Keyboard — Prevent Overlap

> 📄 **Flutter Docs:**
> *"In many applications, the keyboard can be obtrusive and overlap important UI elements. resizeToAvoidBottomInset allows the Scaffold to resize itself to avoid the keyboard."*

```dart
// Scaffold resizes by default — forms pushed up by keyboard
// This is usually the right behavior for forms
Scaffold(
  resizeToAvoidBottomInset: true,  // default — Scaffold body shrinks to avoid keyboard
  body: SingleChildScrollView(      // ← REQUIRED: otherwise bottom fields get cropped
    padding: const EdgeInsets.all(24),
    child: Form(key: _formKey, child: ...),
  ),
)

// To dismiss keyboard on tap outside:
GestureDetector(
  onTap: () => FocusScope.of(context).unfocus(),
  child: Scaffold(...),
)
```

🧑‍💻 **Developer:** When you have a `ListView` with a `TextFormField` inside, the keyboard can push the focused field into view automatically — `ListView` handles this. For a `Column` inside `SingleChildScrollView`, you need to ensure `ScrollController` can reveal the focused field. The simplest fix: wrap the form column in `SingleChildScrollView` and let `resizeToAvoidBottomInset: true` handle the rest.

---

## 7. Pickers — Date, Time, and Custom

### Date Picker

```dart
Future<void> _pickDate() async {
  final DateTime? picked = await showDatePicker(
    context: context,
    initialDate: _selectedDate ?? DateTime.now(),
    firstDate: DateTime(2000),
    lastDate: DateTime(2030),
    helpText: 'SELECT BIRTH DATE',
    confirmText: 'CONFIRM',
    cancelText: 'CANCEL',
  );

  if (picked != null && mounted) {
    setState(() => _selectedDate = picked);
  }
}

// The trigger — a tappable field
ListTile(
  title: const Text('Date of Birth'),
  subtitle: Text(
    _selectedDate != null
        ? DateFormat('dd MMM yyyy').format(_selectedDate!)
        : 'Not selected',
  ),
  trailing: const Icon(Icons.calendar_month),
  onTap: _pickDate,
)
```

### Time Picker

```dart
Future<void> _pickTime() async {
  final TimeOfDay? picked = await showTimePicker(
    context: context,
    initialTime: _selectedTime ?? TimeOfDay.now(),
  );

  if (picked != null && mounted) {
    setState(() => _selectedTime = picked);
  }
}
```

### Dropdown

```dart
// Simple dropdown for short, fixed lists
DropdownButtonFormField<String>(
  decoration: const InputDecoration(labelText: 'Country'),
  value: _selectedCountry,
  items: countries.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
  onChanged: (value) => setState(() => _selectedCountry = value),
  validator: (v) => v == null ? 'Please select a country' : null,
)

// SegmentedButton for 2-4 options displayed inline (Material 3)
SegmentedButton<String>(
  selected: {_selectedGender},
  onSelectionChanged: (selection) => setState(() => _selectedGender = selection.first),
  segments: const [
    ButtonSegment(value: 'male', label: Text('Male'), icon: Icon(Icons.male)),
    ButtonSegment(value: 'female', label: Text('Female'), icon: Icon(Icons.female)),
    ButtonSegment(value: 'other', label: Text('Other')),
  ],
)
```

🎨 **Designer:** Follow these Material 3 guidelines for selectors:
- 2–4 mutually exclusive options: `SegmentedButton`
- 5+ options, text-only: `DropdownButtonFormField`
- Date/time: system pickers (`showDatePicker`/`showTimePicker`)
- Long list selection (50+ items): dedicated picker screen with search

---

## 8. Real-Time Validation vs On-Submit

> 📄 **Flutter Docs:**
> *"By default, the form will validate after every onChanged event. Use `autovalidateMode` to control when validation runs."*

```dart
Form(
  key: _formKey,
  // AutovalidateMode.disabled (default) — only validate when you call form.validate()
  // AutovalidateMode.onUserInteraction — validate each field after first interaction
  // AutovalidateMode.always — validate every build
  autovalidateMode: AutovalidateMode.onUserInteraction,
  child: ...
)
```

🎨 **Designer UX decision:**
- `disabled` → validate only on submit. Cleanest, no distracting red text as user types
- `onUserInteraction` → validate after user first touches a field and moves on. Good balance — shows errors after first attempt, not while typing
- `always` → real-time. Good for password strength. Bad for email (marks "h" as invalid immediately)

Common pattern: use `disabled` mode, show errors only after the first submit attempt, then switch to `onUserInteraction` mode so subsequent edits show live feedback:

```dart
AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;

Future<void> _submit() async {
  // Switch to live validation so corrections show immediately
  setState(() => _autovalidateMode = AutovalidateMode.onUserInteraction);

  if (!_formKey.currentState!.validate()) return;
  // ... rest of submit
}
```

---

## 9. Testing Forms

```dart
testWidgets('sign up form validates and submits', (tester) async {
  await tester.pumpWidget(MaterialApp(home: SignUpScreen()));

  // 1. Try to submit with empty fields
  await tester.tap(find.text('Create Account'));
  await tester.pump();

  // Error messages should appear
  expect(find.text('Email is required'), findsOneWidget);
  expect(find.text('Password is required'), findsOneWidget);

  // 2. Fill in valid email
  await tester.enterText(find.byType(TextFormField).at(0), 'Harsha Alasai');
  await tester.enterText(find.byType(TextFormField).at(1), 'test@example.com');
  await tester.enterText(find.byType(TextFormField).at(2), 'Password1!');

  // 3. Submit
  await tester.tap(find.text('Create Account'));
  await tester.pump();  // start loading

  // Error messages should be gone
  expect(find.text('Email is required'), findsNothing);

  // Loading indicator appears (button disabled)
  expect(find.byType(CircularProgressIndicator), findsOneWidget);
});

testWidgets('password toggle shows and hides password', (tester) async {
  await tester.pumpWidget(MaterialApp(home: SignUpScreen()));

  // Password is initially hidden
  final passwordField = tester.widget<TextFormField>(find.byType(TextFormField).last);
  // TextFormField doesn't directly expose obscureText — look at the underlying EditableText
  final editableText = tester.widget<EditableText>(find.byType(EditableText).last);
  expect(editableText.obscureText, isTrue);

  // Tap the eye icon
  await tester.tap(find.byIcon(Icons.visibility_off));
  await tester.pump();

  // Password is now visible
  final editableTextAfter = tester.widget<EditableText>(find.byType(EditableText).last);
  expect(editableTextAfter.obscureText, isFalse);
});
```

---

## Form Accessibility

> 🍎 **Academy Golden Rule — Forms Must Be Navigable By Everyone:**
> *"A screen reader user should be able to fill out your form without sighted assistance. Every field needs a label. Every error needs to be announced. Keyboard navigation must follow visual order."*

```dart
// ✓ Accessible form field — label, error, and hint all announced by VoiceOver/TalkBack
TextFormField(
  decoration: const InputDecoration(
    labelText: 'Email address',            // announced when field is focused
    hintText: 'you@example.com',          // announced after the label
    helperText: 'We will never share your email',
  ),
  validator: (value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';          // error state is auto-announced
    }
    return null;
  },
  autofillHints: const [AutofillHints.email],  // suggests saved emails
  textInputAction: TextInputAction.next,        // keyboard shows "Next" → tab order
)

// ❌ NOT accessible — placeholder disappears when typing, no label for screen readers
TextFormField(
  decoration: const InputDecoration(
    hintText: 'Email',      // disappears once user starts typing — useless
  ),
)
```

```dart
// Autofill hints — tell the OS what data this field expects
TextFormField(
  autofillHints: const [AutofillHints.givenName],       // first name
)
TextFormField(
  autofillHints: const [AutofillHints.familyName],      // last name
)
TextFormField(
  autofillHints: const [AutofillHints.email],           // email
)
TextFormField(
  autofillHints: const [AutofillHints.newPassword],     // password manager: generate
)

// Wrap the entire form in AutofillGroup for password managers
AutofillGroup(
  child: Form(
    key: _formKey,
    child: Column(children: [/* form fields */]),
  ),
)
```

**Form accessibility checklist:**
```
1. Every TextFormField has a labelText (not just hintText)
2. textInputAction is set (next/done) for keyboard tab order
3. autofillHints are set for common fields (email, name, password)
4. Form is wrapped in AutofillGroup for password managers
5. Error messages are descriptive ("Password must be 8+ characters", not "Invalid")
6. FocusNode order matches visual top-to-bottom order
```

---

## 12. Form Submission Architecture — Enterprise Pattern

> 🏢 **Enterprise Reality:**
> *"A form submission is a state machine: idle → validating → submitting → success/error. Enterprise teams model this explicitly — no boolean spaghetti with `isLoading` and `hasError` and `isSubmitted`."*

```dart
// Form submission as a sealed state machine
sealed class FormSubmissionState {}
class FormIdle extends FormSubmissionState {}
class FormValidating extends FormSubmissionState {}
class FormSubmitting extends FormSubmissionState {}
class FormSuccess extends FormSubmissionState { final String message; FormSuccess(this.message); }
class FormError extends FormSubmissionState { final String error; final Map<String, String>? fieldErrors; FormError(this.error, {this.fieldErrors}); }

// Form BLoC with explicit state machine
class AddExpenseFormBloc extends Bloc<AddExpenseFormEvent, AddExpenseFormState> {
  AddExpenseFormBloc(this._addExpense) : super(AddExpenseFormState.initial()) {
    on<SubmitFormEvent>(_onSubmit);
  }

  Future<void> _onSubmit(SubmitFormEvent event, Emitter<AddExpenseFormState> emit) async {
    // Step 1: Validate
    emit(state.copyWith(submission: FormValidating()));
    final errors = _validate(event);
    if (errors.isNotEmpty) {
      emit(state.copyWith(submission: FormError('Please fix the errors', fieldErrors: errors)));
      return;
    }

    // Step 2: Submit
    emit(state.copyWith(submission: FormSubmitting()));
    final result = await _addExpense(event.toParams());

    switch (result) {
      case Success():
        emit(state.copyWith(submission: FormSuccess('Expense added')));
      case Failure(:final error):
        emit(state.copyWith(submission: FormError(error.userMessage)));
    }
  }

  Map<String, String> _validate(SubmitFormEvent event) {
    final errors = <String, String>{};
    if (event.title.trim().isEmpty) errors['title'] = 'Title is required';
    if (event.amount <= 0) errors['amount'] = 'Amount must be positive';
    return errors;
  }
}

// In the widget — react to state machine, not booleans
BlocConsumer<AddExpenseFormBloc, AddExpenseFormState>(
  listener: (context, state) {
    switch (state.submission) {
      case FormSuccess(:final message):
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
        Navigator.pop(context);
      case FormError(:final error, :final fieldErrors):
        // Server-side validation errors mapped to specific fields
        if (fieldErrors != null) _showFieldErrors(fieldErrors);
      default: break;
    }
  },
  builder: (context, state) {
    final isSubmitting = state.submission is FormSubmitting;
    return FilledButton(
      onPressed: isSubmitting ? null : () => bloc.add(SubmitFormEvent(/* ... */)),
      child: isSubmitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
    );
  },
)
```

---

## Lab — Registration Form

Build a complete user registration form with these fields:

1. **Full Name** — required, must contain first + last name
2. **Email** — required, valid email regex
3. **Phone** — optional, `TextInputType.phone`, regex validate if provided
4. **Date of Birth** — required, date picker, must be 18+
5. **Gender** — `SegmentedButton`: Male / Female / Prefer not to say
6. **Password** — required, min 8 chars, 1 uppercase, 1 number
7. **Confirm Password** — must match Password field (cross-field validation)
8. **Country** — `DropdownButtonFormField` with 10+ countries
9. **Terms and Conditions** — `CheckboxListTile`, must be checked to submit

**Behavior:**
- Keyboard navigation: Tab/Next moves focus through all text fields in order
- Validation mode: disabled until first submit, then `onUserInteraction`
- Submit button shows `CircularProgressIndicator` while loading
- Success: navigate to a `SuccessScreen` with the user's name
- Failure: show a `SnackBar` with the error message
- Scroll: all content scrollable, focused field never hidden by keyboard

---

## Challenge — Profile Edit Screen

Build a profile editor that loads existing data and allows editing:

```dart
class ProfileEditScreen extends StatefulWidget {
  final Profile existingProfile;   // existing data pre-filled into the form
  const ProfileEditScreen({super.key, required this.existingProfile});
}
```

Requirements:
- All fields pre-filled from `existingProfile`
- Avatar: tappable circular image that opens `showModalBottomSheet` with "Camera" and "Gallery" options (don't implement the actual picker — just show the options)
- Unsaved changes detection: if the user tries to navigate away with unsaved changes, show "Discard changes?" dialog (use `PopScope` or `WillPopScope`)
- Save: pops with the updated `Profile` object so the parent can update its state

---

## 9. `TextInputFormatter` — Phone Numbers, Credit Cards, and Custom Masks

> 📄 **Flutter Docs:**
> *"An interface for formatters of text editing values. A TextInputFormatter can be optionally injected into a TextField or TextFormField to provide as-you-type reformatting of text."*

```dart
// Built-in formatters
TextField(
  // Only allow digits (no letters, no special chars)
  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
)

TextField(
  // Allow letters and spaces only (deny everything else)
  inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z\s]'))],
)

TextField(
  // Deny specific characters (blacklist)
  inputFormatters: [FilteringTextInputFormatter.deny(RegExp(r'[<>]'))],
)

TextField(
  // Limit character count to 10
  inputFormatters: [LengthLimitingTextInputFormatter(10)],
)
```

```dart
// Custom formatter — Indian phone number: +91 XXXXX XXXXX
class PhoneNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.replaceAll(RegExp(r'\D'), ''); // digits only
    final buffer = StringBuffer();

    for (int i = 0; i < text.length && i < 10; i++) {
      if (i == 5) buffer.write(' ');  // add space after 5 digits
      buffer.write(text[i]);
    }

    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

// Credit card formatter: XXXX XXXX XXXX XXXX
class CreditCardFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue old, TextEditingValue newVal) {
    final digits = newVal.text.replaceAll(RegExp(r'\D'), '');
    final buffer = StringBuffer();

    for (int i = 0; i < digits.length && i < 16; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(digits[i]);
    }

    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

// Usage
TextFormField(
  keyboardType: TextInputType.phone,
  inputFormatters: [
    FilteringTextInputFormatter.digitsOnly,
    LengthLimitingTextInputFormatter(10),
    PhoneNumberFormatter(),
  ],
  decoration: const InputDecoration(
    labelText: 'Phone number',
    prefixText: '+91 ',
  ),
  validator: (v) {
    final digits = v?.replaceAll(' ', '') ?? '';
    if (digits.length != 10) return 'Enter a valid 10-digit number';
    return null;
  },
)
```

🎨 **Designer:** Real-time formatting is a UX win — users see `98765 43210` instead of `9876543210`. The space groups digits into readable chunks and prevents entry errors. Every financial app (Razorpay, CRED, PhonePe) uses this pattern.

---

## 10. `InputDecoration` Deep Dive

```dart
TextFormField(
  decoration: InputDecoration(
    // Labels and hints
    labelText: 'Email address',         // floating label
    hintText: 'you@example.com',        // placeholder inside the field
    helperText: 'We'll never share your email',  // text below the field
    counterText: '${_email.length}/100',  // text at bottom-right

    // Leading/trailing widgets
    prefixIcon: const Icon(Icons.email_outlined),  // icon inside, left
    suffixIcon: _isPasswordVisible
        ? IconButton(icon: const Icon(Icons.visibility_off), onPressed: _toggle)
        : IconButton(icon: const Icon(Icons.visibility), onPressed: _toggle),
    prefixText: '+91 ',    // static text before input (e.g., country code)
    suffix: const Text('INR'),  // widget after input (inline)

    // Border styles — OutlineInputBorder is most common
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Colors.grey),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Theme.of(context).colorScheme.error),
    ),

    // Background fill
    filled: true,
    fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),

    // Content padding — controls inner space
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),

    // Error text — set manually or auto-set by Form validation
    errorText: _hasSubmitted && _email.isEmpty ? 'Required' : null,
  ),
)
```

---

## The Invisible Machinery — How the Software Keyboard Works

When your `TextField` gets focus and the keyboard slides up, that keyboard is not part of your app. It is a completely separate application, running in a completely separate OS process, communicating with your app through a system-mediated protocol.

### The Keyboard Is Its Own App

On Android, the keyboard is an **Input Method Editor (IME)** — a system app (GBoard, SwiftKey, Samsung Keyboard) running its own process. On iOS, the keyboard is an extension (a `UIInputViewController` in its own extension sandbox). Both platforms enforce strict isolation: the keyboard cannot read your app's memory, and your app cannot read the keyboard's internal state.

```
User taps TextField → focus is assigned
     ↓
Flutter calls TextInput.show() via platform channel
     ↓ (Dart → method channel → Kotlin/Swift native layer)
OS receives "activate input method" request
     ↓ starts/brings forward the IME process
     ↓ IME window is drawn above your app's window (higher z-order)
User types "H"
     ↓ IME process captures the physical key event
     ↓ runs autocorrect/spellcheck (IME's own dictionaries, IME's own process)
     ↓ decides what text to insert: "H" (or a corrected word, or a prediction)
IME sends a text delta to the OS
     ↓ OS routes it to your app via InputConnection (Android) / UITextInput (iOS)
Flutter's text input plugin receives the delta
     ↓ TextEditingController.value updates
     ↓ setState fires → TextField redraws
```

Every keystroke crosses 4 process boundaries. Under memory pressure, this IPC (inter-process communication) overhead is why text input can occasionally feel slightly laggy.

### Why `keyboardType` Is a Suggestion, Not a Command

`keyboardType: TextInputType.emailAddress` tells the OS to **suggest** an email-optimized keyboard. The OS decides what to show. GBoard might add `@` and `.com` keys. QuickType might disable autocorrect for the email field. A custom third-party IME (Gboard, SwiftKey, custom enterprise keyboards) might ignore your hint entirely — it's another app, and you can't override its behavior. `TextInputType` is a hint that well-behaved IMEs respect.

### What Autocorrect Actually Does (And Doesn't Do)

When you set `autocorrect: true`, your Flutter code performs zero spell-checking. You are instructing the OS to route typed text through the IME's correction engine before forwarding it to your app. The dictionary lookup, the correction suggestion, the "tap to dismiss" underline — all run inside the IME process. Your Flutter code receives the corrected output.

This is why there is no useful "flutter_spellcheck" package. The spell-checking system belongs to the keyboard app. You can turn the OS feature on (`autocorrect: true`) or off (`autocorrect: false`). That is the full extent of your control.

### Why `FocusNode.requestFocus()` Does More Than You Think

```dart
onFieldSubmitted: (_) {
  FocusScope.of(context).requestFocus(_passwordFocusNode);
}
```

This one line triggers a cascade across the OS:
1. Flutter's focus system updates which widget owns the active text input session
2. Flutter calls `TextInput.setClient()` with the new field's configuration — a platform channel call to native code
3. The OS closes the current IME input session for the email field
4. The OS opens a new input session for the password field, passing its `TextInputConfiguration` (different `keyboardType`, `textInputAction`, `obscureText`, `autocorrect` settings)
5. If `keyboardType` changed (e.g., email address → default), the keyboard may visually transition between layouts
6. All subsequent keystrokes go to the password field's `TextEditingController`

`FocusNode` is your handle into the OS-level IME session management system — not just a boolean tracking "is this focused."

### The Keyboard Overlap Problem: How It Actually Works

When the keyboard appears, the OS notifies Flutter that the screen's usable area has changed. Flutter updates `MediaQuery.viewInsets.bottom` — and rebuilds your widget tree with the new value on **every frame of the keyboard animation** (the keyboard slides up over ~250ms):

```
Keyboard hidden:   MediaQuery.viewInsets.bottom = 0
Keyboard animating: viewInsets.bottom grows: 0 → 80 → 160 → 240 → 320 → 340
Keyboard fully up:  MediaQuery.viewInsets.bottom = 340  (keyboard height in logical px)
```

```dart
// Mechanical explanation of "field stays above keyboard":
SingleChildScrollView(
  child: Padding(
    padding: EdgeInsets.only(
      bottom: MediaQuery.of(context).viewInsets.bottom,  // grows as keyboard opens
    ),
    child: Column(children: [ /* form fields */ ]),
  ),
)

// Frame 1 (keyboard hidden):    padding-bottom = 0     → content at normal position
// Frame 8 (keyboard halfway):   padding-bottom = 160   → content shifted up 160px
// Frame 15 (keyboard fully up): padding-bottom = 340   → content shifted up 340px
// → the focused field is now above the keyboard
```

Flutter rebuilds the padding widget on every animation frame as `viewInsets.bottom` changes. The rebuilds don't cause jank because they're scheduled as part of the same frame pipeline as the keyboard animation.

**Decision table — keyboard problems:**

| Problem | Root cause | Fix |
|---------|------------|-----|
| Field hidden behind keyboard | No `viewInsets` padding, no scroll | Wrap in `SingleChildScrollView` + `EdgeInsets.only(bottom: viewInsets.bottom)` |
| `textInputAction.next` key does nothing | `onFieldSubmitted` handler missing | Add `onFieldSubmitted: (_) => FocusScope.of(context).requestFocus(nextNode)` |
| `autocorrect: false` still autocorrects | Third-party IME ignores the hint | Expected — the keyboard is an independent app you cannot override |
| Keyboard flickers when switching fields | `keyboardType` changes between fields | Intentional OS behavior — keep `keyboardType` consistent to avoid it |
| Password field shows suggested passwords on iOS | `autofillHints` is set to `AutofillHints.password` by default | Set `autofillHints: const []` or `enableSuggestions: false` to disable |

---

## Week 8 Verify

1. What is the difference between `TextField` and `TextFormField`? When do you use each?
2. What does `GlobalKey<FormState>` give you? What two methods do you call on it during form submission, and in what order?
3. A user taps "Submit" without filling anything. Your validator returns `'Email is required'`. Where does this string appear on screen?
4. You need to clear a text field programmatically when a "Clear search" button is tapped. Which widget do you need and which method do you call?
5. The keyboard is covering your password field. What two things must be true for this not to happen?
6. `TextInputAction.next` puts "Next" on the keyboard. What code do you write in `onFieldSubmitted` to move focus to the next field?
7. What is `AutovalidateMode.onUserInteraction`? When should you switch to it from `AutovalidateMode.disabled`?
8. A `TextFormField` has `hintText: 'Email'` but no `labelText`. Why is this a problem for accessibility? What does VoiceOver announce when the field is empty vs. when it has text?
9. `AutofillGroup` wraps your form. What does this enable? Name three `AutofillHints` constants and what they tell the OS.
10. A form uses `bool isLoading`, `bool hasError`, `String? errorMessage` to track submission state. What bug can occur with these independent booleans? How does `sealed class FormSubmissionState` with `Idle`, `Validating`, `Submitting`, `Success`, `Error` subtypes prevent it?

---

**Want to actually get fluent, not just informed?** → [Forms Challenges](Week_08b_Forms_Challenges.md) — raw GlobalKey<FormState> mechanics, a real async-validation race condition, validator composition.

**Next → [Week 9: Animations](Week_09_Animations.md)**
