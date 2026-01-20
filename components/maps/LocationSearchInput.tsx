import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Pressable, Text, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { locationSearch, LocationSuggestion } from '@/lib/locationSearch';

interface LocationSearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onLocationSelect: (location: LocationSuggestion) => void;
  style?: any;
}

export default function LocationSearchInput({
  placeholder = 'Search for a location...',
  value,
  onChangeText,
  onLocationSelect,
  style,
}: LocationSearchInputProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const searchLocations = async () => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      const results = await locationSearch.searchLocations(value, 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    };

    const debounceTimer = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleSelectLocation = (location: LocationSuggestion) => {
    onChangeText(location.place_name);
    onLocationSelect(location);
    setShowSuggestions(false);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => value.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#666" style={styles.loadingIcon} />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectLocation(suggestion)}
              >
                <FontAwesome name="map-marker" size={16} color="#007AFF" style={styles.markerIcon} />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {suggestion.name}
                  </Text>
                  <Text style={styles.suggestionPlace} numberOfLines={1}>
                    {suggestion.place_name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  loadingIcon: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 250,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  markerIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  suggestionPlace: {
    fontSize: 12,
    color: '#666',
  },
});

