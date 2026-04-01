import React, { useRef, useEffect, useState } from 'react';
import { Session, WritingStyle, CustomStyle, ResearchProfile, ResearchTimeRange, WritingFormat, AIProvider } from '../../types';
import { BookOpen, Plus, Globe, Clock, Loader2, RefreshCw, X, CheckCircle, Circle, Link, ArrowUp, ArrowDownCircle, Settings, ChevronDown, Sparkles, LayoutTemplate, ChevronRight, Info, User, Cpu } from 'lucide-react';
import { FORMAT_LIBRARY } from '../../constants';

const PROVIDER_LABELS: Record<AIProvider, string> = {
    gemini: 'Gemini',
    claude: 'Claude',
    openai: 'GPT',
};

interface Props {
  activeSession: Session;
  customStyles: CustomStyle[];
  researchProfiles: ResearchProfile[];
  onUpdateSession: (updates: Partial<Session>) => void;
  onGenerateIdeas: () => void;
  onOpenStyleLibrary: () => void;
  onOpenStyleModal: () => void;
  onFetchResearch: () => void;
  onFetchMoreResearch: () => void;
  onToggleResearchFinding: (id: string) => void;
  onOpenResearchSettings: () => void;
  selectedProvider: AIProvider;
}

const PLACEHOLDERS = [
  "Ask Alfred...",
  "Exactly 3 clicks away from viral content.",
  "Turn a messy brain dump into a masterpiece.",
  "Writer's block? Never heard of her.",
  "Let's ship something dangerous today.",
  "Paste your raw thoughts, I'll handle the polish.",
  "What's the big idea?",
  "Make the algorithm work for you."
];

const SUFFIXES = [
    ", at your service",
    ", ready to draft",
    ", standing by",
    ", online",
    ", in the zone",
    ", at your command",
    ", ready to cook",
    ", eyes on you"
];

// QWERTY adjacency map for realistic typos
const KEYBOARD_NEIGHBORS: Record<string, string> = {
    'q': 'w', 'w': 'e', 'e': 'r', 'r': 't', 't': 'y', 'y': 'u', 'u': 'i', 'i': 'o', 'o': 'p', 'p': '[',
    'a': 's', 's': 'd', 'd': 'f', 'f': 'g', 'g': 'h', 'h': 'j', 'j': 'k', 'k': 'l', 'l': ';',
    'z': 'x', 'x': 'c', 'c': 'v', 'v': 'b', 'b': 'n', 'n': 'm', 'm': ',',
    ' ': 'v' // Space often misses to v/b/n
};

const TypewriterHeading: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState(text);
  const [cursorPos, setCursorPos] = useState(text.length);
  const [isActive, setIsActive] = useState(false);
  
  const stateRef = useRef({
      text: text,
      cursor: text.length,
      queue: [] as any[],
      timeout: null as ReturnType<typeof setTimeout> | null
  });

  useEffect(() => {
      const state = stateRef.current;
      const oldText = state.text;
      const newText = text;

      if (oldText === newText) return;

      if (state.timeout) clearTimeout(state.timeout);
      state.queue = [];

      // Strategy Selection Logic
      
      // 1. Calculate Common Prefix (Standard "Status Update" detection)
      let commonPrefixLen = 0;
      while (commonPrefixLen < Math.min(oldText.length, newText.length) && oldText[commonPrefixLen] === newText[commonPrefixLen]) {
          commonPrefixLen++;
      }

      // 2. Calculate Common Suffix ("Name Swap" detection)
      let commonSuffixLen = 0;
      while (
          commonSuffixLen < Math.min(oldText.length, newText.length) && 
          oldText[oldText.length - 1 - commonSuffixLen] === newText[newText.length - 1 - commonSuffixLen]
      ) {
          commonSuffixLen++;
      }

      // 3. Queue Operations based on strategy
      
      // Strategy A: NAME SWAP (e.g. "Alfred, online" -> "Abdullah, online")
      // Trigger: Significant suffix match AND change occurred at the start
      const isNameSwap = commonSuffixLen > 3 && commonPrefixLen < 3;
      
      if (isNameSwap) {
          // A1. Move Left from End to Start of Suffix
          const startOfSuffix = oldText.length - commonSuffixLen;
          const stepsLeft = state.cursor - startOfSuffix;
          
          if (stepsLeft > 0) {
              state.queue.push({ type: 'pause', duration: 400 });
              for (let i = 0; i < stepsLeft; i++) {
                  state.queue.push({ type: 'move_left', speed: Math.max(10, 30 - i * 2) }); // Accelerating
              }
          }

          // A2. Backspace the Name (Old Name)
          const nameLen = startOfSuffix; // Since prefix is effectively 0
          for (let i = 0; i < nameLen; i++) {
              state.queue.push({ type: 'backspace', speed: 50 });
          }
          state.queue.push({ type: 'pause', duration: 150 });

          // A3. Type New Name
          const newName = newText.substring(0, newText.length - commonSuffixLen);
          queueTyping(state.queue, newName);

          // A4. Move Right to End (Return to ready state)
          // Optional but looks cool like "I'm done editing, back to ready position"
          state.queue.push({ type: 'pause', duration: 300 });
          for (let i = 0; i < commonSuffixLen; i++) {
               state.queue.push({ type: 'move_right', speed: Math.max(10, 30 - i * 2) });
          }

      } 
      // Strategy B: STATUS UPDATE (e.g. "Alfred, online" -> "Alfred, thinking")
      // Trigger: Significant prefix match
      else if (commonPrefixLen > 2) {
          // B1. Seek Left to Divergence Point
          const stepsToMove = state.cursor - commonPrefixLen;
          if (stepsToMove > 0) {
              state.queue.push({ type: 'pause', duration: 300 });
              for (let i = 0; i < stepsToMove; i++) {
                  state.queue.push({ type: 'move_left', speed: Math.max(15, 50 - i * 3) });
              }
          }

          // B2. Delete Right (Forward Delete)
          const charsToDelete = oldText.length - commonPrefixLen;
          if (charsToDelete > 0) {
              state.queue.push({ type: 'pause', duration: 150 });
              for (let i = 0; i < charsToDelete; i++) {
                  state.queue.push({ type: 'delete_right', speed: 40 });
              }
          }

          // B3. Type New Suffix
          const charsToAdd = newText.slice(commonPrefixLen);
          queueTyping(state.queue, charsToAdd);
      }
      // Strategy C: TOTAL REWRITE
      else {
           // Backspace everything
           const deleteCount = oldText.length;
           for(let i = 0; i < deleteCount; i++) {
               state.queue.push({ type: 'backspace', speed: 30 });
           }
           state.queue.push({ type: 'pause', duration: 200 });
           queueTyping(state.queue, newText);
      }

      // Execute Queue
      const process = () => {
          if (state.queue.length === 0) {
              setIsActive(false);
              return;
          }

          setIsActive(true);
          const op = state.queue.shift();
          let delay = op.speed || 50;

          switch (op.type) {
              case 'move_left':
                  if (state.cursor > 0) state.cursor--;
                  break;
              case 'move_right':
                  if (state.cursor < state.text.length) state.cursor++;
                  break;
              case 'delete_right':
                  // Delete char AFTER cursor
                  state.text = state.text.slice(0, state.cursor) + state.text.slice(state.cursor + 1);
                  break;
              case 'type':
                  state.text = state.text.slice(0, state.cursor) + op.char + state.text.slice(state.cursor);
                  state.cursor++;
                  break;
              case 'backspace':
                  // Delete char BEFORE cursor
                  if (state.cursor > 0) {
                      state.text = state.text.slice(0, state.cursor - 1) + state.text.slice(state.cursor);
                      state.cursor--;
                  }
                  break;
              case 'pause':
                  delay = op.duration;
                  break;
          }

          setDisplayedText(state.text);
          setCursorPos(state.cursor);
          state.timeout = setTimeout(process, delay);
      };

      process();
      return () => { if (state.timeout) clearTimeout(state.timeout); };

  }, [text]);

  return (
    <span className="inline-flex items-center font-light tracking-tight relative align-bottom leading-none">
        {/* Text before cursor */}
        <span className="whitespace-pre text-zinc-800 dark:text-zinc-200 transition-colors duration-300">
            {displayedText.slice(0, cursorPos)}
        </span>
        
        {/* The Cursor - Reduced width to 2px and removed margins to prevent jumping */}
        <span 
            className={`
                inline-block w-[2px] h-[1.2em] bg-blue-600 dark:bg-blue-400 
                align-middle relative top-[1px]
                ${!isActive ? 'animate-cursor-blink' : 'opacity-100'}
            `} 
        />
        
        {/* Text after cursor - Fully Visible (No Dimming) */}
        <span className="whitespace-pre text-zinc-800 dark:text-zinc-200 transition-colors duration-300">
            {displayedText.slice(cursorPos)}
        </span>

        <style>{`
            @keyframes cursor-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
            .animate-cursor-blink {
                animation: cursor-blink 1s step-end infinite;
            }
        `}</style>
    </span>
  );
};

// Helper for typing queue with typo simulation
function queueTyping(queue: any[], textToType: string) {
    if (textToType.length === 0) return;
    
    queue.push({ type: 'pause', duration: 100 });

    for (let i = 0; i < textToType.length; i++) {
        const char = textToType[i];
        
        // 5% chance of typo if not first char
        const shouldTypo = i > 1 && Math.random() < 0.05 && KEYBOARD_NEIGHBORS[char.toLowerCase()];
        
        if (shouldTypo) {
            const wrongChar = KEYBOARD_NEIGHBORS[char.toLowerCase()];
            queue.push({ type: 'type', char: wrongChar, speed: 60 });
            queue.push({ type: 'pause', duration: 250 }); // Oh no moment
            queue.push({ type: 'backspace', speed: 100 });
            queue.push({ type: 'pause', duration: 50 });
        }
        
        queue.push({ type: 'type', char, speed: 70 + Math.random() * 50 });
    }
}

// Persona Data for Hover Cards
const PERSONA_INFO: Record<string, { role: string; desc: string }> = {
    [WritingStyle.DEFAULT]: {
        role: "The Strategist",
        desc: "Built for reach. Punchy sentences, simple words, ideas that spread."
    },
    [WritingStyle.ABDULLAH]: {
        role: "The Philosopher",
        desc: "Big ideas, stripped down. First principles with zero filler."
    },
    [WritingStyle.JOY]: {
        role: "The Poet",
        desc: "Warm and witty. Makes complex things feel obvious."
    },
    "custom": {
        role: "Custom Persona",
        desc: "Your voice. Your rules."
    }
};

const BriefView: React.FC<Props> = ({
  activeSession,
  customStyles,
  researchProfiles,
  onUpdateSession,
  onGenerateIdeas,
  onOpenStyleLibrary,
  onOpenStyleModal,
  onFetchResearch,
  onFetchMoreResearch,
  onToggleResearchFinding,
  onOpenResearchSettings,
  selectedProvider
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  
  // Hover State for Style Dropdown
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);
  const [showResearchHint, setShowResearchHint] = useState(false);

  const styleDropdownRef = useRef<HTMLDivElement>(null);
  const formatDropdownRef = useRef<HTMLDivElement>(null);
  const [activeSuffix, setActiveSuffix] = useState(SUFFIXES[0]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setIsPlaceholderVisible(true);
      }, 1000);
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200;
      if (scrollHeight > maxHeight) {
          textarea.style.height = `${maxHeight}px`;
          textarea.style.overflowY = 'auto';
      } else {
          textarea.style.height = `${scrollHeight}px`;
          textarea.style.overflowY = 'hidden';
      }
    }
  }, [activeSession.brief]);

  useEffect(() => {
    const isNewUser = sessionStorage.getItem('alfred_just_logged_in') === 'true';
    const hasSeen = localStorage.getItem('alfred_seen_research_hint') === 'true';
    if (isNewUser && !hasSeen) {
      const timer = setTimeout(() => setShowResearchHint(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target as Node)) {
        setIsStyleDropdownOpen(false);
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setIsFormatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStyleChange = (style: string) => {
    // Check for custom style native format preference
    const customStyle = customStyles.find(s => s.name === style);
    let newFormat = activeSession.writingFormat;

    if (customStyle && customStyle.nativeFormat) {
        newFormat = customStyle.nativeFormat;
    }

    onUpdateSession({ 
        writingStyle: style,
        writingFormat: newFormat,
        ideas: [],
        drafts: [],
        step: 'BRIEF'
    });
    // Randomize suffix on style change to trigger animation
    const newSuffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    setActiveSuffix(newSuffix);
    setIsStyleDropdownOpen(false);
  };

  const handleFormatChange = (format: WritingFormat) => {
    onUpdateSession({ 
        writingFormat: format,
        ideas: [],
        drafts: [],
        step: 'BRIEF'
    });
    setIsFormatDropdownOpen(false);
  };

  const handleBriefChange = (text: string) => {
    onUpdateSession({ brief: text });
  };

  const getStyleInfo = (styleName: string) => {
      if (PERSONA_INFO[styleName]) return PERSONA_INFO[styleName];
      
      const custom = customStyles.find(s => s.name === styleName);
      if (custom) {
          return {
              role: custom.role || "Custom Persona",
              desc: custom.description || "A custom writing style generated from data."
          };
      }
      
      return PERSONA_INFO["custom"];
  };

  const hasIdeas = activeSession.ideas && activeSession.ideas.length > 0;
  const hasDrafts = activeSession.drafts && activeSession.drafts.length > 0;
  const quickFormats = FORMAT_LIBRARY.slice(0, 3);

  return (
    <div className="space-y-6 pt-8 md:pt-16 min-h-[60vh] flex flex-col relative">
      
      {/* Workflow Breadcrumbs */}
      {(hasIdeas || hasDrafts) && (
        <div className="flex items-center gap-2 text-sm absolute top-0 left-0 w-full animate-in fade-in slide-in-from-top-4 duration-1000 ease-out">
             <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mr-2 transition-colors duration-300 ease-in-out">Workflow</span>
             <span className="font-medium text-black dark:text-white transition-colors duration-300 ease-in-out">01 Brief</span>
             
             {hasIdeas && (
                <>
                    <ChevronRight size={12} className="text-zinc-400 dark:text-zinc-700" />
                    <button 
                        onClick={() => onUpdateSession({ step: 'IDEATION' })} 
                        className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                        02 Ideation
                    </button>
                </>
             )}

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
      )}

      {/* Title Area - Enhanced Animation */}
      <div 
        className="text-center space-y-3 mb-4 mt-6 md:mt-0 animate-in fade-in slide-in-from-bottom-8 ease-out fill-mode-backwards"
        style={{ animationDuration: '1000ms' }}
      >
        <h2 className="text-2xl md:text-3xl text-zinc-800 dark:text-white transition-colors duration-300 ease-in-out flex justify-center h-10 items-center">
          <TypewriterHeading text={`${activeSession.writingStyle}${activeSuffix}`} />
        </h2>
      </div>

      <div className="max-w-3xl mx-auto w-full space-y-4">
        
        {/* Research Controller - Enhanced Animation */}
        {researchProfiles.length > 0 && (
            <div 
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 bg-white dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/50 transition-colors duration-300 ease-in-out gap-3 animate-in fade-in slide-in-from-bottom-8 zoom-in-95 ease-out fill-mode-backwards"
              style={{ animationDelay: '100ms', animationDuration: '1000ms' }}
            >
              <div className="flex items-center gap-4 flex-1 w-full">
                 <div className="flex items-center gap-2 flex-1 sm:max-w-[60%]">
                     <Globe size={16} className="text-zinc-500 ml-2 shrink-0" />
                     <select 
                        className="bg-transparent text-sm text-zinc-700 dark:text-zinc-300 border-none outline-none focus:outline-none cursor-pointer pr-2 w-full truncate transition-colors duration-300 ease-in-out"
                        value={activeSession.activeProfileId || ""}
                        onChange={(e) => onUpdateSession({ activeProfileId: e.target.value || undefined, researchResults: undefined, researchSources: undefined })}
                     >
                        <option value="">Auto Research</option>
                        {researchProfiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                     </select>
                 </div>
                 
                 <button 
                    onClick={onOpenResearchSettings}
                    className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-200"
                    title="Manage Profiles"
                 >
                    <Settings size={14} />
                 </button>
                 
                 <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-zinc-200 dark:border-zinc-800 transition-colors duration-300 ease-in-out">
                     <Clock size={16} className="text-zinc-500 shrink-0" />
                     <select
                        className="bg-transparent text-sm text-zinc-700 dark:text-zinc-300 border-none outline-none focus:outline-none cursor-pointer pr-2 transition-colors duration-300 ease-in-out w-full sm:w-auto"
                        value={activeSession.researchTimeRange}
                        onChange={(e) => onUpdateSession({ researchTimeRange: e.target.value as ResearchTimeRange, researchResults: undefined })}
                     >
                        <option value="24h">Last 24h</option>
                        <option value="3d">Last 3d</option>
                        <option value="7d">Last Week</option>
                        <option value="30d">Last Month</option>
                     </select>
                 </div>
              </div>

               {(activeSession.activeProfileId || activeSession.brief.trim()) && (
                   <button
                      onClick={onFetchResearch}
                      disabled={activeSession.isResearching}
                      className="w-full sm:w-auto bg-black dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-black text-xs px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 font-medium shrink-0"
                   >
                      {activeSession.isResearching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Search web
                   </button>
               )}
            </div>
        )}

        {/* Research Results - Enhanced Animation */}
        {activeSession.researchResults && (
            <div 
                className="space-y-4 animate-in slide-in-from-top-4 fade-in ease-out"
                style={{ animationDuration: '700ms' }}
            >
               <div className="flex justify-between items-center px-1">
                   <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-blue-600 dark:text-blue-200 flex items-center gap-2 transition-colors duration-300 ease-in-out">
                          <Globe size={16} /> Live Research Deck
                      </h4>
                      <span className="text-sm text-zinc-500 hidden sm:inline">
                          Pick one to focus on.
                      </span>
                   </div>
                   <button 
                      onClick={() => onUpdateSession({ researchResults: undefined, selectedResearchIds: [] })}
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors duration-200"
                   >
                      <X size={16} />
                   </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {activeSession.researchResults.map((finding) => {
                       const isSelected = activeSession.selectedResearchIds?.includes(finding.id);
                       return (
                           <div 
                              key={finding.id}
                              onClick={() => onToggleResearchFinding(finding.id)}
                              className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 ease-in-out relative overflow-hidden group flex flex-col ${isSelected ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-500/50 ring-1 ring-blue-500/20' : 'bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                           >
                              {/* ... (Same card content as before) ... */}
                              <div className="flex justify-between items-start mb-3">
                                  <h5 className={`text-base font-bold leading-snug pr-6 transition-colors duration-300 ease-in-out ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                      {finding.headline}
                                  </h5>
                                  <div className={`shrink-0 transition-colors duration-300 ease-in-out ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-300 dark:text-zinc-700'}`}>
                                      {isSelected ? <CheckCircle size={20} className="fill-blue-100 dark:fill-blue-900/50" /> : <Circle size={20} />}
                                  </div>
                              </div>
                              
                              <div className="space-y-2 mb-4 flex-1">
                                  {finding.bullets.map((bullet, idx) => (
                                      <div key={idx} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors duration-300 ease-in-out">
                                          <span className="text-zinc-400 dark:text-zinc-600 transition-colors duration-300 ease-in-out">•</span>
                                          <span>{bullet}</span>
                                      </div>
                                  ))}
                              </div>

                              <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center gap-2 transition-colors duration-300 ease-in-out">
                                  <div className="h-1 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden transition-colors duration-300 ease-in-out">
                                      <div 
                                          className={`h-full rounded-full transition-colors duration-300 ease-in-out ${isSelected ? 'bg-blue-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} 
                                          style={{ width: `${finding.relevanceScore}%` }}
                                      />
                                  </div>
                                  <span className="text-xs text-zinc-500 font-mono">{finding.relevanceScore}% Impact</span>
                              </div>
                           </div>
                       );
                   })}
               </div>
               
               <div className="flex justify-center">
                  <button
                      onClick={onFetchMoreResearch}
                      disabled={activeSession.isResearching}
                      className="text-sm text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-2 px-5 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all"
                  >
                      {activeSession.isResearching ? <Loader2 size={14} className="animate-spin" /> : <ArrowDownCircle size={16} />}
                      Load more
                  </button>
               </div>
               {/* ... (Sources logic same) ... */}
               {activeSession.researchSources && activeSession.researchSources.length > 0 && (
                   <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-900 mt-2 transition-colors duration-300 ease-in-out">
                      <span className="text-xs text-zinc-600 py-1">Sources:</span>
                      {activeSession.researchSources.map((source, i) => (
                          <a 
                              key={i} 
                              href={source.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 px-2.5 py-1.5 rounded transition-colors truncate max-w-[180px]"
                          >
                              <Link size={10} /> {source.title}
                          </a>
                      ))}
                   </div>
                )}
            </div>
        )}

        {/* Main Input Area - Enhanced Animation (Float up + Zoom) */}
        <div 
            className="w-full relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg shadow-black/5 dark:shadow-black/20 flex flex-col p-2 transition-all duration-300 ease-in-out group focus-within:ring-1 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-700 animate-in fade-in slide-in-from-bottom-10 zoom-in-95 ease-out fill-mode-backwards"
            style={{ animationDelay: '200ms', animationDuration: '1000ms' }}
        >
          {/* ... (Content remains same) ... */}
          <div className="flex items-center px-3 pt-1 pb-1 relative z-30 gap-2">
             
             {/* Style Selector */}
             <div className="relative" ref={styleDropdownRef}>
                 <button 
                    onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-all duration-300 ease-in-out"
                 >
                    <Sparkles size={14} className={activeSession.writingStyle !== WritingStyle.DEFAULT ? "text-purple-500 dark:text-purple-400" : ""} />
                    <span>{activeSession.writingStyle}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isStyleDropdownOpen ? 'rotate-180' : ''}`} />
                 </button>

                 {isStyleDropdownOpen && (
                     <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-visible animate-in fade-in zoom-in-95 duration-150 z-50">
                        {/* Hover Info Card - HIDDEN ON MOBILE */}
                        {hoveredStyle && (
                            <div className="hidden md:block absolute left-full top-0 ml-3 w-64 bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md text-white p-4 rounded-xl border border-zinc-800/50 dark:border-zinc-700/50 shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200 z-[60]">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                    <div className="p-1 bg-white/10 rounded-lg">
                                        <User size={14} className="text-white" />
                                    </div>
                                    <span className="font-semibold text-sm">{hoveredStyle}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
                                        {getStyleInfo(hoveredStyle).role}
                                    </p>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        {getStyleInfo(hoveredStyle).desc}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="p-1">
                            <button 
                                onClick={() => handleStyleChange(WritingStyle.DEFAULT)}
                                onMouseEnter={() => setHoveredStyle(WritingStyle.DEFAULT)}
                                onMouseLeave={() => setHoveredStyle(null)}
                                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between ${activeSession.writingStyle === WritingStyle.DEFAULT ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'}`}
                            >
                                Alfred
                                {activeSession.writingStyle === WritingStyle.DEFAULT && <CheckCircle size={14} />}
                            </button>

                            <button 
                                onClick={() => handleStyleChange(WritingStyle.ABDULLAH)}
                                onMouseEnter={() => setHoveredStyle(WritingStyle.ABDULLAH)}
                                onMouseLeave={() => setHoveredStyle(null)}
                                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between ${activeSession.writingStyle === WritingStyle.ABDULLAH ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'}`}
                            >
                                Abdullah
                                {activeSession.writingStyle === WritingStyle.ABDULLAH && <CheckCircle size={14} />}
                            </button>

                            <button 
                                onClick={() => handleStyleChange(WritingStyle.JOY)}
                                onMouseEnter={() => setHoveredStyle(WritingStyle.JOY)}
                                onMouseLeave={() => setHoveredStyle(null)}
                                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between ${activeSession.writingStyle === WritingStyle.JOY ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'}`}
                            >
                                Joy
                                {activeSession.writingStyle === WritingStyle.JOY && <CheckCircle size={14} />}
                            </button>
                            
                            {customStyles.length > 0 && <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-1" />}
                            
                            {customStyles.map(style => (
                                <button 
                                    key={style.id}
                                    onClick={() => handleStyleChange(style.name)}
                                    onMouseEnter={() => setHoveredStyle(style.name)}
                                    onMouseLeave={() => setHoveredStyle(null)}
                                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between ${activeSession.writingStyle === style.name ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'}`}
                                >
                                    {style.name}
                                    {activeSession.writingStyle === style.name && <CheckCircle size={14} />}
                                </button>
                            ))}

                            <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-1" />
                            
                            <button onClick={() => { setIsStyleDropdownOpen(false); onOpenStyleModal(); }} className="w-full text-left px-3 py-2.5 text-sm text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg flex items-center gap-2">
                                <Plus size={14} /> Create Style
                            </button>
                        </div>
                     </div>
                 )}
             </div>

             {/* Format Selector */}
             <div className="relative" ref={formatDropdownRef}>
                 <button 
                    onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-all duration-300 ease-in-out"
                 >
                    <LayoutTemplate size={14} />
                    <span>{activeSession.writingFormat || 'Tweet'}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isFormatDropdownOpen ? 'rotate-180' : ''}`} />
                 </button>

                 {isFormatDropdownOpen && (
                     <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50">
                        <div className="p-1">
                            {quickFormats.map(fmt => (
                                <button 
                                    key={fmt.id}
                                    onClick={() => handleFormatChange(fmt.name)}
                                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between ${activeSession.writingFormat === fmt.name ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'}`}
                                >
                                    {fmt.name}
                                    {activeSession.writingFormat === fmt.name && <CheckCircle size={14} />}
                                </button>
                            ))}

                            <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-1" />
                            
                            <button onClick={() => { setIsFormatDropdownOpen(false); onOpenStyleLibrary(); }} className="w-full text-left px-3 py-2.5 text-sm text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg flex items-center gap-2">
                                <BookOpen size={14} /> Format Library
                            </button>
                        </div>
                     </div>
                 )}
             </div>

          </div>

          <div className="flex items-end gap-2 relative">
             {!activeSession.brief && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none py-2 pl-4 pr-12 overflow-hidden">
                    <p className={`text-base text-zinc-400 dark:text-zinc-600 transition-all duration-1000 ease-in-out truncate ${isPlaceholderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                        {PLACEHOLDERS[placeholderIndex]}
                    </p>
                </div>
             )}

            <textarea 
                ref={textareaRef}
                rows={1}
                value={activeSession.brief}
                onChange={(e) => handleBriefChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onGenerateIdeas();
                    }
                }}
                className="flex-1 w-full bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-base text-zinc-900 dark:text-zinc-200 py-2 pl-4 pr-2 resize-none max-h-[200px] overflow-y-auto leading-relaxed custom-scrollbar min-h-[40px] transition-colors duration-300 ease-in-out relative z-10 placeholder-transparent"
            />

            <button 
                onClick={onGenerateIdeas}
                disabled={activeSession.isProcessing || (!activeSession.brief && !activeSession.selectedResearchIds?.length)}
                className={`p-2 rounded-full shrink-0 mb-1 mr-1 transition-all duration-200 ease-out shadow-sm flex items-center justify-center relative z-20 ${
                    (activeSession.brief || activeSession.selectedResearchIds?.length)
                    ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-105 active:scale-95' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
                title="Generate Concepts"
            >
                {activeSession.isProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <ArrowUp size={20} strokeWidth={2.5} className={activeSession.selectedResearchIds?.length ? "text-blue-500 dark:text-blue-600" : ""} />
                )}
            </button>
          </div>
        </div>
        
        {/* Footer Hints - Enhanced Animation */}
        <div 
          className="flex justify-center mt-6 animate-in fade-in fill-mode-backwards"
          style={{ animationDelay: '500ms', animationDuration: '1000ms' }}
        >
            {activeSession.selectedResearchIds?.length ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30 text-sm text-blue-600 dark:text-blue-300 transition-colors duration-300 ease-in-out max-w-full">
                    <Globe size={12} className="shrink-0" />
                    <span className="truncate">Context Active: {activeSession.researchResults?.find(r => r.id === activeSession.selectedResearchIds![0])?.headline}</span>
                </div>
            ) : (
                researchProfiles.length === 0 && (
                    <div className="w-full flex flex-col items-center gap-3">
                        {/* Onboarding hint — shown once to new users */}
                        {showResearchHint && (
                            <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
                                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md max-w-[260px]">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100 leading-snug">Set it up once.</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">Alfred handles the research from there.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowResearchHint(false);
                                            localStorage.setItem('alfred_seen_research_hint', 'true');
                                        }}
                                        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mt-0.5"
                                        aria-label="Dismiss"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                {/* Downward arrow pointing at button */}
                                <div className="flex justify-center mt-1">
                                    <svg width="12" height="8" viewBox="0 0 12 8" className="text-zinc-200 dark:text-zinc-800 drop-shadow-sm" fill="currentColor">
                                        <path d="M6 8L0 0h12L6 8z" />
                                    </svg>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setShowResearchHint(false);
                                localStorage.setItem('alfred_seen_research_hint', 'true');
                                onOpenResearchSettings();
                            }}
                            className="group flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Globe size={14} className="text-zinc-600 dark:text-zinc-300 animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                                Research on autopilot
                            </span>
                        </button>
                    </div>
                )
            )}
        </div>

      </div>
    </div>
  );
};

export default BriefView;