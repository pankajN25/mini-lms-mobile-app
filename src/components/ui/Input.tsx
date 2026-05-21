import { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Input({
  label,
  error,
  hint,
  icon,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error ? '#F87171' : focused ? '#6366F1' : '#E2E8F0';
  const bgColor = error ? '#FFF8F8' : focused ? '#FAFAFE' : '#F8FAFC';
  const iconColor = error ? '#F87171' : focused ? '#6366F1' : '#94A3B8';

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={{ marginBottom: 18 }}>
      {label ? (
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 7 }}>
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: bgColor,
          borderWidth: 1.5,
          borderColor,
          borderRadius: 14,
          paddingHorizontal: 14,
          minHeight: 54,
        }}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={iconColor} style={{ marginRight: 10 }} />
        ) : null}

        <TextInput
          style={[{ flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 13 }, style]}
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          secureTextEntry={!!secureTextEntry && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {secureTextEntry ? (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ paddingLeft: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={focused ? '#6366F1' : '#94A3B8'}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginLeft: 2 }}>
          <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
          <Text style={{ fontSize: 12, color: '#EF4444' }}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 5, marginLeft: 2 }}>{hint}</Text>
      ) : null}
    </View>
  );
}
