import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import MapView, { Marker, Circle } from 'react-native-maps';
import { MapPin, Layers, Eye, EyeOff, X, Clock, Activity } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { getAllCheckIns, getSetting, CheckIn } from '@/utils/database';
import { getMoodColor, getMoodEmoji, getMoodLabel, formatRelativeTime } from '@/utils/streak';

function blurCoordinate(lat: number, lng: number, id: string): { lat: number; lng: number } {
  // Deterministic pseudo-random offset based on id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((hash % 200) / 100000);
  const lngOffset = (((hash >> 8) % 200) / 100000);
  return { lat: lat + latOffset, lng: lng + lngOffset };
}

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  mood_score: number;
  mood_label: string;
  location_label: string | null;
  created_at: string;
  activities: string[];
  notes: string | null;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [privacyBlur, setPrivacyBlur] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    console.log('[Map] Loading check-in data...');
    try {
      const [all, blurSetting] = await Promise.all([
        getAllCheckIns(),
        getSetting('privacy_blur', 'false'),
      ]);
      setCheckIns(all);
      setPrivacyBlur(blurSetting === 'true');

      const withLocation = all.filter(c => c.latitude !== null && c.longitude !== null);
      console.log('[Map] Found', withLocation.length, 'check-ins with location');

      const blur = blurSetting === 'true';
      const markerData: MarkerData[] = withLocation.map(c => {
        const lat = c.latitude!;
        const lng = c.longitude!;
        const coords = blur ? blurCoordinate(lat, lng, c.id) : { lat, lng };
        return {
          id: c.id,
          lat: coords.lat,
          lng: coords.lng,
          mood_score: c.mood_score,
          mood_label: c.mood_label,
          location_label: c.location_label,
          created_at: c.created_at,
          activities: c.activities,
          notes: c.notes,
        };
      });
      setMarkers(markerData);
    } catch (err) {
      console.error('[Map] Error loading data:', err);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const handleMarkerPress = (marker: MarkerData) => {
    console.log('[Map] Marker pressed:', marker.id, 'mood:', marker.mood_score);
    setSelectedMarker(marker);
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const handleCloseSheet = () => {
    console.log('[Map] Closing bottom sheet');
    Animated.timing(bottomSheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedMarker(null));
  };

  const handlePrivacyToggle = (val: boolean) => {
    console.log('[Map] Privacy blur toggled:', val);
    setPrivacyBlur(val);
    loadData();
  };

  const handleViewModeToggle = (mode: 'markers' | 'heatmap') => {
    console.log('[Map] View mode changed to:', mode);
    setViewMode(mode);
  };

  const handleViewDetail = (id: string) => {
    console.log('[Map] Opening check-in detail from map:', id);
    router.push(`/checkin/${id}`);
  };

  const bottomSheetTranslateY = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const initialRegion = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Map */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {viewMode === 'markers' && markers.map(marker => {
          const color = getMoodColor(marker.mood_score);
          return (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
              onPress={() => handleMarkerPress(marker)}
            >
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2.5,
                borderColor: '#FFFFFF',
                boxShadow: `0 2px 8px ${color}66`,
              }}>
                <Text style={{ fontSize: 16 }}>{getMoodEmoji(marker.mood_score)}</Text>
              </View>
            </Marker>
          );
        })}

        {viewMode === 'heatmap' && markers.map(marker => {
          const color = getMoodColor(marker.mood_score);
          return (
            <Circle
              key={marker.id}
              center={{ latitude: marker.lat, longitude: marker.lng }}
              radius={300}
              fillColor={`${color}33`}
              strokeColor={`${color}66`}
              strokeWidth={1}
            />
          );
        })}
      </MapView>

      {/* Top controls */}
      <View style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        gap: 10,
      }}>
        {/* View mode toggle */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 14,
          padding: 4,
          flexDirection: 'row',
          alignSelf: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        }}>
          <Pressable
            onPress={() => handleViewModeToggle('markers')}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: viewMode === 'markers' ? COLORS.primary : 'transparent',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MapPin size={14} color={viewMode === 'markers' ? '#FFFFFF' : COLORS.textSecondary} />
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: viewMode === 'markers' ? '#FFFFFF' : COLORS.textSecondary,
              fontFamily: 'Nunito_600SemiBold',
            }}>
              Markers
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleViewModeToggle('heatmap')}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: viewMode === 'heatmap' ? COLORS.primary : 'transparent',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Layers size={14} color={viewMode === 'heatmap' ? '#FFFFFF' : COLORS.textSecondary} />
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: viewMode === 'heatmap' ? '#FFFFFF' : COLORS.textSecondary,
              fontFamily: 'Nunito_600SemiBold',
            }}>
              Heatmap
            </Text>
          </Pressable>
        </View>

        {/* Privacy toggle */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          alignSelf: 'center',
          minWidth: 220,
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        }}>
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
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
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

      {/* Bottom sheet */}
      {selectedMarker && (
        <Animated.View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: bottomSheetTranslateY }],
        }}>
          <View style={{
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: insets.bottom + 20,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          }}>
            {/* Handle */}
            <View style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: COLORS.border,
              alignSelf: 'center',
              marginBottom: 16,
            }} />

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ gap: 6, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: `${getMoodColor(selectedMarker.mood_score)}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 22 }}>{getMoodEmoji(selectedMarker.mood_score)}</Text>
                  </View>
                  <View>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: getMoodColor(selectedMarker.mood_score),
                      fontFamily: 'Nunito_700Bold',
                    }}>
                      {selectedMarker.mood_label}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                      Score: {selectedMarker.mood_score}/10
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} color={COLORS.textTertiary} />
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                    {formatRelativeTime(selectedMarker.created_at)}
                  </Text>
                </View>

                {selectedMarker.location_label && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} color={COLORS.textTertiary} />
                    <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                      {selectedMarker.location_label}
                    </Text>
                  </View>
                )}

                {selectedMarker.activities.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Activity size={13} color={COLORS.textTertiary} />
                    <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                      {selectedMarker.activities.join(', ')}
                    </Text>
                  </View>
                )}

                {selectedMarker.notes && (
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', fontStyle: 'italic' }} numberOfLines={2}>
                    "{selectedMarker.notes}"
                  </Text>
                )}
              </View>

              <Pressable
                onPress={handleCloseSheet}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.surfaceSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityLabel="Close"
              >
                <X size={16} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <AnimatedPressable
              onPress={() => handleViewDetail(selectedMarker.id)}
              style={{ marginTop: 16 }}
            >
              <View style={{
                backgroundColor: COLORS.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Nunito_700Bold' }}>
                  View full details
                </Text>
              </View>
            </AnimatedPressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
