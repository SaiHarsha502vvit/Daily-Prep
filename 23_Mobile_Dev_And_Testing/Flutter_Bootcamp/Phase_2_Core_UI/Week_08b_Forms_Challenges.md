# Forms & Input Challenges

### Companion to [Week 08: Forms & Input](Week_08_Forms_and_Input.md)

---

## How This Works

These lean on two techniques: reproducing race conditions on purpose (the async-validation bug in W8-3 is a real one, not a contrived puzzle), and building the "high-level" widget's behavior manually so the abstraction stops being a black box. Paste starters into [DartPad](https://dartpad.dev).

---

### W8-1 (Easy) — Raw `GlobalKey<FormState>` mechanics

**Problem:** build a 3-field form (name, email, age) with a submit button, using `Form` + `GlobalKey<FormState>` + `TextFormField.validator` directly — no third-party form package. On submit, call `formKey.currentState!.validate()` and only proceed if it returns `true`.

```dart
class SignupForm extends StatefulWidget {
  const SignupForm({super.key});
  @override
  State<SignupForm> createState() => _SignupFormState();
}

class _SignupFormState extends State<SignupForm> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            decoration: const InputDecoration(labelText: 'Name'),
            validator: (value) {
              // TODO: required, non-empty
              return null;
            },
          ),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Email'),
            validator: (value) {
              // TODO: required, must contain '@'
              return null;
            },
          ),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Age'),
            keyboardType: TextInputType.number,
            validator: (value) {
              // TODO: required, must parse as int >= 13
              return null;
            },
          ),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                debugPrint('All valid — submitting');
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
```

**Task:** fill in the three validators. Then explain: what does `_formKey.currentState!.validate()` actually *do* — how does calling one method on the `Form`'s key end up running all three validators and painting error text under each field?

<details><summary>Solution & Explanation</summary>

```dart
validator: (value) => (value == null || value.trim().isEmpty) ? 'Name is required' : null,

validator: (value) {
  if (value == null || value.trim().isEmpty) return 'Email is required';
  if (!value.contains('@')) return 'Enter a valid email';
  return null;
},

validator: (value) {
  final age = int.tryParse(value ?? '');
  if (age == null) return 'Enter a valid age';
  if (age < 13) return 'Must be 13 or older';
  return null;
},
```

🔴 **Explanation:** `Form` is an `InheritedWidget`-based registry (the same mechanism as [Week 2's InheritedWidget challenge](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md)) — every `TextFormField` descendant registers its `FormFieldState` with the nearest ancestor `FormState` when it mounts. Calling `formKey.currentState!.validate()` walks that registered list and calls `validate()` on each one, which in turn calls that field's own `validator` function and stores the returned string (or `null`) as its error text, triggering a rebuild of just that field to paint the red error message. The `GlobalKey` is what lets you, outside the `Form`'s own `build()` method, reach in and trigger that walk from a completely different widget (the submit button).

</details>

---

### W8-2 (Medium) — FocusNode chain, and the leak that ties back to Week 3

**Problem:** build 3 `TextField`s where pressing the keyboard's "next" action moves focus to the next field in order, and the last field's "done" action dismisses the keyboard.

```dart
class FocusChain extends StatefulWidget {
  const FocusChain({super.key});
  @override
  State<FocusChain> createState() => _FocusChainState();
}

class _FocusChainState extends State<FocusChain> {
  final _nameFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _phoneFocus = FocusNode();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          focusNode: _nameFocus,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'Name'),
          onSubmitted: (_) {
            // TODO: move focus to email
          },
        ),
        TextField(
          focusNode: _emailFocus,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'Email'),
          onSubmitted: (_) {
            // TODO: move focus to phone
          },
        ),
        TextField(
          focusNode: _phoneFocus,
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(labelText: 'Phone'),
          onSubmitted: (_) {
            // TODO: dismiss keyboard
          },
        ),
      ],
    );
  }

  @override
  void dispose() {
    // TODO: what belongs here, and what breaks if you skip it?
    super.dispose();
  }
}
```

**Task 1:** fill in the three `onSubmitted` callbacks and the `dispose()` method.

**Task 2:** explain, using what you learned in [Week 3's timer-leak challenge](../Phase_1_Dart_and_Foundations/Week_03b_Lifecycle_Challenges.md), what category of bug you get if you forget to dispose the `FocusNode`s — is it a crash, or something quieter?

<details><summary>Solution & Explanation</summary>

```dart
onSubmitted: (_) => FocusScope.of(context).requestFocus(_emailFocus), // name field
onSubmitted: (_) => FocusScope.of(context).requestFocus(_phoneFocus), // email field
onSubmitted: (_) => _phoneFocus.unfocus(), // phone field

@override
void dispose() {
  _nameFocus.dispose();
  _emailFocus.dispose();
  _phoneFocus.dispose();
  super.dispose();
}
```

🔴 **Explanation:** exactly the same shape of bug as [Week 3's `TimerCounter` exercise](../Phase_1_Dart_and_Foundations/Week_03b_Lifecycle_Challenges.md) — `FocusNode` isn't a lightweight value object, it's a resource registered with Flutter's focus tree, holding listeners and OS-level IME session state (see [Week 8's Invisible Machinery](Week_08_Forms_and_Input.md) on the software keyboard as a separate process). Forgetting `dispose()` doesn't crash immediately — it's quieter than that: the `FocusNode` object and everything it's holding onto stay in memory after the widget is gone, and if the screen is visited repeatedly (a settings form the user opens 50 times), you accumulate 150 undisposed `FocusNode`s over the session. Quiet leaks are the dangerous kind precisely because nothing crashes to tell you they're happening.

</details>

---

### W8-3 (Hard) — Debounced async validation, and the race condition it can hide

**Problem:** a username field that checks availability against a simulated API as the user types, debounced by 400ms (reuse the debounce pattern from [Week 1b T4-1](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md) if you want). The simulated API has **variable** latency — this matters.

```dart
Future<bool> checkUsernameTaken(String username) async {
  // simulate variable network latency — shorter usernames "arrive" slower here on purpose
  final delayMs = username == 'ab' ? 2000 : 300;
  await Future.delayed(Duration(milliseconds: delayMs));
  return username == 'admin' || username == 'ab';
}

class UsernameField extends StatefulWidget {
  const UsernameField({super.key});
  @override
  State<UsernameField> createState() => _UsernameFieldState();
}

class _UsernameFieldState extends State<UsernameField> {
  String? _status;

  void _onChanged(String value) async {
    // BUG: no protection against out-of-order responses
    final taken = await checkUsernameTaken(value);
    setState(() => _status = taken ? '$value is taken' : '$value is available');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(onChanged: _onChanged, decoration: const InputDecoration(labelText: 'Username')),
        Text(_status ?? ''),
      ],
    );
  }
}
```

**Task 1:** type `ab` and then, within 2 seconds, quickly delete it and type `charlie`. Predict — what does `_status` end up showing, and is it correct for what's currently in the text field?

**Task 2:** fix it using a request-generation counter — a technique that ignores any response that isn't from the *most recent* request.

<details><summary>Solution & Explanation</summary>

```dart
int _requestId = 0;

void _onChanged(String value) async {
  final int thisRequest = ++_requestId;
  final taken = await checkUsernameTaken(value);
  if (thisRequest != _requestId) return; // a newer request has since started — discard this one
  setState(() => _status = taken ? '$value is taken' : '$value is available');
}
```

🔴 **Explanation:** the bug in Task 1: after typing `ab` (2000ms delay) then `charlie` (300ms delay), `charlie`'s response arrives *first* and correctly shows "charlie is available" — but 1.7 seconds later, `ab`'s slow response finally arrives and overwrites the status with "ab is taken," even though the text field now reads `charlie`. This is a genuine, common production bug: **network responses don't arrive in the order the requests were sent.** The fix increments a counter on every new request; when a response comes back, it checks whether it's still "current" — if a newer request has started in the meantime, the stale response is silently discarded. This is a simpler cousin of the `restartable()` `EventTransformer` from [Week 20's BLoC content](../Phase_5_Advanced_Patterns/Week_20_BLoC_Pattern.md), which solves the exact same class of problem for BLoC event streams.

</details>

---

### W8-4 (Easy) — Validator composition as a higher-order function

**Problem:** write `String? Function(String?) combineValidators(List<String? Function(String?)> validators)` — returns a single validator function that runs each validator in order and returns the **first** non-null error message it finds (short-circuit — don't run the rest once one fails).

```dart
String? Function(String?) combineValidators(List<String? Function(String?)> validators) {
  // TODO
}

// Usage:
final emailValidator = combineValidators([
  (v) => (v == null || v.isEmpty) ? 'Required' : null,
  (v) => (v != null && !v.contains('@')) ? 'Must be a valid email' : null,
]);
```

<details><summary>Solution & Explanation</summary>

```dart
String? Function(String?) combineValidators(List<String? Function(String?)> validators) {
  return (String? value) {
    for (final validator in validators) {
      final error = validator(value);
      if (error != null) return error;
    }
    return null;
  };
}
```

🔴 **Explanation:** this is a first-class-functions exercise — `combineValidators` takes a list of functions and **returns a new function** that closes over that list. It's the same shape as `memoize()` from [Week 1b T5-2](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md): a higher-order function wrapping behavior around other functions. The short-circuit (`return error` the moment one is found, don't run the rest) matters practically — a "required" check and a "valid format" check on the same field shouldn't both fire on an empty string; you want "Required," not "Required" immediately followed by "Must be a valid email" for the same blank field.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🕵️ Code Review — Three Comments on One Form

A teammate left three review comments on this signup form. Figure out what each one is pointing at and fix it — the comments describe the *symptom*, not the fix.

```dart
class SignupForm extends StatefulWidget {
  const SignupForm({super.key});
  @override
  State<SignupForm> createState() => _SignupFormState();
}

class _SignupFormState extends State<SignupForm> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email')),
        // 💬 Reviewer: "typing a password here shows it in plain text to
        //    anyone looking at the screen — is that intentional?"
        TextField(controller: _passwordController, decoration: const InputDecoration(labelText: 'Password')),
        ElevatedButton(
          onPressed: () async {
            // 💬 Reviewer: "this spins forever on a slow network — nothing
            //    tells the user their tap registered"
            await FakeApi.signup(_emailController.text, _passwordController.text);
            Navigator.pop(context);
          },
          child: const Text('Sign Up'),
        ),
      ],
      // 💬 Reviewer: "I got a red screen when I backed out of this form
      //    mid-typing — something about controllers?"
    );
  }
}
```

<details><summary>What each comment means, and the fixes</summary>

**Comment 1 (plain-text password):** add `obscureText: true` to the password field's `TextField`. Nothing else about the code is wrong — this is purely a missing property, easy to miss because the field otherwise "works" perfectly during a quick manual test.

```dart
TextField(controller: _passwordController, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
```

**Comment 2 (no loading feedback):** the button has no notion of "in progress" — tapping it during a slow `await` gives zero visual feedback, and (worse, though not what the reviewer flagged) nothing stops a second tap from firing a second signup request while the first is still pending. Needs a loading flag:

```dart
bool _isSubmitting = false;

ElevatedButton(
  onPressed: _isSubmitting ? null : () async {
    setState(() => _isSubmitting = true);
    await FakeApi.signup(_emailController.text, _passwordController.text);
    if (!mounted) return;
    Navigator.pop(context);
  },
  child: _isSubmitting ? const CircularProgressIndicator() : const Text('Sign Up'),
),
```

**Comment 3 (red screen on back-out):** the two `TextEditingController`s are created but never disposed — [Week 3's leak lesson](../Phase_1_Dart_and_Foundations/Week_03b_Lifecycle_Challenges.md#w3-3-medium--prove-a-timer-leak-with-a-counter-not-a-guess) applies to controllers exactly as it does to timers. Missing `dispose()` here specifically risks a "used after being disposed" exception if anything (an animation, a listener) tries to touch the controller after the widget is gone — needs:

```dart
@override
void dispose() {
  _emailController.dispose();
  _passwordController.dispose();
  super.dispose();
}
```

🔴 **Explanation:** this format mirrors an actual PR review — the comments tell you *what the reviewer observed*, not the line number or the fix. Comment 2 in particular has a second bug hiding inside the first one's fix (double-submit) that a less careful read would miss entirely.

</details>

---

### ⚡ Speed Round — 5 Questions, 2 Minutes

1. Does `TextEditingController()` need to be created inside `initState`, or can it be a field initializer directly (`final _c = TextEditingController();`)?
2. If a `TextFormField`'s `validator` returns `null`, does that mean the field failed validation or passed it?
3. Does calling `formKey.currentState!.validate()` automatically prevent the `onPressed` callback's *own* code from running if a field is invalid, or do you still need an `if` check?
4. Does `FocusNode.unfocus()` also dismiss the on-screen keyboard, or only remove logical focus?
5. Is `TextEditingController.text` safe to read synchronously at any point, or does it require an `await`?

<details><summary>Answers</summary>

1. **Either works** for a `late final` or direct field initializer, since `TextEditingController()`'s constructor doesn't depend on anything from `initState` — but see [Week 1's `late` lesson](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md#-two-truths-and-a-lie--late) if the initial text depends on a `widget.` property, which does require deferring past the point where `widget` becomes available.
2. **Passed.** `null` from a validator means "no error" — this trips people up because it reads backwards at first (a `null` *error* meaning success).
3. **You still need the `if` check.** `validate()` returns a `bool` and paints error text as a side effect — it does not, by itself, stop any code after it from running; that's on you, same as [W8-1](#w8-1-easy--raw-globalkeyformstate-mechanics).
4. **Both**, in the common case — `unfocus()` removes logical focus, and because nothing else claims focus immediately after, the platform's IME typically dismisses the keyboard as a consequence. It's not guaranteed in every scenario (e.g., another field immediately requesting focus keeps the keyboard up), but for a simple "dismiss on submit" case, it works.
5. **Yes, synchronous.** `.text` is a plain in-memory getter — no `await` needed, unlike anything actually touching the network or disk.

</details>

---

### 👹 Boss Battle — A Multi-Field Form With Cross-Field Validation

**The spec:** build a "change password" form with three fields: current password, new password, confirm new password. Requirements: (1) new password must be at least 8 characters, (2) confirm must exactly match new password — and this check must **re-run live** as the user edits either field, not just on submit, (3) the submit button is disabled entirely (not just validated-on-tap) while any requirement is unmet, (4) all three `TextEditingController`s are properly disposed.

The interesting design problem: requirement (2) is a **cross-field** validation — Flutter's built-in `validator:` on `TextFormField` only sees that one field's own value. How do you validate one field against another's live value?

<details><summary>One reasonable solution</summary>

```dart
class ChangePasswordForm extends StatefulWidget {
  const ChangePasswordForm({super.key});
  @override
  State<ChangePasswordForm> createState() => _ChangePasswordFormState();
}

class _ChangePasswordFormState extends State<ChangePasswordForm> {
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isValid = false;

  @override
  void initState() {
    super.initState();
    _newController.addListener(_revalidate);
    _confirmController.addListener(_revalidate);
  }

  void _revalidate() {
    final valid = _newController.text.length >= 8 &&
        _newController.text == _confirmController.text;
    if (valid != _isValid) setState(() => _isValid = valid);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(controller: _currentController, obscureText: true, decoration: const InputDecoration(labelText: 'Current password')),
        TextField(controller: _newController, obscureText: true, decoration: const InputDecoration(labelText: 'New password')),
        TextField(controller: _confirmController, obscureText: true, decoration: const InputDecoration(labelText: 'Confirm new password')),
        ElevatedButton(
          onPressed: _isValid ? () { /* submit */ } : null,
          child: const Text('Change Password'),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }
}
```

🔴 **Explanation:** the cross-field problem is solved by sidestepping `validator:` entirely for the cross-field piece — instead, both relevant controllers get a listener (`addListener`, the same primitive from [W7's scroll-position bug hunt](Week_07b_Scrolling_Challenges.md#-bug-hunt--the-scroll-to-top-button-that-never-appears)) that re-runs a shared `_revalidate()` check on every keystroke in *either* field, storing the result in one `_isValid` flag the submit button reads directly. This is a genuinely different pattern from the single-field `validator:` callbacks in this week's core content — cross-field rules almost always need this "listen to both, compute together" shape rather than per-field isolated validators.

</details>

---

**Next → [Week 9: Animations](Week_09_Animations.md) · [Animation Challenges](Week_09b_Animation_Challenges.md)**
