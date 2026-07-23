import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';

interface CheckInStepWrapperProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  children: React.ReactNode;
  backgroundColor?: string;
}

export function CheckInStepWrapper({
  step,
  totalSteps,
  title,
  subtitle,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  children,
  backgroundColor,
}: CheckInStepWrapperProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    console.log('[CheckIn] Back pressed from step', step);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(home)');
    }
  };

  const handleClose = () => {
    console.log('[CheckIn] Close pressed from step', step);
    router.replace('/(tabs)/(home)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: backgroundColor || COLORS.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={handleBack}
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

          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <View
                key={i}
                style={{
                  width: i === step - 1 ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i < step ? COLORS.primary : (i === step - 1 ? COLORS.primary : COLORS.surfaceTertiary),
                  opacity: i < step ? 1 : (i === step - 1 ? 1 : 0.4),
                }}
              />
            ))}
          </View>

          <Pressable
            onPress={handleClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: COLORS.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Close check-in"
          >
            <X size={20} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{
            fontSize: 12,
            color: COLORS.primary,
            fontFamily: 'Nunito_600SemiBold',
            letterSpacing: 0.5,
          }}>
            STEP {step} OF {totalSteps}
          </Text>
          <Text style={{
            fontSize: 24,
            fontWeight: '800',
            color: COLORS.text,
            fontFamily: 'Nunito_800ExtraBold',
            letterSpacing: -0.3,
          }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {/* Next button */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 20,
        paddingTop: 16,
        backgroundColor: backgroundColor || COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
      }}>
        <AnimatedPressable onPress={onNext} disabled={nextDisabled}>
          <View style={{
            backgroundColor: nextDisabled ? COLORS.textTertiary : COLORS.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            boxShadow: nextDisabled ? undefined : '0 4px 16px rgba(74,144,217,0.35)',
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#FFFFFF',
              fontFamily: 'Nunito_700Bold',
            }}>
              {nextLabel}
            </Text>
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}
