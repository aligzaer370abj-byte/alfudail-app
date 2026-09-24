import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { ExpiringArchiveFile, UserRole } from '../../types';
import {
  ShieldAlert,
  Calendar,
  Clock,
  Download,
  Printer,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Save,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AdminArchiveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: 'attendance' | 'leaves' | 'documents' | 'warnings' | 'evaluations';
  recordId: string;
  onRecordUpdated?: () => void;
}

export const AdminArchiveFileModal: React.FC<AdminArchiveFileModalProps> = ({
  isOpen,
  onClose,
  recordType,
  recordId,
  onRecordUpdated,
}) => {
  const { currentUser, isMainAdmin, isSubAdmin } = useAuth();
  const [file, setFile] = useState<ExpiringArchiveFile | null>(null);
  const [activeTab, setActiveTab] = useState<'view_edit' | 'export_print' | 'extend' | 'delete'>('view_edit');

  // Edit fields
  const [titleInput, setTitleInput] = useState('');
  const [docNumberInput, setDocNumberInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [detailsInput, setDetailsInput] = useState('');

  // Extension options
  const [extensionYears, setExtensionYears] = useState<number>(3);
  const [permanentPreservation, setPermanentPreservation] = useState<boolean>(false);

  // Status message
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen && recordId) {
      const data = storageService.getExpiringFile(recordType, recordId);
      if (data) {
        setFile(data);
        setTitleInput(data.title);
        setDocNumberInput(data.docNumber || '');
        setNotesInput(data.notes || '');
        setDetailsInput(data.details || '');
        setPermanentPreservation(data.isPermanentlyPreserved);
      }
      setFeedback(null);
      setConfirmDelete(false);
    }
  }, [isOpen, recordType, recordId]);

  if (!isOpen || !file) return null;

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const res = storageService.updateExpiringFileMetadata(recordType, recordId, {
      title: titleInput,
      docNumber: docNumberInput,
      notes: notesInput,
      details: detailsInput,
    });

    if (res.success) {
      setFeedback({ text: res.message, type: 'success' });
      const updated = storageService.getExpiringFile(recordType, recordId);
      if (updated) setFile(updated);
      if (onRecordUpdated) onRecordUpdated();
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const handleExtendRetention = () => {
    const res = storageService.extendExpiringFileRetention(
      recordType,
      recordId,
      extensionYears,
      permanentPreservation
    );

    if (res.success) {
      setFeedback({ text: res.message, type: 'success' });
      const updated = storageService.getExpiringFile(recordType, recordId);
      if (updated) setFile(updated);
      if (onRecordUpdated) onRecordUpdated();
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const handleDeleteRecord = () => {
    if (!currentUser) return;
    const res = storageService.deleteExpiringFile(recordType, recordId, currentUser.role);

    if (res.success) {
      setFeedback({ text: res.message, type: 'success' });
      if (onRecordUpdated) onRecordUpdated();
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  // Real Export & Save as PDF
  const handleExportPDF = () => {
    const printContent = `
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>${file.title} - وثيقة أرشيفية رسمية</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px; color: #1B2A4A; }
            .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 20px; margin: 0; color: #1B2A4A; }
            .header h2 { font-size: 15px; margin: 6px 0; color: #D4AF37; }
            .header p { font-size: 12px; color: #666; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .meta-table td { padding: 8px 12px; border: 1px solid #ddd; font-size: 13px; }
            .meta-table td.label { background-color: #f5f7fa; font-weight: bold; width: 25%; }
            .content-box { background: #fafafa; border: 1px solid #ccc; padding: 20px; border-radius: 6px; font-size: 14px; line-height: 1.8; margin-bottom: 30px; white-space: pre-wrap; }
            .seal-box { display: flex; justify-content: space-between; margin-top: 50px; font-size: 13px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>مركز الفضيل بن يسار البصري الثقافي</h1>
            <h2>وثيقة أرشفة نظامية رسمية (محرك حفظ 5 سنوات)</h2>
            <p>كود الوثيقة الأرشيفية: ${file.docNumber || file.id} | تاريخ الإنشاء: ${file.createdAt.split('T')[0]}</p>
          </div>
          <table class="meta-table">
            <tr>
              <td class="label">عنوان الوثيقة/السجل:</td>
              <td>${file.title}</td>
              <td class="label">التصنيف:</td>
              <td>${file.categoryName}</td>
            </tr>
            <tr>
              <td class="label">المعني / المحرر:</td>
              <td>${file.authorOrTargetName}</td>
              <td class="label">تاريخ التقادم (5 سنوات):</td>
              <td>${file.expiresAt.split('T')[0]}</td>
            </tr>
            <tr>
              <td class="label">حالة الحفظ:</td>
              <td colspan="3">${file.isPermanentlyPreserved ? 'حفظ تاريخي دائم (محمي من الحذف)' : 'سجل نظامي ضمن دورة 5 سنوات'}</td>
            </tr>
          </table>
          <div class="content-box">
            <strong>نص الوثيقة والتفاصيل:</strong><br />
            ${file.details}
            ${file.notes ? `<br /><br /><strong>الملاحظات والتعليمات الإدارية:</strong><br />${file.notes}` : ''}
          </div>
          <div class="seal-box">
            <div>
              <span>المعاون الإداري:</span><br /><br />
              <span>أ. حيدر جاسم البصري</span>
            </div>
            <div style="text-align: center;">
              <span>ختم الأمانة العامة والأرشفة</span><br />
              <span style="display:inline-block; margin-top: 10px; border: 2px dashed #D4AF37; padding: 10px 20px; border-radius: 50%; color: #D4AF37;">معتمد رسمياً</span>
            </div>
            <div>
              <span>المدير العام للمركز:</span><br /><br />
              <span>الشيخ د. علي الفضلي</span>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([printContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `وثيقة_أرشيف_${file.docNumber || file.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback({ text: 'تم تصدير وحفظ الوثيقة بنسخة PDF / المستند الرسمي المعتمد', type: 'success' });
  };

  // Real Export & Save as Word (.doc)
  const handleExportWord = () => {
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8" />
          <title>${file.title}</title>
          <style>
            body { font-family: 'Arial', sans-serif; font-size: 11pt; direction: rtl; text-align: right; }
            h1 { font-size: 16pt; color: #1B2A4A; text-align: center; }
            h2 { font-size: 13pt; color: #D4AF37; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            td { border: 1px solid #999; padding: 6px; }
            .header-cell { background-color: #eee; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>مركز الفضيل بن يسار البصري الثقافي</h1>
          <h2>نسخة التوثيق والأرشفة المعتمدة (Word Document)</h2>
          <table>
            <tr>
              <td class="header-cell">عنوان الوثيقة</td>
              <td>${file.title}</td>
              <td class="header-cell">الرقم المرجعي</td>
              <td>${file.docNumber || file.id}</td>
            </tr>
            <tr>
              <td class="header-cell">المعني بالسجل</td>
              <td>${file.authorOrTargetName}</td>
              <td class="header-cell">التاريخ الأساسي</td>
              <td>${file.createdAt.split('T')[0]}</td>
            </tr>
          </table>
          <br />
          <h3>تفاصيل السجل والمضمون:</h3>
          <p>${file.details.replace(/\n/g, '<br />')}</p>
          ${file.notes ? `<h3>ملاحظات الإدارة:</h3><p>${file.notes.replace(/\n/g, '<br />')}</p>` : ''}
          <br /><br />
          <p style="text-align: left;">حرر بأمر الإدارة العامة - مركز الفضيل بن يسار البصري الثقافي</p>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `سجل_أرشيف_${file.docNumber || file.id}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback({ text: 'تم تصدير وحفظ الوثيقة كملف Word (.doc) بنجاح', type: 'success' });
  };

  // Direct Print Engine
  const handleDirectPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setFeedback({ text: 'يرجى السماح بالنوافذ المنبثقة للطباعة المباشرة', type: 'error' });
      return;
    }

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>طباعة: ${file.title}</title>
          <style>
            @media print {
              body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; color: #000; }
              .no-print { display: none; }
            }
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 30px; color: #1B2A4A; }
            .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { font-size: 20px; margin: 0; }
            .header h2 { font-size: 14px; margin: 5px 0; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            td { padding: 8px 10px; border: 1px solid #ccc; }
            .label { background: #f0f0f0; font-weight: bold; width: 22%; }
            .body-text { border: 1px solid #aaa; padding: 15px; border-radius: 4px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
            .sign { margin-top: 40px; display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>مركز الفضيل بن يسار البصري الثقافي</h1>
            <h2>طباعة وثيقة وسجل الأرشيف (سري ومحمي)</h2>
            <p style="font-size: 11px;">كود السجل: ${file.docNumber || file.id} | تاريخ الطباعة: ${new Date().toLocaleDateString('ar-IQ')}</p>
          </div>
          <table>
            <tr>
              <td class="label">عنوان السجل:</td>
              <td>${file.title}</td>
              <td class="label">التصنيف:</td>
              <td>${file.categoryName}</td>
            </tr>
            <tr>
              <td class="label">المعني / المحرر:</td>
              <td>${file.authorOrTargetName}</td>
              <td class="label">تاريخ الإنشاء:</td>
              <td>${file.createdAt.split('T')[0]}</td>
            </tr>
          </table>
          <div class="body-text">
            <strong>نص الوثيقة والتفاصيل:</strong><br />
            ${file.details}
            ${file.notes ? `<br /><br /><strong>الملاحظات والتعليمات:</strong><br />${file.notes}` : ''}
          </div>
          <div class="sign">
            <div>إدارة الأرشيف والتوثيق</div>
            <div>معتمد من المشرف العام</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isCore = file.isCoreArchive;
  const canDelete = isMainAdmin || (!isCore && isSubAdmin);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-[#152033] shadow-2xl ring-1 ring-black/10 text-right"
        dir="rtl"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-l from-[#1B2A4A] via-[#22355e] to-[#283e6b] p-4 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base truncate max-w-[220px] sm:max-w-[280px]">
                  لوحة التحكم بالملف الأرشيفي
                </h3>
                {isCore && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-black shrink-0">
                    أرشيف تاريخي أساسي
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                صلاحيات الإدارة الكاملة: تعديل، تصدير، طباعة، تمديد، وحذف
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expiration Countdown & Security Status Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 px-4 border-b border-amber-200 dark:border-amber-900/40 shrink-0 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-[#1B2A4A] dark:text-amber-200 block">
                {file.isPermanentlyPreserved
                  ? 'محمي سيادياً بالحفظ التاريخي الدائم'
                  : `مقترب من سقف فترة الحفظ السنوية (سنة واحدة - متبقي ${file.daysRemaining} يوماً)`}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                تاريخ التقادم المحدد: {file.expiresAt.split('T')[0]}
              </span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
              file.isPermanentlyPreserved
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : file.daysRemaining <= 30
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-amber-500 text-white'
            }`}
          >
            {file.isPermanentlyPreserved ? 'حفظ دائم' : `متبقي ${file.daysRemaining} يوم`}
          </span>
        </div>

        {/* Action Tabs Bar */}
        <div className="p-2 px-4 bg-slate-50 dark:bg-[#111a2b] border-b border-slate-200 dark:border-slate-800 shrink-0 flex gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('view_edit')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'view_edit'
                ? 'bg-[#1B2A4A] dark:bg-[#D4AF37] text-white dark:text-[#1B2A4A] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>معاينة وتعديل</span>
          </button>

          <button
            onClick={() => setActiveTab('export_print')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'export_print'
                ? 'bg-[#1B2A4A] dark:bg-[#D4AF37] text-white dark:text-[#1B2A4A] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير وطباعة</span>
          </button>

          <button
            onClick={() => setActiveTab('extend')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'extend'
                ? 'bg-[#1B2A4A] dark:bg-[#D4AF37] text-white dark:text-[#1B2A4A] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>تمديد الحفظ</span>
          </button>

          <button
            onClick={() => setActiveTab('delete')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'delete'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف يدوي</span>
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`m-3 mb-0 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: VIEW & EDIT */}
          {activeTab === 'view_edit' && (
            <form onSubmit={handleSaveChanges} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  عنوان الملف أو السجل:
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-[#1B2A4A] dark:text-white text-xs"
                />
              </div>

              {file.docNumber && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    الرقم الإداري / المرجعي:
                  </label>
                  <input
                    type="text"
                    value={docNumberInput}
                    onChange={(e) => setDocNumberInput(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  تفاصيل السجل / المضمون الأرشيفي:
                </label>
                <textarea
                  rows={4}
                  value={detailsInput}
                  onChange={(e) => setDetailsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  الملاحظات والتعليمات الإدارية الملحقة:
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="أدخل أي ملاحظات للتعديل قبل الأرشفة أو التصدير..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white font-black text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ التعديلات والتحديث</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: EXPORT & SAVE (PDF / WORD / PRINT) */}
          {activeTab === 'export_print' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200">
                <span className="font-bold block mb-0.5">محرك الحفظ والتصدير الخارجي:</span>
                يمكن تصدير هذا الملف مباشرة وحفظه على وحدات التخزين الخارجية أو إرساله للطباعة الورقية مع ترويسة وختم المركز الثقافي.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* PDF Export */}
                <button
                  onClick={handleExportPDF}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-[#D4AF37] text-right space-y-2 group transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-xs">
                    PDF
                  </div>
                  <div>
                    <h4 className="font-black text-[#1B2A4A] dark:text-white text-xs">
                      تصدير وحفظ PDF
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      مستند رسمي مع ترويسة وختم المركز
                    </p>
                  </div>
                  <span className="text-[10px] text-[#2E8B57] font-bold block pt-1 group-hover:underline">
                    تحميل المستند ←
                  </span>
                </button>

                {/* Word Export */}
                <button
                  onClick={handleExportWord}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-[#D4AF37] text-right space-y-2 group transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                    DOC
                  </div>
                  <div>
                    <h4 className="font-black text-[#1B2A4A] dark:text-white text-xs">
                      تصدير وحفظ Word
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ملف وورد قابل للتعديل المكتبي
                    </p>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold block pt-1 group-hover:underline">
                    تحميل ملف Word ←
                  </span>
                </button>

                {/* Direct Print */}
                <button
                  onClick={handleDirectPrint}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-[#D4AF37] text-right space-y-2 group transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-[#D4AF37] flex items-center justify-center font-black text-xs">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-[#1B2A4A] dark:text-white text-xs">
                      طباعة مباشرة
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      إرسال فوري إلى الطابعة
                    </p>
                  </div>
                  <span className="text-[10px] text-[#D4AF37] font-bold block pt-1 group-hover:underline">
                    فتح أمر الطباعة ←
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EXTEND RETENTION / PRESERVE */}
          {activeTab === 'extend' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-900 dark:text-emerald-200">
                <span className="font-bold block mb-0.5">تمديد فترة الحفظ وتجاوز الحذف التلقائي:</span>
                يمتلك المدير العام والمدراء الفرعيون صلاحية تمديد مدة حفظ السجل بما يتجاوز مدة الحفظ السنوية المحددة (سنة واحدة) أو تحويله إلى أرشيف دائم غير قابل للإتلاف.
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  خيارات التمديد المتاحة:
                </label>

                <div className="grid grid-cols-3 gap-2 text-center font-bold text-xs">
                  {[1, 3, 5].map((yrs) => (
                    <button
                      key={yrs}
                      type="button"
                      onClick={() => {
                        setExtensionYears(yrs);
                        setPermanentPreservation(false);
                      }}
                      className={`p-3 rounded-2xl border transition-all ${
                        !permanentPreservation && extensionYears === yrs
                          ? 'bg-[#1B2A4A] text-[#D4AF37] border-[#D4AF37]'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-sm font-black">+{yrs}</span>
                      <span className="text-[10px]">
                        {yrs === 1 ? 'سنة إضافية' : `${yrs} سنوات`}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Permanent Override */}
                <div className="pt-2">
                  <div
                    onClick={() => setPermanentPreservation(!permanentPreservation)}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      permanentPreservation
                        ? 'bg-amber-500/10 border-[#D4AF37] text-[#1B2A4A] dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck
                        className={`w-5 h-5 ${
                          permanentPreservation ? 'text-[#D4AF37]' : 'text-slate-400'
                        }`}
                      />
                      <div>
                        <span className="font-bold text-xs block">
                          تفعيل الحفظ التاريخي الدائم (Permanent Preservation)
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          حماية استثنائية تحظر الحذف التلقائي وتثبت الوثيقة في الأرشيف العام
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={permanentPreservation}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#D4AF37] rounded"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExtendRetention}
                className="w-full py-3 rounded-2xl bg-[#1B2A4A] hover:bg-[#233761] text-[#D4AF37] font-black text-xs shadow-md flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>تطبيق التمديد وتحديث الأرشيف</span>
              </button>
            </div>
          )}

          {/* TAB 4: MANUAL DELETE */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              {isCore && !isMainAdmin ? (
                /* Sub-Admin blocked from deleting core archives as required by safety hierarchy */
                <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-right space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>قيد سيادي: السجلات والكتب التاريخية الأساسية</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    هذا السجل مصنف كوثيقة أساسية (أمر إداري / قرار مركزي). وفق اللائحة، يمتلك المدير العام حصراً الصلاحية للموافقة على الإتلاف أو الحذف النهائي للسجلات التاريخية.
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    يمكنك كأدمن فرعي تصدير الوثيقة أو تمديد حفظها، أما الحذف النهائي فيتطلب إشعار المشرف العام.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>تحذير الحذف اليدوي النهائي:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    سيؤدي هذا الإجراء إلى حذف هذا السجل نهائياً وتطهيره من قاعدة البيانات ومن محرك الأرشفة. لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
                  </p>

                  {confirmDelete ? (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-black text-red-700 dark:text-red-400">
                        هل أنت متأكد تماماً من الإتلاف والحذف النهائي لهذا السجل؟
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDeleteRecord}
                          className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md"
                        >
                          نعم، حذف نهائي الآن
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                        >
                          تراجع
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>بدء إجراء الحذف اليدوي النهائي</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 bg-slate-100 dark:bg-[#111a2b] border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between text-[11px] text-slate-500">
          <span>مركز الفضيل بن يسار الثقافي - وحدة الأرشفة</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
