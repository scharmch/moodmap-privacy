import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { MapPin, Navigation, Edit2, SkipForward } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { CheckInStepWrapper } from '@/components/CheckInStepWrapper';
import { useCheckIn } from '@/contexts/CheckInContext';

type LocationMode = 'gps' | 'manual' | 'skip';

export default function Step5() {
  const router = useRouter();
  const { draft, updateDraft } = useCheckIn();
  const [mode, setMode] = useState<LocationMode>('gps');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualLabel, setManualLabel] = useState('');
  const [gpsLabel, setGpsLabel] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = useCallback(async () => {
    console.log('[CheckIn Step 5] Requesting GPS location...');
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[CheckIn Step 5] Location permission denied');
        setLocationError('Location permission denied. You can enter a location manually or skip.');
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      console.log('[CheckIn Step 5] Got GPS coords:', latitude, longitude);

      // Reverse geocode
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        const label = [address.name, address.district, address.city]
          .filter(Boolean)
          .join(', ');
        setGpsLabel(label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } catch {
        setGpsLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }

      setGpsCoords({ lat: latitude, lng: longitude });
      updateDraft({ latitude, longitude });
    } catch (err) {
      console.error('[CheckIn Step 5] Location error:', err);
      setLocationError('Could not get your location. Try again or enter manually.');
    } finally {
      setLocationLoading(false);
    }
  }, [updateDraft]);

  useEffect(() => {
    if (mode === 'gps') {
      requestLocation();
    }
  }, [mode, requestLocation]);

  const handleNext = () => {
    if (mode === 'gps' && gpsCoords) {
      console.log('[CheckIn Step 5] Using GPS location:', gpsLabel);
      updateDraft({
        latitude: gpsCoords.lat,
        longitude: gpsCoords.lng,
        location_label: gpsLabel,
        use_location: true,
      });
    } else if (mode === 'manual' && manualLabel.trim()) {
      console.log('[CheckIn Step 5] Using manual location:', manualLabel);
      updateDraft({
        latitude: null,
        longitude: null,
        location_label: manualLabel.trim(),
        use_location: true,
      });
    } else {
      console.log('[CheckIn Step 5] Skipping location');
      updateDraft({
        latitude: null,
        longitude: null,
        location_label: null,
        use_location: false,
      });
    }
    router.push('/checkin/step-6');
  };

  const handleModeChange = (newMode: LocationMode) => {
    console.log('[CheckIn Step 5] Location mode changed to:', newMode);
    setMode(newMode);
    if (newMode === 'skip') {
      updateDraft({ latitude: null, longitude: null, location_label: null });
    }
  };

  return (
    <CheckInStepWrapper
      step={5}
      totalSteps={7}
      title="Where are you?"
      subtitle="Location helps identify emotional patterns"
      onNext={handleNext}
      nextLabel="Continue"
    >
      <View style={{ paddingTop: 16, gap: 16 }}>
        {/* Mode selector */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { key: 'gps' as LocationMode, label: 'Use GPS', icon: <Navigation size={16} color={mode === 'gps' ? '#FFFFFF' : COLORS.primary} /> },
            { key: 'manual' as LocationMode, label: 'Enter manually', icon: <Edit2 size={16} color={mode === 'manual' ? '#FFFFFF' : COLORS.primary} /> },
            { key: 'skip' as LocationMode, label: 'Skip', icon: <SkipForward size={16} color={mode === 'skip' ? '#FFFFFF' : COLORS.textSecondary} /> },
          ].map(({ key, label, icon }) => (
            <Pressable
              key={key}
              onPress={() => handleModeChange(key)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: mode === key ? (key === 'skip' ? COLORS.textSecondary : COLORS.primary) : COLORS.surface,
                borderWidth: 1.5,
                borderColor: mode === key ? (key === 'skip' ? COLORS.textSecondary : COLORS.primary) : COLORS.border,
              }}
            >
              {icon}
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: mode === key ? '#FFFFFF' : COLORS.text,
                fontFamily: 'Nunito_600SemiBold',
              }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* GPS mode */}
        {mode === 'gps' && (
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            padding: 16,
            gap: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            {locationLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                  Getting your location...
                </Text>
              </View>
            ) : locationError ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, color: COLORS.danger, fontFamily: 'Nunito_400Regular' }}>
                  {locationError}
                </Text>
                <Pressable
                  onPress={requestLocation}
                  style={{
                    backgroundColor: COLORS.primaryMuted,
                    borderRadius: 10,
                    paddingVertical: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, color: COLORS.primary, fontFamily: 'Nunito_600SemiBold' }}>
                    Try again
                  </Text>
                </Pressable>
              </View>
            ) : gpsLabel ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: COLORS.accentMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MapPin size={20} color={COLORS.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }} numberOfLines={2}>
                    {gpsLabel}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                    GPS location detected
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Manual mode */}
        {mode === 'manual' && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: 'Nunito_600SemiBold' }}>
              Place name
            </Text>
            <TextInput
              value={manualLabel}
              onChangeText={setManualLabel}
              placeholder="e.g. Home, Coffee shop, Park..."
              placeholderTextColor={COLORS.textTertiary}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                color: COLORS.text,
                fontFamily: 'Nunito_400Regular',
                borderWidth: 1.5,
                borderColor: COLORS.border,
              }}
              autoFocus
              maxLength={60}
            />
          </View>
        )}

        {/* Skip mode */}
        {mode === 'skip' && (
          <View style={{
            backgroundColor: COLORS.surfaceSecondary,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            gap: 8,
          }}>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', textAlign: 'center' }}>
              No location will be recorded for this check-in.
            </Text>
          </View>
        )}

        {/* Privacy note */}
        <View style={{
          backgroundColor: COLORS.primaryMuted,
          borderRadius: 12,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
        }}>
          <Text style={{ fontSize: 16 }}>🔒</Text>
          <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', flex: 1, lineHeight: 18 }}>
            Location is stored only on your device and never shared.
          </Text>
        </View>
      </View>
    </CheckInStepWrapper>
  );
}
