import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  events?: { date: Date; count: number }[];
}

export default function Calendar({ selectedDate, onDateSelect, events = [] }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  
  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };
  
  const hasEvent = (day: number) => {
    const date = new Date(year, month, day);
    return events.some(e => 
      e.date.getDate() === date.getDate() &&
      e.date.getMonth() === date.getMonth() &&
      e.date.getFullYear() === date.getFullYear()
    );
  };
  
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };
  
  const handleDatePress = (day: number) => {
    const date = new Date(year, month, day);
    onDateSelect?.(date);
  };
  
  const renderDays = () => {
    const days = [];
    
    // Previous month's days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push(
        <View key={`prev-${day}`} style={styles.dayContainer}>
          <Text style={styles.otherMonthDay}>{day}</Text>
        </View>
      );
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day);
      const hasEventDot = hasEvent(day);
      
      days.push(
        <Pressable
          key={day}
          style={[styles.dayContainer, selected && styles.selectedDay]}
          onPress={() => handleDatePress(day)}
        >
          <Text style={[styles.dayText, selected && styles.selectedDayText]}>
            {day}
          </Text>
          {hasEventDot && <View style={styles.eventDot} />}
        </Pressable>
      );
    }
    
    // Next month's days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays && day <= 14; day++) {
      days.push(
        <View key={`next-${day}`} style={styles.dayContainer}>
          <Text style={styles.otherMonthDay}>{day}</Text>
        </View>
      );
    }
    
    return days;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={previousMonth} style={styles.arrowButton}>
          <FontAwesome name="chevron-left" size={16} color="#000" />
        </Pressable>
        <Text style={styles.monthYear}>
          {monthNames[month]} {year}
        </Text>
        <Pressable onPress={nextMonth} style={styles.arrowButton}>
          <FontAwesome name="chevron-right" size={16} color="#000" />
        </Pressable>
      </View>
      
      <View style={styles.weekDays}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>
      
      <View style={styles.daysGrid}>
        {renderDays()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    color: '#000',
  },
  otherMonthDay: {
    fontSize: 16,
    color: '#CCC',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },
});

