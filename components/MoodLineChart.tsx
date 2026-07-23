import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { COLORS } from '@/constants/Colors';

interface DataPoint {
  date: string;
  value: number;
  label: string;
}

interface MoodLineChartProps {
  data: DataPoint[];
  width: number;
  height?: number;
}

export function MoodLineChart({ data, width, height = 140 }: MoodLineChartProps) {
  if (data.length === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.textTertiary, fontSize: 14 }}>No data yet</Text>
      </View>
    );
  }

  const paddingLeft = 24;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 32;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const minVal = 1;
  const maxVal = 10;

  const getX = (index: number) => paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
  const getY = (value: number) => paddingTop + chartHeight - ((value - minVal) / (maxVal - minVal)) * chartHeight;

  // Build path
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

  let pathD = '';
  let areaD = '';

  if (points.length === 1) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    areaD = pathD;
  } else {
    pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    areaD = pathD + ` L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.25" />
          <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {[2, 5, 8].map(val => {
        const y = getY(val);
        return (
          <Line
            key={val}
            x1={paddingLeft}
            y1={y}
            x2={paddingLeft + chartWidth}
            y2={y}
            stroke={COLORS.border}
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        );
      })}

      {/* Area fill */}
      {points.length > 1 && (
        <Path d={areaD} fill="url(#areaGrad)" />
      )}

      {/* Line */}
      <Path
        d={pathD}
        stroke={COLORS.primary}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill={COLORS.surface}
          stroke={COLORS.primary}
          strokeWidth="2"
        />
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const x = getX(i);
        return (
          <React.Fragment key={i}>
            <Line
              x1={x}
              y1={paddingTop + chartHeight + 4}
              x2={x}
              y2={paddingTop + chartHeight + 8}
              stroke={COLORS.textTertiary}
              strokeWidth="1"
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
