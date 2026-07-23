import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';

export default function InsightDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const titles: Record<string, string> = {
    triggers: 'Emotional Triggers',
    safe_spaces: 'Safe Spaces',
    patterns: 'Emotional Patterns',
    stress: 'Stress Patterns',
  };

  const title = titles[type || ''] || 'Insight Details';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
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
            console.log('[Insight Detail] Back pressed, type:', type);
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
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, fontFamily: 'Nunito_800ExtraBold' }}>
          {title}
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 }}>
        <Text style={{ fontSize: 40 }}>🔍</Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold', textAlign: 'center' }}>
          Deep dive coming soon
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular', textAlign: 'center' }}>
          Detailed {title.toLowerCase()} analysis will be available in a future update.
        </Text>
      </View>
    </View>
  );
}
