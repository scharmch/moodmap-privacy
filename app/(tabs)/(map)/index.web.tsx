import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MapPin, Smartphone, Clock } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { getAllCheckIns, CheckIn } from '@/utils/database';
import { getMoodEmoji, getMoodColor, formatRelativeTime } from '@/utils/streak';

export default function MapScreenWeb() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    console.log('[Map/Web] Loading check-in data for web placeholder...');
    try {
      const all = await getAllCheckIns();
      setCheckIns(all.slice(0, 20));
      console.log('[Map/Web] Loaded', all.length, 'check-ins');
    } catch (err) {
      console.error('[Map/Web] Error loading check-ins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const handleCheckInPress = (id: string) => {
    console.log('[Map/Web] Check-in row pressed:', id);
    router.push(`/checkin/${id}`);
  };

  const paddingTop = insets.top + 16;
  const paddingBottom = insets.bottom + 100;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop,
          paddingBottom,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: COLORS.text,
              fontFamily: 'Nunito_800ExtraBold',
              marginBottom: 4,
            }}
          >
            Map View
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.textSecondary,
              fontFamily: 'Nunito_400Regular',
            }}
          >
            Your emotional geography
          </Text>
        </View>

        {/* Placeholder card */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 28,
            alignItems: 'center',
            marginBottom: 28,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
          }}
        >
          {/* Icon circle */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: COLORS.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <MapPin size={32} color={COLORS.primary} />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: COLORS.text,
              fontFamily: 'Nunito_700Bold',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            Interactive Map
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: COLORS.textSecondary,
              fontFamily: 'Nunito_400Regular',
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            Open the app on your iOS or Android device to explore your emotional map.
          </Text>

          {/* Mobile badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Smartphone size={16} color={COLORS.primary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: COLORS.primary,
                fontFamily: 'Nunito_600SemiBold',
              }}
            >
              Available on iOS & Android
            </Text>
          </View>
        </View>

        {/* Recent check-ins list */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: COLORS.text,
            fontFamily: 'Nunito_700Bold',
            marginBottom: 14,
          }}
        >
          Recent Check-ins
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : checkIns.length === 0 ? (
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                fontFamily: 'Nunito_400Regular',
                textAlign: 'center',
              }}
            >
              No check-ins yet. Start tracking your mood on the mobile app.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {checkIns.map((item) => {
              const emoji = getMoodEmoji(item.mood_score);
              const moodColor = getMoodColor(item.mood_score);
              const timeLabel = formatRelativeTime(item.created_at);
              const locationText = item.location_label ?? 'Unknown location';

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleCheckInPress(item.id)}
                  style={({ pressed }) => ({
                    backgroundColor: COLORS.surface,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  {/* Mood emoji bubble */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: `${moodColor}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, gap: 3 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <MapPin size={12} color={COLORS.textTertiary} />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: COLORS.text,
                          fontFamily: 'Nunito_600SemiBold',
                          flexShrink: 1,
                        }}
                        numberOfLines={1}
                      >
                        {locationText}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Clock size={12} color={COLORS.textTertiary} />
                      <Text
                        style={{
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          fontFamily: 'Nunito_400Regular',
                        }}
                      >
                        {timeLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Mood score badge */}
                  <View
                    style={{
                      backgroundColor: `${moodColor}18`,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: moodColor,
                        fontFamily: 'Nunito_700Bold',
                      }}
                    >
                      {item.mood_score}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
