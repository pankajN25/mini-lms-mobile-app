import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

const LOCAL_AVATAR_KEY = '@mini_lms/local_avatar';

function InitialsAvatar({ name, size }: { name: string; size: number }) {
  const palette = ['#6366F1', '#7C3AED', '#059669', '#0EA5E9', '#D97706'];
  const bg = palette[name.charCodeAt(0) % palette.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.33, fontWeight: '800' }}>
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateLocalUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.username ?? '');
  const [bio, setBio] = useState('');
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (user?.id) {
      void AsyncStorage.getItem(`${LOCAL_AVATAR_KEY}_${user.id}`).then((v) => {
        if (v) setLocalAvatar(v);
      });
    }
  }, [user?.id]);

  const avatarUri = localAvatar || user?.avatarUrl || null;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setPicking(true);
    try {
      const uri = result.assets[0].uri;
      await AsyncStorage.setItem(`${LOCAL_AVATAR_KEY}_${user!.id}`, uri);
      setLocalAvatar(uri);
    } finally {
      setPicking(false);
    }
  };

  const handleSave = async () => {
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters');
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length > 40) {
      setNameError('Name must be 40 characters or fewer');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      await new Promise<void>((r) => setTimeout(r, 800));
      if (user) updateLocalUser({ ...user, username: trimmed });
      Alert.alert('Profile Updated', 'Your profile has been saved successfully.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* ── Header ── */}
      <View style={{ backgroundColor: '#6366F1', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -40 }} />
        <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)', top: 20, left: -25 }} />
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}>
            <Pressable onPress={() => router.back()} hitSlop={12}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>Edit Profile</Text>
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }}>Update your personal info</Text>
            </View>
            <Pressable
              onPress={() => void handleSave()}
              disabled={saving}
              hitSlop={8}
              style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">

          {/* ── Avatar ── */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Pressable onPress={() => void handlePickImage()} style={{ position: 'relative' }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#6366F1', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={{ width: 94, height: 94 }} contentFit="cover" />
                  ) : (
                    <InitialsAvatar name={user.username} size={94} />
                  )}
                </View>
              </View>
              <View style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
                borderWidth: 2.5, borderColor: '#F8FAFC',
              }}>
                {picking
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="camera" size={15} color="#fff" />
                }
              </View>
            </Pressable>
            <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '700', marginTop: 10 }}>
              Tap to change photo
            </Text>
          </View>

          {/* ── Fields ── */}
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginLeft: 2 }}>
            Account Details
          </Text>

          <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 20 }}>
            {/* Display name */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Display Name
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5,
                borderColor: nameError ? '#EF4444' : '#E2E8F0',
                paddingHorizontal: 12, minHeight: 48,
              }}>
                <Ionicons name="person-outline" size={17} color={nameError ? '#EF4444' : '#94A3B8'} />
                <TextInput
                  ref={inputRef}
                  value={displayName}
                  onChangeText={(t) => { setDisplayName(t); setNameError(''); }}
                  placeholder="Your display name"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 10, marginLeft: 10 }}
                  autoCapitalize="words"
                  maxLength={40}
                />
                <Text style={{ fontSize: 11, color: '#CBD5E1', marginLeft: 6 }}>
                  {displayName.length}/40
                </Text>
              </View>
              {nameError ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 12, marginLeft: 5 }}>{nameError}</Text>
                </View>
              ) : null}
            </View>

            {/* Email — read-only */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Email Address
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, minHeight: 48, borderWidth: 1.5, borderColor: '#E2E8F0' }}>
                <Ionicons name="mail-outline" size={17} color="#94A3B8" />
                <Text style={{ flex: 1, fontSize: 15, color: '#64748B', marginLeft: 10 }}>{user.email}</Text>
                <View style={{ backgroundColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>Read only</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, marginLeft: 2 }}>
                Email is tied to your account and cannot be changed here.
              </Text>
            </View>
          </View>

          {/* Bio */}
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginLeft: 2 }}>
            About You
          </Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 28 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Short Bio <Text style={{ color: '#CBD5E1' }}>(optional)</Text>
            </Text>
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 12 }}>
              <TextInput
                value={bio}
                onChangeText={(t) => t.length <= 120 && setBio(t)}
                placeholder="Tell us a little about yourself…"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                style={{ fontSize: 14, color: '#0F172A', lineHeight: 22, minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
            <Text style={{ fontSize: 11, color: '#CBD5E1', textAlign: 'right', marginTop: 6 }}>
              {bio.length}/120
            </Text>
          </View>

          {/* Save button */}
          <View style={{ borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, opacity: saving ? 0.72 : 1 }}>
            <Pressable
              onPress={() => void handleSave()}
              disabled={saving}
              android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
              style={{ backgroundColor: '#6366F1', paddingVertical: 17, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                {saving ? 'Saving changes…' : 'Save Changes'}
              </Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
