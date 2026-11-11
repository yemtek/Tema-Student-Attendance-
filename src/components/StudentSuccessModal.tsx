import React from 'react';
import { CheckCircle2, Clock, Calendar, User, BookOpen, ShieldCheck, Printer } from 'lucide-react';
import { AttendanceRecord, Student, AppCustomization } from '../types';

interface StudentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  student: Student | null;
  customization?: AppCustomization;
  onOpenAdmin?: () => void;
}

export const StudentSuccessModal: React.FC<StudentSuccessModalProps> = ({
  isOpen,
  onClose,
  record,
  student,
  customization,
}) => {
  if (!isOpen || !record || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const title = customization?.successPageTitle || 'Attendance Verified & Recorded';
  const subtitle = customization?.successPageSubtitle || 'Institutional Student Attendance Management System';
  const notice = customization?.successPageNotice || "Your login and check-in timestamp have been safely submitted to the lecturer's attendance register.";
  const doneText = customization?.successDoneButtonText || 'Done / Return to Login';
  const printText = customization?.successPrintButtonText || 'Print Attendance Slip';
  const showDone = customization?.showSuccessDoneButton !== false;
  const showPrint = customization?.showSuccessPrintButton !== false;
  const isPrintFirst = customization?.successButtonOrder === 'print_first';

  const renderDoneButton = (isPrimary: boolean) => (
    <button
      type="button"
      onClick={onClose}
      className={`w-full py-3 rounded-full font-medium text-sm transition-all cursor-pointer ${
        isPrimary
          ? 'bg-[#0064e0] hover:bg-blue-700 text-white shadow-sm'
          : 'border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs py-2.5'
      }`}
    >
      {doneText}
    </button>
  );

  const renderPrintButton = (isPrimary: boolean) => (
    <button
      type="button"
      onClick={handlePrint}
      className={`w-full py-2.5 px-3 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
        isPrimary
          ? 'bg-[#0064e0] hover:bg-blue-700 text-white shadow-sm py-3 text-sm'
          : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
      }`}
    >
      <Printer className="w-3.5 h-3.5" />
      <span>{printText}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Top Header Badge */}
        <div className="bg-gradient-to-b from-blue-600 to-[#0064e0] px-6 pt-8 pb-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md text-[#0064e0]">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <p className="text-xs text-blue-100 mt-1">{subtitle}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                record.status === 'Present' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            Status: {record.status} (Verified)
          </div>
        </div>

        {/* Digital Attendance Slip */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3 font-sans">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 text-xs">
              <span className="text-gray-500">Receipt Ref:</span>
              <span className="font-mono font-semibold text-gray-800">{record.id.toUpperCase()}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Student Name</div>
                  <div className="font-semibold text-gray-900">{student.fullName}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Matriculation Number</div>
                  <div className="font-mono font-bold text-[#0064e0]">{student.matricNumber}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Course & Department</div>
                  <div className="font-medium text-gray-800 text-xs">
                    {record.sessionCode} • {student.department} ({student.level})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{record.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 justify-end">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-800">{record.formattedTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="text-[11px] text-gray-500 text-center leading-relaxed">
            {notice}
          </div>

          {/* Action Buttons with order switching & toggles */}
          <div className="space-y-2 pt-2">
            {isPrintFirst ? (
              <>
                {showPrint && renderPrintButton(true)}
                {showDone && renderDoneButton(false)}
              </>
            ) : (
              <>
                {showDone && renderDoneButton(true)}
                {showPrint && renderPrintButton(false)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
