import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { sendMessage, sendDemoMessage, parseRetrySeconds, type ChatMessage, type CourseContext } from '@/services/ai/gemini';
import type { Course } from '@/types/domain.types';

const { height: SCREEN_H } = Dimensions.get('window');

const SUGGESTED = [
  'What will I learn?',
  'Good for beginners?',
  'How long to complete?',
  'Career benefits?',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseError(err: unknown): { kind: 'quota' | 'auth' | 'network' | 'unknown'; msg: string } {
  if (err instanceof Error) {
    const raw = err.message;
    if (raw === 'NO_API_KEY') return { kind: 'auth', msg: raw };
    const [statusStr, ...rest] = raw.split(':');
    const status = Number(statusStr);
    const detail = rest.join(':').toLowerCase();
    if (status === 429 || detail.includes('quota') || detail.includes('rate'))
      return { kind: 'quota', msg: raw };
    if (status === 400 || status === 401 || status === 403 || detail.includes('api key') || detail.includes('invalid'))
      return { kind: 'auth', msg: raw };
    if (detail.includes('network') || detail.includes('failed to fetch') || status === 0)
      return { kind: 'network', msg: raw };
  }
  return { kind: 'unknown', msg: String(err) };
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withSequence(
      withTiming(-4, { duration: 300 }),
      withTiming(0, { duration: 300 }),
    ), -1));
  }, [delay, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View
      style={[style, { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1', marginHorizontal: 2, opacity: 0.7 }]}
    />
  );
}

// ─── Floating pill button ─────────────────────────────────────────────────────

function FloatingButton({ onPress, bottomOffset }: { onPress: () => void; bottomOffset: number }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withDelay(2000, withRepeat(withSequence(
      withSpring(1.06, { damping: 5 }),
      withSpring(1, { damping: 12 }),
    ), 4));
  }, [scale]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: 'absolute',
          right: 16,
          bottom: bottomOffset,
          zIndex: 999,
          // shadow (iOS)
          shadowColor: '#6366F1',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 14,
        },
      ]}
    >
      {/* White pill — visible on any background */}
      <View
        className="flex-row items-center rounded-full bg-white overflow-hidden"
        style={{
          borderWidth: 2,
          borderColor: '#6366F1',
          elevation: 14,
        }}
      >
        <Pressable
          onPress={onPress}
          android_ripple={{ color: 'rgba(99,102,241,0.12)' }}
          className="flex-row items-center pl-3 pr-4 py-2.5"
        >
          {/* Indigo icon circle */}
          <View className="w-8 h-8 rounded-full bg-indigo-500 items-center justify-center">
            <Ionicons name="sparkles" size={16} color="#FCD34D" />
          </View>
          <View className="ml-2">
            <Text className="text-indigo-600 text-[13px] font-black">Ask AI</Text>
            <Text className="text-slate-400 text-[10px] font-semibold">Gemini · MiniLMS</Text>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View
      className={`mb-3 px-4 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ alignItems: 'flex-end' }}
    >
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-indigo-500 items-center justify-center mr-2 shrink-0 mb-0.5">
          <Ionicons name="sparkles" size={14} color="#FCD34D" />
        </View>
      )}
      <View
        className={`max-w-[78%] px-4 py-3 ${
          isUser
            ? 'bg-indigo-500 rounded-[20px] rounded-br-[4px]'
            : 'bg-slate-100 rounded-[20px] rounded-bl-[4px]'
        }`}
      >
        <Text className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-slate-800'}`}>
          {message.text}
        </Text>
      </View>
      {isUser && (
        <View className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center ml-2 shrink-0 mb-0.5">
          <Ionicons name="person" size={14} color="#64748B" />
        </View>
      )}
    </View>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ kind, onDismiss }: { kind: 'network' | 'unknown'; onDismiss: () => void }) {
  const config = {
    network: { icon: 'wifi-outline' as const,         color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', title: 'No connection',        body: 'Check your internet and try again.' },
    unknown: { icon: 'alert-circle-outline' as const, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', title: 'Something went wrong',  body: 'Could not get a response. Please try again.' },
  }[kind];

  return (
    <View className="mx-3.5 mb-2.5 rounded-2xl p-3.5 flex-row items-center"
      style={{ backgroundColor: config.bg, borderWidth: 1, borderColor: config.border }}>
      <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: config.color + '20' }}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>
      <View className="flex-1">
        <Text className="text-slate-900 text-[13px] font-extrabold mb-0.5">{config.title}</Text>
        <Text className="text-slate-500 text-xs">{config.body}</Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={10}>
        <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
      </Pressable>
    </View>
  );
}

// ─── No key screen ────────────────────────────────────────────────────────────

function NoKeyScreen() {
  return (
    <View className="p-7 items-center">
      <View className="w-20 h-20 rounded-full bg-indigo-50 items-center justify-center mb-4">
        <Ionicons name="key-outline" size={36} color="#6366F1" />
      </View>
      <Text className="text-lg font-black text-slate-900 mb-2 text-center">
        Gemini API Key Required
      </Text>
      <Text className="text-[13px] text-slate-500 text-center leading-[21px] mb-4">
        Your key is in{' '}
        <Text className="font-bold text-indigo-500">.env.local</Text>
        {'\n'}Rebuild the app to load it.
      </Text>
      <View className="bg-orange-50 rounded-2xl p-3.5 border border-orange-200 w-full">
        <Text className="text-orange-900 text-[11px] font-extrabold mb-1">REBUILD COMMAND</Text>
        <Text
          className="text-orange-700 text-xs leading-5"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
        >
          npx expo run:android
        </Text>
      </View>
    </View>
  );
}

// ─── Welcome empty state ──────────────────────────────────────────────────────

function WelcomeState({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  return (
    <View className="px-4 pt-2 pb-1">
      {/* AI greeting bubble */}
      <View className="flex-row items-end mb-5">
        <View className="w-8 h-8 rounded-full bg-indigo-500 items-center justify-center mr-2 shrink-0">
          <Ionicons name="sparkles" size={14} color="#FCD34D" />
        </View>
        <View className="bg-slate-100 rounded-[20px] rounded-bl-[4px] px-4 py-3 max-w-[80%]">
          <Text className="text-slate-800 text-sm leading-[22px]">
            Hi! I'm your AI study buddy. Ask me anything about this course 👋
          </Text>
        </View>
      </View>

      <Text className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest mb-2.5 ml-10">
        Quick questions
      </Text>

      <View className="flex-row flex-wrap ml-10">
        {SUGGESTED.map((q) => (
          <View key={q} className="rounded-[22px] overflow-hidden mr-2 mb-2">
            <Pressable
              onPress={() => onSuggestion(q)}
              android_ripple={{ color: 'rgba(99,102,241,0.15)' }}
              className="flex-row items-center bg-white border-2 border-indigo-200 rounded-[22px] px-3 py-[7px]"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={12} color="#6366F1" />
              <Text className="text-indigo-500 text-xs font-bold ml-1">{q}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CourseAssistantProps {
  course: Course;
  bottomOffset: number;
}

export function CourseAssistant({ course, bottomOffset }: CourseAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<'network' | 'unknown' | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const scrollToBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  const context: CourseContext = {
    title: course.title,
    description: course.description,
    category: course.category,
    instructorName: course.instructor.name,
    rating: course.rating,
  };

  const doSend = useCallback(async (text: string, history: ChatMessage[]) => {
    setLoading(true);
    setErrorKind(null);
    scrollToBottom();
    try {
      // Try the real Gemini API first
      const reply = await sendMessage(history, context);
      setIsDemoMode(false);
      setMessages([...history, { role: 'model', text: reply }]);
      scrollToBottom();
    } catch (err) {
      const parsed = parseError(err);

      if (parsed.kind === 'quota' || parsed.kind === 'auth') {
        // Quota exceeded or key issue → silently fall back to demo mode
        setIsDemoMode(true);
        try {
          const demoReply = await sendDemoMessage(history, context);
          setMessages([...history, { role: 'model', text: demoReply }]);
          scrollToBottom();
        } catch {
          setErrorKind('unknown');
        }
      } else if (parsed.kind === 'network') {
        setErrorKind('network');
      } else {
        setErrorKind('unknown');
      }
    } finally {
      setLoading(false);
    }
  }, [context]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = { role: 'user', text: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    Keyboard.dismiss();
    await doSend(trimmed, history);
  }, [messages, loading, doSend]);

  const handleDismissError = useCallback(() => {
    setErrorKind(null);
  }, []);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setErrorKind(null);
    setIsDemoMode(false);
    setInput('');
  }, []);
  const canSend = input.trim().length > 0 && !loading;

  return (
    <>
      <FloatingButton onPress={() => setOpen(true)} bottomOffset={bottomOffset} />

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { Keyboard.dismiss(); setOpen(false); }}
      >
        {/* KeyboardAvoidingView fixes the keyboard-hiding-chat problem */}
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Semi-transparent backdrop */}
          <View className="flex-1" style={{ backgroundColor: 'rgba(15,23,42,0.55)' }}>
            <Pressable className="flex-1" onPress={() => { Keyboard.dismiss(); setOpen(false); }} />

            {/* Bottom sheet panel */}
            <View
              className="bg-white rounded-t-3xl overflow-hidden"
              style={{ maxHeight: SCREEN_H * 0.88 }}
            >
              {/* Drag handle */}
              <View className="items-center pt-2.5 pb-1">
                <View className="w-10 h-1 rounded-full bg-slate-200" />
              </View>

              {/* Header */}
              <View className="flex-row items-center px-4 pt-2.5 pb-3.5 border-b border-slate-100">
                {/* AI avatar */}
                <View
                  className="w-11 h-11 rounded-full bg-indigo-500 items-center justify-center mr-3"
                  style={{
                    shadowColor: '#6366F1',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Ionicons name="sparkles" size={20} color="#FCD34D" />
                </View>

                <View className="flex-1">
                  <Text className="text-base font-black text-slate-900 tracking-tight">
                    AI Course Assistant
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                    <Text className="text-[11px] text-slate-400 font-semibold" numberOfLines={1}>
                      Gemini · {course.title}
                    </Text>
                  </View>
                </View>

                {messages.length > 0 && (
                  <Pressable
                    onPress={handleClearChat}
                    hitSlop={8}
                    className="mr-2 px-2.5 py-1.5 bg-slate-100 rounded-xl"
                  >
                    <Text className="text-slate-500 text-[11px] font-bold">Clear</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => { Keyboard.dismiss(); setOpen(false); }}
                  className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Ionicons name="close" size={17} color="#64748B" />
                </Pressable>
              </View>

              {/* Demo mode banner */}
              {isDemoMode && (
                <View className="mx-4 mt-2 mb-1 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2 flex-row items-center">
                  <Ionicons name="flash-outline" size={14} color="#D97706" />
                  <Text className="text-amber-700 text-[11px] font-bold ml-1.5 flex-1">
                    Demo mode — get a free key at aistudio.google.com for live AI
                  </Text>
                </View>
              )}

              {/* Content */}
              <>
                {/* Messages */}
                <ScrollView
                  ref={scrollRef}
                  style={{ maxHeight: SCREEN_H * 0.44 }}
                  contentContainerStyle={{ paddingTop: 14, paddingBottom: 6 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {messages.length === 0 && (
                    <WelcomeState onSuggestion={(q) => void handleSend(q)} />
                  )}

                  {messages.map((msg, i) => <ChatBubble key={i} message={msg} />)}

                  {/* Typing indicator */}
                  {loading && (
                    <View className="flex-row items-end mb-3 px-4">
                      <View className="w-8 h-8 rounded-full bg-indigo-500 items-center justify-center mr-2 shrink-0">
                        <Ionicons name="sparkles" size={14} color="#FCD34D" />
                      </View>
                      <View className="bg-slate-100 rounded-[20px] rounded-bl-[4px] px-4 py-3.5 flex-row items-center">
                        <TypingDot delay={0} />
                        <TypingDot delay={150} />
                        <TypingDot delay={300} />
                      </View>
                    </View>
                  )}

                  {errorKind && (
                    <ErrorBanner
                      kind={errorKind}
                      onDismiss={handleDismissError}
                    />
                  )}
                </ScrollView>

                  {/* Input bar */}
                  <View className="flex-row items-end px-3.5 py-3 border-t border-slate-100 bg-white">
                    {/* TextInput wrapper */}
                    <View
                      className="flex-1 mr-2.5 bg-slate-50 rounded-3xl justify-center"
                      style={{
                        minHeight: 46,
                        borderWidth: 1.5,
                        borderColor: input.length > 0 ? '#A5B4FC' : '#E2E8F0',
                      }}
                    >
                      <TextInput
                        ref={inputRef}
                        className="px-4 text-sm text-slate-900"
                        style={{ paddingTop: 12, paddingBottom: 12, maxHeight: 100, lineHeight: 20 }}
                        placeholder="Ask about this course…"
                        placeholderTextColor="#94A3B8"
                        value={input}
                        onChangeText={setInput}
                        multiline
                        returnKeyType="send"
                        blurOnSubmit
                        onSubmitEditing={() => void handleSend(input)}
                        editable={!loading}
                      />
                    </View>

                    {/* Send button */}
                    <View
                      className={`w-[46px] h-[46px] rounded-full overflow-hidden items-center justify-center ${canSend ? 'bg-indigo-500' : 'bg-slate-200'}`}
                      style={{
                        shadowColor: canSend ? '#6366F1' : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: canSend ? 6 : 0,
                      }}
                    >
                      <Pressable
                        onPress={() => void handleSend(input)}
                        disabled={!canSend}
                        android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                        className="w-[46px] h-[46px] items-center justify-center"
                      >
                        {loading
                          ? <ActivityIndicator size="small" color="#6366F1" />
                          : <Ionicons name="arrow-up" size={20} color={canSend ? '#fff' : '#94A3B8'} />
                        }
                      </Pressable>
                    </View>
                  </View>
                </>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
