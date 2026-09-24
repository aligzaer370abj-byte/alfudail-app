/**
 * Firebase Cloud Messaging Service Worker
 * Integrated from google-services.json for Al-Fudail Cultural Center
 * Project ID: alfud-3accb
 * App ID: 1:892995300404:android:03fdf4096ed74cb5f02e61
 */

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDz3fWevy9cMhzaUoMywT-QKqFj3v4K9Rw",
  projectId: "alfud-3accb",
  appId: "1:892995300404:android:03fdf4096ed74cb5f02e61",
  messagingSenderId: "892995300404",
  storageBucket: "alfud-3accb.firebasestorage.app"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle Background Push Notifications from FCM
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);
    const title = payload.notification?.title || payload.data?.title || 'تسجيل حضور/خروج جديد';
    const body = payload.notification?.body || payload.data?.body || 'قام أحد المنتسبين بتسجيل الدوام في المركز';

    const notificationOptions = {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: payload.data?.tag || `fcm-attendance-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [300, 150, 300, 150, 400],
      data: {
        url: payload.data?.url || '/?screen=attendance',
        screen: payload.data?.screen || 'attendance',
        ...payload.data,
        timestamp: Date.now(),
      },
      actions: [
        { action: 'open_attendance', title: 'عرض سجل الحضور' },
        { action: 'dismiss', title: 'إغلاق' },
      ],
    };

    return self.registration.showNotification(title, notificationOptions);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Error initializing firebase compat in SW:', err);
}

// Handle notification click and navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/?screen=attendance';
  const targetScreen = notifData.screen || 'attendance';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
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
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
