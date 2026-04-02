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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white/50 dark:bg-zinc-950/50 backdrop-blur-2xl border border-white/20 dark:border-zinc-700/30 w-full max-w-lg rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" style={{ minHeight: '420px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-zinc-100/50 dark:border-zinc-800/30">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-zinc-500" />
                Boundaries
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">These apply everywhere, no matter the style.</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Always */}
        <div className="px-7 pt-6 pb-2 flex-1 flex flex-col">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
              <ShieldCheck size={13} />
              Always
          </label>
          <textarea
              value={dos}
              onChange={(e) => setDos(e.target.value)}
              placeholder="Keep a professional tone"
              className="flex-1 w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 leading-relaxed"
              style={{ minHeight: '100px' }}
          />
        </div>

        {/* Divider */}
        <div className="mx-7 border-t border-zinc-100/50 dark:border-zinc-800/30" />

        {/* Never */}
        <div className="px-7 pt-5 pb-2 flex-1 flex flex-col">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
              <ShieldAlert size={13} />
              Never
          </label>
          <textarea
              value={donts}
              onChange={(e) => setDonts(e.target.value)}
              placeholder="Don't mention competitors"
              className="flex-1 w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 leading-relaxed"
              style={{ minHeight: '100px' }}
          />
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-zinc-100/50 dark:border-zinc-800/30 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuardrailsModal;
