import * as Notifications from 'expo-notifications';
import { NOTIFICATION_IDS, RE_ENGAGEMENT_HOURS } from '@/utils/constants';

export async function scheduleBookmarkMilestone(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.BOOKMARK_MILESTONE).catch(
    () => {}
  );
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.BOOKMARK_MILESTONE,
    content: {
      title: 'You\'re on a roll! 🎯',
      body: "You've saved 5 courses — time to start learning!",
      sound: true,
    },
    trigger: null,
  });
}

export async function scheduleReEngagementReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.RE_ENGAGEMENT).catch(
    () => {}
  );
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.RE_ENGAGEMENT,
    content: {
      title: 'Miss learning? 📚',
      body: 'Your courses are waiting for you. Pick up where you left off!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: RE_ENGAGEMENT_HOURS * 60 * 60,
      repeats: false,
    },
  });
}

export async function cancelReEngagementReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.RE_ENGAGEMENT).catch(
    () => {}
  );
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
