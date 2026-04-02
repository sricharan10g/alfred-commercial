import React from 'react';
import { FormatDefinition } from '../types';
import { X, LayoutTemplate, Check, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  presets: FormatDefinition[];
  onSelect: (format: FormatDefinition) => void;
  currentFormat: string;
}

const StyleLibraryModal: React.FC<Props> = ({ isOpen, onClose, presets, onSelect, currentFormat }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm md:p-4 animate-in fade-in duration-300 transition-colors duration-200">
      <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl border border-white/20 dark:border-zinc-700/30 w-full max-w-2xl rounded-t-2xl md:rounded-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-500 ease-out h-[85vh] md:h-[70vh] transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 transition-colors duration-200">
                <LayoutTemplate size={20} className="text-zinc-900 dark:text-white" />
                Format Library
            </h2>
            <p className="text-zinc-500 text-xs mt-1">Pick a structure for your content.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
            {presets.map(preset => {
                const isSelected = currentFormat === preset.name;
                return (
                    <div 
                        key={preset.id} 
                        onClick={() => !isSelected && onSelect(preset)}
                        className={`
                            border rounded-xl p-5 transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start cursor-pointer group
                            ${isSelected 
                                ? 'bg-zinc-50 dark:bg-zinc-900 border-black dark:border-zinc-500 ring-1 ring-black dark:ring-zinc-500' 
                                : 'bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm'
                            }
                        `}
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 transition-colors duration-200">{preset.name}</h3>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors duration-200">{preset.description}</p>
                        </div>
                        <div className="shrink-0 self-center">
                            {isSelected ? (
                                <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-full">
                                    <Check size={16} />
                                </div>
                            ) : (
                                <div className="text-zinc-300 dark:text-zinc-700 group-hover:text-black dark:group-hover:text-white transition-colors">
                                    <ArrowRight size={20} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

      </div>
    </div>
  );
};

export default StyleLibraryModal;