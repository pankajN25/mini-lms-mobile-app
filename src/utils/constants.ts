export const API_BASE_URL = 'https://api.freeapi.app';
export const API_TIMEOUT = 10000;
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAYS_MS = [500, 1000, 2000];

export const STORAGE_KEYS = {
  BOOKMARKS: '@mini_lms/bookmarks',
  COURSES_CACHE: '@mini_lms/courses_cache',
  INSTRUCTORS_CACHE: '@mini_lms/instructors_cache',
  LAST_ACTIVE: '@mini_lms/last_active',
  PREFERENCES: '@mini_lms/preferences',
  OFFLINE_COURSES: '@mini_lms/offline_courses',
} as const;

export const SECURE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

export const NOTIFICATION_IDS = {
  BOOKMARK_MILESTONE: 'bookmark_milestone',
  RE_ENGAGEMENT: 're_engagement',
} as const;

export const BOOKMARK_MILESTONE_COUNT = 5;
export const RE_ENGAGEMENT_HOURS = 24;
export const COURSES_PAGE_LIMIT = 20;
export const CACHE_TTL_MS = 5 * 60 * 1000;
