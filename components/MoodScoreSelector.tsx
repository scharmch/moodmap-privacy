import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { COLORS } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

const MOOD_COLORS = [
  '#E05C5C', // 1
  '#E05C5C', // 2
  '#F5A623', // 3
  '#F5A623', // 4
  '#9BB5CC', // 5
  '#4A90D9', // 6
  '#4A90D9', // 7
  '#7EC8A4', // 8
  '#7EC8A4', // 9
  '#FFD166', // 10
];

const MOOD_EMOJIS = ['😔', '😔', '😟', '😟', '😐', '😐', '😊', '😊', '😄', '😄'];
const MOOD_LABELS = ['', 'Overwhelmed', 'Anxious', 'Low', 'Neutral', 'Okay', 'Good', 'Happy', 'Energized', 'Joyful', 'Euphoric'];

interface MoodScoreSelectorProps {
  value: number;
  onChange: (score: number) => void;
}

export function MoodScoreSelector({ value, onChange }: MoodScoreSelectorProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const emojiScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(emojiScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.spring(emojiScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
  }, [value, emojiScale]);

  const handlePress = (score: number) => {
    console.log('[MoodScoreSelector] Selected mood score:', score);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(score);
  };

  const moodColor = MOOD_COLORS[value - 1] || COLORS.primary;
  const emoji = MOOD_EMOJIS[value - 1] || '😐';
  const label = MOOD_LABELS[value] || 'Okay';

  return (
    <View style={{ alignItems: 'center', gap: 24 }}>
      {/* Emoji */}
      <Animated.Text
        style={{
          fontSize: 72,
          transform: [{ scale: emojiScale }],
        }}
      >
        {emoji}
      </Animated.Text>

      {/* Label */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: moodColor,
          fontFamily: 'Nunito_700Bold',
          letterSpacing: -0.5,
        }}>
          {label}
        </Text>
        <Text style={{
          fontSize: 16,
          color: COLORS.textSecondary,
          fontFamily: 'Nunito_400Regular',
        }}>
          Score: {value}/10
        </Text>
      </View>

      {/* Score buttons */}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(score => {
          const isSelected = score === value;
          const color = MOOD_COLORS[score - 1];
          return (
            <Animated.View
              key={score}
              style={{
                transform: [{ scale: isSelected ? scaleAnim : 1 }],
              }}
            >
              <Pressable
                onPress={() => handlePress(score)}
                accessibilityRole="button"
                accessibilityLabel={`Mood score ${score}: ${MOOD_LABELS[score]}`}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isSelected ? color : `${color}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isSelected ? 0 : 1.5,
                  borderColor: `${color}44`,
                  boxShadow: isSelected ? `0 4px 12px ${color}44` : undefined,
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: isSelected ? '#FFFFFF' : color,
                  fontFamily: 'Nunito_700Bold',
                }}>
                  {score}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
