import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MapPin, Layers, Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { Map } from '@/components/Map.web';
import { getAllCheckIns, CheckIn } from '@/utils/database';
import { getMoodColor, getMoodEmoji, getMoodLabel } from '@/utils/streak';

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  mood_score: number;
  mood_label: string;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  const loadData = useCallback(async () => {
    console.log('[Map Web] Loading check-in data...');
    try {
      const all = await getAllCheckIns();
      const withLocation = all.filter(c => c.latitude !== null && c.longitude !== null);
      console.log('[Map Web] Found', withLocation.length, 'check-ins with location');
      const markerData: MarkerData[] = withLocation.map(c => ({
        id: c.id,
        lat: c.latitude!,
        lng: c.longitude!,
        mood_score: c.mood_score,
        mood_label: c.mood_label,
      }));
      setMarkers(markerData);
    } catch (err) {
      console.error('[Map Web] Error loading data:', err);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const leafletMarkers = markers.map(m => ({
    id: m.id,
    latitude: m.lat,
    longitude: m.lng,
    title: getMoodEmoji(m.mood_score) + ' ' + m.mood_label,
    description: 'Score: ' + m.mood_score + '/10',
  }));

  const initialRegion = {
    latitude: markers.length > 0 ? markers[0].lat : 37.7749,
    longitude: markers.length > 0 ? markers[0].lng : -122.4194,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Map
        markers={leafletMarkers}
        initialRegion={initialRegion}
        style={{ flex: 1, borderRadius: 0 }}
      />

      {markers.length === 0 && (
        <View style={{
          position: 'absolute',
          bottom: insets.bottom + 100,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          gap: 8,
        }}>
          <MapPin size={24} color={COLORS.textTertiary} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold', textAlign: 'center' }}>
            No location data yet
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', textAlign: 'center' }}>
            Complete check-ins with location to see your emotional map
          </Text>
        </View>
      )}
    </View>
  );
}
