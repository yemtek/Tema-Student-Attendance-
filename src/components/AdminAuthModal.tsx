import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Key, ArrowRight } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin' || password === 'admin123' || password === 'tema2026' || password === '1234') {
      setError('');
      onAuthenticated();
      onClose();
    } else {
      setError('Incorrect administrator passcode. (Hint: use "admin" or click Quick Access below)');
    }
  };

  const handleQuickAccess = () => {
    setPassword('admin');
    setError('');
    onAuthenticated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Admin Portal Access</h3>
              <p className="text-xs text-slate-400">Lecturer & Registrar Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Administrator Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter admin passcode"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0064e0]"
              />
              <Key className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
              {error}
            </p>
          )}

          <div className="pt-1 space-y-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-[#0064e0] hover:bg-blue-700 text-white rounded-full font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Unlock Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleQuickAccess}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              1-Click Demo Admin Access (admin)
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center pt-1">
            Default passcodes: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">admin</code> or <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">admin123</code>
          </p>
        </form>
      </div>
    </div>
  );
};
