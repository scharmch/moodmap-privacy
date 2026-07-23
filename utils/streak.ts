import { CheckIn } from './database';

export function calculateStreak(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;

  // Get unique dates (YYYY-MM-DD) sorted descending
  const dates = [...new Set(
    checkIns.map(c => c.created_at.split('T')[0])
  )].sort((a, b) => b.localeCompare(a));

  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Streak must include today or yesterday
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getWeeklyAverage(checkIns: CheckIn[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recent = checkIns.filter(c => new Date(c.created_at) >= weekAgo);
  if (recent.length === 0) return 0;
  const sum = recent.reduce((acc, c) => acc + c.mood_score, 0);
  return Math.round((sum / recent.length) * 10) / 10;
}

export function getMoodColor(score: number): string {
  if (score <= 3) return '#E05C5C';
  if (score <= 5) return '#F5A623';
  if (score <= 7) return '#4A90D9';
  return '#7EC8A4';
}

export function getMoodEmoji(score: number): string {
  if (score <= 2) return '😔';
  if (score <= 4) return '😟';
  if (score <= 6) return '😐';
  if (score <= 8) return '😊';
  return '😄';
}

export function getMoodLabel(score: number): string {
  const labels = ['', 'Overwhelmed', 'Anxious', 'Low', 'Neutral', 'Okay', 'Good', 'Happy', 'Energized', 'Joyful', 'Euphoric'];
  return labels[score] || 'Unknown';
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
