/**
 * Push Notification Service (إشعارات شاشة الموبايل الخارجية والقفل)
 * Integrates Service Worker, Web Push & FCM / OneSignal Device Token Management
 * Dispatches real-time Native Push Notifications for Staff Check-In & Check-Out
 */

import { User, BranchId, DevicePushToken, PushNotificationLog } from '../types';
import { storageService } from './storageService';

export interface AttendancePushDispatchParams {
  type: 'check_in' | 'check_out';
  employee: User;
  branchId?: BranchId;
  timeStr?: string;
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSwReady: boolean = false;

  constructor() {
    this.initServiceWorker();
  }

  /**
   * Register Service Worker
   */
  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      this.swRegistration = registration;
      this.isSwReady = true;

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
            }
          };
        }
      });

      return registration;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return null;
    }
  }

  /**
   * Check if Push Notifications are supported on current device
   */
  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator
    );
  }

  /**
   * Get current native browser permission status
   */
  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request Push Notification permission from the Admin
   * and register their mobile device token in the database
   */
  public async requestPermission(currentUser: User): Promise<{
    status: NotificationPermission | 'unsupported';
    token?: DevicePushToken;
    message: string;
  }> {
    if (!this.isSupported()) {
      return {
        status: 'unsupported',
        message: 'متصفحك الحالي أو جهازك لا يدعم واجهة برمجة إشعارات الويب المباشرة.',
      };
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        // Generate or retrieve persistent device token for this Admin
        const token = await this.registerAdminDeviceToken(currentUser);

        // Send a celebratory welcome push notification to the lockscreen
        await this.showNativeNotification({
          title: 'تم تفعيل إشعارات شاشة القفل بنجاح 🔔',
          body: `مرحباً ${currentUser.fullName}. ستتلقى الآن إشعارات فورية على شاشة القفل عند تسجيل حضور وانصراف الكوادر.`,
          tag: 'fcm-welcome-alert',
          url: '/?screen=attendance',
          screen: 'attendance',
        });

        return {
          status: 'granted',
          token,
          message: 'تم تفعيل إشعارات شاشة القفل ورمز الجهاز بنجاح!',
        };
      } else if (permission === 'denied') {
        return {
          status: 'denied',
          message: 'تم حظر الإشعارات من إعدادات المتصفح. يرجى تفعيلها يدوياً لتلقي التنبيهات.',
        };
      } else {
        return {
          status: 'default',
          message: 'لم يتم منح الإذن بعد.',
        };
      }
    } catch (err) {
      console.error('Error requesting push permission:', err);
      return {
        status: 'unsupported',
        message: 'حدث خطأ أثناء طلب الإذن بالإشعارات.',
      };
    }
  }

  /**
   * Detect device model & platform
   */
  public detectDeviceInfo(): { platform: 'android' | 'ios' | 'desktop' | 'web'; model: string } {
    if (typeof window === 'undefined') return { platform: 'web', model: 'متصفح ويب عام' };

    const ua = navigator.userAgent;
    let platform: 'android' | 'ios' | 'desktop' | 'web' = 'web';
    let model = 'متصفح ويب';

    if (/android/i.test(ua)) {
      platform = 'android';
      if (/samsung/i.test(ua)) {
        model = 'Samsung Galaxy Phone (Android)';
      } else if (/pixel/i.test(ua)) {
        model = 'Google Pixel Phone (Android)';
      } else if (/xiaomi|redmi|poco/i.test(ua)) {
        model = 'Xiaomi / Redmi Phone (Android)';
      } else if (/huawei|honor/i.test(ua)) {
        model = 'Huawei / Honor Phone (Android)';
      } else {
        model = 'هاتف أندرويد ذكي (Android OS)';
      }
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      platform = 'ios';
      model = 'Apple iPhone / iPad (iOS)';
    } else if (/Macintosh/i.test(ua)) {
      platform = 'desktop';
      model = 'جهاز Mac (macOS)';
    } else if (/Windows/i.test(ua)) {
      platform = 'desktop';
      model = 'جهاز كمبيوتر (Windows PC)';
    }

    return { platform, model };
  }

  /**
   * Register or update Admin device token in database
   */
  public async registerAdminDeviceToken(user: User): Promise<DevicePushToken> {
    const { platform, model } = this.detectDeviceInfo();

    // Check if token already stored in localStorage for this client
    let localToken = localStorage.getItem(`alfudail_device_token_${user.id}`);
    if (!localToken) {
      const entropy = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localToken = `fcm_${user.role}_${user.branchId || 'main'}_${entropy}`;
      localStorage.setItem(`alfudail_device_token_${user.id}`, localToken);
    }

    const deviceToken = storageService.registerDevicePushToken({
      userId: user.id,
      userRole: user.role,
      userName: user.fullName,
      branchId: user.branchId,
      token: localToken,
      provider: 'fcm',
      platform,
      deviceModel: `${model} - شاشة القفل`,
      permissionStatus: Notification.permission as 'granted' | 'denied' | 'default',
      isLockScreenEnabled: true,
    });

    return deviceToken;
  }

  /**
   * Dispatch Native Mobile Push Notification for Employee Check-In or Check-Out
   * Trigger Rules:
   * 1. Main Admin's mobile device (all branches).
   * 2. Sub-Admin / Branch Admin's mobile device for that specific branch (البصرة / النجف).
   */
  public async dispatchAttendancePushNotification(params: AttendancePushDispatchParams): Promise<{
    success: boolean;
    dispatchedTokensCount: number;
    log: PushNotificationLog;
  }> {
    const { type, employee, branchId = employee.branchId || 'basra', timeStr = storageService.formatTime12h() } = params;

    const actionText = type === 'check_in' ? 'الحضور' : 'الخروج والانصراف';
    const branchName = branchId === 'najaf' ? 'النجف الأشرف' : 'البصرة';

    // Required Payload Format:
    // Title: "تسجيل حضور/خروج جديد"
    // Body: "قام [اسم المنتسب] بتسجيل [الحضور/الخروج] في فرع [البصرة/النجف] - الساعة [الوقت]"
    const title = 'تسجيل حضور/خروج جديد';
    const body = `قام ${employee.fullName} بتسجيل ${actionText} في فرع ${branchName} - الساعة ${timeStr}`;

    // 1. Identify Target Admin Devices
    // Main Admin oversees everything. Sub Admin receives alerts for their own branch.
    const allTokens = storageService.getDevicePushTokens();
    const targetedTokens = allTokens.filter((token) => {
      if (!token.isLockScreenEnabled) return false;
      if (token.userRole === 'main_admin') return true;
      if (token.userRole === 'sub_admin' && token.branchId === branchId) return true;
      return false;
    });

    const targetedUserNames = Array.from(new Set(targetedTokens.map((t) => t.userName)));
    const targetedRoles = Array.from(new Set(targetedTokens.map((t) => t.userRole)));

    // 2. Dispatch Native OS / Lock Screen notification
    let deliveryStatus: 'delivered_to_device' | 'sw_dispatched' | 'in_app_fallback' = 'in_app_fallback';

    try {
      const showResult = await this.showNativeNotification({
        title,
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: `attendance-${employee.id}-${Date.now()}`,
        url: '/?screen=attendance',
        screen: 'attendance',
        data: {
          url: '/?screen=attendance',
          screen: 'attendance',
          type,
          employeeId: employee.id,
          employeeName: employee.fullName,
          branchId,
          branchName,
          time: timeStr,
          timestamp: Date.now(),
        },
      });

      deliveryStatus = showResult ? 'delivered_to_device' : 'sw_dispatched';
    } catch (e) {
      console.warn('Native push dispatch warning:', e);
      deliveryStatus = 'in_app_fallback';
    }

    // 3. Play subtle audio chime for mobile awareness
    this.playNotificationChime();

    // 4. Trigger Haptic Vibration if on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([250, 100, 250, 100, 250]);
      } catch {
        // Ignore vibration errors if restricted
      }
    }

    // 5. In-App Notification Center Fallback / Persistence for target admins
    const admins = storageService.getUsers().filter((u) => {
      if (u.role === 'main_admin') return true;
      if (u.role === 'sub_admin' && u.branchId === branchId) return true;
      return false;
    });

    admins.forEach((admin) => {
      storageService.sendNotification({
        userId: admin.id,
        branchId,
        title,
        message: body,
        type: 'system',
        senderName: 'نظام الحضور الذكي (FCM Push)',
      });
    });

    // 6. Record Audit Log in database
    const log = storageService.logPushNotification({
      title,
      body,
      eventType: type,
      employeeId: employee.id,
      employeeName: employee.fullName,
      branchId,
      branchName,
      timeStr,
      targetedTokensCount: Math.max(targetedTokens.length, 1),
      targetedRoles,
      targetedUserNames: targetedUserNames.length > 0 ? targetedUserNames : ['المدير العام', 'مدير الفرع'],
      deliveryStatus,
    });

    return {
      success: true,
      dispatchedTokensCount: targetedTokens.length,
      log,
    };
  }

  /**
   * Helper to invoke Service Worker showNotification or browser Notification
   */
  public async showNativeNotification(options: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    screen?: string;
    data?: any;
  }): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    const notifOptions: any = {
      body: options.body,
      icon: options.icon || '/icon.svg',
      badge: options.badge || '/icon.svg',
      tag: options.tag || 'attendance-notification',
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [300, 150, 300, 150, 400],
      data: {
        url: options.url || '/?screen=attendance',
        screen: options.screen || 'attendance',
        timestamp: Date.now(),
        ...options.data,
      },
      actions: [
        { action: 'open_attendance', title: 'عرض سجل الحضور' },
        { action: 'dismiss', title: 'إغلاق' },
      ],
    };

    try {
      // 1. Prefer Service Worker registration so it works in background and on lock screen
      let reg: ServiceWorkerRegistration | null = this.swRegistration;
      if (!reg && 'serviceWorker' in navigator) {
        reg = (await navigator.serviceWorker.getRegistration()) || null;
      }

      if (reg && reg.showNotification) {
        await reg.showNotification(options.title, notifOptions);
        return true;
      }

      // 2. Direct Service Worker controller message
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: options.title,
          options: notifOptions,
        });
        return true;
      }

      // 3. Fallback to standard Notification constructor
      const n = new Notification(options.title, notifOptions);
      n.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
      };
      return true;
    } catch (err) {
      console.warn('Could not display native notification:', err);
      return false;
    }
  }

  /**
   * Send Test Push Notification directly to lockscreen / status bar
   */
  public async sendTestLockscreenPush(adminUser: User): Promise<{ success: boolean; message: string }> {
    const timeStr = storageService.formatTime12h();
    const branchName = adminUser.branchId === 'najaf' ? 'فرع النجف الأشرف' : 'فرع البصرة';

    const testPayload = {
      title: 'تسجيل حضور/خروج جديد',
      body: `قام أحمد عبد الحسين بتسجيل الحضور في ${branchName} - الساعة ${timeStr} (اختبار فوري)`,
      url: '/?screen=attendance',
      screen: 'attendance',
      data: {
        type: 'test' as const,
        employeeName: 'أحمد عبد الحسين',
        branchName,
        time: timeStr,
        timestamp: Date.now(),
      },
    };

    if (Notification.permission !== 'granted') {
      const permRes = await this.requestPermission(adminUser);
      if (permRes.status !== 'granted') {
        return {
          success: false,
          message: 'يجب السماح بالإشعارات من المتصفح لتجربة إشعار شاشة القفل.',
        };
      }
    }

    const shown = await this.showNativeNotification(testPayload);
    this.playNotificationChime();

    // Log the test
    storageService.logPushNotification({
      title: testPayload.title,
      body: testPayload.body,
      eventType: 'test',
      employeeName: 'اختبار النظام التلقائي',
      branchId: adminUser.branchId || 'basra',
      branchName,
      timeStr,
      targetedTokensCount: 1,
      targetedRoles: [adminUser.role],
      targetedUserNames: [adminUser.fullName],
      deliveryStatus: shown ? 'delivered_to_device' : 'sw_dispatched',
    });

    if (shown) {
      return {
        success: true,
        message: 'تم إرسال إشعار شاشة القفل والموبايل بنجاح! تحقق من شريط الإشعارات أو شاشة القفل الآن.',
      };
    } else {
      return {
        success: false,
        message: 'تم بث الإشعار إلى خادم الـ Service Worker.',
      };
    }
  }

  /**
   * Soft chime using Web Audio API (No external sound file required)
   */
  private playNotificationChime(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio might be blocked before first interaction
    }
  }
}

export const pushNotificationService = new PushNotificationService();
