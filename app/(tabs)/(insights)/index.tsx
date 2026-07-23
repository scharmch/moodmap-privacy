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
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Sparkles,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Heart,
  Wind,
  BookOpen,
  Zap,
  TreePine,
  Users,
  RefreshCw,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { MoodLineChart } from '@/components/MoodLineChart';
import { MoodDistributionBar } from '@/components/MoodDistributionBar';
import {
  getAllCheckIns,
  getCheckInsForPeriod,
  getCachedInsights,
  setCachedInsights,
  CheckIn,
} from '@/utils/database';
import { fetchInsights, InsightsResponse, CopingStrategy, fetchCopingStrategies } from '@/utils/api';
import { getMoodColor, getMoodEmoji } from '@/utils/streak';
import { useWindowDimensions } from 'react-native';

const COPING_ICONS: Record<string, React.ReactNode> = {
  mindfulness: <Heart size={20} color={COLORS.accent} />,
  grounding: <TreePine size={20} color={COLORS.accent} />,
  journaling: <BookOpen size={20} color={COLORS.primary} />,
  movement: <Zap size={20} color={COLORS.warning} />,
  breathing: <Wind size={20} color={COLORS.primary} />,
  social: <Users size={20} color={COLORS.accent} />,
  nature: <TreePine size={20} color={COLORS.accent} />,
};

function buildChartData(checkIns: CheckIn[]) {
  const days: { date: string; label: string; scores: number[] }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    days.push({ date: dateStr, label, scores: [] });
  }

  checkIns.forEach(c => {
    const dateStr = c.created_at.split('T')[0];
    const day = days.find(d => d.date === dateStr);
    if (day) day.scores.push(c.mood_score);
  });

  return days.map(d => ({
    date: d.date,
    label: d.label,
    value: d.scores.length > 0 ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length : 0,
  })).filter(d => d.value > 0);
}

function buildDistributionData(checkIns: CheckIn[]) {
  const counts = { low: 0, neutral: 0, good: 0, great: 0 };
  checkIns.forEach(c => {
    if (c.mood_score <= 3) counts.low++;
    else if (c.mood_score <= 5) counts.neutral++;
    else if (c.mood_score <= 7) counts.good++;
    else counts.great++;
  });
  return [
    { label: 'Great (8-10)', count: counts.great, color: COLORS.accent },
    { label: 'Good (6-7)', count: counts.good, color: COLORS.primary },
    { label: 'Neutral (4-5)', count: counts.neutral, color: COLORS.warning },
    { label: 'Low (1-3)', count: counts.low, color: COLORS.danger },
  ];
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [copingStrategies, setCopingStrategies] = useState<CopingStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadInsights = useCallback(async (forceRefresh = false) => {
    console.log('[Insights] Loading insights, forceRefresh:', forceRefresh);
    try {
      const [all, recent] = await Promise.all([
        getAllCheckIns(),
        getCheckInsForPeriod(30),
      ]);
      setCheckIns(all);

      // Check cache
      const cached = await getCachedInsights('main');
      const cacheAge = cached
        ? (Date.now() - new Date(cached.generated_at).getTime()) / 1000 / 60 / 60
        : Infinity;

      if (!forceRefresh && cached && cacheAge < 24) {
        console.log('[Insights] Using cached insights, age:', cacheAge.toFixed(1), 'hours');
        setInsights(JSON.parse(cached.content));
      } else {
        console.log('[Insights] Fetching fresh insights from API...');
        try {
          const data = await fetchInsights(recent, 30);
          setInsights(data);
          await setCachedInsights('main', data);
          setError(null);
        } catch (apiErr) {
          console.error('[Insights] API error:', apiErr);
          if (cached) {
            console.log('[Insights] Falling back to cached insights');
            setInsights(JSON.parse(cached.content));
          } else {
            setError('Could not load AI insights. Check your connection and try again.');
          }
        }
      }

      // Load coping strategies
      const latestMood = all[0]?.mood_score || 5;
      try {
        const strategies = await fetchCopingStrategies(recent.slice(0, 10), latestMood);
        setCopingStrategies(strategies);
      } catch {
        console.log('[Insights] Coping strategies unavailable');
      }

    } catch (err) {
      console.error('[Insights] Error loading data:', err);
      setError('Something went wrong loading your insights.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadInsights();
  }, [loadInsights]));

  const onRefresh = useCallback(() => {
    console.log('[Insights] Manual refresh triggered');
    setRefreshing(true);
    loadInsights(true);
  }, [loadInsights]);

  const chartData = buildChartData(checkIns.slice(0, 50));
  const distributionData = buildDistributionData(checkIns.slice(0, 50));
  const totalForDist = distributionData.reduce((a, b) => a + b.count, 0);
  const chartWidth = width - 40 - 32; // screen padding + card padding

  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  })();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ gap: 2 }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '800',
              color: COLORS.text,
              fontFamily: 'Nunito_800ExtraBold',
              letterSpacing: -0.5,
            }}>
              Insights
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
              AI-powered emotional patterns
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={20} color={COLORS.primary} />
            <AnimatedPressable onPress={onRefresh}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: COLORS.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <RefreshCw size={16} color={COLORS.primary} />
              </View>
            </AnimatedPressable>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, gap: 20 }}>

          {/* Mood trend chart */}
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                7-day mood trend
              </Text>
              <TrendingUp size={18} color={COLORS.primary} />
            </View>
            {chartData.length > 0 ? (
              <>
                <MoodLineChart data={chartData} width={chartWidth} height={140} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  {chartData.map((d, i) => (
                    <Text key={i} style={{ fontSize: 11, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                      {d.label}
                    </Text>
                  ))}
                </View>
              </>
            ) : (
              <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: COLORS.textTertiary, fontSize: 14, fontFamily: 'Nunito_400Regular' }}>
                  Check in daily to see your trend
                </Text>
              </View>
            )}
          </View>

          {/* Mood distribution */}
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold', marginBottom: 12 }}>
              Mood distribution
            </Text>
            <MoodDistributionBar data={distributionData} total={totalForDist} />
          </View>

          {/* Loading state */}
          {loading && (
            <View style={{ gap: 16 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          )}

          {/* Error state */}
          {error && !loading && (
            <View style={{
              backgroundColor: 'rgba(224,92,92,0.08)',
              borderRadius: 16,
              padding: 16,
              gap: 8,
              borderWidth: 1,
              borderColor: 'rgba(224,92,92,0.20)',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.danger, fontFamily: 'Nunito_700Bold' }}>
                Couldn't load AI insights
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                {error}
              </Text>
              <AnimatedPressable onPress={onRefresh}>
                <View style={{
                  backgroundColor: COLORS.danger,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                  marginTop: 4,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Nunito_700Bold' }}>
                    Try again
                  </Text>
                </View>
              </AnimatedPressable>
            </View>
          )}

          {/* AI Insights */}
          {insights && !loading && (
            <>
              {/* Narrative */}
              {insights.narrative && (
                <View style={{
                  backgroundColor: COLORS.primaryMuted,
                  borderRadius: 20,
                  padding: 16,
                  gap: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(74,144,217,0.15)',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} color={COLORS.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary, fontFamily: 'Nunito_700Bold' }}>
                      AI Summary
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: COLORS.text, fontFamily: 'Nunito_400Regular', lineHeight: 22 }}>
                    {insights.narrative}
                  </Text>
                </View>
              )}

              {/* Patterns */}
              {insights.patterns && insights.patterns.length > 0 && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                    Emotional patterns
                  </Text>
                  {insights.patterns.map((pattern, i) => {
                    const impactColor = pattern.mood_impact >= 0 ? COLORS.accent : COLORS.danger;
                    const impactSign = pattern.mood_impact >= 0 ? '+' : '';
                    const impactVal = Number(pattern.mood_impact).toFixed(1);
                    return (
                      <View key={i} style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 16,
                        padding: 16,
                        gap: 8,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ fontSize: 20 }}>{pattern.icon || '✨'}</Text>
                              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold', flex: 1 }} numberOfLines={2}>
                                {pattern.title}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', lineHeight: 20 }}>
                              {pattern.description}
                            </Text>
                          </View>
                          <View style={{
                            backgroundColor: `${impactColor}18`,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            marginLeft: 8,
                          }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: impactColor, fontFamily: 'Nunito_700Bold' }}>
                              {impactSign}{impactVal}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Safe spaces */}
              {insights.safe_spaces && insights.safe_spaces.length > 0 && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                    Emotional safe spaces
                  </Text>
                  {insights.safe_spaces.map((space, i) => {
                    const avgMoodDisplay = Number(space.avg_mood).toFixed(1);
                    return (
                      <View key={i} style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 16,
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: COLORS.accentMuted,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <MapPin size={18} color={COLORS.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }} numberOfLines={1}>
                            {space.location}
                          </Text>
                          <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                            {space.visit_count} visits
                          </Text>
                        </View>
                        <View style={{
                          backgroundColor: COLORS.accentMuted,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 10,
                        }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.accent, fontFamily: 'Nunito_700Bold' }}>
                            {getMoodEmoji(Math.round(Number(space.avg_mood)))} {avgMoodDisplay}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Triggers */}
              {insights.triggers && insights.triggers.length > 0 && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                    Emotional triggers
                  </Text>
                  {insights.triggers.map((trigger, i) => {
                    const impact = Number(trigger.avg_mood_impact);
                    const impactColor = impact >= 0 ? COLORS.accent : COLORS.danger;
                    const impactSign = impact >= 0 ? '+' : '';
                    return (
                      <View key={i} style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 16,
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: `${impactColor}18`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <AlertTriangle size={18} color={impactColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }} numberOfLines={1}>
                            {trigger.trigger}
                          </Text>
                          <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                            {trigger.frequency}x this period
                          </Text>
                        </View>
                        <View style={{
                          backgroundColor: `${impactColor}18`,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: impactColor, fontFamily: 'Nunito_700Bold' }}>
                            {impactSign}{impact.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Stress patterns */}
              {insights.stress_patterns && insights.stress_patterns.length > 0 && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                    Stress patterns
                  </Text>
                  {insights.stress_patterns.map((sp, i) => (
                    <View key={i} style={{
                      backgroundColor: 'rgba(224,92,92,0.06)',
                      borderRadius: 16,
                      padding: 14,
                      gap: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(224,92,92,0.12)',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold', flex: 1 }} numberOfLines={1}>
                          {sp.pattern}
                        </Text>
                        <View style={{
                          backgroundColor: 'rgba(224,92,92,0.12)',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.danger, fontFamily: 'Nunito_600SemiBold' }}>
                            {sp.frequency}x
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', lineHeight: 20 }}>
                        {sp.description}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Coping strategies */}
          {copingStrategies.length > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                Coping strategies
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              >
                {copingStrategies.map((strategy, i) => {
                  const durationDisplay = `${strategy.duration_minutes} min`;
                  return (
                    <View key={i} style={{
                      backgroundColor: COLORS.surface,
                      borderRadius: 16,
                      padding: 16,
                      width: 200,
                      gap: 10,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.accentMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {COPING_ICONS[strategy.type] || <Heart size={20} color={COLORS.accent} />}
                      </View>
                      <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }} numberOfLines={2}>
                          {strategy.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', lineHeight: 18 }} numberOfLines={3}>
                          {strategy.description}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: COLORS.primaryMuted,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        alignSelf: 'flex-start',
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary, fontFamily: 'Nunito_600SemiBold' }}>
                          {durationDisplay}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Weekly report CTA */}
          <AnimatedPressable onPress={() => {
            console.log('[Insights] View weekly report pressed, week:', weekStart);
            router.push(`/report/${weekStart}`);
          }}>
            <View style={{
              backgroundColor: COLORS.primary,
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(74,144,217,0.30)',
            }}>
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Nunito_700Bold' }}>
                  Weekly report
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Nunito_400Regular' }}>
                  View your full emotional summary
                </Text>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
            </View>
          </AnimatedPressable>

        </Animated.View>
      </ScrollView>
    </View>
  );
}
