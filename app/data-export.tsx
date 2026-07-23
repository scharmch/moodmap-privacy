import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, Trash2, Database } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { getAllCheckIns, deleteAllCheckIns, CheckIn } from '@/utils/database';

export default function DataExportScreen() {
  const insets = useSafeAreaInsets();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    console.log('[DataExport] Loading check-ins...');
    try {
      const all = await getAllCheckIns();
      setCheckIns(all);
      console.log('[DataExport] Loaded', all.length, 'check-ins');
    } catch (err) {
      console.error('[DataExport] Error loading check-ins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    console.log('[DataExport] Export button pressed, check-ins:', checkIns.length);
    if (checkIns.length === 0) {
      Alert.alert('No data', 'You have no check-ins to export yet.');
      return;
    }
    setExporting(true);
    try {
      const exportPayload = {
        app: 'MoodMap AI',
        exported_at: new Date().toISOString(),
        total_check_ins: checkIns.length,
        check_ins: checkIns,
      };
      const jsonString = JSON.stringify(exportPayload, null, 2);
      console.log('[DataExport] Sharing JSON export, size:', jsonString.length, 'chars');
      await Share.share({
        title: 'MoodMap AI — My Data Export',
        message: jsonString,
      });
    } catch (err) {
      console.error('[DataExport] Export error:', err);
      Alert.alert('Export failed', 'Could not export your data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAll = () => {
    console.log('[DataExport] Delete all data pressed');
    Alert.alert(
      'Delete all data?',
      `This will permanently delete all ${checkIns.length} check-in${checkIns.length !== 1 ? 's' : ''} from your device. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            console.log('[DataExport] Confirmed delete all data');
            setDeleting(true);
            try {
              await deleteAllCheckIns();
              setCheckIns([]);
              console.log('[DataExport] All data deleted successfully');
              Alert.alert('Data deleted', 'All your check-ins have been permanently deleted.');
            } catch (err) {
              console.error('[DataExport] Delete error:', err);
              Alert.alert('Error', 'Could not delete your data. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const totalCheckIns = checkIns.length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Your Data',
          headerBackTitle: 'Profile',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.primary,
          headerTitleStyle: { fontFamily: 'Nunito_700Bold', color: COLORS.text },
        }}
      />
      <View style={{ flex: 1, backgroundColor: '#F0F7FF' }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header card */}
          <View style={{
            backgroundColor: COLORS.primary,
            borderRadius: 16,
            padding: 20,
            marginBottom: 28,
          }}>
            <Text style={{
              fontSize: 22,
              fontFamily: 'Nunito_800ExtraBold',
              color: '#FFFFFF',
              marginBottom: 4,
            }}>
              Your Data
            </Text>
            <Text style={{
              fontSize: 13,
              fontFamily: 'Nunito_400Regular',
              color: 'rgba(255,255,255,0.80)',
            }}>
              All data is stored locally on your device only.
            </Text>
          </View>

          {/* Stats card */}
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 20,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: COLORS.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Database size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              {loading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <>
                  <Text style={{
                    fontSize: 28,
                    fontFamily: 'Nunito_800ExtraBold',
                    color: COLORS.text,
                    lineHeight: 32,
                  }}>
                    {totalCheckIns}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontFamily: 'Nunito_400Regular',
                    color: COLORS.textSecondary,
                  }}>
                    total check-in{totalCheckIns !== 1 ? 's' : ''} stored
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Privacy note */}
          <View style={{
            backgroundColor: COLORS.primaryMuted,
            borderRadius: 12,
            padding: 14,
            marginBottom: 28,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            <Text style={{
              fontSize: 13,
              fontFamily: 'Nunito_400Regular',
              color: COLORS.textSecondary,
              lineHeight: 20,
            }}>
              🔒 Your mood data, voice notes, and location check-ins are stored exclusively in a local SQLite database on this device. Nothing is uploaded to any server.
            </Text>
          </View>

          {/* Export button */}
          <AnimatedPressable onPress={handleExport} disabled={exporting || loading}>
            <View style={{
              backgroundColor: COLORS.primary,
              borderRadius: 14,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 12,
              opacity: exporting || loading ? 0.6 : 1,
            }}>
              {exporting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Download size={20} color="#FFFFFF" />
              )}
              <Text style={{
                fontSize: 16,
                fontFamily: 'Nunito_700Bold',
                color: '#FFFFFF',
              }}>
                {exporting ? 'Preparing export...' : 'Export Data as JSON'}
              </Text>
            </View>
          </AnimatedPressable>

          <Text style={{
            fontSize: 12,
            fontFamily: 'Nunito_400Regular',
            color: COLORS.textTertiary,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 18,
          }}>
            Exports all check-ins as a JSON file you can save or share.
          </Text>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: COLORS.divider, marginBottom: 32 }} />

          {/* Delete button */}
          <AnimatedPressable onPress={handleDeleteAll} disabled={deleting || loading || totalCheckIns === 0}>
            <View style={{
              backgroundColor: 'rgba(224,92,92,0.08)',
              borderRadius: 14,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderWidth: 1.5,
              borderColor: 'rgba(224,92,92,0.25)',
              opacity: deleting || loading || totalCheckIns === 0 ? 0.5 : 1,
            }}>
              {deleting ? (
                <ActivityIndicator color={COLORS.danger} size="small" />
              ) : (
                <Trash2 size={20} color={COLORS.danger} />
              )}
              <Text style={{
                fontSize: 16,
                fontFamily: 'Nunito_700Bold',
                color: COLORS.danger,
              }}>
                {deleting ? 'Deleting...' : 'Delete All Data'}
              </Text>
            </View>
          </AnimatedPressable>

          <Text style={{
            fontSize: 12,
            fontFamily: 'Nunito_400Regular',
            color: COLORS.textTertiary,
            textAlign: 'center',
            marginTop: 10,
            lineHeight: 18,
          }}>
            Permanently removes all check-ins from this device.{'\n'}This action cannot be undone.
          </Text>

        </ScrollView>
      </View>
    </>
  );
}
