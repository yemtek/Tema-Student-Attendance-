import React from 'react';
import { X, Check } from 'lucide-react';

interface LanguageSelectorProps {
  currentLang: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lang: string) => void;
}

export const languages = [
  { code: 'en-GB', name: 'English (UK)', regional: 'English (UK)' },
  { code: 'en-US', name: 'English (US)', regional: 'English (US)' },
  { code: 'fr', name: 'Français', regional: 'Français (France)' },
  { code: 'es', name: 'Español', regional: 'Español' },
  { code: 'pt', name: 'Português', regional: 'Português (Brasil)' },
  { code: 'ha', name: 'Hausa', regional: 'Harshen Hausa' },
  { code: 'yo', name: 'Yorùbá', regional: 'Èdè Yorùbá' },
  { code: 'ig', name: 'Igbo', regional: 'Asụsụ Igbo' },
  { code: 'ar', name: 'العربية', regional: 'Arabic' },
  { code: 'sw', name: 'Kiswahili', regional: 'Kiswahili' },
  { code: 'de', name: 'Deutsch', regional: 'Deutsch' },
];

export const LanguageSelectorModal: React.FC<LanguageSelectorProps> = ({
  currentLang,
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-lg">Select Language</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto divide-y divide-gray-100 py-1">
          {languages.map((lang) => {
            const isSelected = currentLang === lang.name;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  onSelect(lang.name);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${
                  isSelected ? 'bg-blue-50/70 text-[#0064e0] font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="text-[15px]">{lang.name}</div>
                  <div className="text-xs text-gray-400">{lang.regional}</div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-[#0064e0]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
