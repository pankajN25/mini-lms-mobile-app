// Free tier: 10,000 units/day (100 units per search → 100 searches/day)
// Key lives in .env.local (gitignored) — never hardcode here
export const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';

export const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
export const YOUTUBE_MAX_RESULTS = 5;
