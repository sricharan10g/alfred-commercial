import React, { useState, useEffect } from 'react';
import { CustomStyle, ResearchProfile, AIProvider } from '../types';
import { X, Trash2, History, Palette, Pencil, Globe, Plus, Cpu, User, LogOut, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/Toast';

interface UserUsage {
    plan: string;
    monthCount: number;
    monthlyLimit: number;
    remaining: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'research' | 'ai-model' | 'account';
  userUsage?: UserUsage | null;
  customStyles: CustomStyle[];
  onDeleteStyle: (id: string) => void;
  onEditStyle: (style: CustomStyle) => void;
  onClearHistory: () => void;
  // Research Props
  researchProfiles: ResearchProfile[];
  onAddResearchProfile: (p: ResearchProfile) => void;
  onUpdateResearchProfile: (p: ResearchProfile) => void;
  onDeleteResearchProfile: (id: string) => void;
  // AI Provider Props
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  // Style creation
  onCreateStyle?: () => void;
}

const AI_PROVIDERS: { id: AIProvider; name: string; description: string; model: string; comingSoon?: boolean }[] = [
    { id: 'gemini', name: 'Gemini', description: 'Fast', model: 'gemini-3-flash-preview' },
    { id: 'claude', name: 'Claude', description: 'Creative', model: 'claude-sonnet-4-6', comingSoon: true },
    { id: 'openai', name: 'GPT', description: 'Analysis', model: 'gpt-4.1', comingSoon: true },
];

const SettingsModal: React.FC<Props> = ({
    isOpen, onClose, initialTab = 'general',
    userUsage,
    customStyles, onDeleteStyle, onEditStyle,
    onClearHistory,
    researchProfiles, onAddResearchProfile, onUpdateResearchProfile, onDeleteResearchProfile,
    selectedProvider, onProviderChange,
    onCreateStyle
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'research' | 'ai-model' | 'account'>(initialTab);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loadingUpgrade, setLoadingUpgrade] = useState<'starter' | 'pro' | null>(null);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileTopics, setNewProfileTopics] = useState('');
  const [newProfileAudience, setNewProfileAudience] = useState('');
  const [newProfileDomains, setNewProfileDomains] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    if (!newProfileName || !newProfileTopics) return;
    const domains = newProfileDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0);
    const profileData: ResearchProfile = {
        id: editingId || crypto.randomUUID(),
        name: newProfileName,
        topics: newProfileTopics,
        audience: newProfileAudience,
        domains: domains
    };
    if (editingId) {
        onUpdateResearchProfile(profileData);
    } else {
        onAddResearchProfile(profileData);
    }
    resetForm();
  };

  const handleEditProfile = (profile: ResearchProfile) => {
      setNewProfileName(profile.name);
      setNewProfileTopics(profile.topics);
      setNewProfileAudience(profile.audience);
      setNewProfileDomains(profile.domains?.join('\n') || '');
      setEditingId(profile.id);
      setIsAddingProfile(true);
  };

  const resetForm = () => {
      setNewProfileName('');
      setNewProfileTopics('');
      setNewProfileAudience('');
      setNewProfileDomains('');
      setEditingId(null);
      setIsAddingProfile(false);
  };

  const handleLogout = async () => {
      setIsLoggingOut(true);
      try {
          showToast('Signed out.', 'info');
          await logout();
          onClose();
      } finally {
          setIsLoggingOut(false);
      }
  };

  const handleUpgrade = async (plan: 'starter' | 'pro') => {
      setLoadingUpgrade(plan);
      try {
          const res = await fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan, userId: user?.$id, email: user?.email, name: user?.name }),
          });
          const data = await res.json();
          if (data.checkoutUrl) {
              window.location.href = data.checkoutUrl;
          } else {
              throw new Error(data.error || 'No checkout URL received');
          }
      } catch (err) {
          console.error('[Settings] Checkout error:', err);
          showToast('Checkout failed. Please try again.', 'error');
          setLoadingUpgrade(null);
      }
  };

  const planLabel = userUsage?.plan === 'pro' ? 'Pro' : userUsage?.plan === 'starter' ? 'Starter' : 'Free';
  const planColor =
      userUsage?.plan === 'pro'
          ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          : userUsage?.plan === 'starter'
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
  const isFree = !userUsage || userUsage.plan === 'free';

  const initials = user?.name
      ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
      : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm md:p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-zinc-950/90 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-700/30 w-full max-w-xl rounded-t-2xl md:rounded-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-500 ease-out max-h-[85vh] md:max-h-[90vh] transition-colors duration-200">

        {/* Header */}
        <div className="relative px-5 md:px-6 pt-6 md:pt-7 pb-5 md:pb-5 shrink-0">
          <h2 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-white text-center">Settings</h2>
          <button onClick={onClose} className="absolute top-5 md:top-6 right-4 md:right-5 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center border-b border-zinc-100/50 dark:border-zinc-800/30 px-3 md:px-6 shrink-0">
            <button onClick={() => setActiveTab('general')}
                className={`py-2.5 md:py-3 px-3 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${activeTab === 'general' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                General
            </button>
            <button onClick={() => setActiveTab('research')}
                className={`py-2.5 md:py-3 px-3 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-1.5 md:gap-2 whitespace-nowrap ${activeTab === 'research' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                <Globe size={12} className="md:w-3.5 md:h-3.5" /> Research
            </button>
            <button onClick={() => setActiveTab('ai-model')}
                className={`py-2.5 md:py-3 px-3 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-1.5 md:gap-2 whitespace-nowrap ${activeTab === 'ai-model' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                <Cpu size={12} className="md:w-3.5 md:h-3.5" /> AI Model
            </button>
            <button onClick={() => setActiveTab('account')}
                className={`py-2.5 md:py-3 px-3 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-1.5 md:gap-2 whitespace-nowrap ${activeTab === 'account' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                <User size={12} className="md:w-3.5 md:h-3.5" /> Account
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>

          {/* ── General ── */}
          {activeTab === 'general' && (
              <div className="space-y-8">

                {/* History */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <History size={15} className="text-zinc-400" />
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">History</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">Wipe all chats</p>
                        <button
                            onClick={() => { if (confirm("Delete all chats? This can't be undone.")) onClearHistory(); }}
                            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors font-medium"
                        >
                            <Trash2 size={13} /> Clear
                        </button>
                    </div>
                </section>

                {/* Custom Styles */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Palette size={15} className="text-zinc-400" />
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Writing Styles</span>
                        </div>
                        {onCreateStyle && (
                            <button
                                onClick={onCreateStyle}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-medium"
                            >
                                <Plus size={13} /> New Style
                            </button>
                        )}
                    </div>

                    {customStyles.length > 0 ? (
                        <div className="divide-y divide-zinc-100/50 dark:divide-zinc-800/30">
                            {customStyles.map(style => (
                                <div key={style.id} className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">{style.name}</p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">Custom Persona</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => onEditStyle(style)}
                                            className="p-2 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded-md transition-all" title="Edit">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => onDeleteStyle(style.id)}
                                            className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-md transition-all" title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-400 dark:text-zinc-600 py-3">No custom styles yet.</p>
                    )}
                </section>
              </div>
          )}

          {/* ── AI Model ── */}
          {activeTab === 'ai-model' && (
              <div className="space-y-6">
                <p className="text-sm text-zinc-500 mb-4">Pick your writer</p>
                <div className="space-y-3">
                    {AI_PROVIDERS.map(provider => (
                        <button
                            key={provider.id}
                            onClick={() => !provider.comingSoon && onProviderChange(provider.id)}
                            disabled={provider.comingSoon}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                                provider.comingSoon
                                    ? 'opacity-50 cursor-not-allowed'
                                    : selectedProvider === provider.id
                                        ? 'bg-white/60 dark:bg-white/10 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                        : 'hover:bg-white/40 dark:hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{provider.name}</p>
                                        <span className="text-[10px] bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                                            {provider.model}
                                        </span>
                                        {provider.comingSoon && (
                                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-full tracking-wide">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">{provider.description}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                    !provider.comingSoon && selectedProvider === provider.id
                                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100'
                                        : 'border-zinc-300 dark:border-zinc-600'
                                }`}>
                                    {!provider.comingSoon && selectedProvider === provider.id && (
                                        <div className="w-2 h-2 rounded-full bg-white dark:bg-black" />
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-600 leading-relaxed">
                    Web research always uses Gemini, regardless of your selection here.
                </p>
              </div>
          )}

          {/* ── Account ── */}
          {activeTab === 'account' && (
              <div className="space-y-8">

                {/* Account info — flat */}
                <section className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="h-11 w-11 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-white dark:text-black">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user?.name || 'No name set'}</p>
                            {userUsage && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${planColor}`}>
                                    {planLabel}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{user?.email}</p>
                        {user?.emailVerification && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                Verified
                            </span>
                        )}
                    </div>
                </section>

                {/* Upgrade — only for free users */}
                {isFree && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={15} className="text-zinc-400" />
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Upgrade</span>
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                            {/* Starter */}
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">Starter    $9/mo</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">350 generations · All formats</p>
                                </div>
                                <button
                                    onClick={() => handleUpgrade('starter')}
                                    disabled={loadingUpgrade !== null}
                                    className="flex items-center gap-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-60 text-white dark:text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    {loadingUpgrade === 'starter' ? <Loader2 size={12} className="animate-spin" /> : null}
                                    Upgrade
                                </button>
                            </div>
                            {/* Pro */}
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">Pro    $29/mo</p>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">1,500 generations · All formats</p>
                                </div>
                                <button
                                    onClick={() => handleUpgrade('pro')}
                                    disabled={loadingUpgrade !== null}
                                    className="flex items-center gap-1.5 bg-[#FF7400] hover:bg-[#e06800] disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    {loadingUpgrade === 'pro' ? <Loader2 size={12} className="animate-spin" /> : null}
                                    Upgrade
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Manage subscription — paid users */}
                {!isFree && userUsage && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={15} className="text-zinc-400" />
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Subscription</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{planLabel} Plan</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">{userUsage.monthCount} / {userUsage.monthlyLimit} generations used this month</p>
                                </div>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                                <div
                                    className="bg-zinc-900 dark:bg-zinc-100 h-1.5 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (userUsage.monthCount / userUsage.monthlyLimit) * 100)}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-zinc-400">{userUsage.remaining} generations remaining</p>
                        </div>
                    </section>
                )}

                {/* Sign out — flat */}
                <section className="flex items-center justify-between pt-2 border-t border-zinc-100/50 dark:border-zinc-800/30">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50 font-medium"
                    >
                        {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                        Sign out
                    </button>
                </section>
              </div>
          )}

          {/* ── Research ── */}
          {activeTab === 'research' && (
              <div className="space-y-6">
                 {!isAddingProfile ? (
                     <>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-zinc-400"></p>
                            <button onClick={() => setIsAddingProfile(true)}
                                className="flex items-center gap-2 text-xs bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                                <Plus size={14} /> New Profile
                            </button>
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                            {researchProfiles.length === 0 && (
                                <div className="text-center py-10">
                                    <Globe size={22} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                                    <p className="text-sm text-zinc-400">No profiles yet.</p>
                                </div>
                            )}
                            {researchProfiles.map(profile => (
                                <div key={profile.id} className="py-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-sm font-medium text-zinc-900 dark:text-white">{profile.name}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditProfile(profile)} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors"><Pencil size={13} /></button>
                                            <button onClick={() => onDeleteResearchProfile(profile.id)} className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        {profile.audience && (
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded shrink-0">Audience</span>
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{profile.audience}</p>
                                            </div>
                                        )}
                                        {profile.domains && profile.domains.length > 0 && (
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded shrink-0">Sources</span>
                                                <p className="text-xs text-zinc-500">{profile.domains.length} domains</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                     </>
                 ) : (
                     <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{editingId ? 'Edit Profile' : 'New Research Profile'}</h3>
                             <button onClick={resetForm}><X size={16} className="text-zinc-500 hover:text-black dark:hover:text-white" /></button>
                         </div>
                         <div>
                             <label className="block text-xs text-zinc-500 mb-1.5">Profile Name</label>
                             <input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" />
                         </div>
                         <div>
                             <label className="block text-xs text-zinc-500 mb-1.5">Topics to Monitor</label>
                             <textarea value={newProfileTopics} onChange={(e) => setNewProfileTopics(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 h-20 resize-none transition-colors" />
                         </div>
                         <div>
                             <label className="block text-xs text-zinc-500 mb-1.5">Target Audience <span className="text-zinc-400">(Optional)</span></label>
                             <input value={newProfileAudience} onChange={(e) => setNewProfileAudience(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" />
                         </div>
                         <div>
                             <label className="block text-xs text-zinc-500 mb-1.5">Specific Sources <span className="text-zinc-400">(Optional)</span></label>
                             <textarea value={newProfileDomains} onChange={(e) => setNewProfileDomains(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 h-20 resize-none transition-colors" />
                             <p className="text-[10px] text-zinc-400 mt-1">One domain or URL per line.</p>
                         </div>
                         <div className="flex gap-2 pt-2">
                             <button onClick={resetForm} className="flex-1 py-2 text-xs font-medium text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
                             <button onClick={handleSaveProfile} className="flex-1 py-2 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors">Save</button>
                         </div>
                     </div>
                 )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
