import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { CheckInStepWrapper } from '@/components/CheckInStepWrapper';
import { useCheckIn } from '@/contexts/CheckInContext';
import * as Haptics from 'expo-haptics';

const SENSATIONS = [
  { label: 'Energetic', emoji: '⚡' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Tense', emoji: '😤' },
  { label: 'Relaxed', emoji: '😌' },
  { label: 'Headache', emoji: '🤕' },
  { label: 'Hungry', emoji: '🍽️' },
  { label: 'Well-rested', emoji: '✨' },
  { label: 'Sick', emoji: '🤒' },
  { label: 'Restless', emoji: '🌀' },
  { label: 'Calm', emoji: '🌊' },
];

export default function Step4() {
  const router = useRouter();
  const { draft, updateDraft } = useCheckIn();

  const toggleSensation = (sensation: string) => {
    console.log('[CheckIn Step 4] Sensation toggled:', sensation);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = draft.physical_sensations;
    if (current.includes(sensation)) {
      updateDraft({ physical_sensations: current.filter(s => s !== sensation) });
    } else {
      updateDraft({ physical_sensations: [...current, sensation] });
    }
  };

  const handleNext = () => {
    console.log('[CheckIn Step 4] Physical sensations confirmed:', draft.physical_sensations);
    router.push('/checkin/step-5');
  };

  return (
    <CheckInStepWrapper
      step={4}
      totalSteps={7}
      title="How does your body feel?"
      subtitle="Select all that apply"
      onNext={handleNext}
      nextLabel="Continue"
    >
      <View style={{ paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {SENSATIONS.map(({ label, emoji }) => {
            const isSelected = draft.physical_sensations.includes(label);
            return (
              <Pressable
                key={label}
                onPress={() => toggleSensation(label)}
                accessibilityRole="button"
                accessibilityLabel={`${label} sensation`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 24,
                  backgroundColor: isSelected ? COLORS.accent : COLORS.surface,
                  borderWidth: 1.5,
                  borderColor: isSelected ? COLORS.accent : COLORS.border,
                  boxShadow: isSelected ? '0 2px 8px rgba(126,200,164,0.30)' : undefined,
                }}
              >
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isSelected ? '#FFFFFF' : COLORS.text,
                  fontFamily: 'Nunito_600SemiBold',
                }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {draft.physical_sensations.length === 0 && (
          <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular', textAlign: 'center', marginTop: 16 }}>
            You can skip this step if nothing applies
          </Text>
        )}
      </View>
    </CheckInStepWrapper>
  );
}
