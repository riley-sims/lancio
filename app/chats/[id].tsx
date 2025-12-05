import { StyleSheet, View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { auth, chats as chatsHelper, messages as messagesHelper } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { formatTime } from '@/utils/helpers';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadChat();
    loadMessages();
    subscribeToMessages();
    
    return () => {
      // Cleanup subscription
    };
  }, [id]);

  const loadChat = async () => {
    try {
      const { data, error } = await chatsHelper.getChatById(id);
      if (error) {
        console.error('Error loading chat:', error);
      } else {
        setChat(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await messagesHelper.getMessages(id, 50);
        if (error) {
          console.error('Error loading messages:', error);
        } else {
          // Reverse to show oldest first
          setMessages((data || []).reverse());
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = messagesHelper.subscribeToMessages(id, (newMessage) => {
      // Fetch sender info for new message
      loadMessages();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !userId) return;

    try {
      const { error } = await messagesHelper.sendMessage(id, userId, messageText.trim());
      if (error) {
        console.error('Error sending message:', error);
      } else {
        setMessageText('');
        loadMessages();
        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const isMyMessage = (message: any) => {
    return message.sender_id === userId;
  };

  const chatName = chat?.name || `Group (${chat?.participants?.length || 0})`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>{chatName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => {
          const isMine = isMyMessage(message);
          const senderName = message.sender?.username || 'User';
          
          return (
            <View
              key={message.id}
              style={[styles.messageWrapper, isMine && styles.messageWrapperRight]}
            >
              {!isMine && (
                <Text style={styles.senderName}>{senderName}</Text>
              )}
              <View
                style={[
                  styles.messageBubble,
                  isMine ? styles.messageBubbleRight : styles.messageBubbleLeft,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMine ? styles.messageTextRight : styles.messageTextLeft,
                  ]}
                >
                  {message.content}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    isMine ? styles.messageTimeRight : styles.messageTimeLeft,
                  ]}
                >
                  {formatTime(message.created_at)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="@rileysims.ge"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          onSubmitEditing={sendMessage}
        />
        <Pressable
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 36,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageWrapperRight: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleLeft: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTextLeft: {
    color: '#000',
  },
  messageTextRight: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  messageTimeLeft: {
    color: '#666',
  },
  messageTimeRight: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

