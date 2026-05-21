import { Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning';
}

const STYLES = {
  default: { bg: '#EEF2FF', text: '#6366F1' },
  success: { bg: '#DCFCE7', text: '#16A34A' },
  warning: { bg: '#FEF3C7', text: '#D97706' },
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { bg, text } = STYLES[variant];
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: text,
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
