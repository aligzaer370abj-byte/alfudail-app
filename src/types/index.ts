export type UserRole = 'main_admin' | 'sub_admin' | 'staff';

export type BranchId = 'basra' | 'najaf';
export type BranchFilter = 'all' | 'basra' | 'najaf';

export interface BranchInfo {
  id: BranchId;
  name: string; // 'فرع البصرة' | 'فرع النجف'
  city: string; // 'البصرة' | 'النجف الأشرف'
  code: string; // 'BSR' | 'NJF'
  address: string;
  phone: string;
  badgeColor: string;
}

export const BRANCHES_LIST: BranchInfo[] = [
  {
    id: 'basra',
    name: 'فرع البصرة',
    city: 'البصرة',
    code: 'BSR',
    address: 'البصرة - مركز المدينة - مجمع الفضيل الثقافي',
    phone: '07801234567',
    badgeColor: '#1B2A4A',
  },
  {
    id: 'najaf',
    name: 'فرع النجف',
    city: 'النجف الأشرف',
    code: 'NJF',
    address: 'النجف الأشرف - الحنانة - المجمع الثقافي العام',
    phone: '07809988112',
    badgeColor: '#2E8B57',
  },
];

export type StaffCategory = 'إداري' | 'منسق' | 'مروج' | 'مشرف ثقافي' | 'أمين مكتبة' | 'باحث';

export interface User {
  id: string;
  nationalId: string; // رقم البطاقة الوطنية
  email?: string;
  fullName: string;
  phoneNumber: string;
  designation: string; // المسمى الوظيفي
  department?: string; // الشعبة أو القسم
  staffCategory?: StaffCategory;
  role: UserRole;
  branchId: BranchId; // 'basra' | 'najaf'
  branchName?: string;
  isSuperAdmin?: boolean; // True for Main Super Admin (المدير العام الأعلى) with cross-branch sovereignty
  avatarUrl: string;
  biometricEnabled: boolean;
  pinCode?: string;
  password?: string; // كلمة المرور / الرمز السري
  status?: 'active' | 'suspended'; // حالة الحساب: نشط أو معلق
  createdAt: string;
  lastLogin?: string;
}

export interface DirectorContact {
  title: string;
  name: string;
  phone: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  branchId: BranchId; // 'basra' | 'najaf'
  date: string; // YYYY-MM-DD
  checkInTime: string; // 12-hour format e.g. "08:15 ص" or standard "08:00"
  checkOutTime?: string; // 12-hour format e.g. "02:30 م" or standard "16:00"
  checkIn?: string; // Standard alias format e.g. "08:00"
  checkOut?: string; // Standard alias format e.g. "16:00"
  status: 'حاضر' | 'متأخر' | 'غياب بعذر' | 'إجازة' | 'مجاز' | 'غائب' | 'present' | 'absent' | 'leave';
  workingHours?: number; // Calculated working hours e.g. 6.5
  verificationMethod: 'بصمة حيوية' | 'رقم وطني' | 'إلكتروني';
  notes?: string;
  createdAt: string;
  expiresAt: string; // 1 year retention timestamp
  retentionAlertTriggered?: boolean;
}

export type LeaveSubCategory = 'رسمية' | 'مرضية' | 'زمنية';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  branchId: BranchId; // 'basra' | 'najaf'
  category: LeaveSubCategory; // 1. الإجازات الرسمية 2. الإجازات المرضية 3. الإجازات الزمنية
  type: string; // e.g. 'رسمية عامة' | 'مرضية' | 'زمنية ساعية' | 'اعتيادية'
  startDate: string;
  endDate: string;
  fromTime?: string; // e.g. "09:30 ص" (for hourly leaves)
  toTime?: string;   // e.g. "12:30 م" (for hourly leaves)
  totalHours?: number; // for hourly leaves e.g. 3 hours
  totalDays: number;
  reason: string;
  medicalReportAttached?: boolean; // هل يوجد تقرير طبي؟
  medicalReportName?: string; // اسم التقرير أو الجهة الطبية
  status: 'قيد المراجعة' | 'موافق عليها' | 'مرفوضة';
  approvedBy?: string;
  reviewNotes?: string;
  exemptFromEvaluation?: boolean; // إعفاء من التقييم السلبي عند الموافقة
  createdAt: string;
  expiresAt: string; // 5 years
}

export interface MonthDayAttendance {
  dayNumber: number; // 1 to 31
  dateStr: string; // YYYY-MM-DD
  dayName: string; // الأحد، الإثنين، الثلاثاء ...
  isFuture: boolean;
  status: 'حاضر' | 'غائب' | 'مجاز' | 'عطلة رسمية' | 'لم يحن بعد';
  checkInTime?: string; // 12-hour format
  checkOutTime?: string; // 12-hour format
  workingHours: number; // Calculated hours
  leaveInfo?: {
    category: LeaveSubCategory;
    reason: string;
    hours?: number;
  };
  exemptFromEvaluation: boolean;
}

export interface DailyStaffEvaluation {
  id: string;
  userId: string;
  userName: string;
  branchId: BranchId; // 'basra' | 'najaf'
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1 to 31
  score: number; // 0 to 10 (Daily score out of 10)
  evaluatorId: string;
  evaluatorName: string;
  aspects: {
    punctuality: number; // 0 - 2.5
    productivity: number; // 0 - 2.5
    conduct?: number; // 0 - 2.5
    culturalInitiative?: number; // 0 - 2.5
    culturalEngagement?: number; // 0 - 2.5
    teamwork?: number; // 0 - 2.5
  };
  notes?: string;
  isExemptedLeave: boolean; // True if day is marked as approved leave
  attendanceStatus: 'حاضر' | 'غائب' | 'مجاز' | 'عطلة رسمية' | 'لم يحن بعد';
  createdAt: string;
}

export interface PerformanceEvaluation {
  id: string;
  userId: string;
  userName: string;
  branchId: BranchId; // 'basra' | 'najaf'
  evaluatorId: string;
  evaluatorName: string;
  period: string; // e.g., 'أيلول 2026'
  year: number;
  scores: {
    punctuality: number; // الالتزام والمواظبة (0-25)
    productivity: number; // جودة العمل والإنجاز (0-25)
    culturalEngagement: number; // المشاركة بالأنشطة الثقافية (0-25)
    teamwork: number; // العمل الجماعي والمبادرة (0-25)
  };
  totalScore: number; // 0 - 100
  rating: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'يحتاج إلى تحسين';
  directorNotes: string;
  dailyEvaluationsSummary?: {
    evaluatedDaysCount: number;
    exemptedLeaveDaysCount: number;
    absentDaysCount: number;
    averageDailyScore: number; // out of 10
    finalMonthlyScore: number; // out of 100
  };
  createdAt: string;
  expiresAt: string; // 5 years
}

export interface TaskAttachment {
  id?: string;
  name?: string;
  title?: string;
  size?: string;
  fileSize?: string;
  type?: string; // pdf, docx, img, xlsx
  fileType?: string;
  url?: string;
  fileUrl?: string;
  uploadedAt?: string;
}

export interface OfficialDocumentTask {
  id: string;
  docNumber: string; // رقم الكتاب الرسمي أو التكليف
  title: string;
  branchId: BranchId; // 'basra' | 'najaf'
  type: 'أمر إداري' | 'كتاب شكر وتقدير' | 'تكليف بمهمة' | 'تعميم ثقافي' | 'مذكرة داخلية' | 'كتاب رسمي' | 'تعميم داخلي' | 'تقرير دوري';
  issuedBy: string;
  assignedToUserIds: string[]; // Assigned staff members
  assignedToNames: string[];
  issueDate: string;
  dueDate?: string;
  priority: 'عاجل جداً' | 'هام' | 'عادي';
  status: 'قيد الإنجاز' | 'مكتمل' | 'مؤرشف' | 'قيد الانتظار' | 'قيد المراجعة' | 'معلق';
  content: string;
  instructions?: string; // Detailed instructions
  attachments?: TaskAttachment[]; // Attached files / instructions
  staffNotes?: string;
  completedAt?: string;
  createdAt: string;
  expiresAt: string; // 5 years
}

export interface WarningPenalty {
  id: string;
  recordNumber: string; // e.g., 'ق.إ/ع-2026/04'
  userId: string;
  userName: string;
  branchId: BranchId; // 'basra' | 'najaf'
  category: 'إنذار' | 'عقوبة'; // 'إنذار' or 'عقوبة'
  type:
    | 'تنبيه شفهي'
    | 'إنذار أولي'
    | 'إنذار ثانٍ'
    | 'إنذار نهائي'
    | 'لفت نظر'
    | 'خصم إداري'
    | 'حرمان من مخصصات'
    | 'تجميد ترقية'
    | 'إنهاء تكليف';
  reason: string;
  legalArticle?: string; // المادة الانضباطية أو اللائحة
  issuedBy: string; // Director name
  issueDate: string;
  status: 'نافذ' | 'تمت المعالجة' | 'قيد الاستئناف' | 'ملغى' | 'منفذ';
  linkedWarningId?: string; // Linked Log: ties penalty back to earlier warning
  linkedWarningRecordNumber?: string;
  escalationLevel?: 1 | 2 | 3;
  appealNotes?: string;
  createdAt: string;
  expiresAt: string; // 5 years
}

export interface RequestComplaint {
  id: string;
  userId: string;
  userName: string;
  branchId: BranchId; // 'basra' | 'najaf'
  userRole?: string;
  userDesignation?: string;
  type:
    | 'طلب سلفة'
    | 'مقترح تطويري'
    | 'طلب احتياجات مكتبية'
    | 'شكوى إدارية'
    | 'طلب رعاية نشاط'
    | 'تظلم إداري'
    | 'طلب صيانة أجهزة'
    | 'اقتراح تطويري'
    | 'تظلم وظيفي';
  title: string;
  details: string;
  urgency?: 'عاجل' | 'عادي';
  isConfidentialToDirector: boolean; // سري إلى المدير العام فقط
  status: 'جديد' | 'قيد الدراسة' | 'مقبول' | 'مرفوض' | 'تم الرد' | 'مغلق';
  adminDecision?: 'مقبول' | 'مرفوض' | 'تم الرد' | 'قيد الدراسة';
  adminReply?: string;
  reviewedBy?: string;
  replyDate?: string;
  createdAt: string;
  expiresAt: string; // 5 years
}

export interface AppNotification {
  id: string;
  userId: string; // Targeted user
  branchId?: BranchId; // 'basra' | 'najaf'
  title: string;
  message: string;
  type: 'warning' | 'penalty' | 'task' | 'complaint_reply' | 'evaluation' | 'system';
  relatedId?: string;
  senderName: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityPost {
  id: string;
  title: string;
  branchId: BranchId; // 'basra' | 'najaf'
  category: 'ندوة فكرية' | 'أمسية قرآنية' | 'محاضرة عقائدية' | 'دورة شبابية' | 'معرض كتاب';
  description: string;
  speakerOrOrganizer: string;
  date: string;
  location: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  createdAt: string;
}

// ================= DIGITAL LIBRARY (المكتبة الإلكترونية) =================
export type BookCategory = 'دينية' | 'ثقافية';

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: BookCategory; // 'دينية' | 'ثقافية'
  description?: string;
  coverUrl?: string;
  pdfUrl?: string; // Data URL, blob or PDF link
  pdfFileName?: string;
  pdfFileSize?: string;
  totalPages?: number;
  publishedYear?: string;
  sampleChapters?: { title: string; content: string }[];
  addedBy: string; // Admin Name
  addedByUserId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RetentionAlert {
  id: string;
  branchId?: BranchId;
  recordType: 'attendance' | 'leaves' | 'documents' | 'warnings' | 'evaluations';
  recordId: string;
  title: string;
  daysRemaining: number;
  expirationDate: string;
  severity: 'warning' | 'critical';
  isDismissed: boolean;
  isCoreArchive?: boolean;
  isPermanentlyPreserved?: boolean;
}

export interface ExpiringArchiveFile {
  id: string;
  recordType: 'attendance' | 'leaves' | 'documents' | 'warnings' | 'evaluations';
  title: string;
  docNumber?: string;
  categoryName: string;
  createdAt: string;
  expiresAt: string;
  daysRemaining: number;
  isCoreArchive: boolean;
  isPermanentlyPreserved: boolean;
  authorOrTargetName: string;
  details: string;
  notes?: string;
  rawRecord: any;
}

export interface DataRetentionStats {
  totalPreservedRecords: number;
  retentionSpanYears: number;
  activeAlertsCount: number;
  oldestRecordDate: string;
  newestRecordDate: string;
  retentionPolicyYears: 1 | 5;
}

export type PurchaseCategory =
  | 'أجهزة وإلكترونيات'
  | 'قرطاسية ومطبوعات'
  | 'ضيافة ومؤن'
  | 'أثاث وتجهيزات'
  | 'صيانة وخدمات'
  | 'كتب ومصادر'
  | 'أخرى';

export interface PurchaseRecord {
  id: string;
  itemName: string; // اسم المادة / المشتروات
  quantity: number; // الكمية
  unitPrice?: number; // سعر المفرد (د.ع)
  totalCost: number; // السعر / التكلفة الإجمالية (د.ع)
  purchaseDate: string; // تاريخ الشراء (YYYY-MM-DD)
  purchaserName: string; // اسم المشترِي / الأدمن المسجل
  purchaserId?: string; // معرف الأدمن
  branchId: BranchId; // 'basra' | 'najaf'
  category: PurchaseCategory | string; // الفئة
  notes?: string; // ملاحظات
  invoiceNumber?: string; // رقم الوصل / الفاتورة
  createdAt: string;
  updatedAt?: string;
}

// ================= MOBILE PUSH NOTIFICATIONS (FCM / ONESIGNAL / WEB PUSH) =================
export interface DevicePushToken {
  id: string;
  userId: string;
  userRole: UserRole;
  userName: string;
  branchId?: BranchId;
  token: string; // FCM Token / Web Push Subscription Endpoint
  provider: 'fcm' | 'onesignal' | 'web_push';
  platform: 'android' | 'ios' | 'desktop' | 'web';
  deviceModel?: string; // e.g. "Galaxy S24 Ultra - Android"
  permissionStatus: 'granted' | 'denied' | 'default';
  isLockScreenEnabled: boolean;
  registeredAt: string;
  lastActiveAt: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  screen?: string;
  data?: {
    url?: string;
    screen?: string;
    type?: 'check_in' | 'check_out' | 'test' | 'system';
    employeeId?: string;
    employeeName?: string;
    branchId?: BranchId;
    branchName?: string;
    time?: string;
    timestamp?: number;
  };
}

export interface PushNotificationLog {
  id: string;
  title: string;
  body: string;
  eventType: 'check_in' | 'check_out' | 'test' | 'system';
  employeeId?: string;
  employeeName: string;
  branchId?: BranchId;
  branchName: string;
  timeStr: string;
  targetedTokensCount: number;
  targetedRoles: UserRole[];
  targetedUserNames: string[];
  dispatchedAt: string;
  deliveryStatus: 'delivered_to_device' | 'sw_dispatched' | 'in_app_fallback';
}

// ================= AUDIT LOG FOR ATTENDANCE RECORD MODIFICATIONS =================
export interface AttendanceAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: UserRole;
  targetUserId: string;
  targetUserName: string;
  recordId?: string;
  date: string;
  previousStatus?: string;
  newStatus: string;
  previousCheckIn?: string;
  newCheckIn?: string;
  previousCheckOut?: string;
  newCheckOut?: string;
  timestamp: string;
  branchId: BranchId;
  notes?: string;
}

