import { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useUnreadCount';

const LOCAL_AVATAR_KEY = '@mini_lms/local_avatar';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  coursesCount: number;
}

export function DashboardHeader({ query, onQueryChange, coursesCount }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const unreadCount = useUnreadCount();
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [apiAvatarError, setApiAvatarError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void AsyncStorage.getItem(`${LOCAL_AVATAR_KEY}_${user.id}`).then((val) => {
        setLocalAvatar(val ?? null);
        if (!val) setApiAvatarError(false);
      });
    }, [user?.id])
  );

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.username?.split(' ')[0] ?? 'Learner';
  const initials = firstName.slice(0, 2).toUpperCase();

  const avatarUri = localAvatar
    ? localAvatar
    : !apiAvatarError
    ? (user?.avatarUrl || null)
    : null;

  return (
    <View style={{ backgroundColor: '#6366F1', overflow: 'hidden' }}>
      {/* Decorative blobs */}
      <View style={{ position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.07)', top: -75, right: -55 }} />
      <View style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', top: 20, left: -35 }} />
      <View style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', bottom: 8, right: 85 }} />

      <SafeAreaView edges={['top']}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>

          {/* Greeting + actions row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' }}>
                {greeting},
              </Text>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
                {firstName} 👋
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Notification bell */}
              <Pressable
                onPress={() => router.push('/(tabs)/notifications')}
                hitSlop={8}
                style={{ position: 'relative', padding: 6 }}
              >
                <Ionicons name="notifications-outline" size={26} color="#fff" />
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: '#EF4444',
                    borderRadius: 9,
                    minWidth: 18,
                    height: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: '#6366F1',
                  }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Avatar — taps to profile */}
              <Pressable
                onPress={() => router.navigate('/(tabs)/profile')}
                hitSlop={10}
                style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2.5, borderColor: '#fff',
                  overflow: 'hidden',
                }}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    onError={() => {
                      if (!localAvatar) setApiAvatarError(true);
                    }}
                  />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>
                    {initials}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Search bar */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 16,
            paddingHorizontal: 14,
            shadowColor: '#1E1B4B',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 8,
          }}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: '#0F172A', marginLeft: 10 }}
              placeholder="Search courses, instructors…"
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={onQueryChange}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => onQueryChange('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}
