/**
 * Wraps the Web Notifications API with two adapters:
 *
 *  - ServiceWorker registration when one is available — required for
 *    notifications that should appear on the lock screen of an installed
 *    PWA (iOS 16.4+ standalone, Android Chrome PWA).
 *  - `new Notification(...)` fallback for desktop Chrome/Firefox running
 *    in a normal tab without a SW.
 *
 * All notifications used in the workout flow share the tag `rest-timer`
 * so re-show calls replace the previous banner instead of stacking.
 */

const REST_TIMER_TAG = 'rest-timer';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function ensureNotificationPermission(): Promise<NotificationPermissionState> {
  const current = getNotificationPermission();
  if (current !== 'default') return current;
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

interface RestNotificationOpts {
  title: string;
  body: string;
  url?: string;
  /** Show on lock screen until dismissed. Honored on desktop; iOS may ignore. */
  requireInteraction?: boolean;
  /** Optional epoch ms — used as the notification `timestamp` so the lock
   *  screen shows accurate elapsed time on supported platforms. */
  timestamp?: number;
}

async function getServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    // `ready` resolves when the SW is active. With vite-plugin-pwa autoUpdate
    // this is usually instant after the first page load.
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function showRestNotification(opts: RestNotificationOpts): Promise<void> {
  if (getNotificationPermission() !== 'granted') return;
  const url = opts.url ?? '/workouts/active';
  const data = { url, kind: 'rest-timer' as const };
  const baseOptions: NotificationOptions = {
    body: opts.body,
    tag: REST_TIMER_TAG,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    requireInteraction: opts.requireInteraction ?? false,
    data,
    // `silent` and `renotify` aren't supported on iOS; harmless elsewhere.
    silent: false,
    renotify: true,
  } as NotificationOptions;
  if (opts.timestamp != null) {
    (baseOptions as NotificationOptions & { timestamp: number }).timestamp = opts.timestamp;
  }

  const reg = await getServiceWorker();
  if (reg) {
    try {
      await reg.showNotification(opts.title, baseOptions);
      return;
    } catch {
      // Fall through to the page-side fallback below.
    }
  }
  try {
    const n = new Notification(opts.title, baseOptions);
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore
      }
      n.close();
    };
  } catch {
    // ignore
  }
}

export async function clearRestNotification(): Promise<void> {
  const reg = await getServiceWorker();
  if (!reg) return;
  try {
    const list = await reg.getNotifications({ tag: REST_TIMER_TAG });
    list.forEach((n) => n.close());
  } catch {
    // ignore
  }
}
