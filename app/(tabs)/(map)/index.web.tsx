import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MapPin, Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { Map, MapMarker } from '@/components/Map.web';
import { getAllCheckIns, getSetting, CheckIn } from '@/utils/database.web';
import { getMoodColor, getMoodEmoji, getMoodLabel, formatRelativeTime } from '@/utils/streak';

function blurCoordinate(lat: number, lng: number, id: string): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((hash % 200) / 100000);
  const lngOffset = (((hash >> 8) % 200) / 100000);
  return { lat: lat + latOffset, lng: lng + lngOffset };
}

export default function MapScreenWeb() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [privacyBlur, setPrivacyBlur] = useState(false);

  const loadData = useCallback(async () => {
    console.log('[Map Web] Loading check-in data...');
    try {
      const [all, blurSetting] = await Promise.all([
        getAllCheckIns(),
        getSetting('privacy_blur', 'false'),
      ]);
      setPrivacyBlur(blurSetting === 'true');

      const withLocation = all.filter((c: CheckIn) => c.latitude !== null && c.longitude !== null);
      console.log('[Map Web] Found', withLocation.length, 'check-ins with location');

      const blur = blurSetting === 'true';
      const markerData: MapMarker[] = withLocation.map((c: CheckIn) => {
        const lat = c.latitude!;
        const lng = c.longitude!;
        const coords = blur ? blurCoordinate(lat, lng, c.id) : { lat, lng };
        return {
          id: c.id,
          latitude: coords.lat,
          longitude: coords.lng,
          title: `${getMoodEmoji(c.mood_score)} ${getMoodLabel(c.mood_score)}`,
          description: formatRelativeTime(c.created_at),
        };
      });
      setMarkers(markerData);
    } catch (err) {
      console.error('[Map Web] Error loading data:', err);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const handlePrivacyToggle = (val: boolean) => {
    console.log('[Map Web] Privacy blur toggled:', val);
    setPrivacyBlur(val);
    loadData();
  };

  const hasMarkers = markers.length > 0;

  const initialRegion = hasMarkers
    ? {
        latitude: markers[0].latitude,
        longitude: markers[0].longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Map
        style={{ flex: 1 }}
        markers={markers}
        initialRegion={initialRegion}
        showsUserLocation
      />

      {/* Privacy toggle */}
      <View style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: 220,
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        } as any}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {privacyBlur ? (
              <EyeOff size={16} color={COLORS.textSecondary} />
            ) : (
              <Eye size={16} color={COLORS.textSecondary} />
            )}
            <Text style={{ fontSize: 13, color: COLORS.text, fontFamily: 'Nunito_600SemiBold' }}>
              Blur locations
            </Text>
          </View>
          <Switch
            value={privacyBlur}
            onValueChange={handlePrivacyToggle}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Empty state */}
      {!hasMarkers && (
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
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        } as any}>
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
