import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, MapPin, Activity, Users, Heart, FileText, Clock } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { getCheckInById, deleteCheckIn, CheckIn } from '@/utils/database';
import { getMoodColor, getMoodEmoji, formatRelativeTime, formatTime } from '@/utils/streak';

export default function CheckInDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[CheckIn Detail] Loading check-in:', id);
    if (id) {
      getCheckInById(id).then(data => {
        setCheckIn(data);
        setLoading(false);
        console.log('[CheckIn Detail] Loaded check-in:', data?.mood_label);
      });
    }
  }, [id]);

  const handleDelete = () => {
    console.log('[CheckIn Detail] Delete pressed for:', id);
    Alert.alert(
      'Delete check-in?',
      'This check-in will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete check-in',
          style: 'destructive',
          onPress: async () => {
            console.log('[CheckIn Detail] Confirmed delete:', id);
            if (id) {
              await deleteCheckIn(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>Loading...</Text>
      </View>
    );
  }

  if (!checkIn) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
          Check-in not found
        </Text>
        <AnimatedPressable onPress={() => router.back()}>
          <View style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: '#FFFFFF', fontFamily: 'Nunito_600SemiBold' }}>Go back</Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  const moodColor = getMoodColor(checkIn.mood_score);
  const emoji = getMoodEmoji(checkIn.mood_score);
  const timeStr = formatRelativeTime(checkIn.created_at);
  const exactTime = formatTime(checkIn.created_at);
  const dateStr = new Date(checkIn.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Pressable
          onPress={() => {
            console.log('[CheckIn Detail] Back pressed');
            router.back();
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable>

        <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
          Check-in
        </Text>

        <Pressable
          onPress={handleDelete}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(224,92,92,0.10)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Delete check-in"
        >
          <Trash2 size={18} color={COLORS.danger} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood hero */}
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 24,
          padding: 24,
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Text style={{ fontSize: 64 }}>{emoji}</Text>
          <Text style={{
            fontSize: 28,
            fontWeight: '800',
            color: moodColor,
            fontFamily: 'Nunito_800ExtraBold',
          }}>
            {checkIn.mood_label}
          </Text>
          <View style={{
            backgroundColor: `${moodColor}18`,
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 12,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: moodColor, fontFamily: 'Nunito_700Bold' }}>
              {checkIn.mood_score}/10
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color={COLORS.textTertiary} />
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
              {dateStr} · {exactTime}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
            {timeStr}
          </Text>
        </View>

        {/* Details card */}
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: COLORS.border,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {checkIn.activities.length > 0 && (
            <View style={{ padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Activity size={18} color={COLORS.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                  Activities
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {checkIn.activities.map((a, i) => (
                    <View key={i} style={{
                      backgroundColor: COLORS.primaryMuted,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}>
                      <Text style={{ fontSize: 13, color: COLORS.primary, fontFamily: 'Nunito_600SemiBold' }}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {checkIn.social_context && (
            <>
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginLeft: 46 }} />
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Users size={18} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                    Social context
                  </Text>
                  <Text style={{ fontSize: 15, color: COLORS.text, fontFamily: 'Nunito_400Regular' }}>
                    {checkIn.social_context}
                  </Text>
                </View>
              </View>
            </>
          )}

          {checkIn.physical_sensations.length > 0 && (
            <>
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginLeft: 46 }} />
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Heart size={18} color={COLORS.accent} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                    Physical sensations
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {checkIn.physical_sensations.map((s, i) => (
                      <View key={i} style={{
                        backgroundColor: COLORS.accentMuted,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
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

          {checkIn.location_label && (
            <>
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginLeft: 46 }} />
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MapPin size={18} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                    Location
                  </Text>
                  <Text style={{ fontSize: 15, color: COLORS.text, fontFamily: 'Nunito_400Regular' }}>
                    {checkIn.location_label}
                  </Text>
                </View>
              </View>
            </>
          )}

          {checkIn.notes && (
            <>
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginLeft: 46 }} />
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <FileText size={18} color={COLORS.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                    Notes
                  </Text>
                  <Text style={{ fontSize: 15, color: COLORS.text, fontFamily: 'Nunito_400Regular', lineHeight: 22 }} selectable>
                    {checkIn.notes}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
