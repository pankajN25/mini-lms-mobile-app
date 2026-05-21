import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCourses } from '@/hooks/useCourses';
import { useProgress } from '@/hooks/useProgress';
import {
  buildNotifications,
  getReadIds,
  getDismissedIds,
  markRead,
  markAllRead,
  dismissNotif,
  relativeTime,
  type AppNotification,
  type NotifType,
} from '@/store/notifications.store';

// ─── Config per notification type ────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, { icon: string; color: string; bg: string; label: string }> = {
  enrolled: { icon: 'school', color: '#6366F1', bg: '#EEF2FF', label: 'Enrolled' },
  certificate: { icon: 'trophy', color: '#D97706', bg: '#FEF3C7', label: 'Certificate' },
  new_course: { icon: 'sparkles', color: '#7C3AED', bg: '#F5F3FF', label: 'New Course' },
  achievement: { icon: 'ribbon', color: '#059669', bg: '#DCFCE7', label: 'Achievement' },
  reminder: { icon: 'alarm', color: '#F97316', bg: '#FFF7ED', label: 'Reminder' },
};

// ─── Notification card ────────────────────────────────────────────────────────

function NotifCard({
  notif,
  onRead,
  onDismiss,
  onPress,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onPress: (notif: AppNotification) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];

  return (
    <View style={{
      backgroundColor: notif.read ? '#fff' : '#F8FAFF',
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: notif.read ? '#F1F5F9' : '#E0E7FF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: notif.read ? 0.03 : 0.07,
      shadowRadius: 8,
      elevation: notif.read ? 1 : 3,
      overflow: 'hidden',
    }}>
      {/* Unread indicator strip */}
      {!notif.read && (
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: cfg.color, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />
      )}

      <Pressable
        onPress={() => { onRead(notif.id); onPress(notif); }}
        android_ripple={{ color: 'rgba(99,102,241,0.06)' }}
        style={{ flexDirection: 'row', padding: 14, paddingLeft: notif.read ? 14 : 17 }}
      >
        {/* Icon */}
        <View style={{
          width: 46, height: 46, borderRadius: 14,
          backgroundColor: cfg.bg,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12, flexShrink: 0,
        }}>
          <Ionicons name={cfg.icon as never} size={22} color={cfg.color} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <View style={{ backgroundColor: cfg.bg, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginRight: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: cfg.color, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {cfg.label}
              </Text>
            </View>
            {!notif.read && (
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: cfg.color }} />
            )}
            <Text style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>
              {relativeTime(notif.timestamp)}
            </Text>
          </View>

          <Text style={{ fontSize: 13, fontWeight: notif.read ? '600' : '800', color: '#0F172A', marginBottom: 4, lineHeight: 18 }}>
            {notif.title}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 18 }} numberOfLines={2}>
            {notif.body}
          </Text>
        </View>

        {/* Dismiss button */}
        <Pressable
          onPress={() => onDismiss(notif.id)}
          hitSlop={10}
          style={{ paddingLeft: 8, alignSelf: 'flex-start', marginTop: 2 }}
        >
          <Ionicons name="close-outline" size={18} color="#CBD5E1" />
        </Pressable>
      </Pressable>
    </View>
  );
}

// ─── Filter tab ───────────────────────────────────────────────────────────────

type FilterKey = 'all' | NotifType;
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'enrolled', label: 'Enrolled' },
  { key: 'certificate', label: 'Certificates' },
  { key: 'new_course', label: 'New Courses' },
  { key: 'reminder', label: 'Reminders' },
  { key: 'achievement', label: 'Achievements' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { courses } = useCourses();
  const { enrolledIds } = useEnrollments();
  const { bookmarks } = useBookmarks();
  const { getCoursePercent } = useProgress();

  const [rawNotifs, setRawNotifs] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterKey>('all');

  // Build notifications when data is ready
  const enrolledTitles = useMemo(() => {
    const map: Record<string, string> = {};
    courses.forEach((c) => { if (enrolledIds.includes(c.id)) map[c.id] = c.title; });
    return map;
  }, [courses, enrolledIds]);

  const bookmarkedCategories = useMemo(
    () => [...new Set(
      bookmarks
        .map((b) => courses.find((c) => c.id === b.courseId)?.category)
        .filter(Boolean) as string[]
    )],
    [bookmarks, courses]
  );

  // Course IDs where the user has completed every lesson shown (getCoursePercent === 100)
  const completedCourseIds = useMemo(
    () => enrolledIds.filter((id) => getCoursePercent(id) === 100),
    [enrolledIds, getCoursePercent]
  );

  // Load read/dismissed state from storage — both must be restored so dismissals survive navigation
  const loadState = useCallback(async () => {
    const [rIds, dIds] = await Promise.all([getReadIds(), getDismissedIds()]);
    setReadIds(rIds);
    setDismissedIds(dIds);
  }, []);

  useFocusEffect(useCallback(() => { void loadState(); }, [loadState]));

  useEffect(() => {
    const built = buildNotifications(enrolledIds, enrolledTitles, bookmarkedCategories, completedCourseIds);
    setRawNotifs(built);
  }, [enrolledIds, enrolledTitles, bookmarkedCategories, completedCourseIds]);

  // Merge read state into notifications, filter dismissed
  const notifications = useMemo<AppNotification[]>(
    () =>
      rawNotifs
        .filter((n) => !dismissedIds.has(n.id))
        .map((n) => ({ ...n, read: readIds.has(n.id) })),
    [rawNotifs, readIds, dismissedIds]
  );

  const filtered = useMemo(
    () => filter === 'all' ? notifications : notifications.filter((n) => n.type === filter),
    [notifications, filter]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const handleRead = useCallback((id: string) => {
    if (readIds.has(id)) return;
    void markRead([id]).then(() => {
      setReadIds((prev) => new Set([...prev, id]));
    });
  }, [readIds]);

  const handleDismiss = useCallback((id: string) => {
    void dismissNotif(id).then(() => {
      setDismissedIds((prev) => new Set([...prev, id]));
    });
    void markRead([id]);
  }, []);

  const handleMarkAllRead = () => {
    const ids = notifications.map((n) => n.id);
    void markAllRead(ids).then(() => setReadIds(new Set(ids)));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will dismiss all notifications. You can\'t undo this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All', style: 'destructive', onPress: () => {
            const ids = new Set(notifications.map((n) => n.id));
            setDismissedIds((prev) => new Set([...prev, ...ids]));
            void markAllRead([...ids]);
          },
        },
      ]
    );
  };

  const handleNotifPress = (notif: AppNotification) => {
    if (notif.courseId) {
      router.push(`/course/${notif.courseId}`);
    }
  };

  // Group: Today vs Earlier
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const todayNotifs = filtered.filter((n) => n.timestamp >= todayMs);
  const earlierNotifs = filtered.filter((n) => n.timestamp < todayMs);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* ── Header ── */}
      <View style={{ backgroundColor: '#6366F1', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)', top: -70, right: -50 }} />
        <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', top: 10, left: -30 }} />

        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
            {/* Title row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>Notifications</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2, fontWeight: '500' }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </Text>
              </View>

              {/* Action buttons */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {unreadCount > 0 && (
                  <Pressable
                    onPress={handleMarkAllRead}
                    hitSlop={8}
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Read all</Text>
                  </Pressable>
                )}
                {notifications.length > 0 && (
                  <Pressable
                    onPress={handleClearAll}
                    hitSlop={8}
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' }}>Clear</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Filter tabs ── */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = f.key === 'all'
              ? notifications.filter((n) => !n.read).length
              : notifications.filter((n) => n.type === f.key && !n.read).length;
            return (
              <View key={f.key} style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: active ? '#6366F1' : '#F1F5F9' }}>
                <Pressable
                  onPress={() => setFilter(f.key)}
                  android_ripple={{ color: active ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.1)' }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#64748B' }}>
                    {f.label}
                  </Text>
                  {count > 0 && (
                    <View style={{ backgroundColor: active ? 'rgba(255,255,255,0.3)' : '#6366F1', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#fff' }}>{count}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="notifications-off-outline" size={40} color="#6366F1" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>
            {filter === 'all' ? 'No notifications yet' : 'Nothing here'}
          </Text>
          <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20, paddingHorizontal: 48 }}>
            {filter === 'all'
              ? 'Enroll in courses and you\'ll see updates about your learning here.'
              : 'No notifications in this category.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          {/* Today */}
          {todayNotifs.length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 2 }}>
                Today
              </Text>
              {todayNotifs.map((n) => (
                <NotifCard
                  key={n.id}
                  notif={n}
                  onRead={handleRead}
                  onDismiss={handleDismiss}
                  onPress={handleNotifPress}
                />
              ))}
            </>
          )}

          {/* Earlier */}
          {earlierNotifs.length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 2, marginTop: todayNotifs.length > 0 ? 16 : 0 }}>
                Earlier
              </Text>
              {earlierNotifs.map((n) => (
                <NotifCard
                  key={n.id}
                  notif={n}
                  onRead={handleRead}
                  onDismiss={handleDismiss}
                  onPress={handleNotifPress}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
