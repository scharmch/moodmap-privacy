import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Activity, Users, Heart, FileText, Check } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useCheckIn } from '@/contexts/CheckInContext';
import { saveCheckIn } from '@/utils/database';
import { getMoodColor, getMoodEmoji } from '@/utils/streak';
import * as Haptics from 'expo-haptics';

// Simple particle confetti
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const xOffset = (Math.random() - 0.5) * 300;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 400, duration: 1200, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: xOffset, duration: 1200, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotateInterp = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 0,
      left: '50%',
      width: 10,
      height: 10,
      borderRadius: 2,
      backgroundColor: color,
      opacity,
      transform: [{ translateY }, { translateX }, { rotate: rotateInterp }],
    }} />
  );
}

const CONFETTI_COLORS = ['#4A90D9', '#7EC8A4', '#FFD166', '#F5A623', '#C47ED4', '#E05C5C'];

export default function Step7() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, resetDraft } = useCheckIn();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;

  const moodColor = getMoodColor(draft.mood_score);
  const emoji = getMoodEmoji(draft.mood_score);

  const handleSave = async () => {
    if (saving || saved) return;
    console.log('[CheckIn Step 7] Saving check-in...');
    setSaving(true);

    try {
      const now = new Date().toISOString();
      const id = `checkin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await saveCheckIn({
        id,
        mood_score: draft.mood_score,
        mood_label: draft.mood_label,
        activities: draft.activities,
        social_context: draft.social_context,
        physical_sensations: draft.physical_sensations,
        latitude: draft.latitude,
        longitude: draft.longitude,
        location_label: draft.location_label,
        location_blurred: false,
        notes: draft.notes.trim() || null,
        voice_note_uri: draft.voice_note_uri,
        created_at: now,
        updated_at: now,
      });

      console.log('[CheckIn Step 7] Check-in saved successfully, id:', id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setShowConfetti(true);

      Animated.spring(successScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 12,
      }).start();

      setTimeout(() => {
        resetDraft();
        router.replace('/(tabs)/(home)');
      }, 2000);
    } catch (err) {
      console.error('[CheckIn Step 7] Error saving check-in:', err);
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Confetti */}
      {showConfetti && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 100 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <ConfettiParticle
              key={i}
              delay={i * 50}
              color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
            />
          ))}
        </View>
      )}

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: 7 }, (_, i) => (
              <View
                key={i}
                style={{
                  width: i < 6 ? 8 : 20,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: COLORS.primary,
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 4, alignItems: 'center' }}>
          <Text style={{
            fontSize: 12,
            color: COLORS.primary,
            fontFamily: 'Nunito_600SemiBold',
            letterSpacing: 0.5,
          }}>
            STEP 7 OF 7
          </Text>
          <Text style={{
            fontSize: 24,
            fontWeight: '800',
            color: COLORS.text,
            fontFamily: 'Nunito_800ExtraBold',
            letterSpacing: -0.3,
          }}>
            Review & save
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood summary card */}
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 20,
          padding: 20,
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Text style={{ fontSize: 56 }}>{emoji}</Text>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{
              fontSize: 26,
              fontWeight: '800',
              color: moodColor,
              fontFamily: 'Nunito_800ExtraBold',
            }}>
              {draft.mood_label}
            </Text>
            <View style={{
              backgroundColor: `${moodColor}18`,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 10,
            }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: moodColor, fontFamily: 'Nunito_700Bold' }}>
                {draft.mood_score}/10
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: COLORS.border,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {draft.activities.length > 0 && (
            <View style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Activity size={18} color={COLORS.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                  Activities
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {draft.activities.map((a, i) => (
                    <View key={i} style={{
                      backgroundColor: COLORS.primaryMuted,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }}>
                      <Text style={{ fontSize: 13, color: COLORS.primary, fontFamily: 'Nunito_600SemiBold' }}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {draft.social_context && (
            <>
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginLeft: 44 }} />
              <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Users size={18} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                    Social context
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.text, fontFamily: 'Nunito_400Regular' }}>
                    {draft.social_context}
                  </Text>
                </View>
              </View>
            </>
          )}

          {draft.physical_sensations.length > 0 && (
            <>
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginLeft: 44 }} />
              <View style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Heart size={18} color={COLORS.accent} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                    Physical sensations
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {draft.physical_sensations.map((s, i) => (
                      <View key={i} style={{
                        backgroundColor: COLORS.accentMuted,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}>
                        <Text style={{ fontSize: 13, color: COLORS.accent, fontFamily: 'Nunito_600SemiBold' }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}

          {draft.location_label && (
            <>
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginLeft: 44 }} />
              <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MapPin size={18} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                    Location
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.text, fontFamily: 'Nunito_400Regular' }}>
                    {draft.location_label}
                  </Text>
                </View>
              </View>
            </>
          )}

          {draft.notes.trim() && (
            <>
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginLeft: 44 }} />
              <View style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <FileText size={18} color={COLORS.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                    Notes
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.text, fontFamily: 'Nunito_400Regular', lineHeight: 20 }} numberOfLines={3}>
                    {draft.notes}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 20,
        paddingTop: 16,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
      }}>
        {saved ? (
          <Animated.View style={{ transform: [{ scale: successScale }] }}>
            <View style={{
              backgroundColor: COLORS.accent,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}>
              <Check size={20} color="#FFFFFF" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Nunito_700Bold' }}>
                Check-in saved! 🎉
              </Text>
            </View>
          </Animated.View>
        ) : (
          <AnimatedPressable onPress={handleSave} disabled={saving}>
            <View style={{
              backgroundColor: COLORS.primary,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              boxShadow: '0 4px 16px rgba(74,144,217,0.35)',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Nunito_700Bold' }}>
                {saving ? 'Saving...' : 'Save check-in'}
              </Text>
            </View>
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}
