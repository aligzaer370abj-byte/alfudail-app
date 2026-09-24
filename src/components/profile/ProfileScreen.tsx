import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { User, UserRole } from '../../types';
import {
  UserCheck,
  Shield,
  Phone,
  CreditCard,
  Briefcase,
  LogOut,
  Fingerprint,
  ChevronLeft,
  Users,
  Award,
  Check,
  AlertTriangle,
  ArrowRight,
  Key,
  Eye,
  EyeOff,
  UserCog,
  Lock,
} from 'lucide-react';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToDirectory?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onNavigateToDirectory }) => {
  const {
    currentUser,
    isMainAdmin,
    isSubAdmin,
    canManageStaff,
    logout,
    toggleBiometrics,
    changeUserRole,
    updateCurrentUser,
    updateSelfPassword,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'hierarchy'>('details');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Editing state for phone / designation
  const [isEditing, setIsEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState(currentUser?.phoneNumber || '');
  const [designationInput, setDesignationInput] = useState(currentUser?.designation || '');

  // Password change state (Self-Service)
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  if (!currentUser) return null;

  const allUsers = storageService.getUsers();

  const handleSelfPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setStatusMessage({ text: 'يرجى إدخال كلمة المرور الحالية', type: 'error' });
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setStatusMessage({ text: 'يجب ألا تقل كلمة المرور الجديدة عن 4 خانات', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: 'كلمة المرور الجديدة غير متطابقة مع التأكيد', type: 'error' });
      return;
    }

    const res = updateSelfPassword(currentPassword, newPassword);
    if (res.success) {
      setStatusMessage({ text: res.message, type: 'success' });
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatusMessage({ text: res.message, type: 'error' });
    }
  };

  const handleRoleChange = (targetUser: User, newRole: UserRole) => {
    if (!isMainAdmin) {
      setStatusMessage({
        text: 'غير مصرح: لا يمكن للأدمن الفرعي تعديل بيانات أو صلاحيات المدير الرئيسي أو تغيير الرتب نهائياً',
        type: 'error',
      });
      return;
    }

    const res = changeUserRole(targetUser.id, newRole);
    if (res.success) {
      setStatusMessage({ text: res.message, type: 'success' });
    } else {
      setStatusMessage({ text: res.message, type: 'error' });
    }
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      phoneNumber: phoneInput,
      designation: designationInput,
    };
    const res = updateCurrentUser(updated);
    if (res.success) {
      setStatusMessage({ text: 'تم تحديث بيانات الملف الشخصي بنجاح', type: 'success' });
      setIsEditing(false);
    } else {
      setStatusMessage({ text: res.message, type: 'error' });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'main_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 shadow-xs">
            <Shield className="w-3.5 h-3.5 fill-[#D4AF37]" />
            المدير الرئيسي (Super Admin)
          </span>
        );
      case 'sub_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Award className="w-3.5 h-3.5" />
            أدمن فرعي (Sub-Admin)
          </span>
        );
      case 'staff':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#2E8B57]/20 text-[#2E8B57] dark:text-teal-300 border border-[#2E8B57]/30">
            <UserCheck className="w-3.5 h-3.5" />
            منتسب بالمركز
          </span>
        );
    }
  };

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-10" dir="rtl">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-base font-bold">الملف الشخصي وإدارة الصلاحيات</h2>
            <p className="text-[11px] text-slate-300">مركز الفضيل بن يسار البصري</p>
          </div>
        </div>

        <span className="text-xs text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-white/10">
          حساب موثق
        </span>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-5">
        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-[#152033] rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-20 bg-gradient-to-l from-[#1B2A4A] to-[#2a3e6c]"></div>

          <div className="relative pt-6 flex flex-col items-center">
            {/* Avatar Photo */}
            <div className="relative w-24 h-24 rounded-full ring-4 ring-white dark:ring-[#152033] shadow-xl overflow-hidden bg-slate-200">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <h3 className="mt-3 text-lg font-black text-[#1B2A4A] dark:text-white">
              {currentUser.fullName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentUser.designation} {currentUser.staffCategory ? `(${currentUser.staffCategory})` : ''}
            </p>

            <div className="mt-2.5">{getRoleBadge(currentUser.role)}</div>
          </div>

          {/* Tab buttons */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mt-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 pb-3 text-center transition-all ${
                activeTab === 'details'
                  ? 'border-b-2 border-[#1B2A4A] dark:border-[#D4AF37] text-[#1B2A4A] dark:text-[#D4AF37]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              البيانات والمحددات
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex-1 pb-3 text-center transition-all flex items-center justify-center gap-1 ${
                activeTab === 'hierarchy'
                  ? 'border-b-2 border-[#1B2A4A] dark:border-[#D4AF37] text-[#1B2A4A] dark:text-[#D4AF37]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>هيكلية الصلاحيات {isMainAdmin ? '(إدارة الرتب)' : ''}</span>
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="mt-5 space-y-3.5 text-right">
              {/* National ID */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F7FA] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-semibold">رقم البطاقة الوطنية:</span>
                </div>
                <span className="font-mono font-bold text-[#1B2A4A] dark:text-white" dir="ltr">
                  {currentUser.nationalId.slice(0, 4)}••••{currentUser.nationalId.slice(-4)}
                </span>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F7FA] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-[#2E8B57]" />
                  <span className="font-semibold">رقم الهاتف الشخصي:</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    dir="ltr"
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                ) : (
                  <span className="font-mono font-bold text-[#1B2A4A] dark:text-white" dir="ltr">
                    {currentUser.phoneNumber}
                  </span>
                )}
              </div>

              {/* Designation */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F7FA] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <Briefcase className="w-4 h-4 text-[#1B2A4A] dark:text-slate-300" />
                  <span className="font-semibold">المسمى الوظيفي:</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={designationInput}
                    onChange={(e) => setDesignationInput(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                ) : (
                  <span className="font-bold text-[#1B2A4A] dark:text-white">{currentUser.designation}</span>
                )}
              </div>

              {/* Biometrics Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F7FA] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <Fingerprint className="w-4 h-4 text-[#D4AF37]" />
                  <div>
                    <span className="font-semibold block">تسجيل الدخول بالبصمة الحيوية</span>
                    <span className="text-[10px] text-slate-400">تفعيل التحقق التلقائي للجلسات القادمة</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBiometrics(!currentUser.biometricEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    currentUser.biometricEnabled ? 'bg-[#2E8B57]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentUser.biometricEnabled ? '-translate-x-6' : '-translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Self-Service Password Update Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1B2A4A] dark:text-white">
                    <Key className="w-4 h-4 text-[#D4AF37]" />
                    <span>تغيير الرمز السري / كلمة المرور</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="text-xs text-[#2E8B57] dark:text-teal-400 font-bold hover:underline"
                  >
                    {isChangingPassword ? 'إلغاء' : 'تغيير الرمز'}
                  </button>
                </div>

                {isChangingPassword ? (
                  <form onSubmit={handleSelfPasswordChange} className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        كلمة المرور الحالية:
                      </label>
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="أدخل الرمز الحالي"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        كلمة المرور الجديدة:
                      </label>
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="4 خانات على الأقل"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        تأكيد كلمة المرور الجديدة:
                      </label>
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="أعد إدخال الرمز الجديد"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1 font-semibold"
                      >
                        {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPasswordText ? 'إخفاء الحروف' : 'إظهار الحروف'}</span>
                      </button>

                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#1B2A4A] dark:bg-[#D4AF37] text-white dark:text-[#1B2A4A] font-black text-xs shadow-xs hover:bg-[#22355e]"
                      >
                        حفظ الرمز الجديد
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    يحق للمنتسب تحديث رمزه السري بأي وقت، مع إمكانية تجاوزه وإعادة ضبطه من قبل الإدارة.
                  </p>
                )}
              </div>

              {/* Admin Directory Direct Access Shortcut (For Admins Only) */}
              {canManageStaff && onNavigateToDirectory && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-l from-[#1B2A4A]/10 via-[#D4AF37]/10 to-[#2E8B57]/10 border border-[#D4AF37]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-[#D4AF37]" />
                    <div>
                      <span className="text-xs font-bold text-[#1B2A4A] dark:text-white block">
                        إدارة حسابات المنتسبين
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        تعديل بيانات الكادر وإعادة تعيين الرموز
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onNavigateToDirectory}
                    className="px-3 py-1.5 rounded-xl bg-[#1B2A4A] dark:bg-[#D4AF37] text-white dark:text-[#1B2A4A] text-xs font-black shadow-xs hover:bg-[#22355e]"
                  >
                    فتح الدليل
                  </button>
                </div>
              )}

              {/* Edit Buttons */}
              <div className="pt-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 py-2 rounded-xl bg-[#2E8B57] text-white text-xs font-bold hover:bg-[#257347]"
                    >
                      حفظ التعديلات
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    تعديل بيانات التواصل
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Staff & Roles Hierarchy Tab */
            <div className="mt-5 space-y-3 text-right">
              {/* Admin Directory Direct Button in Hierarchy */}
              {canManageStaff && onNavigateToDirectory && (
                <button
                  onClick={onNavigateToDirectory}
                  className="w-full p-3 rounded-2xl bg-[#1B2A4A] dark:bg-[#D4AF37] text-white dark:text-[#1B2A4A] text-xs font-black shadow-md flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#D4AF37] dark:text-[#1B2A4A]" />
                    <span>فتح قائمة المنتسبين وإدارة الحسابات الكاملة</span>
                  </div>
                  <span className="text-[10px] bg-white/20 dark:bg-black/10 px-2 py-0.5 rounded-md">
                    إدارة شاملة ←
                  </span>
                </button>
              )}

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-1">قاعدة التحكم في الصلاحيات والهيكلية:</span>
                المدير العام يمتلك حصراً الصلاحية السيادية لتعديل أو ترقية أو حذف أي حساب. لا يحق للأدمن الفرعي المساس بحساب المدير العام أو تعديل رمزه السري.
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allUsers.map((user) => {
                  const isMainDirectorTarget = user.role === 'main_admin';
                  return (
                    <div
                      key={user.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                        />
                        <div>
                          <h4 className="font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1">
                            {user.fullName}
                            {isMainDirectorTarget && (
                              <Shield className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {user.designation} • {user.role === 'main_admin' ? 'المدير العام' : user.role === 'sub_admin' ? 'أدمن فرعي' : 'منتسب'}
                          </p>
                        </div>
                      </div>

                      {/* Role control actions */}
                      <div>
                        {isMainDirectorTarget ? (
                          <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-[#D4AF37] text-[10px] font-black border border-[#D4AF37]/30">
                            محمي سيادياً
                          </span>
                        ) : isMainAdmin ? (
                          user.role === 'sub_admin' ? (
                            <button
                              onClick={() => handleRoleChange(user, 'staff')}
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold border border-red-500/20 transition-colors"
                            >
                              سحب صلاحية الأدمن
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(user, 'sub_admin')}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20 transition-colors"
                            >
                              ترقية إلى أدمن فرعي
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400">للمدير العام فقط</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SPECIFICATION MANDATE: Logout Button Located ONLY inside the Profile Screen */}
        <div className="pt-2">
          <div className="p-4 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 text-center space-y-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تسجيل الخروج متاح حصرياً من شاشة الملف الشخصي لضمان بقاء الجلسة آمنة ومستمرة.
            </p>
            <button
              type="button"
              onClick={logout}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-black text-sm shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج من الحساب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
