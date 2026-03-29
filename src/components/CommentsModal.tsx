import React from 'react';
import { X, MessageSquareQuote } from 'lucide-react';
import CommentsList from './CommentsList';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  comments: string[];
}

const CommentsModal: React.FC<Props> = ({ isOpen, onClose, comments }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 transition-colors duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[80vh] rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 transition-colors duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <MessageSquareQuote size={18} className="text-zinc-900 dark:text-white" />
            </div>
            <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white transition-colors duration-200">Generated Comments</h2>
                <p className="text-zinc-500 text-xs">Engagement options for this draft.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <CommentsList comments={comments} />
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;