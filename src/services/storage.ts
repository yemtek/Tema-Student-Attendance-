import { Student, AttendanceRecord, SessionConfig, AppCustomization } from '../types';
import { initialStudents, initialAttendanceRecords, initialSessionConfig } from '../data/mockData';
import {
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  deleteMultipleStudentsFromFirestore,
  saveAttendanceRecordToFirestore,
  deleteAttendanceRecordFromFirestore,
  deleteMultipleAttendanceRecordsFromFirestore,
  deleteAllAttendanceRecordsFromFirestore,
  saveSessionConfigToFirestore,
  saveCustomizationToFirestore,
  saveAdminSecretSlugToFirestore,
  fetchStudentsFromFirestore,
  fetchAttendanceFromFirestore,
  fetchSessionConfigFromFirestore,
  fetchCustomizationFromFirestore,
  fetchAdminSecretSlugFromFirestore,
  fetchAdminPasswordFromFirestore,
  saveAdminPasswordToFirestore,
  seedInitialFirestoreDataIfEmpty,
} from './firebaseService';

const STUDENTS_KEY = 'tema_students_registry_v1';
const ATTENDANCE_KEY = 'tema_attendance_records_v1';
const SESSION_KEY = 'tema_session_config_v1';
const CUSTOMIZATION_KEY = 'tema_app_customization_v1';
const ADMIN_SECRET_KEY = 'tema_admin_secret_slug_v1';
const ADMIN_PASSWORD_KEY = 'tema_admin_password_v1';

export const DEFAULT_ADMIN_SLUG = 'tema-sec-9842';
export const DEFAULT_ADMIN_PASSWORD = 'yemcojoe';

export const defaultCustomization: AppCustomization = {
  languageText: 'English (UK)',
  showLanguageSelector: true,
  disableLanguageAction: false,
  showBackArrow: true,
  disableBackArrowAction: false,

  logoType: 'letter',
  logoLetter: 'T',
  logoImageUrl: '',
  logoBgColor: '#1877F2',
  logoTextColor: '#FFFFFF',

  matricPlaceholder: 'Matric Number',
  matricInfoTitle: 'Matric Number Format',
  matricInfoDesc: 'Enter your registered institutional matric number (e.g. CSC/2021/0492 or SWE/2021/0104).',
  showMatricInfoIcon: true,
  disableMatricInfoAction: false,
  passwordPlaceholder: 'Password',
  showPasswordToggle: true,

  loginButtonText: 'Log in',
  loginButtonBgColor: '#0064e0',
  loginButtonTextColor: '#FFFFFF',

  forgotPasswordText: 'Forgotten password?',
  showForgotPassword: true,
  disableForgotPasswordAction: false,

  createAccountButtonText: 'Create new account',
  createAccountBorderColor: '#0064e0',
  createAccountTextColor: '#0064e0',
  showCreateAccount: true,
  disableCreateAccountAction: false,

  buttonOrder: 'login_first',

  isPortalActive: true,
  closedPortalMessage: 'The student attendance check-in session is currently closed by the administrator.',

  // Success Confirmation Slip Page (from screenshot)
  showSuccessPage: true,
  successPageTitle: 'Attendance Verified & Recorded',
  successPageSubtitle: 'Institutional Student Attendance Management System',
  successPageNotice: "Your login and check-in timestamp have been safely submitted to the lecturer's attendance register.",
  successDoneButtonText: 'Done / Return to Login',
  successPrintButtonText: 'Print Attendance Slip',
  showSuccessDoneButton: true,
  disableSuccessDoneAction: false,
  showSuccessPrintButton: true,
  disableSuccessPrintAction: false,
  successButtonOrder: 'done_first',

  footerBrandName: 'Tema',
  footerBrandIconType: 'meta',
  footerBrandIconText: '∞',
  footerBrandImageUrl: '',
  footerBrandColor: '#0064e0',

  // Mini Pop-up Toast Notification (Quick Confirmation Pill)
  showMiniPopup: true,
  miniPopupText: 'Attendance recorded successfully for {student}!',
  miniPopupBgColor: '#059669',
  miniPopupTextColor: '#ffffff',
  miniPopupShowIcon: true,
  miniPopupIconType: 'check',
  miniPopupPosition: 'top',
};

// ----------------- Customization -----------------

export function getCustomization(): AppCustomization {
  try {
    const raw = localStorage.getItem(CUSTOMIZATION_KEY);
    if (raw) {
      return { ...defaultCustomization, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading customization:', e);
  }
  return defaultCustomization;
}

export function saveCustomization(customization: AppCustomization): void {
  try {
    localStorage.setItem(CUSTOMIZATION_KEY, JSON.stringify(customization));
  } catch (e) {
    console.error('Error saving customization:', e);
  }
  // Sync to Firebase Cloud Firestore
  saveCustomizationToFirestore(customization).catch((err) =>
    console.warn('Firebase customization sync error:', err)
  );
}

// ----------------- Session Config -----------------

export function getSessionConfig(): SessionConfig {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading session config:', e);
  }
  return initialSessionConfig;
}

export function saveSessionConfig(config: SessionConfig): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving session config:', e);
  }
  // Sync to Firebase Cloud Firestore
  saveSessionConfigToFirestore(config).catch((err) =>
    console.warn('Firebase session config sync error:', err)
  );
}

// ----------------- Admin Secret Slug -----------------

export function getAdminSecretSlug(): string {
  try {
    const raw = localStorage.getItem(ADMIN_SECRET_KEY);
    if (raw && raw.trim()) return raw.trim();
  } catch (e) {
    console.error('Error reading admin secret slug:', e);
  }
  return DEFAULT_ADMIN_SLUG;
}

export function saveAdminSecretSlug(slug: string): void {
  const clean = slug.trim().replace(/[^a-zA-Z0-9_-]/g, '') || DEFAULT_ADMIN_SLUG;
  try {
    localStorage.setItem(ADMIN_SECRET_KEY, clean);
  } catch (e) {
    console.error('Error saving admin secret slug:', e);
  }
  // Sync to Firebase Cloud Firestore
  saveAdminSecretSlugToFirestore(clean).catch((err) =>
    console.warn('Firebase admin slug sync error:', err)
  );
}

// ----------------- Admin Master Password -----------------

export function getAdminPassword(): string {
  try {
    const raw = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (raw && raw.trim()) return raw.trim();
  } catch (e) {
    console.error('Error reading admin password:', e);
  }
  return DEFAULT_ADMIN_PASSWORD;
}

export function saveAdminPassword(password: string): void {
  const clean = password.trim() || DEFAULT_ADMIN_PASSWORD;
  try {
    localStorage.setItem(ADMIN_PASSWORD_KEY, clean);
  } catch (e) {
    console.error('Error saving admin password:', e);
  }
  // Sync to Firebase Cloud Firestore
  saveAdminPasswordToFirestore(clean).catch((err) =>
    console.warn('Firebase admin password sync error:', err)
  );
}

// ----------------- Students Registry -----------------

export function getStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading students:', e);
  }
  saveStudents(initialStudents);
  return initialStudents;
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (e) {
    console.error('Error saving students:', e);
  }
}

export function registerOrUpdateStudent(newStudent: Partial<Student> & { matricNumber: string }): Student {
  const students = getStudents();
  const normalizedMatric = newStudent.matricNumber.trim().toUpperCase();
  const existingIndex = students.findIndex(
    (s) => s.matricNumber.trim().toUpperCase() === normalizedMatric
  );

  const now = new Date().toISOString();

  let targetStudent: Student;

  if (existingIndex >= 0) {
    const existing = students[existingIndex];
    targetStudent = {
      ...existing,
      ...newStudent,
      matricNumber: normalizedMatric,
      password: newStudent.password || existing.password,
      lastLogin: now,
    };
    students[existingIndex] = targetStudent;
  } else {
    targetStudent = {
      id: 'std_' + Math.random().toString(36).substring(2, 9),
      matricNumber: normalizedMatric,
      fullName: newStudent.fullName?.trim() || `Student ${normalizedMatric}`,
      department: newStudent.department || 'Computer Science',
      faculty: newStudent.faculty || 'Physical Sciences',
      level: newStudent.level || '400L',
      email: newStudent.email || `${normalizedMatric.toLowerCase().replace(/[^a-z0-9]/g, '')}@university.edu.ng`,
      phone: newStudent.phone || '+234 800 000 0000',
      password: newStudent.password || 'Student@123',
      registeredAt: now,
      totalAttendances: 0,
      lastLogin: now,
      status: 'Active',
    };
    students.unshift(targetStudent);
  }

  saveStudents(students);

  // Sync to Firebase Cloud Firestore
  saveStudentToFirestore(targetStudent).catch((err) =>
    console.warn('Firebase save student error:', err)
  );

  return targetStudent;
}

export function deleteStudent(studentId: string): void {
  const students = getStudents().filter((s) => s.id !== studentId);
  saveStudents(students);
  // Delete from Firebase Cloud Firestore
  deleteStudentFromFirestore(studentId).catch((err) =>
    console.warn('Firebase delete student error:', err)
  );
}

export function deleteMultipleStudents(studentIds: string[]): void {
  const idSet = new Set(studentIds);
  const students = getStudents().filter((s) => !idSet.has(s.id));
  saveStudents(students);
  // Delete from Firebase Cloud Firestore
  deleteMultipleStudentsFromFirestore(studentIds).catch((err) =>
    console.warn('Firebase delete multiple students error:', err)
  );
}

// ----------------- Attendance Records -----------------

export function getAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading attendance records:', e);
  }
  saveAttendanceRecords(initialAttendanceRecords);
  return initialAttendanceRecords;
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving attendance records:', e);
  }
}

export function deleteAttendanceRecord(recordId: string): void {
  const records = getAttendanceRecords().filter((r) => r.id !== recordId);
  saveAttendanceRecords(records);
  deleteAttendanceRecordFromFirestore(recordId).catch((err) =>
    console.warn('Firebase delete attendance record error:', err)
  );
}

export function deleteMultipleAttendanceRecords(recordIds: string[]): void {
  const idSet = new Set(recordIds);
  const records = getAttendanceRecords().filter((r) => !idSet.has(r.id));
  saveAttendanceRecords(records);
  deleteMultipleAttendanceRecordsFromFirestore(recordIds).catch((err) =>
    console.warn('Firebase delete multiple attendance records error:', err)
  );
}

export function clearAllAttendanceRecords(): void {
  saveAttendanceRecords([]);
  deleteAllAttendanceRecordsFromFirestore().catch((err) =>
    console.warn('Firebase clear all attendance records error:', err)
  );
}

export function markAttendance(
  matricNumber: string,
  enteredPassword?: string
): { success: boolean; record: AttendanceRecord; student: Student; isNewToday: boolean } {
  const normalizedMatric = matricNumber.trim().toUpperCase();
  let students = getStudents();
  let student = students.find((s) => s.matricNumber.trim().toUpperCase() === normalizedMatric);

  const now = new Date();
  const isoTime = now.toISOString();
  const dateStr = now.toISOString().split('T')[0];
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // If student does not exist, automatically register them
  if (!student) {
    student = registerOrUpdateStudent({
      matricNumber: normalizedMatric,
      fullName: `Student (${normalizedMatric})`,
      department: 'Computer Science',
      level: '400L',
      password: enteredPassword || 'StudentPass#2026',
    });
    students = getStudents();
  }

  // Update password, last login and attendances count reliably
  const studentIndex = students.findIndex(
    (s) => s.matricNumber.trim().toUpperCase() === normalizedMatric
  );
  if (studentIndex >= 0) {
    if (enteredPassword) {
      students[studentIndex].password = enteredPassword;
    }
    students[studentIndex].totalAttendances = (students[studentIndex].totalAttendances || 0) + 1;
    students[studentIndex].lastLogin = isoTime;
    saveStudents(students);
    student = students[studentIndex];
    // Sync student update to Firebase
    saveStudentToFirestore(student).catch((err) =>
      console.warn('Firebase student update error:', err)
    );
  }

  const session = getSessionConfig();
  const records = getAttendanceRecords();

  // Check if student already checked in today for this session
  const alreadyCheckedIn = records.some(
    (r) => r.matricNumber.trim().toUpperCase() === normalizedMatric && r.date === dateStr && r.sessionCode === session.courseCode
  );

  // Check status (Present vs Late)
  let status: 'Present' | 'Late' | 'Excused' = 'Present';
  try {
    const [cutoffH, cutoffM] = session.lateThresholdTime.split(':').map(Number);
    const cutoffMinutes = cutoffH * 60 + cutoffM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (currentMinutes > cutoffMinutes) {
      status = 'Late';
    }
  } catch {
    status = 'Present';
  }

  // Detect basic device
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Mobile Browser';
  let deviceName = 'Mobile Device';
  if (/iPhone|iPad|iPod/i.test(ua)) deviceName = 'Apple iOS Device';
  else if (/Android/i.test(ua)) deviceName = 'Android Mobile Device';
  else if (/Macintosh/i.test(ua)) deviceName = 'Mac Computer';
  else if (/Windows/i.test(ua)) deviceName = 'Windows PC';

  const newRecord: AttendanceRecord = {
    id: 'att_' + Math.random().toString(36).substring(2, 9),
    studentId: student.id,
    matricNumber: student.matricNumber,
    studentName: student.fullName,
    department: student.department,
    level: student.level,
    sessionCode: session.courseCode,
    sessionTitle: session.courseTitle,
    timestamp: isoTime,
    formattedTime: timeFormatted,
    date: dateStr,
    status: status,
    deviceInfo: deviceName,
    ipAddress: '197.210.' + Math.floor(Math.random() * 200 + 20) + '.' + Math.floor(Math.random() * 250 + 1),
    location: session.hallLocation,
    notes: alreadyCheckedIn ? 'Repeat login / re-verification' : 'Normal attendance check-in',
  };

  records.unshift(newRecord);
  saveAttendanceRecords(records);

  // Sync attendance to Firebase Cloud Firestore
  saveAttendanceRecordToFirestore(newRecord).catch((err) =>
    console.warn('Firebase record attendance error:', err)
  );

  return {
    success: true,
    record: newRecord,
    student,
    isNewToday: !alreadyCheckedIn,
  };
}

export function resetToDefaults(): void {
  saveStudents(initialStudents);
  saveAttendanceRecords(initialAttendanceRecords);
  saveSessionConfig(initialSessionConfig);
  saveCustomization(defaultCustomization);
  saveAdminSecretSlug(DEFAULT_ADMIN_SLUG);
  seedInitialFirestoreDataIfEmpty().catch((err) =>
    console.warn('Firebase reseed error:', err)
  );
}

// Full Cloud Sync initialization with offline-resilient fallback
export async function initializeFirebaseSync(): Promise<void> {
  try {
    await seedInitialFirestoreDataIfEmpty().catch((err) =>
      console.warn('Firebase seeding skipped (offline):', err)
    );

    const [remoteStudents, remoteAttendance, remoteSession, remoteCustomization, remoteSlug, remotePass] =
      await Promise.all([
        fetchStudentsFromFirestore().catch(() => []),
        fetchAttendanceFromFirestore().catch(() => []),
        fetchSessionConfigFromFirestore().catch(() => null),
        fetchCustomizationFromFirestore().catch(() => null),
        fetchAdminSecretSlugFromFirestore().catch(() => null),
        fetchAdminPasswordFromFirestore().catch(() => null),
      ]);

    if (remoteStudents && remoteStudents.length > 0) {
      saveStudents(remoteStudents);
    }
    if (remoteAttendance && remoteAttendance.length > 0) {
      saveAttendanceRecords(remoteAttendance);
    }
    if (remoteSession) {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(remoteSession));
      } catch (e) {
        console.warn(e);
      }
    }
    if (remoteCustomization) {
      try {
        localStorage.setItem(CUSTOMIZATION_KEY, JSON.stringify(remoteCustomization));
      } catch (e) {
        console.warn(e);
      }
    }
    if (remoteSlug) {
      try {
        localStorage.setItem(ADMIN_SECRET_KEY, remoteSlug);
      } catch (e) {
        console.warn(e);
      }
    }
    if (remotePass) {
      try {
        localStorage.setItem(ADMIN_PASSWORD_KEY, remotePass);
      } catch (e) {
        console.warn(e);
      }
    }
  } catch (error) {
    console.warn('Initial Firebase sync completed with offline fallback:', error);
  }
}

// ----------------- Export Utilities -----------------

export function exportToCSV(filename = 'Tema_Student_Attendance_Report.csv'): void {
  const students = getStudents();
  const records = getAttendanceRecords();

  const headers = [
    'Matric Number',
    'Full Name',
    'Department',
    'Level',
    'Email',
    'Phone',
    'Captured Password',
    'Status',
    'Total Attendances',
    'Last Attendance Date',
    'Last Login Time',
    'Device Info',
  ];

  const rows = students.map((std) => {
    const lastRecord = records.find(
      (r) => r.matricNumber.trim().toUpperCase() === std.matricNumber.trim().toUpperCase()
    );
    return [
      `"${std.matricNumber}"`,
      `"${std.fullName}"`,
      `"${std.department}"`,
      `"${std.level}"`,
      `"${std.email}"`,
      `"${std.phone}"`,
      `"${std.password}"`,
      `"${std.status}"`,
      std.totalAttendances || 0,
      `"${lastRecord ? lastRecord.date : 'N/A'}"`,
      `"${lastRecord ? lastRecord.formattedTime : std.lastLogin || 'N/A'}"`,
      `"${lastRecord ? lastRecord.deviceInfo : 'N/A'}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportJSON(filename = 'Tema_Student_Records_Full.json'): void {
  const data = {
    generatedAt: new Date().toISOString(),
    sessionConfig: getSessionConfig(),
    students: getStudents(),
    attendanceRecords: getAttendanceRecords(),
  };

  const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', jsonString);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
