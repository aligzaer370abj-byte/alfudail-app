import {
  User,
  UserRole,
  BranchId,
  BranchFilter,
  AttendanceRecord,
  LeaveRequest,
  PerformanceEvaluation,
  DailyStaffEvaluation,
  OfficialDocumentTask,
  WarningPenalty,
  RequestComplaint,
  AppNotification,
  ActivityPost,
  RetentionAlert,
  DataRetentionStats,
  ExpiringArchiveFile,
  PurchaseRecord,
  LibraryBook,
  BookCategory,
  DevicePushToken,
  PushNotificationLog,
  AttendanceAuditLog,
} from '../types';
import {
  SEED_USERS,
  SEED_ATTENDANCE,
  SEED_LEAVES,
  SEED_EVALUATIONS,
  SEED_DAILY_EVALUATIONS,
  SEED_OFFICIAL_DOCS,
  SEED_WARNINGS,
  SEED_COMPLAINTS,
  SEED_NOTIFICATIONS,
  SEED_POSTS,
  SEED_PURCHASES,
  SEED_BOOKS,
  SEED_DEVICE_PUSH_TOKENS,
  SEED_PUSH_LOGS,
  addOneYear,
} from '../data/seedData';

const STORAGE_KEYS = {
  USERS: 'alfudail_users_v2_branch',
  ATTENDANCE: 'alfudail_attendance_v2_branch',
  LEAVES: 'alfudail_leaves_v2_branch',
  EVALUATIONS: 'alfudail_evaluations_v2_branch',
  DAILY_EVALUATIONS: 'alfudail_daily_evaluations_v2_branch',
  OFFICIAL_DOCS: 'alfudail_official_docs_v2_branch',
  WARNINGS: 'alfudail_warnings_v2_branch',
  COMPLAINTS: 'alfudail_complaints_v2_branch',
  NOTIFICATIONS: 'alfudail_notifications_v2_branch',
  POSTS: 'alfudail_posts_v2_branch',
  PURCHASES: 'alfudail_purchases_v2_branch',
  BOOKS: 'app_books_data',
  DEVICE_PUSH_TOKENS: 'alfudail_push_tokens_v1',
  PUSH_LOGS: 'alfudail_push_logs_v1',
  ATTENDANCE_AUDIT_LOGS: 'alfudail_attendance_audit_logs_v1',
  SESSION: 'alfudail_session_v2_branch',
  THEME: 'alfudail_theme_v2',
  DISMISSED_ALERTS: 'alfudail_dismissed_alerts_v2',
};

// Safe JSON parser
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading from localStorage (${key}):`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing to localStorage (${key}):`, e);
  }
}

export const formatAttendanceStatus = (
  status: string
): { label: string; bg: string; text: string } => {
  const s = String(status).toLowerCase();
  if (s === 'present' || s === 'حاضر') {
    return {
      label: 'حاضر (Present)',
      bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      text: 'حاضر',
    };
  }
  if (s === 'absent' || s === 'غائب') {
    return {
      label: 'غائب (Absent)',
      bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
      text: 'غائب',
    };
  }
  if (s === 'leave' || s === 'إجازة' || s === 'مجاز') {
    return {
      label: 'إجازة (Leave)',
      bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      text: 'إجازة',
    };
  }
  if (s === 'متأخر') {
    return {
      label: 'متأخر (Late)',
      bg: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
      text: 'متأخر',
    };
  }
  return {
    label: status,
    bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
    text: status,
  };
};

class StorageService {
  private users: User[] = [];
  private attendance: AttendanceRecord[] = [];
  private leaves: LeaveRequest[] = [];
  private evaluations: PerformanceEvaluation[] = [];
  private dailyEvaluations: DailyStaffEvaluation[] = [];
  private officialDocs: OfficialDocumentTask[] = [];
  private warnings: WarningPenalty[] = [];
  private complaints: RequestComplaint[] = [];
  private notifications: AppNotification[] = [];
  private posts: ActivityPost[] = [];
  private purchases: PurchaseRecord[] = [];
  private books: LibraryBook[] = [];
  private devicePushTokens: DevicePushToken[] = [];
  private pushLogs: PushNotificationLog[] = [];
  private attendanceAuditLogs: AttendanceAuditLog[] = [];
  private dismissedAlertIds: string[] = [];
  private notifListeners: ((notif: AppNotification) => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 1. Users Initialization with Branch support
    const loadedUsers = loadFromStorage<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    // Ensure all seed users (including Najaf admin & staff) exist
    SEED_USERS.forEach((su) => {
      if (!loadedUsers.some((u) => u.id === su.id)) {
        loadedUsers.push(su);
      }
    });
    this.users = loadedUsers.map((u) => {
      const branchId: BranchId = u.branchId || (u.id.includes('najaf') ? 'najaf' : 'basra');
      return {
        ...u,
        status: u.status || 'active',
        branchId,
        branchName: u.branchName || (branchId === 'najaf' ? 'فرع النجف' : 'فرع البصرة'),
        isSuperAdmin: u.role === 'main_admin' ? true : u.isSuperAdmin,
      };
    });
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    // 2. Attendance Initialization (ensuring record 101 and Najaf attendance exist)
    const loadedAtt = loadFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    SEED_ATTENDANCE.forEach((sa) => {
      const existingIdx = loadedAtt.findIndex((a) => a.id === sa.id);
      if (existingIdx === -1) {
        loadedAtt.unshift(sa);
      } else {
        loadedAtt[existingIdx] = {
          ...loadedAtt[existingIdx],
          branchId: loadedAtt[existingIdx].branchId || sa.branchId,
          status: loadedAtt[existingIdx].status || sa.status,
          checkIn: loadedAtt[existingIdx].checkIn || sa.checkIn,
          checkOut: loadedAtt[existingIdx].checkOut || sa.checkOut,
        };
      }
    });
    this.attendance = loadedAtt.map((a) => {
      const branchId: BranchId =
        a.branchId ||
        (a.id.includes('njf') || a.id.includes('najaf') || (a.userId && a.userId.includes('najaf'))
          ? 'najaf'
          : 'basra');
      return {
        ...a,
        branchId,
        checkIn: a.checkIn || (a.checkInTime ? a.checkInTime.replace(/[^0-9:]/g, '').trim() : undefined),
        checkOut: a.checkOut || (a.checkOutTime ? a.checkOutTime.replace(/[^0-9:]/g, '').trim() : undefined),
      };
    });
    saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);

    // 3. Leaves Initialization
    const loadedLeaves = loadFromStorage<LeaveRequest[]>(STORAGE_KEYS.LEAVES, SEED_LEAVES);
    SEED_LEAVES.forEach((sl) => {
      if (!loadedLeaves.some((l) => l.id === sl.id)) {
        loadedLeaves.push(sl);
      }
    });
    this.leaves = loadedLeaves.map((l) => ({
      ...l,
      branchId:
        l.branchId ||
        (l.id.includes('njf') || l.id.includes('najaf') || (l.userId && l.userId.includes('najaf'))
          ? 'najaf'
          : 'basra'),
    }));
    saveToStorage(STORAGE_KEYS.LEAVES, this.leaves);

    // 4. Performance Evaluations Initialization
    const loadedEvals = loadFromStorage<PerformanceEvaluation[]>(STORAGE_KEYS.EVALUATIONS, SEED_EVALUATIONS);
    SEED_EVALUATIONS.forEach((se) => {
      if (!loadedEvals.some((e) => e.id === se.id)) {
        loadedEvals.push(se);
      }
    });
    this.evaluations = loadedEvals.map((e) => ({
      ...e,
      branchId:
        e.branchId ||
        (e.id.includes('njf') || e.id.includes('najaf') || (e.userId && e.userId.includes('najaf'))
          ? 'najaf'
          : 'basra'),
    }));
    saveToStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);

    // 5. Daily Evaluations Initialization
    const loadedDaily = loadFromStorage<DailyStaffEvaluation[]>(STORAGE_KEYS.DAILY_EVALUATIONS, SEED_DAILY_EVALUATIONS);
    SEED_DAILY_EVALUATIONS.forEach((sd) => {
      if (!loadedDaily.some((d) => d.id === sd.id)) {
        loadedDaily.push(sd);
      }
    });
    this.dailyEvaluations = loadedDaily.map((d) => ({
      ...d,
      branchId:
        d.branchId ||
        (d.id.includes('njf') || d.id.includes('najaf') || (d.userId && d.userId.includes('najaf'))
          ? 'najaf'
          : 'basra'),
    }));
    saveToStorage(STORAGE_KEYS.DAILY_EVALUATIONS, this.dailyEvaluations);

    // 6. Official Docs Initialization
    const loadedDocs = loadFromStorage<OfficialDocumentTask[]>(STORAGE_KEYS.OFFICIAL_DOCS, SEED_OFFICIAL_DOCS);
    SEED_OFFICIAL_DOCS.forEach((sd) => {
      if (!loadedDocs.some((d) => d.id === sd.id)) {
        loadedDocs.push(sd);
      }
    });
    this.officialDocs = loadedDocs.map((d) => ({
      ...d,
      branchId: d.branchId || (d.id.includes('njf') || d.id.includes('najaf') ? 'najaf' : 'basra'),
    }));
    saveToStorage(STORAGE_KEYS.OFFICIAL_DOCS, this.officialDocs);

    // 7. Warnings Initialization
    const loadedWarnings = loadFromStorage<WarningPenalty[]>(STORAGE_KEYS.WARNINGS, SEED_WARNINGS);
    SEED_WARNINGS.forEach((sw) => {
      if (!loadedWarnings.some((w) => w.id === sw.id)) {
        loadedWarnings.push(sw);
      }
    });
    this.warnings = loadedWarnings.map((w) => ({
      ...w,
      branchId:
        w.branchId ||
        (w.id.includes('njf') || w.id.includes('najaf') || (w.userId && w.userId.includes('najaf'))
          ? 'najaf'
          : 'basra'),
    }));
    saveToStorage(STORAGE_KEYS.WARNINGS, this.warnings);

    // 8. Complaints Initialization
    const loadedComplaints = loadFromStorage<RequestComplaint[]>(STORAGE_KEYS.COMPLAINTS, SEED_COMPLAINTS);
    SEED_COMPLAINTS.forEach((sc) => {
      if (!loadedComplaints.some((c) => c.id === sc.id)) {
        loadedComplaints.push(sc);
      }
    });
    this.complaints = loadedComplaints.map((c) => ({
      ...c,
      branchId:
        c.branchId ||
        (c.id.includes('njf') || c.id.includes('najaf') || (c.userId && c.userId.includes('najaf'))
          ? 'najaf'
          : 'basra'),
    }));
    saveToStorage(STORAGE_KEYS.COMPLAINTS, this.complaints);

    // 9. Notifications Initialization
    const loadedNotifs = loadFromStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    SEED_NOTIFICATIONS.forEach((sn) => {
      if (!loadedNotifs.some((n) => n.id === sn.id)) {
        loadedNotifs.push(sn);
      }
    });
    this.notifications = loadedNotifs.map((n) => ({
      ...n,
      branchId:
        n.branchId ||
        (n.id.includes('njf') || n.id.includes('najaf') || (n.userId && n.userId.includes('najaf'))
          ? 'najaf'
          : 'basra'),
    }));
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

    // 10. Posts Initialization
    const loadedPosts = loadFromStorage<ActivityPost[]>(STORAGE_KEYS.POSTS, SEED_POSTS);
    SEED_POSTS.forEach((sp) => {
      if (!loadedPosts.some((p) => p.id === sp.id)) {
        loadedPosts.push(sp);
      }
    });
    this.posts = loadedPosts.map((p) => ({
      ...p,
      branchId: p.branchId || (p.id.includes('njf') || p.id.includes('najaf') ? 'najaf' : 'basra'),
    }));
    saveToStorage(STORAGE_KEYS.POSTS, this.posts);

    // 11. Purchases Initialization
    const loadedPurchases = loadFromStorage<PurchaseRecord[]>(STORAGE_KEYS.PURCHASES, SEED_PURCHASES);
    SEED_PURCHASES.forEach((sp) => {
      if (!loadedPurchases.some((p) => p.id === sp.id)) {
        loadedPurchases.push(sp);
      }
    });
    this.purchases = loadedPurchases.map((p) => ({
      ...p,
      branchId: p.branchId || (p.id.includes('njf') || p.id.includes('najaf') ? 'najaf' : 'basra'),
    }));
    saveToStorage(STORAGE_KEYS.PURCHASES, this.purchases);

    // 12. Library Books Initialization (Global Shared Storage `app_books_data`)
    let loadedBooks = loadFromStorage<LibraryBook[]>(STORAGE_KEYS.BOOKS, []);
    if (!loadedBooks || loadedBooks.length === 0) {
      const legacyBooks = loadFromStorage<LibraryBook[]>('alfudail_library_books_v1', []);
      if (legacyBooks && legacyBooks.length > 0) {
        loadedBooks = legacyBooks;
      } else {
        loadedBooks = [...SEED_BOOKS];
      }
    }
    SEED_BOOKS.forEach((sb) => {
      if (!loadedBooks.some((b) => b.id === sb.id)) {
        loadedBooks.push(sb);
      }
    });
    this.books = loadedBooks;
    saveToStorage(STORAGE_KEYS.BOOKS, this.books);

    // 13. Mobile Device Push Tokens Initialization
    const loadedTokens = loadFromStorage<DevicePushToken[]>(STORAGE_KEYS.DEVICE_PUSH_TOKENS, SEED_DEVICE_PUSH_TOKENS);
    SEED_DEVICE_PUSH_TOKENS.forEach((st) => {
      if (!loadedTokens.some((t) => t.id === st.id)) {
        loadedTokens.push(st);
      }
    });
    this.devicePushTokens = loadedTokens;
    saveToStorage(STORAGE_KEYS.DEVICE_PUSH_TOKENS, this.devicePushTokens);

    // 14. Push Notification Logs Initialization
    this.pushLogs = loadFromStorage<PushNotificationLog[]>(STORAGE_KEYS.PUSH_LOGS, SEED_PUSH_LOGS);
    saveToStorage(STORAGE_KEYS.PUSH_LOGS, this.pushLogs);

    // 15. Attendance Audit Logs Initialization
    this.attendanceAuditLogs = loadFromStorage<AttendanceAuditLog[]>(STORAGE_KEYS.ATTENDANCE_AUDIT_LOGS, []);

    this.dismissedAlertIds = loadFromStorage<string[]>(STORAGE_KEYS.DISMISSED_ALERTS, []);
  }

  // ================= USERS & HIERARCHY =================
  public getUsers(branch?: BranchFilter): User[] {
    if (!branch || branch === 'all') return [...this.users];
    return this.users.filter((u) => u.branchId === branch);
  }

  public getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getUserByNationalId(nationalId: string): User | undefined {
    return this.users.find((u) => u.nationalId.trim() === nationalId.trim());
  }

  public updateUserProfile(updatedUser: User, executorRole: UserRole): { success: boolean; message: string } {
    const targetUser = this.users.find((u) => u.id === updatedUser.id);
    if (!targetUser) return { success: false, message: 'المستخدم غير موجود' };

    // Security rule: Sub-Admins cannot modify, delete, or revoke Main Admin's role or profile.
    if (targetUser.role === 'main_admin' && executorRole !== 'main_admin') {
      return {
        success: false,
        message: 'غير مصرح: لا يمكن للأدمن الفرعي تعديل بيانات أو صلاحيات المدير الرئيسي نهائياً',
      };
    }

    this.users = this.users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    return { success: true, message: 'تم تحديث الملف الشخصي بنجاح' };
  }

  // ================= ADMIN-POWERED STAFF DIRECTORY & ACCOUNT MANAGEMENT =================

  /**
   * Full Staff Profile Editing Credentials by Admins:
   * Admins (Main Admin & Sub-Admins) have full authority to edit/update any member's account details:
   * - Full Name, Mobile Phone, National ID, Password/Secret Code, Designation / Role / StaffCategory.
   * Role hierarchy: Sub-Admins cannot edit Main Admin. Main Admin retains supreme authority.
   */
  public adminUpdateMember(
    updatedMember: User,
    executor: User
  ): { success: boolean; message: string } {
    if (executor.role !== 'main_admin' && executor.role !== 'sub_admin') {
      return {
        success: false,
        message: 'غير مصرح: هذه العملية مخصصة حصرياً للمدير العام والمدراء الفرعيين المصرح لهم',
      };
    }

    const targetUser = this.users.find((u) => u.id === updatedMember.id);
    if (!targetUser) {
      return { success: false, message: 'تعذر العثور على سجل المنتسب المحدد' };
    }

    // Role Restrictions Hierarchy: Sub-Admins CANNOT edit Main Admin
    if (targetUser.role === 'main_admin' && executor.role !== 'main_admin') {
      return {
        success: false,
        message: 'غير مصرح سيادياً: لا يمكن للأدمن الفرعي تعديل بيانات أو كلمة سر أو صلاحيات المدير العام للمركز',
      };
    }

    // Sub-Admins cannot promote anyone to main_admin or sub_admin
    if (executor.role === 'sub_admin' && updatedMember.role !== 'staff') {
      return {
        success: false,
        message: 'غير مصرح: صلاحية ترقية وتعديل الرتب الإدارية (أدمن فرعي / مدير عام) محصورة بالمدير العام حصراً',
      };
    }

    // National ID Uniqueness check
    const cleanNationalId = updatedMember.nationalId.trim();
    if (!cleanNationalId) {
      return { success: false, message: 'يرجى إدخال رقم البطاقة الوطنية' };
    }

    const duplicateId = this.users.find(
      (u) => u.id !== updatedMember.id && u.nationalId.trim() === cleanNationalId
    );
    if (duplicateId) {
      return {
        success: false,
        message: `رقم البطاقة الوطنية (${cleanNationalId}) مسجل بالفعل باسم (${duplicateId.fullName})`,
      };
    }

    // Phone number validation
    if (!updatedMember.phoneNumber.trim()) {
      return { success: false, message: 'يرجى إدخال رقم الهاتف / الموبايل' };
    }

    // Full name validation
    if (!updatedMember.fullName.trim()) {
      return { success: false, message: 'يرجى إدخال الاسم الكامل للمنتسب' };
    }

    // Prepare updated record
    const finalRecord: User = {
      ...targetUser,
      fullName: updatedMember.fullName.trim(),
      phoneNumber: updatedMember.phoneNumber.trim(),
      nationalId: cleanNationalId,
      designation: updatedMember.designation.trim() || 'منتسب بالمركز',
      staffCategory: updatedMember.staffCategory || 'إداري',
      // If password changed, update both password and pinCode for convenience
      password: updatedMember.password?.trim() || targetUser.password || '123456',
      pinCode: updatedMember.pinCode?.trim() || targetUser.pinCode || cleanNationalId.slice(-4),
      role: executor.role === 'main_admin' ? updatedMember.role : targetUser.role,
      status: updatedMember.status || targetUser.status || 'active',
      avatarUrl: updatedMember.avatarUrl || targetUser.avatarUrl,
      biometricEnabled: updatedMember.biometricEnabled ?? targetUser.biometricEnabled,
    };

    this.users = this.users.map((u) => (u.id === updatedMember.id ? finalRecord : u));
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    return {
      success: true,
      message: `تم تحديث وتثبيت بيانات وحساب (${finalRecord.fullName}) بنجاح في قاعدة البيانات`,
    };
  }

  /**
   * Override and reset any member's password / secret code directly from Admin Panel
   */
  public adminResetPassword(
    targetUserId: string,
    newSecretCode: string,
    executor: User
  ): { success: boolean; message: string } {
    if (executor.role !== 'main_admin' && executor.role !== 'sub_admin') {
      return { success: false, message: 'غير مصرح: صلاحية ضبط الرمز السري متاحة للإدارة فقط' };
    }

    const targetUser = this.users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    if (targetUser.role === 'main_admin' && executor.role !== 'main_admin') {
      return {
        success: false,
        message: 'غير مصرح: لا يمكن للأدمن الفرعي إعادة تعيين الرمز السري للمدير العام للمركز',
      };
    }

    const cleanPass = newSecretCode.trim();
    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, message: 'يجب أن يتكون الرمز السري الجديد من 4 خانات على الأقل' };
    }

    targetUser.password = cleanPass;
    targetUser.pinCode = cleanPass.length <= 6 ? cleanPass : cleanPass.slice(0, 4);
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    return {
      success: true,
      message: `تم إعادة تعيين الرمز السري للمنتسب (${targetUser.fullName}) بنجاح`,
    };
  }

  /**
   * Self-service password change by any staff member
   */
  public updateSelfPassword(
    userId: string,
    oldPass: string,
    newPass: string
  ): { success: boolean; message: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'المستخدم غير موجود' };

    const cleanOld = oldPass.trim();
    const cleanNew = newPass.trim();

    const currentPass = user.password || '123456';
    if (cleanOld !== currentPass && cleanOld !== user.pinCode) {
      return { success: false, message: 'كلمة المرور الحالية غير مطابقة' };
    }

    if (!cleanNew || cleanNew.length < 4) {
      return { success: false, message: 'يجب أن تتكون كلمة المرور الجديدة من 4 خانات على الأقل' };
    }

    user.password = cleanNew;
    if (cleanNew.length <= 6) {
      user.pinCode = cleanNew;
    }
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    return { success: true, message: 'تم تحديث كلمة المرور الخاصة بك بنجاح' };
  }

  /**
   * Main Admin creates new member account (Supreme Authority)
   */
  public createNewMember(
    newMember: Omit<User, 'id' | 'createdAt'>,
    executor: User
  ): { success: boolean; user?: User; message: string } {
    if (executor.role !== 'main_admin' && executor.role !== 'sub_admin') {
      return { success: false, message: 'غير مصرح: إضافة المنتسبين متاحة للمدراء فقط' };
    }

    if (executor.role === 'sub_admin' && newMember.role !== 'staff') {
      return { success: false, message: 'المدير العام فقط يمتلك صلاحية تعيين مدراء فرعيين' };
    }

    const cleanNID = newMember.nationalId.trim();
    if (!cleanNID) {
      return { success: false, message: 'يرجى إدخال رقم البطاقة الوطنية' };
    }

    if (this.users.some((u) => u.nationalId.trim() === cleanNID)) {
      return { success: false, message: `رقم البطاقة الوطنية (${cleanNID}) مسجل بالفعل في المركز` };
    }

    const randomId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const branchId: BranchId = newMember.branchId || (executor.branchId || 'basra');
    const createdUser: User = {
      ...newMember,
      id: randomId,
      nationalId: cleanNID,
      fullName: newMember.fullName.trim(),
      phoneNumber: newMember.phoneNumber.trim(),
      designation: newMember.designation.trim() || 'منتسب بالمركز',
      staffCategory: newMember.staffCategory || 'إداري',
      branchId,
      branchName: newMember.branchName || (branchId === 'najaf' ? 'فرع النجف' : 'فرع البصرة'),
      password: newMember.password?.trim() || '123456',
      pinCode: newMember.pinCode?.trim() || cleanNID.slice(-4),
      role: executor.role === 'main_admin' ? newMember.role : 'staff',
      status: 'active',
      avatarUrl:
        newMember.avatarUrl ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      biometricEnabled: newMember.biometricEnabled ?? true,
      createdAt: new Date().toISOString(),
    };

    this.users.push(createdUser);
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    return {
      success: true,
      user: createdUser,
      message: `تم إنشاء حساب المنتسب (${createdUser.fullName}) بنجاح`,
    };
  }

  /**
   * Suspend or Reactivate a staff account (Toggle):
   * Prevents them from logging into the app without deleting their history.
   * Sub-Admins can suspend/reactivate normal staff, but CANNOT suspend Main Admin or other Sub-Admins.
   * Main Admin retains absolute authority over all Sub-Admin and Staff accounts.
   */
  public toggleSuspendMember(
    targetUserId: string,
    executor: User
  ): { success: boolean; isSuspended: boolean; message: string } {
    if (executor.role !== 'main_admin' && executor.role !== 'sub_admin') {
      return {
        success: false,
        isSuspended: false,
        message: 'غير مصرح: تعليق وتنشيط الحسابات متاح للمدير العام والمدراء الفرعيين فقط',
      };
    }

    const target = this.users.find((u) => u.id === targetUserId);
    if (!target) {
      return { success: false, isSuspended: false, message: 'المستخدم غير موجود' };
    }

    // Hierarchy rule: Nobody can suspend the Main Admin
    if (target.role === 'main_admin') {
      return {
        success: false,
        isSuspended: false,
        message: 'محظور: لا يمكن تعليق حساب المدير العام للمركز نهائياً حفاظاً على استقرار النظام',
      };
    }

    // Hierarchy rule: Sub-Admins cannot suspend other sub-admins or main admin
    if (executor.role === 'sub_admin' && target.role !== 'staff') {
      return {
        success: false,
        isSuspended: false,
        message: 'غير مصرح: لا يمكن للأدمن الفرعي تعليق حسابات المدراء الفرعيين أو المدير العام',
      };
    }

    // Prevent suspending own self while logged in
    if (target.id === executor.id) {
      return {
        success: false,
        isSuspended: false,
        message: 'لا يمكنك تعليق حسابك الشخصي أثناء تسجيل الدخول به',
      };
    }

    const willBeSuspended = target.status !== 'suspended';
    target.status = willBeSuspended ? 'suspended' : 'active';
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    return {
      success: true,
      isSuspended: willBeSuspended,
      message: willBeSuspended
        ? `تم تعليق حساب (${target.fullName}) بنجاح. لن يتمكن من تسجيل الدخول حتى إعادة تنشيطه مع بقاء سجلاته محفوظة.`
        : `تم رفع التعليق وتنشيط حساب (${target.fullName}) بنجاح.`,
    };
  }

  /**
   * Delete Member:
   * Permanently remove a staff profile and account access.
   * Hierarchy Rules:
   * - Sub-Admins can manage and delete normal staff, but CANNOT delete Main Admin.
   * - Main Admin retains absolute authority over all Sub-Admin and Staff accounts.
   * - Nobody can delete Main Admin.
   */
  public deleteMember(
    targetUserId: string,
    executor: User
  ): { success: boolean; message: string } {
    if (executor.role !== 'main_admin' && executor.role !== 'sub_admin') {
      return {
        success: false,
        message: 'غير مصرح: صلاحية حذف الحسابات متاحة للمدراء فقط',
      };
    }

    const target = this.users.find((u) => u.id === targetUserId);
    if (!target) {
      return { success: false, message: 'تعذر العثور على الحساب المطلوب' };
    }

    // Hierarchy rule: Cannot delete Main Admin
    if (target.role === 'main_admin') {
      return {
        success: false,
        message: 'محظور: لا يمكن حذف حساب المدير العام الرئيسي للمركز حفاظاً على استقرار النظام',
      };
    }

    if (target.id === executor.id) {
      return {
        success: false,
        message: 'لا يمكنك حذف حسابك الشخصي أثناء تسجيل الدخول به',
      };
    }

    // Hierarchy rule: Sub-Admins can delete normal staff, but CANNOT delete other Sub-Admins or Main Admin
    if (executor.role === 'sub_admin' && target.role !== 'staff') {
      return {
        success: false,
        message: 'غير مصرح: لا يمكن للأدمن الفرعي حذف حسابات المدراء الفرعيين أو المدير العام',
      };
    }

    this.users = this.users.filter((u) => u.id !== targetUserId);
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    return {
      success: true,
      message: `تم حذف حساب (${target.fullName}) نهائياً من سجلات المركز`,
    };
  }

  public updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    executor: User
  ): { success: boolean; message: string } {
    if (executor.role !== 'main_admin') {
      return {
        success: false,
        message: 'صلاحية حصرية: المدير الرئيسي فقط يمتلك حق منح أو سحب صلاحيات الأدمن الفرعي',
      };
    }

    const targetUser = this.users.find((u) => u.id === targetUserId);
    if (!targetUser) return { success: false, message: 'المستخدم غير موجود' };

    if (targetUser.id === executor.id) {
      return { success: false, message: 'لا يمكنك تغيير رتبتك كمدير رئيسي للمركز' };
    }

    targetUser.role = newRole;
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    const roleName = newRole === 'sub_admin' ? 'أدمن فرعي' : newRole === 'main_admin' ? 'مدير رئيسي' : 'منتسب';
    return { success: true, message: `تم تحديث رتبة ${targetUser.fullName} إلى (${roleName}) بنجاح` };
  }

  // ================= TIME UTILS =================
  public formatTime12h(date: Date = new Date()): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const displayHoursStr = displayHours < 10 ? `0${displayHours}` : `${displayHours}`;
    return `${displayHoursStr}:${displayMinutes} ${period}`;
  }

  // ================= ATTENDANCE =================
  public getAttendance(branch?: BranchFilter): AttendanceRecord[] {
    if (!branch || branch === 'all') return [...this.attendance];
    return this.attendance.filter((a) => a.branchId === branch);
  }

  public checkIn(
    user: User,
    verificationMethod: 'بصمة حيوية' | 'رقم وطني' | 'إلكتروني',
    notes?: string
  ): { success: boolean; record?: AttendanceRecord; message: string } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const existing = this.attendance.find((a) => a.userId === user.id && a.date === today);

    if (existing) {
      return { success: false, message: 'تم تسجيل الحضور لهذا اليوم مسبقاً في الساعة ' + existing.checkInTime };
    }

    const timeStr = this.formatTime12h(now);
    const time24h = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const createdAt = now.toISOString();
    const expiresAt = addOneYear(createdAt);

    // After 8:30 AM is marked as late, otherwise present
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);
    const status: AttendanceRecord['status'] = isLate ? 'متأخر' : 'present';

    const branchId: BranchId = user.branchId || 'basra';

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      branchId,
      date: today,
      checkInTime: timeStr,
      checkIn: time24h,
      status,
      workingHours: 0,
      verificationMethod,
      notes: notes || (isLate ? 'تسجيل متأخر عن التوقيت الرسمي' : 'تسجيل حضور اعتيادي في الموعد'),
      createdAt,
      expiresAt,
    };

    this.attendance.unshift(newRecord);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);
    return { success: true, record: newRecord, message: `تم تسجيل الحضور بنجاح في تمام الساعة (${timeStr})` };
  }

  public checkOut(user: User): { success: boolean; message: string } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const record = this.attendance.find((a) => a.userId === user.id && a.date === today);

    if (!record) {
      return { success: false, message: 'لم يتم تسجيل الحضور لهذا اليوم أولاً' };
    }

    if (record.checkOutTime) {
      return { success: false, message: `تم تسجيل الانصراف مسبقاً في تمام الساعة (${record.checkOutTime})` };
    }

    const timeStr = this.formatTime12h(now);
    const time24h = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    record.checkOutTime = timeStr;
    record.checkOut = time24h;

    // Calculate working hours between check-in and check-out
    try {
      const checkInDate = new Date(record.createdAt);
      const diffMs = now.getTime() - checkInDate.getTime();
      const diffHours = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
      record.workingHours = diffHours;
    } catch {
      record.workingHours = 8.0;
    }

    saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);
    return {
      success: true,
      message: `تم تسجيل الانصراف بنجاح في تمام الساعة (${timeStr}) - إجمالي ساعات العمل: ${record.workingHours} ساعة`,
    };
  }

  /**
   * Process & Import Attendance Record from JSON payload
   * e.g.:
   * {
   *   "id": "101",
   *   "date": "2026-09-22",
   *   "status": "present", // الحالات: 'present' (حاضر), 'absent' (غائب), 'leave' (إجازة)
   *   "checkIn": "08:00",
   *   "checkOut": "16:00"
   * }
   */
  public processAttendancePayload(payload: {
    id?: string;
    date: string;
    status: 'present' | 'absent' | 'leave' | 'حاضر' | 'غائب' | 'مجاز' | 'متأخر' | string;
    checkIn?: string;
    checkOut?: string;
    userId?: string;
    userName?: string;
    branchId?: BranchId;
  }): { success: boolean; record: AttendanceRecord; message: string } {
    const rawId = payload.id ? String(payload.id).trim() : `att_${Date.now()}`;
    const date = payload.date || new Date().toISOString().split('T')[0];

    // Status normalization
    let normalizedStatus: AttendanceRecord['status'] = 'present';
    const st = String(payload.status).toLowerCase().trim();
    if (st === 'present' || st === 'حاضر') {
      normalizedStatus = 'present';
    } else if (st === 'absent' || st === 'غائب') {
      normalizedStatus = 'absent';
    } else if (st === 'leave' || st === 'إجازة' || st === 'مجاز') {
      normalizedStatus = 'leave';
    } else if (st === 'متأخر') {
      normalizedStatus = 'متأخر';
    }

    // Resolve user & branch
    let targetUser: User | undefined;
    if (payload.userId) {
      targetUser = this.getUserById(payload.userId);
    }
    if (!targetUser) {
      const branchTarget = payload.branchId || 'basra';
      targetUser =
        this.users.find((u) => u.branchId === branchTarget && u.role === 'staff') ||
        this.users.find((u) => u.branchId === branchTarget) ||
        this.users[0];
    }

    const branchId: BranchId = payload.branchId || targetUser?.branchId || 'basra';

    // Calculate working hours
    let hours = 8;
    if (payload.checkIn && payload.checkOut) {
      try {
        const [inH, inM] = payload.checkIn.split(':').map(Number);
        const [outH, outM] = payload.checkOut.split(':').map(Number);
        const totalMinutes = outH * 60 + outM - (inH * 60 + inM);
        if (totalMinutes > 0) {
          hours = Math.round((totalMinutes / 60) * 10) / 10;
        }
      } catch {
        hours = 8;
      }
    } else if (normalizedStatus === 'absent' || normalizedStatus === 'leave') {
      hours = 0;
    }

    const checkInTime = payload.checkIn ? `${payload.checkIn} ص` : normalizedStatus === 'present' ? '08:00 ص' : '-';
    const checkOutTime = payload.checkOut ? `${payload.checkOut} م` : normalizedStatus === 'present' ? '04:00 م' : '-';

    const createdAt = `${date}T${payload.checkIn || '08:00'}:00Z`;
    const expiresAt = addOneYear(createdAt);

    const record: AttendanceRecord = {
      id: rawId,
      userId: targetUser?.id || 'usr_staff_1',
      userName: payload.userName || targetUser?.fullName || 'أ. مرتضى باقر الموسوي',
      userRole: targetUser?.role || 'staff',
      branchId,
      date,
      status: normalizedStatus,
      checkIn: normalizedStatus === 'present' ? (payload.checkIn || undefined) : undefined,
      checkOut: normalizedStatus === 'present' ? (payload.checkOut || undefined) : undefined,
      checkInTime,
      checkOutTime,
      workingHours: hours,
      verificationMethod: 'بصمة حيوية',
      notes: `سجل حضور إلكتروني موثق (#${rawId}) - ${branchId === 'najaf' ? 'فرع النجف الأشرف' : 'فرع البصرة'}`,
      createdAt,
      expiresAt,
    };

    const existingIdx = this.attendance.findIndex(
      (a) => (rawId && a.id === rawId) || (targetUser && a.userId === targetUser.id && a.date === date)
    );
    if (existingIdx >= 0) {
      this.attendance[existingIdx] = record;
    } else {
      this.attendance.unshift(record);
    }

    saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);

    return {
      success: true,
      record,
      message: `تمت معالجة وتثبيت سجل الحضور #${record.id} بنجاح لـ (${record.userName}) بتنسيق JSON المعتمد`,
    };
  }

  /**
   * Log an admin action modifying attendance records for auditing
   */
  public logAttendanceAudit(
    log: Omit<AttendanceAuditLog, 'id' | 'timestamp'>
  ): AttendanceAuditLog {
    const newAuditLog: AttendanceAuditLog = {
      ...log,
      id: `audit_att_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.attendanceAuditLogs.unshift(newAuditLog);
    saveToStorage(STORAGE_KEYS.ATTENDANCE_AUDIT_LOGS, this.attendanceAuditLogs);
    return newAuditLog;
  }

  /**
   * Get all attendance audit logs, optionally filtered by branch
   */
  public getAttendanceAuditLogs(branch?: BranchFilter): AttendanceAuditLog[] {
    if (!branch || branch === 'all') {
      return [...this.attendanceAuditLogs];
    }
    return this.attendanceAuditLogs.filter((l) => l.branchId === branch);
  }

  // Calculate 31-Day Dynamic Monthly Grid for user
  public getMonthAttendanceGrid(
    userId: string,
    year: number = 2026,
    month: number = 9 // 1-12, default 9 = September
  ) {
    const daysInMonth = 31; // Standard 31-day representation requested
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const userLeaves = this.leaves.filter(
      (l) => l.userId === userId && l.status === 'موافق عليها'
    );
    const userRecords = this.attendance.filter((a) => a.userId === userId);

    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const gridDays: Array<{
      dayNumber: number;
      dateStr: string;
      dayName: string;
      isFuture: boolean;
      status: 'حاضر' | 'غائب' | 'مجاز' | 'عطلة رسمية' | 'لم يحن بعد';
      checkInTime?: string;
      checkOutTime?: string;
      workingHours: number;
      leaveInfo?: {
        category: string;
        type: string;
        reason: string;
        hours?: number;
      };
      exemptFromEvaluation: boolean;
    }> = [];

    let presentCount = 0;
    let absentCount = 0;
    let leavesCount = 0;
    let totalWorkingHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const dateObj = new Date(year, month - 1, day);
      const dayOfWeekIndex = dateObj.getDay();
      const dayName = arabicDays[dayOfWeekIndex];
      const isFriday = dayOfWeekIndex === 5; // Friday is weekend in Iraq

      const isFuture =
        year > currentYear ||
        (year === currentYear && month > currentMonth) ||
        (year === currentYear && month === currentMonth && day > currentDay);

      // Check if user has an approved leave on this date
      const activeLeave = userLeaves.find(
        (l) => dateStr >= l.startDate && dateStr <= l.endDate
      );

      // Check attendance record
      const record = userRecords.find((r) => r.date === dateStr);

      let status: 'حاضر' | 'غائب' | 'مجاز' | 'عطلة رسمية' | 'لم يحن بعد';
      let checkInTime = record?.checkInTime;
      let checkOutTime = record?.checkOutTime;
      let hours = record?.workingHours || 0;
      let exemptFromEvaluation = false;

      if (activeLeave) {
        status = 'مجاز';
        exemptFromEvaluation = true;
        leavesCount++;
        if (activeLeave.category === 'زمنية' && activeLeave.totalHours) {
          hours = Math.max(0, 6.0 - activeLeave.totalHours);
          totalWorkingHours += hours;
        }
      } else if (record && (record.status === 'حاضر' || record.status === 'متأخر' || record.status === 'present')) {
        status = 'حاضر';
        presentCount++;
        if (!hours) {
          hours = 6.5; // default shift if not timed out
        }
        totalWorkingHours += hours;
      } else if (record && (record.status === 'مجاز' || record.status === 'إجازة' || record.status === 'leave')) {
        status = 'مجاز';
        exemptFromEvaluation = true;
        leavesCount++;
      } else if (record && (record.status === 'غائب' || record.status === 'absent')) {
        status = 'غائب';
        absentCount++;
      } else if (isFuture) {
        status = 'لم يحن بعد';
      } else if (isFriday) {
        status = 'عطلة رسمية';
      } else {
        status = 'غائب';
        absentCount++;
      }

      gridDays.push({
        dayNumber: day,
        dateStr,
        dayName,
        isFuture,
        status,
        checkInTime: checkInTime || (status === 'حاضر' ? '08:00 ص' : '-'),
        checkOutTime: checkOutTime || (status === 'حاضر' ? '02:30 م' : '-'),
        workingHours: Math.round(hours * 10) / 10,
        leaveInfo: activeLeave
          ? {
              category: activeLeave.category,
              type: activeLeave.type,
              reason: activeLeave.reason,
              hours: activeLeave.totalHours,
            }
          : undefined,
        exemptFromEvaluation,
      });
    }

    return {
      days: gridDays,
      presentCount,
      absentCount,
      leavesCount,
      totalWorkingHours: Math.round(totalWorkingHours * 10) / 10,
    };
  }

  // ================= LEAVES =================
  public getLeaves(branch?: BranchFilter): LeaveRequest[] {
    if (!branch || branch === 'all') return [...this.leaves];
    return this.leaves.filter((l) => l.branchId === branch);
  }

  public submitLeave(request: Omit<LeaveRequest, 'id' | 'createdAt' | 'expiresAt' | 'status'>): LeaveRequest {
    const user = this.users.find((u) => u.id === request.userId);
    const branchId: BranchId = request.branchId || user?.branchId || 'basra';
    const createdAt = new Date().toISOString();
    const newLeave: LeaveRequest = {
      ...request,
      id: `leave_${Date.now()}`,
      branchId,
      status: 'قيد المراجعة',
      exemptFromEvaluation: false,
      createdAt,
      expiresAt: addOneYear(createdAt),
    };
    this.leaves.unshift(newLeave);
    saveToStorage(STORAGE_KEYS.LEAVES, this.leaves);
    return newLeave;
  }

  public reviewLeave(
    leaveId: string,
    status: 'موافق عليها' | 'مرفوضة',
    reviewerName: string,
    reviewNotes?: string
  ): boolean {
    const leave = this.leaves.find((l) => l.id === leaveId);
    if (!leave) return false;

    leave.status = status;
    leave.approvedBy = reviewerName;
    leave.reviewNotes = reviewNotes || (status === 'موافق عليها' ? 'تمت الموافقة الرسمية واعتماد الإجازة' : 'تم الرفض وفق مقتضيات العمل');
    leave.exemptFromEvaluation = status === 'موافق عليها';

    // Auto-sync into attendance records when approved as required:
    // "When Admin approves a leave request, it automatically reflects in both the Leave Register and the 31-Day Attendance Grid as 'مجاز'.
    // Exempts the user from negative performance evaluation on approved leave days."
    if (status === 'موافق عليها') {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      // Loop through each date in the leave range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const existingAtt = this.attendance.find((a) => a.userId === leave.userId && a.date === dateStr);

        if (existingAtt) {
          existingAtt.status = 'مجاز';
          existingAtt.notes = `إجازة ${leave.type} معتمدة رسمياً (${leave.category})`;
        } else {
          const user = this.getUserById(leave.userId);
          const newAtt: AttendanceRecord = {
            id: `att_leave_${leave.id}_${dateStr}`,
            userId: leave.userId,
            userName: leave.userName,
            branchId: leave.branchId || user?.branchId || 'basra',
            userRole: user?.role || 'staff',
            date: dateStr,
            checkInTime: leave.category === 'زمنية' && leave.fromTime ? leave.fromTime : '-',
            checkOutTime: leave.category === 'زمنية' && leave.toTime ? leave.toTime : '-',
            status: 'مجاز',
            workingHours: leave.category === 'زمنية' ? Math.max(0, 6.0 - (leave.totalHours || 2)) : 0,
            verificationMethod: 'إلكتروني',
            notes: `إجازة ${leave.type} (${leave.category}) معتمدة رسمياً من قبل الإدارة`,
            createdAt: new Date().toISOString(),
            expiresAt: addOneYear(new Date().toISOString()),
          };
          this.attendance.unshift(newAtt);
        }
      }
      saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);
    }

    saveToStorage(STORAGE_KEYS.LEAVES, this.leaves);
    return true;
  }

  // ================= NOTIFICATIONS ENGINE =================
  public getNotifications(userId?: string): AppNotification[] {
    if (!userId) return [...this.notifications];
    return this.notifications.filter((n) => n.userId === userId);
  }

  public getUserNotifications(userId?: string): AppNotification[] {
    return this.getNotifications(userId);
  }

  public sendNotification(
    notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
  ): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(newNotif);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

    // Notify active subscribers immediately
    this.notifListeners.forEach((listener) => {
      try {
        listener(newNotif);
      } catch (e) {
        console.error('Error dispatching notification:', e);
      }
    });

    return newNotif;
  }

  public markNotificationAsRead(notifId: string): void {
    const notif = this.notifications.find((n) => n.id === notifId);
    if (notif) {
      notif.isRead = true;
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    let changed = false;
    this.notifications.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        changed = true;
      }
    });
    if (changed) {
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    }
  }

  public onNotification(listener: (notif: AppNotification) => void): () => void {
    this.notifListeners.push(listener);
    return () => {
      this.notifListeners = this.notifListeners.filter((l) => l !== listener);
    };
  }

  // ================= EVALUATIONS (DAILY & MONTHLY 31-DAY AGGREGATION) =================
  public getEvaluations(branch?: BranchFilter): PerformanceEvaluation[] {
    if (!branch || branch === 'all') return [...this.evaluations];
    return this.evaluations.filter((e) => e.branchId === branch);
  }

  public getDailyEvaluations(userId?: string, branch?: BranchFilter): DailyStaffEvaluation[] {
    let list = [...this.dailyEvaluations];
    if (branch && branch !== 'all') {
      list = list.filter((d) => d.branchId === branch);
    }
    if (userId) {
      list = list.filter((d) => d.userId === userId);
    }
    return list;
  }

  public setDailyEvaluation(
    evalData: Partial<DailyStaffEvaluation> & {
      userId: string;
      userName: string;
      date: string;
      score: number;
      evaluatorId: string;
      evaluatorName: string;
      branchId?: BranchId;
    }
  ): DailyStaffEvaluation {
    const user = this.users.find((u) => u.id === evalData.userId);
    const branchId: BranchId = evalData.branchId || user?.branchId || 'basra';
    const dayNumber = evalData.dayNumber || (evalData.date ? parseInt(evalData.date.split('-')[2] || '1', 10) : 1);
    const attendanceStatus = evalData.attendanceStatus || (evalData.isExemptedLeave ? 'مجاز' : 'حاضر');
    const aspects = evalData.aspects || {
      punctuality: Math.min(2.5, evalData.score * 0.25),
      productivity: Math.min(2.5, evalData.score * 0.25),
      conduct: Math.min(2.5, evalData.score * 0.25),
      culturalInitiative: Math.min(2.5, evalData.score * 0.25),
    };

    const existingIndex = this.dailyEvaluations.findIndex(
      (d) => d.userId === evalData.userId && d.date === evalData.date
    );

    const now = new Date().toISOString();
    let result: DailyStaffEvaluation;

    if (existingIndex >= 0) {
      result = {
        ...this.dailyEvaluations[existingIndex],
        ...evalData,
        branchId,
        dayNumber,
        attendanceStatus,
        aspects,
        isExemptedLeave: evalData.isExemptedLeave ?? false,
        createdAt: now,
      };
      this.dailyEvaluations[existingIndex] = result;
    } else {
      result = {
        id: `deval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: evalData.userId,
        userName: evalData.userName,
        branchId,
        date: evalData.date,
        dayNumber,
        score: evalData.score,
        evaluatorId: evalData.evaluatorId,
        evaluatorName: evalData.evaluatorName,
        aspects,
        notes: evalData.notes || '',
        isExemptedLeave: evalData.isExemptedLeave ?? false,
        attendanceStatus,
        createdAt: now,
      };
      this.dailyEvaluations.unshift(result);
    }

    saveToStorage(STORAGE_KEYS.DAILY_EVALUATIONS, this.dailyEvaluations);

    // Also send an evaluation update alert
    this.sendNotification({
      userId: evalData.userId,
      title: 'تقييم يومي جديد',
      message: `تم اعتماد تقييمك اليومي لتاريخ (${evalData.date}): ${evalData.score} / 10 من قبل ${evalData.evaluatorName}.`,
      type: 'evaluation',
      relatedId: result.id,
      senderName: evalData.evaluatorName,
    });

    return result;
  }

  /**
   * Generates a dynamic 31-day evaluation table aggregated out of 100 points!
   * Sync Logic: Days marked as Approved Leave ("مجاز") are automatically exempted
   * and do NOT degrade the monthly total score.
   */
  public getMonthly31DaysEvaluation(userId: string, year: number = 2026, monthNumber: number = 9) {
    const user = this.getUserById(userId);
    const monthStr = monthNumber < 10 ? `0${monthNumber}` : `${monthNumber}`;
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    // Today is September 20, 2026
    const today = new Date('2026-09-20T12:00:00Z');

    interface DayEvalRow {
      dayNumber: number;
      dateStr: string;
      dayName: string;
      status: 'حاضر' | 'غائب' | 'مجاز' | 'عطلة رسمية' | 'لم يحن بعد';
      score: number; // out of 10
      aspects?: DailyStaffEvaluation['aspects'];
      isExemptedLeave: boolean;
      notes?: string;
      evaluatorName?: string;
      checkInTime?: string;
      checkOutTime?: string;
      leaveCategory?: string;
    }

    const rows: DayEvalRow[] = [];
    let eligibleDaysCount = 0;
    let totalEligiblePoints = 0;
    let exemptedLeavesCount = 0;
    let presentDaysCount = 0;
    let absentDaysCount = 0;

    for (let d = 1; d <= 31; d++) {
      const dayPad = d < 10 ? `0${d}` : `${d}`;
      const dateStr = `${year}-${monthStr}-${dayPad}`;
      const dayDate = new Date(`${dateStr}T12:00:00Z`);
      const dayName = dayNames[dayDate.getUTCDay()];
      const isFuture = dayDate > today;

      // Check attendance record
      const att = this.attendance.find((a) => a.userId === userId && a.date === dateStr);

      // Check approved leave
      const leave = this.leaves.find(
        (l) =>
          l.userId === userId &&
          l.status === 'موافق عليها' &&
          dateStr >= l.startDate &&
          dateStr <= l.endDate
      );

      // Check daily evaluation saved
      const deval = this.dailyEvaluations.find((e) => e.userId === userId && e.date === dateStr);

      let status: DayEvalRow['status'] = 'لم يحن بعد';
      let score = 0;
      let isExemptedLeave = false;
      let notes: string | undefined = undefined;
      let evaluatorName: string | undefined = undefined;
      let aspects = deval?.aspects;

      if (isFuture) {
        status = 'لم يحن بعد';
        score = 0;
      } else if (leave || att?.status === 'مجاز') {
        status = 'مجاز';
        isExemptedLeave = true; // EXEMPTION LOGIC: Approved leave exempt from degrading total!
        score = 10; // Neutral / exempted full credit
        notes = leave ? `إجازة معتمدة (${leave.category}) - معفى رسمياً من التأثير السلبي` : 'إجازة رسمية معتمدة';
        evaluatorName = 'معفى بقرار الإدارة';
        exemptedLeavesCount++;
      } else if (att?.status === 'حاضر') {
        status = 'حاضر';
        presentDaysCount++;
        score = deval ? deval.score : 9.5; // default high baseline for present staff if not scored
        notes = deval?.notes || 'حضور فعلي والتزام تام';
        evaluatorName = deval?.evaluatorName || 'الإدارة المركزية';
        eligibleDaysCount++;
        totalEligiblePoints += score;
      } else if (att?.status === 'غائب') {
        status = 'غائب';
        absentDaysCount++;
        score = 0; // Unexcused absence pulls down score
        notes = 'غياب غير مبرر دون إشعار رسمي';
        evaluatorName = 'النظام الإداري';
        eligibleDaysCount++;
        totalEligiblePoints += 0;
      } else {
        // Weekend or past day with no log
        const isFriday = dayDate.getUTCDay() === 5;
        if (isFriday) {
          status = 'عطلة رسمية';
          notes = 'عطلة نهاية الأسبوع الرسمية (الجمعة)';
        } else {
          // Normal day: if past before day 20 and not attended: absent
          status = 'غائب';
          absentDaysCount++;
          score = 0;
          notes = 'غياب غير مبرر';
          eligibleDaysCount++;
          totalEligiblePoints += 0;
        }
      }

      rows.push({
        dayNumber: d,
        dateStr,
        dayName,
        status,
        score,
        aspects,
        isExemptedLeave,
        notes,
        evaluatorName,
        checkInTime: att?.checkInTime,
        checkOutTime: att?.checkOutTime,
        leaveCategory: leave?.category,
      });
    }

    // Dynamic Monthly Score Aggregation out of 100 points
    // Days marked as Approved Leave ("مجاز") are automatically exempted and do not degrade the monthly total score!
    let finalMonthlyScore = 100;
    if (eligibleDaysCount > 0) {
      finalMonthlyScore = Math.min(100, Math.round((totalEligiblePoints / (eligibleDaysCount * 10)) * 100));
    }

    let rating: PerformanceEvaluation['rating'] = 'مقبول';
    if (finalMonthlyScore >= 90) rating = 'ممتاز';
    else if (finalMonthlyScore >= 80) rating = 'جيد جداً';
    else if (finalMonthlyScore >= 70) rating = 'جيد';
    else if (finalMonthlyScore < 60) rating = 'يحتاج إلى تحسين';

    return {
      userName: user?.fullName || 'المنتسب',
      userRole: user?.role || 'staff',
      period: `أيلول ${year}`,
      days: rows,
      summary: {
        totalDaysInMonth: 31,
        eligibleDaysCount,
        presentDaysCount,
        exemptedLeavesCount,
        absentDaysCount,
        averageDailyScore: eligibleDaysCount > 0 ? (totalEligiblePoints / eligibleDaysCount).toFixed(1) : '10.0',
        finalMonthlyScore,
        rating,
        formulaExplanation:
          'تم احتساب المجموع من 100 نقطة بعد استبعاد أيام الإجازات المعتمدة (مجاز) كإعفاء رسمي تام دون إنقاص الدرجة التراكمية.',
      },
    };
  }

  public addEvaluation(
    evalData: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'expiresAt' | 'totalScore' | 'rating'>
  ): PerformanceEvaluation {
    const user = this.users.find((u) => u.id === evalData.userId);
    const branchId: BranchId = evalData.branchId || user?.branchId || 'basra';
    const { punctuality, productivity, culturalEngagement, teamwork } = evalData.scores;
    const totalScore = punctuality + productivity + culturalEngagement + teamwork;

    let rating: PerformanceEvaluation['rating'] = 'مقبول';
    if (totalScore >= 90) rating = 'ممتاز';
    else if (totalScore >= 80) rating = 'جيد جداً';
    else if (totalScore >= 70) rating = 'جيد';
    else if (totalScore < 60) rating = 'يحتاج إلى تحسين';

    const createdAt = new Date().toISOString();
    const newEval: PerformanceEvaluation = {
      ...evalData,
      id: `eval_${Date.now()}`,
      branchId,
      totalScore,
      rating,
      createdAt,
      expiresAt: addOneYear(createdAt),
    };

    this.evaluations.unshift(newEval);
    saveToStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);

    // Send push notification to target user
    this.sendNotification({
      userId: evalData.userId,
      title: 'استمارة التقييم الشهري المعتمدة',
      message: `تم اعتماد تقييمكم الشهري لفترة (${evalData.period}) بنتيجة ${totalScore}/100 وتقدير (${rating}).`,
      type: 'evaluation',
      relatedId: newEval.id,
      senderName: evalData.evaluatorName,
    });

    return newEval;
  }

  // ================= OFFICIAL DOCS & TASKS MODULE =================
  public getOfficialDocs(branch?: BranchFilter): OfficialDocumentTask[] {
    if (!branch || branch === 'all') return [...this.officialDocs];
    return this.officialDocs.filter((d) => d.branchId === branch);
  }

  public addOfficialDoc(
    doc: Omit<OfficialDocumentTask, 'id' | 'createdAt' | 'expiresAt'>
  ): OfficialDocumentTask {
    const createdAt = new Date().toISOString();
    const branchId: BranchId = doc.branchId || 'basra';
    const newDoc: OfficialDocumentTask = {
      ...doc,
      id: `doc_${Date.now()}`,
      branchId,
      createdAt,
      expiresAt: addOneYear(createdAt),
    };
    this.officialDocs.unshift(newDoc);
    saveToStorage(STORAGE_KEYS.OFFICIAL_DOCS, this.officialDocs);

    // Direct immediate push notification to all assigned staff members' devices!
    doc.assignedToUserIds.forEach((uid) => {
      this.sendNotification({
        userId: uid,
        title: 'تكليف بمهمة رسمية جديدة',
        message: `تم تكليفكم رسمياً بالمهمة (${doc.title}) مع إرفاق التعليمات والمستندات من قبل ${doc.issuedBy}.`,
        type: 'task',
        relatedId: newDoc.id,
        senderName: doc.issuedBy,
      });
    });

    return newDoc;
  }

  public updateDocStatus(
    docId: string,
    status: OfficialDocumentTask['status'],
    staffNotes?: string
  ): boolean {
    const doc = this.officialDocs.find((d) => d.id === docId);
    if (!doc) return false;
    doc.status = status;
    if (staffNotes) doc.staffNotes = staffNotes;
    if (status === 'مكتمل') doc.completedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.OFFICIAL_DOCS, this.officialDocs);
    return true;
  }

  // ================= WARNINGS & PENALTIES MODULE (WITH LINKED LOG & IMMEDIATE PUSH) =================
  public getWarnings(branch?: BranchFilter): WarningPenalty[] {
    if (!branch || branch === 'all') return [...this.warnings];
    return this.warnings.filter((w) => w.branchId === branch);
  }

  public addWarning(
    warning: Omit<WarningPenalty, 'id' | 'createdAt' | 'expiresAt'>
  ): WarningPenalty {
    const user = this.users.find((u) => u.id === warning.userId);
    const branchId: BranchId = warning.branchId || user?.branchId || 'basra';
    const createdAt = new Date().toISOString();
    const newWarn: WarningPenalty = {
      ...warning,
      id: `warn_${Date.now()}`,
      branchId,
      createdAt,
      expiresAt: addOneYear(createdAt),
    };
    this.warnings.unshift(newWarn);
    saveToStorage(STORAGE_KEYS.WARNINGS, this.warnings);

    // Notification Engine: Triggers an immediate direct push alert/notification to the targeted user's phone!
    const isPenalty = warning.category === 'عقوبة';
    this.sendNotification({
      userId: warning.userId,
      title: isPenalty ? '⚠️ إشعار إداري عاجل: صدور عقوبة' : '⚠️ إشعار إداري عاجل: صدور إنذار رسمي',
      message: `صدر بحقكم قرار إداري (${warning.type} - ${warning.recordNumber}): ${warning.reason}.`,
      type: isPenalty ? 'penalty' : 'warning',
      relatedId: newWarn.id,
      senderName: warning.issuedBy,
    });

    return newWarn;
  }

  public updateWarningStatus(
    warnId: string,
    status: WarningPenalty['status'],
    appealNotes?: string
  ): boolean {
    const warn = this.warnings.find((w) => w.id === warnId);
    if (!warn) return false;
    warn.status = status;
    if (appealNotes) warn.appealNotes = appealNotes;
    saveToStorage(STORAGE_KEYS.WARNINGS, this.warnings);
    return true;
  }

  /**
   * Retrieves linked disciplinary records connecting warnings and penalties
   */
  public getLinkedDisciplinaryLog(userId?: string, branch?: BranchFilter) {
    let all = this.warnings;
    if (branch && branch !== 'all') {
      all = all.filter((w) => w.branchId === branch);
    }
    if (userId) {
      all = all.filter((w) => w.userId === userId);
    }
    return all.map((item) => {
      let linkedParent: WarningPenalty | undefined = undefined;
      if (item.linkedWarningId) {
        linkedParent = this.warnings.find((w) => w.id === item.linkedWarningId);
      }
      const linkedChildren = this.warnings.filter((w) => w.linkedWarningId === item.id);
      return {
        ...item,
        linkedParent,
        linkedChildren,
      };
    });
  }

  // ================= COMPLAINTS & REQUESTS MODULE (EXCLUSIVE TO ADMIN VIEWS) =================
  public getComplaints(currentUser?: User, branch?: BranchFilter): RequestComplaint[] {
    if (!currentUser) return [...this.complaints];

    if (currentUser.role === 'main_admin') {
      if (!branch || branch === 'all') return [...this.complaints];
      return this.complaints.filter((c) => c.branchId === branch);
    }

    if (currentUser.role === 'sub_admin') {
      const userBranch = currentUser.branchId || 'basra';
      return this.complaints.filter((c) => c.branchId === userBranch);
    }

    return this.complaints.filter((c) => c.userId === currentUser.id);
  }

  public submitComplaint(
    complaint: Omit<RequestComplaint, 'id' | 'createdAt' | 'expiresAt' | 'status'>
  ): RequestComplaint {
    const user = this.users.find((u) => u.id === complaint.userId);
    const branchId: BranchId = complaint.branchId || user?.branchId || 'basra';
    const createdAt = new Date().toISOString();
    const newReq: RequestComplaint = {
      ...complaint,
      id: `req_${Date.now()}`,
      branchId,
      status: 'جديد',
      createdAt,
      expiresAt: addOneYear(createdAt),
    };
    this.complaints.unshift(newReq);
    saveToStorage(STORAGE_KEYS.COMPLAINTS, this.complaints);

    // Notify admins exclusively
    const admins = this.users.filter((u) => u.role === 'main_admin' || u.role === 'sub_admin');
    admins.forEach((admin) => {
      this.sendNotification({
        userId: admin.id,
        title: 'وارد جديد: طلب / شكوى إدارية',
        message: `تم استلام ${complaint.type} جديد بعنوان "${complaint.title}" من ${complaint.userName}.`,
        type: 'system',
        relatedId: newReq.id,
        senderName: complaint.userName,
      });
    });

    return newReq;
  }

  public reviewComplaint(
    reqId: string,
    decision: 'مقبول' | 'مرفوض' | 'تم الرد' | 'قيد الدراسة',
    reply: string,
    reviewerName: string
  ): boolean {
    const item = this.complaints.find((c) => c.id === reqId);
    if (!item) return false;

    item.status = decision;
    item.adminDecision = decision;
    item.adminReply = reply;
    item.reviewedBy = reviewerName;
    item.replyDate = new Date().toISOString().split('T')[0];

    saveToStorage(STORAGE_KEYS.COMPLAINTS, this.complaints);

    // Push immediate notification to the staff member who filed the complaint!
    this.sendNotification({
      userId: item.userId,
      title: `قرار إداري: ${decision} بخصوص (${item.title})`,
      message: `أصدرت الإدارة قراراً رسمياً (${decision}): ${reply}`,
      type: 'complaint_reply',
      relatedId: item.id,
      senderName: reviewerName,
    });

    return true;
  }

  public replyToComplaint(reqId: string, reply: string): boolean {
    return this.reviewComplaint(reqId, 'تم الرد', reply, 'إدارة المركز');
  }

  // ================= ACTIVITY POSTS =================
  public getPosts(branch?: BranchFilter): ActivityPost[] {
    if (!branch || branch === 'all') return [...this.posts];
    return this.posts.filter((p) => p.branchId === branch);
  }

  public addPost(post: Omit<ActivityPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>): ActivityPost {
    const branchId: BranchId = post.branchId || 'basra';
    const newPost: ActivityPost = {
      ...post,
      id: `post_${Date.now()}`,
      branchId,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.posts.unshift(newPost);
    saveToStorage(STORAGE_KEYS.POSTS, this.posts);
    return newPost;
  }

  public toggleLike(postId: string): void {
    const post = this.posts.find((p) => p.id === postId);
    if (post) {
      post.likesCount += 1;
      saveToStorage(STORAGE_KEYS.POSTS, this.posts);
    }
  }

  // ================= 1-YEAR INSTITUTIONAL DATA RETENTION ENGINE =================
  /**
   * Scans all system records (attendance, leaves, evaluations, documents, warnings, complaints)
   * which are mathematically governed by a 1-YEAR (365-day) preservation lifecycle.
   * Emits automatic alerts to Admins when records are within 90 or 30 days of the 1-year expiration mark!
   */
  public getRetentionAlerts(): RetentionAlert[] {
    const now = new Date().getTime();
    const alerts: RetentionAlert[] = [];

    const checkRecord = (
      id: string,
      title: string,
      type: RetentionAlert['recordType'],
      expiresAt: string,
      isPermanentlyPreserved?: boolean
    ) => {
      if (isPermanentlyPreserved) return;
      const expDate = new Date(expiresAt).getTime();
      const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

      // Alert if within 90 days of 1-year expiration (or already past 1 year)
      if (diffDays <= 90) {
        const isCoreArchive = type === 'documents' || type === 'warnings' || type === 'evaluations';
        alerts.push({
          id: `ret_alert_${type}_${id}`,
          recordType: type,
          recordId: id,
          title,
          daysRemaining: Math.max(0, diffDays),
          expirationDate: new Date(expiresAt).toISOString().split('T')[0],
          severity: diffDays <= 30 ? 'critical' : 'warning',
          isDismissed: this.dismissedAlertIds.includes(`ret_alert_${type}_${id}`),
          isCoreArchive,
          isPermanentlyPreserved: false,
        });
      }
    };

    // Check attendance records
    this.attendance.forEach((a) => {
      checkRecord(a.id, `سجل حضور منتسب (${a.userName}) ليوم ${a.date}`, 'attendance', a.expiresAt, (a as any).isPermanentlyPreserved);
    });

    // Check leaves
    this.leaves.forEach((l) => {
      checkRecord(l.id, `طلب إجازة (${l.type}) للمنتسب ${l.userName}`, 'leaves', l.expiresAt, (l as any).isPermanentlyPreserved);
    });

    // Check documents
    this.officialDocs.forEach((d) => {
      checkRecord(d.id, `كتاب رسمي: ${d.title} (${d.docNumber})`, 'documents', d.expiresAt, (d as any).isPermanentlyPreserved);
    });

    // Check warnings
    this.warnings.forEach((w) => {
      checkRecord(w.id, `إجراء عقوبة/تنبيه: ${w.type} لـ ${w.userName}`, 'warnings', w.expiresAt, (w as any).isPermanentlyPreserved);
    });

    // Check evaluations
    this.evaluations.forEach((e) => {
      checkRecord(e.id, `تقييم أداء شهري: ${e.userName} (${e.period})`, 'evaluations', e.expiresAt, (e as any).isPermanentlyPreserved);
    });

    return alerts.filter((a) => !a.isDismissed);
  }

  public getExpiringFile(recordType: string, recordId: string): ExpiringArchiveFile | null {
    const now = new Date().getTime();
    const calculateDays = (exp: string) => {
      const expDate = new Date(exp).getTime();
      return Math.max(0, Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)));
    };

    if (recordType === 'attendance') {
      const rec = this.attendance.find((a) => a.id === recordId);
      if (!rec) return null;
      return {
        id: rec.id,
        recordType: 'attendance',
        title: `سجل الحضور والانصراف - ${rec.userName}`,
        docNumber: `ATT-${rec.date.replace(/-/g, '')}`,
        categoryName: 'حضور وانصراف',
        createdAt: rec.createdAt,
        expiresAt: rec.expiresAt,
        daysRemaining: calculateDays(rec.expiresAt),
        isCoreArchive: false,
        isPermanentlyPreserved: !!(rec as any).isPermanentlyPreserved,
        authorOrTargetName: rec.userName,
        details: `تاريخ الحضور: ${rec.date} | وقت الحضور: ${rec.checkInTime} | الانصراف: ${rec.checkOutTime || 'لم يسجل'} | طريقة التحقق: ${rec.verificationMethod}`,
        notes: rec.notes || 'سجل حضور مؤرشف',
        rawRecord: rec,
      };
    }

    if (recordType === 'documents') {
      const rec = this.officialDocs.find((d) => d.id === recordId);
      if (!rec) return null;
      return {
        id: rec.id,
        recordType: 'documents',
        title: rec.title,
        docNumber: rec.docNumber,
        categoryName: rec.type,
        createdAt: rec.createdAt,
        expiresAt: rec.expiresAt,
        daysRemaining: calculateDays(rec.expiresAt),
        isCoreArchive: true,
        isPermanentlyPreserved: !!(rec as any).isPermanentlyPreserved,
        authorOrTargetName: rec.issuedBy,
        details: `المكلفون: ${rec.assignedToNames.join('، ')}\nتاريخ الإصدار: ${rec.issueDate}\nالأسبقية: ${rec.priority}\n\nنص الكتاب:\n${rec.content}\n\nالتعليمات الإدارية:\n${rec.instructions || 'لا توجد'}`,
        notes: rec.instructions,
        rawRecord: rec,
      };
    }

    if (recordType === 'warnings') {
      const rec = this.warnings.find((w) => w.id === recordId);
      if (!rec) return null;
      return {
        id: rec.id,
        recordType: 'warnings',
        title: `${rec.type} - ${rec.userName}`,
        docNumber: rec.recordNumber,
        categoryName: rec.category,
        createdAt: rec.createdAt,
        expiresAt: rec.expiresAt,
        daysRemaining: calculateDays(rec.expiresAt),
        isCoreArchive: true,
        isPermanentlyPreserved: !!(rec as any).isPermanentlyPreserved,
        authorOrTargetName: rec.userName,
        details: `الجهة المصدرة: ${rec.issuedBy}\nتاريخ القرار: ${rec.issueDate}\nالسند القانوني: ${rec.legalArticle}\n\nالأسباب:\n${rec.reason}\n\nحالة الإجراء: ${rec.status}`,
        notes: rec.appealNotes || rec.reason,
        rawRecord: rec,
      };
    }

    if (recordType === 'leaves') {
      const rec = this.leaves.find((l) => l.id === recordId);
      if (!rec) return null;
      return {
        id: rec.id,
        recordType: 'leaves',
        title: `طلب إجازة (${rec.type}) - ${rec.userName}`,
        docNumber: `LV-${rec.startDate.replace(/-/g, '')}`,
        categoryName: rec.category,
        createdAt: rec.createdAt,
        expiresAt: rec.expiresAt,
        daysRemaining: calculateDays(rec.expiresAt),
        isCoreArchive: false,
        isPermanentlyPreserved: !!(rec as any).isPermanentlyPreserved,
        authorOrTargetName: rec.userName,
        details: `المدة: ${rec.totalDays} يوم (من ${rec.startDate} إلى ${rec.endDate})\nالسبب: ${rec.reason}\nالحالة: ${rec.status}\nالاعتماد: ${rec.approvedBy || 'قيد المراجعة'}`,
        notes: rec.reviewNotes || rec.reason,
        rawRecord: rec,
      };
    }

    if (recordType === 'evaluations') {
      const rec = this.evaluations.find((e) => e.id === recordId);
      if (!rec) return null;
      return {
        id: rec.id,
        recordType: 'evaluations',
        title: `استمارة تقييم الأداء الشهري - ${rec.userName}`,
        docNumber: `EVAL-${rec.period.replace(/\s+/g, '-')}`,
        categoryName: 'تقييم شهري',
        createdAt: rec.createdAt,
        expiresAt: rec.expiresAt,
        daysRemaining: calculateDays(rec.expiresAt),
        isCoreArchive: true,
        isPermanentlyPreserved: !!(rec as any).isPermanentlyPreserved,
        authorOrTargetName: rec.userName,
        details: `الفترة: ${rec.period}\nالدرجة النهائية: ${rec.totalScore}/100\nالتقدير: ${rec.rating}\nالمقيم: ${rec.evaluatorName}\nملاحظات الإدارة: ${rec.directorNotes}`,
        notes: rec.directorNotes,
        rawRecord: rec,
      };
    }

    return null;
  }

  public updateExpiringFileMetadata(
    recordType: string,
    recordId: string,
    updates: { title?: string; notes?: string; details?: string; docNumber?: string }
  ): { success: boolean; message: string } {
    if (recordType === 'attendance') {
      const rec = this.attendance.find((a) => a.id === recordId);
      if (!rec) return { success: false, message: 'السجل غير موجود' };
      if (updates.notes !== undefined) rec.notes = updates.notes;
      saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);
      return { success: true, message: 'تم تحديث بيانات وملاحظات سجل الحضور بنجاح' };
    }
    if (recordType === 'documents') {
      const rec = this.officialDocs.find((d) => d.id === recordId);
      if (!rec) return { success: false, message: 'الكتاب الرسمي غير موجود' };
      if (updates.title) rec.title = updates.title;
      if (updates.docNumber) rec.docNumber = updates.docNumber;
      if (updates.details) rec.content = updates.details;
      if (updates.notes) rec.instructions = updates.notes;
      saveToStorage(STORAGE_KEYS.OFFICIAL_DOCS, this.officialDocs);
      return { success: true, message: 'تم تحديث بيانات وملاحظات الكتاب الرسمي بنجاح' };
    }
    if (recordType === 'warnings') {
      const rec = this.warnings.find((w) => w.id === recordId);
      if (!rec) return { success: false, message: 'سجل العقوبة غير موجود' };
      if (updates.notes) rec.appealNotes = updates.notes;
      if (updates.details) rec.reason = updates.details;
      saveToStorage(STORAGE_KEYS.WARNINGS, this.warnings);
      return { success: true, message: 'تم تحديث تفاصيل وملاحظات الإنذار بنجاح' };
    }
    if (recordType === 'leaves') {
      const rec = this.leaves.find((l) => l.id === recordId);
      if (!rec) return { success: false, message: 'طلب الإجازة غير موجود' };
      if (updates.notes) rec.reviewNotes = updates.notes;
      saveToStorage(STORAGE_KEYS.LEAVES, this.leaves);
      return { success: true, message: 'تم تحديث ملاحظات الإجازة بنجاح' };
    }
    if (recordType === 'evaluations') {
      const rec = this.evaluations.find((e) => e.id === recordId);
      if (!rec) return { success: false, message: 'استمارة التقييم غير موجودة' };
      if (updates.notes) rec.directorNotes = updates.notes;
      saveToStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);
      return { success: true, message: 'تم تحديث ملاحظات تقييم الأداء بنجاح' };
    }
    return { success: false, message: 'نوع السجل غير معروف' };
  }

  public extendExpiringFileRetention(
    recordType: string,
    recordId: string,
    extensionYears: number,
    makePermanent: boolean
  ): { success: boolean; message: string } {
    const applyToRecord = (rec: any) => {
      if (!rec) return false;
      if (makePermanent) {
        rec.isPermanentlyPreserved = true;
        rec.expiresAt = '2099-12-31T23:59:59Z';
      } else {
        const curExp = new Date(rec.expiresAt);
        curExp.setFullYear(curExp.getFullYear() + extensionYears);
        rec.expiresAt = curExp.toISOString();
        rec.isPermanentlyPreserved = false;
      }
      return true;
    };

    let updated = false;
    if (recordType === 'attendance') {
      const rec = this.attendance.find((a) => a.id === recordId);
      updated = applyToRecord(rec);
      if (updated) saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);
    } else if (recordType === 'documents') {
      const rec = this.officialDocs.find((d) => d.id === recordId);
      updated = applyToRecord(rec);
      if (updated) saveToStorage(STORAGE_KEYS.OFFICIAL_DOCS, this.officialDocs);
    } else if (recordType === 'warnings') {
      const rec = this.warnings.find((w) => w.id === recordId);
      updated = applyToRecord(rec);
      if (updated) saveToStorage(STORAGE_KEYS.WARNINGS, this.warnings);
    } else if (recordType === 'leaves') {
      const rec = this.leaves.find((l) => l.id === recordId);
      updated = applyToRecord(rec);
      if (updated) saveToStorage(STORAGE_KEYS.LEAVES, this.leaves);
    } else if (recordType === 'evaluations') {
      const rec = this.evaluations.find((e) => e.id === recordId);
      updated = applyToRecord(rec);
      if (updated) saveToStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);
    }

    if (!updated) return { success: false, message: 'تعذر العثور على الملف لتمديد الحفظ' };

    // Dismiss any existing alert for this file
    this.dismissAlert(`ret_alert_${recordType}_${recordId}`);

    if (makePermanent) {
      return {
        success: true,
        message: 'تم تفعيل الحفظ التاريخي الدائم بنجاح وحماية السجل من الحذف التلقائي نهائياً',
      };
    }
    return {
      success: true,
      message: `تم تمديد فترة الحفظ بنجاح لمدة (+${extensionYears}) سنوات إضافية وتحديث تاريخ التقادم`,
    };
  }

  public deleteExpiringFile(
    recordType: string,
    recordId: string,
    actorRole: UserRole
  ): { success: boolean; message: string } {
    const isCoreArchive = recordType === 'documents' || recordType === 'warnings' || recordType === 'evaluations';

    // Hierarchy check:
    // Sub-Admins can review, export, and extend files within their granted scope.
    // Main Admin (المدير العام) holds overriding control to approve or permanently delete core historical archives.
    if (isCoreArchive && actorRole !== 'main_admin') {
      return {
        success: false,
        message: 'صلاحية سيادية: السجلات والكتب والقرارات التاريخية الأساسية تتطلب اعتماد المدير العام حصراً للموافقة على الحذف النهائي',
      };
    }

    let deleted = false;
    if (recordType === 'attendance') {
      const idx = this.attendance.findIndex((a) => a.id === recordId);
      if (idx !== -1) {
        this.attendance.splice(idx, 1);
        saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);
        deleted = true;
      }
    } else if (recordType === 'documents') {
      const idx = this.officialDocs.findIndex((d) => d.id === recordId);
      if (idx !== -1) {
        this.officialDocs.splice(idx, 1);
        saveToStorage(STORAGE_KEYS.OFFICIAL_DOCS, this.officialDocs);
        deleted = true;
      }
    } else if (recordType === 'warnings') {
      const idx = this.warnings.findIndex((w) => w.id === recordId);
      if (idx !== -1) {
        this.warnings.splice(idx, 1);
        saveToStorage(STORAGE_KEYS.WARNINGS, this.warnings);
        deleted = true;
      }
    } else if (recordType === 'leaves') {
      const idx = this.leaves.findIndex((l) => l.id === recordId);
      if (idx !== -1) {
        this.leaves.splice(idx, 1);
        saveToStorage(STORAGE_KEYS.LEAVES, this.leaves);
        deleted = true;
      }
    } else if (recordType === 'evaluations') {
      const idx = this.evaluations.findIndex((e) => e.id === recordId);
      if (idx !== -1) {
        this.evaluations.splice(idx, 1);
        saveToStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);
        deleted = true;
      }
    }

    if (!deleted) {
      return { success: false, message: 'تعذر العثور على السجل المطلوب حذفه' };
    }

    this.dismissAlert(`ret_alert_${recordType}_${recordId}`);
    return { success: true, message: 'تم حذف السجل نهائياً وتطهيره من قاعدة البيانات والأرشيف' };
  }

  public dismissAlert(alertId: string): void {
    if (!this.dismissedAlertIds.includes(alertId)) {
      this.dismissedAlertIds.push(alertId);
      saveToStorage(STORAGE_KEYS.DISMISSED_ALERTS, this.dismissedAlertIds);
    }
  }

  public getRetentionStats(): DataRetentionStats {
    const totalRecords =
      this.attendance.length +
      this.leaves.length +
      this.evaluations.length +
      this.officialDocs.length +
      this.warnings.length +
      this.complaints.length +
      this.purchases.length;

    const allDates = [
      ...this.attendance.map((a) => a.createdAt),
      ...this.leaves.map((l) => l.createdAt),
      ...this.evaluations.map((e) => e.createdAt),
      ...this.officialDocs.map((d) => d.createdAt),
      ...this.warnings.map((w) => w.createdAt),
      ...this.complaints.map((c) => c.createdAt),
      ...this.purchases.map((p) => p.createdAt),
    ].sort();

    const oldest = allDates[0] ? allDates[0].split('T')[0] : '2025-09-01';
    const newest = allDates[allDates.length - 1] ? allDates[allDates.length - 1].split('T')[0] : '2026-09-24';

    return {
      totalPreservedRecords: totalRecords,
      retentionSpanYears: 1,
      activeAlertsCount: this.getRetentionAlerts().length,
      oldestRecordDate: oldest,
      newestRecordDate: newest,
      retentionPolicyYears: 1,
    };
  }

  public exportRetentionArchiveJSON(): string {
    const exportData = {
      center: 'مركز الفضيل بن يسار البصري الثقافي',
      exportTimestamp: new Date().toISOString(),
      retentionPolicy: '1-Year Annual Archival Compliance Schema (أرشفة سنوية - سنة واحدة فقط)',
      attendance: this.attendance,
      leaves: this.leaves,
      evaluations: this.evaluations,
      officialDocs: this.officialDocs,
      warnings: this.warnings,
      complaints: this.complaints,
      purchases: this.purchases,
    };
    return JSON.stringify(exportData, null, 2);
  }

  // ================= CENTRAL PURCHASES REGISTRY (سجل المشتريات والطباعة) =================
  public getPurchases(branch?: BranchFilter): PurchaseRecord[] {
    if (!branch || branch === 'all') return [...this.purchases];
    return this.purchases.filter((p) => p.branchId === branch);
  }

  public getPurchaseById(id: string): PurchaseRecord | undefined {
    return this.purchases.find((p) => p.id === id);
  }

  public addPurchase(
    purchase: Omit<PurchaseRecord, 'id' | 'createdAt'>
  ): PurchaseRecord {
    const newPurchase: PurchaseRecord = {
      ...purchase,
      id: `pur_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.purchases.unshift(newPurchase);
    saveToStorage(STORAGE_KEYS.PURCHASES, this.purchases);
    return newPurchase;
  }

  public updatePurchase(
    id: string,
    updates: Partial<PurchaseRecord>
  ): boolean {
    const item = this.purchases.find((p) => p.id === id);
    if (!item) return false;
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    saveToStorage(STORAGE_KEYS.PURCHASES, this.purchases);
    return true;
  }

  public deletePurchase(id: string): boolean {
    const idx = this.purchases.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.purchases.splice(idx, 1);
    saveToStorage(STORAGE_KEYS.PURCHASES, this.purchases);
    return true;
  }

  // ================= DIGITAL LIBRARY (المكتبة الإلكترونية) =================
  /**
   * Universal Read Access:
   * Books state is stored under global key `app_books_data` and shared globally
   * across all user roles (Main Admin, Sub-Admins, and Regular Staff/Members).
   * No local session or uploader filtering is applied.
   */
  public getBooks(category?: BookCategory | 'all', search?: string): LibraryBook[] {
    // Synchronize latest data from global storage key ('app_books_data')
    const stored = loadFromStorage<LibraryBook[]>(STORAGE_KEYS.BOOKS, this.books);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      this.books = stored;
    }
    let result = [...this.books];
    if (category && category !== 'all') {
      result = result.filter((b) => b.category === category);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q))
      );
    }
    return result;
  }

  public getBookById(id: string): LibraryBook | undefined {
    const stored = loadFromStorage<LibraryBook[]>(STORAGE_KEYS.BOOKS, this.books);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      this.books = stored;
    }
    return this.books.find((b) => b.id === id);
  }

  public addBook(bookData: Omit<LibraryBook, 'id' | 'createdAt'>): LibraryBook {
    // Reload latest state from global storage to prevent race conditions
    const stored = loadFromStorage<LibraryBook[]>(STORAGE_KEYS.BOOKS, this.books);
    if (stored && Array.isArray(stored)) {
      this.books = stored;
    }

    const newBook: LibraryBook = {
      ...bookData,
      id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.books.unshift(newBook);
    saveToStorage(STORAGE_KEYS.BOOKS, this.books);

    // Instant UI Refresh: Dispatch global browser events for cross-role and cross-component sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app_books_data_updated', {
          detail: { newBook, books: this.books },
        })
      );
      window.dispatchEvent(
        new CustomEvent('books_updated', {
          detail: { newBook, books: this.books },
        })
      );
      // Trigger local storage event if applicable
      try {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEYS.BOOKS,
            newValue: JSON.stringify(this.books),
          })
        );
      } catch {
        // Ignored in non-DOM test runners
      }
    }

    return newBook;
  }

  public updateBook(id: string, updates: Partial<LibraryBook>): LibraryBook | null {
    const stored = loadFromStorage<LibraryBook[]>(STORAGE_KEYS.BOOKS, this.books);
    if (stored && Array.isArray(stored)) {
      this.books = stored;
    }

    const idx = this.books.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.books[idx] = {
      ...this.books[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.BOOKS, this.books);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app_books_data_updated', {
          detail: { updatedBook: this.books[idx], books: this.books },
        })
      );
      window.dispatchEvent(
        new CustomEvent('books_updated', {
          detail: { updatedBook: this.books[idx], books: this.books },
        })
      );
    }

    return this.books[idx];
  }

  public deleteBook(id: string): boolean {
    const stored = loadFromStorage<LibraryBook[]>(STORAGE_KEYS.BOOKS, this.books);
    if (stored && Array.isArray(stored)) {
      this.books = stored;
    }

    const idx = this.books.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.books.splice(idx, 1);
    saveToStorage(STORAGE_KEYS.BOOKS, this.books);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app_books_data_updated', {
          detail: { deletedId: id, books: this.books },
        })
      );
      window.dispatchEvent(
        new CustomEvent('books_updated', {
          detail: { deletedId: id, books: this.books },
        })
      );
    }

    return true;
  }

  // ================= MOBILE PUSH NOTIFICATIONS & DEVICE TOKENS =================
  public getDevicePushTokens(): DevicePushToken[] {
    return [...this.devicePushTokens];
  }

  /**
   * Returns target device tokens based on attendance trigger rules:
   * 1. Main Admin's mobile device (oversees both branches)
   * 2. Sub-Admin / Branch Admin for the specific branch (Basra or Najaf)
   */
  public getTargetAdminPushTokens(branchId?: BranchId): DevicePushToken[] {
    return this.devicePushTokens.filter((token) => {
      // Must be active and lock-screen enabled
      if (!token.isLockScreenEnabled) return false;
      // Main Admin gets all notifications
      if (token.userRole === 'main_admin') return true;
      // Sub Admin gets notifications for their specific branch
      if (token.userRole === 'sub_admin' && token.branchId === branchId) return true;
      return false;
    });
  }

  public registerDevicePushToken(
    tokenData: Omit<DevicePushToken, 'id' | 'registeredAt' | 'lastActiveAt'>
  ): DevicePushToken {
    // Check if token already exists for this user / device
    const existingIndex = this.devicePushTokens.findIndex(
      (t) => t.userId === tokenData.userId && (t.token === tokenData.token || t.deviceModel === tokenData.deviceModel)
    );

    const now = new Date().toISOString();

    if (existingIndex !== -1) {
      // Update existing
      this.devicePushTokens[existingIndex] = {
        ...this.devicePushTokens[existingIndex],
        ...tokenData,
        lastActiveAt: now,
      };
      saveToStorage(STORAGE_KEYS.DEVICE_PUSH_TOKENS, this.devicePushTokens);
      return this.devicePushTokens[existingIndex];
    } else {
      // Create new
      const newToken: DevicePushToken = {
        ...tokenData,
        id: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        registeredAt: now,
        lastActiveAt: now,
      };
      this.devicePushTokens.unshift(newToken);
      saveToStorage(STORAGE_KEYS.DEVICE_PUSH_TOKENS, this.devicePushTokens);
      return newToken;
    }
  }

  public updateDevicePushTokenStatus(
    id: string,
    isLockScreenEnabled: boolean,
    permissionStatus: 'granted' | 'denied' | 'default'
  ): boolean {
    const idx = this.devicePushTokens.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.devicePushTokens[idx].isLockScreenEnabled = isLockScreenEnabled;
    this.devicePushTokens[idx].permissionStatus = permissionStatus;
    this.devicePushTokens[idx].lastActiveAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.DEVICE_PUSH_TOKENS, this.devicePushTokens);
    return true;
  }

  public removeDevicePushToken(id: string): boolean {
    const idx = this.devicePushTokens.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.devicePushTokens.splice(idx, 1);
    saveToStorage(STORAGE_KEYS.DEVICE_PUSH_TOKENS, this.devicePushTokens);
    return true;
  }

  public logPushNotification(
    logData: Omit<PushNotificationLog, 'id' | 'dispatchedAt'>
  ): PushNotificationLog {
    const newLog: PushNotificationLog = {
      ...logData,
      id: `push_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dispatchedAt: new Date().toISOString(),
    };
    this.pushLogs.unshift(newLog);
    // Keep last 100 logs
    if (this.pushLogs.length > 100) {
      this.pushLogs = this.pushLogs.slice(0, 100);
    }
    saveToStorage(STORAGE_KEYS.PUSH_LOGS, this.pushLogs);
    return newLog;
  }

  public getPushNotificationLogs(): PushNotificationLog[] {
    return [...this.pushLogs];
  }

  public clearPushNotificationLogs(): void {
    this.pushLogs = [];
    saveToStorage(STORAGE_KEYS.PUSH_LOGS, this.pushLogs);
  }
}

export const storageService = new StorageService();
