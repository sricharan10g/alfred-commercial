import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Session, OnboardingState } from '../types';
import { Command, Plus, X, ShieldCheck, Settings, PanelLeftClose, Menu, Sun, Moon, LogOut } from 'lucide-react';
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
const ANIM_MS = 300;

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
  const hasProgress = (activeSession?.ideas?.length ?? 0) > 0 || (activeSession?.drafts?.length ?? 0) > 0;
  const showNewBrief = activeSessionStep !== 'BRIEF' || hasProgress;

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.lastAccessedAt ?? b.createdAt) - (a.lastAccessedAt ?? a.createdAt);
  }), [sessions]);

  // --- Width — persisted to localStorage ---
  const [width, setWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('alfred_sidebar_width');
      const parsed = saved ? parseInt(saved, 10) : NaN;
      return !isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH ? parsed : 260;
    }
    return 260;
  });
  // Ref so mouseUp handler always reads the latest width without stale closure
  const widthRef = useRef(width);
  widthRef.current = width;

  // --- Collapse animation ---
  // isCollapsed          : drives CSS width only
  // showCollapsedContent : drives which layout renders (delayed so expanded content
  //                        stays visible and clips naturally during the shrink)
  // showVeil             : opaque overlay that covers the layout snap at the very end
  //                        — fades in fast (covers the snap), fades out slowly (smooth reveal)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCollapsedContent, setShowCollapsedContent] = useState(false);
  const [showVeil, setShowVeil] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleCollapse = () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    if (animTimerRef2.current) clearTimeout(animTimerRef2.current);

    if (isCollapsed) {
      // EXPANDING: drop veil + collapsed content instantly → grow sidebar → text fades in
      setShowVeil(false);
      setShowCollapsedContent(false);
      setIsCollapsed(false);
    } else {
      // COLLAPSING:
      // T=0        → start shrinking width
      // T=ANIM-80  → veil fades in fast (covers the upcoming layout snap)
      // T=ANIM     → layout snaps to icon-only under the veil
      // T=ANIM     → veil starts fading out slowly (smooth reveal of settled state)
      setIsCollapsed(true);
      // T=160ms — veil begins drifting in (sidebar is ~half collapsed)
      animTimerRef.current = setTimeout(() => {
        setShowVeil(true);
        // T=320ms — sidebar fully collapsed; snap layout under the veil, then let it dissolve
        animTimerRef2.current = setTimeout(() => {
          setShowCollapsedContent(true);
          setShowVeil(false);
        }, 160);
      }, ANIM_MS - 140);
    }
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMobileAction = (action: () => void) => {
    action();
    setIsMobileOpen(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;

      // Drag past threshold → snap to collapsed
      if (newWidth < 150) {
        setIsCollapsed(true);
        setShowCollapsedContent(true);
        setIsResizing(false);
        return;
      }

      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;

      setWidth(newWidth);
      if (isCollapsed) {
        setShowCollapsedContent(false);
        setIsCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Persist the final width — widthRef avoids stale closure
      localStorage.setItem('alfred_sidebar_width', String(widthRef.current));
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

  // Text fade helper — CSS transition-delay sequences the opacity relative to the width animation:
  //   collapsing → text fades out immediately (duration-150, no delay)
  //   expanding  → text fades in after sidebar has grown (duration-300, delay-[250ms])
  // Mobile always renders full opacity.
  const tf = (mobile: boolean) =>
    mobile
      ? ''
      : `transition-opacity ${isCollapsed ? 'opacity-0 duration-150 delay-0' : 'opacity-100 duration-300 delay-[250ms]'}`;

  // --- renderContent: plain render function (NOT a component) so React never
  //     unmounts/remounts the tree when the parent re-renders. ---
  const renderContent = (mobile = false) => (
    <>
      {/* Header */}
      <div
        className={`p-5 border-b border-zinc-200/30 dark:border-zinc-800/30 flex items-center transition-colors duration-300 ease-in-out ${showCollapsedContent && !mobile ? 'justify-center' : 'justify-between'}`}
        style={mobile ? { paddingTop: 'calc(env(safe-area-inset-top) + 24px)' } : {}}
      >
        {(!showCollapsedContent || mobile) && (
          <h1 className={`text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight truncate transition-colors duration-300 ease-in-out ${tf(mobile)}`}>
            <Command size={20} className="text-zinc-900 dark:text-white shrink-0 transition-colors duration-300 ease-in-out" />
            Alfred
          </h1>
        )}
        {/* Collapsed state: show expand icon only once sidebar has fully shrunk */}
        {showCollapsedContent && !mobile && (
          <button
            onClick={toggleCollapse}
            className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            title="Expand sidebar"
          >
            <Command size={24} />
          </button>
        )}
        {/* Expanded state: collapse button */}
        {!showCollapsedContent && !mobile && (
          <button
            onClick={toggleCollapse}
            className={`text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors ${tf(mobile)}`}
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
        {mobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* New Brief button — grid-rows animation (no max-height jank) */}
      <div className={`shrink-0 grid transition-all duration-300 ease-in-out ${showNewBrief ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <button
              onClick={() => mobile ? handleMobileAction(onNewSession) : onNewSession()}
              className={`w-full flex items-center justify-center gap-2 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg font-semibold transition-all ${showCollapsedContent && !mobile ? 'p-3' : 'px-4 py-2.5 text-sm'}`}
              title="New Brief"
            >
              <Plus size={(showCollapsedContent && !mobile) ? 20 : 16} />
              {(!showCollapsedContent || mobile) && (
                <span className={tf(mobile)}>New Brief</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      {!onboardingState.completedAt && (
        <OnboardingChecklist
          onboardingState={onboardingState}
          onOpenStep={onOpenOnboardingStep}
          isCollapsed={showCollapsedContent && !mobile}
        />
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 px-2">
        {(!showCollapsedContent || mobile) && (
          <p className={`px-3 text-[10px] font-bold whitespace-nowrap overflow-hidden ${mobile ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'} uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors duration-300 ease-in-out ${tf(mobile)}`}>
            History
          </p>
        )}

        <div className="space-y-0.5">
          {sortedSessions.map(session => (
            <div
              key={session.id}
              onClick={() => mobile ? handleMobileAction(() => onSelectSession(session.id)) : onSelectSession(session.id)}
              className={`group w-full rounded-md transition-colors flex items-center cursor-pointer ${
                (showCollapsedContent && !mobile) ? 'justify-center p-2' : 'px-3 py-2 gap-2 text-sm'
              } ${
                activeSessionId === session.id
                  ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-medium'
                  : `${mobile ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'} hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50`
              }`}
              title={(showCollapsedContent && !mobile) ? session.name : undefined}
            >
              {(showCollapsedContent && !mobile) ? (
                // Collapsed: dot only — yellow = pinned, grey = unpinned
                <button
                  onClick={(e) => { e.stopPropagation(); onPinSession(session.id); }}
                  title={session.pinned ? 'Unpin' : 'Pin'}
                  className="w-2 h-2 rounded-full shrink-0 transition-all"
                  style={{ background: session.pinned ? '#facc15' : 'currentColor' }}
                />
              ) : (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPinSession(session.id); }}
                    title={session.pinned ? 'Unpin' : 'Pin to keep forever'}
                    className={`shrink-0 w-2 h-2 rounded-full transition-all duration-200 ${
                      session.pinned
                        ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]'
                        : 'bg-transparent border border-zinc-300 dark:border-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-yellow-400 hover:border-yellow-400'
                    }`}
                  />
                  <span className={`truncate flex-1 ${tf(mobile)}`}>{session.name}</span>
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 dark:hover:text-red-400 transition-all rounded-md ${tf(mobile)}`}
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
          className={`w-full flex items-center gap-2 py-2 ${mobile ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'} hover:text-black dark:hover:text-white font-medium transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 ${(showCollapsedContent && !mobile) ? 'justify-center px-0' : 'px-2 text-sm'}`}
          title="Guardrails"
        >
          <ShieldCheck size={20} />
          {(!showCollapsedContent || mobile) && <span className={`whitespace-nowrap overflow-hidden ${tf(mobile)}`}>Boundaries</span>}
        </button>
        <button
          onClick={() => mobile ? handleMobileAction(onOpenSettings) : onOpenSettings()}
          className={`w-full flex items-center gap-2 py-2 ${mobile ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'} hover:text-black dark:hover:text-white font-medium transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 ${(showCollapsedContent && !mobile) ? 'justify-center px-0' : 'px-2 text-sm'}`}
          title="Settings"
        >
          <Settings size={20} />
          {(!showCollapsedContent || mobile) && <span className={`whitespace-nowrap overflow-hidden ${tf(mobile)}`}>Settings</span>}
        </button>
        <button
          onClick={() => mobile ? handleMobileAction(onLogout) : onLogout()}
          className={`w-full flex items-center gap-2 py-2 ${mobile ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'} hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 ${(showCollapsedContent && !mobile) ? 'justify-center px-0' : 'px-2 text-sm'}`}
          title="Sign Out"
        >
          <LogOut size={20} />
          {(!showCollapsedContent || mobile) && <span className={`whitespace-nowrap overflow-hidden ${tf(mobile)}`}>Sign Out</span>}
        </button>
        {(!showCollapsedContent || mobile) && (
          <div className={`flex items-center gap-2 px-2 pt-2 flex-wrap ${tf(mobile)}`}>
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
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
        {/* Drawer — backdrop-blur-xl (down from 2xl, lighter GPU cost) */}
        <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-white/90 dark:bg-black/70 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-700/30 flex flex-col shadow-2xl transition-transform duration-300 ease-out will-change-transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {renderContent(true)}
        </div>
      </div>

      {/* Desktop Sidebar — backdrop-blur-xl (down from 2xl) */}
      <div
        ref={sidebarRef}
        className={`relative z-10 border-r border-white/20 dark:border-zinc-700/30 bg-white/40 dark:bg-black/40 backdrop-blur-xl flex-col hidden md:flex shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${isResizing ? '!duration-0' : ''}`}
        style={{ width: isCollapsed ? COLLAPSED_WIDTH : width }}
      >
        {/*
          Inner shell: pinned to a fixed pixel width so content never reflows during
          the collapse/expand animation. The outer container is the clipping mask.

          - Collapsing: outer shrinks 260→70 while inner stays at 260 → content clips, no reflow
          - After animation: showCollapsedContent=true → inner snaps to 70 (icon layout)
          - Expanding: inner immediately jumps to 260, outer grows to reveal it → no reflow
          - Resizing: outer and inner track together; text uses whitespace-nowrap so it clips
            instead of wrapping — clipping looks intentional, wrapping looks broken
        */}
        <div
          className="flex flex-col h-full"
          style={{
            width: showCollapsedContent ? COLLAPSED_WIDTH : width,
            minWidth: showCollapsedContent ? COLLAPSED_WIDTH : width,
          }}
        >
          {renderContent()}
        </div>{/* end inner shell */}

        {/* Layout-switch veil — same hue as the sidebar background so it reads as
            the sidebar gently solidifying, not a foreign flash.
            Drifts in slowly alongside the shrink, dissolves even slower after the snap. */}
        <div className={`absolute inset-0 z-20 pointer-events-none bg-white/30 dark:bg-black/40 transition-opacity ease-in-out ${showVeil ? 'opacity-100 duration-[180ms]' : 'opacity-0 duration-[500ms]'}`} />

        {/* Subtle right-edge mask */}
        <div className="absolute inset-y-0 right-0 w-6 pointer-events-none bg-gradient-to-r from-transparent to-white/40 dark:to-black/40" />

        {/* Resize Handle — 12px hit area, always-visible 1px line that brightens on hover */}
        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-3 h-full cursor-col-resize z-50 group flex items-center justify-end"
            onMouseDown={startResizing}
          >
            <div className={`w-px h-full transition-all duration-150 ${
              isResizing
                ? 'bg-blue-500 opacity-100'
                : 'bg-zinc-300 dark:bg-zinc-700 opacity-40 group-hover:opacity-100 group-hover:bg-blue-400 dark:group-hover:bg-blue-500'
            }`} />
          </div>
        )}
      </div>

      {/* Mobile Header — floating buttons, no bar */}
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
