import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useYouTubeVideos } from '@/hooks/useYouTubeVideos';
import { VideoPlayerModal } from './VideoPlayerModal';
import type { YouTubeVideo } from '@/services/youtube';

const INITIAL_COUNT = 2;

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <View style={{ gap: 12 }}>
      {[1, 2].map((k) => (
        <View key={k} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 130, height: 74, borderRadius: 12, backgroundColor: '#E2E8F0' }} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, width: '90%' }} />
            <View style={{ height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, width: '60%' }} />
            <View style={{ height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, width: '40%' }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Video card ──────────────────────────────────────────────────────────────

function VideoCard({ video, onPress }: { video: YouTubeVideo; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        backgroundColor: pressed ? '#F1F5F9' : '#fff',
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      })}
    >
      {/* Thumbnail */}
      <View style={{ width: 130, height: 74, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0F172A', flexShrink: 0 }}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
        {/* Play overlay */}
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 6 }}>
            <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 2 }} />
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', lineHeight: 18 }} numberOfLines={2}>
          {video.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="logo-youtube" size={9} color="#fff" />
          </View>
          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', flex: 1 }} numberOfLines={1}>
            {video.channelTitle}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Ionicons name="play-circle-outline" size={12} color="#6366F1" />
          <Text style={{ fontSize: 11, color: '#6366F1', fontWeight: '700' }}>Watch inside app</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── No key ──────────────────────────────────────────────────────────────────

function NoKeyView() {
  return (
    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="logo-youtube" size={22} color="#FF0000" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 }}>
          YouTube Preview Unavailable
        </Text>
        <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 17 }}>
          Add a YouTube Data API v3 key to enable previews.
        </Text>
      </View>
    </View>
  );
}

// ─── Error ───────────────────────────────────────────────────────────────────

function ErrorView({ quota, onRetry }: { quota: boolean; onRetry: () => void }) {
  return (
    <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#FECACA' }}>
      <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626', marginBottom: 2 }}>
          {quota ? 'Daily quota reached' : 'Could not load videos'}
        </Text>
        <Text style={{ fontSize: 12, color: '#EF4444', lineHeight: 17 }}>
          {quota ? 'YouTube API limit resets at midnight.' : 'Check your connection and try again.'}
        </Text>
      </View>
      {!quota && (
        <Pressable onPress={onRetry} style={{ backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface Props {
  courseTitle: string;
  category: string;
}

export function CourseVideoPreview({ courseTitle, category }: Props) {
  const { videos, loading, error, retry } = useYouTubeVideos(courseTitle, category);
  const [expanded, setExpanded] = useState(false);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);

  const visibleVideos = expanded ? videos : videos.slice(0, INITIAL_COUNT);
  const hasMore = videos.length > INITIAL_COUNT && !expanded;

  return (
    <View>
      {/* Section header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="logo-youtube" size={18} color="#fff" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1 }}>
          Preview Videos
        </Text>
        {loading && <ActivityIndicator size="small" color="#6366F1" />}
      </View>

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Error states */}
      {!loading && error === 'NO_API_KEY' && <NoKeyView />}
      {!loading && (error === 'QUOTA_EXCEEDED' || error === 'NETWORK') && (
        <ErrorView quota={error === 'QUOTA_EXCEEDED'} onRetry={() => void retry()} />
      )}

      {/* Empty */}
      {!loading && !error && videos.length === 0 && (
        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
          <Ionicons name="videocam-off-outline" size={30} color="#94A3B8" style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>No preview videos found</Text>
        </View>
      )}

      {/* Video cards — 2 by default, expand on "Show more" */}
      {!loading && !error && videos.length > 0 && (
        <View style={{ gap: 10 }}>
          {visibleVideos.map((video) => (
            <VideoCard
              key={video.videoId}
              video={video}
              onPress={() => setActiveVideo(video)}
            />
          ))}

          {/* Show more / Show less toggle */}
          {videos.length > INITIAL_COUNT && (
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 12,
                backgroundColor: pressed ? '#EEF2FF' : '#F8FAFF',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#C7D2FE',
                marginTop: 2,
              })}
            >
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={15}
                color="#6366F1"
              />
              <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '700' }}>
                {hasMore
                  ? `Show ${videos.length - INITIAL_COUNT} more video${videos.length - INITIAL_COUNT > 1 ? 's' : ''}`
                  : 'Show less'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* In-app YouTube player modal */}
      <VideoPlayerModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    </View>
  );
}
