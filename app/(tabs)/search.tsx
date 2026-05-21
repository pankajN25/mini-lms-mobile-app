import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourses, useCourseCategories } from '@/hooks/useCourses';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useEnrollments } from '@/hooks/useEnrollments';
import { formatPrice, formatRating, capitalizeCategory } from '@/utils/formatters';
import { CATEGORY_COLORS } from '@/utils/categoryColors';
import { track, Events } from '@/services/analytics';
import type { Course } from '@/types/domain.types';

// ─── History helpers ──────────────────────────────────────────────────────────

const HISTORY_KEY = '@mini_lms/search_history';
const MAX_HISTORY = 8;

async function loadHistory(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}
async function saveHistory(q: string, prev: string[]): Promise<string[]> {
  const next = [q, ...prev.filter((x) => x !== q)].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
async function removeHistory(q: string, prev: string[]): Promise<string[]> {
  const next = prev.filter((x) => x !== q);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

// ─── Derived course properties (deterministic) ────────────────────────────────

function hashId(id: string): number {
  return id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
}

type Level = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

function courseLevel(id: string): Level {
  return LEVELS[hashId(id) % LEVELS.length]!;
}

function enrollmentCount(id: string): number {
  return 600 + (hashId(id) % 9400);
}

function enrollmentLabel(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Filter + sort types ──────────────────────────────────────────────────────

type PriceFilter = 'all' | 'free' | 'paid';
type RatingFilter = 0 | 3.5 | 4.0 | 4.5;
type LevelFilter = 'all' | Level;
type SortKey = 'relevant' | 'rating' | 'newest' | 'price_asc' | 'price_desc' | 'most_enrolled';

interface Filters {
  price: PriceFilter;
  rating: RatingFilter;
  level: LevelFilter;
  sort: SortKey;
}

const DEFAULT_FILTERS: Filters = {
  price: 'all',
  rating: 0,
  level: 'all',
  sort: 'relevant',
};

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'relevant', label: 'Most Relevant', icon: 'sparkles-outline' },
  { key: 'rating', label: 'Highest Rated', icon: 'star-outline' },
  { key: 'newest', label: 'Newest', icon: 'time-outline' },
  { key: 'most_enrolled', label: 'Most Enrolled', icon: 'people-outline' },
  { key: 'price_asc', label: 'Price: Low → High', icon: 'arrow-up-outline' },
  { key: 'price_desc', label: 'Price: High → Low', icon: 'arrow-down-outline' },
];

const PRICE_OPTIONS: { key: PriceFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'Any Price', icon: 'cash-outline' },
  { key: 'free', label: 'Free Only', icon: 'gift-outline' },
  { key: 'paid', label: 'Paid Only', icon: 'card-outline' },
];

const RATING_OPTIONS: { key: RatingFilter; label: string }[] = [
  { key: 0, label: 'Any Rating' },
  { key: 3.5, label: '3.5+ ★' },
  { key: 4.0, label: '4.0+ ★' },
  { key: 4.5, label: '4.5+ ★' },
];

const LEVEL_OPTIONS: { key: LevelFilter; label: string }[] = [
  { key: 'all', label: 'All Levels' },
  { key: 'Beginner', label: 'Beginner' },
  { key: 'Intermediate', label: 'Intermediate' },
  { key: 'Advanced', label: 'Advanced' },
  { key: 'All Levels', label: 'Mixed / All Levels' },
];

// ─── Count active (non-default) filters ──────────────────────────────────────

function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.price !== 'all') n++;
  if (f.rating !== 0) n++;
  if (f.level !== 'all') n++;
  if (f.sort !== 'relevant') n++;
  return n;
}

// ─── Apply filters + sort ─────────────────────────────────────────────────────

function applyFilters(
  courses: Course[],
  query: string,
  category: string,
  filters: Filters,
): Course[] {
  let r = courses;

  // Category
  if (category !== 'All') r = r.filter((c) => c.category === category);

  // Text query
  if (query.trim()) {
    const lower = query.toLowerCase();
    r = r.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower) ||
        c.instructor.name.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower)
    );
  }

  // Price filter
  if (filters.price === 'free') r = r.filter((c) => c.price === 0);
  else if (filters.price === 'paid') r = r.filter((c) => c.price > 0);

  // Rating filter
  if (filters.rating > 0) r = r.filter((c) => c.rating >= filters.rating);

  // Level filter
  if (filters.level !== 'all') r = r.filter((c) => courseLevel(c.id) === filters.level);

  // Sort
  const sorted = [...r];
  if (filters.sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  else if (filters.sort === 'newest') sorted.reverse(); // newest = end of API list (most recently added)
  else if (filters.sort === 'most_enrolled') sorted.sort((a, b) => enrollmentCount(b.id) - enrollmentCount(a.id));
  else if (filters.sort === 'price_asc') sorted.sort((a, b) => a.price - b.price);
  else if (filters.sort === 'price_desc') sorted.sort((a, b) => b.price - a.price);

  return sorted;
}

// ─── Result card ──────────────────────────────────────────────────────────────

function SearchResultCard({
  course,
  isBookmarked,
  isEnrolled,
  onBookmarkToggle,
}: {
  course: Course;
  isBookmarked: boolean;
  isEnrolled: boolean;
  onBookmarkToggle: (id: string) => void;
}) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const catColor = CATEGORY_COLORS[course.category.toLowerCase()] ?? '#6366F1';
  const level = courseLevel(course.id);
  const enrolled = enrollmentCount(course.id);

  const levelColor: Record<Level, string> = {
    Beginner: '#059669', Intermediate: '#D97706', Advanced: '#EF4444', 'All Levels': '#6366F1',
  };

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    }}>
      <Pressable
        onPress={() => router.push(`/course/${course.id}`)}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        style={{ flexDirection: 'row', padding: 12 }}
      >
        {/* Thumbnail */}
        <View style={{ width: 88, height: 88, borderRadius: 14, backgroundColor: catColor, overflow: 'hidden', flexShrink: 0 }}>
          {!imgErr ? (
            <Image
              source={{ uri: course.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
              onError={() => setImgErr(true)}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="book" size={30} color="rgba(255,255,255,0.6)" />
            </View>
          )}
          {/* Free badge */}
          {course.price === 0 && (
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#10B981', paddingVertical: 2 }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 }}>FREE</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, paddingLeft: 12, justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', lineHeight: 18, marginBottom: 2 }} numberOfLines={2}>
              {course.title}
            </Text>
            <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }} numberOfLines={1}>
              {course.instructor.name}
            </Text>
          </View>

          {/* Badges row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {/* Rating */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3 }}>
              <Ionicons name="star" size={10} color="#D97706" />
              <Text style={{ fontSize: 10, color: '#D97706', fontWeight: '800', marginLeft: 3 }}>
                {formatRating(course.rating)}
              </Text>
            </View>
            {/* Level */}
            <View style={{ backgroundColor: `${levelColor[level]}18`, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, color: levelColor[level], fontWeight: '700' }}>{level}</Text>
            </View>
            {/* Enrollment */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3 }}>
              <Ionicons name="people-outline" size={10} color="#64748B" />
              <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600', marginLeft: 3 }}>
                {enrollmentLabel(enrolled)}
              </Text>
            </View>
            {/* Discount */}
            {course.discountPercentage > 0 && (
              <View style={{ backgroundColor: '#DCFCE7', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3 }}>
                <Text style={{ fontSize: 10, color: '#059669', fontWeight: '800' }}>
                  -{Math.round(course.discountPercentage)}%
                </Text>
              </View>
            )}
          </View>

          {/* Price row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '900' }}>
              {formatPrice(course.price)}
            </Text>
            {course.discountPercentage > 0 && (
              <Text style={{ fontSize: 11, color: '#94A3B8', textDecorationLine: 'line-through', marginLeft: 6 }}>
                {formatPrice(course.originalPrice)}
              </Text>
            )}
          </View>
        </View>

        {/* Bookmark */}
        <Pressable
          onPress={(e) => { e.stopPropagation(); onBookmarkToggle(course.id); }}
          hitSlop={10}
          style={{ paddingLeft: 8, alignSelf: 'flex-start', marginTop: 2 }}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={19}
            color={isBookmarked ? '#6366F1' : '#CBD5E1'}
          />
        </Pressable>
      </Pressable>

      {/* Enrolled strip */}
      {isEnrolled && (
        <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={12} color="#059669" />
          <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700', marginLeft: 4 }}>Enrolled</Text>
        </View>
      )}
    </View>
  );
}

// ─── Radio option row ─────────────────────────────────────────────────────────

function RadioRow<T>({
  label,
  value,
  selected,
  onSelect,
  accent = '#6366F1',
}: {
  label: string;
  value: T;
  selected: T;
  onSelect: (v: T) => void;
  accent?: string;
}) {
  const active = value === selected;
  return (
    <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 6 }}>
      <Pressable
        onPress={() => onSelect(value)}
        android_ripple={{ color: `${accent}15` }}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: active ? `${accent}10` : '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: active ? accent : 'transparent' }}
      >
        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: active ? accent : '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: accent }} />}
        </View>
        <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: active ? '#0F172A' : '#475569', flex: 1 }}>
          {label}
        </Text>
        {active && <Ionicons name="checkmark" size={15} color={accent} />}
      </Pressable>
    </View>
  );
}

// ─── Filter panel (modal bottom sheet) ───────────────────────────────────────

function FilterPanel({
  visible,
  filters,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(filters);

  // Sync draft when panel opens
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} />

        {/* Sheet */}
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 34 }}>
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', flex: 1 }}>Filters & Sort</Text>
            {hasChanges && (
              <Pressable onPress={() => setDraft(DEFAULT_FILTERS)} hitSlop={8} style={{ marginRight: 12 }}>
                <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '700' }}>Reset all</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 520 }}
            contentContainerStyle={{ padding: 20 }}
          >
            {/* ── Sort By ── */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Sort By
            </Text>
            {SORT_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.key}
                label={opt.label}
                value={opt.key as SortKey}
                selected={draft.sort}
                onSelect={(v) => setDraft((d) => ({ ...d, sort: v }))}
                accent="#6366F1"
              />
            ))}

            <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 18 }} />

            {/* ── Price ── */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Price
            </Text>
            {PRICE_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.key}
                label={opt.label}
                value={opt.key as PriceFilter}
                selected={draft.price}
                onSelect={(v) => setDraft((d) => ({ ...d, price: v }))}
                accent="#10B981"
              />
            ))}

            <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 18 }} />

            {/* ── Minimum Rating ── */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Minimum Rating
            </Text>
            {RATING_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.key}
                label={opt.label}
                value={opt.key as RatingFilter}
                selected={draft.rating}
                onSelect={(v) => setDraft((d) => ({ ...d, rating: v }))}
                accent="#F59E0B"
              />
            ))}

            <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 18 }} />

            {/* ── Level ── */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Difficulty Level
            </Text>
            {LEVEL_OPTIONS.map((opt) => (
              <RadioRow
                key={String(opt.key)}
                label={opt.label}
                value={opt.key as LevelFilter}
                selected={draft.level}
                onSelect={(v) => setDraft((d) => ({ ...d, level: v }))}
                accent="#7C3AED"
              />
            ))}
          </ScrollView>

          {/* Apply button */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#6366F1', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}>
              <Pressable
                onPress={() => { onApply(draft); onClose(); }}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                style={{ paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
                  Apply Filters
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Active filter chips row ──────────────────────────────────────────────────

function ActiveChips({
  filters,
  category,
  onRemoveCategory,
  onChange,
}: {
  filters: Filters;
  category: string;
  onRemoveCategory: () => void;
  onChange: (f: Partial<Filters>) => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (category !== 'All') chips.push({ label: capitalizeCategory(category), onRemove: onRemoveCategory });
  if (filters.price !== 'all') chips.push({ label: filters.price === 'free' ? 'Free' : 'Paid', onRemove: () => onChange({ price: 'all' }) });
  if (filters.rating > 0) chips.push({ label: `${filters.rating}+ ★`, onRemove: () => onChange({ rating: 0 }) });
  if (filters.level !== 'all') chips.push({ label: String(filters.level), onRemove: () => onChange({ level: 'all' }) });
  if (filters.sort !== 'relevant') {
    const label = SORT_OPTIONS.find((o) => o.key === filters.sort)?.label ?? '';
    chips.push({ label, onRemove: () => onChange({ sort: 'relevant' }) });
  }

  if (chips.length === 0) return null;

  return (
    <View style={{ backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8, gap: 7 }}
      >
        {chips.map((chip) => (
          <View key={chip.label} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 }}>
            <Text style={{ fontSize: 11, color: '#6366F1', fontWeight: '700', marginRight: 5 }}>{chip.label}</Text>
            <Pressable onPress={chip.onRemove} hitSlop={6}>
              <Ionicons name="close-circle" size={14} color="#6366F1" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const inputRef = useRef<TextInput>(null);
  const { courses } = useCourses();
  const { bookmarks, toggle } = useBookmarks();
  const { enrolledIds } = useEnrollments();
  const categories = useCourseCategories(courses);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [history, setHistory] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    void loadHistory().then(setHistory);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.courseId)),
    [bookmarks]
  );

  const results = useMemo(
    () => applyFilters(courses, query, selectedCategory, filters),
    [courses, query, selectedCategory, filters]
  );

  const isShowingResults = query.trim().length > 0
    || selectedCategory !== 'All'
    || filters.price !== 'all'
    || filters.rating !== 0
    || filters.level !== 'all';

  const activeFCount = activeFilterCount(filters) + (selectedCategory !== 'All' ? 1 : 0);

  const handleSearch = useCallback((q: string) => {
    const t = q.trim();
    if (!t) return;
    void saveHistory(t, history).then(setHistory);
    void track(Events.SEARCH_PERFORMED, { query: t, results: results.length });
    Keyboard.dismiss();
  }, [history, results.length]);

  const handleHistoryTap = (q: string) => setQuery(q);
  const handleRemoveHistory = (q: string) => void removeHistory(q, history).then(setHistory);
  const handleClearAll = () => void clearHistory().then(() => setHistory([]));

  const handleApplyFilters = (f: Filters) => setFilters(f);
  const handleChangeFilter = (partial: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...partial }));

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* ── Header ── */}
      <View style={{ backgroundColor: '#6366F1', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)', top: -70, right: -50 }} />
        <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.05)', top: 10, left: -28 }} />
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 }}>
            {/* Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3, flex: 1 }}>
                Search
              </Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                  {courses.length} courses
                </Text>
              </View>
            </View>

            {/* Search bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 48 }}>
                <Ionicons name="search-outline" size={18} color="#94A3B8" />
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => handleSearch(query)}
                  placeholder="Courses, topics, instructors…"
                  placeholderTextColor="#94A3B8"
                  returnKeyType="search"
                  style={{ flex: 1, fontSize: 14, color: '#0F172A', marginLeft: 10 }}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* Filter button */}
              <View style={{ borderRadius: 14, overflow: 'hidden' }}>
                <Pressable
                  onPress={() => setFilterOpen(true)}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  style={{ width: 48, height: 48, backgroundColor: activeFCount > 0 ? '#fff' : 'rgba(255,255,255,0.22)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="options-outline" size={22} color={activeFCount > 0 ? '#6366F1' : '#fff'} />
                  {activeFCount > 0 && (
                    <View style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{activeFCount}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Category chips ── */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}
        >
          {['All', ...categories].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <View key={cat} style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: active ? '#6366F1' : '#F1F5F9' }}>
                <Pressable
                  onPress={() => setSelectedCategory(cat)}
                  android_ripple={{ color: active ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.1)' }}
                  style={{ paddingHorizontal: 14, paddingVertical: 7 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#64748B' }}>
                    {cat === 'All' ? 'All' : capitalizeCategory(cat)}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Active filter chips ── */}
      <ActiveChips
        filters={filters}
        category={selectedCategory}
        onRemoveCategory={() => setSelectedCategory('All')}
        onChange={handleChangeFilter}
      />

      {/* ── Results / Home state ── */}
      {isShowingResults ? (
        <>
          {/* Result count + quick sort bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Text>
            <View style={{ flex: 1 }} />
            {/* Quick sort toggles */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {SORT_OPTIONS.slice(0, 4).map((opt) => {
                const active = filters.sort === opt.key;
                return (
                  <View key={opt.key} style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: active ? '#EEF2FF' : 'transparent' }}>
                    <Pressable
                      onPress={() => setFilters((f) => ({ ...f, sort: opt.key }))}
                      android_ripple={{ color: 'rgba(99,102,241,0.1)' }}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Ionicons name={opt.icon as never} size={11} color={active ? '#6366F1' : '#94A3B8'} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#6366F1' : '#94A3B8', marginLeft: 4 }}>
                        {opt.label.split(':')[0]}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            data={results}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Ionicons name="search-outline" size={40} color="#6366F1" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>No results found</Text>
                <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20, paddingHorizontal: 40, marginBottom: 20 }}>
                  Try adjusting your filters or search terms
                </Text>
                <View style={{ borderRadius: 14, overflow: 'hidden' }}>
                  <Pressable
                    onPress={() => { setFilters(DEFAULT_FILTERS); setSelectedCategory('All'); setQuery(''); }}
                    android_ripple={{ color: 'rgba(99,102,241,0.1)' }}
                    style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 20, paddingVertical: 11 }}
                  >
                    <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '800' }}>Clear all filters</Text>
                  </Pressable>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <SearchResultCard
                course={item}
                isBookmarked={bookmarkedIds.has(item.id)}
                isEnrolled={enrolledIds.includes(item.id)}
                onBookmarkToggle={toggle}
              />
            )}
          />
        </>
      ) : (
        /* ── Home state: history + suggestions ── */
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent searches */}
          {history.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 }}>
                  Recent Searches
                </Text>
                <Pressable onPress={handleClearAll} hitSlop={8}>
                  <Text style={{ fontSize: 12, color: '#6366F1', fontWeight: '700' }}>Clear all</Text>
                </Pressable>
              </View>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                {history.map((q, i) => (
                  <View key={q} style={{ borderBottomWidth: i < history.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9', overflow: 'hidden' }}>
                    <Pressable
                      onPress={() => handleHistoryTap(q)}
                      android_ripple={{ color: 'rgba(99,102,241,0.06)' }}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                    >
                      <Ionicons name="time-outline" size={16} color="#94A3B8" />
                      <Text style={{ flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500', marginLeft: 12 }}>{q}</Text>
                      <Pressable onPress={() => handleRemoveHistory(q)} hitSlop={10}>
                        <Ionicons name="close-outline" size={16} color="#CBD5E1" />
                      </Pressable>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quick filters */}
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            Quick Filters
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {[
              { label: '⭐ Top Rated 4.5+', action: () => setFilters((f) => ({ ...f, rating: 4.5, sort: 'rating' })) },
              { label: '🎁 Free Courses', action: () => setFilters((f) => ({ ...f, price: 'free' })) },
              { label: '🔥 Most Popular', action: () => setFilters((f) => ({ ...f, sort: 'most_enrolled' })) },
              { label: '🆕 Newest', action: () => setFilters((f) => ({ ...f, sort: 'newest' })) },
              { label: '🌱 Beginner', action: () => setFilters((f) => ({ ...f, level: 'Beginner' })) },
              { label: '⚡ Advanced', action: () => setFilters((f) => ({ ...f, level: 'Advanced' })) },
            ].map((item) => (
              <View key={item.label} style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                <Pressable
                  onPress={() => { item.action(); setSelectedCategory('All'); }}
                  android_ripple={{ color: 'rgba(99,102,241,0.1)' }}
                  style={{ paddingHorizontal: 14, paddingVertical: 9 }}
                >
                  <Text style={{ fontSize: 12, color: '#374151', fontWeight: '700' }}>{item.label}</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Browse categories */}
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            Browse Categories
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {categories.slice(0, 12).map((cat) => {
              const color = CATEGORY_COLORS[cat.toLowerCase()] ?? '#6366F1';
              const count = courses.filter((c) => c.category === cat).length;
              return (
                <View key={cat} style={{ borderRadius: 14, overflow: 'hidden' }}>
                  <Pressable
                    onPress={() => setSelectedCategory(cat)}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                    style={{ backgroundColor: color, paddingHorizontal: 14, paddingVertical: 11 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Ionicons name="grid-outline" size={13} color="rgba(255,255,255,0.85)" />
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', marginLeft: 5 }}>
                        {capitalizeCategory(cat)}
                      </Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' }}>
                      {count} {count === 1 ? 'course' : 'courses'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Popular searches */}
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 12 }}>
            Popular Searches
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['React Native', 'Python', 'UI Design', 'Machine Learning', 'JavaScript', 'Data Science', 'Flutter', 'Node.js'].map((term) => (
              <View key={term} style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                <Pressable
                  onPress={() => setQuery(term)}
                  android_ripple={{ color: 'rgba(99,102,241,0.1)' }}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
                >
                  <Ionicons name="trending-up-outline" size={12} color="#6366F1" />
                  <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600', marginLeft: 5 }}>{term}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── Filter panel ── */}
      <FilterPanel
        visible={filterOpen}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}
