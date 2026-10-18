# Week 27 — Phase 6 Capstone: Real-Time Chat App
### FCM push notifications, Firestore real-time streams, media sharing — the full production pattern

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — FCM token management, real-time streams, image upload, Clean Architecture + BLoC throughout
> - 🎨 **Designer** — chat UI conventions, message bubble layout, status indicators, media previews
> - 🧪 **Tester** — testing real-time streams, FCM notification handling, integration test for message send

---

## What You're Building

A 1:1 chat app with:
- Real-time messaging with Firestore streams
- FCM push notifications (messages arrive even when app is backgrounded)
- Image and file sharing via Firebase Storage
- Online/typing indicators
- Message status (sent → delivered → read)
- Clean Architecture + BLoC + get_it (everything from Phase 5)
- CI/CD pipeline from Week 26

---

## Architecture Overview

```
lib/
  features/
    auth/          ← reuse from Week 17
    chat/
      domain/
        entities/
          chat_user.dart
          conversation.dart
          message.dart
        repositories/
          chat_repository.dart
          storage_repository.dart
        usecases/
          get_conversations.dart
          get_messages.dart
          send_message.dart
          send_image_message.dart
          mark_messages_read.dart
          update_typing_status.dart
      data/
        models/
          chat_user_model.dart
          conversation_model.dart
          message_model.dart
        datasources/
          chat_remote_datasource.dart   ← Firestore
          storage_datasource.dart       ← Firebase Storage
          notification_datasource.dart  ← FCM
        repositories/
          chat_repository_impl.dart
          storage_repository_impl.dart
      presentation/
        screens/
          conversations_screen.dart
          chat_screen.dart
          user_search_screen.dart
          image_preview_screen.dart
        bloc/
          conversations_bloc.dart
          messages_bloc.dart
          typing_cubit.dart
        widgets/
          message_bubble.dart
          conversation_tile.dart
          chat_input_bar.dart
          typing_indicator.dart
          image_message_widget.dart
  core/
    notifications/
      notification_service.dart
    di/injection_container.dart
```

---

## Domain Layer

```dart
// lib/features/chat/domain/entities/message.dart

enum MessageType { text, image, file }
enum MessageStatus { sending, sent, delivered, read }

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;       // text content or download URL for media
  final MessageType type;
  final MessageStatus status;
  final DateTime timestamp;
  final String? localPath;    // temporary local file path while uploading
  final double? uploadProgress; // 0.0–1.0 during upload

  const Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.type,
    required this.status,
    required this.timestamp,
    this.localPath,
    this.uploadProgress,
  });

  bool get isSending => status == MessageStatus.sending;
  bool get isRead => status == MessageStatus.read;

  Message copyWith({
    MessageStatus? status,
    String? content,
    double? uploadProgress,
  }) => Message(
    id: id, conversationId: conversationId, senderId: senderId,
    content: content ?? this.content, type: type,
    status: status ?? this.status, timestamp: timestamp,
    localPath: localPath, uploadProgress: uploadProgress ?? this.uploadProgress,
  );
}

// lib/features/chat/domain/entities/conversation.dart

class Conversation {
  final String id;
  final List<String> participantIds;
  final Map<String, ChatUser> participants;   // pre-fetched user data
  final Message? lastMessage;
  final Map<String, int> unreadCounts;        // userId → unread count
  final Map<String, bool> typingStatus;       // userId → isTyping

  const Conversation({
    required this.id,
    required this.participantIds,
    required this.participants,
    this.lastMessage,
    required this.unreadCounts,
    required this.typingStatus,
  });

  ChatUser otherParticipant(String myUserId) =>
      participants.values.firstWhere((u) => u.id != myUserId);

  bool isTyping(String userId) => typingStatus[userId] == true;
  int unreadCount(String userId) => unreadCounts[userId] ?? 0;
}

// lib/features/chat/domain/entities/chat_user.dart
class ChatUser {
  final String id;
  final String displayName;
  final String? photoUrl;
  final bool isOnline;
  final DateTime? lastSeen;
  final String? fcmToken;  // for sending push notifications

  const ChatUser({
    required this.id,
    required this.displayName,
    this.photoUrl,
    required this.isOnline,
    this.lastSeen,
    this.fcmToken,
  });

  String get statusText => isOnline ? 'Online' : _formatLastSeen();
  String _formatLastSeen() {
    if (lastSeen == null) return 'Offline';
    final diff = DateTime.now().difference(lastSeen!);
    if (diff.inMinutes < 60) return 'Last seen ${diff.inMinutes}m ago';
    if (diff.inHours < 24) return 'Last seen ${diff.inHours}h ago';
    return 'Last seen ${DateFormat('d MMM').format(lastSeen!)}';
  }
}
```

---

## Firestore Data Model

```
chats/
  {conversationId}/
    participantIds: ['uid1', 'uid2']
    participants/
      {uid}/
        displayName: 'Harsha'
        photoUrl: '...'
        isOnline: true
        lastSeen: Timestamp
    lastMessage: { content, senderId, timestamp, type }
    unreadCounts: { uid1: 0, uid2: 3 }
    typingStatus: { uid1: false, uid2: true }

    messages/
      {messageId}/
        senderId: 'uid1'
        content: 'Hello!'   or  'gs://bucket/images/...' for images
        type: 'text'        or  'image'
        status: 'read'
        timestamp: Timestamp

users/
  {uid}/
    displayName: 'Harsha'
    photoUrl: '...'
    isOnline: true
    lastSeen: Timestamp
    fcmToken: 'device_token_here'
```

---

## Data Layer — Real-Time Streams

```dart
// lib/features/chat/data/datasources/chat_remote_datasource.dart

abstract interface class ChatRemoteDatasource {
  Stream<List<ConversationModel>> watchConversations(String userId);
  Stream<List<MessageModel>> watchMessages(String conversationId);
  Future<void> sendMessage(MessageModel message);
  Future<void> updateMessageStatus(String convId, String messageId, MessageStatus status);
  Future<void> markAllRead(String convId, String userId);
  Future<void> updateTypingStatus(String convId, String userId, bool isTyping);
  Future<void> updateOnlineStatus(String userId, bool isOnline);
  Future<String> getOrCreateConversation(String uid1, String uid2);
}

class ChatFirebaseDatasource implements ChatRemoteDatasource {
  final FirebaseFirestore _db;
  final FirebaseAuth _auth;

  ChatFirebaseDatasource(this._db, this._auth);

  @override
  Stream<List<ConversationModel>> watchConversations(String userId) {
    return _db
        .collection('chats')
        .where('participantIds', arrayContains: userId)
        .orderBy('lastMessage.timestamp', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map(ConversationModel.fromFirestore).toList());
  }

  @override
  Stream<List<MessageModel>> watchMessages(String conversationId) {
    return _db
        .collection('chats/$conversationId/messages')
        .orderBy('timestamp', descending: false)
        .limitToLast(50)  // last 50 messages; paginate for history
        .snapshots()
        .map((snap) => snap.docs.map(MessageModel.fromFirestore).toList());
  }

  @override
  Future<void> sendMessage(MessageModel message) async {
    final convRef = _db.collection('chats').doc(message.conversationId);
    final msgRef = convRef.collection('messages').doc(message.id);

    // Batch write: message + conversation update (atomic)
    final batch = _db.batch();

    batch.set(msgRef, message.toFirestore());

    batch.update(convRef, {
      'lastMessage': {
        'content': message.type == MessageType.text ? message.content : '📷 Photo',
        'senderId': message.senderId,
        'timestamp': FieldValue.serverTimestamp(),
        'type': message.type.name,
      },
      // Increment unread count for all other participants
      'unreadCounts.${_otherParticipantId(message)}': FieldValue.increment(1),
    });

    await batch.commit();

    // Deliver status update after Firestore write
    await msgRef.update({'status': MessageStatus.delivered.name});
  }

  @override
  Future<void> markAllRead(String convId, String userId) async {
    // Get all unread messages (status != read)
    final unread = await _db
        .collection('chats/$convId/messages')
        .where('status', isNotEqualTo: MessageStatus.read.name)
        .where('senderId', isNotEqualTo: userId)  // only others' messages
        .get();

    final batch = _db.batch();
    for (final doc in unread.docs) {
      batch.update(doc.reference, {'status': MessageStatus.read.name});
    }
    // Reset my unread count
    batch.update(_db.doc('chats/$convId'), {'unreadCounts.$userId': 0});
    await batch.commit();
  }

  @override
  Future<void> updateTypingStatus(String convId, String userId, bool isTyping) {
    return _db.doc('chats/$convId').update({'typingStatus.$userId': isTyping});
  }

  @override
  Future<String> getOrCreateConversation(String uid1, String uid2) async {
    final sorted = [uid1, uid2]..sort();
    final convId = '${sorted[0]}_${sorted[1]}';  // deterministic ID
    final ref = _db.doc('chats/$convId');
    final snap = await ref.get();

    if (!snap.exists) {
      // Fetch user data for both participants
      final users = await Future.wait([
        _db.doc('users/$uid1').get(),
        _db.doc('users/$uid2').get(),
      ]);

      await ref.set({
        'participantIds': sorted,
        'participants': {
          uid1: users[0].data(),
          uid2: users[1].data(),
        },
        'unreadCounts': {uid1: 0, uid2: 0},
        'typingStatus': {uid1: false, uid2: false},
        'createdAt': FieldValue.serverTimestamp(),
      });
    }

    return convId;
  }

  String _otherParticipantId(MessageModel message) {
    // Get participant IDs from the conversation document
    // In practice, pass it through the model
    return '';  // simplified for this example
  }
}
```

---

## Firebase Storage — Image Upload With Progress

```dart
// lib/features/chat/data/datasources/storage_datasource.dart

class StorageDatasource {
  final FirebaseStorage _storage;
  const StorageDatasource(this._storage);

  // Returns a Stream of progress values (0.0–1.0) then the download URL
  Stream<StorageUploadState> uploadChatImage({
    required String conversationId,
    required String messageId,
    required File imageFile,
  }) {
    final controller = StreamController<StorageUploadState>();

    final path = 'chats/$conversationId/$messageId.jpg';
    final ref = _storage.ref().child(path);

    final uploadTask = ref.putFile(
      imageFile,
      SettableMetadata(contentType: 'image/jpeg'),
    );

    uploadTask.snapshotEvents.listen(
      (snapshot) {
        final progress = snapshot.bytesTransferred / snapshot.totalBytes;
        controller.add(StorageUploadState.progress(progress));
      },
      onError: (error) {
        controller.add(StorageUploadState.error(error.toString()));
        controller.close();
      },
    );

    uploadTask.whenComplete(() async {
      try {
        final url = await ref.getDownloadURL();
        controller.add(StorageUploadState.complete(url));
      } catch (e) {
        controller.add(StorageUploadState.error(e.toString()));
      }
      controller.close();
    });

    return controller.stream;
  }
}

sealed class StorageUploadState {}
class UploadProgress extends StorageUploadState { final double fraction; UploadProgress(this.fraction); }
class UploadComplete extends StorageUploadState { final String downloadUrl; UploadComplete(this.downloadUrl); }
class UploadError extends StorageUploadState { final String message; UploadError(this.message); }

extension StorageUploadStateX on StorageUploadState {
  static StorageUploadState progress(double f) => UploadProgress(f);
  static StorageUploadState complete(String url) => UploadComplete(url);
  static StorageUploadState error(String msg) => UploadError(msg);
}
```

---

## FCM — Push Notifications

### The Invisible Machinery — How a Push Notification Travels from Phone A to Phone B

When Harsha sends a chat message and Priya's phone buzzes with a notification — even though Priya's app is closed — what physically happened? Walk through every step.

---

**The problem push notifications solve:**

A phone's battery lasts all day because the CPU sleeps most of the time. Sleeping means no code runs. No code = no WebSocket connections = no real-time anything. If Priya's phone has to maintain open connections to every app she uses, the battery dies in hours.

The solution: **one persistent connection per phone, owned by the OS vendor.** Apple maintains a single long-lived TCP connection from every iPhone to **APNs (Apple Push Notification service)**. Google maintains a single long-lived TCP connection from every Android phone to **FCM (Firebase Cloud Messaging)**. These connections use almost no battery because they sit idle 99.9% of the time — they're just waiting for a signal.

**The journey of one notification:**

```
STEP 1 — Harsha sends a message in the chat app

Harsha's Flutter app → dio.post('/messages', data: message)
                       ↓
            Your backend server receives it
            Stores message in database
                       ↓
            Your server sends an HTTP request to FCM:
            POST https://fcm.googleapis.com/v1/projects/yourapp/messages:send
            Authorization: Bearer [your Firebase service account token]
            Body: {
              "token": "dGhlIGZCcmVhbHMgY...",  ← Priya's device token
              "notification": {
                "title": "Harsha",
                "body": "Hey, did you see the match last night?"
              },
              "data": {
                "type": "chat_message",
                "conversationId": "conv_xyz",
                "messageId": "msg_abc"
              }
            }


STEP 2 — FCM routes to Priya's device

Google's FCM servers receive the request
They look up Priya's device token in their database
They find: "this token belongs to a Google account connected to Android device with IMEI xxx"
They know which FCM connection is currently active for that device


STEP 3 — The persistent connection carries the notification

[Priya's Android phone]
   OS kernel maintains a dormant TCP connection to Google's servers
   99.9% of the time this connection is completely idle — carrying nothing

   FCM server sends a tiny message down this connection:
   "Wake up — there's a notification for app com.yourapp.chat"

   The OS kernel wakes from idle (consumes a burst of battery for ~100ms)
   Delivers the notification payload to the OS notification system


STEP 4 — Android / iOS handles it without your app

The OS reads the notification payload
Displays a system notification: "Harsha: Hey, did you see the match last night?"
Shows the notification on lock screen
Plays the notification sound
Updates the badge number on the app icon

YOUR APP'S CODE HAS NOT RUN YET.
The OS handled everything up to this point.


STEP 5 — Priya taps the notification

OS launches your Flutter app (or brings it to foreground)
Passes the notification payload to your app's notification handler
Your app navigates to the right conversation screen
```

---

**The two different notification systems: FCM vs APNs**

Apple and Google each run their own push notification infrastructure. They interoperate through a clear division:

| | Android (FCM) | iOS (APNs) |
|---|---|---|
| OS vendor | Google | Apple |
| Endpoint | `fcm.googleapis.com` | `api.push.apple.com` |
| Auth | Service account JSON key | p8 auth key or p12 cert |
| Delivery guarantee | "Best effort" (usually < 1 second) | "Best effort" (usually < 1 second) |
| Long-lived connection | Google services process | iOS system daemon (`apsd`) |

Firebase Cloud Messaging (FCM) acts as a gateway — you send ONE HTTP request to FCM, and FCM handles routing to either an Android device (direct FCM) or iOS device (FCM calls APNs on your behalf). This is why Flutter apps only need FCM, not separate FCM + APNs integrations.

---

**Device tokens — the address of a specific app on a specific device**

```dart
// This is the "address" FCM uses to find Priya's phone
final String? token = await FirebaseMessaging.instance.getToken();
// e.g. "dGhlIGZCcmVhbHMgY29kZXMgdGhlIHdvcmxk..."
```

The token is a ~200-character string that uniquely identifies:
- This specific app (your bundle ID / package name)
- On this specific device
- With this user's Google account (on Android)

Your backend stores this token in your database when the user logs in. When sending a notification to Priya, you look up Priya's current token and send to that.

**Why tokens change:**
- User uninstalls and reinstalls the app → new token
- User clears app data → new token
- User switches devices → new token on new device, old token becomes invalid (FCM returns `404` when you try to send to it)
- Periodically refreshed by FCM for security

**This is why production apps listen for token refresh:**
```dart
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
  // Update the token in your backend database
  userRepository.updateFcmToken(userId, newToken);
});
```
If you don't handle token refresh, users who refreshed their token stop receiving notifications silently.

---

**What "data-only" vs "notification" messages mean**

FCM supports two types of payloads:

```
Notification message:
  OS displays the notification automatically (title, body, icon)
  When user taps → opens your app
  Works even when app is killed
  You have no control over display format

Data-only message:
  No automatic OS notification displayed
  YOUR app code handles it (onBackgroundMessage callback runs)
  Works when app is killed (spawns a background isolate briefly)
  You control what happens with the data
  Use case: silent sync, badge count update, refresh a cache

Combined (most chat apps):
  Both notification payload (OS shows banner) + data payload (your code gets context)
  When user taps the banner → your code uses data payload to navigate to correct screen
```

---

**Why Cloud Functions send FCM, not your Flutter app directly**

You might think: when Harsha sends a message, Harsha's Flutter app could call the FCM API directly to notify Priya. This is wrong for two reasons:

1. **Security:** The FCM server key is a credential that lets anyone send notifications to anyone in your app. Embedding it in the Flutter app means every user who decompiles your app gets that key — they could spam all your users with fake notifications.

2. **Logic:** Your backend needs to know WHICH users to notify (Priya is in the conversation), what message to send, and whether to increment unread counts. This is business logic that belongs on the server.

The correct architecture:
```
Flutter app → Write message to Firestore
Firestore → Triggers Cloud Function (serverless backend)
Cloud Function → Queries who's in the conversation
Cloud Function → Looks up their FCM tokens from database
Cloud Function → Calls FCM API with server key (safe, never leaves the server)
FCM → Delivers notification to each recipient's device
```

---

```dart
// lib/core/notifications/notification_service.dart

class NotificationService {
  static final _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // Request permission (iOS)
    await _messaging.requestPermission(
      alert: true, badge: true, sound: true,
    );

    // Initialize local notifications (for foreground display)
    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Handle foreground messages — FCM doesn't show them automatically
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background/terminated message tap
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);

    // Token refresh — update Firestore when token changes
    _messaging.onTokenRefresh.listen(_saveToken);
  }

  static Future<void> _saveToken(String token) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    await FirebaseFirestore.instance.doc('users/$uid').update({'fcmToken': token});
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'chat_channel',
          'Chat Messages',
          importance: Importance.high,
          priority: Priority.high,
          showWhen: true,
        ),
        iOS: DarwinNotificationDetails(presentAlert: true, presentBadge: true, presentSound: true),
      ),
      payload: message.data['conversationId'],
    );
  }

  static void _handleMessageTap(RemoteMessage message) {
    final convId = message.data['conversationId'];
    if (convId != null) {
      // Navigate to the conversation
      NavigationService.navigateTo('/chat/$convId');
    }
  }

  static void _onNotificationTap(NotificationResponse response) {
    final convId = response.payload;
    if (convId != null) {
      NavigationService.navigateTo('/chat/$convId');
    }
  }
}
```

```
// Cloud Functions (functions/index.js) — send FCM when message arrives
exports.onNewMessage = functions.firestore
  .document('chats/{convId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const convSnap = await admin.firestore().doc(`chats/${context.params.convId}`).get();
    const conversation = convSnap.data();

    // Find the recipient's FCM token
    const recipientId = conversation.participantIds.find(id => id !== message.senderId);
    const recipientSnap = await admin.firestore().doc(`users/${recipientId}`).get();
    const fcmToken = recipientSnap.data()?.fcmToken;

    if (!fcmToken) return null;

    const senderName = conversation.participants[message.senderId]?.displayName || 'Someone';

    return admin.messaging().send({
      token: fcmToken,
      notification: {
        title: senderName,
        body: message.type === 'text' ? message.content : '📷 Photo',
      },
      data: { conversationId: context.params.convId },
      android: { priority: 'high' },
      apns: { payload: { aps: { 'content-available': 1 } } },
    });
  });
```

---

## BLoC Layer — Messages

```dart
// Events
sealed class MessagesEvent {}
class LoadMessagesEvent extends MessagesEvent { final String conversationId; }
class SendTextMessageEvent extends MessagesEvent { final String conversationId; final String text; }
class SendImageMessageEvent extends MessagesEvent { final String conversationId; final File imageFile; }
class MarkReadEvent extends MessagesEvent { final String conversationId; }
class TypingStartedEvent extends MessagesEvent { final String conversationId; }
class TypingStoppedEvent extends MessagesEvent { final String conversationId; }

// States
sealed class MessagesState {}
class MessagesInitial extends MessagesState {}
class MessagesLoaded extends MessagesState {
  final List<Message> messages;
  final bool isSending;
  const MessagesLoaded({required this.messages, this.isSending = false});
  MessagesLoaded copyWith({List<Message>? messages, bool? isSending}) =>
      MessagesLoaded(messages: messages ?? this.messages, isSending: isSending ?? this.isSending);
}
class MessagesError extends MessagesState { final String message; }

class MessagesBloc extends Bloc<MessagesEvent, MessagesState> {
  final GetMessages _getMessages;
  final SendMessage _sendMessage;
  final SendImageMessage _sendImageMessage;
  final MarkMessagesRead _markRead;
  final UpdateTypingStatus _updateTyping;

  StreamSubscription? _messagesSub;

  MessagesBloc({
    required GetMessages getMessages,
    required SendMessage sendMessage,
    required SendImageMessage sendImageMessage,
    required MarkMessagesRead markRead,
    required UpdateTypingStatus updateTyping,
  })  : _getMessages = getMessages,
        _sendMessage = sendMessage,
        _sendImageMessage = sendImageMessage,
        _markRead = markRead,
        _updateTyping = updateTyping,
        super(MessagesInitial()) {
    on<LoadMessagesEvent>(_onLoad);
    on<SendTextMessageEvent>(_onSendText);
    on<SendImageMessageEvent>(_onSendImage);
    on<MarkReadEvent>(_onMarkRead);
    on<TypingStartedEvent>((e, _) => _updateTyping(TypingParams(conversationId: e.conversationId, isTyping: true)));
    on<TypingStoppedEvent>((e, _) => _updateTyping(TypingParams(conversationId: e.conversationId, isTyping: false)));
  }

  Future<void> _onLoad(LoadMessagesEvent event, Emitter<MessagesState> emit) async {
    await emit.forEach<List<Message>>(
      _getMessages(GetMessagesParams(conversationId: event.conversationId)),
      onData: (messages) => MessagesLoaded(messages: messages),
      onError: (e, _) => MessagesError(message: e.toString()),
    );
    // emit.forEach keeps the BLoC subscribed to the stream
    // Emits a new state whenever the stream emits new messages
    // Cleans up the stream subscription when the BLoC closes
  }

  Future<void> _onSendText(SendTextMessageEvent event, Emitter<MessagesState> emit) async {
    if (state is! MessagesLoaded) return;
    final current = state as MessagesLoaded;

    // Optimistic: show message immediately with 'sending' status
    final optimisticMsg = Message(
      id: const Uuid().v4(),
      conversationId: event.conversationId,
      senderId: _currentUserId,
      content: event.text,
      type: MessageType.text,
      status: MessageStatus.sending,
      timestamp: DateTime.now(),
    );
    emit(current.copyWith(messages: [...current.messages, optimisticMsg]));

    await _sendMessage(SendMessageParams(
      conversationId: event.conversationId,
      content: event.text,
      type: MessageType.text,
    ));
    // The stream from _onLoad will update the message to 'delivered' status
    // No need to manually update state here
  }

  Future<void> _onSendImage(SendImageMessageEvent event, Emitter<MessagesState> emit) async {
    if (state is! MessagesLoaded) return;
    final current = state as MessagesLoaded;
    final tempId = const Uuid().v4();

    // Show local preview with progress = 0
    final localMsg = Message(
      id: tempId,
      conversationId: event.conversationId,
      senderId: _currentUserId,
      content: '',
      type: MessageType.image,
      status: MessageStatus.sending,
      timestamp: DateTime.now(),
      localPath: event.imageFile.path,
      uploadProgress: 0.0,
    );
    emit(current.copyWith(messages: [...current.messages, localMsg]));

    // Upload with progress
    await for (final uploadState in _sendImageMessage(SendImageParams(
      conversationId: event.conversationId,
      imageFile: event.imageFile,
      messageId: tempId,
    ))) {
      if (state is! MessagesLoaded) break;
      final curr = state as MessagesLoaded;

      switch (uploadState) {
        case UploadProgress(:final fraction):
          final updated = curr.messages.map((m) =>
              m.id == tempId ? m.copyWith(uploadProgress: fraction) : m).toList();
          emit(curr.copyWith(messages: updated));
        case UploadComplete(:final downloadUrl):
          // Replace local message with final URL message
          final updated = curr.messages.where((m) => m.id != tempId).toList();
          emit(curr.copyWith(messages: updated));
          // The Firestore stream will add the real message
        case UploadError():
          final updated = curr.messages.where((m) => m.id != tempId).toList();
          emit(curr.copyWith(messages: updated));
      }
    }
  }

  String get _currentUserId => FirebaseAuth.instance.currentUser!.uid;

  @override
  Future<void> close() {
    _messagesSub?.cancel();
    return super.close();
  }
}
```

---

## Chat UI

```dart
// lib/features/chat/presentation/screens/chat_screen.dart

class ChatScreen extends StatefulWidget {
  final String conversationId;
  final ChatUser otherUser;
  const ChatScreen({super.key, required this.conversationId, required this.otherUser});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with WidgetsBindingObserver {
  final _scrollController = ScrollController();
  final _inputController = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _typingTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _inputController.addListener(_onTyping);
  }

  void _onTyping() {
    if (_inputController.text.isNotEmpty) {
      context.read<MessagesBloc>().add(TypingStartedEvent(conversationId: widget.conversationId));
      _typingTimer?.cancel();
      _typingTimer = Timer(const Duration(seconds: 2), () {
        if (mounted) {
          context.read<MessagesBloc>().add(TypingStoppedEvent(conversationId: widget.conversationId));
        }
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Update online status when app is backgrounded
    if (state == AppLifecycleState.paused) {
      _setOffline();
    } else if (state == AppLifecycleState.resumed) {
      _setOnline();
    }
  }

  void _setOnline() => sl<ChatRepository>().updateOnlineStatus(true);
  void _setOffline() => sl<ChatRepository>().updateOnlineStatus(false);

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scrollController.dispose();
    _inputController.dispose();
    _focusNode.dispose();
    _typingTimer?.cancel();
    _setOffline();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<MessagesBloc>()
        ..add(LoadMessagesEvent(conversationId: widget.conversationId))
        ..add(MarkReadEvent(conversationId: widget.conversationId)),
      child: Scaffold(
        appBar: _ChatAppBar(otherUser: widget.otherUser),
        body: Column(
          children: [
            // Message list
            Expanded(
              child: BlocBuilder<MessagesBloc, MessagesState>(
                builder: (context, state) {
                  if (state is! MessagesLoaded) return const LoadingView();

                  // Auto-scroll to bottom when new messages arrive
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (_scrollController.hasClients) {
                      _scrollController.animateTo(
                        _scrollController.position.maxScrollExtent,
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOut,
                      );
                    }
                  });

                  return ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: state.messages.length,
                    itemBuilder: (context, index) {
                      final message = state.messages[index];
                      final isMe = message.senderId == FirebaseAuth.instance.currentUser!.uid;
                      return MessageBubble(message: message, isMe: isMe)
                          .animate()
                          .fadeIn(duration: 200.ms)
                          .slideY(begin: 0.1, end: 0);
                    },
                  );
                },
              ),
            ),

            // Typing indicator
            TypingIndicator(conversationId: widget.conversationId, otherUser: widget.otherUser),

            // Input bar
            _ChatInputBar(
              controller: _inputController,
              focusNode: _focusNode,
              conversationId: widget.conversationId,
            ),
          ],
        ),
      ),
    );
  }
}

// Message bubble
class MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMe;

  const MessageBubble({super.key, required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 2),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
        decoration: BoxDecoration(
          color: isMe
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isMe ? 18 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 18),
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (message.type == MessageType.text)
              Text(
                message.content,
                style: TextStyle(color: isMe ? Colors.white : null),
              )
            else
              ImageMessageWidget(message: message),

            const SizedBox(height: 2),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  DateFormat('HH:mm').format(message.timestamp),
                  style: TextStyle(
                    fontSize: 10,
                    color: isMe ? Colors.white70 : Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  _StatusIcon(status: message.status),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusIcon extends StatelessWidget {
  final MessageStatus status;
  const _StatusIcon({required this.status});

  @override
  Widget build(BuildContext context) {
    return switch (status) {
      MessageStatus.sending => const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.white70)),
      MessageStatus.sent => const Icon(Icons.check, size: 12, color: Colors.white70),
      MessageStatus.delivered => const Icon(Icons.done_all, size: 12, color: Colors.white70),
      MessageStatus.read => const Icon(Icons.done_all, size: 12, color: Colors.lightBlueAccent),
    };
  }
}
```

---

## Typing Indicator

```dart
class TypingIndicator extends ConsumerWidget {
  final String conversationId;
  final ChatUser otherUser;

  const TypingIndicator({super.key, required this.conversationId, required this.otherUser});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Stream typing status from Firestore
    return StreamBuilder<bool>(
      stream: sl<ChatRepository>().watchTypingStatus(conversationId, otherUser.id),
      builder: (context, snapshot) {
        final isTyping = snapshot.data ?? false;

        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: isTyping
              ? Padding(
                  key: const ValueKey('typing'),
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                  child: Row(
                    children: [
                      Text(
                        '${otherUser.displayName} is typing',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(width: 4),
                      _ThreeDotsAnimation(),
                    ],
                  ),
                )
              : const SizedBox(key: ValueKey('not_typing'), height: 8),
        );
      },
    );
  }
}

// Animated bouncing dots
class _ThreeDotsAnimation extends StatefulWidget {
  @override
  State<_ThreeDotsAnimation> createState() => _ThreeDotsAnimationState();
}

class _ThreeDotsAnimationState extends State<_ThreeDotsAnimation>
    with TickerProviderStateMixin {
  late final List<AnimationController> _controllers;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(3, (i) {
      final c = AnimationController(vsync: this, duration: 400.ms);
      Future.delayed(Duration(milliseconds: i * 133), () {
        if (mounted) c.repeat(reverse: true);
      });
      return c;
    });
  }

  @override
  void dispose() {
    for (final c in _controllers) c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: _controllers.map((c) {
        return AnimatedBuilder(
          animation: c,
          builder: (_, __) => Transform.translate(
            offset: Offset(0, -3 * c.value),
            child: Container(
              width: 4, height: 4, margin: const EdgeInsets.symmetric(horizontal: 1),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                shape: BoxShape.circle,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
```

---

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isParticipant(convId) {
      return isAuthenticated() &&
             request.auth.uid in get(/databases/$(db)/documents/chats/$(convId)).data.participantIds;
    }

    match /chats/{convId} {
      allow read: if isParticipant(convId);
      allow create: if isAuthenticated()
        && request.auth.uid in request.resource.data.participantIds;
      allow update: if isParticipant(convId);

      match /messages/{msgId} {
        allow read, create: if isParticipant(convId);
        allow update: if isParticipant(convId)
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status']);
          // Only allow updating the 'status' field — not content
      }
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId;
    }
  }
}
```

---

## What You Built in Phase 6

| Concept | Where applied |
|--|--|
| Unit tests | Use cases, entity properties |
| Widget tests | `MessageBubble`, `ExpenseTile`, form validation |
| BLoC tests | `MessagesBloc` event→state transitions |
| Golden tests | `MessageBubble` visual contract |
| Integration tests | Full message send flow |
| Performance | `const` constructors, `ListView.builder`, `RepaintBoundary` |
| Memory safety | `dispose()` in `_ChatScreenState`, `WidgetsBindingObserver` |
| CI/CD | GitHub Actions: lint → test → build → distribute |
| Flavors | Dev / staging / prod environments |
| FCM | Push notifications via Cloud Functions |
| Real-time streams | `emit.forEach` in `MessagesBloc` |
| Firebase Storage | Image upload with progress |
| Typing indicators | Firestore real-time + `AnimatedSwitcher` |

---

## Enterprise Chat Architecture — Production Patterns

> 🏢 **Enterprise Reality:**
> *"A toy chat app stores messages in Firestore and calls it done. A production chat app handles message delivery guarantees, read receipts at scale, presence systems, message queuing, media CDN, abuse detection, and end-to-end encryption."*

### Message Delivery Guarantees

```dart
// Message lifecycle: drafted → sending → sent → delivered → read
enum MessageDeliveryStatus { drafted, sending, sent, delivered, read, failed }

// Optimistic message sending with retry queue
class MessageQueue {
  final Queue<PendingMessage> _queue = Queue();
  Timer? _retryTimer;

  Future<void> enqueue(Message message) async {
    final pending = PendingMessage(message: message, attempts: 0, maxAttempts: 3);
    _queue.add(pending);
    await _processQueue();
  }

  Future<void> _processQueue() async {
    while (_queue.isNotEmpty) {
      final pending = _queue.first;
      try {
        await _sendToServer(pending.message);
        _queue.removeFirst();
        _updateStatus(pending.message.id, MessageDeliveryStatus.sent);
      } catch (e) {
        pending.attempts++;
        if (pending.attempts >= pending.maxAttempts) {
          _queue.removeFirst();
          _updateStatus(pending.message.id, MessageDeliveryStatus.failed);
        } else {
          // Exponential backoff
          final delay = Duration(seconds: math.pow(2, pending.attempts).toInt());
          _retryTimer = Timer(delay, _processQueue);
          return;
        }
      }
    }
  }
}
```

### Read Receipts at Scale

```dart
// Batched read receipts — don't write to Firestore for every message individually
class ReadReceiptService {
  final Set<String> _pendingReadReceipts = {};
  Timer? _batchTimer;

  void markAsRead(String messageId) {
    _pendingReadReceipts.add(messageId);
    _batchTimer?.cancel();
    _batchTimer = Timer(const Duration(seconds: 2), _flushBatch);
  }

  Future<void> _flushBatch() async {
    if (_pendingReadReceipts.isEmpty) return;
    final batch = FirebaseFirestore.instance.batch();
    for (final id in _pendingReadReceipts) {
      batch.update(
        _messagesRef.doc(id),
        {'readBy.${currentUserId}': FieldValue.serverTimestamp()},
      );
    }
    await batch.commit();
    _pendingReadReceipts.clear();
  }
}
```

### Media CDN + Thumbnail Generation

```dart
// Never send full-resolution images in chat — generate thumbnails
// Use Firebase Extensions: "Resize Images" — auto-generates thumbnails on upload
// Original: gs://bucket/chat/img_001.jpg (3MB)
// Generated: gs://bucket/chat/img_001_200x200.jpg (15KB)
// Generated: gs://bucket/chat/img_001_800x800.jpg (80KB)

class ChatMediaService {
  Future<ChatImage> uploadAndGetThumbnail(File imageFile) async {
    final originalPath = 'chat/${uuid.v4()}.jpg';
    await _storage.ref(originalPath).putFile(imageFile);

    // Wait for Cloud Function to generate thumbnails (fire-and-forget)
    // Show the local file immediately as a preview
    return ChatImage(
      originalUrl: await _storage.ref(originalPath).getDownloadURL(),
      thumbnailUrl: null, // populated when thumbnail is ready
      localFile: imageFile,
      width: /* from image_size_getter */,
      height: /* from image_size_getter */,
    );
  }
}
```

---

## Week 27 Verify

1. The user sends a message with no internet. Describe the full lifecycle: what status does the message show, what happens in the queue, and what triggers the retry?
2. `ReadReceiptService` batches read receipts every 2 seconds. Why batch instead of writing immediately? What happens with Firestore billing if 1000 messages are read at once?
3. `MessagesBloc` uses `emit.forEach` with a Firestore stream. What happens if the user opens a conversation with 10,000 messages? How does pagination prevent this?
4. Cloud Functions trigger FCM on new messages. Why not send FCM directly from the client? Give two reasons.
5. `MessageDeliveryStatus` has 6 states: drafted → sending → sent → delivered → read → failed. What event transitions a message from `sent` to `delivered`?
6. The typing indicator uses three `AnimationController`s with staggered delays. Why three controllers instead of one? What does each control?
7. Firestore security rules use `isParticipant(request.auth.uid)`. What would happen without this rule? Write a rule that prevents non-participants from reading messages.
8. Your chat app shows a thumbnail immediately while uploading the full image. What is this pattern called? Where is the full-resolution URL populated?
9. `QueuedInterceptor` is used for the auth token refresh. A chat sends 5 messages in 1 second, all get 401. Without `QueuedInterceptor`, what happens? With it?
10. You need to add end-to-end encryption. Which layer of Clean Architecture does the encryption logic go in (domain, data, or presentation)? Why?

---

## Pre-Launch Checklist — The Shipping Gate

Before you submit to app stores, run through this checklist. Every item exists because real apps have been rejected or pulled for missing it.

### Google Play Store

- [ ] **App signing:** Upload key registered in Google Play Console, signing key managed by Google (Play App Signing)
- [ ] **Target API level:** Must target the current required `targetSdkVersion` (Google enforces this annually — check the current requirement)
- [ ] **64-bit support:** Flutter handles this by default with `flutter build appbundle`, but verify if you have native dependencies
- [ ] **Content rating questionnaire:** Complete the IARC questionnaire in Play Console — without it, your app can be removed
- [ ] **Data safety form:** Declare all data collected, shared, and security practices. If you use Firebase Analytics, Crashlytics, or FCM, you're collecting data — disclose it
- [ ] **Privacy policy URL:** Required if your app collects any personal data. Must be a publicly accessible URL, not a PDF
- [ ] **App screenshots:** At least 2 screenshots per form factor. Recommended: phone (16:9) + 7" tablet + 10" tablet
- [ ] **Store listing:** Short description (80 chars), full description (4000 chars), feature graphic (1024×500)
- [ ] **App category and tags:** Choose carefully — this affects search discoverability
- [ ] **Testing track:** Use Internal Testing → Closed Testing → Open Testing → Production. Never go straight to Production

### Apple App Store

- [ ] **Apple Developer Account:** $99/year enrolled in the Apple Developer Program
- [ ] **App Store Connect metadata:** App name, subtitle (30 chars), promotional text, description, keywords (100 chars)
- [ ] **Screenshots:** Required for 6.7" (iPhone 15 Pro Max) and 5.5" (iPhone 8 Plus) at minimum. iPad if you support it
- [ ] **App preview video:** Optional but strongly recommended — 15-30 second video showing your app in action
- [ ] **Privacy nutrition labels:** Declare data types collected (contact info, usage data, diagnostics, etc.) and whether they're linked to identity
- [ ] **Export compliance:** If your app uses encryption (HTTPS counts), you need to declare it. Most apps select "Yes, but only standard encryption" — this avoids the full export compliance review
- [ ] **App Review guidelines:** Read Apple's [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — common rejection reasons:
  - Crashes or bugs during review
  - Placeholder content or lorem ipsum
  - Login required but no demo account provided
  - Missing purpose string for camera/photos/location permissions
  - App is too similar to a web wrapper (must provide native value)
- [ ] **TestFlight beta:** Always run a TestFlight beta with real users before submitting to App Review

### Privacy Policy

Your privacy policy must cover:

- What data you collect (user email, device info, crash logs, analytics events)
- Why you collect it (authentication, crash reporting, feature improvement)
- Third-party SDKs that collect data (Firebase Analytics, Crashlytics, Sentry, AdMob)
- How long you retain data
- How users can request data deletion (required by GDPR and App Store)
- Contact information

**Rule:** If you use Firebase, you're collecting data. Firebase Analytics collects device info, app usage, and crash data by default. Your privacy policy must disclose this even if you never wrote a single analytics call yourself.

### App Store Optimization (ASO) Basics

- **Title:** Include your primary keyword naturally (e.g., "ExpenseTrack — Budget & Spending Tracker")
- **Subtitle (iOS) / Short Description (Android):** Your second-most important keyword opportunity
- **Keywords (iOS):** 100 characters total, comma-separated, no spaces after commas. Don't repeat words from your title
- **Description:** First 1-3 lines matter most (visible without expanding). Lead with the core value proposition
- **Localization:** If targeting multiple countries, localize at minimum the title, subtitle, and screenshots — even rough translations outperform English-only in non-English markets
- **Category:** Pick the most specific category. "Finance" for expense tracker, not "Utilities"

---

### App Signing — The Single Most Recoverable Mistake

**The horror story:** You ship v1.0, signed with `release.jks` on your laptop. Six months later your laptop dies. You restore from backup but forgot the keystore was in `~/.gradle/` (excluded). You can never publish an update to your app. Your only options: convince every existing user to uninstall and install a new app with a different package ID, losing all reviews, ratings, and install base.

**Android — Play App Signing (use this, always):**

```
You generate an UPLOAD key (kept on your machine)
   ↓
You upload .aab signed with upload key to Play Console
   ↓
Play Console re-signs with the APP key (Google manages this)
   ↓
Users install APK signed with APP key
```

If you lose your upload key: you reset it via Play Console support (your APP key is safe).
If you didn't use Play App Signing and lose your signing key: you cannot publish updates. Ever.

```bash
# Generate upload key (do this ONCE per app, store securely)
keytool -genkey -v -keystore upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# Store this file in:
# 1. Your password manager (with the alias password)
# 2. An encrypted cloud backup
# 3. A second offline location
```

**iOS — App Store Connect signing:**
- Distribution certificate + provisioning profile auto-managed by Xcode
- The actual signing identity lives in your Apple Developer account
- Even if you lose your Mac, you can re-download certificates anytime
- Less risky than Android — but always enable two-factor auth on your Apple Developer account

**Rule:** Set up Play App Signing on day one. Add `upload-keystore.jks` and `key.properties` to your password manager *before* writing any release-mode code.

---

### Privacy Compliance — The Legal Layer

You will be sued or fined if you ignore this. Even small apps.

**GDPR (EU users):**
- Required: privacy policy that lists every data point collected and the legal basis
- Required: a way for users to request all their data ("right to access")
- Required: a way for users to delete their account and data ("right to erasure")
- Penalty: up to €20M or 4% of global revenue, whichever is higher

**CCPA (California users):**
- Required: "Do Not Sell My Personal Information" link if you sell data
- Required: privacy policy with disclosures of categories collected/sold

**COPPA (children under 13 in US):**
- If your app targets children OR you know children use it, you must:
  - Obtain verifiable parental consent before collecting any personal info
  - Not use ad networks that collect behavioral data on children
  - Apple/Google may pull you for non-compliance
- The "Made for Kids" label has strict requirements

**Apple's App Tracking Transparency (ATT):**
- Required since iOS 14.5 if you track users across apps/websites you don't own
- Must show the system prompt before calling any tracking API
- If user denies: IDFA returns zeros, ad networks return generic targeting
- Plan for this: many apps lost 60%+ of ad revenue when ATT launched

```dart
// Always check ATT status before tracking
import 'package:app_tracking_transparency/app_tracking_transparency.dart';

final status = await AppTrackingTransparency.trackingAuthorizationStatus;
if (status == TrackingStatus.notDetermined) {
  await AppTrackingTransparency.requestTrackingAuthorization();
}
final canTrack = (await AppTrackingTransparency.trackingAuthorizationStatus)
    == TrackingStatus.authorized;
```

**Privacy Manifest (required by Apple since 2024):**
- New `PrivacyInfo.xcprivacy` file required in every iOS app
- Declares which APIs you use (UserDefaults, file timestamps, disk space, system boot time)
- Required for many common SDKs (Firebase, Google Sign-In)
- Without it, your app is rejected at review

---

### Deferred Deep Linking — Attribution and First-Run UX

**The problem:** User clicks an ad → goes to App Store → installs app → opens it for the first time. How does your app know which ad they clicked?

**The solution — deferred deep linking:**

```dart
// Using AppsFlyer, Branch.io, or Firebase Dynamic Links
// On first launch, check for a deferred deep link
FirebaseDynamicLinks.instance.getInitialLink().then((data) {
  if (data != null) {
    final referralCode = data.link.queryParameters['ref'];
    // Track install attribution: "User came from Instagram ad #1234"
    _analytics.logInstallSource(data.link);
    // Apply special first-run flow
    _navigateToReferralBonus(referralCode);
  }
});
```

**Why it matters:**
- Marketing teams need to know which channels actually drive installs (not just clicks)
- "First-time user" flows can be personalized based on referrer
- Some apps offer signup bonuses tied to referral codes

**Note:** Firebase Dynamic Links is being deprecated (August 2025). Migration paths: Branch.io, AppsFlyer, or build your own with universal links + a fallback web page.

---

### A/B Testing Your Store Listing

You can ship the best app ever and still get few installs because your screenshots don't convert. Both stores let you test:

**Google Play — Store Listing Experiments:**
- Test up to 3 variants against control
- Variables: app icon, screenshots, description, feature graphic
- Minimum 7-day run, statistical significance shown
- Typical lift from a good test: 5-20% install conversion

**App Store — Product Page Optimization:**
- Up to 3 alternate product pages
- Test different screenshots, app previews, promotional text
- Traffic split: 1-99% per variant
- Results available in App Analytics

**What to test (in order of typical impact):**
1. First screenshot (highest impact — most users never scroll)
2. App icon
3. Subtitle / short description
4. App preview video vs static screenshots
5. Description first paragraph

---

### Versioning Strategy — Semver For Apps

```yaml
# pubspec.yaml
version: 2.4.1+247
#        │ │ │  │
#        │ │ │  └─ Build number (must increment every store upload)
#        │ │ └─── Patch: bug fixes only, no new features (2.4.0 → 2.4.1)
#        │ └───── Minor: new features, backward compatible (2.4.x → 2.5.0)
#        └─────── Major: breaking changes, redesigns, account migrations (2.x.x → 3.0.0)
```

**Build number rules:**
- Strictly monotonic per platform (Apple and Google enforce this)
- Common convention: use CI build number, or timestamp like `YYYYMMDDHH`
- Never decrement, never reuse

**Release notes culture:**
```
GOOD:
"Faster message sending (50% improvement)
Fixed: typing indicator stuck after backgrounding
Added: pull-to-refresh on conversations"

BAD:
"Bug fixes and performance improvements"
```

Users actually read release notes when deciding whether to update. Specific notes drive higher update adoption, which means fewer users running old buggy versions you can't easily debug.

---

### Phased Rollout — How To Not Brick Your App For Everyone

**Never ship to 100% on day one.** Even with great QA, production has edge cases your tests don't cover.

**Google Play — Staged Rollout:**
- Day 1: 5% of users
- Day 3 (if no crash spike): 20%
- Day 5: 50%
- Day 7: 100%
- If crashes spike at any stage: halt rollout, fix, push as new version (you can't "unstage" a release)

**Apple App Store — Phased Release for Automatic Updates:**
- Day 1: 1%
- Day 2: 2%
- Day 3: 5%
- Day 4: 10%
- Day 5: 20%
- Day 6: 50%
- Day 7: 100%
- Users who manually update get the new version immediately regardless

**What to watch during rollout:**
- Crash-free rate (target: ≥ 99.5%)
- ANR rate Android (target: < 0.5%)
- Performance regressions (cold start time, screen render times)
- API error rates on your backend
- App Store / Play Store reviews mentioning the new version

**Halt criteria — pause rollout immediately if:**
- Crash-free rate drops by more than 0.5 percentage points
- A single crash affects > 1% of sessions
- ANR rate doubles
- Reviews show consistent bug reports for a new behavior

---

### First 24 Hours — Post-Launch Monitoring

You shipped. Here's your shift schedule for the next 24 hours.

**T+0 to T+1 hour:**
- Watch Crashlytics dashboard live
- Check Sentry alerts firing
- Monitor backend error rates (5xx percentage)
- Test the install flow on a fresh device yourself
- Verify push notifications still work

**T+1 to T+6 hours:**
- Check crash rate by version (`crashes_in_v2.4.1 / sessions_in_v2.4.1`)
- Sample reviews — are users hitting unexpected issues?
- Verify analytics events are flowing (no schema mismatches)
- Check key conversion funnels haven't regressed

**T+6 to T+24 hours:**
- Compare engagement metrics to previous version baseline
- Review support tickets for new patterns
- Verify deferred deep linking attribution is working
- If staged rollout: review metrics before advancing to next stage

**The 1% rule:** If a new bug affects 1% of users and you have 100K users, that's 1000 angry customers. Always have a hotfix path ready to ship within 24 hours.

---

### Hotfix Process — When To Ship, How Fast, What To Skip

**Severity tiers and response:**

| Severity | Example | Response Time | Process |
|---|---|---|---|
| P0 — Critical | App crashes on launch | < 2 hours | Skip code review, skip QA, hotfix branch directly to release |
| P1 — High | Core feature broken (login, sync) | < 24 hours | Code review, smoke test, expedited rollout |
| P2 — Medium | Edge case bug affecting < 5% | Next sprint | Normal release cycle |
| P3 — Low | Cosmetic, rare conditions | Next minor release | Normal release cycle |

**The expedited path:**
1. Branch from the production tag, not from `main` (avoid pulling in untested changes)
2. Cherry-pick the fix
3. Bump patch version (2.4.1 → 2.4.2)
4. Build → upload → submit
5. Apple: request expedited review (24-48h vs normal 1-3d). Use this sparingly — overuse and Apple notices
6. Google: no expedited process needed (review is faster, typically hours)
7. After 24h: confirm the fix is working in production metrics

**What NOT to do:**
- Don't combine the hotfix with other changes "while you're at it" — that's how you ship two bugs
- Don't skip writing a regression test for the bug you fixed
- Don't forget to merge the hotfix branch back into `main`

---

### Post-Launch Operating Checklist

**Daily (first week):**
- [ ] Review crash dashboard (Crashlytics + Sentry)
- [ ] Check P0/P1 support tickets
- [ ] Monitor App Store / Play Store reviews

**Weekly (first month):**
- [ ] Review key metrics (DAU, retention, conversion)
- [ ] Triage new bugs into next sprint
- [ ] Update CHANGELOG with shipped fixes

**Monthly (ongoing):**
- [ ] Review analytics for declining funnels
- [ ] Audit dependencies for security updates
- [ ] Review battery / performance metrics for regressions
- [ ] Check for new platform requirements (Apple/Google policy updates)

**Quarterly:**
- [ ] Bump min/target SDK versions
- [ ] Review and update privacy policy
- [ ] Audit third-party SDKs for new data collection
- [ ] Renew certificates (iOS distribution cert expires yearly)

---

### App Store Rejection Catalog — The Top 20

Apple's review team rejects ~30% of submissions on first attempt. Most rejections fall into the same patterns. This catalog covers the top 20 with the exact fix.

**Guideline 2.1 — Performance & Completeness:**

| Rejection | Fix |
|---|---|
| App crashes during review | Test on the lowest-spec supported device (iPhone SE 2nd gen) with airplane mode toggling. Reviewers test offline first |
| Placeholder content visible (lorem ipsum, "TODO") | Strip all debug strings from release builds. Use `String.fromEnvironment('FLAVOR')` to assert in CI |
| Login required, no demo account provided | Always include `Demo Account: demo@app.com / Password123` in App Review notes |
| Broken links in app | Verify all in-app webview destinations resolve. Use `flutter_url_launcher` with fallback handling |

**Guideline 2.5.x — Software Requirements:**

| Rejection | Fix |
|---|---|
| Uses non-public API | Run `xcrun otool -L Runner.app/Runner` and check for `__Z*Private` symbols. Most often caused by old plugins — update them |
| App calls home / sends data before user consent | Move analytics SDK init AFTER privacy consent dialog. Never auto-collect in `main()` |
| Uses `IDFA` without ATT prompt | If your app links AdSupport.framework, you MUST call `requestTrackingAuthorization`. Don't link the framework if you don't use it |

**Guideline 3.x — Business:**

| Rejection | Fix |
|---|---|
| Sells digital content without In-App Purchase | If your app unlocks features for money, it MUST use IAP. Apple takes 15-30%. No web checkout escapes |
| Subscription terms unclear | Display: title, length, price-per-period, auto-renews, link to ToS/Privacy. All before the user taps Subscribe |
| External payment links | You CANNOT direct users to your website to pay (with very narrow Reader app exceptions). Use IAP |

**Guideline 4.x — Design:**

| Rejection | Fix |
|---|---|
| Web wrapper (just a website in a WebView) | Add native UI value: notifications, offline mode, native widgets, biometrics. A pure webview is a guaranteed rejection |
| Mimics iOS UI poorly | If you build a custom UI that looks like iOS Settings, copy the patterns precisely. Otherwise use Material |
| App doesn't work in landscape (if declared in supported orientations) | Either declare portrait-only in `Info.plist` (`UISupportedInterfaceOrientations`) OR support landscape properly |
| Splash screen lingers too long | Show first content within 2 seconds. Static splash > 1s = bad UX, > 3s = potential rejection |

**Guideline 5.x — Legal:**

| Rejection | Fix |
|---|---|
| Missing privacy policy URL | Must be on App Store Connect AND accessible from within the app (Settings screen) |
| Privacy nutrition labels don't match actual data collection | Auditor cross-references. If you log analytics events with user_id, declare "User ID + linked to identity" |
| Children's app without proper labeling | If targeting children, complete the "Made for Kids" questionnaire AND comply with COPPA AND don't use third-party advertising |
| Missing purpose strings | Every `*UsageDescription` in `Info.plist` must explain WHY in user-friendly terms. "We need camera" → "Take photos to add to your expense receipts" |

**Guideline 1.x — Safety:**

| Rejection | Fix |
|---|---|
| User-generated content without moderation tools | If users can post text/images, you need: (1) Block user, (2) Report content, (3) ToS prohibiting objectionable content, (4) Moderation pipeline (manual or AI) |
| No way to delete account from within the app | Required since June 2022. Must be functional, not just "email us to delete" |

**Process tip:** When rejected, Apple sends specific guideline numbers in the email. Respond within Resolution Center referencing the exact guideline, your fix, and the file/screen where you made the change. Vague replies get re-rejected.

---

### Crash-Free Rate — SLO Methodology

"99.5% crash-free sessions" sounds good. But it hides a lot. Build your SLO (Service Level Objective) properly.

**The naive metric (don't use alone):**
```
crash_free_sessions = (total_sessions - crashed_sessions) / total_sessions
```

**Problems:**
- A user who crashes once and abandons the app counts as 1 crashed session
- A power user with 1000 sessions / day dilutes the metric
- Crashes during onboarding (highest impact) weigh same as crashes in a rarely-used settings screen

**The right metrics — split by:**

1. **Crash-free sessions** (industry standard, baseline)
2. **Crash-free users** (more honest — counts unique people, not sessions)
3. **Crash-free new users** (most critical — first impression determines retention)
4. **Crash rate by critical path** (sign-up, first message, first purchase)

**SLO target structure:**

```
Tier 1 (must-have):       crash_free_users >= 99.5%
Tier 2 (excellent):       crash_free_users >= 99.8%
Tier 3 (industry-leading): crash_free_users >= 99.9%

Critical path SLOs:
  signup_completion_rate >= 95%
  first_message_send_success >= 99%
  payment_completion_rate >= 99.5%
```

**Error budget calculation:**
- If your SLO is 99.5% crash-free over 30 days and you have 100K MAU
- Error budget = 0.5% × 100,000 = 500 users can crash per month
- Burn rate alerts: if you burn 50% of budget in 5 days, page someone immediately

**Tooling:**

```dart
// Set custom keys in Crashlytics for high-signal filtering
FirebaseCrashlytics.instance.setCustomKey('user_tier', user.tier);
FirebaseCrashlytics.instance.setCustomKey('feature_flag_new_checkout', enabled);
FirebaseCrashlytics.instance.setUserIdentifier(user.id);

// Manually report non-fatal errors
try {
  await sendMessage();
} catch (e, stack) {
  await FirebaseCrashlytics.instance.recordError(
    e, stack,
    reason: 'message_send_failure',
    fatal: false,
    information: ['conversation_id: $convId', 'queue_size: $queueSize'],
  );
  rethrow;
}
```

**Rule:** Set an error budget. When you've consumed it, freeze feature work and fix stability. This is how Google SRE manages reliability and it works for apps too.

---

### Customer Support Setup — In-App, Not Email-Only

Support tickets are signal for product. Set up properly from day one or you'll regret it post-launch.

**The minimum viable stack:**

1. **In-app feedback widget** (don't make users hunt for your email)
2. **Crash report linking** (every crash creates a ticket auto-tagged with stack trace + user ID)
3. **Help center / FAQ** (deflects 60-70% of tickets without human involvement)
4. **Status page** (so users know when there's a known issue)

**Implementation pattern:**

```dart
// Feedback widget — accessible from every screen via shake or settings
class FeedbackWidget extends StatelessWidget {
  Future<void> _submit(String message, BuildContext context) async {
    // Capture context automatically
    final user = await getCurrentUser();
    final attachments = {
      'user_id': user.id,
      'app_version': await PackageInfo.fromPlatform().then((i) => i.version),
      'device': Platform.operatingSystem,
      'os_version': Platform.operatingSystemVersion,
      'last_screen': RouterHistory.lastVisitedRoute,
      'session_id': AnalyticsService.currentSessionId,
      'recent_errors': ErrorLog.lastFive(),  // local error breadcrumbs
    };

    await ZendeskAPI.createTicket(
      subject: 'In-app feedback',
      body: message,
      requesterEmail: user.email,
      customFields: attachments,
    );

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thanks! We\'ll get back to you in 24h.')),
      );
    }
  }
}
```

**Why automatic context capture matters:**
- "App is broken" → useless ticket, hours of back-and-forth
- "App is broken + user_id + app_version + device + last_screen + recent errors" → support can reproduce in 5 minutes

**Crash → ticket pipeline:**

```dart
FirebaseCrashlytics.instance.setCustomKey('contact_user', user.allowsContact);

// In your Cloud Function triggered by new Crashlytics issue:
exports.onNewCrashIssue = functions.crashlytics.issue().onNew(async (issue) => {
  if (issue.affectedUsers > 100) {
    await Zendesk.createIncident({
      title: `New crash affecting ${issue.affectedUsers} users: ${issue.issueTitle}`,
      priority: 'high',
      tags: ['crash', `version:${issue.appInfo.appVersion}`],
    });
    await Slack.postToChannel('#mobile-incidents', issueAlert);
  }
});
```

**Tooling tiers:**

| Stage | Stack |
|---|---|
| MVP (< 10K users) | Email forwarding to founders + in-app mailto: |
| Growth (10K-100K) | Zendesk free + in-app feedback widget + FAQ on Notion |
| Scale (100K+) | Zendesk paid + Intercom (in-app chat) + dedicated support engineer + status page (statuspage.io) |

---

### International Launch Strategy

Shipping to 175 countries on day one is rarely the right call. A staged international rollout reduces support burden and lets you fix locale-specific bugs before they affect everyone.

**Recommended order:**

1. **English-speaking primary market** (US, UK, AU, CA, NZ) — week 1
2. **Western Europe** (DE, FR, ES, IT, NL) — after fixing first wave of bugs
3. **Asia-Pacific** (JP, KR, SG, IN) — after localization tested
4. **Latin America** (BR, MX, AR) — Portuguese/Spanish locales
5. **Rest of world** — final wave

**What you actually need per locale:**
- App name and subtitle in local language (mandatory for App Store)
- Description (machine translation is acceptable for launch, refine later)
- Screenshots with localized text overlays (most impactful)
- Currency / number / date formatting via `intl` package
- Local privacy compliance (e.g., LGPD for Brazil, PIPL for China)

**Country-specific gotchas:**

| Country | Watch For |
|---|---|
| China | Mainland China requires separate "icp" filing; Apple removes apps without it. Google Play not available |
| Japan | Different in-app rating system; certain content types restricted |
| Germany | GDPR enforcement strictest in EU; expect 1-2% of users to request data deletion |
| Brazil | LGPD privacy law requires data protection officer for any app collecting personal data |
| India | Data localization rules for fintech; payment SDKs limited to local providers |

**Rule:** Pick 5 launch countries based on where your users actually are. A "global launch" usually means "I'll deal with locale bugs from 175 countries simultaneously" — don't do that.

---

### Cost Analysis — Hidden Bills To Plan For

Beyond developer time, an app has real cash costs. Plan for these in your runway:

**One-time:**
- Apple Developer Program: $99/year (individual) or $299/year (organization)
- Google Play Developer: $25 one-time
- Code signing certificate (Apple): included in Apple Developer Program
- App icon design + screenshots: $200-2000 if outsourced

**Recurring per month (typical small app, 10K MAU):**

| Service | Cost |
|---|---|
| Firebase (Spark plan free tier covers most until 50K users) | $0 - $500 |
| Sentry (or Crashlytics free) | $0 - $80 |
| Push notifications (FCM free) | $0 |
| Backend hosting (Render, Fly.io, Cloud Run) | $20 - $200 |
| Storage (S3 / Firebase Storage) | $5 - $50 |
| CDN (Cloudflare R2 free tier) | $0 - $30 |
| Email (Resend, Postmark for transactional) | $0 - $50 |
| Customer support (Zendesk Suite Team) | $55/agent |
| Analytics (Mixpanel, Amplitude free tier) | $0 - $200 |
| Domain + SSL | $1 |
| **Estimated total** | **$80 - $1200/mo** |

**At 100K MAU:**
- Firebase Blaze plan: $200 - $2000/mo
- Apple developer percentage of IAP: 15-30% off the top
- Support staffing: 1 person per ~20K active users
- Backend scales linearly with traffic

**Rule:** Estimate cost-per-MAU before launch. If you can't sustain $0.10-$0.50 per MAU per month from your revenue model, you'll run out of money at growth.

---

## Bootcamp Complete

You've covered 27 weeks of Flutter — from `void main()` to a production-grade enterprise chat app with:

| Phase | Key Skills | Enterprise Patterns |
|--|--|--|
| Phase 1 | Dart, rendering, constraints, navigation | Structured errors, isolates, i18n, design tokens |
| Phase 2 | Slivers, forms, animations, gestures | Form state machines, accessibility, motion preferences |
| Phase 3 | Riverpod, HTTP/Dio, repository | Certificate pinning, retry backoff, analytics, provider org |
| Phase 4 | Firestore, Auth, Hive, offline-first | Token refresh, sync engine, migrations, data privacy |
| Phase 5 | BLoC, Clean Architecture, charts | BLoC observer, feature flags, multi-module, HydratedBloc |
| Phase 6 | Testing, profiling, CI/CD, chat | APM/Sentry, contract tests, staged rollouts, security hardening |

**One more thing before you call it done** → [Chat App Challenges](Week_27b_ChatApp_Challenges.md) — a real subscription bug hiding in this project's own typing indicator, an FCM Two Truths and a Lie, and a full-stack test suite for the send-message flow that closes out the entire bootcamp.

**What's next:**
- Explore WebSocket architecture for real-time beyond Firestore
- Implement end-to-end encryption with Signal Protocol
- Build a design system package shared across multiple apps
- Write federated plugins that work on all platforms (Android, iOS, Web, Desktop)
- Practice system design interviews with mobile architecture questions
- Ship an app to real users and learn from production metrics

**Going further — the senior track:** the bootcamp teaches you to build; what separates senior is judgment and planning around what you build. The module-level [senior judgment doc](../../10_Senior_Mobile_Engineering_Judgment.md) (reversibility, native-vs-cross-platform, incident command), the [release & rollout playbook](../../career/RELEASE_AND_ROLLOUT_PLAYBOOK.md) (the pre-launch checklist above, extended into a staged rollout with halt criteria), and the [mobile SWE readiness rubric](../../career/READINESS_RUBRIC_SWE.md) are the next steps. Platform depth for the other half of the world is in [iOS performance](../../08_iOS_Performance_Memory_And_Instruments.md) and the [Android deep dive](../../03_Android/01_Architecture_And_App_Model.md).
