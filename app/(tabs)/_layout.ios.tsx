import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Icon sf="house.fill" />
        <Label>Today</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(map)">
        <Icon sf="map.fill" />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(insights)">
        <Icon sf="brain.head.profile" />
        <Label>Insights</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
