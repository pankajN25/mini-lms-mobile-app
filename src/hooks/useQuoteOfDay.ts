import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@mini_lms/quote_of_day';

export interface DailyQuote {
  q: string;
  a: string;
}

interface CachedPayload {
  date: string; // YYYY-MM-DD
  quote: DailyQuote;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useQuoteOfDay() {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Check cache first
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached: CachedPayload = JSON.parse(raw);
          if (cached.date === todayStr()) {
            if (!cancelled) setQuote(cached.quote);
            return;
          }
        }
      } catch {
        // cache miss — fall through to fetch
      }

      // Fetch fresh quote
      try {
        const res = await fetch('https://zenquotes.io/api/today');
        if (!res.ok) throw new Error('non-200');
        const data: DailyQuote[] = await res.json();
        const q = data[0];
        if (q?.q) {
          const payload: CachedPayload = { date: todayStr(), quote: q };
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
          if (!cancelled) setQuote(q);
        }
      } catch {
        // Network failed — silently hide the quote card
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return { quote, loading };
}
