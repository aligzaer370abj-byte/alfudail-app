/**
 * Service Worker - Al-Fudail Cultural Center (مركز الفضيل بن يسار البصري الثقافي)
 * Native Mobile Push Notifications (FCM / OneSignal / Web Push)
 * Handles Lock Screen & Status Bar Notifications for Employee Check-In & Check-Out
 */

const SW_VERSION = 'v1.2.0-push';
const CACHE_NAME = `alfudail-cache-${SW_VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches if any
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      ),
    ])
  );
});

/**
 * Handle incoming Web Push / FCM Push events
 */
self.addEventListener('push', (event) => {
  let payload = {
    title: 'تسجيل حضور/خروج جديد',
    body: 'قام أحد المنتسبين بتسجيل الدوام في المركز',
    icon: '/icon.svg',
    badge: '/icon.svg',
    url: '/?screen=attendance',
    screen: 'attendance',
    timestamp: Date.now(),
  };

  if (event.data) {
    try {
      const json = event.data.json();
      payload = { ...payload, ...json };
    } catch (e) {
      payload.body = event.data.text() || payload.body;
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    badge: payload.badge || '/icon.svg',
    tag: payload.tag || 'attendance-log-alert',
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [300, 150, 300, 150, 400],
    data: {
      url: payload.url || '/?screen=attendance',
      screen: payload.screen || 'attendance',
      timestamp: payload.timestamp || Date.now(),
      ...payload.data,
    },
    actions: [
      {
        action: 'open_attendance',
        title: 'عرض سجل الحضور',
      },
      {
        action: 'dismiss',
        title: 'إغلاق',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

/**
 * Handle Notification Click:
 * Opens or focuses app directly to the Attendance Log page
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/?screen=attendance';
  const targetScreen = notifData.screen || 'attendance';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If an existing window is open, focus it and tell it to navigate to attendance screen
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({
              type: 'NAVIGATE_TO_SCREEN',
              screen: targetScreen,
              notificationData: notifData,
            });
            return client.focus();
          }
        }
        // If no client is open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

/**
 * Handle direct messages from app (e.g. Test push, client-dispatched background notifications)
 */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const defaultOptions = {
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [300, 150, 300, 150, 400],
      requireInteraction: true,
      tag: 'attendance-notification',
      renotify: true,
      data: {
        url: '/?screen=attendance',
        screen: 'attendance',
      },
      actions: [
        { action: 'open_attendance', title: 'عرض سجل الحضور' },
        { action: 'dismiss', title: 'إغلاق' },
      ],
    };

    self.registration.showNotification(
      title || 'تسجيل حضور/خروج جديد',
      { ...defaultOptions, ...options }
    );
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
