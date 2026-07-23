import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { CheckInStepWrapper } from '@/components/CheckInStepWrapper';
import { useCheckIn } from '@/contexts/CheckInContext';
import * as Haptics from 'expo-haptics';

const SOCIAL_OPTIONS = [
  { label: 'Alone', emoji: '🧘' },
  { label: 'With Partner', emoji: '💑' },
  { label: 'With Friends', emoji: '👫' },
  { label: 'With Family', emoji: '👨‍👩‍👧' },
  { label: 'With Colleagues', emoji: '👔' },
  { label: 'In a Crowd', emoji: '👥' },
  { label: 'Online/Virtual', emoji: '💻' },
];

export default function Step3() {
  const router = useRouter();
  const { draft, updateDraft } = useCheckIn();

  const handleSelect = (option: string) => {
    console.log('[CheckIn Step 3] Social context selected:', option);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateDraft({ social_context: option });
  };

  const handleNext = () => {
    console.log('[CheckIn Step 3] Social context confirmed:', draft.social_context);
    router.push('/checkin/step-4');
  };

  return (
    <CheckInStepWrapper
      step={3}
      totalSteps={7}
      title="Who are you with?"
      subtitle="Select your social context"
      onNext={handleNext}
      nextLabel="Continue"
    >
      <View style={{ paddingTop: 16, gap: 12 }}>
        {SOCIAL_OPTIONS.map(({ label, emoji }) => {
          const isSelected = draft.social_context === label;
          return (
            <Pressable
              key={label}
              onPress={() => handleSelect(label)}
              accessibilityRole="button"
              accessibilityLabel={label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: 16,
                backgroundColor: isSelected ? COLORS.primaryMuted : COLORS.surface,
                borderWidth: 1.5,
                borderColor: isSelected ? COLORS.primary : COLORS.border,
                boxShadow: isSelected ? '0 2px 8px rgba(74,144,217,0.15)' : undefined,
              }}
            >
              <Text style={{ fontSize: 24 }}>{emoji}</Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: isSelected ? COLORS.primary : COLORS.text,
                fontFamily: 'Nunito_600SemiBold',
                flex: 1,
              }}>
                {label}
              </Text>
              {isSelected && (
                <View style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12 }}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </CheckInStepWrapper>
  );
}
