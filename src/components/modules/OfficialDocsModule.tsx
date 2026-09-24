import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { OfficialDocumentTask, TaskAttachment, BranchId } from '../../types';
import { BranchSelectorBar } from '../common/BranchSelectorBar';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  Database,
  Search,
  Paperclip,
  UploadCloud,
  FileDown,
  Calendar,
  AlertCircle,
  FileCheck,
  Share2,
  Check,
  Send,
  Eye,
  Info,
  Building2,
} from 'lucide-react';

interface OfficialDocsModuleProps {
  onBack: () => void;
}

export const OfficialDocsModule: React.FC<OfficialDocsModuleProps> = ({ onBack }) => {
  const { currentUser, canManageStaff, activeBranch, effectiveBranch, isMainAdmin } = useAuth();
  const [docs, setDocs] = useState<OfficialDocumentTask[]>(() => storageService.getOfficialDocs(activeBranch));
  const [activeFilter, setActiveFilter] = useState<'all' | 'my_tasks' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocDetails, setSelectedDocDetails] = useState<OfficialDocumentTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    setDocs(storageService.getOfficialDocs(activeBranch));
  }, [activeBranch]);

  // Form State for Admin
  const staffMembers = useMemo(() => storageService.getUsers(activeBranch), [activeBranch]);
  const [docNumber, setDocNumber] = useState(`م.ف/أ.إ/2026/${Math.floor(100 + Math.random() * 900)}`);
  const [title, setTitle] = useState('');
  const [docBranchId, setDocBranchId] = useState<BranchId>(effectiveBranch);
  const [type, setType] = useState<OfficialDocumentTask['type']>('تكليف بمهمة');
  const [priority, setPriority] = useState<OfficialDocumentTask['priority']>('هام');
  const [dueDate, setDueDate] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([staffMembers[1]?.id || '']);
  const [content, setContent] = useState('');
  const [instructions, setInstructions] = useState('');

  // Attachment input state
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [attachmentName, setAttachmentName] = useState('');

  if (!currentUser) return null;

  // Add dummy attachment helper
  const handleAddAttachment = () => {
    if (!attachmentName.trim()) return;
    const newAtt: TaskAttachment = {
      id: `att_${Date.now()}`,
      title: attachmentName.trim(),
      fileUrl: '#',
      fileType: attachmentName.endsWith('.pdf') ? 'pdf' : attachmentName.endsWith('.docx') ? 'docx' : 'pdf',
      fileSize: '1.4 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    setAttachments([...attachments, newAtt]);
    setAttachmentName('');
  };

  // Mock File Drag/Drop or Input
  const handleFileUploadSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAtt: TaskAttachment = {
        id: `att_${Date.now()}`,
        title: file.name,
        fileUrl: '#',
        fileType: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.docx') ? 'docx' : 'image',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString().split('T')[0],
      };
      setAttachments([...attachments, newAtt]);
    }
  };

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const assignedUsers = staffMembers.filter((u) => selectedStaffIds.includes(u.id));

    storageService.addOfficialDoc({
      docNumber,
      title: title.trim(),
      type,
      branchId: isMainAdmin ? docBranchId : effectiveBranch,
      issuedBy: currentUser.fullName,
      assignedToUserIds: assignedUsers.map((u) => u.id),
      assignedToNames: assignedUsers.length > 0 ? assignedUsers.map((u) => u.fullName) : ['كافة الشعب'],
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || undefined,
      priority,
      status: 'قيد الإنجاز',
      content: content.trim(),
      instructions: instructions.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setDocs(storageService.getOfficialDocs(activeBranch));
    setShowAddModal(false);
    setTitle('');
    setContent('');
    setInstructions('');
    setAttachments([]);
    setDocNumber(`م.ف/أ.إ/2026/${Math.floor(100 + Math.random() * 900)}`);
    setActionMsg('تم إصدار التكليف بالمهمة وإرسال إشعار فوري وتعميم المستندات على المكلفين بنجاح');
    setTimeout(() => setActionMsg(null), 4500);
  };

  const handleCompleteTask = (docId: string) => {
    storageService.updateDocStatus(docId, 'مكتمل', completionNotes.trim() || 'تم تنفيذ المهمة حسب التوجيهات الرسمية');
    setDocs(storageService.getOfficialDocs(activeBranch));
    setSelectedDocDetails(null);
    setCompletionNotes('');
    setActionMsg('تم تحديث حالة المهمة إلى "مكتمل" وإشعار الإدارة بتقرير التنفيذ');
    setTimeout(() => setActionMsg(null), 4000);
  };

  const filteredDocs = docs.filter((d) => {
    if (activeFilter === 'my_tasks' && !d.assignedToUserIds.includes(currentUser.id)) return false;
    if (activeFilter === 'pending' && d.status !== 'قيد الإنجاز') return false;
    if (activeFilter === 'completed' && d.status !== 'مكتمل') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        d.title.toLowerCase().includes(q) ||
        d.docNumber.includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.assignedToNames.some((n) => n.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-12" dir="rtl">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md flex items-center justify-between border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-base font-bold">التكليف بالمهام والكتب الرسمية</h2>
            <p className="text-[11px] text-[#D4AF37]">التعليمات المرفقة والمتابعة التنفيذية الميدانية</p>
          </div>
        </div>

        {canManageStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>إصدار تكليف جديد</span>
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Branch Selector Bar */}
        <BranchSelectorBar />

        {/* Feedback Message */}
        {actionMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الكتاب، عنوان المهمة، أو اسم المكلف..."
            className="w-full pr-9 pl-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162238] text-xs shadow-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-[#1B2A4A] text-white'
                : 'bg-white dark:bg-[#162238] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            كافة المهام ({docs.length})
          </button>
          <button
            onClick={() => setActiveFilter('my_tasks')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeFilter === 'my_tasks'
                ? 'bg-[#1B2A4A] text-white'
                : 'bg-white dark:bg-[#162238] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            مهامي المكلف بها ({docs.filter((d) => d.assignedToUserIds.includes(currentUser.id)).length})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-white dark:bg-[#162238] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            قيد الإنجاز ({docs.filter((d) => d.status === 'قيد الإنجاز').length})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-[#162238] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            مكتمل ({docs.filter((d) => d.status === 'مكتمل').length})
          </button>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              لا توجد كتب أو مهام مطابقة للبحث حالياً.
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isAssignedToMe = doc.assignedToUserIds.includes(currentUser.id);
              const isCompleted = doc.status === 'مكتمل';

              return (
                <div
                  key={doc.id}
                  className="p-4 rounded-3xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-[#D4AF37]/50 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                          {doc.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{doc.docNumber}</span>
                        <span
                          className="px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white"
                          style={{
                            backgroundColor: doc.branchId === 'najaf' ? '#2E8B57' : '#1B2A4A',
                          }}
                        >
                          {doc.branchId === 'najaf' ? 'فرع النجف' : 'فرع البصرة'}
                        </span>
                        {isAssignedToMe && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold border border-amber-500/30">
                            مكلف بها أنت
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#1B2A4A] dark:text-white leading-tight">
                        {doc.title}
                      </h4>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  {/* Task Content */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {doc.content}
                  </p>

                  {/* Instructions preview badge if exists */}
                  {doc.instructions && (
                    <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="truncate">
                        <strong>التعليمات المرفقة:</strong> {doc.instructions}
                      </span>
                    </div>
                  )}

                  {/* Attachments pills */}
                  {doc.attachments && doc.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {doc.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                        >
                          <Paperclip className="w-3 h-3 text-[#D4AF37]" />
                          <span className="truncate max-w-[140px]">{att.title}</span>
                          <span className="text-[8px] text-slate-400">({att.fileSize})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assigned to & Due Date */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    <div className="flex items-center gap-1 truncate max-w-[180px]">
                      <Users className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="truncate">المكلفون: {doc.assignedToNames.join('، ')}</span>
                    </div>

                    {doc.dueDate && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-red-500" />
                        <span>موعد التسليم: {doc.dueDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setSelectedDocDetails(doc)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض التفاصيل والمرفقات</span>
                    </button>

                    {isAssignedToMe && !isCompleted && (
                      <button
                        onClick={() => setSelectedDocDetails(doc)}
                        className="py-2 px-3 rounded-xl bg-[#2E8B57] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#257347] shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تأكيد الإنجاز</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Full Task & Document Details */}
        {selectedDocDetails && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#162238] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#D4AF37]/30 space-y-4 text-right max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-[#D4AF37] font-bold block">{selectedDocDetails.docNumber}</span>
                  <h3 className="text-sm font-bold text-[#1B2A4A] dark:text-white leading-tight">
                    {selectedDocDetails.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDocDetails(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Status and Priority */}
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/30">
                  {selectedDocDetails.type} ({selectedDocDetails.priority})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                  الحالة: {selectedDocDetails.status}
                </span>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">مضمون التكليف والكتاب:</label>
                <p className="text-xs text-slate-600 dark:text-slate-300 p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedDocDetails.content}
                </p>
              </div>

              {/* Instructions Section */}
              {selectedDocDetails.instructions && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#D4AF37] flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>التعليمات والتوجيهات الميدانية المحددة:</span>
                  </label>
                  <p className="text-xs text-amber-950 dark:text-amber-200 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 leading-relaxed">
                    {selectedDocDetails.instructions}
                  </p>
                </div>
              )}

              {/* Attachments Section with Download / View */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>المرفقات والوثائق الرسمية:</span>
                </label>
                {selectedDocDetails.attachments && selectedDocDetails.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDocDetails.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          <div className="truncate">
                            <span className="font-bold block truncate">{att.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {att.fileSize} • تاريخ الرفع: {att.uploadedAt}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActionMsg(`تم فتح وتحميل المرفق: ${att.title}`);
                            setTimeout(() => setActionMsg(null), 3000);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#1B2A4A] text-white text-[10px] font-bold flex items-center gap-1 hover:bg-[#253966]"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>تحميل</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">لا توجد ملفات مرفقة بهذا التكليف.</p>
                )}
              </div>

              {/* Execution Feedback / Complete Form */}
              {selectedDocDetails.assignedToUserIds.includes(currentUser.id) &&
                selectedDocDetails.status !== 'مكتمل' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2.5 text-xs">
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>تسليم المهمة وتأكيد الإنجاز:</span>
                    </h4>
                    <textarea
                      rows={2}
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      placeholder="اكتب تقرير أو ملاحظات إنجاز المهمة..."
                      className="w-full p-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#0f172a] text-xs resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCompleteTask(selectedDocDetails.id)}
                      className="w-full py-2.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأكيد الإنجاز وإشعار الإدارة</span>
                    </button>
                  </div>
                )}

              {/* Footer Metadata */}
              <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
                <span>جهة الإصدار: {selectedDocDetails.issuedBy}</span>
                <span>تاريخ التكليف: {selectedDocDetails.issueDate}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create New Official Task (Admin Only) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#162238] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#D4AF37]/30 space-y-4 text-right max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  <span>إصدار كتاب تكليف بمهمة رسمية</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
                {/* Number & Type */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الكتاب:</label>
                    <input
                      type="text"
                      value={docNumber}
                      readOnly
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نوع الوثيقة:</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as OfficialDocumentTask['type'])}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                    >
                      <option value="تكليف بمهمة">تكليف بمهمة ميدانية</option>
                      <option value="أمر إداري">أمر إداري ملزم</option>
                      <option value="كتاب رسمي">كتاب رسمي صادر</option>
                      <option value="تعميم داخلي">تعميم داخلي عام</option>
                      <option value="تقرير دوري">تقرير إنجاز دوري</option>
                    </select>
                  </div>
                </div>

                {/* Branch Selection */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الفرع المعني بالمهمة:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!isMainAdmin}
                      onClick={() => setDocBranchId('basra')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        docBranchId === 'basra'
                          ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      } ${!isMainAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>فرع البصرة</span>
                    </button>
                    <button
                      type="button"
                      disabled={!isMainAdmin}
                      onClick={() => setDocBranchId('najaf')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        docBranchId === 'najaf'
                          ? 'bg-[#2E8B57] text-white border-[#2E8B57]'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      } ${!isMainAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>فرع النجف</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان المهمة:</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: الإشراف على الندوة الفكرية الأسبوعية..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                  />
                </div>

                {/* Assigned Staff Member */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المكلف بالمهمة:</label>
                  <select
                    value={selectedStaffIds[0] || ''}
                    onChange={(e) => setSelectedStaffIds([e.target.value])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                  >
                    {staffMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.department || 'كادر المركز'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority & Due Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">درجة الأهمية:</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as OfficialDocumentTask['priority'])}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs"
                    >
                      <option value="عاجل جداً">عاجل جداً</option>
                      <option value="هام">هام</option>
                      <option value="عادي">عادي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاريخ الإنجاز المطلوب:</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs"
                    />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تفاصيل ومضمون التكليف:</label>
                  <textarea
                    rows={2}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="بيان أهداف المهمة ومتطلباتها..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs resize-none"
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    التعليمات والتوجيهات المحددة (Instructions):
                  </label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="تعليمات إدارية ملزمة للتنفيذ..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs resize-none"
                  />
                </div>

                {/* File Attachment Input (Supports both Click and Drag/Drop per usability guidelines) */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    إرفاق مستندات وملفات رسمية (PDF / Word):
                  </label>

                  <div className="p-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-center space-y-1.5">
                    <UploadCloud className="w-5 h-5 text-[#D4AF37] mx-auto" />
                    <p className="text-[10px] text-slate-500">اسحب الملف هنا أو اضغط للاختيار</p>
                    <input
                      type="file"
                      onChange={handleFileUploadSimulated}
                      className="text-[10px] text-slate-400 block mx-auto cursor-pointer"
                    />
                  </div>

                  {/* Manual File Name Quick Add */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      placeholder="أو اكتب اسم المستند (مثال: لائحة_المهمة.pdf)"
                      className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="px-3 py-2 rounded-xl bg-[#1B2A4A] text-white font-bold text-xs"
                    >
                      إضافة
                    </button>
                  </div>

                  {/* Attached Files List */}
                  {attachments.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] flex items-center justify-between border border-emerald-200"
                        >
                          <span className="truncate">📎 {att.title}</span>
                          <button
                            type="button"
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                            className="text-red-500 font-bold ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white font-bold"
                  >
                    إصدار وتعميم
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
