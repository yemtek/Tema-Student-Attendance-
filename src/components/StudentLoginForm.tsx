import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { TemaCircleLogo, TemaFooterBrand } from './TemaBrand';
import { markAttendance } from '../services/storage';
import { AttendanceRecord, Student, AppCustomization } from '../types';

interface StudentLoginFormProps {
  onSuccess: (record: AttendanceRecord, student: Student) => void;
  onOpenCreateAccount: () => void;
  onOpenForgotPassword: () => void;
  onOpenLanguageModal: () => void;
  onOpenAdmin: () => void;
  currentLanguage: string;
  customization: AppCustomization;
  prefillMatric?: string;
  prefillPassword?: string;
}

export const StudentLoginForm: React.FC<StudentLoginFormProps> = ({
  onSuccess,
  onOpenCreateAccount,
  onOpenForgotPassword,
  onOpenLanguageModal,
  onOpenAdmin,
  currentLanguage,
  customization,
  prefillMatric = '',
  prefillPassword = '',
}) => {
  const [matricNumber, setMatricNumber] = useState(prefillMatric);
  const [password, setPassword] = useState(prefillPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedMatric, setIsFocusedMatric] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (prefillMatric) setMatricNumber(prefillMatric);
    if (prefillPassword) setPassword(prefillPassword);
  }, [prefillMatric, prefillPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricNumber.trim()) {
      setErrorMsg(`Please enter your ${customization.matricPlaceholder || 'Matric Number'}`);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      try {
        const result = markAttendance(matricNumber, password);
        setIsLoading(false);
        onSuccess(result.record, result.student);
      } catch (err) {
        setIsLoading(false);
        setErrorMsg('An error occurred during verification. Please try again.');
        console.error(err);
      }
    }, 450);
  };

  const displayLanguage = currentLanguage || customization.languageText || 'English (UK)';

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen sm:min-h-[780px] bg-white flex flex-col justify-between px-6 py-5 select-none relative font-sans">
      {/* Top Navigation Bar */}
      <div>
        <div className="flex items-center justify-between pt-1 pb-3 relative">
          {/* Back arrow on left */}
          {customization.showBackArrow !== false ? (
            <button
              type="button"
              onClick={() => {
                if (customization.disableBackArrowAction) return;
                setMatricNumber('');
                setPassword('');
                setErrorMsg('');
              }}
              title="Reset form"
              className="p-1 -ml-1 text-gray-900 hover:text-gray-600 rounded-full transition-colors active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
            </button>
          ) : (
            <div className="w-6 h-6" />
          )}

          {/* Centered language selector */}
          {customization.showLanguageSelector !== false ? (
            <button
              type="button"
              onClick={() => {
                if (customization.disableLanguageAction) return;
                onOpenLanguageModal();
              }}
              className="flex items-center gap-1 text-[15px] text-[#555555] hover:text-gray-800 transition-colors font-normal cursor-pointer"
            >
              <span>{displayLanguage}</span>
              <ChevronDown className="w-4 h-4 text-[#555555]" />
            </button>
          ) : (
            <div />
          )}

          {/* Spacer to keep language selector perfectly centered */}
          <div className="w-6 h-6" />
        </div>

        {/* Center Circular Logo */}
        <div className="flex flex-col items-center justify-center pt-8 pb-9">
          <TemaCircleLogo size={74} customization={customization} />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Matric Number Input */}
          <div className="relative">
            <div
              className={`flex items-center w-full h-[56px] px-4 rounded-[14px] border transition-all ${
                isFocusedMatric
                  ? 'border-[#1877F2] ring-1 ring-[#1877F2]'
                  : 'border-[#cfd4dc] hover:border-gray-400'
              } bg-white`}
            >
              <div className="flex-1 relative flex items-center">
                {/* Simulated vertical cursor when empty & focused to match screenshot */}
                {isFocusedMatric && !matricNumber && (
                  <span className="inline-block w-[1.5px] h-5 bg-gray-900 animate-pulse mr-0.5" />
                )}
                <input
                  type="text"
                  required
                  value={matricNumber}
                  onChange={(e) => {
                    setMatricNumber(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onFocus={() => setIsFocusedMatric(true)}
                  onBlur={() => setIsFocusedMatric(false)}
                  placeholder={customization.matricPlaceholder || 'Matric Number'}
                  autoComplete="username"
                  className="w-full bg-transparent text-[16px] text-gray-900 placeholder:text-[#65676b] focus:outline-none tracking-normal"
                />
              </div>

              {/* Info Icon Button */}
              {customization.showMatricInfoIcon !== false && (
                <button
                  type="button"
                  onClick={() => {
                    if (customization.disableMatricInfoAction) return;
                    setShowInfoTooltip(!showInfoTooltip);
                  }}
                  className="p-1 text-[#65676b] hover:text-gray-800 transition-colors rounded-full cursor-pointer"
                  title="Format Information"
                >
                  <Info className="w-5 h-5 stroke-[1.8]" />
                </button>
              )}
            </div>

            {/* Info popover tooltip */}
            {showInfoTooltip && (
              <div className="absolute left-0 right-0 top-full mt-1.5 p-3.5 bg-slate-900 text-white rounded-xl text-xs z-20 shadow-xl border border-slate-700 animate-in fade-in">
                <div className="font-semibold text-blue-400 mb-1 flex items-center justify-between">
                  <span>{customization.matricInfoTitle || 'Matric Number Format'}</span>
                  <button
                    type="button"
                    onClick={() => setShowInfoTooltip(false)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {customization.matricInfoDesc ||
                    'Enter your registered institutional matric number (e.g. CSC/2021/0492 or SWE/2021/0104).'}
                </p>
              </div>
            )}
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="flex items-center w-full h-[56px] px-4 rounded-[14px] border border-[#cfd4dc] hover:border-gray-400 focus-within:border-[#1877F2] focus-within:ring-1 focus-within:ring-[#1877F2] transition-all bg-white">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={customization.passwordPlaceholder || 'Password'}
                autoComplete="current-password"
                className="w-full bg-transparent text-[16px] text-gray-900 placeholder:text-[#65676b] focus:outline-none"
              />

              {customization.showPasswordToggle !== false && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-[#65676b] hover:text-gray-800 transition-colors rounded-full cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 stroke-[1.8]" />
                  ) : (
                    <Eye className="w-5 h-5 stroke-[1.8]" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Portal Inactive Banner */}
          {customization.isPortalActive === false && (
            <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 text-center font-medium">
              Attendance portal is currently closed by the administrator.
            </div>
          )}

          {/* Error notification */}
          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Primary "Log in" Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading || customization.isPortalActive === false}
              style={{
                backgroundColor: customization.loginButtonBgColor || '#0064e0',
                color: customization.loginButtonTextColor || '#ffffff',
              }}
              className="w-full h-[48px] hover:opacity-95 active:scale-[0.99] font-medium text-[16px] rounded-full transition-all flex items-center justify-center shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                customization.loginButtonText || 'Log in'
              )}
            </button>
          </div>

          {/* "Forgotten password?" Link */}
          {customization.showForgotPassword !== false && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={(e) => {
                  if (customization.disableForgotPasswordAction) {
                    e.preventDefault();
                    return; // Disabled: Does NOT react after clicking
                  }
                  onOpenForgotPassword();
                }}
                className="text-[#4b5563] hover:text-gray-900 text-[15px] font-medium transition-colors cursor-pointer"
              >
                {customization.forgotPasswordText || 'Forgotten password?'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Bottom Section: "Create new account" & Footer Branding */}
      <div className="pt-10 pb-4 space-y-5">
        {customization.showCreateAccount !== false && (
          <button
            type="button"
            onClick={(e) => {
              if (customization.disableCreateAccountAction) {
                e.preventDefault();
                return; // Disabled: Does NOT react after clicking
              }
              onOpenCreateAccount();
            }}
            style={{
              borderColor: customization.createAccountBorderColor || '#0064e0',
              color: customization.createAccountTextColor || '#0064e0',
            }}
            className="w-full h-[46px] border-[1.5px] hover:bg-blue-50/50 active:bg-blue-100/50 font-medium text-[15px] rounded-full transition-all flex items-center justify-center cursor-pointer"
          >
            {customization.createAccountButtonText || 'Create new account'}
          </button>
        )}

        <div className="flex justify-center">
          <TemaFooterBrand
            customization={customization}
            onHoldAdmin={onOpenAdmin}
            holdSeconds={15}
            className="pt-1 pb-1"
          />
        </div>
      </div>
    </div>
  );
};
