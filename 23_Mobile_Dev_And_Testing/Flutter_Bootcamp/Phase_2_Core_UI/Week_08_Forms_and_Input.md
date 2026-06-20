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

## Week 8 Verify

1. What is the difference between `TextField` and `TextFormField`? When do you use each?
2. What does `GlobalKey<FormState>` give you? What two methods do you call on it during form submission, and in what order?
3. A user taps "Submit" without filling anything. Your validator returns `'Email is required'`. Where does this string appear on screen?
4. You need to clear a text field programmatically when a "Clear search" button is tapped. Which widget do you need and which method do you call?
5. The keyboard is covering your password field. What two things must be true for this not to happen?
6. `TextInputAction.next` puts "Next" on the keyboard. What code do you write in `onFieldSubmitted` to move focus to the next field?
7. What is `AutovalidateMode.onUserInteraction`? When should you switch to it from `AutovalidateMode.disabled`?

---

**Next → [Week 9: Animations](Week_09_Animations.md)**
