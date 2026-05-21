import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'search-outline', title, subtitle }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 60 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 32,
          backgroundColor: '#EEF2FF',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          shadowColor: '#6366F1',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <Ionicons name={icon} size={44} color="#6366F1" />
      </View>
      <Text style={{ fontSize: 19, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
