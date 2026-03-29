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
}

const AI_PROVIDERS: { id: AIProvider; name: string; description: string; model: string }[] = [
    { id: 'gemini', name: 'Google Gemini', description: 'Fast and efficient. Required for live web research.', model: 'gemini-2.5-flash' },
    { id: 'claude', name: 'Claude Sonnet', description: 'Best at creative writing, persona matching, and precise editing.', model: 'claude-sonnet-4-6' },
    { id: 'openai', name: 'GPT', description: 'Strong analytical scoring and concise text generation.', model: 'gpt-4.1' },
];

const SettingsModal: React.FC<Props> = ({
    isOpen, onClose, initialTab = 'general',
    userUsage,
    customStyles, onDeleteStyle, onEditStyle,
    onClearHistory,
    researchProfiles, onAddResearchProfile, onUpdateResearchProfile, onDeleteResearchProfile,
    selectedProvider, onProviderChange
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'research' | 'ai-model' | 'account'>(initialTab);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loadingUpgrade, setLoadingUpgrade] = useState<'starter' | 'pro' | null>(null);
  
  // Update active tab if initialTab changes when opening
  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Research Form State
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

  const handleCancelForm = () => {
      resetForm();
  };

  const handleLogout = async () => {
      setIsLoggingOut(true);
      try {
          showToast('Signed out successfully.', 'info');
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
          showToast('Something went wrong. Please try again.', 'error');
          setLoadingUpgrade(null);
      }
  };

  // Plan display helpers
  const planLabel = userUsage?.plan === 'pro' ? 'Pro' : userUsage?.plan === 'starter' ? 'Starter' : 'Free';
  const planColor =
      userUsage?.plan === 'pro'   ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
      userUsage?.plan === 'starter' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
  const usagePct = userUsage ? Math.min(100, Math.round((userUsage.monthCount / userUsage.monthlyLimit) * 100)) : 0;
  const isFree = !userUsage || userUsage.plan === 'free';

  // User initials for avatar
  const initials = user?.name
      ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
      : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] transition-colors duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white transition-colors duration-200">Preferences</h2>
            <p className="text-zinc-500 text-xs mt-1"></p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-900 px-6 shrink-0 transition-colors duration-200">
            <button 
                onClick={() => setActiveTab('general')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'general' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
                General
            </button>
            <button
                onClick={() => setActiveTab('research')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-2 ${activeTab === 'research' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
                <Globe size={14} /> Auto Research
            </button>
            <button
                onClick={() => setActiveTab('ai-model')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-2 ${activeTab === 'ai-model' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
                <Cpu size={14} /> AI Model
            </button>
            <button
                onClick={() => setActiveTab('account')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-2 ${activeTab === 'account' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
                <User size={14} /> Account
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {activeTab === 'general' && (
              <div className="space-y-10">
                {/* History Management */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white text-sm font-semibold transition-colors duration-200">
                    <History size={16} className="text-zinc-400" />
                    Conversation History
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between transition-colors duration-200">
                    <div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">Delete all chats permanently</p>
                        <p className="text-[11px] text-zinc-500 mt-1"></p>
                    </div>
                    <button 
                        onClick={() => {
                        if(confirm("Are you sure you want to clear all history? This cannot be undone.")) {
                            onClearHistory();
                        }
                        }}
                        className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                        <Trash2 size={14} />
                        Clear All
                    </button>
                    </div>
                </section>

                {/* Custom Styles Management */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white text-sm font-semibold transition-colors duration-200">
                    <Palette size={16} className="text-zinc-400" />
                    Custom Writing Styles
                    </div>
                    
                    {customStyles.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                        {customStyles.map(style => {
                            return (
                                <div key={style.id} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between group transition-colors duration-200">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">{style.name}</p>
                                            <p className="text-[10px] text-zinc-500 mt-0.5">Custom Persona</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => onEditStyle(style)}
                                            className="p-2 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-all"
                                            title="Edit prompts"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onDeleteStyle(style.id)}
                                            className="p-2 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all"
                                            title="Delete style"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    ) : (
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 p-8 rounded-xl text-center transition-colors duration-200">
                        <p className="text-xs text-zinc-500">No custom styles added yet.</p>
                    </div>
                    )}
                    
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-600 leading-relaxed italic">
                    * Note: Default styles (Alfred, Abdullah) cannot be removed.
                    </p>
                </section>
              </div>
          )}

          {activeTab === 'ai-model' && (
              <div className="space-y-6">
                <div>
                    <p className="text-sm text-zinc-500 mb-4">Choose which AI model powers your content generation. Research always uses Gemini (it's the only one that can search the web).</p>
                </div>

                <div className="space-y-3">
                    {AI_PROVIDERS.map(provider => (
                        <button
                            key={provider.id}
                            onClick={() => onProviderChange(provider.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                selectedProvider === provider.id
                                    ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-900'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-950'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{provider.name}</p>
                                        <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                                            {provider.model}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">{provider.description}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    selectedProvider === provider.id
                                        ? 'border-black dark:border-white bg-black dark:bg-white'
                                        : 'border-zinc-300 dark:border-zinc-700'
                                }`}>
                                    {selectedProvider === provider.id && (
                                        <div className="w-2 h-2 rounded-full bg-white dark:bg-black" />
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl transition-colors duration-200">
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Web research always uses Google Gemini regardless of your selection. Make sure the API key for your chosen provider is configured in the environment variables.
                    </p>
                </div>
              </div>
          )}

          {activeTab === 'account' && (
              <div className="space-y-8">
                {/* Account Info */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white text-sm font-semibold transition-colors duration-200">
                        <User size={16} className="text-zinc-400" />
                        Account Info
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center gap-4 transition-colors duration-200">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-white dark:text-black">{initials}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user?.name || 'No name set'}</p>
                                {/* Plan badge */}
                                {userUsage && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${planColor}`}>
                                        {planLabel}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user?.email}</p>
                            {user?.emailVerification && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                {/* Usage */}
                {userUsage && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white text-sm font-semibold transition-colors duration-200">
                            <Cpu size={16} className="text-zinc-400" />
                            Usage this month
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl space-y-3 transition-colors duration-200">
                            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                <span>{userUsage.monthCount} generations used</span>
                                <span>{userUsage.monthlyLimit} total</span>
                            </div>
                            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${usagePct}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
                                {userUsage.remaining} generation{userUsage.remaining !== 1 ? 's' : ''} remaining · Resets on the 1st
                            </p>
                        </div>
                    </section>
                )}

                {/* Upgrade CTA — only shown for free users */}
                {isFree && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white text-sm font-semibold transition-colors duration-200">
                            <Zap size={16} className="text-zinc-400" />
                            Upgrade Plan
                        </div>
                        <div className="space-y-2">
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between transition-colors duration-200">
                                <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">Starter</p>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">350 generations · All formats · $9/mo</p>
                                </div>
                                <button
                                    onClick={() => handleUpgrade('starter')}
                                    disabled={loadingUpgrade !== null}
                                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    {loadingUpgrade === 'starter' ? <Loader2 size={12} className="animate-spin" /> : null}
                                    Upgrade
                                </button>
                            </div>
                            <div className="bg-purple-50/60 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 p-4 rounded-xl flex items-center justify-between transition-colors duration-200">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">Pro</p>
                                        <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">Popular</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">1,500 generations · All formats · $29/mo</p>
                                </div>
                                <button
                                    onClick={() => handleUpgrade('pro')}
                                    disabled={loadingUpgrade !== null}
                                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    {loadingUpgrade === 'pro' ? <Loader2 size={12} className="animate-spin" /> : null}
                                    Upgrade
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Sign Out */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white text-sm font-semibold transition-colors duration-200">
                        <LogOut size={16} className="text-zinc-400" />
                        Session
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between transition-colors duration-200">
                        <div>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">Sign out of Alfred</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">You'll need to sign back in to access your account.</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                            Sign Out
                        </button>
                    </div>
                </section>
              </div>
          )}

          {activeTab === 'research' && (
              <div className="space-y-6">
                 {!isAddingProfile ? (
                     <>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-zinc-400"></p>
                            <button 
                                onClick={() => setIsAddingProfile(true)}
                                className="flex items-center gap-2 text-xs bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                            >
                                <Plus size={14} /> New Profile
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {researchProfiles.length === 0 && (
                                <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors duration-200">
                                    <Globe size={24} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
                                    <p className="text-sm text-zinc-500">No profiles yet.</p>
                                    <p className="text-xs text-zinc-600 mt-1"></p>
                                </div>
                            )}
                            {researchProfiles.map(profile => (
                                <div key={profile.id} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl group relative transition-colors duration-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-zinc-900 dark:text-white font-medium text-sm">{profile.name}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditProfile(profile)} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => onDeleteResearchProfile(profile.id)} className="text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded transition-colors duration-200">Topics</span>
                                            <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{profile.topics}</p>
                                        </div>
                                        {profile.audience && (
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded transition-colors duration-200">Audience</span>
                                                <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{profile.audience}</p>
                                            </div>
                                        )}
                                        {profile.domains && profile.domains.length > 0 && (
                                            <div className="flex gap-2 items-start">
                                                <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded whitespace-nowrap transition-colors duration-200">Sources</span>
                                                <p className="text-xs text-zinc-500 line-clamp-1">{profile.domains.length} specific domains</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                     </>
                 ) : (
                     <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl space-y-4 animate-in fade-in zoom-in-95 duration-200 transition-colors duration-200">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{editingId ? 'Edit Profile' : 'New Research Profile'}</h3>
                             <button onClick={handleCancelForm}><X size={16} className="text-zinc-500 hover:text-black dark:hover:text-white" /></button>
                         </div>
                         
                         <div>
                             <label className="block text-xs text-zinc-500 mb-1.5">Profile Name</label>
                             <input 
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder=""
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 transition-colors duration-200"
                             />
                         </div>

                         <div>
                             <label className="block text-xs text-zinc-500 mb-1.5">Topics to Monitor</label>
                             <textarea 
                                value={newProfileTopics}
                                onChange={(e) => setNewProfileTopics(e.target.value)}
                                placeholder=""
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 h-20 resize-none transition-colors duration-200"
                             />
                         </div>

                         <div>
                             <label className="block text-xs text-zinc-500 mb-1.5">Target Audience (Optional)</label>
                             <input 
                                value={newProfileAudience}
                                onChange={(e) => setNewProfileAudience(e.target.value)}
                                placeholder=""
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 transition-colors duration-200"
                             />
                         </div>
                         
                         <div>
                             <label className="block text-xs text-zinc-500 mb-1.5">Specific Sources (Optional)</label>
                             <textarea 
                                value={newProfileDomains}
                                onChange={(e) => setNewProfileDomains(e.target.value)}
                                placeholder=""
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 h-20 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-700 transition-colors duration-200"
                             />
                             <p className="text-[10px] text-zinc-500 mt-1">Enter domains or URLs separated by new lines.</p>
                         </div>

                         <div className="flex gap-2 pt-2">
                             <button onClick={handleCancelForm} className="flex-1 py-2 text-xs font-medium text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
                             <button onClick={handleSaveProfile} className="flex-1 py-2 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors">Save Profile</button>
                         </div>
                     </div>
                 )}
              </div>
          )}

        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end shrink-0 transition-colors duration-200">
          <button 
            onClick={onClose}
            className="bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;