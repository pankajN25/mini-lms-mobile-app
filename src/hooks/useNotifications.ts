import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermission } from '@/services/notifications/permissions';
import {
  cancelReEngagementReminder,
  scheduleReEngagementReminder,
} from '@/services/notifications/scheduler';
import { saveLastActiveAt } from '@/store/preferences.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    void (async () => {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await saveLastActiveAt();
      await cancelReEngagementReminder();
      await scheduleReEngagementReminder();
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;

      if (prev.match(/inactive|background/) && next === 'active') {
        await saveLastActiveAt();
        await cancelReEngagementReminder();
        await scheduleReEngagementReminder();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      console.info('Notification received:', notification.request.content.title);
    });
    return () => sub.remove();
  }, []);
}
