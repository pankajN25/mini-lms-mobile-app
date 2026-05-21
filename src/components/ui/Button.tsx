import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: Size;
  leftIcon?: React.ReactNode;
}

const BG: Record<Variant, string> = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  outline: 'transparent',
  ghost: 'transparent',
  danger: '#EF4444',
};

const LABEL_COLOR: Record<Variant, string> = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  outline: '#6366F1',
  ghost: '#6366F1',
  danger: '#FFFFFF',
};

const PADDING: Record<Size, { paddingVertical: number; paddingHorizontal: number }> = {
  sm: { paddingVertical: 10, paddingHorizontal: 16 },
  md: { paddingVertical: 15, paddingHorizontal: 20 },
  lg: { paddingVertical: 18, paddingHorizontal: 24 },
};

const FONT_SIZE: Record<Size, number> = { sm: 14, md: 16, lg: 17 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  leftIcon,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: false }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: BG[variant],
        borderRadius: 14,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: variant === 'outline' ? '#6366F1' : 'transparent',
        alignSelf: fullWidth ? undefined : 'flex-start',
        width: fullWidth ? '100%' : undefined,
        opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
        transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        ...PADDING[size],
      })}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#6366F1' : '#fff'}
        />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      <Text
        style={{
          color: LABEL_COLOR[variant],
          fontSize: FONT_SIZE[size],
          fontWeight: '700',
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
