import React, { useState } from 'react';
import { Idea } from '../types';
import { Plus, MessageSquare, Check, CheckCircle2, ListOrdered } from 'lucide-react';

interface Props {
  idea: Idea;
  onApprove: (id: string, feedback?: string) => void;
  onReject: (id: string) => void;
}

const IdeaCard: React.FC<Props> = ({ idea, onApprove, onReject }) => {
  const [feedback, setFeedback] = useState('');
  const isApproved = idea.isApproved;

  return (
    <div className={`
      relative flex flex-col h-full p-6 rounded-xl transition-all duration-300 ease-in-out border
      ${isApproved 
        ? 'bg-blue-50 dark:bg-zinc-900/80 border-blue-200 dark:border-white/80 shadow-[0_0_15px_-3px_rgba(37,99,235,0.1)] dark:shadow-[0_0_15px_-3px_rgba(255,255,255,0.1)]' 
        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}
    `}>
      {/* Top Badge for Approved */}
      {isApproved && (
        <div className="absolute -top-2 -right-2 bg-blue-600 dark:bg-white text-white dark:text-black rounded-full p-1 shadow-lg border border-white dark:border-zinc-200 animate-in zoom-in duration-300 z-10 transition-colors duration-300 ease-in-out">
           <Check size={14} strokeWidth={3} />
        </div>
      )}

      <div className="mb-5 flex-1">
        <h3 className={`text-lg font-semibold mb-3 leading-snug transition-colors duration-300 ease-in-out ${isApproved ? 'text-blue-900 dark:text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
            {idea.title}
        </h3>
        
        {/* Hook - Only show if present (Hidden for Newsletters where hook is empty) */}
        {idea.hook && (
          <div className={`p-4 rounded-lg border text-base leading-relaxed font-normal transition-colors duration-300 ease-in-out ${isApproved ? 'bg-blue-100/50 dark:bg-zinc-950/50 border-blue-200 dark:border-zinc-800 text-blue-900 dark:text-zinc-300' : 'bg-gray-50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400'}`}>
            <p>"{idea.hook}"</p>
          </div>
        )}

        {/* Flow (Optional for X Articles/Newsletters) */}
        {idea.flow && idea.flow.length > 0 && (
            <div className="mt-3 pl-2">
                <div className="flex items-center gap-2 mb-2 text-zinc-500 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ease-in-out">
                    <ListOrdered size={12} />
                    <span>Flow</span>
                </div>
                <ul className="space-y-1">
                    {idea.flow.map((point, idx) => (
                        <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2 transition-colors duration-300 ease-in-out">
                            <span className="text-zinc-400 text-xs mt-0.5">•</span>
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>

      <div className="space-y-3 mt-auto pt-2">
        {/* Feedback Input */}
        {!isApproved && (
          <div className="relative">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
               <MessageSquare size={14} className="text-zinc-400 dark:text-zinc-600 transition-colors duration-300 ease-in-out" />
             </div>
             <input 
               type="text"
               value={feedback}
               onChange={(e) => setFeedback(e.target.value)}
               placeholder="Any tweaks? (optional)"
               className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md py-2.5 pl-9 pr-3 text-sm text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors duration-300 ease-in-out placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
             />
          </div>
        )}

        <div className="flex gap-2">
            {!isApproved ? (
                <>
                    <button
                        onClick={() => onReject(idea.id)}
                        className="px-4 py-2.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 text-sm font-medium"
                    >
                        Discard
                    </button>
                    <button
                        onClick={() => onApprove(idea.id, feedback)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-200 text-sm font-semibold"
                    >
                        <Plus size={16} />
                        {feedback ? 'Refine & Approve' : 'Approve'}
                    </button>
                </>
            ) : (
                <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium cursor-default transition-colors duration-300 ease-in-out">
                    <CheckCircle2 size={16} /> In the queue
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default IdeaCard;