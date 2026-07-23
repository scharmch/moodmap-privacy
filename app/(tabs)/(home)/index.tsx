import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Flame,
  TrendingUp,
  MapPin,
  Clock,
  Plus,
  CheckCircle,
  BarChart2,
} from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import {
  getAllCheckIns,
  getRecentCheckIns,
  getTodayCheckIns,
  CheckIn,
} from '@/utils/database';
import {
  calculateStreak,
  getWeeklyAverage,
  getMoodColor,
  getMoodEmoji,
  formatRelativeTime,
  formatTime,
} from '@/utils/streak';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

interface CheckInItemProps {
  item: CheckIn;
  index: number;
  onPress: () => void;
}

function CheckInItem({ item, index, onPress }: CheckInItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const moodColor = getMoodColor(item.mood_score);
  const emoji = getMoodEmoji(item.mood_score);
  const timeStr = formatRelativeTime(item.created_at);
  const activities = item.activities.slice(0, 2);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <AnimatedPressable onPress={onPress}>
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        }}>
          {/* Mood indicator */}
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: `${moodColor}18`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: `${moodColor}44`,
          }}>
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: moodColor,
                fontFamily: 'Nunito_700Bold',
              }}>
                {item.mood_label}
              </Text>
              <View style={{
                backgroundColor: `${moodColor}18`,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: moodColor,
                  fontFamily: 'Nunito_700Bold',
                }}>
                  {item.mood_score}/10
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {item.location_label && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <MapPin size={11} color={COLORS.textTertiary} />
                  <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }} numberOfLines={1}>
                    {item.location_label}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Clock size={11} color={COLORS.textTertiary} />
                <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                  {timeStr}
                </Text>
              </View>
            </View>

            {activities.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {activities.map((act, i) => (
                  <View key={i} style={{
                    backgroundColor: COLORS.primaryMuted,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                    <Text style={{ fontSize: 11, color: COLORS.primary, fontFamily: 'Nunito_600SemiBold' }}>
                      {act}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const loadData = useCallback(async () => {
    console.log('[Home] Loading check-in data...');
    try {
      const [all, today, recent] = await Promise.all([
        getAllCheckIns(),
        getTodayCheckIns(),
        getRecentCheckIns(5),
      ]);
      setCheckIns(all);
      setTodayCheckIns(today);
      setRecentCheckIns(recent);
      console.log('[Home] Loaded', all.length, 'total check-ins,', today.length, 'today');
    } catch (err) {
      console.error('[Home] Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const streak = calculateStreak(checkIns);
  const weeklyAvg = getWeeklyAverage(checkIns);
  const totalCheckIns = checkIns.length;
  const todayDone = todayCheckIns.length > 0;
  const latestToday = todayCheckIns[0];

  const greeting = getGreeting();
  const dateStr = getDateString();

  const handleStartCheckIn = () => {
    console.log('[Home] Starting check-in flow');
    router.push('/checkin/step-1');
  };

  const handleCheckInPress = (id: string) => {
    console.log('[Home] Opening check-in detail:', id);
    router.push(`/checkin/${id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header gradient */}
        <LinearGradient
          colors={['#4A90D9', '#7BB3E8', '#B8D8F8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: 32,
            paddingHorizontal: 20,
            gap: 4,
          }}
        >
          <Text style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'Nunito_600SemiBold',
            letterSpacing: 0.5,
          }}>
            {dateStr}
          </Text>
          <Text style={{
            fontSize: 26,
            fontWeight: '800',
            color: '#FFFFFF',
            fontFamily: 'Nunito_800ExtraBold',
            letterSpacing: -0.5,
          }}>
            {greeting} 👋
          </Text>
          <Text style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'Nunito_400Regular',
          }}>
            How are you feeling today?
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, gap: 20, marginTop: -16 }}>

          {/* Today's mood card */}
          {todayDone && latestToday ? (
            <AnimatedPressable onPress={() => handleCheckInPress(latestToday.id)}>
              <View style={{
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: COLORS.border,
                boxShadow: '0 2px 8px rgba(74,144,217,0.12), 0 8px 24px rgba(74,144,217,0.06)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={16} color={COLORS.accent} />
                      <Text style={{ fontSize: 13, color: COLORS.accent, fontFamily: 'Nunito_600SemiBold' }}>
                        Today's check-in
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 22,
                      fontWeight: '800',
                      color: getMoodColor(latestToday.mood_score),
                      fontFamily: 'Nunito_800ExtraBold',
                    }}>
                      {getMoodEmoji(latestToday.mood_score)} {latestToday.mood_label}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                      {formatTime(latestToday.created_at)}
                      {latestToday.location_label ? ` · ${latestToday.location_label}` : ''}
                    </Text>
                  </View>
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: `${getMoodColor(latestToday.mood_score)}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: `${getMoodColor(latestToday.mood_score)}44`,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: getMoodColor(latestToday.mood_score), fontFamily: 'Nunito_800ExtraBold' }}>
                      {latestToday.mood_score}
                    </Text>
                    <Text style={{ fontSize: 10, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>/10</Text>
                  </View>
                </View>
              </View>
            </AnimatedPressable>
          ) : (
            <AnimatedPressable onPress={handleStartCheckIn}>
              <LinearGradient
                colors={['rgba(74,144,217,0.08)', 'rgba(74,144,217,0.04)']}
                style={{
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1.5,
                  borderColor: 'rgba(74,144,217,0.20)',
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 32 }}>🌤️</Text>
                <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                  How are you feeling?
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', textAlign: 'center' }}>
                  Start your daily check-in to track your emotional journey
                </Text>
                <View style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 12,
                  marginTop: 4,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Nunito_700Bold' }}>
                    Check in now
                  </Text>
                </View>
              </LinearGradient>
            </AnimatedPressable>
          )}

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Streak */}
            <View style={{
              flex: 1,
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 14,
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <Flame size={20} color={COLORS.warning} />
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, fontFamily: 'Nunito_800ExtraBold' }}>
                {streak}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                Day streak
              </Text>
            </View>

            {/* Weekly avg */}
            <View style={{
              flex: 1,
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 14,
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <TrendingUp size={20} color={COLORS.primary} />
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, fontFamily: 'Nunito_800ExtraBold' }}>
                {weeklyAvg > 0 ? weeklyAvg.toFixed(1) : '—'}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                Weekly avg
              </Text>
            </View>

            {/* Total */}
            <View style={{
              flex: 1,
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 14,
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <BarChart2 size={20} color={COLORS.accent} />
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, fontFamily: 'Nunito_800ExtraBold' }}>
                {totalCheckIns}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                Total
              </Text>
            </View>
          </View>

          {/* Streak motivation */}
          {streak > 0 && (
            <View style={{
              backgroundColor: 'rgba(245,166,35,0.08)',
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: 'rgba(245,166,35,0.20)',
            }}>
              <Text style={{ fontSize: 24 }}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                  {streak} day streak!
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                  {streak >= 7 ? "You're on fire! Keep it up 🌟" : "Keep checking in daily to build your streak"}
                </Text>
              </View>
            </View>
          )}

          {/* Recent check-ins */}
          {recentCheckIns.length > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: COLORS.text,
                  fontFamily: 'Nunito_700Bold',
                }}>
                  Recent check-ins
                </Text>
                <Pressable onPress={() => console.log('[Home] View all check-ins pressed')}>
                  <Text style={{ fontSize: 14, color: COLORS.primary, fontFamily: 'Nunito_600SemiBold' }}>
                    View all
                  </Text>
                </Pressable>
              </View>

              {recentCheckIns.map((item, index) => (
                <CheckInItem
                  key={item.id}
                  item={item}
                  index={index}
                  onPress={() => handleCheckInPress(item.id)}
                />
              ))}
            </View>
          )}

          {recentCheckIns.length === 0 && !loading && (
            <View style={{
              alignItems: 'center',
              paddingVertical: 32,
              gap: 12,
            }}>
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: COLORS.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 32 }}>🌱</Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                Start your journey
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', textAlign: 'center', maxWidth: 260 }}>
                Your check-ins will appear here. Start tracking your emotional wellbeing today.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Animated.View style={{
        position: 'absolute',
        bottom: insets.bottom + 90,
        right: 20,
        transform: [{ scale: pulseAnim }],
      }}>
        <AnimatedPressable onPress={handleStartCheckIn} scaleValue={0.94}>
          <View style={{
            backgroundColor: COLORS.primary,
            borderRadius: 28,
            paddingHorizontal: 20,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(74,144,217,0.40), 0 8px 32px rgba(74,144,217,0.20)',
          }}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Nunito_700Bold' }}>
              Check in
            </Text>
          </View>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}
