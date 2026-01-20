import { Text } from '@/components/Themed';
import { auth, storage, vehicles } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadVehicle = async () => {
    if (!id) return;
    try {
      const { data: { user } } = await auth.getCurrentUser();
      if (!user) return;
      const { data } = await vehicles.getVehicles(user.id);
      setVehicle((data || []).find((x: any) => x.id === id) || null);
    } catch {
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  const changePhoto = async () => {
    const { data: { user } } = await auth.getCurrentUser();
    if (!user || !id) return;
    Alert.alert('Car photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => pickAndUpload('camera', user.id) },
      { text: 'Choose from Library', onPress: () => pickAndUpload('library', user.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickAndUpload = async (source: 'camera' | 'library', userId: string) => {
    const opts = { mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3] as [number, number], quality: 0.8 };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (result.canceled || !result.assets[0]?.uri) return;
    setUploadingPhoto(true);
    try {
      const { path, error } = await storage.uploadVehicleImageFromUri(userId, id!, result.assets[0].uri);
      if (!error && path) {
        await vehicles.updateVehicle(id!, { image_url: path });
        await loadVehicle();
      } else {
        Alert.alert('Error', 'Could not update photo. Ensure a "vehicles" storage bucket exists.');
      }
    } catch {
      Alert.alert('Error', 'Failed to update photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    loadVehicle();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#004225" />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.centered, styles.container]}>
        <FontAwesome name="car" size={48} color="#999" />
        <Text style={styles.title}>Vehicle not found</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = [vehicle.year, vehicle.make, vehicle.model, vehicle.sub_model].filter(Boolean).join(' ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={20} color="#000" />
        </Pressable>
        <Text style={styles.title}>{vehicle.nickname || displayName || 'Vehicle'}</Text>
      </View>

      <Pressable style={styles.photoSection} onPress={changePhoto} disabled={uploadingPhoto}>
        {vehicle.image_url ? (
          <Image source={{ uri: storage.getPublicUrl('vehicles', vehicle.image_url) }} style={styles.vehicleImage} resizeMode="cover" />
        ) : (
          <View style={styles.vehicleImagePlaceholder}>
            <FontAwesome name="car" size={48} color="#999" />
            <Text style={styles.vehicleImagePlaceholderText}>Add car photo</Text>
          </View>
        )}
        {uploadingPhoto && (
          <View style={styles.photoOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </Pressable>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Year</Text>
          <Text style={styles.value}>{vehicle.year || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Make</Text>
          <Text style={styles.value}>{vehicle.make || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Model</Text>
          <Text style={styles.value}>{vehicle.model || '—'}</Text>
        </View>
        {vehicle.sub_model ? (
          <View style={styles.row}>
            <Text style={styles.label}>Sub-model</Text>
            <Text style={styles.value}>{vehicle.sub_model}</Text>
          </View>
        ) : null}
        {vehicle.color ? (
          <View style={styles.row}>
            <Text style={styles.label}>Color</Text>
            <Text style={styles.value}>{vehicle.color}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 12, padding: 8 },
  title: { fontSize: 20, fontWeight: '600', color: '#000' },
  photoSection: { height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F0F0F0', marginBottom: 20, position: 'relative' },
  vehicleImage: { width: '100%', height: '100%' },
  vehicleImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vehicleImagePlaceholderText: { marginTop: 8, fontSize: 14, color: '#999' },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, fontWeight: '500', color: '#000' },
  button: { marginTop: 20, backgroundColor: '#004225', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
