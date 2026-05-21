import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '@/hooks/useNetwork';

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isOnline) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-60, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOnline, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (isOnline) return null;

  return (
    <Animated.View style={animStyle}>
      <View
        style={{
          backgroundColor: '#1E293B',
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="cloud-offline-outline" size={16} color="#94A3B8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '700' }}>
            You're offline
          </Text>
          <Text style={{ color: '#64748B', fontSize: 11, marginTop: 1 }}>
            Viewing cached courses — previously visited pages available
          </Text>
        </View>
        <View
          style={{
            backgroundColor: '#059669',
            borderRadius: 20,
            paddingHorizontal: 8,
            paddingVertical: 3,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Ionicons name="cloud-done-outline" size={10} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>Cached</Text>
        </View>
      </View>
    </Animated.View>
  );
}
