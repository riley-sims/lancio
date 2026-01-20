import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase environment variables are not set. Please check your .env file.');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

// Custom storage adapter for React Native using SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    // Use React Native fetch as-is; avoid custom header merge that can break
    // Supabase (e.g. Headers object, undefined) and cause network errors.
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
  },
});

// Helper functions for common operations
export const auth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
  
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
  
  getCurrentUser: () => {
    return supabase.auth.getUser();
  },
  
  getSession: () => {
    return supabase.auth.getSession();
  },
};

// Database helpers (expanded)
export const db = {
  // Drive operations
  getDrives: async () => {
    const { data, error } = await supabase
      .from('drives')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },
  
  getDriveById: async (id: string) => {
    const { data, error } = await supabase
      .from('drives')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },
  
  getDriveWithDetails: async (id: string) => {
    const { data, error } = await supabase
      .from('drives')
      .select(`
        *,
        participants:drive_participants(*),
        stops:drive_stops(*)
      `)
      .eq('id', id)
      .single();
    return { data, error };
  },
  
  getUpcomingDrives: async () => {
    const { data, error } = await supabase
      .from('drives')
      .select(`
        *,
        participants:drive_participants(count)
      `)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
    return { data, error };
  },
  
  getUserDrives: async (userId: string) => {
    // Drives I created
    const { data: created, error: e1 } = await supabase
      .from('drives')
      .select(`*, participants:drive_participants(count)`)
      .eq('creator_id', userId)
      .order('start_time', { ascending: true });

    if (e1) return { data: null, error: e1 };

    // Drives I joined (via drive_participants)
    const { data: joinedRows, error: e2 } = await supabase
      .from('drive_participants')
      .select('drive_id')
      .eq('user_id', userId);

    if (e2) return { data: created, error: null };

    const joinedIds = (joinedRows || [])
      .map((r: { drive_id: string }) => r.drive_id)
      .filter((id: string) => !(created || []).some((d: any) => d.id === id));

    if (joinedIds.length === 0) return { data: created, error: null };

    const { data: joined, error: e3 } = await supabase
      .from('drives')
      .select(`*, participants:drive_participants(count)`)
      .in('id', joinedIds)
      .order('start_time', { ascending: true });

    if (e3) return { data: created, error: null };

    const merged = [...(created || []), ...(joined || [])].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    return { data: merged, error: null };
  },
  
  createDrive: async (driveData: any) => {
    const { data, error } = await supabase
      .from('drives')
      .insert([driveData])
      .select()
      .single();
    return { data, error };
  },
  
  updateDrive: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('drives')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
  
  // Drive Participants
  joinDrive: async (driveId: string, userId: string) => {
    const { data, error } = await supabase
      .from('drive_participants')
      .insert([{ drive_id: driveId, user_id: userId }])
      .select()
      .single();
    return { data, error };
  },
  
  leaveDrive: async (driveId: string, userId: string) => {
    const { error } = await supabase
      .from('drive_participants')
      .delete()
      .eq('drive_id', driveId)
      .eq('user_id', userId);
    return { error };
  },
  
  getDriveParticipants: async (driveId: string) => {
    const { data, error } = await supabase
      .from('drive_participants')
      .select('*')
      .eq('drive_id', driveId)
      .order('joined_at', { ascending: true });
    return { data, error };
  },
  
  updateParticipantStatus: async (driveId: string, userId: string, status: string) => {
    const { data, error } = await supabase
      .from('drive_participants')
      .update({ status })
      .eq('drive_id', driveId)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },
  
  // Drive Stops
  addDriveStop: async (driveId: string, stopData: { stop_order: number; location: any; name?: string }) => {
    const { data, error } = await supabase
      .from('drive_stops')
      .insert([{ drive_id: driveId, ...stopData }])
      .select()
      .single();
    return { data, error };
  },
  
  getDriveStops: async (driveId: string) => {
    const { data, error } = await supabase
      .from('drive_stops')
      .select('*')
      .eq('drive_id', driveId)
      .order('stop_order', { ascending: true });
    return { data, error };
  },
  
  removeDriveStop: async (stopId: string) => {
    const { error } = await supabase
      .from('drive_stops')
      .delete()
      .eq('id', stopId);
    return { error };
  },
  
  // User operations (enhanced)
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },
  
  getUserProfileWithStats: async (userId: string) => {
    try {
      // Get drives led by user
      const { count: drivesLedCount, error: drivesLedError } = await supabase
        .from('drives')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // Get drives user participated in
      const { count: eventsJoinedCount, error: eventsJoinedError } = await supabase
        .from('drive_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (drivesLedError || eventsJoinedError) {
        return { 
          data: null, 
          error: drivesLedError || eventsJoinedError 
        };
      }

      // Return stats in the expected format
      // Note: total_miles would need a distance calculation, for now using 0
      const stats = [{
        total_miles: 0,
        drives_led: drivesLedCount || 0,
        events_joined: eventsJoinedCount || 0,
      }];

      return { data: stats, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },
  
  createUserProfile: async (userId: string, profileData: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        ...profileData,
      }])
      .select()
      .single();
    return { data, error };
  },
  
  updateUserProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },
  
  searchUsers: async (query: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(20);
    return { data, error };
  },
};

// Chat helpers
export const chats = {
  getChats: async (userId: string) => {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        participants:chat_participants(*),
        last_message:messages(content, created_at)
      `)
      .order('updated_at', { ascending: false });
    return { data, error };
  },
  
  getChatById: async (chatId: string) => {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        participants:chat_participants(*)
      `)
      .eq('id', chatId)
      .single();
    return { data, error };
  },
  
  createChat: async (chatData: { name?: string; type: string; drive_id?: string; created_by: string }) => {
    const { data, error } = await supabase
      .from('chats')
      .insert([chatData])
      .select()
      .single();
    return { data, error };
  },
  
  addChatParticipant: async (chatId: string, userId: string) => {
    const { data, error } = await supabase
      .from('chat_participants')
      .insert([{ chat_id: chatId, user_id: userId }])
      .select()
      .single();
    return { data, error };
  },
  
  getChatParticipants: async (chatId: string) => {
    const { data, error } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chat_id', chatId);
    return { data, error };
  },
};

// Message helpers
export const messages = {
  getMessages: async (chatId: string, limit: number = 50) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },
  
  sendMessage: async (chatId: string, senderId: string, content: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, sender_id: senderId, content }])
      .select('*')
      .single();
    
    // Update chat updated_at timestamp
    if (!error) {
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
    }
    
    return { data, error };
  },
  
  // Realtime subscription for messages
  subscribeToMessages: (chatId: string, callback: (message: any) => void) => {
    return supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  },
};

// Friends helpers
export const friends = {
  getFriends: async (userId: string, status: string = 'accepted') => {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend:profiles(*)
      `)
      .eq('user_id', userId)
      .eq('status', status);
    return { data, error };
  },
  
  getFriendRequests: async (userId: string) => {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');
    return { data, error };
  },
  
  sendFriendRequest: async (userId: string, friendId: string) => {
    const { data, error } = await supabase
      .from('friends')
      .insert([{ user_id: userId, friend_id: friendId, status: 'pending' }])
      .select()
      .single();
    return { data, error };
  },
  
  acceptFriendRequest: async (requestId: string) => {
    const { data, error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();
    return { data, error };
  },
  
  removeFriend: async (userId: string, friendId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
    return { error };
  },
};

// Vehicle helpers
export const vehicles = {
  getVehicles: async (userId: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },
  
  createVehicle: async (vehicleData: any) => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();
    return { data, error };
  },
  
  updateVehicle: async (vehicleId: string, updates: any) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId)
      .select()
      .single();
    return { data, error };
  },
  
  deleteVehicle: async (vehicleId: string) => {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);
    return { error };
  },
};

// Notification helpers
export const notifications = {
  saveToken: async (userId: string, token: string, platform?: string) => {
    const { data, error } = await supabase
      .from('notification_tokens')
      .upsert([{ user_id: userId, token, platform }], {
        onConflict: 'token',
      })
      .select()
      .single();
    return { data, error };
  },
  
  getTokens: async (userId: string) => {
    const { data, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },
  
  removeToken: async (token: string) => {
    const { error } = await supabase
      .from('notification_tokens')
      .delete()
      .eq('token', token);
    return { error };
  },
};

// Storage helpers (enhanced)
export const storage = {
  uploadImage: async (bucket: string, path: string, file: Blob) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    return { data, error };
  },
  
  uploadAvatar: async (userId: string, file: Blob) => {
    const path = `${userId}/avatar.jpg`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    return { data, error };
  },
  
  uploadDriveImage: async (driveId: string, file: Blob, filename?: string) => {
    const path = `${driveId}/${filename || Date.now().toString()}.jpg`;
    const { data, error } = await supabase.storage
      .from('drive-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    return { data, error };
  },
  
  uploadVehicleImage: async (userId: string, vehicleId: string, file: Blob) => {
    const path = `${userId}/${vehicleId}/image.jpg`;
    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    return { data, error };
  },
  
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },
  
  deleteFile: async (bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { error };
  },
};

