import React, { useEffect } from 'react';
import { Session, Idea, CustomStyle, AgentType, Guardrails, Draft } from '../../types';
import DraftCard from '../DraftCard';
import { Loader2, ChevronRight, PlusCircle, Mail, CheckCircle, RefreshCw, Download } from 'lucide-react';
import * as geminiService from '../../services/aiClient';
import { useToast } from '../ui/Toast';

interface Props {
  activeSession: Session;
  onUpdateSession: (updates: Partial<Session>) => void;
  onDraftDelete: (id: string) => void;
  onDraftDuplicate: (id: string) => void;
  onGenerateDrafts: (idea: Idea, feedback?: string) => void;
  onNewSession: () => void;
  onBackToIdeation: () => void;
  onDraftEdit: (id: string, newContent: string) => void;
  onDraftRefine: (id: string, feedback: string) => void;
}

const DraftingView: React.FC<Props> = ({
  activeSession,
  onUpdateSession,
  onDraftDelete,
  onDraftDuplicate,
  onGenerateDrafts,
  onNewSession,
  onBackToIdeation,
  onDraftEdit,
  onDraftRefine
}) => {
  const { showToast } = useToast();

  const handleExportAll = () => {
    const drafts = activeSession.drafts;
    if (drafts.length === 0) return;

    const text = drafts.map((d, i) => `--- Draft ${i + 1} ---\n\n${d.content}`).join('\n\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.name.replace(/[^a-z0-9]/gi, '')}_drafts.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Drafts exported", "success");
  };

  // Use single column layout for complex formats like Threads or Articles or Newsletter
  const isSingleColumn = activeSession.writingFormat === 'Thread' || activeSession.writingFormat === 'X Article' || activeSession.writingFormat === 'Newsletter';
  const isNewsletter = activeSession.writingFormat === 'Newsletter';

  // --- Newsletter Logic ---
  const handleRegenerateSubjectLines = async () => {
    onUpdateSession({ isProcessing: true });
    try {
      // Use APPROVED IDEA as context for subject lines
      const approvedIdea = activeSession.ideas.find(i => i.isApproved);
      const context = approvedIdea
        ? `FOCUS ON THIS CONCEPT:\nTitle: ${approvedIdea.title}\nOutline: ${approvedIdea.flow?.join(' -> ')}\n\nOriginal Brief: ${activeSession.brief}`
        : activeSession.brief;

      const subjects = await geminiService.generateSubjectLines(
        context,
        activeSession.writingStyle,
        5,
        undefined, undefined, undefined,
        // Pass undefined as base to force fresh variation based on idea, 
        // instead of variations of the ideation-phase selected line.
        undefined
      );
      onUpdateSession({ newsletterSubjectLineVariations: subjects, isProcessing: false });
    } catch (e) {
      console.error(e);
      onUpdateSession({ isProcessing: false });
    }
  };

  useEffect(() => {
    // Auto-generate subject variations if missing for newsletter
    if (isNewsletter && (!activeSession.newsletterSubjectLineVariations || activeSession.newsletterSubjectLineVariations.length === 0) && !activeSession.isProcessing) {
      handleRegenerateSubjectLines();
    }
  }, [isNewsletter]);


  // --- Contextual Refinement Handler ---
  const handleContextualRefine = async (draftId: string, selectedText: string, feedback: string) => {
    const draft = activeSession.drafts.find(d => d.id === draftId);
    if (!draft) return;

    try {
      const updatedContent = await geminiService.refineDraftSelection(
        draft.content,
        selectedText,
        feedback,
        activeSession.writingStyle,
        activeSession.writingFormat
      );

      onDraftEdit(draftId, updatedContent);
      showToast("Updated", "success");
    } catch (e) {
      console.error(e);
      showToast("Couldn't update that section", "error");
    }
  };

  return (
    <div className="space-y-8 pb-12">

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
        <button
          onClick={() => onUpdateSession({ step: 'IDEATION' })}
          className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
        >
          02 Ideation
        </button>
        <ChevronRight size={12} className="text-zinc-400 dark:text-zinc-700" />
        <span className="text-black dark:text-white font-medium transition-colors duration-300 ease-in-out">03 Drafting</span>
      </div>

      <div
        className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-6 transition-colors duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-8 ease-out fill-mode-backwards"
        style={{ animationDuration: '1000ms' }}
      >
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight transition-colors duration-300 ease-in-out">Final polish</h2>
          <p className="text-zinc-500 text-sm mt-1 transition-colors duration-300 ease-in-out">
            {isNewsletter ? "Tweak your subject line and body." : "Read, tweak, and ship."}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {activeSession.drafts.length > 0 && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={handleExportAll}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-black dark:hover:text-white px-2.5 py-1.5 text-xs transition-colors border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600"
                title="Export as text"
              >
                <Download size={12} /> .txt
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-16">
        {activeSession.isProcessing && activeSession.drafts.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-20 text-zinc-500 animate-in fade-in zoom-in-95"
            style={{ animationDuration: '700ms' }}
          >
            <Loader2 className="animate-spin mb-4 text-black dark:text-white" size={24} />
            <p className="text-sm">Drafting...</p>
          </div>
        )}

        {/* NEWSLETTER SPECIFIC UI */}
        {isNewsletter && activeSession.drafts.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">

            {/* 1. Subject Lines Block */}
            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-zinc-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Subject Lines</h3>
                </div>
                <button
                  onClick={handleRegenerateSubjectLines}
                  disabled={activeSession.isProcessing}
                  className="text-xs text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-1"
                >
                  <RefreshCw size={12} className={activeSession.isProcessing ? "animate-spin" : ""} /> New options
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSession.newsletterSubjectLineVariations?.map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <span className="text-zinc-300 font-mono text-xs w-4">0{idx + 1}</span>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 select-all">{sub}</p>
                    <button
                      className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500"
                      onClick={() => navigator.clipboard.writeText(sub)}
                      title="Copy"
                    >
                      <CheckCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Main Draft */}
            {activeSession.ideas.filter(i => i.isApproved).map((idea, index) => {
              const ideaDrafts = activeSession.drafts.filter(d => d.ideaId === idea.id);
              if (ideaDrafts.length === 0) return null;

              return (
                <div key={idea.id} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Newsletter Body</h3>
                    <span className="text-xs text-zinc-500">Based on concept: {idea.title}</span>
                  </div>
                  <div className="max-w-3xl mx-auto">
                    {ideaDrafts.map((draft, dIndex) => (
                      <DraftCard
                        key={draft.id}
                        draft={draft}
                        format={activeSession.writingFormat}
                        onDelete={onDraftDelete}
                        onDuplicate={onDraftDuplicate}
                        onUpdateContent={onDraftEdit}
                        onRefine={onDraftRefine}
                        onRefineSelection={(text, feedback) => handleContextualRefine(draft.id, text, feedback)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* STANDARD UI */}
        {!isNewsletter && activeSession.ideas.filter(i => i.isApproved).map((idea, index) => {
          const ideaDrafts = activeSession.drafts.filter(d => d.ideaId === idea.id);
          if (ideaDrafts.length === 0 && !activeSession.isProcessing) return null;

          return (
            <div
              key={idea.id}
              className="space-y-6 animate-in fade-in slide-in-from-bottom-12 ease-out fill-mode-backwards"
              style={{ animationDelay: `${index * 200}ms`, animationDuration: '1000ms' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1 transition-colors duration-300 ease-in-out"></div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300 ease-in-out">
                  {idea.title}
                </h3>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1 transition-colors duration-300 ease-in-out"></div>
              </div>

              <div className={`grid grid-cols-1 ${isSingleColumn ? 'max-w-3xl mx-auto' : 'md:grid-cols-2'} gap-6`}>
                {ideaDrafts.map((draft, dIndex) => (
                  <div
                    key={draft.id}
                    className="animate-in fade-in slide-in-from-bottom-6 zoom-in-95 ease-out fill-mode-backwards"
                    style={{ animationDelay: `${(dIndex * 150) + 100}ms`, animationDuration: '700ms' }}
                  >
                    <DraftCard
                      draft={draft}
                      format={activeSession.writingFormat}
                      onDelete={onDraftDelete}
                      onDuplicate={onDraftDuplicate}
                      onUpdateContent={onDraftEdit}
                      onRefine={onDraftRefine}
                      onRefineSelection={(text, feedback) => handleContextualRefine(draft.id, text, feedback)}
                    />
                  </div>
                ))}
              </div>

              {/* Bottom "Generate More" Button for this Idea */}
              <div className="flex justify-center pt-2">
                {activeSession.isProcessing ? (
                  <div className="flex items-center justify-center py-2 text-zinc-500 animate-pulse text-sm">
                    <Loader2 className="mr-2 animate-spin" size={16} /> Thinking...
                  </div>
                ) : (
                  <button
                    onClick={() => onGenerateDrafts(idea)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md"
                  >
                    <PlusCircle size={16} />
                    More variations for &ldquo;{idea.title}&rdquo;
                  </button>
                )}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  );
};

export default DraftingView;