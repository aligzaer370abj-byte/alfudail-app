/**
 * Firebase Configuration & Messaging Initialization
 * Loaded directly from google-services.json:
 * - Project ID: alfud-3accb
 * - API Key: AIzaSyDz3fWevy9cMhzaUoMywT-QKqFj3v4K9Rw
 * - App ID: 1:892995300404:android:03fdf4096ed74cb5f02e61
 * - Project Number / Messaging Sender ID: 892995300404
 * - Storage Bucket: alfud-3accb.firebasestorage.app
 * - Package Name: com.alfudail.center
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isFcmSupported,
  type Messaging,
} from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: 'AIzaSyDz3fWevy9cMhzaUoMywT-QKqFj3v4K9Rw',
  projectId: 'alfud-3accb',
  appId: '1:892995300404:android:03fdf4096ed74cb5f02e61',
  messagingSenderId: '892995300404',
  storageBucket: 'alfud-3accb.firebasestorage.app',
};

// Singleton Firebase App instance
export const firebaseApp: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

let messagingInstance: Messaging | null = null;
let isMessagingSupported: boolean | null = null;

/**
 * Check whether FCM is supported in the current client runtime
 */
export async function checkFcmSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isMessagingSupported !== null) return isMessagingSupported;

  try {
    const supported = await isFcmSupported();
    isMessagingSupported = supported;
    return supported;
  } catch (err) {
    console.warn('[FCM] FCM isSupported check failed:', err);
    isMessagingSupported = false;
    return false;
  }
}

/**
 * Get or initialize Firebase Messaging instance safely
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;

  const supported = await checkFcmSupport();
  if (!supported) {
    return null;
  }

  try {
    messagingInstance = getMessaging(firebaseApp);
    return messagingInstance;
  } catch (err) {
    console.warn('[FCM] Error initializing getMessaging:', err);
    return null;
  }
}

export { getToken, onMessage };
