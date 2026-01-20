import { Text } from '@/components/Themed';
import { auth, storage, vehicles } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [subModel, setSubModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const pickCarPhoto = () => {
    Alert.alert('Car photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => pickImage('camera') },
      { text: 'Choose from Library', onPress: () => pickImage('library') },
      ...(photoUri ? [{ text: 'Remove', onPress: () => setPhotoUri(null) }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const opts = { mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3] as [number, number], quality: 0.8 };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (!result.canceled && result.assets[0]?.uri) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    // Validation
    if (!make || !make.trim()) {
      Alert.alert('Validation Error', 'Please enter the vehicle make');
      return;
    }

    if (!model || !model.trim()) {
      Alert.alert('Validation Error', 'Please enter the vehicle model');
      return;
    }

    if (!year || !year.trim()) {
      Alert.alert('Validation Error', 'Please enter the vehicle year');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await auth.getCurrentUser();
      if (userError || !user) {
        Alert.alert('Error', 'Please log in to add a vehicle');
        setLoading(false);
        return;
      }

      // Create vehicle data
      const vehicleData = {
        user_id: user.id,
        make: make.trim(),
        model: model.trim(),
        sub_model: subModel.trim() || null,
        year: year.trim(),
        color: color.trim() || null,
        nickname: nickname.trim() || null,
      };

      const { data, error } = await vehicles.createVehicle(vehicleData);

      if (error) {
        console.error('Vehicle creation error:', error);
        let errorMessage = 'Failed to save vehicle';
        if (error.code === '42501') {
          errorMessage = 'Database security policy error. Please run the vehicles table SQL in Supabase dashboard.';
        } else if (error.code === 'PGRST204') {
          errorMessage = "The vehicles table is missing columns (e.g. 'nickname'). Run supabase_add_vehicles_columns.sql in Supabase → SQL Editor, then try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert('Error', errorMessage);
        setLoading(false);
        return;
      }

      if (data && photoUri) {
        const { path, error: upErr } = await storage.uploadVehicleImageFromUri(user.id, data.id, photoUri);
        if (!upErr && path) {
          await vehicles.updateVehicle(data.id, { image_url: path });
        }
      }

      Alert.alert('Success', 'Vehicle added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>Add Vehicle</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Car photo (Optional)</Text>
            <Pressable style={styles.photoBox} onPress={pickCarPhoto} disabled={loading}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <FontAwesome name="camera" size={32} color="#999" />
                  <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nickname (Optional)</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="tag" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., My Daily Driver"
                placeholderTextColor="#999"
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Make *</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="car" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Toyota, Ford, BMW"
                placeholderTextColor="#999"
                value={make}
                onChangeText={setMake}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="car" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Camry, Mustang, 3 Series"
                placeholderTextColor="#999"
                value={model}
                onChangeText={setModel}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sub-Model (Optional)</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="car" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., SE, GT, M3"
                placeholderTextColor="#999"
                value={subModel}
                onChangeText={setSubModel}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year *</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="calendar" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 2024"
                placeholderTextColor="#999"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                maxLength={4}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color (Optional)</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="paint-brush" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Red, Blue, Black"
                placeholderTextColor="#999"
                value={color}
                onChangeText={setColor}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          <Pressable
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Add Vehicle</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  photoBox: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#004225',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

