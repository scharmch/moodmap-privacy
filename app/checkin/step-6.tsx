import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { CheckInStepWrapper } from '@/components/CheckInStepWrapper';
import { useCheckIn } from '@/contexts/CheckInContext';

const MAX_CHARS = 500;

export default function Step6() {
  const router = useRouter();
  const { draft, updateDraft } = useCheckIn();
  const [focused, setFocused] = useState(false);

  const handleNext = () => {
    console.log('[CheckIn Step 6] Notes saved, length:', draft.notes.length);
    router.push('/checkin/step-7');
  };

  const charCount = draft.notes.length;
  const charColor = charCount > MAX_CHARS * 0.9 ? COLORS.warning : COLORS.textTertiary;

  return (
    <CheckInStepWrapper
      step={6}
      totalSteps={7}
      title="Any notes?"
      subtitle="Optional — capture what's on your mind"
      onNext={handleNext}
      nextLabel={draft.notes.trim() ? 'Continue' : 'Skip'}
    >
      <View style={{ paddingTop: 16, gap: 12 }}>
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: focused ? COLORS.primary : COLORS.border,
          overflow: 'hidden',
        }}>
          <TextInput
            value={draft.notes}
            onChangeText={text => updateDraft({ notes: text })}
            placeholder="What's on your mind? How did your day go? Any thoughts you want to capture..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            numberOfLines={8}
            maxLength={MAX_CHARS}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              padding: 16,
              fontSize: 15,
              color: COLORS.text,
              fontFamily: 'Nunito_400Regular',
              lineHeight: 24,
              minHeight: 160,
              textAlignVertical: 'top',
            }}
          />
          <View style={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}>
            <Text style={{ fontSize: 12, color: charColor, fontFamily: 'Nunito_400Regular', fontVariant: ['tabular-nums'] }}>
              {charCount}/{MAX_CHARS}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular', textAlign: 'center' }}>
          Your notes are private and stored only on your device
        </Text>
      </View>
    </CheckInStepWrapper>
  );
}
