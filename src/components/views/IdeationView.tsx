import React from 'react';
import { Session } from '../../types';
import IdeaCard from '../IdeaCard';
import { ChevronRight, Loader2, Mail, CheckCircle, Circle } from 'lucide-react';

interface Props {
  activeSession: Session;
  onUpdateSession: (updates: Partial<Session>) => void;
  onIdeaDecision: (id: string, decision: 'APPROVE' | 'REJECT', feedback?: string) => void;
  onMoreLikeThis: (id: string) => void;
  onMoveToDrafts: () => void;
  loadingMoreForId?: string | null;
}

const IdeationView: React.FC<Props> = ({
  activeSession,
  onUpdateSession,
  onIdeaDecision,
  onMoreLikeThis,
  onMoveToDrafts,
  loadingMoreForId,
}) => {
  const hasDrafts = activeSession.drafts && activeSession.drafts.length > 0;
  const isNewsletter = activeSession.writingFormat === 'Newsletter';

  // Helper for Newsletter Selection Logic
  const handleSelectSubject = (subject: string) => {
      onUpdateSession({ selectedNewsletterSubjectLine: subject });
  };
  
  const handleSelectFlow = (id: string, feedback?: string) => {
      // In newsletter mode, we treat "Approving" an idea as selecting the Body Concept
      // First reject others to ensure single selection visually (optional, but clean)
      // Actually, we can just use the single `onIdeaDecision` but we need to ensure the UI reflects it as a selection
      const otherIdeas = activeSession.ideas.filter(i => i.id !== id);
      const updatedIdeas = activeSession.ideas.map(i => {
          if (i.id === id) return { ...i, isApproved: true, userFeedback: feedback };
          return { ...i, isApproved: false }; // Deselect others
      });
      onUpdateSession({ ideas: updatedIdeas });
  };

  const isNewsletterReady = isNewsletter && activeSession.selectedNewsletterSubjectLine && activeSession.ideas.some(i => i.isApproved);
  const isStandardReady = !isNewsletter && activeSession.ideas.some(i => i.isApproved);

  return (
    <div className="space-y-8">
      
      {/* Workflow Navigation */}
      <div 
        className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-4 ease-out"
        style={{ animationDuration: '1000ms' }}
      >
         <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mr-2 transition-colors duration-300 ease-in-out">Workflow</span>
         <button 
            onClick={() => onUpdateSession({ step: 'BRIEF' })} 
            className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
         >
            01 Brief
         </button>
         <ChevronRight size={12} className="text-zinc-400 dark:text-zinc-700" />
         <span className="text-black dark:text-white font-medium transition-colors duration-300 ease-in-out">02 Ideation</span>
         
         {hasDrafts && (
            <>
                <ChevronRight size={12} className="text-zinc-400 dark:text-zinc-700" />
                <button 
                    onClick={() => onUpdateSession({ step: 'DRAFTING' })} 
                    className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                    03 Drafting
                </button>
            </>
         )}
      </div>

      {/* Header */}
      <div
        className="flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-6 transition-colors duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-8 ease-out fill-mode-backwards"
        style={{ animationDuration: '1000ms' }}
      >
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight transition-colors duration-300 ease-in-out">Pick your idea</h2>
          <p className="text-zinc-500 text-sm mt-1 transition-colors duration-300 ease-in-out">
              Style: <span className="text-zinc-800 dark:text-white font-medium">{activeSession.writingStyle}</span>.
              {isNewsletter ? " Choose a subject line and a body concept." : " Review & approve what works."}
          </p>
        </div>
        <div />
      </div>

      {/* Floating Drafting button — appears when idea is approved, stays visible while scrolling */}
      {(isStandardReady || isNewsletterReady) && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in-90 duration-300">
          <button
            onClick={onMoveToDrafts}
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-5 py-3 rounded-full text-sm font-semibold shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Drafting <ChevronRight size={16} />
          </button>
        </div>
      )}

      {activeSession.isProcessing && (
        <div className="flex items-center justify-center py-8 text-zinc-500 animate-pulse text-sm">
          <Loader2 className="mr-2 animate-spin" size={16} /> Thinking...
        </div>
      )}

      {/* NEWSLETTER LAYOUT: STACKED VIEW */}
      {isNewsletter ? (
          <div className="space-y-12">
              
              {/* Top: Subject Lines */}
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="flex items-center gap-2 mb-2">
                      <Mail size={16} className="text-zinc-400" />
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Subject Lines</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeSession.newsletterSubjectLines?.map((subject, idx) => {
                          const isSelected = activeSession.selectedNewsletterSubjectLine === subject;
                          return (
                              <div 
                                key={idx}
                                onClick={() => handleSelectSubject(subject)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 group ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20' : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                              >
                                  <div className={`mt-0.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400'}`}>
                                      {isSelected ? <CheckCircle size={18} /> : <Circle size={18} />}
                                  </div>
                                  <p className={`text-sm leading-relaxed ${isSelected ? 'text-blue-900 dark:text-blue-100 font-medium' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                      {subject}
                                  </p>
                              </div>
                          )
                      })}
                  </div>
                  {(!activeSession.newsletterSubjectLines || activeSession.newsletterSubjectLines.length === 0) && !activeSession.isProcessing && (
                           <div className="text-center py-8 text-zinc-500 text-sm italic">No subject lines yet.</div>
                  )}
              </div>

              {/* Bottom: Concepts (Flows) */}
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700">
                  <div className="flex items-center gap-2 mb-2">
                       <span className="text-zinc-400 font-mono text-sm">#</span>
                       <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Body Concepts</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activeSession.ideas.map((idea, index) => (
                          <div key={idea.id} className={activeSession.ideas.some(i => i.isApproved && i.id !== idea.id) ? 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300' : ''}>
                               <IdeaCard
                                    idea={idea}
                                    onApprove={(id, feedback) => handleSelectFlow(id, feedback)}
                               />
                          </div>
                      ))}
                  </div>
                  {activeSession.ideas.length === 0 && !activeSession.isProcessing && (
                      <div className="text-center py-8 text-zinc-500 text-sm italic">No concepts yet.</div>
                  )}
              </div>

          </div>
      ) : (
        /* STANDARD LAYOUT — root ideas in 2-col grid; variants grouped below their parent */
        (() => {
          const rootIdeas = activeSession.ideas.filter(i => !i.parentId);
          const variantsByParent: Record<string, typeof activeSession.ideas> = {};
          activeSession.ideas.filter(i => i.parentId).forEach(i => {
            if (!variantsByParent[i.parentId!]) variantsByParent[i.parentId!] = [];
            variantsByParent[i.parentId!].push(i);
          });

          return (
            <div className="space-y-4">
              {/* Root ideas — standard 2-col grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rootIdeas.map((idea, index) => (
                  <div
                    key={idea.id}
                    className="animate-in fade-in slide-in-from-bottom-12 zoom-in-95 ease-out fill-mode-backwards"
                    style={{ animationDelay: `${index * 150}ms`, animationDuration: '1000ms' }}
                  >
                    <IdeaCard
                      idea={idea}
                      onApprove={(id, feedback) => onIdeaDecision(id, 'APPROVE', feedback)}
                      onMoreLikeThis={onMoreLikeThis}
                      isLoadingMore={loadingMoreForId === idea.id}
                    />
                  </div>
                ))}
                {activeSession.ideas.length === 0 && !activeSession.isProcessing && (
                  <div
                    className="col-span-2 text-center text-zinc-500 dark:text-zinc-600 py-12 text-sm animate-in fade-in zoom-in-95 transition-colors duration-300 ease-in-out"
                    style={{ animationDuration: '700ms' }}
                  >
                    All cleared out. Generate fresh ones?
                  </div>
                )}
              </div>

              {/* Variant groups — one block per parent that has variants */}
              {rootIdeas.filter(r => variantsByParent[r.id]?.length > 0).map(parent => (
                <div
                  key={`variants-${parent.id}`}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-500"
                >
                  {/* Group label */}
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest whitespace-nowrap px-1">
                      Variations of &ldquo;{parent.title}&rdquo;
                    </span>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  </div>

                  {/* Variants side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {variantsByParent[parent.id].map((variant, vi) => (
                      <div
                        key={variant.id}
                        className="animate-in fade-in zoom-in-95 ease-out"
                        style={{ animationDelay: `${vi * 100}ms`, animationDuration: '500ms' }}
                      >
                        <IdeaCard
                          idea={variant}
                          onApprove={(id, feedback) => onIdeaDecision(id, 'APPROVE', feedback)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      )}

    </div>
  );
};

export default IdeationView;