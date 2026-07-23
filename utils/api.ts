import { CheckIn } from './database';

export const BACKEND_URL = 'https://moodmap-ai.app.specular.dev';

export interface CheckInSummary {
  id: string;
  mood_score: number;
  mood_label: string;
  activities: string[];
  social_context: string;
  physical_sensations: string[];
  location_label?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  created_at: string;
}

export interface InsightPattern {
  title: string;
  description: string;
  icon: string;
  mood_impact: number;
}

export interface SafeSpace {
  location: string;
  avg_mood: number;
  visit_count: number;
}

export interface Trigger {
  trigger: string;
  frequency: number;
  avg_mood_impact: number;
}

export interface StressPattern {
  pattern: string;
  description: string;
  frequency: number;
}

export interface InsightsResponse {
  patterns: InsightPattern[];
  safe_spaces: SafeSpace[];
  triggers: Trigger[];
  stress_patterns: StressPattern[];
  narrative: string;
}


export interface WeeklyReport {
  week_start: string;
  avg_mood: number;
  mood_distribution: {
    low: number;
    neutral: number;
    good: number;
    great: number;
  };
  top_activities: { activity: string; avg_mood: number; count: number }[];
  narrative: string;
  highlights: string[];
}

export interface CopingStrategy {
  title: string;
  description: string;
  type: 'mindfulness' | 'grounding' | 'journaling' | 'movement' | 'breathing' | 'social' | 'nature';
  duration_minutes: number;
  steps?: string[];
}

function checkInToSummary(c: CheckIn): CheckInSummary {
  return {
    id: c.id,
    mood_score: c.mood_score,
    mood_label: c.mood_label,
    activities: c.activities,
    social_context: c.social_context || 'Alone',
    physical_sensations: c.physical_sensations,
    location_label: c.location_label || undefined,
    latitude: c.latitude || undefined,
    longitude: c.longitude || undefined,
    notes: c.notes || undefined,
    created_at: c.created_at,
  };
}

export async function fetchInsights(checkIns: CheckIn[], periodDays: number = 30): Promise<InsightsResponse> {
  console.log('[API] POST /api/insights - sending', checkIns.length, 'check-ins');
  const response = await fetch(`${BACKEND_URL}/api/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      check_ins: checkIns.map(checkInToSummary),
      period_days: periodDays,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[API] /api/insights error:', response.status, text.slice(0, 200));
    throw new Error(`Insights API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[API] /api/insights response received, patterns:', data.patterns?.length);
  return data;
}

export async function fetchWeeklyReport(checkIns: CheckIn[], weekStart: string): Promise<WeeklyReport> {
  console.log('[API] POST /api/weekly-report - week:', weekStart);
  const response = await fetch(`${BACKEND_URL}/api/weekly-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      check_ins: checkIns.map(checkInToSummary),
      week_start: weekStart,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[API] /api/weekly-report error:', response.status, text.slice(0, 200));
    throw new Error(`Weekly report API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[API] /api/weekly-report response received');
  return data;
}

export async function fetchCopingStrategies(recentCheckIns: CheckIn[], currentMood: number): Promise<CopingStrategy[]> {
  console.log('[API] POST /api/coping-strategies - current mood:', currentMood);
  const response = await fetch(`${BACKEND_URL}/api/coping-strategies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recent_check_ins: recentCheckIns.map(checkInToSummary),
      current_mood: currentMood,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[API] /api/coping-strategies error:', response.status, text.slice(0, 200));
    throw new Error(`Coping strategies API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[API] /api/coping-strategies response received, strategies:', data.strategies?.length);
  return data.strategies || [];
}
