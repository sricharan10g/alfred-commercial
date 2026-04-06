import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Session, OnboardingState } from '../types';
import { Command, Plus, X, ShieldCheck, Settings, PanelLeftClose, PanelLeftOpen, GripVertical, History, Menu, Sun, Moon, LogOut } from 'lucide-react';
import OnboardingChecklist from './OnboardingChecklist';

interface Props {
  sessions: Session[];
  activeSessionId: string;
  activeSessionStep: string;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onPinSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onOpenGuardrails: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onboardingState: OnboardingState;
  onOpenOnboardingStep: (step: keyof OnboardingState['steps']) => void;
}

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const COLLAPSED_WIDTH = 70;

const Sidebar: React.FC<Props> = ({
  sessions,
  activeSessionId,
  activeSessionStep,
  onNewSession,
  onSelectSession,
  onPinSession,
  onDeleteSession,
  onOpenGuardrails,
  onOpenSettings,
  onLogout,
  theme,
  onToggleTheme,
  onboardingState,
  onOpenOnboardingStep,
}) => {
  const activeSession = sessions.find(s => s.id === activeSessionId);
  // Show "New Brief" when:
  // 1. Not on BRIEF step (in IDEATION or DRAFTING) — always show
  // 2. On BRIEF step but session has ideas/drafts (revisiting an old session) — show
  // Hide only when on a fresh empty BRIEF with no progress
  const hasProgress = (activeSession?.ideas?.length ?? 0) > 0 || (activeSession?.drafts?.length ?? 0) > 0;
  const showNewBrief = activeSessionStep !== 'BRIEF' || hasProgress;

  // Pinned sessions first, then the rest ordered by last accessed / created
  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.lastAccessedAt ?? b.createdAt) - (a.lastAccessedAt ?? a.createdAt);
  }), [sessions]);
  const sessionName = activeSession?.name || "New Brief";

  const [width, setWidth] = useState(260);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMobileAction = (action: () => void) => {
    action();
    setIsMobileOpen(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      let newWidth = e.clientX;
      
      // Snap to collapse
      if (newWidth < 150) {
          setIsCollapsed(true);
          setIsResizing(false);
          return;
      }

      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      
      setWidth(newWidth);
      if (isCollapsed) setIsCollapsed(false);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, isCollapsed]);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
        {/* Header */}
        <div 
          className={`p-6 border-b border-zinc-200/30 dark:border-zinc-800/30 flex items-center transition-colors duration-300 ease-in-out ${isCollapsed && !mobile ? 'justify-center' : 'justify-between'}`}
          style={mobile ? { paddingTop: 'calc(env(safe-area-inset-top) + 24px)' } : {}}
        >
          {(!isCollapsed || mobile) && (
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight truncate transition-colors duration-300 ease-in-out">
                <Command size={20} className="text-zinc-900 dark:text-white shrink-0 transition-colors duration-300 ease-in-out" />
                Alfred
            </h1>
          )}
          {isCollapsed && !mobile && (
             <button onClick={toggleCollapse} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                <Command size={24} />
             </button>
          )}
          {!isCollapsed && !mobile && (
             <button onClick={toggleCollapse} className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors">
                <PanelLeftClose size={16} />
             </button>
          )}
          {mobile && (
             <button onClick={() => setIsMobileOpen(false)} className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors">
                <X size={20} />
             </button>
          )}
        </div>

        {/* Action Button — hidden when on BRIEF with empty input, smooth transition */}
        <div className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${showNewBrief ? 'max-h-20 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'}`}>
             <button
                onClick={() => mobile ? handleMobileAction(onNewSession) : onNewSession()}
                className={`w-full flex items-center justify-center gap-2 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg font-semibold transition-all mb-4 ${isCollapsed && !mobile ? 'p-3' : 'px-4 py-2.5 text-sm'}`}
                title="New Brief"
            >
                <Plus size={(isCollapsed && !mobile) ? 20 : 16} />
                {(!isCollapsed || mobile) && "New Brief"}
            </button>
        </div>

        {/* Onboarding Checklist */}
        {!onboardingState.completedAt && (
            <OnboardingChecklist
                onboardingState={onboardingState}
                onOpenStep={onOpenOnboardingStep}
                isCollapsed={isCollapsed && !mobile}
            />
        )}

        {/* History List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 px-2">
            {(!isCollapsed || mobile) && (
                <p className={`px-3 text-[10px] font-bold ${mobile ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'} uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors duration-300 ease-in-out`}>
                    History
                </p>
            )}
            
            <div className="space-y-0.5">
                {sortedSessions.map(session => (
                    <div
                        key={session.id}
                        onClick={() => mobile ? handleMobileAction(() => onSelectSession(session.id)) : onSelectSession(session.id)}
                        className={`group w-full rounded-md transition-colors flex items-center cursor-pointer ${
                            (isCollapsed && !mobile) ? 'justify-center p-2' : 'px-3 py-2 gap-2 text-sm'
                        } ${
                            activeSessionId === session.id
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-medium'
                            : `${mobile ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'} hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50`
                        }`}
                        title={(isCollapsed && !mobile) ? session.name : undefined}
                    >
                        {(isCollapsed && !mobile) ? (
                            // Collapsed: yellow dot for pinned, grey dot otherwise
                            <button
                                onClick={(e) => { e.stopPropagation(); onPinSession(session.id); }}
                                title={session.pinned ? 'Unpin' : 'Pin'}
                                className="w-2 h-2 rounded-full shrink-0 transition-all"
                                style={{ background: session.pinned ? '#facc15' : 'currentColor' }}
                            />
                        ) : (
                            <>
                                {/* Yellow pin dot */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPinSession(session.id); }}
                                    title={session.pinned ? 'Unpin' : 'Pin to keep forever'}
                                    className={`shrink-0 w-2 h-2 rounded-full transition-all duration-200 ${
                                        session.pinned
                                            ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]'
                                            : 'bg-transparent border border-zinc-300 dark:border-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-yellow-400 hover:border-yellow-400'
                                    }`}
                                />
                                <span className="truncate flex-1">{session.name}</span>
                                <button
                                    onClick={(e) => onDeleteSession(session.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 dark:hover:text-red-400 transition-all rounded-md"
                                    title="Delete conversation"
                                >
                                    <X size={12} />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Footer Actions */}
        <div 
          className="mt-auto p-4 border-t border-zinc-200/30 dark:border-zinc-800/30 space-y-1 transition-colors duration-300 ease-in-out"
          style={mobile ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' } : {}}
        >
           <button 
             onClick={() => mobile ? handleMobileAction(onOpenGuardrails) : onOpenGuardrails()}
             className={`w-full flex items-center gap-2 py-2 ${mobile ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'} hover:text-black dark:hover:text-white font-medium transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 ${(isCollapsed && !mobile) ? 'justify-center px-0' : 'px-2 text-sm'}`}
             title="Guardrails"
           >
             <ShieldCheck size={20} /> {(!isCollapsed || mobile) && "Boundaries"}
           </button>
           <button
             onClick={() => mobile ? handleMobileAction(onOpenSettings) : onOpenSettings()}
             className={`w-full flex items-center gap-2 py-2 ${mobile ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'} hover:text-black dark:hover:text-white font-medium transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 ${(isCollapsed && !mobile) ? 'justify-center px-0' : 'px-2 text-sm'}`}
             title="Settings"
           >
             <Settings size={20} /> {(!isCollapsed || mobile) && "Settings"}
           </button>
           <button
             onClick={() => mobile ? handleMobileAction(onLogout) : onLogout()}
             className={`w-full flex items-center gap-2 py-2 ${mobile ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'} hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 ${(isCollapsed && !mobile) ? 'justify-center px-0' : 'px-2 text-sm'}`}
             title="Sign Out"
           >
             <LogOut size={20} /> {(!isCollapsed || mobile) && "Sign Out"}
           </button>
           {(!isCollapsed || mobile) && (
             <div className="flex items-center gap-2 px-2 pt-2 flex-wrap">
               <Link href="/privacy" target="_blank" className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">Privacy</Link>
               <span className="text-zinc-700 text-[10px]">·</span>
               <Link href="/terms" target="_blank" className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">Terms</Link>
             </div>
           )}
        </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsMobileOpen(false)} />
        
        {/* Drawer Content */}
        <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-white/90 dark:bg-black/70 backdrop-blur-2xl border-r border-zinc-200 dark:border-zinc-700/30 flex flex-col shadow-2xl transition-transform duration-300 ease-out will-change-transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <SidebarContent mobile={true} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div 
        ref={sidebarRef}
        className={`relative z-10 border-r border-white/20 dark:border-zinc-700/30 bg-white/40 dark:bg-black/40 backdrop-blur-2xl flex flex-col hidden md:flex shrink-0 transition-all duration-300 ease-in-out ${isResizing ? 'duration-0' : ''}`}
        style={{ width: isCollapsed ? COLLAPSED_WIDTH : width }}
      >
        <SidebarContent />

        {/* Resize Handle */}
        {!isCollapsed && (
            <div 
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors z-50 flex flex-col justify-center items-center group"
                onMouseDown={startResizing}
            >
                <div className="h-8 w-1 bg-zinc-300 dark:bg-zinc-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        )}
      </div>

      {/* Mobile Header - Floating buttons, no bar */}
      <div
        className="md:hidden px-4 flex justify-between items-center shrink-0 absolute top-0 left-0 right-0 z-30"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
         <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2.5 rounded-full border border-white/30 dark:border-white/15 bg-white/20 dark:bg-black/20 backdrop-blur-md text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-all"
         >
            <Menu size={20} />
         </button>
         <div className="flex gap-2.5 items-center">
             <button
                onClick={onNewSession}
                className={`p-2.5 rounded-full bg-black/80 dark:bg-white/80 backdrop-blur-md text-white dark:text-black transition-all duration-300 ease-in-out ${showNewBrief ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`}
             >
                <Plus size={18} />
             </button>
             <button
                onClick={onToggleTheme}
                className="p-2.5 rounded-full border border-white/30 dark:border-white/15 bg-white/20 dark:bg-black/20 backdrop-blur-md text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-all"
             >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>
         </div>
      </div>
    </>
  );
};

export default Sidebar;