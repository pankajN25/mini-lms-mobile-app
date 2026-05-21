import { memo, useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { capitalizeCategory } from '@/utils/formatters';
import { track, Events } from '@/services/analytics';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export const CategoryFilter = memo(function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  const all = ['All', ...categories];

  const handleSelect = useCallback(
    async (category: string) => {
      await Haptics.selectionAsync();
      void track(Events.CATEGORY_SELECTED, { category });
      onSelect(category);
    },
    [onSelect]
  );

  return (
    <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        style={{ flexGrow: 0 }}
      >
        {all.map((cat) => {
          const isActive = selected === cat;
          const label = cat === 'All' ? 'All Courses' : capitalizeCategory(cat);
          return (
            <Pressable
              key={cat}
              onPress={() => void handleSelect(cat)}
              android_ripple={{ color: 'rgba(99,102,241,0.12)', borderless: false }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 22,
                backgroundColor: isActive ? '#6366F1' : '#fff',
                borderWidth: 1.5,
                borderColor: isActive ? '#6366F1' : '#CBD5E1',
                shadowColor: isActive ? '#6366F1' : 'transparent',
                shadowOffset: { width: 0, height: isActive ? 3 : 0 },
                shadowOpacity: isActive ? 0.3 : 0,
                shadowRadius: isActive ? 8 : 0,
                elevation: isActive ? 4 : 0,
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Filter by ${cat}`}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: isActive ? '#fff' : '#334155',
                  letterSpacing: 0.1,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});
