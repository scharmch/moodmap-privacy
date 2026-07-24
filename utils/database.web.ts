// Web stub — expo-sqlite is not supported on web.
// All functions return safe no-op values so the app renders without crashing.

export interface CheckIn {
  id: string;
  mood_score: number;
  mood_label: string;
  activities: string[];
  social_context: string | null;
  physical_sensations: string[];
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  location_blurred: boolean;
  notes: string | null;
  voice_note_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSetting {
  key: string;
  value: string;
}

export interface InsightsCache {
  id: string;
  type: string;
  content: string;
  generated_at: string;
}

export async function initDatabase(): Promise<void> {
  console.log('[DB] Skipping database init on web');
}

export async function getAllCheckIns(): Promise<CheckIn[]> {
  return [];
}

export async function getRecentCheckIns(_limit: number = 5): Promise<CheckIn[]> {
  return [];
}

export async function getCheckInById(_id: string): Promise<CheckIn | null> {
  return null;
}

export async function getCheckInsForPeriod(_days: number): Promise<CheckIn[]> {
  return [];
}

export async function getTodayCheckIns(): Promise<CheckIn[]> {
  return [];
}

export async function saveCheckIn(_checkIn: CheckIn): Promise<void> {
  console.log('[DB] saveCheckIn is a no-op on web');
}

export async function updateCheckIn(_id: string, _updates: Partial<CheckIn>): Promise<void> {
  console.log('[DB] updateCheckIn is a no-op on web');
}

export async function deleteCheckIn(_id: string): Promise<void> {
  console.log('[DB] deleteCheckIn is a no-op on web');
}

export async function getSetting(_key: string, defaultValue?: string): Promise<string | null> {
  return defaultValue ?? null;
}

export async function setSetting(_key: string, _value: string): Promise<void> {
  console.log('[DB] setSetting is a no-op on web');
}

export async function getCachedInsights(_type: string): Promise<InsightsCache | null> {
  return null;
}

export async function setCachedInsights(_type: string, _content: unknown): Promise<void> {
  console.log('[DB] setCachedInsights is a no-op on web');
}

export async function deleteAllCheckIns(): Promise<void> {
  console.log('[DB] deleteAllCheckIns is a no-op on web');
}

export async function clearInsightsCache(): Promise<void> {
  console.log('[DB] clearInsightsCache is a no-op on web');
}
