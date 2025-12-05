import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import { formatDateTime } from '@/utils/helpers';

interface DriveCardProps {
  id: string;
  title: string;
  startLocation: string | any;
  endLocation: string | any;
  startTime: Date | string;
  participants?: number | any;
  onPress?: () => void;
}

export default function DriveCard({
  id,
  title,
  startLocation,
  endLocation,
  startTime,
  participants = 0,
  onPress,
}: DriveCardProps) {
  // Handle location as object or string
  const startLoc = typeof startLocation === 'string' 
    ? startLocation 
    : startLocation?.name || 'Start location';
  const endLoc = typeof endLocation === 'string'
    ? endLocation
    : endLocation?.name || 'End location';
  
  // Handle participants as number or object
  const participantCount = typeof participants === 'number'
    ? participants
    : participants?.[0]?.count || 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.route}>
        <Text style={styles.location}>{startLoc}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.location}>{endLoc}</Text>
      </View>
      <Text style={styles.time}>{formatDateTime(startTime)}</Text>
      {participantCount > 0 && (
        <Text style={styles.participants}>{participantCount} participants</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    flex: 1,
  },
  arrow: {
    fontSize: 16,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  time: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  participants: {
    fontSize: 12,
    opacity: 0.6,
  },
});

