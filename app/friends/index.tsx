import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable, Image } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth, friends as friendsHelper, chats as chatsHelper } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { storage } from '@/lib/supabase';

export default function FriendsScreen() {
  const router = useRouter();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await friendsHelper.getFriends(user.id, 'accepted');
        if (error) {
          console.error('Error loading friends:', error);
        } else {
          setFriends(data || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async (friendId: string) => {
    if (!userId) return;
    
    try {
      // Check if chat already exists
      // For now, create a new direct chat
      const { data: chat, error } = await chatsHelper.createChat({
        type: 'direct',
        created_by: userId,
      });
      
      if (error) {
        console.error('Error creating chat:', error);
        return;
      }
      
      // Add both users as participants
      await chatsHelper.addChatParticipant(chat.id, userId);
      await chatsHelper.addChatParticipant(chat.id, friendId);
      
      router.push(`/chats/${chat.id}`);
    } catch (error) {
      console.error('Error:', error);
    }
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>My Driving Pals</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Friend Count */}
      <View style={styles.countSection}>
        <Text style={styles.countText}>{friends.length} Friends</Text>
      </View>

      {/* Friends List */}
      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No friends yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {friends.map((friend) => {
            const friendData = friend.friend || friend.user;
            const avatarUrl = friendData?.avatar_url
              ? storage.getPublicUrl('avatars', friendData.avatar_url)
              : null;
            
            return (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.friendAvatar} />
                  ) : (
                    <View style={[styles.friendAvatar, { backgroundColor: '#9C27B0' }]}>
                      <FontAwesome name="user" size={24} color="#fff" />
                    </View>
                  )}
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>
                      {friendData?.username || 'Friend'}
                    </Text>
                    <Text style={styles.friendUsername}>
                      @{friendData?.username || 'username'}
                    </Text>
                    <Text style={styles.friendLocation}>
                      {friendData?.location || 'Location not set'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.messageButton}
                  onPress={() => handleMessage(friendData.id)}
                >
                  <Text style={styles.messageButtonText}>Message</Text>
                </Pressable>
              </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 36,
  },
  countSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  countText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#9C27B0',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  friendLocation: {
    fontSize: 12,
    color: '#666',
  },
  messageButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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

