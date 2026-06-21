# Week 26 — Phase 6 Capstone: Real-Time Chat App
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
- CI/CD pipeline from Week 25

---

## Architecture Overview

```
lib/
  features/
    auth/          ← reuse from Week 16
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

## Week 26 Verify

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

## Bootcamp Complete

You've covered 26 weeks of Flutter — from `void main()` to a production-grade enterprise chat app with:

| Phase | Key Skills | Enterprise Patterns |
|--|--|--|
| Phase 1 | Dart, rendering, constraints, navigation | Structured errors, isolates, i18n, design tokens |
| Phase 2 | Slivers, forms, animations, gestures | Form state machines, accessibility, motion preferences |
| Phase 3 | Riverpod, HTTP/Dio, repository | Certificate pinning, retry backoff, analytics, provider org |
| Phase 4 | Firestore, Auth, Hive, offline-first | Token refresh, sync engine, migrations, data privacy |
| Phase 5 | BLoC, Clean Architecture, charts | BLoC observer, feature flags, multi-module, HydratedBloc |
| Phase 6 | Testing, profiling, CI/CD, chat | APM/Sentry, contract tests, staged rollouts, security hardening |

**What's next:**
- Explore WebSocket architecture for real-time beyond Firestore
- Implement end-to-end encryption with Signal Protocol
- Build a design system package shared across multiple apps
- Write federated plugins that work on all platforms (Android, iOS, Web, Desktop)
- Practice system design interviews with mobile architecture questions
- Ship an app to real users and learn from production metrics
