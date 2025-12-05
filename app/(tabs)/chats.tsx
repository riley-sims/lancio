import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth, chats as chatsHelper } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { formatDateTime } from '@/utils/helpers';

export default function ChatsScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'drives' | 'friends' | 'community'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await chatsHelper.getChats(user.id);
        if (error) {
          console.error('Error loading chats:', error);
        } else {
          setChats(data || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'drives') return chat.type === 'drive';
    if (selectedFilter === 'friends') return chat.type === 'direct' || chat.type === 'group';
    if (selectedFilter === 'community') return chat.type === 'community';
    return true;
  });

  const getLastMessage = (chat: any) => {
    if (chat.last_message && chat.last_message.length > 0) {
      const msg = chat.last_message[0];
      return {
        content: msg.content || 'Welcome to the group chat. Say hi...',
        time: msg.created_at ? formatDateTime(msg.created_at) : 'now',
      };
    }
    return { content: 'No messages yet', time: '' };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats ({filteredChats.length})</Text>
        <Pressable 
          style={styles.newChatButton}
          onPress={() => {
            // TODO: Implement new chat creation
            console.log('New chat');
          }}
        >
          <Text style={styles.newChatButtonText}>New Chat +</Text>
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, selectedFilter === 'all' && styles.tabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.tabText, selectedFilter === 'all' && styles.tabTextActive]}>
            All Chats
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedFilter === 'drives' && styles.tabActive]}
          onPress={() => setSelectedFilter('drives')}
        >
          <Text style={[styles.tabText, selectedFilter === 'drives' && styles.tabTextActive]}>
            Upcoming Drives
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedFilter === 'friends' && styles.tabActive]}
          onPress={() => setSelectedFilter('friends')}
        >
          <Text style={[styles.tabText, selectedFilter === 'friends' && styles.tabTextActive]}>
            Friends
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedFilter === 'community' && styles.tabActive]}
          onPress={() => setSelectedFilter('community')}
        >
          <Text style={[styles.tabText, selectedFilter === 'community' && styles.tabTextActive]}>
            Community
          </Text>
        </Pressable>
      </View>

      {/* Chat List */}
      {filteredChats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No chats yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {filteredChats.map((chat) => {
            const lastMessage = getLastMessage(chat);
            const chatName = chat.name || `Group (${chat.participants?.length || 0})`;
            
            return (
              <Pressable
                key={chat.id}
                style={styles.chatItem}
                onPress={() => router.push(`/chats/${chat.id}`)}
              >
                <View style={[styles.chatAvatar, { backgroundColor: chat.type === 'community' ? '#9C27B0' : '#4CAF50' }]}>
                  {chat.participants && chat.participants.length > 0 ? (
                    <FontAwesome name="users" size={24} color="#fff" />
                  ) : (
                    <FontAwesome name="user" size={24} color="#fff" />
                  )}
                </View>
                
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{chatName}</Text>
                    <View style={styles.chatRight}>
                      <FontAwesome name="circle" size={8} color="#666" style={styles.chatIcon} />
                    </View>
                  </View>
                  <Text style={styles.chatPreview} numberOfLines={1}>
                    {lastMessage.content}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  chatTime: {
    fontSize: 12,
    color: '#666',
  },
  chatRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIcon: {
    marginLeft: 8,
  },
  chatPreview: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
