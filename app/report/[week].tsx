import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, Star, BarChart2 } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { MoodDistributionBar } from '@/components/MoodDistributionBar';
import { getCheckInsForPeriod } from '@/utils/database';
import { fetchWeeklyReport, WeeklyReport } from '@/utils/api';
import { getMoodColor, getMoodEmoji } from '@/utils/streak';

export default function WeeklyReportScreen() {
  const { week } = useLocalSearchParams<{ week: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Weekly Report] Loading report for week:', week);
    loadReport();
  }, [week]);

  const loadReport = async () => {
    try {
      const checkIns = await getCheckInsForPeriod(14);
      const weekStart = week || new Date().toISOString().split('T')[0];
      const data = await fetchWeeklyReport(checkIns, weekStart);
      setReport(data);
      console.log('[Weekly Report] Report loaded, avg mood:', data.avg_mood);
    } catch (err) {
      console.error('[Weekly Report] Error:', err);
      setError('Could not load your weekly report. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const weekLabel = week
    ? new Date(week).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'This week';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <Pressable
          onPress={() => {
            console.log('[Weekly Report] Back pressed');
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
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, fontFamily: 'Nunito_800ExtraBold' }}>
            Weekly report
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
            Week of {weekLabel}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
            Generating your report...
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold', textAlign: 'center' }}>
            Couldn't load report
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', textAlign: 'center' }}>
            {error}
          </Text>
          <AnimatedPressable onPress={loadReport}>
            <View style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: 15 }}>Try again</Text>
            </View>
          </AnimatedPressable>
        </View>
      ) : report ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avg mood */}
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 20,
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <Text style={{ fontSize: 48 }}>{getMoodEmoji(Math.round(Number(report.avg_mood)))}</Text>
            <Text style={{
              fontSize: 36,
              fontWeight: '800',
              color: getMoodColor(Math.round(Number(report.avg_mood))),
              fontFamily: 'Nunito_800ExtraBold',
            }}>
              {Number(report.avg_mood).toFixed(1)}
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
              Average mood this week
            </Text>
          </View>

          {/* Narrative */}
          {report.narrative && (
            <View style={{
              backgroundColor: COLORS.primaryMuted,
              borderRadius: 16,
              padding: 16,
              gap: 8,
              borderWidth: 1,
              borderColor: 'rgba(74,144,217,0.15)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color={COLORS.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary, fontFamily: 'Nunito_700Bold' }}>
                  Weekly summary
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: COLORS.text, fontFamily: 'Nunito_400Regular', lineHeight: 22 }}>
                {report.narrative}
              </Text>
            </View>
          )}

          {/* Highlights */}
          {report.highlights && report.highlights.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                Highlights
              </Text>
              {report.highlights.map((h, i) => (
                <View key={i} style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}>
                  <Star size={16} color={COLORS.warning} style={{ marginTop: 2 }} />
                  <Text style={{ fontSize: 14, color: COLORS.text, fontFamily: 'Nunito_400Regular', flex: 1, lineHeight: 20 }}>
                    {h}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Mood distribution */}
          {report.mood_distribution && (
            <View style={{
              backgroundColor: COLORS.surface,
              borderRadius: 20,
              padding: 16,
              gap: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={18} color={COLORS.primary} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                  Mood distribution
                </Text>
              </View>
              <MoodDistributionBar
                data={[
                  { label: 'Great (8-10)', count: report.mood_distribution.great || 0, color: COLORS.accent },
                  { label: 'Good (6-7)', count: report.mood_distribution.good || 0, color: COLORS.primary },
                  { label: 'Neutral (4-5)', count: report.mood_distribution.neutral || 0, color: COLORS.warning },
                  { label: 'Low (1-3)', count: report.mood_distribution.low || 0, color: COLORS.danger },
                ]}
                total={
                  (report.mood_distribution.great || 0) +
                  (report.mood_distribution.good || 0) +
                  (report.mood_distribution.neutral || 0) +
                  (report.mood_distribution.low || 0)
                }
              />
            </View>
          )}

          {/* Top activities */}
          {report.top_activities && report.top_activities.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                Top activities
              </Text>
              {report.top_activities.map((act, i) => {
                const avgMoodDisplay = Number(act.avg_mood).toFixed(1);
                return (
                  <View key={i} style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: COLORS.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary, fontFamily: 'Nunito_700Bold' }}>
                        {i + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                        {act.activity}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                        {act.count} times
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: `${getMoodColor(Math.round(Number(act.avg_mood)))}18`,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 10,
                    }}>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: getMoodColor(Math.round(Number(act.avg_mood))),
                        fontFamily: 'Nunito_700Bold',
                      }}>
                        {getMoodEmoji(Math.round(Number(act.avg_mood)))} {avgMoodDisplay}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}
