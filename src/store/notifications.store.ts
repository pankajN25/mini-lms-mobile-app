import AsyncStorage from '@react-native-async-storage/async-storage';

const READ_KEY = '@mini_lms/notif_read';
const DISMISSED_KEY = '@mini_lms/notif_dismissed';

export type NotifType = 'reminder' | 'new_course' | 'enrolled' | 'certificate' | 'achievement';

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  courseId?: string;
  courseName?: string;
  timestamp: number;
  read: boolean;
}

// ─── Read state ───────────────────────────────────────────────────────────────

export async function getReadIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(READ_KEY);
  if (!raw) return new Set();
  try { return new Set(JSON.parse(raw) as string[]); } catch { return new Set(); }
}

export async function markRead(ids: string[]): Promise<void> {
  const current = await getReadIds();
  ids.forEach((id) => current.add(id));
  await AsyncStorage.setItem(READ_KEY, JSON.stringify([...current]));
}

export async function markAllRead(allIds: string[]): Promise<void> {
  await AsyncStorage.setItem(READ_KEY, JSON.stringify(allIds));
}

// ─── Dismissed ───────────────────────────────────────────────────────────────

export async function getDismissedIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(DISMISSED_KEY);
  if (!raw) return new Set();
  try { return new Set(JSON.parse(raw) as string[]); } catch { return new Set(); }
}

export async function dismissNotif(id: string): Promise<void> {
  const current = await getDismissedIds();
  current.add(id);
  await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify([...current]));
}

export async function clearAllDismissed(): Promise<void> {
  await AsyncStorage.removeItem(DISMISSED_KEY);
}

// ─── Mock generator ───────────────────────────────────────────────────────────
// Generates a deterministic set of notifications from enrolled/bookmark data.

const MS_PER_HOUR = 3_600_000;

export function buildNotifications(
  enrolledIds: string[],
  enrolledTitles: Record<string, string>,
  bookmarkedCategories: string[],
  completedCourseIds: string[],
): AppNotification[] {
  const now = Date.now();
  const notifs: AppNotification[] = [];

  // 1. Enrollment confirmations (one per enrolled course, up to 5)
  enrolledIds.slice(0, 5).forEach((id, i) => {
    notifs.push({
      id: `enrolled_${id}`,
      type: 'enrolled',
      title: 'Enrollment Confirmed 🎉',
      body: `You\'re now enrolled in "${enrolledTitles[id] ?? 'a course'}". Tap to start learning.`,
      courseId: id,
      courseName: enrolledTitles[id],
      timestamp: now - MS_PER_HOUR * (2 + i * 12),
      read: false,
    });
  });

  // 2. Certificate earned (for 100% complete courses)
  completedCourseIds.slice(0, 3).forEach((id, i) => {
    notifs.push({
      id: `cert_${id}`,
      type: 'certificate',
      title: 'Certificate Earned 🏆',
      body: `Congratulations! You completed "${enrolledTitles[id] ?? 'a course'}" and earned your certificate.`,
      courseId: id,
      courseName: enrolledTitles[id],
      timestamp: now - MS_PER_HOUR * (1 + i * 6),
      read: false,
    });
  });

  // 3. New courses in saved categories (one per category, up to 3)
  bookmarkedCategories.slice(0, 3).forEach((cat, i) => {
    const cap = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
    notifs.push({
      id: `new_course_${cat}`,
      type: 'new_course',
      title: `New in ${cap} 🆕`,
      body: `Fresh courses have been added in ${cap}. Check them out before spots fill up.`,
      timestamp: now - MS_PER_HOUR * (4 + i * 24),
      read: false,
    });
  });

  // 4. Achievement
  if (enrolledIds.length >= 3) {
    notifs.push({
      id: 'achievement_3_courses',
      type: 'achievement',
      title: 'Learning Milestone 🌟',
      body: `You've enrolled in ${enrolledIds.length} courses! You're on your way to becoming a power learner.`,
      timestamp: now - MS_PER_HOUR * 48,
      read: false,
    });
  }

  // 5. Daily learning reminders (always present)
  notifs.push(
    {
      id: 'reminder_daily_1',
      type: 'reminder',
      title: 'Daily Learning Reminder ⏰',
      body: 'Just 15 minutes a day keeps the learning going. Resume where you left off!',
      timestamp: now - MS_PER_HOUR * 6,
      read: false,
    },
    {
      id: 'reminder_streak',
      type: 'reminder',
      title: 'Don\'t Break Your Streak 🔥',
      body: 'Complete at least one lesson today to keep your learning streak alive.',
      timestamp: now - MS_PER_HOUR * 22,
      read: false,
    },
    {
      id: 'reminder_weekly',
      type: 'reminder',
      title: 'Weekly Learning Summary 📊',
      body: 'Check your profile to see how many lessons you completed this week.',
      timestamp: now - MS_PER_HOUR * 72,
      read: false,
    },
  );

  // Sort newest first
  return notifs.sort((a, b) => b.timestamp - a.timestamp);
}

// ─── Time formatting ──────────────────────────────────────────────────────────

export function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / MS_PER_HOUR);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(diff / (MS_PER_HOUR * 24));
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}
