import * as SQLite from 'expo-sqlite';

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

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('emotional_gps.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  console.log('[DB] Initializing database...');
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      mood_score INTEGER NOT NULL CHECK(mood_score >= 1 AND mood_score <= 10),
      mood_label TEXT NOT NULL,
      activities TEXT NOT NULL DEFAULT '[]',
      social_context TEXT,
      physical_sensations TEXT NOT NULL DEFAULT '[]',
      latitude REAL,
      longitude REAL,
      location_label TEXT,
      location_blurred INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      voice_note_uri TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS insights_cache (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      generated_at TEXT NOT NULL
    );
  `);

  console.log('[DB] Tables created successfully');

  // Seed data if empty
  const count = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM check_ins'
  );
  if (count && count.count === 0) {
    console.log('[DB] Seeding database with sample data...');
    await seedDatabase(database);
  }
}

const MOOD_LABELS = [
  '', 'Overwhelmed', 'Anxious', 'Low', 'Neutral', 'Okay',
  'Good', 'Happy', 'Energized', 'Joyful', 'Euphoric'
];

const SF_LOCATIONS = [
  { lat: 37.7749, lng: -122.4194, label: 'Downtown SF' },
  { lat: 37.7849, lng: -122.4094, label: 'Union Square' },
  { lat: 37.8044, lng: -122.2712, label: 'Oakland' },
  { lat: 37.7599, lng: -122.4148, label: 'Mission District' },
  { lat: 37.7694, lng: -122.4862, label: 'Golden Gate Park' },
  { lat: 37.8024, lng: -122.4058, label: 'North Beach' },
  { lat: 37.7879, lng: -122.4074, label: 'Chinatown' },
  { lat: 37.7562, lng: -122.4477, label: 'Noe Valley' },
  { lat: 37.7648, lng: -122.4330, label: 'Castro' },
  { lat: 37.7955, lng: -122.3937, label: 'Embarcadero' },
  { lat: 37.7751, lng: -122.3965, label: 'SoMa' },
  { lat: 37.7833, lng: -122.4167, label: 'Tenderloin' },
  { lat: 37.7749, lng: -122.4500, label: 'Haight-Ashbury' },
  { lat: 37.7900, lng: -122.4000, label: 'Financial District' },
  { lat: 37.7500, lng: -122.4000, label: 'Bernal Heights' },
];

const ACTIVITIES_POOL = [
  ['Work'], ['Exercise'], ['Social'], ['Rest'], ['Commute'],
  ['Eating'], ['Creative'], ['Nature'], ['Home'], ['Study'],
  ['Work', 'Commute'], ['Social', 'Eating'], ['Exercise', 'Nature'],
  ['Rest', 'Home'], ['Creative', 'Study'],
];

const SOCIAL_POOL = [
  'Alone', 'With Partner', 'With Friends', 'With Family',
  'With Colleagues', 'In a Crowd', 'Online/Virtual'
];

const SENSATIONS_POOL = [
  ['Energetic'], ['Tired'], ['Relaxed'], ['Calm'],
  ['Energetic', 'Relaxed'], ['Tired', 'Tense'], ['Well-rested', 'Calm'],
  ['Restless'], ['Tense'], ['Well-rested'],
];

const NOTES_POOL = [
  'Had a productive morning, feeling good about the day ahead.',
  'Feeling a bit overwhelmed with deadlines but managing.',
  'Great walk in the park, really helped clear my head.',
  'Lunch with friends was exactly what I needed.',
  'Long commute today, feeling drained.',
  'Finished a big project, huge relief!',
  'Quiet evening at home, feeling peaceful.',
  'Anxious about tomorrow\'s presentation.',
  'Beautiful sunset today, feeling grateful.',
  'Tired but content after a full day.',
  null, null, null,
];

async function seedDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  const now = new Date();
  const checkIns: CheckIn[] = [];

  for (let i = 0; i < 30; i++) {
    const daysAgo = 29 - i;
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    // Vary the time of day
    const hour = 7 + Math.floor(Math.random() * 14);
    const minute = Math.floor(Math.random() * 60);
    date.setHours(hour, minute, 0, 0);

    const moodScore = Math.floor(Math.random() * 10) + 1;
    const location = SF_LOCATIONS[Math.floor(Math.random() * SF_LOCATIONS.length)];
    const activities = ACTIVITIES_POOL[Math.floor(Math.random() * ACTIVITIES_POOL.length)];
    const social = SOCIAL_POOL[Math.floor(Math.random() * SOCIAL_POOL.length)];
    const sensations = SENSATIONS_POOL[Math.floor(Math.random() * SENSATIONS_POOL.length)];
    const notes = NOTES_POOL[Math.floor(Math.random() * NOTES_POOL.length)];

    // Add slight coordinate variation
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    checkIns.push({
      id: `seed_${i}_${Date.now()}`,
      mood_score: moodScore,
      mood_label: MOOD_LABELS[moodScore],
      activities,
      social_context: social,
      physical_sensations: sensations,
      latitude: location.lat + latOffset,
      longitude: location.lng + lngOffset,
      location_label: location.label,
      location_blurred: false,
      notes,
      voice_note_uri: null,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }

  for (const checkIn of checkIns) {
    await database.runAsync(
      `INSERT INTO check_ins (id, mood_score, mood_label, activities, social_context, physical_sensations, latitude, longitude, location_label, location_blurred, notes, voice_note_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        checkIn.id,
        checkIn.mood_score,
        checkIn.mood_label,
        JSON.stringify(checkIn.activities),
        checkIn.social_context,
        JSON.stringify(checkIn.physical_sensations),
        checkIn.latitude,
        checkIn.longitude,
        checkIn.location_label,
        checkIn.location_blurred ? 1 : 0,
        checkIn.notes,
        checkIn.voice_note_uri,
        checkIn.created_at,
        checkIn.updated_at,
      ]
    );
  }

  console.log('[DB] Seeded 30 sample check-ins');
}

// ---- Check-in CRUD ----

function rowToCheckIn(row: Record<string, unknown>): CheckIn {
  return {
    id: row.id as string,
    mood_score: row.mood_score as number,
    mood_label: row.mood_label as string,
    activities: JSON.parse((row.activities as string) || '[]'),
    social_context: row.social_context as string | null,
    physical_sensations: JSON.parse((row.physical_sensations as string) || '[]'),
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    location_label: row.location_label as string | null,
    location_blurred: (row.location_blurred as number) === 1,
    notes: row.notes as string | null,
    voice_note_uri: row.voice_note_uri as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getAllCheckIns(): Promise<CheckIn[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM check_ins ORDER BY created_at DESC'
  );
  return rows.map(rowToCheckIn);
}

export async function getRecentCheckIns(limit: number = 5): Promise<CheckIn[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM check_ins ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(rowToCheckIn);
}

export async function getCheckInById(id: string): Promise<CheckIn | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM check_ins WHERE id = ?',
    [id]
  );
  return row ? rowToCheckIn(row) : null;
}

export async function getCheckInsForPeriod(days: number): Promise<CheckIn[]> {
  const database = await getDatabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM check_ins WHERE created_at >= ? ORDER BY created_at DESC',
    [since.toISOString()]
  );
  return rows.map(rowToCheckIn);
}

export async function getTodayCheckIns(): Promise<CheckIn[]> {
  const database = await getDatabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM check_ins WHERE created_at >= ? ORDER BY created_at DESC',
    [today.toISOString()]
  );
  return rows.map(rowToCheckIn);
}

export async function saveCheckIn(checkIn: CheckIn): Promise<void> {
  console.log('[DB] Saving check-in:', checkIn.id, 'mood:', checkIn.mood_score);
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO check_ins (id, mood_score, mood_label, activities, social_context, physical_sensations, latitude, longitude, location_label, location_blurred, notes, voice_note_uri, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      checkIn.id,
      checkIn.mood_score,
      checkIn.mood_label,
      JSON.stringify(checkIn.activities),
      checkIn.social_context,
      JSON.stringify(checkIn.physical_sensations),
      checkIn.latitude,
      checkIn.longitude,
      checkIn.location_label,
      checkIn.location_blurred ? 1 : 0,
      checkIn.notes,
      checkIn.voice_note_uri,
      checkIn.created_at,
      checkIn.updated_at,
    ]
  );
}

export async function updateCheckIn(id: string, updates: Partial<CheckIn>): Promise<void> {
  console.log('[DB] Updating check-in:', id);
  const database = await getDatabase();
  const existing = await getCheckInById(id);
  if (!existing) return;
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await saveCheckIn(updated);
}

export async function deleteCheckIn(id: string): Promise<void> {
  console.log('[DB] Deleting check-in:', id);
  const database = await getDatabase();
  await database.runAsync('DELETE FROM check_ins WHERE id = ?', [id]);
}

// ---- User Settings ----

export async function getSetting(key: string, defaultValue?: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM user_settings WHERE key = ?',
    [key]
  );
  return row ? row.value : (defaultValue ?? null);
}

export async function setSetting(key: string, value: string): Promise<void> {
  console.log('[DB] Setting:', key, '=', value);
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

// ---- Insights Cache ----

export async function getCachedInsights(type: string): Promise<InsightsCache | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM insights_cache WHERE type = ? ORDER BY generated_at DESC LIMIT 1',
    [type]
  );
  if (!row) return null;
  return {
    id: row.id as string,
    type: row.type as string,
    content: row.content as string,
    generated_at: row.generated_at as string,
  };
}

export async function setCachedInsights(type: string, content: unknown): Promise<void> {
  console.log('[DB] Caching insights for type:', type);
  const database = await getDatabase();
  const id = `${type}_${Date.now()}`;
  await database.runAsync(
    'INSERT OR REPLACE INTO insights_cache (id, type, content, generated_at) VALUES (?, ?, ?, ?)',
    [id, type, JSON.stringify(content), new Date().toISOString()]
  );
}

export async function clearInsightsCache(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM insights_cache');
}
