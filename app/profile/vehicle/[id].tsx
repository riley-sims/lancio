import { Text } from '@/components/Themed';
import { auth, vehicles } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data: { user } } = await auth.getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const { data } = await vehicles.getVehicles(user.id);
        const v = (data || []).find((x: any) => x.id === id);
        setVehicle(v || null);
      } catch {
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    })();
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, fontWeight: '500', color: '#000' },
  button: { marginTop: 20, backgroundColor: '#004225', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
