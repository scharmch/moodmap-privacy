import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '@/constants/Colors';

interface DistributionData {
  label: string;
  count: number;
  color: string;
}

interface MoodDistributionBarProps {
  data: DistributionData[];
  total: number;
}

export function MoodDistributionBar({ data, total }: MoodDistributionBarProps) {
  if (total === 0) return null;

  return (
    <View style={{ gap: 10 }}>
      {data.map((item, i) => {
        const pct = total > 0 ? (item.count / total) * 100 : 0;
        const pctDisplay = Math.round(pct);
        return (
          <View key={i} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                {item.count} ({pctDisplay}%)
              </Text>
            </View>
            <View style={{
              height: 8,
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${pct}%`,
                backgroundColor: item.color,
                borderRadius: 4,
              }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
