import { useCallback } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StatusBar,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { YouTubeVideo } from '@/services/youtube';

const { width: SCREEN_W } = Dimensions.get('window');
const THUMB_H = Math.round(SCREEN_W * 9 / 16);

function thumbUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

interface Props {
  video: YouTubeVideo | null;
  onClose: () => void;
}

export function VideoPlayerModal({ video, onClose }: Props) {
  const insets = useSafeAreaInsets();

  const openInYouTube = useCallback(() => {
    if (!video) return;
    const app = `youtube://watch?v=${video.videoId}`;
    const web = `https://www.youtube.com/watch?v=${video.videoId}`;
    void Linking.canOpenURL(app).then((can) => Linking.openURL(can ? app : web));
  }, [video]);

  return (
    <Modal
      visible={!!video}
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={{ flex: 1, backgroundColor: '#000' }}>

        {/* ── Header ── */}
        <View style={{ paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#111' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="chevron-down" size={20} color="#fff" />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                {video?.title ?? ''}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                {video?.channelTitle ?? ''}
              </Text>
            </View>

            <View style={{
              backgroundColor: '#FF0000', borderRadius: 12,
              paddingHorizontal: 10, paddingVertical: 5, marginLeft: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="logo-youtube" size={13} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginLeft: 5 }}>YouTube</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Thumbnail + play button ── */}
        <Pressable
          onPress={openInYouTube}
          style={{ width: SCREEN_W, height: THUMB_H, backgroundColor: '#111' }}
        >
          {video && (
            <>
              <Image
                source={{ uri: thumbUrl(video.videoId) }}
                style={{ width: SCREEN_W, height: THUMB_H }}
                contentFit="cover"
              />
              {/* Scrim */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />

              {/* Play button */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{
                  width: 76, height: 76, borderRadius: 38,
                  backgroundColor: '#FF0000',
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.55,
                  shadowRadius: 18,
                  elevation: 18,
                }}>
                  <Ionicons name="play" size={34} color="#fff" style={{ marginLeft: 4 }} />
                </View>
                <Text style={{
                  color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 14,
                  textShadowColor: 'rgba(0,0,0,0.9)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 6,
                }}>
                  Tap to watch on YouTube
                </Text>
              </View>
            </>
          )}
        </Pressable>

        {/* ── Info card ── */}
        <View style={{ backgroundColor: '#111', padding: 20, flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 12 }}>
            {video?.title ?? ''}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: '#FF0000',
              alignItems: 'center', justifyContent: 'center',
              marginRight: 8,
            }}>
              <Ionicons name="logo-youtube" size={15} color="#fff" />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', flex: 1 }} numberOfLines={1}>
              {video?.channelTitle ?? ''}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />

          {/* Open in YouTube */}
          <View style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
            <Pressable
              onPress={openInYouTube}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              style={{ backgroundColor: '#FF0000', paddingVertical: 15, alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="logo-youtube" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginLeft: 8 }}>
                  Open in YouTube
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Close */}
          <View style={{ borderRadius: 14, overflow: 'hidden' }}>
            <Pressable
              onPress={onClose}
              android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
              style={{
                backgroundColor: '#222',
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', marginLeft: 6 }}>
                  Close
                </Text>
              </View>
            </Pressable>
          </View>

          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, lineHeight: 17, marginTop: 14 }}>
            This is a free preview from YouTube. Enroll in the course to access the full structured curriculum.
          </Text>
        </View>

      </View>
    </Modal>
  );
}
