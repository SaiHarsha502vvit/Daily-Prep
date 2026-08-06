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

**Next → [Week 9: Animations](Week_09_Animations.md) · [Animation Challenges](Week_09b_Animation_Challenges.md)**
