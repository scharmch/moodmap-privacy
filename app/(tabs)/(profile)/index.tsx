import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  Shield,
  Database,
  Info,
  ChevronRight,
  Edit2,
  Check,
  Trash2,
  Download,
  FileText,
  Sparkles,
  Crown,
} from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import {
  getAllCheckIns,
  getSetting,
  setSetting,
  clearInsightsCache,
  deleteCheckIn,
  CheckIn,
} from '@/utils/database';
import { calculateStreak, getWeeklyAverage } from '@/utils/streak';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

function SettingRow({ icon, label, value, onPress, showChevron = false, destructive = false }: SettingRowProps) {
  return (
    <AnimatedPressable onPress={onPress} disabled={!onPress}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
      }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: destructive ? 'rgba(224,92,92,0.10)' : COLORS.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </View>
        <Text style={{
          flex: 1,
          fontSize: 15,
          color: destructive ? COLORS.danger : COLORS.text,
          fontFamily: 'Nunito_600SemiBold',
        }}>
          {label}
        </Text>
        {value && (
          <View>{value}</View>
        )}
        {showChevron && (
          <ChevronRight size={16} color={COLORS.textTertiary} />
        )}
      </View>
    </AnimatedPressable>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textTertiary,
        fontFamily: 'Nunito_600SemiBold',
        paddingHorizontal: 4,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {children}
      </View>
    </View>
  );
}

function Divider() {
  return (
    <View style={{
      height: 1,
      backgroundColor: COLORS.divider,
      marginLeft: 64,
    }} />
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [privacyBlur, setPrivacyBlur] = useState(false);

  const loadData = useCallback(async () => {
    console.log('[Profile] Loading profile data...');
    try {
      const [all, name, notifs, blur] = await Promise.all([
        getAllCheckIns(),
        getSetting('display_name', 'Explorer'),
        getSetting('notifications_enabled', 'false'),
        getSetting('privacy_blur', 'false'),
      ]);
      setCheckIns(all);
      setDisplayName(name || 'Explorer');
      setNameInput(name || 'Explorer');
      setNotificationsEnabled(notifs === 'true');
      setPrivacyBlur(blur === 'true');
    } catch (err) {
      console.error('[Profile] Error loading data:', err);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const handleSaveName = async () => {
    console.log('[Profile] Saving display name:', nameInput);
    const trimmed = nameInput.trim() || 'Explorer';
    setDisplayName(trimmed);
    setEditingName(false);
    await setSetting('display_name', trimmed);
  };

  const handleNotificationsToggle = async (val: boolean) => {
    console.log('[Profile] Notifications toggled:', val);
    setNotificationsEnabled(val);
    await setSetting('notifications_enabled', val ? 'true' : 'false');
  };

  const handlePrivacyBlurToggle = async (val: boolean) => {
    console.log('[Profile] Privacy blur toggled:', val);
    setPrivacyBlur(val);
    await setSetting('privacy_blur', val ? 'true' : 'false');
  };

  const handleClearCache = async () => {
    console.log('[Profile] Clear insights cache pressed');
    await clearInsightsCache();
    Alert.alert('Cache cleared', 'AI insights will be refreshed on next visit.');
  };

  const handleClearData = () => {
    console.log('[Profile] Clear all data pressed');
    Alert.alert(
      'Clear all data?',
      'This will permanently delete all your check-ins and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            console.log('[Profile] Confirmed clear all data');
            for (const c of checkIns) {
              await deleteCheckIn(c.id);
            }
            await clearInsightsCache();
            loadData();
            Alert.alert('Data cleared', 'All your data has been deleted.');
          },
        },
      ]
    );
  };

  const streak = calculateStreak(checkIns);
  const weeklyAvg = getWeeklyAverage(checkIns);
  const totalCheckIns = checkIns.length;

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 24,
          gap: 20,
        }}>
          <Text style={{
            fontSize: 28,
            fontWeight: '800',
            color: COLORS.text,
            fontFamily: 'Nunito_800ExtraBold',
            letterSpacing: -0.5,
          }}>
            Profile
          </Text>

          {/* Avatar + name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(74,144,217,0.30)',
            }}>
              <Text style={{
                fontSize: 26,
                fontWeight: '800',
                color: '#FFFFFF',
                fontFamily: 'Nunito_800ExtraBold',
              }}>
                {initials}
              </Text>
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              {editingName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    value={nameInput}
                    onChangeText={setNameInput}
                    style={{
                      flex: 1,
                      fontSize: 20,
                      fontWeight: '700',
                      color: COLORS.text,
                      fontFamily: 'Nunito_700Bold',
                      backgroundColor: COLORS.surfaceSecondary,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1.5,
                      borderColor: COLORS.primary,
                    }}
                    autoFocus
                    onSubmitEditing={handleSaveName}
                    returnKeyType="done"
                    maxLength={30}
                  />
                  <Pressable
                    onPress={handleSaveName}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: COLORS.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel="Save name"
                  >
                    <Check size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: COLORS.text,
                    fontFamily: 'Nunito_800ExtraBold',
                  }}>
                    {displayName}
                  </Text>
                  <Pressable
                    onPress={() => {
                      console.log('[Profile] Edit name pressed');
                      setEditingName(true);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: COLORS.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel="Edit name"
                  >
                    <Edit2 size={14} color={COLORS.primary} />
                  </Pressable>
                </View>
              )}
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                Emotional GPS member
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { label: 'Check-ins', value: String(totalCheckIns) },
              { label: 'Avg mood', value: weeklyAvg > 0 ? weeklyAvg.toFixed(1) : '—' },
              { label: 'Streak', value: `${streak}d` },
            ].map((stat, i) => (
              <View key={i} style={{
                flex: 1,
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                padding: 12,
                alignItems: 'center',
                gap: 4,
                borderWidth: 1,
                borderColor: COLORS.border,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, fontFamily: 'Nunito_800ExtraBold' }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 20 }}>

          {/* Go Premium banner — shown only to free users */}
          {!isSubscribed && (
            <AnimatedPressable onPress={() => {
              console.log('[Profile] Go Premium button pressed');
              router.push('/paywall');
            }}>
              <View style={{
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: COLORS.primary,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                boxShadow: '0 4px 20px rgba(74,144,217,0.35)',
              }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.20)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Crown size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold' }}>
                      Go Premium
                    </Text>
                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Nunito_700Bold', letterSpacing: 0.5 }}>
                        PRO
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Nunito_400Regular' }}>
                    Unlock AI Insights & Weekly Reports
                  </Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </AnimatedPressable>
          )}

          {/* Pro member badge — shown to subscribers */}
          {isSubscribed && (
            <View style={{
              borderRadius: 20,
              backgroundColor: 'rgba(126,200,164,0.12)',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: 'rgba(126,200,164,0.25)',
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: COLORS.accentMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sparkles size={20} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.accent, fontFamily: 'Nunito_700Bold' }}>
                  Premium Member
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                  All features unlocked
                </Text>
              </View>
            </View>
          )}

          {/* Notifications */}
          <SectionCard title="Notifications">
            <SettingRow
              icon={<Bell size={18} color={COLORS.primary} />}
              label="Check-in reminders"
              value={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </SectionCard>

          {/* Privacy */}
          <SectionCard title="Privacy">
            <SettingRow
              icon={<Shield size={18} color={COLORS.primary} />}
              label="Blur exact locations"
              value={
                <Switch
                  value={privacyBlur}
                  onValueChange={handlePrivacyBlurToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <Divider />
            <SettingRow
              icon={<FileText size={18} color={COLORS.primary} />}
              label="Privacy Policy"
              onPress={() => {
                console.log('[Profile] Privacy Policy pressed');
                router.push('/privacy-policy');
              }}
              showChevron
            />
            <Divider />
            <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular', lineHeight: 18 }}>
                🔒 Your data never leaves your device. All check-ins are stored locally using SQLite.
              </Text>
            </View>
          </SectionCard>

          {/* Data */}
          <SectionCard title="Data">
            <SettingRow
              icon={<Download size={18} color={COLORS.primary} />}
              label="Your Data & Export"
              onPress={() => {
                console.log('[Profile] Your Data & Export pressed');
                router.push('/data-export');
              }}
              showChevron
            />
            <Divider />
            <SettingRow
              icon={<Database size={18} color={COLORS.primary} />}
              label="Clear insights cache"
              onPress={handleClearCache}
              showChevron
            />
            <Divider />
            <SettingRow
              icon={<Trash2 size={18} color={COLORS.danger} />}
              label="Clear all data"
              onPress={handleClearData}
              showChevron
              destructive
            />
          </SectionCard>

          {/* About */}
          <SectionCard title="About">
            <SettingRow
              icon={<Info size={18} color={COLORS.primary} />}
              label="Emotional GPS"
              value={
                <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                  v1.0.0
                </Text>
              }
            />
            <Divider />
            <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular', lineHeight: 18, textAlign: 'center' }}>
                Built with care for your emotional wellbeing 💙{'\n'}
                AI insights powered by Emotional GPS API
              </Text>
            </View>
          </SectionCard>

        </View>
      </ScrollView>
    </View>
  );
}
