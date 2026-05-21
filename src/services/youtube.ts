import { YOUTUBE_API_KEY, YOUTUBE_SEARCH_URL, YOUTUBE_MAX_RESULTS } from '@/config/youtube';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
}

interface SearchResponse {
  items?: Array<{
    id: { videoId?: string };
    snippet: {
      title: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: {
        medium?: { url: string };
        default?: { url: string };
      };
    };
  }>;
  error?: { message: string; code: number };
}

function buildQuery(courseTitle: string, category: string): string {
  // Use first 4 words of title + category for a focused search
  const words = courseTitle.split(' ').slice(0, 4).join(' ');
  return `${words} ${category} tutorial`;
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getYouTubeSearchUrl(courseTitle: string, category: string): string {
  const q = encodeURIComponent(buildQuery(courseTitle, category));
  return `https://www.youtube.com/results?search_query=${q}`;
}

export async function searchYouTubeVideos(
  courseTitle: string,
  category: string,
): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) throw new Error('NO_API_KEY');

  const params = new URLSearchParams({
    q: buildQuery(courseTitle, category),
    part: 'snippet',
    type: 'video',
    maxResults: String(YOUTUBE_MAX_RESULTS),
    relevanceLanguage: 'en',
    safeSearch: 'strict',
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`);
  const data = (await res.json()) as SearchResponse;

  if (!res.ok) {
    const msg = data.error?.message ?? `YouTube API error ${res.status}`;
    if (data.error?.code === 403) throw new Error('QUOTA_EXCEEDED');
    throw new Error(msg);
  }

  return (data.items ?? [])
    .filter((item) => !!item.id.videoId)
    .map((item) => ({
      videoId: item.id.videoId!,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl:
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
      publishedAt: item.snippet.publishedAt,
    }));
}
