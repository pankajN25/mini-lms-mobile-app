import { Text, View } from 'react-native';

interface Props {
  title: string;
  count?: number;
}

export function SectionLabel({ title, count }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 8, paddingBottom: 12 }}>
      <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 16, letterSpacing: -0.3 }}>
        {title}
      </Text>
      {count !== undefined && (
        <View style={{ backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ color: '#6366F1', fontSize: 12, fontWeight: '700' }}>
            {count} courses
          </Text>
        </View>
      )}
    </View>
  );
}
