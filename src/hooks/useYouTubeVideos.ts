import { useCallback, useEffect, useState } from 'react';
import { searchYouTubeVideos, type YouTubeVideo } from '@/services/youtube';
import { YOUTUBE_API_KEY } from '@/config/youtube';

// In-memory cache: avoids re-fetching when user scrolls back to same course
const cache = new Map<string, YouTubeVideo[]>();

function cacheKey(title: string, category: string) {
  return `${category}::${title.split(' ').slice(0, 4).join(' ')}`.toLowerCase();
}

interface State {
  videos: YouTubeVideo[];
  loading: boolean;
  error: 'NO_API_KEY' | 'QUOTA_EXCEEDED' | 'NETWORK' | null;
}

export function useYouTubeVideos(courseTitle: string, category: string) {
  const [state, setState] = useState<State>({ videos: [], loading: true, error: null });

  const fetch = useCallback(async () => {
    if (!YOUTUBE_API_KEY) {
      setState({ videos: [], loading: false, error: 'NO_API_KEY' });
      return;
    }

    const key = cacheKey(courseTitle, category);
    const cached = cache.get(key);
    if (cached) {
      setState({ videos: cached, loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const results = await searchYouTubeVideos(courseTitle, category);
      cache.set(key, results);
      setState({ videos: results, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setState({
        videos: [],
        loading: false,
        error: msg === 'QUOTA_EXCEEDED' ? 'QUOTA_EXCEEDED' : 'NETWORK',
      });
    }
  }, [courseTitle, category]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { ...state, retry: fetch };
}
