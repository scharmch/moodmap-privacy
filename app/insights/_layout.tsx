import { Stack } from 'expo-router';

export default function InsightsDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[type]" />
    </Stack>
  );
}
