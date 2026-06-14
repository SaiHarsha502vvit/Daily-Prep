# Week 8 — Forms & Input
### Text fields, validation, keyboard handling, and pickers

---

## 1. TextField — The Building Block

`TextField` is the raw input widget. You almost never use it directly in forms though — use `TextFormField` instead (covered next).

```dart
class _SearchState extends State<SearchScreen> {
  final TextEditingController _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Listen to every change
    _controller.addListener(() {
      print('Current value: ${_controller.text}');
    });
  }

  @override
  void dispose() {
    _controller.dispose();  // always dispose
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      decoration: InputDecoration(
        hintText: 'Search...',
        prefixIcon: const Icon(Icons.search),
        suffixIcon: _controller.text.isNotEmpty
          ? IconButton(
              icon: const Icon(Icons.clear),
              onPressed: () => _controller.clear(),
            )
          : null,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: true,
        fillColor: Colors.grey.shade100,
      ),
      keyboardType: TextInputType.text,
      textInputAction: TextInputAction.search,
      onSubmitted: (value) => _performSearch(value),
      onChanged: (value) => setState(() {}),  // rebuild to show/hide clear button
    );
  }
}
```

**`TextEditingController` — what it gives you:**
```dart
controller.text               // current string value
controller.text = 'new value' // programmatically set value
controller.clear()            // empty the field
controller.selection          // cursor position
controller.addListener(fn)    // called on every change
```

**→ Try this:** Build a search bar. As the user types, show a count of how many characters they've typed. Show a clear button (✕) only when the field has text. Tapping clear empties the field.

---

## 2. FocusNode — Controlling the Keyboard

`FocusNode` lets you programmatically control which field has keyboard focus.

```dart
class _LoginState extends State<LoginScreen> {
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();

  @override
  void dispose() {
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      TextField(
        focusNode: _emailFocus,
        textInputAction: TextInputAction.next,
        onSubmitted: (_) {
          // When user presses "Next" on keyboard, jump to password field
          FocusScope.of(context).requestFocus(_passwordFocus);
        },
      ),
      TextField(
        focusNode: _passwordFocus,
        textInputAction: TextInputAction.done,
        onSubmitted: (_) {
          // When user presses "Done", dismiss keyboard and submit
          FocusScope.of(context).unfocus();
          _submit();
        },
      ),
    ]);
  }
}
```

**Dismissing the keyboard:**
```dart
// Dismiss keyboard from anywhere
FocusScope.of(context).unfocus();

// Or wrap your entire screen in GestureDetector to dismiss on tap-outside
GestureDetector(
  onTap: () => FocusScope.of(context).unfocus(),
  child: /* your screen content */,
)
```

---

## 3. Form + TextFormField — The Right Way to Build Forms

`TextFormField` is `TextField` + validation built in. `Form` is the wrapper that coordinates all fields.

```dart
class RegistrationForm extends StatefulWidget {
  const RegistrationForm({super.key});

  @override
  State<RegistrationForm> createState() => _RegistrationFormState();
}

class _RegistrationFormState extends State<RegistrationForm> {
  final _formKey = GlobalKey<FormState>();  // unique identity of this form

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    // validate() calls every field's validator — returns true only if ALL pass
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 2)); // fake API call
    if (!mounted) return;
    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Registration successful!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Name field
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Full Name',
              prefixIcon: Icon(Icons.person_outline),
            ),
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            validator: (value) {
              if (value == null || value.trim().isEmpty) return 'Name is required';
              if (value.trim().length < 2) return 'Name must be at least 2 characters';
              return null;  // null = valid
            },
          ),

          const SizedBox(height: 16),

          // Email field
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email_outlined),
            ),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            validator: (value) {
              if (value == null || value.isEmpty) return 'Email is required';
              final emailRegex = RegExp(r'^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$');
              if (!emailRegex.hasMatch(value)) return 'Enter a valid email';
              return null;
            },
          ),

          const SizedBox(height: 16),

          // Password field with show/hide toggle
          TextFormField(
            controller: _passwordController,
            decoration: InputDecoration(
              labelText: 'Password',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _submit(),
            validator: (value) {
              if (value == null || value.isEmpty) return 'Password is required';
              if (value.length < 8) return 'Password must be at least 8 characters';
              if (!value.contains(RegExp(r'[A-Z]'))) return 'Include at least one uppercase letter';
              if (!value.contains(RegExp(r'[0-9]'))) return 'Include at least one number';
              return null;
            },
          ),

          const SizedBox(height: 24),

          // Submit button
          ElevatedButton(
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
    );
  }
}
```

**How `validate()` works:**
- Calls every `validator` function in the Form
- Each returns `null` (valid) or a String error message (invalid)
- If ANY returns a non-null string, `validate()` returns `false` and error text appears under the field
- If ALL return null, `validate()` returns `true` and you can proceed

**→ Try this:** Add a "Confirm Password" field to the form above. Its validator should check that its value equals `_passwordController.text`. If they don't match, show "Passwords do not match".

---

## 4. InputDecoration — Styling Fields

```dart
InputDecoration(
  // Label animates up when field is focused
  labelText: 'Email',
  labelStyle: const TextStyle(color: Colors.grey),

  // Hint shows inside field when empty
  hintText: 'you@example.com',

  // Helper text always shows below field
  helperText: 'We will never share your email',

  // Error text (also shown by validator)
  errorText: _emailError,  // null hides it, string shows it

  // Icons
  prefixIcon: const Icon(Icons.email),
  suffixIcon: const Icon(Icons.check_circle, color: Colors.green),
  prefix: const Text('+91 '),   // text inside the field, before input
  suffix: const Text('.com'),   // text inside the field, after input

  // Borders — four states
  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
  enabledBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(8),
    borderSide: const BorderSide(color: Colors.grey),
  ),
  focusedBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(8),
    borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 2),
  ),
  errorBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(8),
    borderSide: const BorderSide(color: Colors.red),
  ),

  // Background fill
  filled: true,
  fillColor: Colors.grey.shade50,

  // Content padding
  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
)
```

**Global form theming** — set once in `MaterialApp`, applies everywhere:
```dart
MaterialApp(
  theme: ThemeData(
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      filled: true,
      fillColor: Colors.grey.shade100,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
  ),
)
```

---

## 5. Pickers

**Date Picker:**
```dart
Future<void> _pickDate() async {
  final picked = await showDatePicker(
    context: context,
    initialDate: _selectedDate ?? DateTime.now(),
    firstDate: DateTime(1900),
    lastDate: DateTime(2100),
    builder: (context, child) {
      // Optional: wrap with Theme to change date picker colors
      return Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(primary: Colors.deepPurple),
        ),
        child: child!,
      );
    },
  );

  if (picked != null) {
    setState(() => _selectedDate = picked);
  }
}
```

**Time Picker:**
```dart
Future<void> _pickTime() async {
  final picked = await showTimePicker(
    context: context,
    initialTime: _selectedTime ?? TimeOfDay.now(),
  );
  if (picked != null) setState(() => _selectedTime = picked);
}
```

**Dropdown:**
```dart
String? _selectedCategory;
final List<String> _categories = ['Work', 'Personal', 'Shopping', 'Health'];

DropdownButtonFormField<String>(
  value: _selectedCategory,
  hint: const Text('Select category'),
  decoration: const InputDecoration(labelText: 'Category'),
  items: _categories.map((cat) =>
    DropdownMenuItem(value: cat, child: Text(cat))
  ).toList(),
  onChanged: (value) => setState(() => _selectedCategory = value),
  validator: (value) => value == null ? 'Please select a category' : null,
)
```

**Switch and Checkbox in forms:**
```dart
// Switch
SwitchListTile(
  title: const Text('Receive notifications'),
  subtitle: const Text('Get updates about your orders'),
  value: _notificationsEnabled,
  onChanged: (value) => setState(() => _notificationsEnabled = value),
)

// Checkbox
CheckboxListTile(
  title: const Text('I agree to the Terms & Conditions'),
  value: _agreedToTerms,
  onChanged: (value) => setState(() => _agreedToTerms = value ?? false),
  controlAffinity: ListTileControlAffinity.leading,
)
```

---

## 6. AutovalidateMode — When to Show Errors

```dart
Form(
  key: _formKey,
  autovalidateMode: AutovalidateMode.onUserInteraction,
  // AutovalidateMode.disabled       — only validate on _formKey.currentState!.validate()
  // AutovalidateMode.onUserInteraction — validates as user types/leaves field
  // AutovalidateMode.always         — validates immediately, even before user touches field
  child: /* fields */,
)
```

Recommendation: use `onUserInteraction`. It only shows errors after the user has interacted with a field — not before they've even typed anything.

---

## Lab — Build a Job Application Form

**Multi-section form. One screen, scrollable.**

**Section 1: Personal Info**
- Full Name (required, min 2 chars)
- Email (required, valid format)
- Phone (required, 10 digits only — use `inputFormatters`)
- Date of Birth (taps opens DatePicker, shows selected date)
- Gender (DropdownButtonFormField: Male / Female / Other / Prefer not to say)

**Section 2: Professional**
- Job Role applying for (Dropdown: Flutter Dev / Backend / Fullstack / Designer)
- Years of experience (Slider from 0-10, shows current value as label)
- Current salary (TextField, numeric keyboard, `₹` prefix)
- Expected salary (same)
- Available from (DatePicker)

**Section 3: Preferences**
- Remote work preferred? (Switch)
- Relocate for opportunity? (Switch)
- Checkbox: "I confirm all info is accurate"
- Checkbox: "I agree to Privacy Policy" (required — validator rejects false)

**Submit button:**
- Disabled while loading
- Shows a spinner inside the button while "submitting"
- On success: shows AlertDialog "Application submitted! We'll contact you within 3 days." with OK button that pops the screen

**Phone input formatting** (only digits, max 10):
```dart
TextFormField(
  keyboardType: TextInputType.phone,
  inputFormatters: [
    FilteringTextInputFormatter.digitsOnly,
    LengthLimitingTextInputFormatter(10),
  ],
)
```

---

## Challenge

Add a **resume upload** button (fake — no actual file system, just simulate):

- "Upload Resume" button opens a BottomSheet with two options: "Take Photo" and "Choose from Gallery" (use `image_picker` package)
- After "selection", show a preview card below the button: filename, file size, a remove button
- Validate at form submission that a resume was "uploaded" (validator on the upload field)

Add a **real-time password strength indicator** under the password field:
- Weak (< 8 chars): red bar at 25%
- Medium (8+ chars, has numbers): orange bar at 50%
- Strong (8+ chars, numbers + uppercase): yellow bar at 75%
- Very Strong (12+ chars, numbers + uppercase + special char): green bar at 100%

Use `AnimatedContainer` to animate the bar width when strength changes.

---

## Before Week 9 — Verify

1. What is the difference between `TextField` and `TextFormField`?
2. What does `_formKey.currentState!.validate()` do — what does it return and when?
3. Why must you `dispose()` a `TextEditingController`?
4. What is `FocusNode` and when do you need it?
5. What does `autovalidateMode: AutovalidateMode.onUserInteraction` change?

---

**Next → [Week 9: Animations](Week_09_Animations.md)**
