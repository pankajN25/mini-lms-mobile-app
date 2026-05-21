import type { Course } from '@/types/domain.types';

// Messages sent from Native → WebView
export type NativeToWebMessage =
  | { type: 'COURSE_DATA'; payload: Course }
  | { type: 'AUTH_TOKEN'; payload: { token: string } };

// Messages received by Native ← WebView
export type WebToNativeMessage =
  | { type: 'ENROLL_CLICKED'; payload: { courseId: string } }
  | { type: 'CONTENT_LOADED' }
  | { type: 'BOOKMARK_CLICKED'; payload: { courseId: string } };

export function buildInjectScript(message: NativeToWebMessage): string {
  const json = JSON.stringify(message);
  return `
    (function() {
      if (window.__nativeBridgeReady) {
        window.dispatchEvent(new MessageEvent('nativeMessage', { data: '${json.replace(/'/g, "\\'")}' }));
      } else {
        window.__pendingNativeMessages = window.__pendingNativeMessages || [];
        window.__pendingNativeMessages.push('${json.replace(/'/g, "\\'")}');
      }
    })();
    true;
  `;
}

export function parseWebMessage(raw: string): WebToNativeMessage | null {
  try {
    return JSON.parse(raw) as WebToNativeMessage;
  } catch {
    return null;
  }
}
