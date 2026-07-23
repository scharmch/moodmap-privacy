import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/Colors';

const LAST_UPDATED = 'June 14, 2025';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: COLORS.primary,
        marginBottom: 8,
      }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{
      fontSize: 14,
      fontFamily: 'Nunito_400Regular',
      color: COLORS.text,
      lineHeight: 22,
    }}>
      {children}
    </Text>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', marginTop: 6, paddingLeft: 4 }}>
      <Text style={{ fontSize: 14, color: COLORS.primary, marginRight: 8, lineHeight: 22 }}>•</Text>
      <Text style={{
        flex: 1,
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: COLORS.text,
        lineHeight: 22,
      }}>
        {text}
      </Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacy Policy',
          headerBackTitle: 'Profile',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.primary,
          headerTitleStyle: { fontFamily: 'Nunito_700Bold', color: COLORS.text },
        }}
      />
      <View style={{ flex: 1, backgroundColor: '#F0F7FF' }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{
            backgroundColor: COLORS.primary,
            borderRadius: 16,
            padding: 20,
            marginBottom: 28,
          }}>
            <Text style={{
              fontSize: 22,
              fontFamily: 'Nunito_800ExtraBold',
              color: '#FFFFFF',
              marginBottom: 4,
            }}>
              Privacy Policy
            </Text>
            <Text style={{
              fontSize: 13,
              fontFamily: 'Nunito_400Regular',
              color: 'rgba(255,255,255,0.80)',
            }}>
              Last updated: {LAST_UPDATED}
            </Text>
          </View>

          <Section title="Overview">
            <Body>
              MoodMap AI is designed with your privacy as the top priority. This policy explains what data we collect, how it is stored, and your rights as a user. We are committed to full compliance with GDPR, CCPA, and HIPAA-aligned best practices for health and wellness data.
            </Body>
          </Section>

          <Section title="What Data We Collect">
            <Body>When you use MoodMap AI, the following data may be stored on your device:</Body>
            <Bullet text="Mood scores (1–10) and mood labels you select during check-ins" />
            <Bullet text="Activities and social context you tag in each check-in" />
            <Bullet text="Physical sensations you report" />
            <Bullet text="Optional text notes you write" />
            <Bullet text="Optional voice note recordings (stored as audio files on your device)" />
            <Bullet text="Optional location data (GPS coordinates and place labels) — only when you grant permission" />
            <Bullet text="App settings and preferences (e.g. display name, notification preferences)" />
          </Section>

          <Section title="How Your Data Is Stored">
            <Body>
              All data collected by MoodMap AI is stored exclusively on your device using SQLite, a local database. Your emotional check-in data is never transmitted to any external server, cloud service, or third party without your explicit consent.
            </Body>
            <View style={{ marginTop: 12 }}>
              <Bullet text="No account or sign-in is required — your data belongs only to you" />
              <Bullet text="Data is stored in an encrypted SQLite database on your device" />
              <Bullet text="Voice notes are saved as local audio files and never uploaded" />
              <Bullet text="AI insights are generated on-device or via an anonymized API call — no personally identifiable information is sent" />
            </View>
          </Section>

          <Section title="Location Data">
            <Body>
              Location access is entirely optional. If you grant location permission, MoodMap AI uses your GPS coordinates to tag where you recorded a check-in. This helps you discover patterns between places and your emotional state.
            </Body>
            <View style={{ marginTop: 12 }}>
              <Bullet text="Location data is stored only on your device" />
              <Bullet text="You can enable 'Blur exact locations' in Profile settings to store only approximate coordinates" />
              <Bullet text="Your location data is never sold, shared, or uploaded to any server" />
              <Bullet text="You can revoke location permission at any time in your device settings" />
            </View>
          </Section>

          <Section title="Voice Notes & Microphone">
            <Body>
              If you record voice notes, MoodMap AI accesses your microphone solely to capture the recording. Audio files are saved locally on your device and are never transmitted externally. Speech recognition (if used for transcription) processes audio on-device or via an anonymized API — no voice data is linked to your identity.
            </Body>
          </Section>

          <Section title="HIPAA-Aligned Practices">
            <Body>
              While MoodMap AI is a wellness app and not a covered HIPAA entity, we follow HIPAA-aligned best practices for handling sensitive health information:
            </Body>
            <View style={{ marginTop: 12 }}>
              <Bullet text="Mood and emotional data is treated as sensitive health information" />
              <Bullet text="No data is shared with advertisers, data brokers, or analytics platforms" />
              <Bullet text="No behavioral profiling is performed on your emotional data" />
              <Bullet text="Data minimization: we only collect what is necessary for the app to function" />
            </View>
          </Section>

          <Section title="Your Rights">
            <Body>You have full control over your data at all times:</Body>
            <View style={{ marginTop: 12 }}>
              <Bullet text="Right to access: View all your stored data via Profile → Your Data & Export" />
              <Bullet text="Right to export: Download a full JSON export of all your check-ins" />
              <Bullet text="Right to delete: Permanently delete all your data via Profile → Clear all data" />
              <Bullet text="Right to opt out: Stop using location or microphone at any time via device settings" />
              <Bullet text="CCPA: We do not sell your personal information to any third party" />
              <Bullet text="GDPR: EU users may request data deletion by contacting us at the email below" />
            </View>
          </Section>

          <Section title="Third-Party Services">
            <Body>
              MoodMap AI does not integrate with advertising networks, social media platforms, or data brokers. If AI-powered insights are enabled, anonymized, non-identifiable data may be sent to an AI inference API solely to generate your insights. No mood scores, location data, or personal identifiers are included in these requests.
            </Body>
          </Section>

          <Section title="Children's Privacy">
            <Body>
              MoodMap AI is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has used the app, please contact us to request data deletion.
            </Body>
          </Section>

          <Section title="Changes to This Policy">
            <Body>
              We may update this Privacy Policy from time to time. Any changes will be reflected with an updated "Last updated" date at the top of this screen. Continued use of the app after changes constitutes acceptance of the updated policy.
            </Body>
          </Section>

          <Section title="Contact Us">
            <Body>
              If you have questions, concerns, or requests regarding your privacy or this policy, please contact us at:
            </Body>
            <View style={{
              marginTop: 12,
              backgroundColor: COLORS.primaryMuted,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <Text style={{
                fontSize: 15,
                fontFamily: 'Nunito_700Bold',
                color: COLORS.primary,
              }}>
                privacy@moodmap.app
              </Text>
              <Text style={{
                fontSize: 13,
                fontFamily: 'Nunito_400Regular',
                color: COLORS.textSecondary,
                marginTop: 4,
              }}>
                We aim to respond within 5 business days.
              </Text>
            </View>
          </Section>

        </ScrollView>
      </View>
    </>
  );
}
