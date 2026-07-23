import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { CheckInStepWrapper } from '@/components/CheckInStepWrapper';
import { useCheckIn } from '@/contexts/CheckInContext';
import * as Haptics from 'expo-haptics';

const ACTIVITIES = [
  { label: 'Work', emoji: '💼' },
  { label: 'Exercise', emoji: '🏃' },
  { label: 'Social', emoji: '👥' },
  { label: 'Rest', emoji: '😴' },
  { label: 'Commute', emoji: '🚌' },
  { label: 'Eating', emoji: '🍽️' },
  { label: 'Creative', emoji: '🎨' },
  { label: 'Nature', emoji: '🌿' },
  { label: 'Shopping', emoji: '🛍️' },
  { label: 'Home', emoji: '🏠' },
  { label: 'Study', emoji: '📚' },
  { label: 'Entertainment', emoji: '🎬' },
];

export default function Step2() {
  const router = useRouter();
  const { draft, updateDraft } = useCheckIn();
  const [otherText, setOtherText] = React.useState('');
  const [showOther, setShowOther] = React.useState(false);

  const toggleActivity = (activity: string) => {
    console.log('[CheckIn Step 2] Activity toggled:', activity);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = draft.activities;
    if (current.includes(activity)) {
      updateDraft({ activities: current.filter(a => a !== activity) });
    } else {
      updateDraft({ activities: [...current, activity] });
    }
  };

  const handleNext = () => {
    const activities = [...draft.activities];
    if (otherText.trim()) activities.push(otherText.trim());
    console.log('[CheckIn Step 2] Activities selected:', activities);
    updateDraft({ activities });
    router.push('/checkin/step-3');
  };

  return (
    <CheckInStepWrapper
      step={2}
      totalSteps={7}
      title="What were you doing?"
      subtitle="Select all that apply"
      onNext={handleNext}
      nextLabel="Continue"
    >
      <View style={{ paddingTop: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {ACTIVITIES.map(({ label, emoji }) => {
            const isSelected = draft.activities.includes(label);
            return (
              <Pressable
                key={label}
                onPress={() => toggleActivity(label)}
                accessibilityRole="button"
                accessibilityLabel={`${label} activity`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 24,
                  backgroundColor: isSelected ? COLORS.primary : COLORS.surface,
                  borderWidth: 1.5,
                  borderColor: isSelected ? COLORS.primary : COLORS.border,
                  boxShadow: isSelected ? '0 2px 8px rgba(74,144,217,0.25)' : undefined,
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

          {/* Other */}
          <Pressable
            onPress={() => {
              console.log('[CheckIn Step 2] Other activity toggled');
              setShowOther(!showOther);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 24,
              backgroundColor: showOther ? COLORS.primary : COLORS.surface,
              borderWidth: 1.5,
              borderColor: showOther ? COLORS.primary : COLORS.border,
            }}
          >
            <Text style={{ fontSize: 16 }}>✏️</Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: showOther ? '#FFFFFF' : COLORS.text,
              fontFamily: 'Nunito_600SemiBold',
            }}>
              Other
            </Text>
          </Pressable>
        </View>

        {showOther && (
          <TextInput
            value={otherText}
            onChangeText={setOtherText}
            placeholder="Describe your activity..."
            placeholderTextColor={COLORS.textTertiary}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: COLORS.text,
              fontFamily: 'Nunito_400Regular',
              borderWidth: 1.5,
              borderColor: COLORS.border,
            }}
            maxLength={50}
          />
        )}

        {draft.activities.length === 0 && (
          <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular', textAlign: 'center' }}>
            You can skip this step if nothing applies
          </Text>
        )}
      </View>
    </CheckInStepWrapper>
  );
}
