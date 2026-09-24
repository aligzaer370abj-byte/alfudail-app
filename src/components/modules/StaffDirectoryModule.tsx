import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { User, UserRole, StaffCategory, BranchId } from '../../types';
import { BranchSelectorBar } from '../common/BranchSelectorBar';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Search,
  Phone,
  CreditCard,
  Lock,
  Check,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  UserX,
  RefreshCw,
  X,
  BadgeAlert,
  SlidersHorizontal,
  Building2,
} from 'lucide-react';

interface StaffDirectoryModuleProps {
  onBack: () => void;
}

export const StaffDirectoryModule: React.FC<StaffDirectoryModuleProps> = ({ onBack }) => {
  const {
    currentUser,
    isMainAdmin,
    isSubAdmin,
    canManageStaff,
    activeBranch,
    effectiveBranch,
    adminUpdateMember,
    adminResetPassword,
    createNewMember,
    deleteMember,
    toggleSuspendMember,
  } = useAuth();

  // Directory users state
  const [usersList, setUsersList] = useState<User[]>(() => storageService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'staff' | 'sub_admin' | 'main_admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Modals state
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [deletingMember, setDeletingMember] = useState<User | null>(null);

  // Status feedback toast
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const refreshList = () => {
    setUsersList(storageService.getUsers());
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const toggleRevealPassword = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Handle toggle suspend
  const handleToggleSuspend = (targetUser: User) => {
    const res = toggleSuspendMember(targetUser.id);
    if (res.success) {
      showToast(res.message, 'success');
      refreshList();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Filtered members list
  const filteredUsers = useMemo(() => {
    return usersList.filter((user) => {
      const matchesSearch =
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nationalId.includes(searchTerm) ||
        user.phoneNumber.includes(searchTerm) ||
        user.designation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'suspended'
          ? user.status === 'suspended'
          : user.status !== 'suspended';

      const matchesCategory =
        categoryFilter === 'all' ? true : user.staffCategory === categoryFilter;

      const matchesBranch = activeBranch === 'all' ? true : user.branchId === activeBranch;

      return matchesSearch && matchesRole && matchesStatus && matchesCategory && matchesBranch;
    });
  }, [usersList, searchTerm, roleFilter, statusFilter, categoryFilter, activeBranch]);

  // Statistics
  const stats = useMemo(() => {
    const branchScoped = activeBranch === 'all' ? usersList : usersList.filter((u) => u.branchId === activeBranch);
    const total = branchScoped.length;
    const mainAdmins = branchScoped.filter((u) => u.role === 'main_admin').length;
    const subAdmins = branchScoped.filter((u) => u.role === 'sub_admin').length;
    const regularStaff = branchScoped.filter((u) => u.role === 'staff').length;
    const activeCount = branchScoped.filter((u) => u.status !== 'suspended').length;
    const suspendedCount = branchScoped.filter((u) => u.status === 'suspended').length;
    return { total, mainAdmins, subAdmins, regularStaff, activeCount, suspendedCount };
  }, [usersList, activeBranch]);

  // Handle saving edited credentials
  const handleSaveMemberEdit = (updatedData: User) => {
    const res = adminUpdateMember(updatedData);
    if (res.success) {
      showToast(res.message, 'success');
      setEditingMember(null);
      refreshList();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle direct password reset override
  const handleConfirmPasswordReset = () => {
    if (!resettingPasswordUser) return;
    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 4) {
      showToast('يجب أن يتكون الرمز السري من 4 خانات على الأقل', 'error');
      return;
    }

    const res = adminResetPassword(resettingPasswordUser.id, newPasswordInput.trim());
    if (res.success) {
      showToast(res.message, 'success');
      setResettingPasswordUser(null);
      setNewPasswordInput('');
      refreshList();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle creating new member
  const handleCreateMember = (data: Omit<User, 'id' | 'createdAt'>) => {
    const res = createNewMember(data);
    if (res.success) {
      showToast(res.message, 'success');
      setIsNewMemberModalOpen(false);
      refreshList();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle member deletion
  const handleConfirmDelete = () => {
    if (!deletingMember) return;
    const res = deleteMember(deletingMember.id);
    if (res.success) {
      showToast(res.message, 'success');
      setDeletingMember(null);
      refreshList();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Security guard: Only Main Admin and Sub-Admins have access to this screen
  if (!canManageStaff) {
    return (
      <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] p-6 text-right flex flex-col items-center justify-center text-center" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mb-4 border border-red-200">
          <BadgeAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-[#1B2A4A] dark:text-white">صفحة مقيدة للإدارة فقط</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
          عذراً، دليل المنتسبين وإدارة الحسابات مخصص حصرياً للمدير العام والمدراء الفرعيين المصرح لهم.
        </p>
        <button
          onClick={onBack}
          className="mt-5 px-5 py-2.5 rounded-2xl bg-[#1B2A4A] text-white text-xs font-bold shadow-md hover:bg-[#22355e] cursor-pointer"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-12" dir="rtl">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md border-b border-[#D4AF37]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">قائمة المنتسبين وإدارة الحسابات</h2>
              <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black border border-[#D4AF37]/30">
                لوحة التحكم الإدارية
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isMainAdmin ? 'المدير العام (صلاحيات سيادية كاملة)' : 'أدمن فرعي (إدارة حسابات المنتسبين)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewMemberModalOpen(true)}
          className="px-3 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c59f2a] text-[#1B2A4A] font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#D4AF37]/20 active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">إضافة منتسب جديد</span>
          <span className="sm:hidden">إضافة</span>
        </button>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Branch Selector Bar */}
        <BranchSelectorBar />

        {/* Toast Feedback */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-md ${
              statusMessage.type === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-[#152033] border border-slate-200/70 dark:border-slate-800 text-center shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold block">إجمالي المسجلين</span>
            <span className="text-base font-black text-[#1B2A4A] dark:text-white mt-0.5 block">{stats.total}</span>
            <span className="text-[9px] text-slate-500">حساب بالمركز</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white dark:bg-[#152033] border border-slate-200/70 dark:border-slate-800 text-center shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold block">الحسابات النشطة</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{stats.activeCount}</span>
            <span className="text-[9px] text-emerald-600 font-bold">مفعل ومصرح</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white dark:bg-[#152033] border border-slate-200/70 dark:border-slate-800 text-center shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold block">المعلّقة / موقوفة</span>
            <span className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 block">{stats.suspendedCount}</span>
            <span className="text-[9px] text-rose-500 font-bold">محظور الدخول</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white dark:bg-[#152033] border border-slate-200/70 dark:border-slate-800 text-center shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold block">المدراء</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5 block">{stats.mainAdmins + stats.subAdmins}</span>
            <span className="text-[9px] text-slate-500">عام وفرعي</span>
          </div>
        </div>

        {/* Role Restrictions Notification Box */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>محددات الصلاحيات والهيكلية الأمنية:</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
            {isMainAdmin
              ? 'بصفتك المدير العام: تمتلك الصلاحية السيادية الكاملة لإنشاء، وتعديل، وتعليق، وتفعيل، أو حذف أي حساب بالمركز.'
              : 'بصفتك أدمناً فرعياً: يحق لك إدارة وتعديل وتعليق وحذف حسابات المنتسبين الاعتياديين، بينما يمنع المساس بحساب المدير العام أو أدمن فرعي آخر.'}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-[#152033] rounded-2xl p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم الكامل، رقم البطاقة، الموبايل..."
              className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-[#1B2A4A] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1B2A4A] dark:focus:ring-[#D4AF37]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filters Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-[#1B2A4A] text-white dark:bg-[#D4AF37] dark:text-[#1B2A4A]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              الكل ({usersList.length})
            </button>
            <button
              onClick={() => setRoleFilter('staff')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                roleFilter === 'staff'
                  ? 'bg-[#1B2A4A] text-white dark:bg-[#D4AF37] dark:text-[#1B2A4A]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              المنتسبون ({stats.regularStaff})
            </button>
            <button
              onClick={() => setRoleFilter('sub_admin')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                roleFilter === 'sub_admin'
                  ? 'bg-[#1B2A4A] text-white dark:bg-[#D4AF37] dark:text-[#1B2A4A]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              المدراء الفرعيون ({stats.subAdmins})
            </button>
            <button
              onClick={() => setRoleFilter('main_admin')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                roleFilter === 'main_admin'
                  ? 'bg-[#1B2A4A] text-white dark:bg-[#D4AF37] dark:text-[#1B2A4A]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              المدير العام ({stats.mainAdmins})
            </button>
          </div>

          {/* Status Filter Pills (نشط / معلق) */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="shrink-0 text-slate-400 font-semibold">حالة الحساب:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1B2A4A] text-white dark:bg-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
              }`}
            >
              الكل ({usersList.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              نشط ({stats.activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                statusFilter === 'suspended'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}
            >
              <UserX className="w-3 h-3" />
              معلّق / موقوف ({stats.suspendedCount})
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="shrink-0 text-slate-400 font-semibold flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              الصفة:
            </span>
            {['all', 'إداري', 'منسق', 'مروج', 'مشرف ثقافي', 'أمين مكتبة', 'باحث'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded-md shrink-0 transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#2E8B57] text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'جميع الصفات' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Members Directory List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">
              قائمة الحسابات المسجلة ({filteredUsers.length})
            </h3>
            <button
              onClick={refreshList}
              className="text-[11px] text-[#2E8B57] dark:text-teal-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              تحديث القائمة
            </button>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد حسابات مطابقة للبحث</p>
              <p className="text-[10px] text-slate-400">جرّب تغيير كلمات البحث أو إعادة ضبط المرشحات</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isMainAdminTarget = user.role === 'main_admin';
              const isSubAdminViewer = isSubAdmin && !isMainAdmin;
              // A sub-admin cannot edit or reset credentials of the Main Admin or another Sub-Admin
              const isActionBlocked = isSubAdminViewer && (isMainAdminTarget || user.role === 'sub_admin');
              const isPasswordRevealed = revealedPasswords[user.id];
              const effectivePassword = user.password || user.pinCode || '123456';

              // Hierarchy permissions for Suspend and Delete:
              // Sub-Admins can manage normal staff, but CANNOT delete, suspend, or modify the credentials/role of the Main Admin or fellow Sub-Admins
              const canSuspend = isMainAdmin ? !isMainAdminTarget : (isSubAdmin && user.role === 'staff');
              const canDelete = isMainAdmin ? !isMainAdminTarget : (isSubAdmin && user.role === 'staff');
              const isSuspended = user.status === 'suspended';

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-3xl bg-white dark:bg-[#152033] border transition-all duration-200 shadow-xs hover:shadow-md ${
                    isMainAdminTarget
                      ? 'border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20 bg-gradient-to-br from-white via-white to-amber-50/20 dark:from-[#152033] dark:via-[#152033] dark:to-[#1a2318]'
                      : isSuspended
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  {/* Card Top: Avatar, Name, Designation & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 ring-2 ring-slate-100 dark:ring-slate-700">
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-[#1B2A4A] dark:text-white">
                            {user.fullName}
                          </h4>
                          {isMainAdminTarget && (
                            <Shield className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {user.designation}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {/* Role Badge */}
                          {user.role === 'main_admin' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                              المدير العام
                            </span>
                          ) : user.role === 'sub_admin' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                              أدمن فرعي
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2E8B57]/20 text-[#2E8B57] dark:text-teal-300 border border-[#2E8B57]/30">
                              منتسب
                            </span>
                          )}

                          {/* Staff Category Badge */}
                          {user.staffCategory && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              الصفة: {user.staffCategory}
                            </span>
                          )}

                          {/* Branch Badge */}
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-black text-white"
                            style={{
                              backgroundColor: user.branchId === 'najaf' ? '#2E8B57' : '#1B2A4A',
                            }}
                          >
                            {user.branchId === 'najaf' ? 'فرع النجف' : 'فرع البصرة'}
                          </span>

                          {/* Account Status Badge */}
                          {isSuspended ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                              <UserX className="w-3 h-3" />
                              معلّق / موقوف
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              نشط
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sovereign Protection Badge for Main Admin or Sub-Admin when viewed by Sub-Admin */}
                    {isActionBlocked ? (
                      <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black border border-red-500/20 shrink-0 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        محمي بالهيكلية
                      </span>
                    ) : null}
                  </div>

                  {/* Suspend / Block Member Toggle Switch Card */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSuspended
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                        }`}
                      >
                        {isSuspended ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#1B2A4A] dark:text-white">
                            حالة الحساب:
                          </span>
                          <span
                            className={`text-xs font-black ${
                              isSuspended
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isSuspended ? 'معلّق / موقوف مؤقتاً' : 'نشط ومصرح بالدخول'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isSuspended
                            ? 'يمنع تسجيل الدخول، مع الحفاظ التام على سجلات الحضور والإنذارات والأرشيف'
                            : 'الحساب فعال ويتمكن المنتسب من تسجيل الدخول وإجراء كافة العمليات'}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Toggle Switch */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div dir="ltr" className="inline-flex items-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!isSuspended}
                          disabled={!canSuspend}
                          onClick={() => handleToggleSuspend(user)}
                          title={
                            !canSuspend
                              ? 'لا تملك صلاحية تعليق هذا الحساب وفق الهيكلية الإدارية'
                              : isSuspended
                              ? 'إلغاء التعليق وتفعيل الحساب'
                              : 'تعليق حساب المنتسب ومنع تسجيل الدخول'
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
                            !isSuspended ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              !isSuspended ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Credentials Detailed Grid */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* National ID */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                        رقم البطاقة الوطنية:
                      </span>
                      <span className="font-mono font-bold text-[#1B2A4A] dark:text-white" dir="ltr">
                        {user.nationalId}
                      </span>
                    </div>

                    {/* Phone Number */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#2E8B57]" />
                        رقم الموبايل:
                      </span>
                      <a
                        href={`tel:${user.phoneNumber}`}
                        className="font-mono font-bold text-[#1B2A4A] dark:text-white hover:text-[#2E8B57] transition-colors"
                        dir="ltr"
                      >
                        {user.phoneNumber}
                      </a>
                    </div>

                    {/* Secret Code / Password */}
                    <div className="sm:col-span-2 flex items-center justify-between p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                          الرمز السري / كلمة المرور:
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-[#1B2A4A] dark:text-amber-300" dir="ltr">
                          {isPasswordRevealed ? effectivePassword : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRevealPassword(user.id)}
                          className="p-1 rounded-md hover:bg-amber-200/50 dark:hover:bg-amber-800/50 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                          title={isPasswordRevealed ? 'إخفاء الرمز' : 'إظهار الرمز'}
                        >
                          {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions Toolbar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    {isActionBlocked ? (
                      <div className="w-full text-center py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-semibold">
                        حساب محمي سيادياً وفق الهيكلية - لا يمكن للأدمن الفرعي تعديل بياناته أو حذفه أو تعليقه
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Full Edit Profile Credentials Button */}
                          <button
                            onClick={() => setEditingMember(user)}
                            className="px-3 py-1.5 rounded-xl bg-[#1B2A4A]/10 dark:bg-slate-800 text-[#1B2A4A] dark:text-white hover:bg-[#1B2A4A]/20 text-xs font-bold transition-all flex items-center gap-1.5 border border-[#1B2A4A]/10 dark:border-slate-700 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>تعديل البيانات الكاملة</span>
                          </button>

                          {/* Quick Password Reset Override Button */}
                          <button
                            onClick={() => {
                              setResettingPasswordUser(user);
                              setNewPasswordInput('');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all border border-amber-500/20 flex items-center gap-1 cursor-pointer"
                            title="إعادة تعيين الرمز السري مباشرة"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-500" />
                            <span>ضبط الرمز السري</span>
                          </button>
                        </div>

                        {/* Delete Action (Protected by Hierarchy) */}
                        {canDelete && (
                          <button
                            onClick={() => setDeletingMember(user)}
                            className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="حذف هذا الحساب نهائياً من المركز"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= MODAL: EDIT MEMBER CREDENTIALS ================= */}
      {editingMember && (
        <EditMemberModal
          isOpen={!!editingMember}
          member={editingMember}
          isMainAdmin={isMainAdmin}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveMemberEdit}
        />
      )}

      {/* ================= MODAL: QUICK RESET PASSWORD OVERRIDE ================= */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#152033] shadow-2xl p-6 border border-slate-200 dark:border-slate-800 text-right space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1B2A4A] dark:text-white">إعادة تعيين الرمز السري</h3>
                  <p className="text-[10px] text-slate-400">{resettingPasswordUser.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setResettingPasswordUser(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              يحق للإدارة تعيين أو تغيير الرمز السري للمنتسب بشكل فوري ليتمكن من تسجيل الدخول به مباشرة.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#1B2A4A] dark:text-slate-200 mb-1.5">
                الرمز السري الجديد (Password):
              </label>
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="أدخل 4 خانات على الأقل (مثال: 123456)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setNewPasswordInput('123456')}
                  className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  تعيين الافتراضي (123456)
                </button>
                <button
                  type="button"
                  onClick={() => setNewPasswordInput(resettingPasswordUser.nationalId.slice(-4))}
                  className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  آخر 4 أرقام من الهوية
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmPasswordReset}
                className="flex-1 py-2.5 rounded-xl bg-[#1B2A4A] dark:bg-[#D4AF37] text-white dark:text-[#1B2A4A] font-black text-xs shadow-md cursor-pointer"
              >
                تأكيد وتحديث الرمز
              </button>
              <button
                onClick={() => setResettingPasswordUser(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE NEW MEMBER ================= */}
      {isNewMemberModalOpen && (
        <CreateMemberModal
          isOpen={isNewMemberModalOpen}
          isMainAdmin={isMainAdmin}
          defaultBranch={effectiveBranch}
          onClose={() => setIsNewMemberModalOpen(false)}
          onCreate={handleCreateMember}
        />
      )}

      {/* ================= MODAL: CONFIRM DELETION (Hierarchy Enforced) ================= */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#152033] shadow-2xl p-6 border border-red-200 dark:border-red-900/60 text-right space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-[#1B2A4A] dark:text-white">تأكيد حذف الحساب نهائياً</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                هل أنت متأكد من رغبتك في حذف حساب المنتسب ({deletingMember.fullName})؟
              </p>
            </div>

            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 text-[11px] text-red-800 dark:text-red-300">
              تنبيه: هذا الإجراء سيقوم بإلغاء حساب الدخول وإزالته من منظومة الحسابات المعتمدة في المركز.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                نعم، احذف الحساب
              </button>
              <button
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= SUB-COMPONENT: EDIT MEMBER CREDENTIALS MODAL =================
interface EditMemberModalProps {
  isOpen: boolean;
  member: User;
  isMainAdmin: boolean;
  onClose: () => void;
  onSave: (updatedData: User) => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  member,
  isMainAdmin,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState(member.fullName);
  const [phoneNumber, setPhoneNumber] = useState(member.phoneNumber);
  const [nationalId, setNationalId] = useState(member.nationalId);
  const [password, setPassword] = useState(member.password || member.pinCode || '123456');
  const [designation, setDesignation] = useState(member.designation);
  const [staffCategory, setStaffCategory] = useState<StaffCategory>(member.staffCategory || 'إداري');
  const [role, setRole] = useState<UserRole>(member.role);
  const [status, setStatus] = useState<'active' | 'suspended'>(member.status || 'active');
  const [showPassword, setShowPassword] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...member,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      nationalId: nationalId.trim(),
      password: password.trim(),
      pinCode: password.trim().length <= 6 ? password.trim() : password.trim().slice(0, 4),
      designation: designation.trim(),
      staffCategory,
      role: isMainAdmin ? role : member.role,
      status,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#152033] shadow-2xl border border-slate-200 dark:border-slate-800 text-right">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#1B2A4A] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">تعديل بيانات واعتمادات المنتسب</h3>
              <p className="text-[10px] text-slate-300">{member.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              الاسم الكامل (الرباعي واللقب):
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white"
            />
          </div>

          {/* National ID */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              رقم البطاقة الوطنية الموحدة:
            </label>
            <div className="relative">
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-[#1B2A4A] dark:text-white"
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              رقم البطاقة هو هوية تسجيل الدخول الأساسية للمنتسب في المنظومة
            </span>
          </div>

          {/* Mobile Phone Number */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              رقم الموبايل / الهاتف:
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                dir="ltr"
                className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-[#1B2A4A] dark:text-white text-right"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          {/* Account Password / Secret Code */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[#1B2A4A] dark:text-slate-200">
                الرمز السري / كلمة المرور (Secret Code):
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[#2E8B57] dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPassword ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-[#1B2A4A] dark:text-white"
              />
              <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
              يمتلك الأدمن صلاحية تجاوز وإعادة تعيين الرمز السري للمنتسب مباشرة
            </span>
          </div>

          {/* Staff Category (الصفة) */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              الصفة الوظيفية المعتمدة (الصفة):
            </label>
            <select
              value={staffCategory}
              onChange={(e) => setStaffCategory(e.target.value as StaffCategory)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white font-semibold"
            >
              <option value="إداري">إداري (شعبة الإدارة والشؤون المالية)</option>
              <option value="منسق">منسق (تنسيق الندوات والبرامج الفكرية)</option>
              <option value="مروج">مروج (الإعلام والنشر والتواصل الرقمي)</option>
              <option value="مشرف ثقافي">مشرف ثقافي</option>
              <option value="أمين مكتبة">أمين مكتبة وتوثيق</option>
              <option value="باحث">باحث وكاتب مقالات</option>
            </select>
          </div>

          {/* Designation (المسمى الوظيفي) */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              المسمى الوظيفي التفصيلي:
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="مثال: منسق الأنشطة الفكرية والندوات"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white"
            />
          </div>

          {/* Account Status Control */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              حالة الحساب (نشط / معلّق):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  status === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>حساب نشط</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('suspended')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  status === 'suspended'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>معلّق / موقوف</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              تعليق الحساب يمنع الدخول مع الحفاظ على كافة السجلات والأرشيف التاريخي
            </span>
          </div>

          {/* Role (Editable exclusively by Main Admin) */}
          {isMainAdmin && member.role !== 'main_admin' && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-[#1B2A4A] dark:text-white block">
                مستوى الصلاحيات في النظام (للمدير العام فقط):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('staff')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    role === 'staff'
                      ? 'bg-[#2E8B57] text-white border-[#2E8B57]'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  منتسب اعتيادي
                </button>
                <button
                  type="button"
                  onClick={() => setRole('sub_admin')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    role === 'sub_admin'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  أدمن فرعي (معاون)
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#1B2A4A] hover:bg-[#233761] dark:bg-[#D4AF37] dark:hover:bg-[#c49e29] text-white dark:text-[#1B2A4A] font-black text-xs shadow-md transition-all cursor-pointer"
            >
              حفظ التعديلات وتحديث الحساب
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= SUB-COMPONENT: CREATE NEW MEMBER MODAL =================
interface CreateMemberModalProps {
  isOpen: boolean;
  isMainAdmin: boolean;
  defaultBranch?: BranchId;
  onClose: () => void;
  onCreate: (data: Omit<User, 'id' | 'createdAt'>) => void;
}

const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  isOpen,
  isMainAdmin,
  defaultBranch = 'basra',
  onClose,
  onCreate,
}) => {
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('123456');
  const [designation, setDesignation] = useState('');
  const [staffCategory, setStaffCategory] = useState<StaffCategory>('إداري');
  const [role, setRole] = useState<UserRole>('staff');
  const [branchId, setBranchId] = useState<BranchId>(defaultBranch);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      fullName: fullName.trim(),
      nationalId: nationalId.trim(),
      phoneNumber: phoneNumber.trim(),
      password: password.trim() || '123456',
      pinCode: password.trim().length <= 6 ? password.trim() : password.trim().slice(0, 4),
      designation: designation.trim() || 'منتسب بالمركز',
      staffCategory,
      branchId: isMainAdmin ? branchId : defaultBranch,
      role: isMainAdmin ? role : 'staff',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      biometricEnabled: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#152033] shadow-2xl border border-slate-200 dark:border-slate-800 text-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1B2A4A] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">إضافة وتسجيل منتسب جديد</h3>
              <p className="text-[10px] text-slate-300">مركز الفضيل بن يسار البصري الثقافي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              الاسم الكامل للمنتسب:
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: أ. أحمد سالم الحلفي"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white"
            />
          </div>

          {/* National ID */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              رقم البطاقة الوطنية الموحدة:
            </label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="مثال: 199510203040"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-[#1B2A4A] dark:text-white"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              رقم الهاتف / الموبايل:
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="07800000000"
              required
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-[#1B2A4A] dark:text-white text-right"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              الرمز السري المبدئي (Password):
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-[#1B2A4A] dark:text-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              الافتراضي المقترح: 123456 (يمكن للمنتسب أو الإدارة تغييره لاحقاً)
            </span>
          </div>

          {/* Staff Category */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              الصفة:
            </label>
            <select
              value={staffCategory}
              onChange={(e) => setStaffCategory(e.target.value as StaffCategory)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white font-semibold"
            >
              <option value="إداري">إداري</option>
              <option value="منسق">منسق</option>
              <option value="مروج">مروج</option>
              <option value="مشرف ثقافي">مشرف ثقافي</option>
              <option value="أمين مكتبة">أمين مكتبة</option>
              <option value="باحث">باحث</option>
            </select>
          </div>

          {/* Designation */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              المسمى الوظيفي:
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="مثال: منسق وحدة البحوث والندوات"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white"
            />
          </div>

          {/* Branch Allocation */}
          <div>
            <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
              الفرع التابع له المنتسب (نظام الفروع المستقلة):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!isMainAdmin}
                onClick={() => setBranchId('basra')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  branchId === 'basra'
                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                } ${!isMainAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>فرع البصرة</span>
              </button>
              <button
                type="button"
                disabled={!isMainAdmin}
                onClick={() => setBranchId('najaf')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  branchId === 'najaf'
                    ? 'bg-[#2E8B57] text-white border-[#2E8B57] shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                } ${!isMainAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>فرع النجف</span>
              </button>
            </div>
            {!isMainAdmin && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                يتم تعيين الفرع تلقائياً وفق الفرع التابع للأدمن الفرعي
              </span>
            )}
          </div>

          {/* Role (if main admin) */}
          {isMainAdmin && (
            <div>
              <label className="block font-bold text-[#1B2A4A] dark:text-slate-200 mb-1">
                الرتبة في النظام:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white font-semibold"
              >
                <option value="staff">منتسب اعتيادي (Staff)</option>
                <option value="sub_admin">أدمن فرعي / معاون إداري (Sub-Admin)</option>
              </select>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#2E8B57] hover:bg-[#267549] text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              إنشاء وحفظ الحساب
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
