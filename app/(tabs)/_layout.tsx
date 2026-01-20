import { auth, db, storage } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Custom TabBarIcon that supports solid vs outline
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
  alwaysSolid?: boolean;
}) {
  let iconName = props.name;
  if (props.name === 'heart') {
    iconName = 'heart'; // Always solid
  }
  
  return (
    <FontAwesome 
      size={26} 
      name={iconName as any} 
      color={props.color}
    />
  );
}

export default function TabLayout() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [username, setUsername] = useState('@rileysims_');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (user) {
        const { data: profile } = await db.getUserProfile(user.id);
        if (profile) {
          setUserProfile(profile);
          setUsername(`@${profile.username || 'rileysims_'}`);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const getAvatarUrl = () => {
    if (userProfile?.avatar_url) {
      return userProfile.avatar_url.startsWith('http')
        ? userProfile.avatar_url
        : storage.getPublicUrl('avatars', userProfile.avatar_url);
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#F5F5F5',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 2,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
          marginBottom: -8,
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarShowLabel: false,
        headerShown: false,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}>
      {/* Saved tab - leftmost with heart icon */}
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="heart" color={focused ? '#000' : '#666'} focused={focused} />
          ),
        }}
      />
      {/* Events tab - flag icon */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="flag" color={focused ? '#000' : '#666'} focused={focused} />
          ),
        }}
      />
      {/* Home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={focused ? '#000' : '#666'} focused={focused} />
          ),
        }}
      />
      {/* Chat tab */}
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <TabBarIcon name="comments" color={focused ? '#000' : '#666'} focused={focused} />
            </View>
          ),
        }}
      />
      {/* Profile tab - rightmost with profile picture */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.profileIconContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profileIcon} />
              ) : (
                <FontAwesome name="user" size={26} color={focused ? '#000' : '#666'} />
              )}
            </View>
          ),
        }}
      />
      {/* Hide these from tab bar but keep accessible */}
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="drives"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
