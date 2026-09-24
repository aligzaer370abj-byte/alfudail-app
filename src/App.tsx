import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { MainDashboard, ActiveScreen } from './components/dashboard/MainDashboard';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { AttendanceModule } from './components/modules/AttendanceModule';
import { LeavesModule } from './components/modules/LeavesModule';
import { PerformanceModule } from './components/modules/PerformanceModule';
import { OfficialDocsModule } from './components/modules/OfficialDocsModule';
import { WarningsModule } from './components/modules/WarningsModule';
import { ComplaintsModule } from './components/modules/ComplaintsModule';
import { LibraryModule } from './components/modules/LibraryModule';
import { DataRetentionModule } from './components/modules/DataRetentionModule';
import { StaffDirectoryModule } from './components/modules/StaffDirectoryModule';
import { PurchasesModule } from './components/modules/PurchasesModule';
import { MobileContainer } from './components/common/MobileContainer';
import { PushNotificationPromptModal } from './components/modules/PushNotificationPromptModal';
import { pushNotificationService } from './services/pushNotificationService';

const AppContent: React.FC<{ isDarkMode: boolean; onToggleDarkMode: () => void }> = ({
  isDarkMode,
  onToggleDarkMode,
}) => {
  const { isAuthenticated, isLoading, canManageStaff, currentUser } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [showPushPrompt, setShowPushPrompt] = useState<boolean>(false);

  // 1. Detect URL param ?screen=attendance on initial load (from notification tap)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const targetScreen = urlParams.get('screen') as ActiveScreen | null;
      if (targetScreen === 'attendance') {
        setActiveScreen('attendance');
      }
    }
  }, []);

  // 2. Listen to Service Worker message events for notification taps (Action: tap opens Attendance page)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        (event.data.type === 'NAVIGATE_TO_SCREEN' || event.data.type === 'NAVIGATE_TO_ATTENDANCE')
      ) {
        const screen = event.data.screen || 'attendance';
        setActiveScreen(screen as ActiveScreen);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // 3. Prompt Admins on login to "Allow Push Notifications" (السماح بالإشعارات) and register device token
  useEffect(() => {
    if (isAuthenticated && canManageStaff && currentUser) {
      const permStatus = pushNotificationService.getPermissionStatus();
      const hasPrompted = sessionStorage.getItem(`alfudail_push_prompt_${currentUser.id}`);
      if (permStatus !== 'granted' && !hasPrompted) {
        const timer = setTimeout(() => {
          setShowPushPrompt(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, canManageStaff, currentUser]);

  const handleClosePushPrompt = () => {
    setShowPushPrompt(false);
    if (currentUser) {
      sessionStorage.setItem(`alfudail_push_prompt_${currentUser.id}`, 'true');
    }
  };

  // Reset to home if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveScreen('home');
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="w-12 h-12 rounded-full border-4 border-[#1B2A4A] border-t-[#D4AF37] animate-spin mb-4"></div>
        <h3 className="text-sm font-bold text-[#1B2A4A] dark:text-white">مركز الفضيل بن يسار البصري الثقافي</h3>
        <p className="text-xs text-slate-400 mt-1">جارِ تهيئة منظومة الأمان وحفظ البيانات...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Router for full-screen views (per requirement: opening new full-screen views upon clicking, not expanding inline)
  const renderScreen = () => {
    switch (activeScreen) {
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setActiveScreen('home')}
            onNavigateToDirectory={() => setActiveScreen('staff_directory')}
          />
        );
      case 'attendance':
        return <AttendanceModule onBack={() => setActiveScreen('home')} />;
      case 'leaves':
        return <LeavesModule onBack={() => setActiveScreen('home')} />;
      case 'performance':
        return <PerformanceModule onBack={() => setActiveScreen('home')} />;
      case 'official_docs':
        return <OfficialDocsModule onBack={() => setActiveScreen('home')} />;
      case 'warnings':
        return <WarningsModule onBack={() => setActiveScreen('home')} />;
      case 'complaints':
        return <ComplaintsModule onBack={() => setActiveScreen('home')} />;
      case 'library':
        return <LibraryModule onBack={() => setActiveScreen('home')} />;
      case 'retention_engine':
        if (!canManageStaff) {
          return (
            <MainDashboard
              onNavigate={(screen) => setActiveScreen(screen)}
              isDarkMode={isDarkMode}
              onToggleDarkMode={onToggleDarkMode}
            />
          );
        }
        return <DataRetentionModule onBack={() => setActiveScreen('home')} />;
      case 'staff_directory':
        if (!canManageStaff) {
          return (
            <MainDashboard
              onNavigate={(screen) => setActiveScreen(screen)}
              isDarkMode={isDarkMode}
              onToggleDarkMode={onToggleDarkMode}
            />
          );
        }
        return <StaffDirectoryModule onBack={() => setActiveScreen('home')} />;
      case 'purchases':
        if (!canManageStaff) {
          return (
            <MainDashboard
              onNavigate={(screen) => setActiveScreen(screen)}
              isDarkMode={isDarkMode}
              onToggleDarkMode={onToggleDarkMode}
            />
          );
        }
        return <PurchasesModule onBack={() => setActiveScreen('home')} />;
      case 'home':
      default:
        return (
          <MainDashboard
            onNavigate={(screen) => setActiveScreen(screen)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
          />
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <PushNotificationPromptModal
        isOpen={showPushPrompt}
        onClose={handleClosePushPrompt}
        onPermissionGranted={handleClosePushPrompt}
      />
    </>
  );
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('alfudail_theme_mode') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('alfudail_theme_mode', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('alfudail_theme_mode', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <AuthProvider>
      <MobileContainer isDarkMode={isDarkMode}>
        <AppContent isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      </MobileContainer>
    </AuthProvider>
  );
}
