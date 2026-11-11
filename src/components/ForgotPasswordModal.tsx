import React, { useState } from 'react';
import { X, Search, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { getStudents } from '../services/storage';
import { Student } from '../types';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFill: (matric: string, pass: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onAutoFill,
}) => {
  const [matricSearch, setMatricSearch] = useState('');
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const students = getStudents();
    const query = matricSearch.trim().toUpperCase();
    const found = students.find(
      (s) =>
        s.matricNumber.trim().toUpperCase() === query ||
        s.email.toLowerCase() === matricSearch.trim().toLowerCase()
    );
    setFoundStudent(found || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0064e0] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Student Account Recovery</h3>
              <p className="text-xs text-gray-500">Retrieve your institutional login passcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700">
              Enter your Matriculation Number or University Email:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CSC/2021/0492"
                value={matricSearch}
                onChange={(e) => {
                  setMatricSearch(e.target.value);
                  setSearched(false);
                }}
                className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0064e0] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                Find
              </button>
            </div>
          </form>

          {searched && foundStudent && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Record Located!
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>
                  <span className="font-semibold">Student Name:</span> {foundStudent.fullName}
                </div>
                <div>
                  <span className="font-semibold">Department:</span> {foundStudent.department} (
                  {foundStudent.level})
                </div>
                <div>
                  <span className="font-semibold">Matric No:</span> {foundStudent.matricNumber}
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-blue-100 mt-2">
                  <span className="text-xs font-semibold text-gray-600">Registered Password:</span>
                  <div className="font-mono text-sm font-bold text-[#0064e0] mt-0.5 select-all">
                    {foundStudent.password}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onAutoFill(foundStudent.matricNumber, foundStudent.password);
                  onClose();
                }}
                className="w-full mt-2 py-2 bg-[#0064e0] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Auto-fill in Login Form & Continue
              </button>
            </div>
          )}

          {searched && !foundStudent && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Matric Number Not Yet Registered
              </div>
              <p>
                No student account found for &quot;{matricSearch}&quot;. You can create a new account
                directly or enter any password during login to automatically register!
              </p>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-gray-500">
            For department clearance or institutional password resets, contact your department exam officer or admin.
          </div>
        </div>
      </div>
    </div>
  );
};
