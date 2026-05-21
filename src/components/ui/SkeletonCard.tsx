import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';

function Shimmer({ className }: { className: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={style} className={`bg-slate-200 rounded-lg ${className}`} />;
}

export function SkeletonCard() {
  return (
    <View className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm">
      <Shimmer className="w-full h-44 rounded-none" />
      <View className="p-4">
        <Shimmer className="h-3 w-24 mb-3" />
        <Shimmer className="h-5 w-full mb-2" />
        <Shimmer className="h-4 w-3/4 mb-4" />
        <View className="flex-row justify-between items-center">
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-12" />
        </View>
      </View>
    </View>
  );
}
