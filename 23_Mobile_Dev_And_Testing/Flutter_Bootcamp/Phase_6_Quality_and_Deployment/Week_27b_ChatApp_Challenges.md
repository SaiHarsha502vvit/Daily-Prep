# Chat App — Project Challenges

### Companion to [Week 27: Project — Chat App (Capstone)](Week_27_Project_ChatApp.md)

---

## How This Works

The capstone gets the capstone treatment: a real subscription-churn bug hiding in this project's own `TypingIndicator`, FCM background-handler subtleties, a Code Review on the optimistic-send flow, and — closing the entire bootcamp's loop — a full-stack test suite for the app's most important single feature: sending a message. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Typing Indicator That Resubscribes Constantly

This project's own `TypingIndicator`:

```dart
class TypingIndicator extends ConsumerWidget {
  const TypingIndicator({super.key, required this.conversationId, required this.otherUser});
  final String conversationId;
  final ChatUser otherUser;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return StreamBuilder<bool>(
      stream: sl<ChatRepository>().watchTypingStatus(conversationId, otherUser.id),
      builder: (context, snapshot) {
        final isTyping = snapshot.data ?? false;
        return isTyping ? const Text('typing...') : const SizedBox();
      },
    );
  }
}
```

This widget sits inside a chat screen that rebuilds every time a new message arrives (entirely reasonable — new messages need to appear). `sl<ChatRepository>().watchTypingStatus(...)` is called fresh, right there inside `build()`, every single time. `StreamBuilder` itself handles subscription lifecycle correctly — it won't leak. So what's actually wrong here, and why does it matter even though nothing crashes or leaks?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `StreamBuilder` compares the `stream:` parameter it receives against what it was previously subscribed to — if `.watchTypingStatus(...)` returns a **new** `Stream` instance on every call (typical for a method wrapping Firestore's `.snapshots()`), then every rebuild of `TypingIndicator` hands `StreamBuilder` a *different* stream object, and `StreamBuilder` correctly (per its own documented contract) unsubscribes from the old one and subscribes to the new one. Nothing leaks — `StreamBuilder` is behaving exactly as designed. But every single incoming chat message now triggers a full unsubscribe-then-resubscribe of the Firestore typing-status listener: a wasted network round-trip to re-establish the listener, a brief window where `snapshot.data` resets and the typing indicator can flicker off and back on, and needless Firestore read/connection churn at scale. This is a quieter cousin of the "creating something fresh in `build()`" family of bugs from [Week 9](../Phase_2_Core_UI/Week_09b_Animation_Challenges.md#-bug-hunt--the-animation-that-runs-once-and-never-again) and [Week 16](../Phase_4_Firebase_and_Storage/Week_16b_Firestore_Challenges.md#-bug-hunt--the-listener-that-multiplies) — no leak this time, because `StreamBuilder` cleans up correctly, but real waste and a real visual glitch nonetheless. The fix: obtain the stream **once**, not on every build:

```dart
class TypingIndicator extends ConsumerStatefulWidget {
  const TypingIndicator({super.key, required this.conversationId, required this.otherUser});
  final String conversationId;
  final ChatUser otherUser;
  @override
  ConsumerState<TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends ConsumerState<TypingIndicator> {
  late final Stream<bool> _typingStream =
      sl<ChatRepository>().watchTypingStatus(widget.conversationId, widget.otherUser.id);

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<bool>(
      stream: _typingStream, // same instance across every rebuild of this widget
      builder: (context, snapshot) {
        final isTyping = snapshot.data ?? false;
        return isTyping ? const Text('typing...') : const SizedBox();
      },
    );
  }
}
```

`late final` means the stream is created exactly once, the first time it's accessed, and reused identically across every subsequent `build()` — `StreamBuilder` now sees the *same* stream instance every time and never needlessly resubscribes.

</details>

---

### 🎭 Two Truths and a Lie — FCM Background Handling

**A.** A Flutter function registered as an FCM background message handler must be a top-level function (or a static method) — it cannot be an instance method on a `State` class or a closure capturing local variables.

**B.** When a push notification arrives while the app is fully closed (not backgrounded, actually terminated), your Flutter/Dart code runs first, decides whether to show a notification, and then hands off to the OS to display it.

**C.** A background message handler should do minimal work — update a local cache, maybe — and should not attempt to show custom UI, because there generally is no UI to show at that point.

<details><summary>Which one's the lie</summary>

**B is the lie**, and it's the exact inversion of what this project's own Invisible Machinery content walks through step by step — per Step 4 of that walkthrough, **"YOUR APP'S CODE HAS NOT RUN YET"** by the time the OS displays the system notification. The OS (via FCM/APNs' persistent connection) receives the notification and displays it **entirely on its own**, using only the `notification` payload FCM was given — your Dart code isn't woken up or consulted at all for a standard notification-payload push. Your background handler only runs for `data`-only messages, or after the user actually taps the notification, at which point the OS launches or foregrounds your app and hands the payload to your handler — the causality runs OS-first, app-code-second (if at all), not the other way around.

🔴 **Explanation:** A and C are both true, and both are Dart-isolate/platform-channel realities worth internalizing: a top-level or static background handler is required because the platform needs to be able to invoke it in a fresh, minimal Dart isolate spun up specifically for this callback — an isolate that doesn't have your running app's widget tree, `BuildContext`s, or captured closures available to it at all, which is precisely why C's "no UI, minimal work" guidance follows directly from A's isolation requirement rather than being an arbitrary best practice.

</details>

---

### 🕵️ Code Review — What Happens When "Optimistic" Send Actually Fails

```dart
Future<void> _onSendText(SendTextMessageEvent event, Emitter<MessagesState> emit) async {
  if (state is! MessagesLoaded) return;
  final current = state as MessagesLoaded;

  final optimisticMsg = Message(
    id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
    text: event.text,
    status: MessageStatus.sending,
  );
  emit(current.copyWith(messages: [...current.messages, optimisticMsg]));

  await _sendMessage(SendMessageParams(conversationId: event.conversationId, text: event.text));
  // 💬 Reviewer: "this shows the message as 'sending' immediately — nice,
  //    feels instant. But what does the user see if _sendMessage throws?
  //    I sent a message on the subway with spotty signal earlier and I
  //    genuinely couldn't tell if it went through or just vanished."
}
```

The reviewer's report from real usage is the important clue here — "couldn't tell if it went through or vanished." Trace through the code and confirm exactly what they experienced.

<details><summary>What the reviewer found, and the fix</summary>

🔴 **Explanation:** there is no `try/catch` around `await _sendMessage(...)` at all — if it throws (no network, a Firestore write failure, anything), the exception propagates up out of `_onSendText` entirely uncaught, the BLoC's event handler terminates abnormally, and **no state ever gets emitted to reflect the failure**. The optimistic message stays visually stuck at `MessageStatus.sending` forever — indistinguishable, from the user's perspective, between "still sending, please wait" and "silently failed, will never arrive." That's exactly the "couldn't tell if it went through or vanished" the reviewer reported. The fix needs a genuine failure path, not just a happy one:

```dart
Future<void> _onSendText(SendTextMessageEvent event, Emitter<MessagesState> emit) async {
  if (state is! MessagesLoaded) return;
  final current = state as MessagesLoaded;

  final tempId = 'temp-${DateTime.now().millisecondsSinceEpoch}';
  final optimisticMsg = Message(id: tempId, text: event.text, status: MessageStatus.sending);
  emit(current.copyWith(messages: [...current.messages, optimisticMsg]));

  try {
    await _sendMessage(SendMessageParams(conversationId: event.conversationId, text: event.text));
    // On success, the real-time Firestore stream (via emit.forEach in _onLoad)
    // will naturally replace this optimistic message with the real synced one.
  } catch (e) {
    final latest = state;
    if (latest is MessagesLoaded) {
      emit(latest.copyWith(
        messages: latest.messages.map((m) => m.id == tempId
            ? m.copyWith(status: MessageStatus.failed) // now the UI can show a retry button
            : m).toList(),
      ));
    }
  }
}
```

This is the same "optimistic update needs a rollback/failure path, not just a happy path" lesson as [Week 16's Firestore Boss Battle](../Phase_4_Firebase_and_Storage/Week_16b_Firestore_Challenges.md#-boss-battle--optimistic-update-with-rollback), arriving here in the app where a silent failure has the highest real cost of anywhere in this bootcamp — a message the user believes was sent, that never arrives, in a chat app specifically.

</details>

---

### 🏗️ Build It Blind — Read Receipts

No starter code. Spec only, building on the `MessageStatus` model this project already has (`sending`/`sent`/`delivered`/`read`):

> When the recipient opens a conversation and views messages, every unread message from the other person should transition to `read` status, and the sender's UI should update to show the blue double-checkmark — live, without the sender needing to refresh or reopen the screen. Design the Firestore write (when does "read" get recorded, and by whom) and the listener (how does the sender's device find out) yourself.

<details><summary>One reasonable solution</summary>

```dart
// When the RECIPIENT'S screen displays unread messages from the other user:
Future<void> markVisibleMessagesRead(String conversationId, List<Message> visibleMessages) async {
  final unread = visibleMessages.where((m) => m.senderId != currentUserId && m.status != MessageStatus.read);
  for (final message in unread) {
    await FirebaseFirestore.instance
        .collection('conversations').doc(conversationId)
        .collection('messages').doc(message.id)
        .update({'status': 'read'});
  }
}

// The SENDER's message list is already listening via emit.forEach's Firestore
// stream (from this project's own MessagesBloc._onLoad) — no separate listener
// needed. The moment the recipient's write above lands, the sender's existing
// real-time subscription emits an updated message with status: 'read', and
// MessagesLoaded's message list updates automatically, checkmark included.
```

🔴 **Explanation:** the key design realization this spec is testing — there's no need to invent a *new* real-time mechanism for the sender to "find out" a message was read. `MessagesBloc` is already subscribed to this conversation's Firestore stream via `emit.forEach` (from this project's own core content); the recipient marking a message `read` is just another Firestore document update, which the sender's already-existing listener picks up automatically, the same as any other message change. The actual design work is entirely on the *write* side — deciding precisely when "visible on screen" becomes "marked as read" (immediately on scroll-into-view? after a 1-second dwell, to avoid marking a message read during a fast scroll-past?) — a genuine product decision, not a technical constraint, and worth having consciously made either way rather than defaulting to whichever was easiest to code.

</details>

---

### 👹 Boss Battle — A Full-Stack Test Suite for "Send Message," Closing the Loop

**The spec:** this is the last challenge in the entire bootcamp — bring [Week 24's testing lessons](../Phase_6_Quality_and_Deployment/Week_24b_Testing_Challenges.md) back to the actual capstone feature that matters most: sending a message. Write tests at three levels covering the fixed `_onSendText` from this file's Code Review above: (1) a `blocTest` proving the optimistic message appears with `status: sending` immediately, and transitions to `status: failed` when `_sendMessage` throws, (2) a widget test proving a message with `status: failed` renders a visible retry button that a message with `status: sent` does not, (3) one test proving that tapping retry on a failed message re-attempts the send using the **same** message content, not a blank/default one.

<details><summary>One reasonable solution (structure)</summary>

```dart
// 1. blocTest — the failure path from this file's Code Review, verified
blocTest<MessagesBloc, MessagesState>(
  'failed send marks the optimistic message as failed, not silently stuck on sending',
  build: () {
    when(mockSendMessage(any)).thenThrow(Exception('network error'));
    return MessagesBloc(sendMessage: mockSendMessage, /* ...other deps... */);
  },
  seed: () => const MessagesLoaded(messages: []),
  act: (bloc) => bloc.add(const SendTextMessageEvent(conversationId: 'c1', text: 'hello')),
  expect: () => [
    isA<MessagesLoaded>().having((s) => s.messages.first.status, 'status', MessageStatus.sending),
    isA<MessagesLoaded>().having((s) => s.messages.first.status, 'status', MessageStatus.failed),
  ],
);

// 2. Widget test — retry button visibility tied to status
testWidgets('failed message shows retry button, sent message does not', (tester) async {
  await tester.pumpWidget(makeTestableWidget(MessageBubble(
    message: Message(id: '1', text: 'hi', status: MessageStatus.failed),
  )));
  expect(find.byIcon(Icons.refresh), findsOneWidget);

  await tester.pumpWidget(makeTestableWidget(MessageBubble(
    message: Message(id: '2', text: 'hi', status: MessageStatus.sent),
  )));
  expect(find.byIcon(Icons.refresh), findsNothing);
});

// 3. Retry re-sends the SAME content, not a blank/default
testWidgets('tapping retry resends the original message text', (tester) async {
  final failedMessage = Message(id: '1', text: 'original text', status: MessageStatus.failed);
  await tester.pumpWidget(makeTestableWidgetWithBloc(
    mockBlocSeededWith([failedMessage]),
    child: MessageBubble(message: failedMessage),
  ));

  await tester.tap(find.byIcon(Icons.refresh));
  await tester.pump();

  verify(mockBloc.add(argThat(
    isA<SendTextMessageEvent>().having((e) => e.text, 'text', 'original text'),
  ))).called(1);
});
```

🔴 **Explanation:** this closes the bootcamp's entire challenge-file arc deliberately — test 1 uses `seed:` and `blocTest` from [Week 24's own Boss Battle](../Phase_6_Quality_and_Deployment/Week_24b_Testing_Challenges.md#-boss-battle--full-stack-test-for-a-delete-with-confirmation-flow) to verify the *exact* bug this file's Code Review found and fixed, as an automated test — proving the fix, not just asserting it worked once by hand. Test 3 is the one easiest to get subtly wrong in a real implementation: a retry button that re-sends *some* text (a stale field, an empty string, whatever the current text field happens to contain instead of the original failed message's content) would pass a shallow "does tapping retry call send again" test while still shipping a real bug — verifying the **specific text argument** `SendTextMessageEvent` was constructed with is what actually proves the retry does the right thing, not just *a* thing.

</details>

---

**Bootcamp complete.** Every teaching week and every project week now has a hands-on challenge companion, in nine different formats. If you've worked through this seriously — actually attempting each problem before opening `<details>`, actually running the "prove it yourself" ones — you've spent as much time thinking about how this material breaks as you spent learning how it works. That's the whole point of training, not just reading.
