import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck } from 'lucide-react';
import { Student } from '../types';
import { registerOrUpdateStudent } from '../services/storage';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: Student) => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [matricNumber, setMatricNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [faculty, setFaculty] = useState('Physical Sciences');
  const [level, setLevel] = useState('400L');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricNumber.trim()) {
      setError('Please provide a valid Matriculation Number');
      return;
    }
    if (!fullName.trim()) {
      setError('Please provide your full legal name');
      return;
    }
    if (!password.trim()) {
      setError('Please choose a secure password');
      return;
    }

    const newStudent = registerOrUpdateStudent({
      matricNumber: matricNumber.trim().toUpperCase(),
      fullName: fullName.trim(),
      department,
      faculty,
      level,
      email: email.trim() || `${matricNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@university.edu.ng`,
      phone: phone.trim() || '+234 800 000 0000',
      password: password.trim(),
    });

    onSuccess(newStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="bg-[#0064e0] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
              T
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Create Student Account</h3>
              <p className="text-xs text-blue-100">Institutional Student Profile & Attendance Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Matric Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CSC/2021/0492"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="First Lastname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Accounting">Accounting</option>
                <option value="Economics">Economics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Academic Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
              >
                <option value="100L">100 Level (Freshman)</option>
                <option value="200L">200 Level (Sophomore)</option>
                <option value="300L">300 Level (Penultimate)</option>
                <option value="400L">400 Level (Finalist)</option>
                <option value="500L">500 Level (Eng/Med)</option>
                <option value="PGD/MSc">Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Student Email (Optional)
              </label>
              <input
                type="email"
                placeholder="student@university.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Create Password *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. StudentPass@2026"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
            />
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Credentials will be linked to your Matric Number for quick attendance sign-in.
            </p>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-[#0064e0] text-white rounded-full font-medium text-sm hover:bg-[#0052b8] transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Register Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
