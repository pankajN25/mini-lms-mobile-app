import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mini_lms/analytics';
const MAX_EVENTS = 200;

interface AnalyticsEvent {
  type: string;
  payload: Record<string, unknown>;
  ts: number;
}

export const Events = {
  SCREEN_VIEW: 'screen_view',
  COURSE_VIEWED: 'course_viewed',
  COURSE_ENROLLED: 'course_enrolled',
  COURSE_BOOKMARKED: 'course_bookmarked',
  COURSE_UNBOOKMARKED: 'course_unbookmarked',
  SEARCH_PERFORMED: 'search_performed',
  CATEGORY_SELECTED: 'category_selected',
  WEBVIEW_OPENED: 'webview_opened',
  NOTIFICATION_SCHEDULED: 'notification_scheduled',
} as const;

export type EventType = (typeof Events)[keyof typeof Events];

export async function track(type: EventType, payload: Record<string, unknown> = {}): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const events: AnalyticsEvent[] = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    const next = [...events, { type, payload, ts: Date.now() }].slice(-MAX_EVENTS);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Analytics must never crash the app
  }
}

export async function getEvents(): Promise<AnalyticsEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export async function clearAnalytics(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
