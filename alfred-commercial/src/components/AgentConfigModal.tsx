import React from 'react';
import { AgentConfig, AgentType } from '../types';
import { X, Save, RotateCcw } from 'lucide-react';
import { DEFAULT_PROMPTS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  configs: Record<AgentType, AgentConfig>;
  onSave: (id: AgentType, newPrompt: string) => void;
}

const AgentConfigModal: React.FC<Props> = ({ isOpen, onClose, configs, onSave }) => {
  if (!isOpen) return null;

  const handleReset = (id: AgentType) => {
    onSave(id, DEFAULT_PROMPTS[id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-900">
          <div>
            <h2 className="text-lg font-semibold text-white">Agent prompts</h2>
            <p className="text-zinc-500 text-xs mt-1">Edit what each agent is told before it writes.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {Object.values(configs).map((config: AgentConfig) => (
            <div key={config.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{config.id}</span>
                  <span className="text-zinc-600 text-[10px] px-2 py-0.5 border border-zinc-800 rounded-full">{config.description}</span>
                </div>
                <button 
                  onClick={() => handleReset(config.id)}
                  className="text-[10px] text-zinc-600 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-wider font-medium"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => onSave(config.id, e.target.value)}
                className="w-full h-48 bg-black border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 font-mono focus:border-zinc-600 focus:outline-none resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-zinc-900 flex justify-end">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentConfigModal;