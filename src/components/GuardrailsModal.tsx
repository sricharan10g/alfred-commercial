import React, { useState, useEffect } from 'react';
import { X, Save, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Guardrails } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialGuardrails: Guardrails;
  onSave: (g: Guardrails) => void;
}

const GuardrailsModal: React.FC<Props> = ({ isOpen, onClose, initialGuardrails, onSave }) => {
  const [dos, setDos] = useState(initialGuardrails.dos);
  const [donts, setDonts] = useState(initialGuardrails.donts);

  useEffect(() => {
    if (isOpen) {
        setDos(initialGuardrails.dos);
        setDonts(initialGuardrails.donts);
    }
  }, [isOpen, initialGuardrails]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ dos, donts });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 transition-colors duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 transition-colors duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 transition-colors duration-200">
                <ShieldCheck size={20} className="text-zinc-900 dark:text-white" />
                Boundaries
            </h2>
            <p className="text-zinc-500 text-xs mt-1">These apply everywhere, no matter the style.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* DOs */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <ShieldCheck size={16} />
                    Always
                </label>
                <textarea
                    value={dos}
                    onChange={(e) => setDos(e.target.value)}
                    placeholder="e.g. Include source links, Keep a professional tone..."
                    className="w-full h-32 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-green-500/50 dark:focus:border-green-900/50 focus:ring-1 focus:ring-green-500/50 dark:focus:ring-green-900/50 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-700 transition-colors duration-200"
                />
            </div>

            {/* DONTs */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <ShieldAlert size={16} />
                    Never
                </label>
                <textarea
                    value={donts}
                    onChange={(e) => setDonts(e.target.value)}
                    placeholder="e.g. Don't mention competitors, No emojis..."
                    className="w-full h-32 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-red-500/50 dark:focus:border-red-900/50 focus:ring-1 focus:ring-red-500/50 dark:focus:ring-red-900/50 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-700 transition-colors duration-200"
                />
            </div>

        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end transition-colors duration-200">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuardrailsModal;