import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, BranchId, BranchFilter, BranchInfo, BRANCHES_LIST } from '../types';
import { storageService } from '../services/storageService';
import { MASTER_ADMIN_CREDENTIALS } from '../data/seedData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSavedSession: boolean;
  activeBranch: BranchFilter;
  effectiveBranch: BranchId;
  branchInfo: BranchInfo;
  availableBranches: BranchInfo[];
  switchBranch: (branch: BranchFilter) => void;
  setActiveBranch: (branch: BranchFilter) => void;
  loginWithNationalId: (nationalId: string, password?: string) => { success: boolean; message: string };
  loginWithMasterAdmin: (email: string, passcode: string) => { success: boolean; message: string };
  loginWithBiometrics: () => { success: boolean; message: string };
  loginWithPin: (pin: string) => { success: boolean; message: string };
  logout: () => void;
  updateCurrentUser: (updated: User) => { success: boolean; message: string };
  changeUserRole: (targetUserId: string, newRole: UserRole) => { success: boolean; message: string };
  adminUpdateMember: (updatedMember: User) => { success: boolean; message: string };
  adminResetPassword: (targetUserId: string, newSecretCode: string) => { success: boolean; message: string };
  toggleSuspendMember: (targetUserId: string) => { success: boolean; isSuspended: boolean; message: string };
  createNewMember: (newMember: Omit<User, 'id' | 'createdAt'>) => { success: boolean; user?: User; message: string };
  deleteMember: (targetUserId: string) => { success: boolean; message: string };
  updateSelfPassword: (oldPass: string, newPass: string) => { success: boolean; message: string };
  refreshCurrentUser: () => void;
  toggleBiometrics: (enabled: boolean) => void;
  isMainAdmin: boolean;
  isSuperAdmin: boolean;
  isSubAdmin: boolean;
  canManageStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'alfudail_auth_current_user_v2_branch';
const HAS_BIOMETRIC_PREV_USER = 'alfudail_last_user_id_v2_branch';
const ACTIVE_BRANCH_STORAGE_KEY = 'alfudail_active_branch_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasSavedSession, setHasSavedSession] = useState<boolean>(false);
  const [activeBranch, setActiveBranchState] = useState<BranchFilter>('all');

  useEffect(() => {
    // Check if user is already logged in (Persist until manual logout from Profile screen ONLY)
    try {
      const savedUserJson = localStorage.getItem(AUTH_STORAGE_KEY);
      const lastUserId = localStorage.getItem(HAS_BIOMETRIC_PREV_USER);
      const savedBranch = localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY) as BranchFilter | null;

      if (savedUserJson) {
        const parsed = JSON.parse(savedUserJson) as User;
        // Verify from storage service to get latest role/permissions and status
        const freshUser = storageService.getUserById(parsed.id);
        if (freshUser && freshUser.status === 'suspended') {
          // If the account was suspended by admin, invalidate the active session
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setCurrentUser(null);
        } else if (freshUser) {
          setCurrentUser(freshUser);
          if (freshUser.role === 'main_admin') {
            setActiveBranchState(savedBranch || 'all');
          } else {
            setActiveBranchState(freshUser.branchId || 'basra');
          }
        } else {
          setCurrentUser(parsed);
          setActiveBranchState(parsed.branchId || 'basra');
        }
      }

      if (lastUserId) {
        setHasSavedSession(true);
      }
    } catch (e) {
      console.error('Error restoring session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSession = (user: User) => {
    setCurrentUser(user);
    const initialBranch: BranchFilter = user.role === 'main_admin' ? 'all' : (user.branchId || 'basra');
    setActiveBranchState(initialBranch);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(HAS_BIOMETRIC_PREV_USER, user.id);
      localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, initialBranch);
      setHasSavedSession(true);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  const switchBranch = (branch: BranchFilter) => {
    if (currentUser?.role === 'main_admin') {
      setActiveBranchState(branch);
      try {
        localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, branch);
      } catch (e) {
        console.warn('Failed to persist active branch:', e);
      }
    } else if (currentUser) {
      // Sub admin and staff are strictly restricted to their assigned branch
      setActiveBranchState(currentUser.branchId || 'basra');
    }
  };

  const setActiveBranch = switchBranch;

  const loginWithNationalId = (nationalId: string, password?: string): { success: boolean; message: string } => {
    const cleanId = nationalId.trim();
    if (!cleanId) {
      return { success: false, message: 'يرجى إدخال رقم البطاقة الوطنية' };
    }

    const foundUser = storageService.getUserByNationalId(cleanId);
    if (!foundUser) {
      return {
        success: false,
        message: 'رقم البطاقة الوطنية غير مسجل في النظام. يرجى مراجعة إدارة المركز لإصدار حسابك',
      };
    }

    if (foundUser.status === 'suspended') {
      return {
        success: false,
        message: 'تم تعليق هذا الحساب من قبل إدارة المركز. يرجى مراجعة إدارة المركز لإعادة التفعيل',
      };
    }

    // Check password against stored password, pinCode, or standard initial code '123456'
    const expectedPassword = foundUser.password || '123456';
    if (password) {
      const cleanPass = password.trim();
      const isMatch =
        cleanPass === expectedPassword ||
        cleanPass === foundUser.pinCode ||
        cleanPass === '123456';

      if (!isMatch) {
        return { success: false, message: 'كلمة المرور غير صحيحة. يرجى التحقق أو مراجعة إدارة المركز' };
      }
    }

    saveUserSession(foundUser);
    const branchLabel = foundUser.branchId === 'najaf' ? 'فرع النجف الأشرف' : 'فرع البصرة';
    return { success: true, message: `أهلاً وسهلاً بك، ${foundUser.fullName} (${branchLabel})` };
  };

  const loginWithMasterAdmin = (email: string, passcode: string): { success: boolean; message: string } => {
    if (
      email.trim().toLowerCase() === MASTER_ADMIN_CREDENTIALS.email.toLowerCase() &&
      passcode.trim() === MASTER_ADMIN_CREDENTIALS.passcode
    ) {
      // Fetch or assign main director account
      const mainDirector = storageService.getUsers().find((u) => u.role === 'main_admin') || storageService.getUsers()[0];
      saveUserSession(mainDirector);
      return { success: true, message: 'تم الدخول بنجاح عبر المنفذ السيادي للمدير العام الأعلى لكافة الفروع' };
    }
    return { success: false, message: 'بيانات الاعتماد السيادية للمشرف العام غير صحيحة' };
  };

  const loginWithBiometrics = (): { success: boolean; message: string } => {
    const lastUserId = localStorage.getItem(HAS_BIOMETRIC_PREV_USER);
    if (!lastUserId) {
      return { success: false, message: 'لا توجد جلسة سابقة مسجلة بالبصمة على هذا الجهاز' };
    }
    const user = storageService.getUserById(lastUserId);
    if (!user) {
      return { success: false, message: 'تعذر العثور على الحساب المرتبط بالبصمة' };
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        message: 'تم تعليق هذا الحساب من قبل إدارة المركز. يرجى مراجعة إدارة المركز لإعادة التفعيل',
      };
    }

    saveUserSession(user);
    return { success: true, message: `تم تأكيد البصمة الحيوية بنجاح، مرحباً ${user.fullName}` };
  };

  const loginWithPin = (pin: string): { success: boolean; message: string } => {
    const lastUserId = localStorage.getItem(HAS_BIOMETRIC_PREV_USER);
    if (!lastUserId) {
      return { success: false, message: 'يرجى تسجيل الدخول برقم البطاقة الوطنية أولاً' };
    }
    const user = storageService.getUserById(lastUserId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        message: 'تم تعليق هذا الحساب من قبل إدارة المركز. يرجى مراجعة إدارة المركز لإعادة التفعيل',
      };
    }

    if (user.pinCode && user.pinCode !== pin.trim()) {
      return { success: false, message: 'رمز PIN غير صحيح' };
    }
    saveUserSession(user);
    return { success: true, message: 'تم التحقق من الرمز بنجاح' };
  };

  // LOGOUT ONLY FROM PROFILE SCREEN (as specified)
  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      // We keep HAS_BIOMETRIC_PREV_USER so user can quickly biometrics login next time
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  };

  const refreshCurrentUser = () => {
    if (!currentUser) return;
    const fresh = storageService.getUserById(currentUser.id);
    if (fresh) {
      setCurrentUser(fresh);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fresh));
    }
  };

  const updateCurrentUser = (updated: User) => {
    if (!currentUser) return { success: false, message: 'غير مسجل' };
    const res = storageService.updateUserProfile(updated, currentUser.role);
    if (res.success) {
      setCurrentUser(updated);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    }
    return res;
  };

  const adminUpdateMember = (updatedMember: User) => {
    if (!currentUser) return { success: false, message: 'غير مسجل' };
    const res = storageService.adminUpdateMember(updatedMember, currentUser);
    if (res.success && currentUser.id === updatedMember.id) {
      refreshCurrentUser();
    }
    return res;
  };

  const adminResetPassword = (targetUserId: string, newSecretCode: string) => {
    if (!currentUser) return { success: false, message: 'غير مسجل' };
    const res = storageService.adminResetPassword(targetUserId, newSecretCode, currentUser);
    if (res.success && currentUser.id === targetUserId) {
      refreshCurrentUser();
    }
    return res;
  };

  const toggleSuspendMember = (targetUserId: string) => {
    if (!currentUser) return { success: false, isSuspended: false, message: 'غير مسجل' };
    const res = storageService.toggleSuspendMember(targetUserId, currentUser);
    return res;
  };

  const createNewMember = (newMember: Omit<User, 'id' | 'createdAt'>) => {
    if (!currentUser) return { success: false, message: 'غير مسجل' };
    return storageService.createNewMember(newMember, currentUser);
  };

  const deleteMember = (targetUserId: string) => {
    if (!currentUser) return { success: false, message: 'غير مسجل' };
    return storageService.deleteMember(targetUserId, currentUser);
  };

  const updateSelfPassword = (oldPass: string, newPass: string) => {
    if (!currentUser) return { success: false, message: 'غير مسجل' };
    const res = storageService.updateSelfPassword(currentUser.id, oldPass, newPass);
    if (res.success) {
      refreshCurrentUser();
    }
    return res;
  };

  const changeUserRole = (targetUserId: string, newRole: UserRole) => {
    if (!currentUser) return { success: false, message: 'غير مسجل' };
    const res = storageService.updateUserRole(targetUserId, newRole, currentUser);
    if (res.success && currentUser.id === targetUserId) {
      refreshCurrentUser();
    }
    return res;
  };

  const toggleBiometrics = (enabled: boolean) => {
    if (!currentUser) return;
    const updated = { ...currentUser, biometricEnabled: enabled };
    updateCurrentUser(updated);
  };

  const isMainAdmin = currentUser?.role === 'main_admin';
  const isSuperAdmin = isMainAdmin || !!currentUser?.isSuperAdmin;
  const isSubAdmin = currentUser?.role === 'sub_admin';
  const canManageStaff = isMainAdmin || isSubAdmin;

  // Derive current effective branch for creations and specific targeting
  const effectiveBranch: BranchId =
    activeBranch === 'all'
      ? (currentUser?.branchId || 'basra')
      : activeBranch;

  const branchInfo: BranchInfo =
    BRANCHES_LIST.find((b) => b.id === effectiveBranch) || BRANCHES_LIST[0];

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        hasSavedSession,
        activeBranch,
        effectiveBranch,
        branchInfo,
        availableBranches: BRANCHES_LIST,
        switchBranch,
        setActiveBranch,
        loginWithNationalId,
        loginWithMasterAdmin,
        loginWithBiometrics,
        loginWithPin,
        logout,
        updateCurrentUser,
        changeUserRole,
        adminUpdateMember,
        adminResetPassword,
        toggleSuspendMember,
        createNewMember,
        deleteMember,
        updateSelfPassword,
        refreshCurrentUser,
        toggleBiometrics,
        isMainAdmin,
        isSuperAdmin,
        isSubAdmin,
        canManageStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
