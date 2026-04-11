import React, { useState, useRef, useEffect } from 'react';
import { Draft } from '../types';
import { Copy, Loader2, Check, Sparkles, Pencil, Save, X, Trash2, ArrowRight, Wand2, Download } from 'lucide-react';

interface Props {
  draft: Draft;
  format?: string;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdateContent: (id: string, newContent: string) => void;
  onRefine: (id: string, feedback: string) => void;
  // New prop for contextual refinement
  onRefineSelection?: (selectedText: string, feedback: string) => Promise<void>;
}

const ThreadRenderer: React.FC<{ content: string }> = ({ content }) => {
    const blocks = content.split(/\n+(?=\d+[\/\.])/).filter(b => b.trim().length > 0);

    return (
        <div className="space-y-0 relative pl-4 pointer-events-none"> 
           {/* NOTE: ThreadRenderer uses pointer-events-none to simplify selection handling on parent for now, 
               but if we want robust selection inside threads, we need to allow events and handle bubble structure.
               For this implementation, let's keep it simple. If format is thread, simple selection might be tricky.
               Reverting pointer-events to allow selection.
           */}
            {blocks.map((block, i) => {
                const numberMatch = block.match(/^(\d+)[\/\.]\s*/);
                const displayContent = numberMatch ? block.replace(numberMatch[0], '') : block;
                const number = numberMatch ? numberMatch[1] : (i + 1).toString();
                const isLast = i === blocks.length - 1;
                
                return (
                    <div key={i} className={`relative pl-8 ${isLast ? 'pb-0' : 'pb-6'} group pointer-events-auto`}>
                         {!isLast && (
                            <div className="absolute left-[11px] top-7 -bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-800 transition-colors duration-300 ease-in-out" />
                         )}
                        <div className={`
                            absolute left-0 top-1 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold z-10 transition-colors duration-300 ease-in-out
                            bg-white dark:bg-black border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white
                        `}>
                            {number}
                        </div>
                        <div className={`
                            rounded-xl border transition-all duration-300 ease-in-out
                            bg-zinc-50 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800/50 p-4
                        `}>
                            <p className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans text-sm font-normal transition-colors duration-300 ease-in-out">
                                {displayContent}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const DraftCard: React.FC<Props> = ({ draft, format, onDelete, onUpdateContent, onRefine, onRefineSelection }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(draft.content);
  
  // Refine Mode State
  const [isRefining, setIsRefining] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState('');
  const [isRefineLoading, setIsRefineLoading] = useState(false);

  // Selection Refine State
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null); // New Ref for Popover
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const [selectionFeedback, setSelectionFeedback] = useState('');
  const [isSelectionLoading, setIsSelectionLoading] = useState(false);

  const isThreadFormat = format === 'Thread';
  const isThreadContent = (draft.content.includes("1/") || draft.content.includes("1.")) && draft.content.split(/\n\n/).length > 1;
  const isThread = isThreadFormat || isThreadContent;

  // Auto-resize textarea to fit content
  useEffect(() => {
      if (isEditing && textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
  }, [isEditing, editedContent]);

  useEffect(() => {
      const handleSelectionChange = (e: MouseEvent | KeyboardEvent) => {
          if (!containerRef.current) return;
          
          // PREVENT CLOSING IF CLICKING INSIDE POPOVER
          if (popoverRef.current && e.target instanceof Node && popoverRef.current.contains(e.target)) {
             return;
          }

          const sel = window.getSelection();
          
          // Only show if selection is within this specific card
          if (sel && sel.toString().trim().length > 0 && containerRef.current.contains(sel.anchorNode)) {
              const range = sel.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              
              const cardRect = containerRef.current.getBoundingClientRect();
              
              setSelection({
                  text: sel.toString(),
                  top: rect.bottom - cardRect.top + 10, // 10px below selection
                  left: rect.left - cardRect.left + (rect.width / 2) // Centered
              });
          } else {
              // Only hide if we aren't currently typing in the box (to avoid flickering)
              if (!isSelectionLoading && !selectionFeedback) {
                  setSelection(null);
              }
          }
      };

      // We use mouseup instead of selectionchange for better performance and finality
      const el = containerRef.current;
      if (el) {
          el.addEventListener('mouseup', handleSelectionChange);
          el.addEventListener('keyup', handleSelectionChange); // For keyboard selection
      }
      return () => {
          if (el) {
              el.removeEventListener('mouseup', handleSelectionChange);
              el.removeEventListener('keyup', handleSelectionChange);
          }
      };
  }, [isSelectionLoading, selectionFeedback]);

  const handleCopy = () => {
    navigator.clipboard.writeText(draft.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([draft.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `draft-${draft.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
      onUpdateContent(draft.id, editedContent);
      setIsEditing(false);
  };

  const handleCancelEdit = () => {
      setEditedContent(draft.content);
      setIsEditing(false);
  };

  const handleTriggerRefine = async () => {
      if (!refineFeedback.trim()) return;
      setIsRefineLoading(true);
      await onRefine(draft.id, refineFeedback);
      setIsRefineLoading(false);
      setIsRefining(false);
      setRefineFeedback('');
  };

  const handleSelectionRefine = async () => {
      if (!selection || !selectionFeedback.trim() || !onRefineSelection) return;
      setIsSelectionLoading(true);
      
      await onRefineSelection(selection.text, selectionFeedback);
      
      setIsSelectionLoading(false);
      setSelectionFeedback('');
      setSelection(null);
      window.getSelection()?.removeAllRanges();
  };

  return (
    <div ref={containerRef} className="relative bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6 transition-all duration-300 ease-in-out group flex flex-col h-full">
      
      {/* SELECTION POPOVER */}
      {selection && !isEditing && (
          <div 
            ref={popoverRef}
            className="absolute z-50 transform -translate-x-1/2 w-64 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: selection.top, left: selection.left }}
          >
              <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg shadow-xl p-2 flex flex-col gap-2 border border-zinc-700 dark:border-zinc-200">
                  <div className="flex items-center gap-1.5 px-1">
                      <Wand2 size={12} className="text-purple-400 dark:text-purple-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Refine this</span>
                  </div>
                  <div className="flex gap-1">
                      <input
                        value={selectionFeedback}
                        onChange={(e) => setSelectionFeedback(e.target.value)}
                        placeholder="e.g. Shorter, punchier..."
                        className="flex-1 bg-black/50 dark:bg-white/50 border border-zinc-700 dark:border-zinc-300 rounded px-2 py-1 text-xs text-white dark:text-black placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSelectionRefine()}
                      />
                      <button 
                        onClick={handleSelectionRefine}
                        disabled={isSelectionLoading}
                        className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
                      >
                         {isSelectionLoading ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                      </button>
                  </div>
              </div>
              {/* Arrow */}
              <div className="w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2 border-l border-t border-zinc-700 dark:border-zinc-200"></div>
          </div>
      )}

      {/* --- Action Bar (Flow Layout) --- */}
      {!isEditing && (
        <div className="flex justify-center items-start mb-3">
           <div className="flex gap-2 z-20">
               <button 
                 onClick={handleCopy}
                 className={`
                    flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 shadow-sm border
                    ${copied 
                      ? 'bg-green-100/90 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' 
                      : 'bg-white/90 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-black dark:hover:text-white'
                    }
                 `}
               >
                  {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
               </button>
               <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    title="Edit"
               >
                   <Pencil size={14} />
               </button>
               <button
                    onClick={handleDownload}
                    className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    title="Download"
               >
                   <Download size={14} />
               </button>
               <button
                    onClick={() => onDelete(draft.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                    title="Delete"
               >
                   <Trash2 size={14} />
               </button>
           </div>
        </div>
      )}

      {/* --- Content Area --- */}
      <div className="mb-4 flex-1">
           {isEditing ? (
               <div className="animate-in fade-in duration-200">
                   <textarea
                       ref={textareaRef}
                       value={editedContent}
                       onChange={(e) => setEditedContent(e.target.value)}
                       className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-base font-sans font-normal focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white resize-none leading-relaxed overflow-hidden"
                   />
                   <div className="flex justify-end gap-2 mt-3">
                       <button 
                           onClick={handleCancelEdit}
                           className="px-3 py-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                       >
                           Cancel
                       </button>
                       <button 
                           onClick={handleSaveEdit}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
                       >
                           <Save size={12} /> Save
                       </button>
                   </div>
               </div>
           ) : (
               isThread ? (
                   <ThreadRenderer content={draft.content} />
               ) : (
                   <div className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 text-base leading-relaxed font-normal font-sans transition-colors duration-300 ease-in-out">
                       {draft.content}
                   </div>
               )
           )}
      </div>

      {/* --- Analytics & Refine Actions --- */}
      {!isEditing && (
        <div className="mt-auto space-y-4">
             {/* Refine / Tweak Input */}
             {isRefining && (
                 <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="flex items-center gap-2 mb-2">
                         <Sparkles size={12} className="text-blue-500" />
                         <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tweak the whole thing</span>
                     </div>
                     <div className="flex gap-2">
                         <input 
                             type="text" 
                             value={refineFeedback}
                             onChange={(e) => setRefineFeedback(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleTriggerRefine()}
                             placeholder="e.g. Tighter sentences, lose the emojis..."
                             autoFocus
                             className="flex-1 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                         />
                         <button 
                             onClick={handleTriggerRefine}
                             disabled={isRefineLoading || !refineFeedback}
                             className="bg-black dark:bg-white text-white dark:text-black p-1.5 rounded-lg disabled:opacity-50"
                         >
                             {isRefineLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                         </button>
                     </div>
                 </div>
             )}

            <div className="flex items-center justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
                 {!isRefining && (
                     <button 
                        onClick={() => setIsRefining(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                     >
                         <Sparkles size={12} /> Tweak
                     </button>
                 )}
                 {isRefining && (
                     <button 
                        onClick={() => setIsRefining(false)}
                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                     >
                         Cancel
                     </button>
                 )}
            </div>
        </div>
      )}
      
    </div>
  );
};

export default DraftCard;