import React from 'react';

interface Props {
    comments: string[];
}

const CommentsList: React.FC<Props> = ({ comments }) => {
    if (!comments || comments.length === 0) return null;

    return (
        <div className="space-y-3">
            {comments.map((comment, index) => (
                <div key={index} className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 group hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-black dark:hover:text-white transition-colors p-3 rounded-lg bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50">
                    <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs pt-1 w-6 shrink-0">{(index + 1).toString().padStart(2, '0')}</span>
                    <p className="leading-relaxed font-normal">{comment}</p>
                </div>
            ))}
        </div>
    );
};

export default CommentsList;