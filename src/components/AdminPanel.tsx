import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Download,
  FileSpreadsheet,
  FileCode,
  Copy,
  Check,
  Eye,
  EyeOff,
  Search,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  RotateCcw,
  Clock,
  Printer,
  Sliders,
  Sparkles,
  KeyRound,
  FileText,
  UserCheck,
  Palette,
  Type,
  Image as ImageIcon,
  Lock,
  Link as LinkIcon,
  CheckSquare,
  Square,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { Student, AttendanceRecord, SessionConfig, AppCustomization } from '../types';
import {
  getStudents,
  getAttendanceRecords,
  getSessionConfig,
  saveSessionConfig,
  getCustomization,
  saveCustomization,
  defaultCustomization,
  getAdminSecretSlug,
  saveAdminSecretSlug,
  getAdminPassword,
  saveAdminPassword,
  deleteStudent,
  deleteMultipleStudents,
  deleteAttendanceRecord,
  deleteMultipleAttendanceRecords,
  clearAllAttendanceRecords,
  registerOrUpdateStudent,
  resetToDefaults,
  exportToCSV,
  exportJSON,
  markAttendance,
} from '../services/storage';
import { subscribeToStudents, subscribeToAttendance } from '../services/firebaseService';
import { TemaCircleLogo, TemaFooterBrand } from './TemaBrand';

interface AdminPanelProps {
  onBackToLogin: () => void;
  onCustomizationUpdated?: (custom: AppCustomization) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToLogin, onCustomizationUpdated }) => {
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    getAttendanceRecords()
  );
  const [sessionConfig, setSessionConfigState] = useState<SessionConfig>(() => getSessionConfig());

  // Real-time Firestore sync
  useEffect(() => {
    const unsubStudents = subscribeToStudents((liveStudents) => {
      setStudents(liveStudents);
    });
    const unsubAttendance = subscribeToAttendance((liveRecords) => {
      setAttendanceRecords(liveRecords);
    });
    return () => {
      unsubStudents();
      unsubAttendance();
    };
  }, []);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT_TODAY' | 'LATE_TODAY' | 'ABSENT_TODAY'>('ALL');
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [copiedMatrics, setCopiedMatrics] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'ATTENDANCE_LOG' | 'SETTINGS' | 'CUSTOMIZATION'>('STUDENTS');
  const [customization, setCustomizationState] = useState<AppCustomization>(() => getCustomization());
  const [savedNotice, setSavedNotice] = useState('');

  // Secret Admin Link Slug state
  const [secretSlug, setSecretSlug] = useState(() => getAdminSecretSlug());
  const [slugCopied, setSlugCopied] = useState(false);
  const [slugNotice, setSlugNotice] = useState('');

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);

  // Mark & Bulk Delete State
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  // In-app Modal Confirmation States (avoids blocked window.confirm in iframe)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isBulkDeleteStudentsOpen, setIsBulkDeleteStudentsOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [isBulkDeleteLogsOpen, setIsBulkDeleteLogsOpen] = useState(false);
  const [isConfirmClearLogsOpen, setIsConfirmClearLogsOpen] = useState(false);

  // Action Notice Toast
  const [actionNotice, setActionNotice] = useState<string>('');

  // Master Admin Password change state
  const [currentAdminPassInput, setCurrentAdminPassInput] = useState('');
  const [newAdminPassInput, setNewAdminPassInput] = useState('');
  const [confirmAdminPassInput, setConfirmAdminPassInput] = useState('');
  const [showAdminPassToggle, setShowAdminPassToggle] = useState(false);
  const [adminPassMsg, setAdminPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab 4 Preview Mode switcher (Student Login vs Success Slip vs Mini Pop-up)
  const [previewMode, setPreviewMode] = useState<'login' | 'success_slip' | 'mini_popup'>('login');
  const [testMiniPopupToast, setTestMiniPopupToast] = useState(false);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  const refreshData = () => {
    setStudents(getStudents());
    setAttendanceRecords(getAttendanceRecords());
    setSessionConfigState(getSessionConfig());
    setCustomizationState(getCustomization());
    setSecretSlug(getAdminSecretSlug());
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Today's attendance set
  const todayAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach((record) => {
      if (record.date === todayStr) {
        // keep latest
        if (!map.has(record.matricNumber.toUpperCase())) {
          map.set(record.matricNumber.toUpperCase(), record);
        }
      }
    });
    return map;
  }, [attendanceRecords, todayStr]);

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter((std) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        std.matricNumber.toLowerCase().includes(q) ||
        std.fullName.toLowerCase().includes(q) ||
        std.email.toLowerCase().includes(q) ||
        std.phone.toLowerCase().includes(q) ||
        std.department.toLowerCase().includes(q);

      const matchDept = departmentFilter === 'ALL' || std.department === departmentFilter;
      const matchLevel = levelFilter === 'ALL' || std.level === levelFilter;

      const recordToday = todayAttendanceMap.get(std.matricNumber.toUpperCase());

      let matchStatus = true;
      if (statusFilter === 'PRESENT_TODAY') {
        matchStatus = !!recordToday && recordToday.status === 'Present';
      } else if (statusFilter === 'LATE_TODAY') {
        matchStatus = !!recordToday && recordToday.status === 'Late';
      } else if (statusFilter === 'ABSENT_TODAY') {
        matchStatus = !recordToday;
      }

      return matchSearch && matchDept && matchLevel && matchStatus;
    });
  }, [students, searchQuery, departmentFilter, levelFilter, statusFilter, todayAttendanceMap]);

  // Statistics
  const totalStudents = students.length;
  const totalCheckedInToday = todayAttendanceMap.size;
  const presentCount = Array.from(todayAttendanceMap.values()).filter((r) => r.status === 'Present').length;
  const lateCount = Array.from(todayAttendanceMap.values()).filter((r) => r.status === 'Late').length;
  const attendanceRate = totalStudents > 0 ? Math.round((totalCheckedInToday / totalStudents) * 100) : 0;

  const handleCopyMatricList = () => {
    const list = filteredStudents.map((s) => s.matricNumber).join(', ');
    navigator.clipboard.writeText(list);
    setCopiedMatrics(true);
    setTimeout(() => setCopiedMatrics(false), 2000);
  };

  const handleCopySingle = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Student Deletion Handlers
  const handleDeleteStudentClick = (student: Student) => {
    setStudentToDelete(student);
  };

  const confirmDeleteSingleStudent = () => {
    if (!studentToDelete) return;
    deleteStudent(studentToDelete.id);
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      next.delete(studentToDelete.id);
      return next;
    });
    setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
    showNotice(`Student "${studentToDelete.fullName}" was deleted from registry and database.`);
    setStudentToDelete(null);
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllStudents = () => {
    if (selectedStudentIds.size >= filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const confirmDeleteMarkedStudents = () => {
    const ids = Array.from(selectedStudentIds);
    if (ids.length === 0) return;
    deleteMultipleStudents(ids);
    setStudents((prev) => prev.filter((s) => !selectedStudentIds.has(s.id)));
    showNotice(`Successfully deleted ${ids.length} marked student(s) from registry and database.`);
    setSelectedStudentIds(new Set());
    setIsBulkDeleteStudentsOpen(false);
  };

  // Attendance Log Deletion Handlers
  const handleDeleteRecordClick = (record: AttendanceRecord) => {
    setRecordToDelete(record);
  };

  const confirmDeleteSingleRecord = () => {
    if (!recordToDelete) return;
    deleteAttendanceRecord(recordToDelete.id);
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      next.delete(recordToDelete.id);
      return next;
    });
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
    showNotice('Attendance log entry deleted from database.');
    setRecordToDelete(null);
  };

  const toggleRecordSelection = (id: string) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllRecords = () => {
    if (selectedRecordIds.size >= attendanceRecords.length && attendanceRecords.length > 0) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(attendanceRecords.map((r) => r.id)));
    }
  };

  const confirmDeleteMarkedRecords = () => {
    const ids = Array.from(selectedRecordIds);
    if (ids.length === 0) return;
    deleteMultipleAttendanceRecords(ids);
    setAttendanceRecords((prev) => prev.filter((r) => !selectedRecordIds.has(r.id)));
    showNotice(`Successfully deleted ${ids.length} marked attendance record(s).`);
    setSelectedRecordIds(new Set());
    setIsBulkDeleteLogsOpen(false);
  };

  const confirmClearAllLogs = () => {
    clearAllAttendanceRecords();
    setAttendanceRecords([]);
    setSelectedRecordIds(new Set());
    setIsConfirmClearLogsOpen(false);
    showNotice('All student attendance logs were successfully wiped from database.');
  };

  const handleMarkDirectAttendance = (matricNumber: string) => {
    markAttendance(matricNumber);
    refreshData();
  };

  const handleResetData = () => {
    resetToDefaults();
    refreshData();
    showNotice('Data reset to default demonstration state.');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSessionConfig(sessionConfig);
    showNotice('Session configuration updated successfully!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Live Test Toast for Mini Pop-up */}
      {testMiniPopupToast && (
        <div
          style={{
            backgroundColor: customization.miniPopupBgColor || '#059669',
            color: customization.miniPopupTextColor || '#ffffff',
          }}
          className={`fixed z-50 max-w-[90vw] sm:max-w-md px-5 py-2.5 rounded-full shadow-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in transition-all ${
            customization.miniPopupPosition === 'bottom'
              ? 'bottom-6 left-1/2 -translate-x-1/2'
              : 'top-20 left-1/2 -translate-x-1/2'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {customization.miniPopupShowIcon !== false && (
              <span className="font-bold">
                {customization.miniPopupIconType === 'sparkle' ? '✦' :
                 customization.miniPopupIconType === 'bell' ? '🔔' :
                 customization.miniPopupIconType === 'none' ? '' : '✓'}
              </span>
            )}
            <span className="truncate">
              {(customization.miniPopupText || 'Attendance recorded successfully for {student}!')
                .replace('{student}', 'Student (KODEDTEKKYVIBE@GMAIL.COM)')
                .replace('{matric}', 'CSC/2021/0492')
                .replace('{name}', 'Student')
                .replace('{time}', '11:05 AM')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTestMiniPopupToast(false)}
            className="opacity-80 hover:opacity-100 font-bold text-xs cursor-pointer ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Admin Navigation Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLogin}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Return to Student Login Screen"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Student Login Form</span>
            </button>

            <div className="h-5 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0064e0] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                T
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                  <span>Tema Student Registry & Attendance Admin</span>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Administrator Mode
                  </span>
                  <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Firebase Firestore Live
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Active Session: <strong className="text-white">{sessionConfig.courseCode}</strong> ({sessionConfig.academicSession})
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
              title="Reset data to initial demonstration state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Demo Data</span>
            </button>

            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#0064e0] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 border-t border-slate-800/80 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('STUDENTS')}
            className={`py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'STUDENTS'
                ? 'border-[#0064e0] text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students Directory ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ATTENDANCE_LOG')}
            className={`py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'ATTENDANCE_LOG'
                ? 'border-[#0064e0] text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Live Attendance Log ({attendanceRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'SETTINGS'
                ? 'border-[#0064e0] text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Session & Cutoff Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMIZATION')}
            className={`py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'CUSTOMIZATION'
                ? 'border-[#0064e0] text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Edit Texts & Logos</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Total Registered</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
            <div className="text-[11px] text-slate-500 mt-1">Institutional Students</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Checked In Today</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{totalCheckedInToday}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {presentCount} on-time, {lateCount} late
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Turnout Rate</span>
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">{attendanceRate}%</div>
            <div className="text-[11px] text-slate-500 mt-1">{totalStudents - totalCheckedInToday} absent today</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Current Course</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 truncate">{sessionConfig.courseCode}</div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">Cutoff: {sessionConfig.lateThresholdTime} AM</div>
          </div>
        </div>

        {/* TAB 1: STUDENTS DIRECTORY & RETRIEVAL */}
        {activeTab === 'STUDENTS' && (
          <div className="space-y-4">
            {/* Action Bar & Data Export Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Matric Number, Name, Department, or Email..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0064e0] focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Export & Retrieval Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAllPasswords(!showAllPasswords)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                      showAllPasswords
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Toggle viewing of student credentials"
                  >
                    {showAllPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAllPasswords ? 'Hide Passwords' : 'Show All Passwords'}</span>
                  </button>

                  <button
                    onClick={handleCopyMatricList}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
                    title="Copy all visible matric numbers to clipboard"
                  >
                    {copiedMatrics ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMatrics ? 'Copied!' : 'Copy Matrics'}</span>
                  </button>

                  <button
                    onClick={() => exportToCSV()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Export complete student details & attendance to Excel CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => exportJSON()}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Export raw JSON database dump"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-medium">Status:</span>
                {[
                  { key: 'ALL', label: 'All Students' },
                  { key: 'PRESENT_TODAY', label: `Present Today (${presentCount})` },
                  { key: 'LATE_TODAY', label: `Late Today (${lateCount})` },
                  { key: 'ABSENT_TODAY', label: `Absent (${totalStudents - totalCheckedInToday})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key as any)}
                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                      statusFilter === f.key
                        ? 'bg-[#0064e0] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                <span className="text-slate-400 font-medium">Department:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                </select>

                <span className="text-slate-400 font-medium ml-1">Level:</span>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none"
                >
                  <option value="ALL">All Levels</option>
                  <option value="100L">100L</option>
                  <option value="200L">200L</option>
                  <option value="300L">300L</option>
                  <option value="400L">400L</option>
                  <option value="500L">500L</option>
                </select>

                <span className="ml-auto text-slate-400 text-xs">
                  Showing <strong>{filteredStudents.length}</strong> of {totalStudents}
                </span>
              </div>
            </div>

            {/* Bulk Action Banner when students are marked */}
            {selectedStudentIds.size > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 sm:px-5 flex items-center justify-between gap-3 text-xs text-rose-950 animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                    {selectedStudentIds.size}
                  </div>
                  <span className="font-semibold text-slate-800">
                    {selectedStudentIds.size} student{selectedStudentIds.size > 1 ? 's' : ''} marked for removal
                  </span>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds(new Set())}
                    className="text-rose-600 hover:text-rose-800 font-medium underline cursor-pointer"
                  >
                    Unmark all
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllStudents}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors cursor-pointer"
                  >
                    {selectedStudentIds.size === filteredStudents.length ? 'Deselect All' : `Mark All (${filteredStudents.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteStudentsOpen(true)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Marked Students ({selectedStudentIds.size})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Students Table with complete details & passwords */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                          onChange={toggleSelectAllStudents}
                          className="rounded border-slate-300 text-[#0064e0] focus:ring-[#0064e0] w-4 h-4 cursor-pointer"
                          title="Mark / Unmark all filtered students"
                        />
                      </th>
                      <th className="py-3 px-4">Matric Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Department & Level</th>
                      <th className="py-3 px-4">Contact (Email & Phone)</th>
                      <th className="py-3 px-4">Captured Password</th>
                      <th className="py-3 px-4">Today&apos;s Status</th>
                      <th className="py-3 px-4 text-center">Total Sessions</th>
                      <th className="py-3 px-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm font-medium">No students match your filter criteria.</p>
                          <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((std) => {
                        const todayRecord = todayAttendanceMap.get(std.matricNumber.toUpperCase());
                        const isMarked = selectedStudentIds.has(std.id);
                        return (
                          <tr
                            key={std.id}
                            className={`transition-colors group ${
                              isMarked ? 'bg-rose-50/60' : 'hover:bg-blue-50/40'
                            }`}
                          >
                            {/* Mark Checkbox */}
                            <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isMarked}
                                onChange={() => toggleStudentSelection(std.id)}
                                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                                title="Mark student for deletion"
                              />
                            </td>

                            {/* Matric Number */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900 group-hover:text-[#0064e0]">
                                  {std.matricNumber}
                                </span>
                                <button
                                  onClick={() => handleCopySingle(std.matricNumber, `matric_${std.id}`)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Copy Matric Number"
                                >
                                  {copiedId === `matric_${std.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-400">ID: {std.id}</div>
                            </td>

                            {/* Full Name */}
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              <button
                                onClick={() => setSelectedStudentForProfile(std)}
                                className="text-left hover:text-[#0064e0] hover:underline cursor-pointer"
                              >
                                {std.fullName}
                              </button>
                            </td>

                            {/* Department & Level */}
                            <td className="py-3.5 px-4">
                              <div className="text-slate-800 font-medium">{std.department}</div>
                              <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold mt-0.5">
                                {std.level}
                              </span>
                            </td>

                            {/* Contact */}
                            <td className="py-3.5 px-4">
                              <div className="text-slate-700 truncate max-w-[180px]">{std.email}</div>
                              <div className="text-slate-400 text-[11px]">{std.phone}</div>
                            </td>

                            {/* Password / Credentials (retrieval feature) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-mono text-xs px-2 py-1 rounded bg-slate-100 border border-slate-200 select-all ${
                                    showAllPasswords ? 'text-amber-800 font-semibold' : 'text-slate-500 blur-xs hover:blur-none transition-all'
                                  }`}
                                  title="Click to select password"
                                >
                                  {std.password}
                                </span>
                                <button
                                  onClick={() => handleCopySingle(std.password, `pass_${std.id}`)}
                                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                                  title="Copy password"
                                >
                                  {copiedId === `pass_${std.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <KeyRound className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Today's Status */}
                            <td className="py-3.5 px-4">
                              {todayRecord ? (
                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                      todayRecord.status === 'Present'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        todayRecord.status === 'Present' ? 'bg-emerald-500' : 'bg-amber-500'
                                      }`}
                                    />
                                    {todayRecord.status}
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {todayRecord.formattedTime}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleMarkDirectAttendance(std.matricNumber)}
                                  className="text-slate-400 hover:text-[#0064e0] hover:bg-blue-50 px-2 py-1 rounded text-xs transition-colors border border-dashed border-slate-300 cursor-pointer"
                                  title="Mark student present right now"
                                >
                                  + Mark Present
                                </button>
                              )}
                            </td>

                            {/* Total Sessions */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-semibold text-slate-700">{std.totalAttendances || 0}</span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedStudentForProfile(std)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="View full student profile"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingStudent(std)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit student"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudentClick(std)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete student"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE ATTENDANCE LOG */}
        {activeTab === 'ATTENDANCE_LOG' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Real-Time Attendance Audit Log</h3>
                <p className="text-xs text-slate-500">Every student check-in, device signature, and verification timestamp</p>
              </div>

              <div className="flex items-center gap-2">
                {attendanceRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmClearLogsOpen(true)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Delete all student attendance logs from database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Student Logs ({attendanceRecords.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => exportToCSV('Tema_Attendance_Log_Detailed.csv')}
                  className="px-3 py-1.5 bg-[#0064e0] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Audit Log</span>
                </button>
              </div>
            </div>

            {/* Bulk Action Banner when attendance logs are marked */}
            {selectedRecordIds.size > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 sm:px-5 flex items-center justify-between gap-3 text-xs text-rose-950 animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                    {selectedRecordIds.size}
                  </div>
                  <span className="font-semibold text-slate-800">
                    {selectedRecordIds.size} log record{selectedRecordIds.size > 1 ? 's' : ''} marked for removal
                  </span>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRecordIds(new Set())}
                    className="text-rose-600 hover:text-rose-800 font-medium underline cursor-pointer"
                  >
                    Unmark all
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllRecords}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors cursor-pointer"
                  >
                    {selectedRecordIds.size === attendanceRecords.length ? 'Deselect All' : `Mark All (${attendanceRecords.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteLogsOpen(true)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Marked Logs ({selectedRecordIds.size})</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={attendanceRecords.length > 0 && selectedRecordIds.size === attendanceRecords.length}
                          onChange={toggleSelectAllRecords}
                          className="rounded border-slate-300 text-[#0064e0] focus:ring-[#0064e0] w-4 h-4 cursor-pointer"
                          title="Mark / Unmark all logs"
                        />
                      </th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Matriculation No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Course Session</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Device & IP</th>
                      <th className="py-3 px-4">Location & Notes</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                          <p className="text-sm font-medium">No attendance records captured yet.</p>
                          <p className="text-xs text-slate-400 mt-1">Student check-in logins will appear here in real-time.</p>
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map((rec) => {
                        const isMarked = selectedRecordIds.has(rec.id);
                        return (
                          <tr
                            key={rec.id}
                            className={`transition-colors group ${
                              isMarked ? 'bg-rose-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isMarked}
                                onChange={() => toggleRecordSelection(rec.id)}
                                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                                title="Mark log for deletion"
                              />
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-semibold text-slate-800">{rec.date}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {rec.formattedTime}
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-[#0064e0]">
                              {rec.matricNumber}
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-900">{rec.studentName}</div>
                              <div className="text-[10px] text-slate-400">
                                {rec.department} ({rec.level})
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{rec.sessionCode}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                {rec.sessionTitle}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  rec.status === 'Present'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    rec.status === 'Present' ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                />
                                {rec.status}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="text-slate-700">{rec.deviceInfo}</div>
                              <div className="text-[10px] text-slate-400 font-mono">IP: {rec.ipAddress}</div>
                            </td>

                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              <div>{rec.location || 'Lecture Hall'}</div>
                              <div className="text-[10px] text-slate-400 italic">{rec.notes}</div>
                            </td>

                            {/* Delete single log action */}
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteRecordClick(rec)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete this attendance log"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SESSION SETTINGS & UNIQUE ADMIN LINK */}
        {activeTab === 'SETTINGS' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Unique Secret Admin Link Security Card */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4 border border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base leading-tight">
                      Your Unique Secret Admin Link
                    </h3>
                    <p className="text-xs text-slate-400">
                      Access via this direct secret link or by clicking/tapping and holding the small logo below for 15 seconds.
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-semibold">
                  Active & Protected
                </span>
              </div>

              {/* Full Secret Link Box */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Direct Secret URL:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-blue-300 select-all truncate">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/#${secretSlug}`
                      : `/#${secretSlug}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const fullUrl = `${window.location.origin}/#${secretSlug}`;
                      navigator.clipboard.writeText(fullUrl);
                      setSlugCopied(true);
                      setTimeout(() => setSlugCopied(false), 2000);
                    }}
                    className="px-4 py-2.5 bg-[#0064e0] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                  >
                    {slugCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <LinkIcon className="w-4 h-4" />}
                    <span>{slugCopied ? 'Copied!' : 'Copy Secret Link'}</span>
                  </button>
                </div>
              </div>

              {/* Customize Secret Slug */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Change Secret Slug (Custom Key):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs font-mono">/#</span>
                  <input
                    type="text"
                    value={secretSlug}
                    onChange={(e) => setSecretSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="e.g. tema-sec-9842"
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!secretSlug.trim()) {
                        alert('Slug cannot be empty.');
                        return;
                      }
                      saveAdminSecretSlug(secretSlug);
                      window.location.hash = `#${secretSlug}`;
                      setSlugNotice('Secret admin link updated successfully!');
                      setTimeout(() => setSlugNotice(''), 3000);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Save New Slug
                  </button>
                </div>
                {slugNotice && (
                  <p className="text-xs text-emerald-400 font-medium">{slugNotice}</p>
                )}
              </div>
            </div>

            {/* Course Session Rules Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-base">Course Session & Attendance Rules</h3>
                <p className="text-xs text-slate-500">
                  Configure the active course code, lecturer, and late arrival cutoff time.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={sessionConfig.courseCode}
                    onChange={(e) =>
                      setSessionConfigState({ ...sessionConfig, courseCode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0064e0] uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Late Cutoff Time (HH:MM)
                  </label>
                  <input
                    type="text"
                    placeholder="08:30"
                    value={sessionConfig.lateThresholdTime}
                    onChange={(e) =>
                      setSessionConfigState({ ...sessionConfig, lateThresholdTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0064e0]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Logins after this time are marked &quot;Late&quot;.
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  value={sessionConfig.courseTitle}
                  onChange={(e) =>
                    setSessionConfigState({ ...sessionConfig, courseTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0064e0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Lecturer Name
                  </label>
                  <input
                    type="text"
                    value={sessionConfig.lecturerName}
                    onChange={(e) =>
                      setSessionConfigState({ ...sessionConfig, lecturerName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0064e0]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Lecture Hall Location
                  </label>
                  <input
                    type="text"
                    value={sessionConfig.hallLocation}
                    onChange={(e) =>
                      setSessionConfigState({ ...sessionConfig, hallLocation: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0064e0]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0064e0] hover:bg-blue-600 text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>

          {/* Master Admin Password Management Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Master Admin Password Security
                </h3>
                <p className="text-xs text-slate-500">
                  Change the password required to access the admin panel after long-pressing the logo or using the secret link. Default is <code className="bg-slate-100 text-blue-600 font-mono px-1 rounded">yemcojoe</code>.
                </p>
              </div>
            </div>

            {adminPassMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  adminPassMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{adminPassMsg.text}</span>
                <button
                  type="button"
                  onClick={() => setAdminPassMsg(null)}
                  className="font-bold opacity-70 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAdminPassMsg(null);
                const currentStored = getAdminPassword();
                if (currentAdminPassInput !== currentStored) {
                  setAdminPassMsg({
                    type: 'error',
                    text: 'Incorrect current password. Verification failed.',
                  });
                  return;
                }
                if (!newAdminPassInput.trim() || newAdminPassInput.length < 4) {
                  setAdminPassMsg({
                    type: 'error',
                    text: 'New password must be at least 4 characters long.',
                  });
                  return;
                }
                if (newAdminPassInput !== confirmAdminPassInput) {
                  setAdminPassMsg({
                    type: 'error',
                    text: 'New passwords do not match. Please re-type carefully.',
                  });
                  return;
                }
                saveAdminPassword(newAdminPassInput);
                setCurrentAdminPassInput('');
                setNewAdminPassInput('');
                setConfirmAdminPassInput('');
                setAdminPassMsg({
                  type: 'success',
                  text: 'Admin master password successfully updated and synced!',
                });
                showNotice('Admin password updated successfully.');
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Current Password
                  </label>
                  <input
                    type={showAdminPassToggle ? 'text' : 'password'}
                    required
                    value={currentAdminPassInput}
                    onChange={(e) => setCurrentAdminPassInput(e.target.value)}
                    placeholder="Current password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#0064e0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <input
                    type={showAdminPassToggle ? 'text' : 'password'}
                    required
                    value={newAdminPassInput}
                    onChange={(e) => setNewAdminPassInput(e.target.value)}
                    placeholder="New admin password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#0064e0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showAdminPassToggle ? 'text' : 'password'}
                    required
                    value={confirmAdminPassInput}
                    onChange={(e) => setConfirmAdminPassInput(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#0064e0]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAdminPassToggle}
                    onChange={(e) => setShowAdminPassToggle(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show password characters</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      saveAdminPassword('yemcojoe');
                      setCurrentAdminPassInput('');
                      setNewAdminPassInput('');
                      setConfirmAdminPassInput('');
                      setAdminPassMsg({
                        type: 'success',
                        text: 'Admin password reset to default "yemcojoe".',
                      });
                      showNotice('Password reset to default yemcojoe');
                    }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Reset to "yemcojoe"
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* TAB 4: PAGE TEXTS & LOGOS CUSTOMIZER */}
        {activeTab === 'CUSTOMIZATION' && (
          <div className="space-y-6">
            {/* Header description and status banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[#0064e0]" />
                  <span>Customize All Page Texts, Write-Ups & Logos</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Change any word, placeholder, button title, and logo branding on the student login screen. Changes save instantly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all page texts, write-ups and logos to the original photo defaults?')) {
                      setCustomizationState(defaultCustomization);
                      saveCustomization(defaultCustomization);
                      if (onCustomizationUpdated) onCustomizationUpdated(defaultCustomization);
                      setSavedNotice('Reset to default texts & logos.');
                      setTimeout(() => setSavedNotice(''), 3000);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </div>

            {savedNotice && (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {savedNotice}
                </span>
                <button onClick={() => setSavedNotice('')} className="text-emerald-600 hover:text-emerald-900">
                  ✕
                </button>
              </div>
            )}

            {/* Split layout: Editor on Left, Live Preview on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Editor (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveCustomization(customization);
                    if (onCustomizationUpdated) onCustomizationUpdated(customization);
                    setSavedNotice('All page texts and logos updated successfully!');
                    setTimeout(() => setSavedNotice(''), 3500);
                  }}
                  className="space-y-6"
                >
                  {/* 1. TOP BAR & LANGUAGE TEXT */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-blue-600" />
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                            1. Top Navigation & Language Selector
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Configure visibility, labels, and whether clicking triggers an action or is inactive (no reaction).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Language Selector Card */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-200/60">
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>Language Selector</span>
                              {customization.disableLanguageAction ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Action OFF (No Reaction)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Action ON (Opens List)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Choose if tapping opens language switcher or does nothing.
                            </div>
                          </div>

                          {/* Action Switcher */}
                          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={() =>
                                setCustomizationState({
                                  ...customization,
                                  disableLanguageAction: false,
                                })
                              }
                              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                !customization.disableLanguageAction
                                  ? 'bg-[#0064e0] text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Action ON
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCustomizationState({
                                  ...customization,
                                  disableLanguageAction: true,
                                })
                              }
                              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                customization.disableLanguageAction
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Action OFF
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            Language Label Text
                          </label>
                          <input
                            type="text"
                            value={customization.languageText}
                            onChange={(e) =>
                              setCustomizationState({ ...customization, languageText: e.target.value })
                            }
                            placeholder="e.g. English (UK)"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#0064e0]"
                          />
                        </div>

                        <div className="pt-0.5 flex justify-end">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={customization.showLanguageSelector !== false}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  showLanguageSelector: e.target.checked,
                                })
                              }
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Visible on Screen</span>
                          </label>
                        </div>
                      </div>

                      {/* Back Arrow Card */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-200/60">
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>Back Arrow (←)</span>
                              {customization.disableBackArrowAction ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Action OFF (No Reaction)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Action ON (Resets Form)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Choose if tapping clears inputs or does nothing.
                            </div>
                          </div>

                          {/* Action Switcher */}
                          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={() =>
                                setCustomizationState({
                                  ...customization,
                                  disableBackArrowAction: false,
                                })
                              }
                              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                !customization.disableBackArrowAction
                                  ? 'bg-[#0064e0] text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Action ON
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCustomizationState({
                                  ...customization,
                                  disableBackArrowAction: true,
                                })
                              }
                              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                customization.disableBackArrowAction
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Action OFF
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 py-1">
                          The back arrow appears at the top left of the student login screen. When Action is OFF, clicking it produces no reaction.
                        </div>

                        <div className="pt-0.5 flex justify-end">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={customization.showBackArrow !== false}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  showBackArrow: e.target.checked,
                                })
                              }
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Visible on Screen</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. MAIN CENTER LOGO */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        2. Main Center Logo
                      </h4>
                    </div>

                    <div className="flex gap-4 text-xs font-medium text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="logoType"
                          checked={customization.logoType === 'letter'}
                          onChange={() =>
                            setCustomizationState({ ...customization, logoType: 'letter' })
                          }
                          className="text-[#0064e0]"
                        />
                        <span>Monogram Letter (Circle)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="logoType"
                          checked={customization.logoType === 'image'}
                          onChange={() =>
                            setCustomizationState({ ...customization, logoType: 'image' })
                          }
                          className="text-[#0064e0]"
                        />
                        <span>Custom Logo Image / Upload</span>
                      </label>
                    </div>

                    {customization.logoType === 'letter' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Letter / Initial
                          </label>
                          <input
                            type="text"
                            maxLength={4}
                            value={customization.logoLetter}
                            onChange={(e) =>
                              setCustomizationState({ ...customization, logoLetter: e.target.value })
                            }
                            placeholder="T"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-[#0064e0]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Circle Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customization.logoBgColor}
                              onChange={(e) =>
                                setCustomizationState({ ...customization, logoBgColor: e.target.value })
                              }
                              className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={customization.logoBgColor}
                              onChange={(e) =>
                                setCustomizationState({ ...customization, logoBgColor: e.target.value })
                              }
                              className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Letter Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customization.logoTextColor}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  logoTextColor: e.target.value,
                                })
                              }
                              className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={customization.logoTextColor}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  logoTextColor: e.target.value,
                                })
                              }
                              className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Image URL
                          </label>
                          <input
                            type="url"
                            value={customization.logoImageUrl}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                logoImageUrl: e.target.value,
                              })
                            }
                            placeholder="https://example.com/logo.png"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0064e0]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Or Upload from Computer / Phone
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (uploadEvent) => {
                                  const result = uploadEvent.target?.result as string;
                                  if (result) {
                                    setCustomizationState({
                                      ...customization,
                                      logoType: 'image',
                                      logoImageUrl: result,
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0064e0] hover:file:bg-blue-100 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. INPUT FIELDS PLACEHOLDERS */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-blue-600" />
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                            3. Input Fields & Icons
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Configure field placeholders and the interactive behavior of the (ⓘ) format guide icon.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customization.showPasswordToggle !== false}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                showPasswordToggle: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Show Eye (👁)</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          First Input Placeholder (Matric Number)
                        </label>
                        <input
                          type="text"
                          value={customization.matricPlaceholder}
                          onChange={(e) =>
                            setCustomizationState({
                              ...customization,
                              matricPlaceholder: e.target.value,
                            })
                          }
                          placeholder="Matric Number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0064e0]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Second Input Placeholder (Password)
                        </label>
                        <input
                          type="text"
                          value={customization.passwordPlaceholder}
                          onChange={(e) =>
                            setCustomizationState({
                              ...customization,
                              passwordPlaceholder: e.target.value,
                            })
                          }
                          placeholder="Password"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0064e0]"
                        />
                      </div>
                    </div>

                    {/* Info (ⓘ) Icon Action Switcher & Configuration */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>Info Guide Icon (ⓘ) Button</span>
                            {customization.disableMatricInfoAction ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Action Inactive (No Reaction on Click)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Action Active (Opens Guide Popover)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            When Action is OFF, the ⓘ icon remains visible in the input field but does NOT react or open anything when clicked.
                          </div>
                        </div>

                        {/* Action Switcher */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() =>
                              setCustomizationState({
                                ...customization,
                                disableMatricInfoAction: false,
                              })
                            }
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              !customization.disableMatricInfoAction
                                ? 'bg-[#0064e0] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Action ON (Reacts)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomizationState({
                                ...customization,
                                disableMatricInfoAction: true,
                              })
                            }
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              customization.disableMatricInfoAction
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Action OFF (No Reaction)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Info Popover Title (When ⓘ Reacts)
                          </label>
                          <input
                            type="text"
                            value={customization.matricInfoTitle}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                matricInfoTitle: e.target.value,
                              })
                            }
                            placeholder="Matric Number Format"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#0064e0]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Info Popover Description
                          </label>
                          <input
                            type="text"
                            value={customization.matricInfoDesc}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                matricInfoDesc: e.target.value,
                              })
                            }
                            placeholder="Enter your registered institutional matric number..."
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#0064e0]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={customization.showMatricInfoIcon !== false}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                showMatricInfoIcon: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Visible on Screen (Show ⓘ Icon)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 4. BUTTONS & FORGOTTEN PASSWORD WRITE-UPS */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                          4. Action Buttons & Links (Turn On / Off)
                        </h4>
                      </div>

                      {/* Whole Portal Active Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          checked={customization.isPortalActive !== false}
                          onChange={(e) =>
                            setCustomizationState({
                              ...customization,
                              isPortalActive: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          {customization.isPortalActive !== false ? 'Portal Open' : 'Portal Closed'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Log in Button Text
                        </label>
                        <input
                          type="text"
                          value={customization.loginButtonText}
                          onChange={(e) =>
                            setCustomizationState({
                              ...customization,
                              loginButtonText: e.target.value,
                            })
                          }
                          placeholder="Log in"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0064e0]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Button Background
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.loginButtonBgColor}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                loginButtonBgColor: e.target.value,
                              })
                            }
                            className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={customization.loginButtonBgColor}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                loginButtonBgColor: e.target.value,
                              })
                            }
                            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Button Text Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.loginButtonTextColor}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                loginButtonTextColor: e.target.value,
                              })
                            }
                            className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={customization.loginButtonTextColor}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                loginButtonTextColor: e.target.value,
                              })
                            }
                            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Forgotten Password Link with On/Off & Disable Action */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>"Forgotten password?" Link</span>
                            {customization.disableForgotPasswordAction ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Action Inactive (Does Not React on Click)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Action Active (Opens Recovery)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Configure whether clicking this link opens the recovery modal or does NOT react after clicking.
                          </div>
                        </div>

                        {/* Action On/Off Switcher */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() =>
                              setCustomizationState({
                                ...customization,
                                disableForgotPasswordAction: false,
                              })
                            }
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              !customization.disableForgotPasswordAction
                                ? 'bg-[#0064e0] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Action ON (Reacts)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomizationState({
                                ...customization,
                                disableForgotPasswordAction: true,
                              })
                            }
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              customization.disableForgotPasswordAction
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Action OFF (No Reaction)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Link Text
                          </label>
                          <input
                            type="text"
                            value={customization.forgotPasswordText}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                forgotPasswordText: e.target.value,
                              })
                            }
                            placeholder="Forgotten password?"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#0064e0]"
                          />
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={customization.showForgotPassword !== false}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  showForgotPassword: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Visible on Screen</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Create Account Button with On/Off & Disable Action */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>"Create new account" Button</span>
                            {customization.disableCreateAccountAction ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Action Inactive (Does Not React on Click)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Action Active (Opens Account Modal)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Configure whether clicking this button opens the account form or does NOT react after clicking.
                          </div>
                        </div>

                        {/* Action On/Off Switcher */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() =>
                              setCustomizationState({
                                ...customization,
                                disableCreateAccountAction: false,
                              })
                            }
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              !customization.disableCreateAccountAction
                                ? 'bg-[#0064e0] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Action ON (Reacts)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomizationState({
                                ...customization,
                                disableCreateAccountAction: true,
                              })
                            }
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              customization.disableCreateAccountAction
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Action OFF (No Reaction)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Button Label Text
                          </label>
                          <input
                            type="text"
                            value={customization.createAccountButtonText}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                createAccountButtonText: e.target.value,
                              })
                            }
                            placeholder="Create new account"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#0064e0]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Border & Text Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customization.createAccountBorderColor}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  createAccountBorderColor: e.target.value,
                                  createAccountTextColor: e.target.value,
                                })
                              }
                              className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={customization.createAccountBorderColor}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  createAccountBorderColor: e.target.value,
                                  createAccountTextColor: e.target.value,
                                })
                              }
                              className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-end justify-start sm:justify-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={customization.showCreateAccount !== false}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  showCreateAccount: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Visible on Screen</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. FOOTER BRANDING (TEMA / META) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        5. Bottom Footer Branding
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Footer Brand Name
                        </label>
                        <input
                          type="text"
                          value={customization.footerBrandName}
                          onChange={(e) =>
                            setCustomizationState({
                              ...customization,
                              footerBrandName: e.target.value,
                            })
                          }
                          placeholder="Tema"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#0064e0]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Symbol Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.footerBrandColor}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                footerBrandColor: e.target.value,
                              })
                            }
                            className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={customization.footerBrandColor}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                footerBrandColor: e.target.value,
                              })
                            }
                            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Brand Icon Style
                      </label>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="footerIcon"
                            checked={customization.footerBrandIconType === 'meta'}
                            onChange={() =>
                              setCustomizationState({
                                ...customization,
                                footerBrandIconType: 'meta',
                              })
                            }
                          />
                          <span>Meta Infinity Loop (∞)</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="footerIcon"
                            checked={customization.footerBrandIconType === 'custom_text'}
                            onChange={() =>
                              setCustomizationState({
                                ...customization,
                                footerBrandIconType: 'custom_text',
                              })
                            }
                          />
                          <span>Custom Character / Emoji</span>
                        </label>
                      </div>

                      {customization.footerBrandIconType === 'custom_text' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={customization.footerBrandIconText}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                footerBrandIconText: e.target.value,
                              })
                            }
                            placeholder="e.g. ★ or 🎓 or ∞"
                            className="w-28 px-3 py-1.5 border border-slate-300 rounded-xl text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 6. ATTENDANCE SUCCESS / SLIP PAGE SETTINGS */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-blue-600" />
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                            6. Attendance Success / Slip Page (Receipt Slip)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Configure the modal slip shown after student check-in, turn it on/off, toggle buttons, or switch button order.
                          </p>
                        </div>
                      </div>

                      {/* Main Turn On/Off Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          checked={customization.showSuccessPage !== false}
                          onChange={(e) =>
                            setCustomizationState({
                              ...customization,
                              showSuccessPage: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded text-[#0064e0] focus:ring-[#0064e0]"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          {customization.showSuccessPage !== false ? 'Page Enabled' : 'Page Disabled'}
                        </span>
                      </label>
                    </div>

                    {customization.showSuccessPage === false && (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
                        ⚠️ <strong>Page is currently turned OFF:</strong> Students will be confirmed immediately with a brief top toast notice instead of showing this receipt modal.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Header Title
                        </label>
                        <input
                          type="text"
                          value={customization.successPageTitle || 'Attendance Verified & Recorded'}
                          onChange={(e) =>
                            setCustomizationState({
                              ...customization,
                              successPageTitle: e.target.value,
                            })
                          }
                          placeholder="Attendance Verified & Recorded"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0064e0]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Subtitle / System Name
                        </label>
                        <input
                          type="text"
                          value={customization.successPageSubtitle || 'Institutional Student Attendance Management System'}
                          onChange={(e) =>
                            setCustomizationState({
                              ...customization,
                              successPageSubtitle: e.target.value,
                            })
                          }
                          placeholder="Institutional Student Attendance Management System"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0064e0]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Receipt Footer Notice / Confirmation Text
                      </label>
                      <textarea
                        rows={2}
                        value={customization.successPageNotice || "Your login and check-in timestamp have been safely submitted to the lecturer's attendance register."}
                        onChange={(e) =>
                          setCustomizationState({
                            ...customization,
                            successPageNotice: e.target.value,
                          })
                        }
                        placeholder="Your login and check-in timestamp have been safely submitted..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0064e0]"
                      />
                    </div>

                    {/* Button Controls */}
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Button Controls & Order Switcher
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Done Button Config */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-200/60">
                            <div>
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span>Done Button</span>
                                {customization.disableSuccessDoneAction ? (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Action OFF (No Reaction)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Action ON (Closes Modal)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                When OFF, button remains visible but does NOT react when clicked.
                              </div>
                            </div>

                            {/* Action Switcher */}
                            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[11px] font-semibold">
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomizationState({
                                    ...customization,
                                    disableSuccessDoneAction: false,
                                  })
                                }
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  !customization.disableSuccessDoneAction
                                    ? 'bg-[#0064e0] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Action ON
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomizationState({
                                    ...customization,
                                    disableSuccessDoneAction: true,
                                  })
                                }
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  customization.disableSuccessDoneAction
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Action OFF
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Button Label Text
                            </label>
                            <input
                              type="text"
                              value={customization.successDoneButtonText || 'Done / Return to Login'}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  successDoneButtonText: e.target.value,
                                })
                              }
                              placeholder="Done / Return to Login"
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#0064e0]"
                            />
                          </div>

                          <div className="pt-0.5 flex justify-end">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={customization.showSuccessDoneButton !== false}
                                onChange={(e) =>
                                  setCustomizationState({
                                    ...customization,
                                    showSuccessDoneButton: e.target.checked,
                                  })
                                }
                                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span>Visible on Screen</span>
                            </label>
                          </div>
                        </div>

                        {/* Print Button Config */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-200/60">
                            <div>
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span>Print Button</span>
                                {customization.disableSuccessPrintAction ? (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Action OFF (No Reaction)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Action ON (Opens Print)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                When OFF, button remains visible but does NOT react when clicked.
                              </div>
                            </div>

                            {/* Action Switcher */}
                            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[11px] font-semibold">
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomizationState({
                                    ...customization,
                                    disableSuccessPrintAction: false,
                                  })
                                }
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  !customization.disableSuccessPrintAction
                                    ? 'bg-[#0064e0] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Action ON
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomizationState({
                                    ...customization,
                                    disableSuccessPrintAction: true,
                                  })
                                }
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  customization.disableSuccessPrintAction
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Action OFF
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Button Label Text
                            </label>
                            <input
                              type="text"
                              value={customization.successPrintButtonText || 'Print Attendance Slip'}
                              onChange={(e) =>
                                setCustomizationState({
                                  ...customization,
                                  successPrintButtonText: e.target.value,
                                })
                              }
                              placeholder="Print Attendance Slip"
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#0064e0]"
                            />
                          </div>

                          <div className="pt-0.5 flex justify-end">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={customization.showSuccessPrintButton !== false}
                                onChange={(e) =>
                                  setCustomizationState({
                                    ...customization,
                                    showSuccessPrintButton: e.target.checked,
                                  })
                                }
                                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span>Visible on Screen</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Switch Button Order */}
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-blue-950">Switch / Reorder Buttons</div>
                          <p className="text-[11px] text-blue-700">Choose which button appears first as primary action.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCustomizationState({
                                ...customization,
                                successButtonOrder: 'done_first',
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              customization.successButtonOrder !== 'print_first'
                                ? 'bg-[#0064e0] text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                            Done First (Default)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomizationState({
                                ...customization,
                                successButtonOrder: 'print_first',
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              customization.successButtonOrder === 'print_first'
                                ? 'bg-[#0064e0] text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                            Print First
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7. MINI POP-UP NOTIFICATION (QUICK CONFIRMATION PILL) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                            7. Mini Pop-up Toast Notification (Screenshot 4)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Configure the floating pill banner that appears when student attendance is submitted.
                          </p>
                        </div>
                      </div>

                      {/* Main Turn On/Off Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          checked={customization.showMiniPopup !== false}
                          onChange={(e) =>
                            setCustomizationState({
                              ...customization,
                              showMiniPopup: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          {customization.showMiniPopup !== false ? 'Pop-up Enabled' : 'Pop-up Disabled'}
                        </span>
                      </label>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-slate-700">
                          Mini Pop-up Message Text
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Supports dynamic tags
                        </span>
                      </div>
                      <input
                        type="text"
                        value={customization.miniPopupText || 'Attendance recorded successfully for {student}!'}
                        onChange={(e) =>
                          setCustomizationState({
                            ...customization,
                            miniPopupText: e.target.value,
                          })
                        }
                        placeholder="Attendance recorded successfully for {student}!"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
                        <span>Click to insert tags:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = customization.miniPopupText || '';
                            setCustomizationState({ ...customization, miniPopupText: cur + ' {student}' });
                          }}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-mono cursor-pointer"
                        >
                          {'{student}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = customization.miniPopupText || '';
                            setCustomizationState({ ...customization, miniPopupText: cur + ' {matric}' });
                          }}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-mono cursor-pointer"
                        >
                          {'{matric}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = customization.miniPopupText || '';
                            setCustomizationState({ ...customization, miniPopupText: cur + ' {time}' });
                          }}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-mono cursor-pointer"
                        >
                          {'{time}'}
                        </button>
                      </div>
                    </div>

                    {/* Styling & Color Pickers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Background Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.miniPopupBgColor || '#059669'}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                miniPopupBgColor: e.target.value,
                              })
                            }
                            className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={customization.miniPopupBgColor || '#059669'}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                miniPopupBgColor: e.target.value,
                              })
                            }
                            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Text Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.miniPopupTextColor || '#ffffff'}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                miniPopupTextColor: e.target.value,
                              })
                            }
                            className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={customization.miniPopupTextColor || '#ffffff'}
                            onChange={(e) =>
                              setCustomizationState({
                                ...customization,
                                miniPopupTextColor: e.target.value,
                              })
                            }
                            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Icon & Position Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Icon Style
                        </label>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="miniPopupIcon"
                              checked={customization.miniPopupIconType !== 'sparkle' && customization.miniPopupIconType !== 'bell' && customization.miniPopupIconType !== 'none'}
                              onChange={() =>
                                setCustomizationState({
                                  ...customization,
                                  miniPopupIconType: 'check',
                                  miniPopupShowIcon: true,
                                })
                              }
                            />
                            <span>Checkmark (✓)</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="miniPopupIcon"
                              checked={customization.miniPopupIconType === 'sparkle'}
                              onChange={() =>
                                setCustomizationState({
                                  ...customization,
                                  miniPopupIconType: 'sparkle',
                                  miniPopupShowIcon: true,
                                })
                              }
                            />
                            <span>Sparkle (✦)</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="miniPopupIcon"
                              checked={customization.miniPopupIconType === 'none'}
                              onChange={() =>
                                setCustomizationState({
                                  ...customization,
                                  miniPopupIconType: 'none',
                                  miniPopupShowIcon: false,
                                })
                              }
                            />
                            <span>No Icon</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Screen Placement
                        </label>
                        <div className="flex gap-4 text-xs">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="miniPopupPos"
                              checked={customization.miniPopupPosition !== 'bottom'}
                              onChange={() =>
                                setCustomizationState({
                                  ...customization,
                                  miniPopupPosition: 'top',
                                })
                              }
                            />
                            <span>Top of Screen</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="miniPopupPos"
                              checked={customization.miniPopupPosition === 'bottom'}
                              onChange={() =>
                                setCustomizationState({
                                  ...customization,
                                  miniPopupPosition: 'bottom',
                                })
                              }
                            />
                            <span>Bottom of Screen</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Test Button */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">
                        Want to test how it pops up on screen?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTestMiniPopupToast(true);
                          setTimeout(() => setTestMiniPopupToast(false), 3500);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Test Mini Pop-up Banner</span>
                      </button>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex justify-end gap-3 sticky bottom-4 bg-slate-50/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-md">
                    <button
                      type="button"
                      onClick={onBackToLogin}
                      className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Exit & View Student Form
                    </button>
                    <button
                      type="submit"
                      className="px-7 py-2.5 bg-[#0064e0] hover:bg-blue-600 text-white rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save All Changes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Interactive Real-Time Live Preview (5 cols) */}
              <div className="lg:col-span-5 sticky top-24 space-y-2">
                <div className="bg-slate-900 text-white px-4 py-3 rounded-t-2xl font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Preview (Updates Instantly)
                  </span>
                  {/* Preview Mode Switcher */}
                  <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('login')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        previewMode === 'login'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('mini_popup')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        previewMode === 'mini_popup'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Mini Pop-up
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('success_slip')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        previewMode === 'success_slip'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Receipt Slip
                    </button>
                  </div>
                </div>

                {previewMode === 'login' || previewMode === 'mini_popup' ? (
                  /* Simulated Phone Frame: Student Login View (with optional Mini Pop-up overlay) */
                  <div className="bg-white rounded-b-2xl border-x-2 border-b-2 border-slate-900 p-5 shadow-xl max-w-sm mx-auto font-sans relative overflow-hidden">
                    {/* Simulated Mini Pop-up overlay when Mini Pop-up tab is selected */}
                    {previewMode === 'mini_popup' && customization.showMiniPopup !== false && (
                      <div
                        style={{
                          backgroundColor: customization.miniPopupBgColor || '#059669',
                          color: customization.miniPopupTextColor || '#ffffff',
                        }}
                        className={`absolute left-4 right-4 z-20 px-3.5 py-2 rounded-full shadow-lg text-[11px] font-semibold flex items-center justify-between gap-2 animate-in fade-in transition-all ${
                          customization.miniPopupPosition === 'bottom' ? 'bottom-5' : 'top-3'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {customization.miniPopupShowIcon !== false && (
                            <span className="font-bold">
                              {customization.miniPopupIconType === 'sparkle' ? '✦' :
                               customization.miniPopupIconType === 'bell' ? '🔔' :
                               customization.miniPopupIconType === 'none' ? '' : '✓'}
                            </span>
                          )}
                          <span className="truncate">
                            {(customization.miniPopupText || 'Attendance recorded successfully for {student}!')
                              .replace('{student}', 'Student (KODEDTEKKYVIBE@GMAIL.COM)')
                              .replace('{matric}', 'CSC/2021/0492')
                              .replace('{name}', 'Student')
                              .replace('{time}', '11:05 AM')}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-75">✕</span>
                      </div>
                    )}

                    {/* Top Header Mockup */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 text-xs">
                      {customization.showBackArrow !== false ? (
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                      ) : (
                        <div className="w-5 h-5" />
                      )}
                      {customization.showLanguageSelector !== false ? (
                        <span className="text-gray-600 font-medium">
                          {customization.languageText || 'English (UK)'} ⌵
                        </span>
                      ) : (
                        <div />
                      )}
                      <div className="w-5 h-5" />
                    </div>

                    {/* Logo Mockup */}
                    <div className="flex justify-center py-6">
                      <TemaCircleLogo size={68} customization={customization} />
                    </div>

                    {/* Input 1 Mockup */}
                    <div className="space-y-3">
                      <div className="border border-gray-300 rounded-xl px-3.5 py-3 flex items-center justify-between text-xs bg-gray-50/50">
                        <span className="text-gray-700 font-medium">
                          |{customization.matricPlaceholder || 'Matric Number'}
                        </span>
                        {customization.showMatricInfoIcon !== false && (
                          <span className="text-gray-400 font-bold text-xs">ⓘ</span>
                        )}
                      </div>

                      {/* Input 2 Mockup */}
                      <div className="border border-gray-300 rounded-xl px-3.5 py-3 flex items-center justify-between text-xs bg-gray-50/50">
                        <span className="text-gray-500">
                          {customization.passwordPlaceholder || 'Password'}
                        </span>
                        {customization.showPasswordToggle !== false && (
                          <span className="text-gray-400 text-xs">👁</span>
                        )}
                      </div>

                      {/* Portal Closed Mockup Banner */}
                      {customization.isPortalActive === false && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 text-center font-medium">
                          Portal Closed by Administrator
                        </div>
                      )}

                      {/* Login Button Mockup */}
                      <div
                        style={{
                          backgroundColor: customization.loginButtonBgColor || '#0064e0',
                          color: customization.loginButtonTextColor || '#ffffff',
                        }}
                        className={`w-full py-3 rounded-full text-center text-xs font-medium shadow-xs ${
                          customization.isPortalActive === false ? 'opacity-50' : ''
                        }`}
                      >
                        {customization.loginButtonText || 'Log in'}
                      </div>

                      {/* Forgotten Password Mockup */}
                      {customization.showForgotPassword !== false && (
                        <div className="text-center text-xs text-gray-500 py-1 font-medium">
                          {customization.forgotPasswordText || 'Forgotten password?'}
                        </div>
                      )}
                    </div>

                    {/* Bottom Mockup */}
                    <div className="pt-8 pb-2 space-y-4">
                      {customization.showCreateAccount !== false && (
                        <div
                          style={{
                            borderColor: customization.createAccountBorderColor || '#0064e0',
                            color: customization.createAccountTextColor || '#0064e0',
                          }}
                          className="w-full py-2.5 rounded-full border-[1.5px] text-center text-xs font-medium"
                        >
                          {customization.createAccountButtonText || 'Create new account'}
                        </div>
                      )}

                      <TemaFooterBrand customization={customization} className="pt-1" />
                    </div>
                  </div>
                ) : (
                  /* Simulated Receipt Slip Preview (matches Screenshot 3) */
                  <div className="bg-slate-100 rounded-b-2xl border-x-2 border-b-2 border-slate-900 p-4 shadow-xl max-w-sm mx-auto font-sans">
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
                      {/* Top Header */}
                      <div className="bg-gradient-to-b from-blue-600 to-[#0064e0] px-4 pt-5 pb-4 text-white text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-500 shadow-sm">
                          <Check className="w-7 h-7 stroke-[2.5]" />
                        </div>
                        <h4 className="text-sm font-bold">
                          {customization.successPageTitle || 'Attendance Verified & Recorded'}
                        </h4>
                        <p className="text-[10px] text-blue-100 mt-0.5">
                          {customization.successPageSubtitle || 'Institutional Student Attendance Management System'}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>Status: Late (Verified)</span>
                        </div>
                      </div>

                      {/* Mockup Card */}
                      <div className="p-4 space-y-3">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] space-y-2">
                          <div className="flex justify-between pb-1.5 border-b border-gray-200 text-[10px]">
                            <span className="text-gray-500">Receipt Ref:</span>
                            <span className="font-mono font-semibold">ATT_DEMO123</span>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500">Student Name</div>
                            <div className="font-bold text-gray-900">Student (STUDENT@EXAMPLE.COM)</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500">Matriculation Number</div>
                            <div className="font-bold text-[#0064e0]">CSC/2021/0492</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500">Course & Department</div>
                            <div className="font-medium text-gray-700">CSC 401 • Computer Science (400L)</div>
                          </div>
                        </div>

                        {/* Notice */}
                        <p className="text-[10px] text-gray-500 text-center leading-tight">
                          {customization.successPageNotice || "Your login and check-in timestamp have been safely submitted to the lecturer's attendance register."}
                        </p>

                        {/* Buttons Preview with order & toggles */}
                        <div className="space-y-1.5 pt-1">
                          {customization.successButtonOrder === 'print_first' ? (
                            <>
                              {customization.showSuccessPrintButton !== false && (
                                <div className="w-full py-2 bg-[#0064e0] text-white rounded-full text-center text-xs font-medium">
                                  {customization.successPrintButtonText || 'Print Attendance Slip'}
                                </div>
                              )}
                              {customization.showSuccessDoneButton !== false && (
                                <div className="w-full py-1.5 border border-gray-300 text-gray-700 rounded-full text-center text-[11px] font-medium">
                                  {customization.successDoneButtonText || 'Done / Return to Login'}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {customization.showSuccessDoneButton !== false && (
                                <div className="w-full py-2 bg-[#0064e0] text-white rounded-full text-center text-xs font-medium">
                                  {customization.successDoneButtonText || 'Done / Return to Login'}
                                </div>
                              )}
                              {customization.showSuccessPrintButton !== false && (
                                <div className="w-full py-1.5 border border-gray-300 text-gray-700 rounded-full text-center text-[11px] font-medium">
                                  {customization.successPrintButtonText || 'Print Attendance Slip'}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD STUDENT */}
      {isAddStudentOpen && (
        <StudentFormModal
          title="Add New Student to Registry"
          onClose={() => setIsAddStudentOpen(false)}
          onSubmit={(data) => {
            registerOrUpdateStudent(data);
            refreshData();
            setIsAddStudentOpen(false);
          }}
        />
      )}

      {/* MODAL: EDIT STUDENT */}
      {editingStudent && (
        <StudentFormModal
          title={`Edit Student: ${editingStudent.matricNumber}`}
          initialData={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSubmit={(data) => {
            registerOrUpdateStudent({ ...editingStudent, ...data });
            refreshData();
            setEditingStudent(null);
          }}
        />
      )}

      {/* MODAL: FULL STUDENT PROFILE CARD */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          attendanceRecords={attendanceRecords.filter(
            (r) =>
              r.matricNumber.trim().toUpperCase() ===
              selectedStudentForProfile.matricNumber.trim().toUpperCase()
          )}
          onClose={() => setSelectedStudentForProfile(null)}
          onMarkPresent={() => {
            handleMarkDirectAttendance(selectedStudentForProfile.matricNumber);
            refreshData();
          }}
        />
      )}

      {/* CONFIRM MODAL: DELETE SINGLE STUDENT */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Student Record?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 font-semibold">{studentToDelete.fullName}</strong> ({studentToDelete.matricNumber})?
              </p>
              <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                This will permanently remove the student profile, credentials, and institutional record from both the local registry and Firebase Cloud Firestore.
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingleStudent}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Student</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: DELETE MARKED STUDENTS (BULK) */}
      {isBulkDeleteStudentsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Marked Students?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                You have marked <strong className="text-rose-600 font-bold">{selectedStudentIds.size} student(s)</strong> for deletion.
              </p>
              <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                All selected student records and passwords will be permanently deleted from both the local registry and Firebase Cloud Firestore.
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteStudentsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMarkedStudents}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {selectedStudentIds.size} Students</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: DELETE SINGLE ATTENDANCE RECORD */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Attendance Log Entry?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Are you sure you want to remove the log entry for <strong className="text-slate-900 font-semibold">{recordToDelete.studentName}</strong> ({recordToDelete.matricNumber}) recorded on {recordToDelete.date} at {recordToDelete.formattedTime}?
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingleRecord}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Log Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: DELETE MARKED ATTENDANCE LOGS (BULK) */}
      {isBulkDeleteLogsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Marked Attendance Logs?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                You have marked <strong className="text-rose-600 font-bold">{selectedRecordIds.size} attendance log(s)</strong> for deletion.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteLogsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMarkedRecords}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {selectedRecordIds.size} Logs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: ONE BUTTON TO DELETE ALL STUDENT LOGS */}
      {isConfirmClearLogsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete All Student Logs?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                This will permanently delete <strong className="text-rose-600 font-bold">all {attendanceRecords.length} student attendance log records</strong>.
              </p>
              <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                Warning: This completely wipes attendance logs from both local storage and Firebase Cloud Firestore. Student registry profiles will remain intact.
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmClearLogsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAllLogs}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Wipe All Logs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}
    </div>
  );
};

// Reusable Sub-Modal for Add / Edit Student
interface StudentFormModalProps {
  title: string;
  initialData?: Partial<Student>;
  onClose: () => void;
  onSubmit: (data: Partial<Student> & { matricNumber: string }) => void;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  title,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [matricNumber, setMatricNumber] = useState(initialData?.matricNumber || '');
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [department, setDepartment] = useState(initialData?.department || 'Computer Science');
  const [level, setLevel] = useState(initialData?.level || '400L');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [password, setPassword] = useState(initialData?.password || 'Student@123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricNumber.trim()) return;
    onSubmit({
      matricNumber: matricNumber.trim().toUpperCase(),
      fullName: fullName.trim() || `Student ${matricNumber}`,
      department,
      level,
      email: email.trim(),
      phone: phone.trim(),
      password: password.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Matric Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CSC/2021/0492"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium uppercase focus:ring-2 focus:ring-[#0064e0]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0064e0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0064e0]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#0064e0]"
              >
                <option value="100L">100L</option>
                <option value="200L">200L</option>
                <option value="300L">300L</option>
                <option value="400L">400L</option>
                <option value="500L">500L</option>
                <option value="PGD/MSc">PGD/MSc</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0064e0]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0064e0]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Student Password / Passcode
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#0064e0]"
            />
          </div>

          <div className="pt-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-full font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0064e0] hover:bg-blue-600 text-white rounded-full font-semibold shadow-xs"
            >
              Save Student Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Detailed Profile Inspection Modal
const StudentProfileModal: React.FC<{
  student: Student;
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
  onMarkPresent: () => void;
}> = ({ student, attendanceRecords, onClose, onMarkPresent }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Profile Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-base">{student.fullName}</h3>
              <p className="font-mono text-xs text-blue-400 font-semibold">{student.matricNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            ✕
          </button>
        </div>

        {/* Profile Details */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium">Department:</span>
              <div className="font-semibold text-slate-800 text-sm">{student.department}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Academic Level:</span>
              <div className="font-semibold text-slate-800 text-sm">{student.level}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Email:</span>
              <div className="text-slate-800 truncate">{student.email}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Phone:</span>
              <div className="text-slate-800">{student.phone}</div>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Stored Password:</span>
              <span className="font-mono text-sm font-bold text-[#0064e0] bg-white px-2 py-0.5 rounded border border-blue-200">
                {student.password}
              </span>
            </div>
          </div>

          {/* Attendance History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-sm">
                Attendance Check-In History ({attendanceRecords.length})
              </h4>
              <button
                onClick={onMarkPresent}
                className="px-2.5 py-1 bg-blue-50 text-[#0064e0] hover:bg-blue-100 rounded-lg font-semibold text-xs transition-colors"
              >
                + Check In Now
              </button>
            </div>

            {attendanceRecords.length === 0 ? (
              <p className="text-slate-400 italic text-xs py-3 text-center bg-slate-50 rounded-lg">
                No attendance logs found for this student.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {attendanceRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {r.sessionCode} • {r.date}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.formattedTime} • {r.deviceInfo}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
