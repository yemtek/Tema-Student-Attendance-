import React, { useState, useEffect } from 'react';
import { StudentLoginForm } from './components/StudentLoginForm';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginForm } from './components/AdminLoginForm';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { CreateAccountModal } from './components/CreateAccountModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { StudentSuccessModal } from './components/StudentSuccessModal';
import { AttendanceRecord, Student, AppCustomization } from './types';
import { getCustomization, getAdminSecretSlug, initializeFirebaseSync } from './services/storage';

function isSecretAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const secretSlug = getAdminSecretSlug().toLowerCase();
  const hash = window.location.hash.replace(/^#/, '').trim().toLowerCase();
  const queryKey = new URLSearchParams(window.location.search).get('key')?.trim().toLowerCase();

  // Explicitly reject predictable guesses like "admin", "administrator"
  if (hash === 'admin' || hash === 'administrator' || hash === '/admin') {
    window.location.hash = '';
    return false;
  }

  return (hash.length > 0 && hash === secretSlug) || (!!queryKey && queryKey === secretSlug);
}

export default function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'LOGIN' | 'ADMIN_LOGIN' | 'ADMIN'>(() => {
    return isSecretAdminRoute() ? 'ADMIN_LOGIN' : 'LOGIN';
  });

  const [customization, setCustomization] = useState<AppCustomization>(() => getCustomization());
  const [currentLanguage, setCurrentLanguage] = useState(() => getCustomization().languageText || 'English (UK)');
  const [quickNotice, setQuickNotice] = useState('');

  // Sync with live Firebase Firestore on boot
  useEffect(() => {
    initializeFirebaseSync().then(() => {
      setCustomization(getCustomization());
    });
  }, []);

  // Modals state
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Success attendance modal state
  const [successRecord, setSuccessRecord] = useState<AttendanceRecord | null>(null);
  const [successStudent, setSuccessStudent] = useState<Student | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Auto-filled credentials from modal
  const [prefillMatric, setPrefillMatric] = useState('');
  const [prefillPassword, setPrefillPassword] = useState('');

  // Handle URL hash changes (opens Admin login or admin panel if authenticated)
  useEffect(() => {
    const handleRouteSync = () => {
      if (isSecretAdminRoute()) {
        if (isAdminAuthenticated) {
          setCurrentView('ADMIN');
        } else {
          setCurrentView('ADMIN_LOGIN');
        }
      } else {
        if (currentView !== 'LOGIN') {
          setCurrentView('LOGIN');
        }
      }
    };

    window.addEventListener('hashchange', handleRouteSync);
    return () => window.removeEventListener('hashchange', handleRouteSync);
  }, [isAdminAuthenticated, currentView]);

  const handleLoginSuccess = (record: AttendanceRecord, student: Student) => {
    setSuccessRecord(record);
    setSuccessStudent(student);

    // Mini pop-up notification (customizable template & colors)
    if (customization.showMiniPopup !== false) {
      const template = customization.miniPopupText || 'Attendance recorded successfully for {student}!';
      const renderedMsg = template
        .replace(/\{student\}/gi, student.fullName)
        .replace(/\{name\}/gi, student.fullName)
        .replace(/\{matric\}/gi, student.matricNumber)
        .replace(/\{time\}/gi, record.formattedTime);
      setQuickNotice(renderedMsg);
      setTimeout(() => setQuickNotice(''), 4500);
    }

    if (customization.showSuccessPage !== false) {
      setIsSuccessModalOpen(true);
    }
  };

  const handleAccountCreated = (student: Student) => {
    setPrefillMatric(student.matricNumber);
    setPrefillPassword(student.password);
  };

  const handleAutoFillFromRecovery = (matric: string, pass: string) => {
    setPrefillMatric(matric);
    setPrefillPassword(pass);
  };

  const handleBackToLogin = () => {
    setIsAdminAuthenticated(false);
    window.location.hash = '';
    setCurrentView('LOGIN');
  };

  const handleOpenAdmin = () => {
    const secretSlug = getAdminSecretSlug();
    window.location.hash = `#${secretSlug}`;
    if (isAdminAuthenticated) {
      setCurrentView('ADMIN');
    } else {
      setCurrentView('ADMIN_LOGIN');
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentView('ADMIN');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Mini pop-up toast notice (customizable in Admin panel) */}
      {quickNotice && customization.showMiniPopup !== false && (
        <div
          style={{
            backgroundColor: customization.miniPopupBgColor || '#059669',
            color: customization.miniPopupTextColor || '#ffffff',
          }}
          className={`fixed z-50 max-w-[90vw] sm:max-w-md px-5 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in transition-all ${
            customization.miniPopupPosition === 'bottom'
              ? 'bottom-6 left-1/2 -translate-x-1/2'
              : 'top-4 left-1/2 -translate-x-1/2'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {customization.miniPopupShowIcon !== false && (
              <span className="shrink-0 font-bold">
                {customization.miniPopupIconType === 'sparkle' ? '✦' :
                 customization.miniPopupIconType === 'bell' ? '🔔' :
                 customization.miniPopupIconType === 'none' ? '' : '✓'}
              </span>
            )}
            <span className="truncate">{quickNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setQuickNotice('')}
            className="shrink-0 opacity-75 hover:opacity-100 font-bold text-xs cursor-pointer ml-1"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main View Area */}
      {currentView === 'ADMIN' && isAdminAuthenticated ? (
        <div className="w-full">
          <AdminPanel
            onBackToLogin={handleBackToLogin}
            onCustomizationUpdated={(updated) => {
              setCustomization(updated);
              if (updated.languageText) setCurrentLanguage(updated.languageText);
            }}
          />
        </div>
      ) : currentView === 'ADMIN_LOGIN' ? (
        <div className="w-full">
          <AdminLoginForm
            onSuccess={handleAdminLoginSuccess}
            onCancel={handleBackToLogin}
          />
        </div>
      ) : (
        <div className="w-full flex-1 flex flex-col justify-center items-center bg-white">
          <div className="w-full max-w-[420px] bg-white min-h-screen sm:min-h-0 flex flex-col justify-between">
            {/* 100% Exact Replica Form with ZERO admin indicators or click triggers */}
            <StudentLoginForm
              currentLanguage={currentLanguage}
              customization={customization}
              prefillMatric={prefillMatric}
              prefillPassword={prefillPassword}
              onSuccess={handleLoginSuccess}
              onOpenCreateAccount={() => setIsCreateAccountOpen(true)}
              onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
              onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
              onOpenAdmin={handleOpenAdmin}
            />
          </div>
        </div>
      )}

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        currentLang={currentLanguage}
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        onSelect={(lang) => setCurrentLanguage(lang)}
      />

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onSuccess={handleAccountCreated}
      />

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onAutoFill={handleAutoFillFromRecovery}
      />

      {/* Attendance Success Modal (Receipt Slip) */}
      <StudentSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        record={successRecord}
        student={successStudent}
        customization={customization}
      />
    </div>
  );
}
