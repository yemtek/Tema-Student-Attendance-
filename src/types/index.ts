export interface Student {
  id: string;
  matricNumber: string;
  fullName: string;
  department: string;
  faculty: string;
  level: string; // e.g. "100L", "200L", "300L", "400L", "500L"
  email: string;
  phone: string;
  password: string; // Preserved for retrieval by admin as requested
  registeredAt: string;
  totalAttendances: number;
  lastLogin?: string;
  status: 'Active' | 'Suspended' | 'Alumni';
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  department: string;
  level: string;
  sessionCode: string;
  sessionTitle: string;
  timestamp: string; // ISO string
  formattedTime: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Late' | 'Excused';
  deviceInfo: string;
  ipAddress: string;
  location?: string;
  notes?: string;
}

export interface SessionConfig {
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  hallLocation: string;
  startTime: string; // e.g. "08:00"
  lateThresholdTime: string; // e.g. "08:30"
  sessionActive: boolean;
  academicSession: string; // e.g. "2025/2026 Academic Session"
  semester: string; // e.g. "First Semester"
}

export interface AppCustomization {
  // Top Navigation
  languageText: string;
  showLanguageSelector?: boolean;
  disableLanguageAction?: boolean; // When true: visible, but does NOT react after clicking
  showBackArrow?: boolean;
  disableBackArrowAction?: boolean; // When true: visible, but does NOT react after clicking

  // Main Center Logo
  logoType: 'letter' | 'image';
  logoLetter: string;
  logoImageUrl: string;
  logoBgColor: string;
  logoTextColor: string;

  // Inputs
  matricPlaceholder: string;
  matricInfoTitle: string;
  matricInfoDesc: string;
  showMatricInfoIcon?: boolean;
  disableMatricInfoAction?: boolean; // When true: visible, but does NOT react after clicking
  passwordPlaceholder: string;
  showPasswordToggle?: boolean;

  // Buttons & Links & Toggles
  loginButtonText: string;
  loginButtonBgColor: string;
  loginButtonTextColor: string;

  forgotPasswordText: string;
  showForgotPassword?: boolean;
  disableForgotPasswordAction?: boolean; // When true: visible, but does NOT react after clicking

  createAccountButtonText: string;
  createAccountBorderColor: string;
  createAccountTextColor: string;
  showCreateAccount?: boolean;
  disableCreateAccountAction?: boolean; // When true: visible, but does NOT react after clicking

  // Button order switcher
  buttonOrder?: 'login_first' | 'create_first';

  // Whole Attendance Portal On/Off
  isPortalActive?: boolean;
  closedPortalMessage?: string;

  // Success Confirmation Slip Page (from screenshot)
  showSuccessPage?: boolean;
  successPageTitle?: string;
  successPageSubtitle?: string;
  successPageNotice?: string;
  successDoneButtonText?: string;
  successPrintButtonText?: string;
  showSuccessDoneButton?: boolean;
  disableSuccessDoneAction?: boolean; // When true: visible, but does NOT react after clicking
  showSuccessPrintButton?: boolean;
  disableSuccessPrintAction?: boolean; // When true: visible, but does NOT react after clicking
  successButtonOrder?: 'done_first' | 'print_first';

  // Footer Branding
  footerBrandName: string;
  footerBrandIconType: 'meta' | 'custom_text' | 'image';
  footerBrandIconText: string;
  footerBrandImageUrl: string;
  footerBrandColor: string;

  // Mini Pop-up Toast Notification (Quick Confirmation Pill from screenshot)
  showMiniPopup?: boolean;
  miniPopupText?: string;
  miniPopupBgColor?: string;
  miniPopupTextColor?: string;
  miniPopupShowIcon?: boolean;
  miniPopupIconType?: 'check' | 'sparkle' | 'bell' | 'none';
  miniPopupPosition?: 'top' | 'bottom';
}

