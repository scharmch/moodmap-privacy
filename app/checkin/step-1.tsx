import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { CheckInStepWrapper } from '@/components/CheckInStepWrapper';
import { MoodScoreSelector } from '@/components/MoodScoreSelector';
import { useCheckIn } from '@/contexts/CheckInContext';
import { getMoodLabel } from '@/utils/streak';

export default function Step1() {
  const router = useRouter();
  const { draft, updateDraft } = useCheckIn();

  const handleNext = () => {
    console.log('[CheckIn Step 1] Mood score selected:', draft.mood_score, draft.mood_label);
    router.push('/checkin/step-2');
  };

  const handleMoodChange = (score: number) => {
    updateDraft({ mood_score: score, mood_label: getMoodLabel(score) });
  };

  return (
    <CheckInStepWrapper
      step={1}
      totalSteps={7}
      title="How are you feeling?"
      subtitle="Rate your overall mood right now"
      onNext={handleNext}
      nextLabel="Continue"
    >
      <View style={{ paddingTop: 24 }}>
        <MoodScoreSelector value={draft.mood_score} onChange={handleMoodChange} />
      </View>
    </CheckInStepWrapper>
  );
}
