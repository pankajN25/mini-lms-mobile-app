import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLocalAvatar(userId: string | undefined): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void AsyncStorage.getItem(`@mini_lms/local_avatar_${userId}`).then(setUri);
  }, [userId]);

  return uri;
}
