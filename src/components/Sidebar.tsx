import React, { useState, useEffect, useRef } from 'react';
import { Session } from '../types';
import { Command, Plus, X, ShieldCheck, Settings, PanelLeftClose, PanelLeftOpen, GripVertical, History, Menu, Sun, Moon, LogOut } from 'lucide-react';

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
  onToggleTheme
}) => {
  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Pinned sessions first, then the rest ordered by last accessed / created
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.lastAccessedAt ?? b.createdAt) - (a.lastAccessedAt ?? a.createdAt);
  });
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

        {/* Action Button */}
        <div className="p-4 shrink-0 transition-colors duration-300 ease-in-out">
             <button 
                onClick={() => mobile ? handleMobileAction(onNewSession) : onNewSession()}
                className={`w-full flex items-center justify-center gap-2 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg font-semibold transition-all mb-4 ${isCollapsed && !mobile ? 'p-3' : 'px-4 py-2.5 text-sm'}`}
                title="New Brief"
            >
                <Plus size={(isCollapsed && !mobile) ? 20 : 16} /> 
                {(!isCollapsed || mobile) && "New Brief"}
            </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 px-2">
            {(!isCollapsed || mobile) && (
                <p className="px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors duration-300 ease-in-out">
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
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
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
             className={`w-full flex items-center gap-2 py-2 text-zinc-500 hover:text-black dark:hover:text-white font-medium transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 ${(isCollapsed && !mobile) ? 'justify-center px-0' : 'px-2 text-sm'}`}
             title="Guardrails"
           >
             <ShieldCheck size={20} /> {(!isCollapsed || mobile) && "Boundaries"}
           </button>
           <button
             onClick={() => mobile ? handleMobileAction(onOpenSettings) : onOpenSettings()}
             className={`w-full flex items-center gap-2 py-2 text-zinc-500 hover:text-black dark:hover:text-white font-medium transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 ${(isCollapsed && !mobile) ? 'justify-center px-0' : 'px-2 text-sm'}`}
             title="Settings"
           >
             <Settings size={20} /> {(!isCollapsed || mobile) && "Settings"}
           </button>
           <button
             onClick={() => mobile ? handleMobileAction(onLogout) : onLogout()}
             className={`w-full flex items-center gap-2 py-2 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 ${(isCollapsed && !mobile) ? 'justify-center px-0' : 'px-2 text-sm'}`}
             title="Sign Out"
           >
             <LogOut size={20} /> {(!isCollapsed || mobile) && "Sign Out"}
           </button>
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
        <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

      {/* Mobile Header - Always Visible on Mobile */}
      <div 
        className="md:hidden px-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-black shrink-0 sticky top-0 z-30 transition-colors duration-300 ease-in-out"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
      >
         <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsMobileOpen(true)}
                className="p-1 -ml-1 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white"
             >
                <Menu size={24} />
             </button>
             <div>
                <h1 className="font-semibold text-lg text-black dark:text-white leading-none transition-colors duration-300 ease-in-out">Alfred</h1>
                {sessionName !== "New Brief" && <span className="text-[10px] text-zinc-500 block mt-0.5 truncate max-w-[120px] transition-colors duration-300 ease-in-out">{sessionName}</span>}
             </div>
         </div>
         <div className="flex gap-3 items-center">
             <button 
                onClick={onToggleTheme}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
             >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <button onClick={onNewSession} className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg transition-colors duration-300 ease-in-out"><Plus size={16}/></button>
         </div>
      </div>
    </>
  );
};

export default Sidebar;