import React, { useState } from 'react';
import { PenTool, Sparkles } from 'lucide-react';

interface Props {
  onGenerate: (feedback: string) => void;
  isGenerating?: boolean;
}

const DraftGeneratorCard: React.FC<Props> = ({ onGenerate, isGenerating = false }) => {
  const [feedback, setFeedback] = useState('');

  return (
    <div className="flex flex-col border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl p-6 min-h-[300px] hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors duration-300 ease-in-out bg-zinc-50 dark:bg-zinc-900/10">
      
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors duration-300 ease-in-out">
            <PenTool size={20} className="text-zinc-400 dark:text-zinc-500 transition-colors duration-300 ease-in-out" />
        </div>
        <div>
            <h4 className="font-medium text-sm text-zinc-700 dark:text-zinc-300 transition-colors duration-300 ease-in-out">Generate Variations</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 max-w-[180px] mx-auto mt-2 leading-relaxed transition-colors duration-300 ease-in-out">Get fresh takes based on your feedback.</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Shorter sentences, more casual..."
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-800 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none h-16 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 transition-colors duration-300 ease-in-out"
        />
        <button
            onClick={() => onGenerate(feedback)}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-lg bg-black dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black text-xs font-semibold transition-colors duration-300 ease-in-out flex items-center justify-center gap-2"
        >
            {isGenerating ? <span className="animate-pulse">Writing...</span> : <><Sparkles size={12} /> Generate</>}
        </button>
      </div>
    </div>
  );
};

export default DraftGeneratorCard;