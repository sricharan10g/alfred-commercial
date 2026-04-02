"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AgentType, Idea, Draft, Session, WritingStyle, CustomStyle, Guardrails, ResearchProfile, ResearchTimeRange, FormatDefinition, WritingFormat, AIProvider } from '@/types';
import * as geminiService from '@/services/aiClient';
import SettingsModal from '@/components/SettingsModal';
import StyleUploadModal from '@/components/StyleUploadModal';
import GuardrailsModal from '@/components/GuardrailsModal';
import StyleLibraryModal from '@/components/StyleLibraryModal';
import Sidebar from '@/components/Sidebar';
import BriefView from '@/components/views/BriefView';
import IdeationView from '@/components/views/IdeationView';
import DraftingView from '@/components/views/DraftingView';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import ProgressBar from '@/components/ui/ProgressBar';
import { FORMAT_LIBRARY, PAID_ONLY_FORMATS } from '@/constants';
import { Moon, Sun, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { account } from '@/services/appwrite';
import AuthView from '@/components/views/AuthView';
import EmailVerificationView from '@/components/views/EmailVerificationView';
import PasswordResetView from '@/components/views/PasswordResetView';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useThrottledCallback } from '@/hooks/useDebounce';
import { ApiError, fetchUsage } from '@/services/aiClient';
import PaywallModal from '@/components/PaywallModal';
import VantaClouds from '@/components/ui/VantaClouds';

// Helper to create a new empty session
const createNewSession = (): Session => ({
    id: crypto.randomUUID(),
    name: 'New Brief',
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    step: 'BRIEF',
    brief: '',
    writingStyle: WritingStyle.DEFAULT, // Alfred
    writingFormat: 'Tweet', // Default format
    researchTimeRange: '7d', // Default to 1 week
    ideas: [],
    drafts: [],
    isProcessing: false,
    isRefining: false,
});

function Dashboard() {
    const { showToast } = useToast();
    const { user, logout } = useAuth();

    // --- State (persisted to localStorage) ---
    const [sessions, setSessions] = useLocalStorage<Session[]>(
        'alfred_sessions',
        [createNewSession()],
        (saved) => saved.map(s => ({
            ...s,
            isProcessing: false,
            isResearching: false,
            isRefining: false,
        }))
    );
    const [activeSessionId, setActiveSessionId] = useLocalStorage<string>(
        'alfred_activeSessionId',
        sessions[0]?.id ?? ''
    );
    const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('alfred_theme', 'dark');

    // AI Provider Selection
    const [selectedProvider, setSelectedProvider] = useLocalStorage<AIProvider>('alfred_provider', 'gemini');

    // Settings & Modals State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'research' | 'ai-model' | 'account'>('general');

    // Custom Styles & Library
    const [customStyles, setCustomStyles] = useLocalStorage<CustomStyle[]>('alfred_customStyles', []);
    const [isStyleUploadOpen, setIsStyleUploadOpen] = useState(false);
    const [isStyleLibraryOpen, setIsStyleLibraryOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<CustomStyle | null>(null);

    // Global Guardrails
    const [guardrails, setGuardrails] = useLocalStorage<Guardrails>('alfred_guardrails', { dos: '', donts: '' });
    const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(false);

    // Research Profiles (persisted to localStorage)
    const [researchProfiles, setResearchProfiles] = useLocalStorage<ResearchProfile[]>('alfred_researchProfiles', []);

    // Usage tracking + Paywall
    const [userUsage, setUserUsage] = useState<{ plan: string; monthCount: number; monthlyLimit: number; remaining: number } | null>(null);
    const [paywallInfo, setPaywallInfo] = useState<{ reason: 'monthly_limit' | 'feature_gated'; format?: string } | null>(null);

    // Calculate Global Loading State for Progress Bar
    const isGlobalLoading = useMemo(() => {
        return sessions.some(s =>
            s.isProcessing ||
            s.isResearching
        );
    }, [sessions]);

    // Theme Effect
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Fetch user's plan and usage on mount
    useEffect(() => {
        fetchUsage().then(data => { if (data) setUserUsage(data); });
    }, []);

    // Login toast — show once after sign-in / sign-up
    useEffect(() => {
        if (sessionStorage.getItem('alfred_just_logged_in')) {
            sessionStorage.removeItem('alfred_just_logged_in');
            const firstName = user?.name?.split(' ')[0] || null;
            showToast(firstName ? `Welcome back, ${firstName}! 👋` : 'Welcome back! 👋', 'success');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cloud sync — hydrate state from Appwrite on login, save back on changes
    const isHydratedRef = useRef(false);

    useEffect(() => {
        if (!user) return;
        async function hydrate() {
            try {
                const { jwt } = await account.createJWT();
                const res = await fetch('/api/user-data', {
                    headers: { 'x-appwrite-user-jwt': jwt },
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data?.sessions?.length > 0) {
                    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
                    const now = Date.now();
                    const allSessions = (data.sessions as Session[]).map(s => ({
                        ...s,
                        isProcessing: false,
                        isResearching: false,
                        isRefining: false,
                    }));
                    const liveSessions = allSessions.filter(s => {
                        if (s.pinned) return true;
                        const age = now - (s.lastAccessedAt ?? s.createdAt);
                        return age < THIRTY_DAYS_MS;
                    });
                    const removedCount = allSessions.length - liveSessions.length;
                    const finalSessions = liveSessions.length > 0 ? liveSessions : [createNewSession()];
                    setSessions(finalSessions);
                    setCustomStyles(data.customStyles ?? []);
                    setResearchProfiles(data.researchProfiles ?? []);
                    setGuardrails(data.guardrails ?? { dos: '', donts: '' });
                    const savedActiveId = data.activeSessionId ?? '';
                    const activeStillExists = finalSessions.some(s => s.id === savedActiveId);
                    setActiveSessionId(activeStillExists ? savedActiveId : finalSessions[0]?.id ?? '');
                    if (removedCount > 0) {
                        setTimeout(() => {
                            showToast(
                                `${removedCount} old session${removedCount > 1 ? 's' : ''} removed — pin important chats to keep them forever`,
                                'info'
                            );
                        }, 1500);
                    }
                } else {
                    // New user or empty account — ensure we don't show stale data
                    // from a previously logged-in account.
                    const fresh = createNewSession();
                    setSessions([fresh]);
                    setActiveSessionId(fresh.id);
                    setCustomStyles([]);
                    setResearchProfiles([]);
                    setGuardrails({ dos: '', donts: '' });
                }
            } catch (e) {
                console.warn('[sync] Hydration failed:', e);
            } finally {
                isHydratedRef.current = true;
            }
        }
        hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.$id]);

    useEffect(() => {
        if (!user || !isHydratedRef.current) return;
        const timer = setTimeout(async () => {
            try {
                const { jwt } = await account.createJWT();
                await fetch('/api/user-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-appwrite-user-jwt': jwt },
                    body: JSON.stringify({ sessions, customStyles, researchProfiles, guardrails, activeSessionId }),
                });
            } catch (e) {
                console.warn('[sync] Save failed:', e);
            }
        }, 3000);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessions, customStyles, researchProfiles, guardrails, activeSessionId]);

    // Post-payment: detect ?payment=success in URL, clean it, then poll until plan activates
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment') !== 'success') return;

        // Clean URL immediately so refresh doesn't re-trigger
        window.history.replaceState({}, '', window.location.pathname);

        showToast('Payment received! Activating your plan…', 'success');

        let attempts = 0;
        const MAX_ATTEMPTS = 12; // poll for up to ~36 seconds

        const poll = async () => {
            attempts++;
            const data = await fetchUsage();
            if (data) {
                setUserUsage(data);
                if (data.plan !== 'free') {
                    const planName = data.plan.charAt(0).toUpperCase() + data.plan.slice(1);
                    showToast(`🎉 You're now on the ${planName} plan! Enjoy.`, 'success');
                    return; // Done — stop polling
                }
            }
            if (attempts < MAX_ATTEMPTS) {
                setTimeout(poll, 3000);
            } else {
                showToast('Plan activation can take a minute. Refresh if your plan looks incorrect.', 'info');
            }
        };

        // Start first poll after 2 s (give webhook time to fire)
        setTimeout(poll, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally run once on mount only

    // Derived active session
    const activeSession = useMemo(() =>
        sessions.find(s => s.id === activeSessionId) || sessions[0] || createNewSession(),
        [sessions, activeSessionId]);

    // --- Helpers ---

    const getCustomStyleData = (styleName: string): CustomStyle | undefined => {
        return customStyles.find(s => s.name === styleName);
    };

    const updateActiveSession = (updates: Partial<Session>) => {
        // Gate paid-only formats: block if user is free OR if usage hasn't loaded yet (assume free until confirmed paid)
        const isPaidFormat = updates.writingFormat && PAID_ONLY_FORMATS.includes(updates.writingFormat);
        const isConfirmedPaid = userUsage && userUsage.plan !== 'free';
        if (isPaidFormat && !isConfirmedPaid) {
            setPaywallInfo({ reason: 'feature_gated', format: updates.writingFormat });
            return;
        }
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? { ...s, ...updates } : s
        ));
    };

    const updateSessionById = (id: string, updates: Partial<Session>) => {
        setSessions(prev => prev.map(s =>
            s.id === id ? { ...s, ...updates } : s
        ));
    };

    const handleNewSession = () => {
        // Don't create multiple empty briefs — reuse an existing empty one
        const existingEmpty = sessions.find(s => s.brief === '' && s.step === 'BRIEF' && s.ideas.length === 0);
        if (existingEmpty) {
            setActiveSessionId(existingEmpty.id);
            setSessions(prev => prev.map(s =>
                s.id === existingEmpty.id ? { ...s, lastAccessedAt: Date.now() } : s
            ));
            return;
        }
        const newSession = createNewSession();
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
    };

    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
        setSessions(prev => {
            // Clean up any empty briefs that aren't the one being selected
            const cleaned = prev.filter(s =>
                s.id === id || s.brief !== '' || s.step !== 'BRIEF' || s.ideas.length > 0
            );
            return cleaned.map(s =>
                s.id === id ? { ...s, lastAccessedAt: Date.now() } : s
            );
        });
    };

    const handlePinSession = (id: string) => {
        setSessions(prev => prev.map(s =>
            s.id === id ? { ...s, pinned: !s.pinned } : s
        ));
    };

    const handleDeleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== id);
            if (filtered.length === 0) {
                // Always keep at least one session
                const fresh = createNewSession();
                setActiveSessionId(fresh.id);
                return [fresh];
            }

            if (id === activeSessionId) {
                // If we deleted the active one, switch to the first available
                setActiveSessionId(filtered[0].id);
            }
            return filtered;
        });
    };

    const handleClearHistory = () => {
        const fresh = createNewSession();
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
        setIsSettingsOpen(false);
        showToast("History cleared", "info");
    };

    const handleDeleteCustomStyle = (id: string) => {
        setCustomStyles(prev => {
            const filtered = prev.filter(s => s.id !== id);
            const styleToDelete = prev.find(s => s.id === id);
            if (styleToDelete && activeSession.writingStyle === styleToDelete.name) {
                updateActiveSession({
                    writingStyle: WritingStyle.DEFAULT,
                    ideas: [],
                    drafts: [],
                    step: 'BRIEF'
                });
            }
            return filtered;
        });
        showToast("Style deleted", "info");
    };

    const handleStyleSave = (style: CustomStyle) => {
        setCustomStyles(prev => {
            const index = prev.findIndex(s => s.id === style.id);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = style;
                return updated;
            }
            return [...prev, style];
        });
        updateActiveSession({
            writingStyle: style.name,
            writingFormat: style.nativeFormat || activeSession.writingFormat, // Auto-switch format
            ideas: [],
            drafts: [],
            step: 'BRIEF'
        });
        showToast(`Style "${style.name}" saved`, "success");
    };

    // Select Format from Library
    const handleSelectFormat = (format: FormatDefinition) => {
        updateActiveSession({
            writingFormat: format.name,
            ideas: [],
            drafts: [],
            step: 'BRIEF'
        });
        setIsStyleLibraryOpen(false);
        showToast(`Selected "${format.name}" format`, "success");
    };

    // --- Research Helpers ---
    const handleAddResearchProfile = (p: ResearchProfile) => {
        setResearchProfiles(prev => [...prev, p]);
        showToast("Research profile created", "success");
    };

    const handleUpdateResearchProfile = (updated: ResearchProfile) => {
        setResearchProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
        showToast("Research profile updated", "success");
    };

    const handleDeleteResearchProfile = (id: string) => {
        setResearchProfiles(prev => prev.filter(p => p.id !== id));
        if (activeSession.activeProfileId === id) {
            updateActiveSession({ activeProfileId: undefined, researchResults: undefined, researchSources: undefined });
        }
        showToast("Research profile deleted", "info");
    };

    const handleFetchResearch = async () => {
        const profile = researchProfiles.find(p => p.id === activeSession.activeProfileId);

        // Auto Research mode: use the brief as the topic when no profile is selected
        const topics = profile ? profile.topics : activeSession.brief.trim();
        const audience = profile ? profile.audience : 'General audience';
        const domains = profile?.domains ?? [];

        if (!topics) return;

        updateActiveSession({ isResearching: true, researchResults: undefined, selectedResearchIds: [] });

        try {
            const result = await geminiService.performResearch(
                topics,
                audience,
                activeSession.researchTimeRange,
                [],
                domains
            );
            updateActiveSession({
                researchResults: result.findings,
                selectedResearchIds: [],
                researchSources: result.sources,
                isResearching: false
            });
        } catch (error) {
            console.error(error);
            showToast("Failed to fetch research context", "error");
            updateActiveSession({ isResearching: false });
        }
    };

    const handleFetchMoreResearch = async () => {
        const profile = researchProfiles.find(p => p.id === activeSession.activeProfileId);
        if (!profile) return;

        updateActiveSession({ isResearching: true });

        const existingHeadlines = activeSession.researchResults?.map(r => r.headline) || [];

        try {
            const result = await geminiService.performResearch(
                profile.topics,
                profile.audience,
                activeSession.researchTimeRange,
                existingHeadlines,
                profile.domains
            );

            const currentFindings = activeSession.researchResults || [];
            const currentSources = activeSession.researchSources || [];

            const newFindings = result.findings.filter(
                f => !currentFindings.some(existing => existing.headline === f.headline)
            );

            const mergedSourcesMap = new Map();
            currentSources.forEach(s => mergedSourcesMap.set(s.url, s));
            result.sources.forEach(s => mergedSourcesMap.set(s.url, s));
            const mergedSources = Array.from(mergedSourcesMap.values());

            updateActiveSession({
                researchResults: [...currentFindings, ...newFindings],
                researchSources: mergedSources,
                isResearching: false
            });
        } catch (error) {
            console.error(error);
            showToast("Failed to fetch more research", "error");
            updateActiveSession({ isResearching: false });
        }
    };

    const toggleResearchFinding = (id: string) => {
        const currentSelected = activeSession.selectedResearchIds || [];
        if (currentSelected.includes(id)) {
            updateActiveSession({ selectedResearchIds: [] });
        } else {
            updateActiveSession({ selectedResearchIds: [id] });
        }
    };

    const handleOpenResearchSettings = () => {
        setSettingsInitialTab('research');
        setIsSettingsOpen(true);
    };

    // --- Logic Handlers ---

    const handleGenerateIdeas = async () => {
        const hasBrief = activeSession.brief.trim().length > 0;
        const hasSelection = (activeSession.selectedResearchIds?.length || 0) > 0;

        if (!hasBrief && !hasSelection) return;

        updateActiveSession({ isProcessing: true });

        const selectedFindings = activeSession.researchResults?.filter(r =>
            activeSession.selectedResearchIds?.includes(r.id)
        ) || [];

        try {
            const customStyle = getCustomStyleData(activeSession.writingStyle);

            // Parallel Generation for Newsletters (Subject Lines + Concepts)
            if (activeSession.writingFormat === 'Newsletter') {
                const [concepts, subjectLines] = await Promise.all([
                    geminiService.generateIdeas(
                        activeSession.brief,
                        activeSession.writingStyle,
                        activeSession.writingFormat,
                        activeSession.ideas,
                        customStyle?.prompts,
                        guardrails,
                        selectedFindings,
                        customStyle?.nativeFormat,
                        selectedProvider
                    ),
                    geminiService.generateSubjectLines(
                        activeSession.brief,
                        activeSession.writingStyle,
                        5,
                        customStyle?.prompts,
                        guardrails,
                        selectedFindings,
                        undefined,
                        selectedProvider
                    )
                ]);

                let newName = activeSession.name;
                if (activeSession.name === 'New Brief' && subjectLines.length > 0) {
                    newName = subjectLines[0];
                }

                updateActiveSession({
                    ideas: [...activeSession.ideas, ...concepts],
                    newsletterSubjectLines: [...(activeSession.newsletterSubjectLines || []), ...subjectLines],
                    step: activeSession.step === 'BRIEF' ? 'IDEATION' : activeSession.step,
                    name: newName,
                    isProcessing: false
                });

                return;
            }

            // Standard Flow
            const newIdeas = await geminiService.generateIdeas(
                activeSession.brief,
                activeSession.writingStyle,
                activeSession.writingFormat,
                activeSession.ideas,
                customStyle?.prompts,
                guardrails,
                selectedFindings,
                customStyle?.nativeFormat,
                selectedProvider
            );

            let newName = activeSession.name;
            if (activeSession.name === 'New Brief') {
                if (hasBrief) {
                    newName = activeSession.brief.split(' ').slice(0, 5).join(' ') + '...';
                } else if (selectedFindings.length > 0) {
                    newName = selectedFindings[0].headline;
                }
            }

            // Special Check for 'One Liner' Format - SKIP Ideation Phase
            if (activeSession.writingFormat === 'One Liner') {
                const approvedIdeas = newIdeas.map(idea => ({ ...idea, isApproved: true }));

                const newDrafts: Draft[] = approvedIdeas.map(idea => ({
                    id: crypto.randomUUID(),
                    ideaId: idea.id,
                    content: idea.hook, // The hook IS the content for one liners
                }));

                updateActiveSession({
                    ideas: [...activeSession.ideas, ...approvedIdeas],
                    drafts: [...activeSession.drafts, ...newDrafts],
                    step: 'DRAFTING', // Skip direct to drafting
                    name: newName,
                    isProcessing: false
                });

            } else {
                // Standard Workflow
                updateActiveSession({
                    ideas: [...activeSession.ideas, ...newIdeas],
                    step: activeSession.step === 'BRIEF' ? 'IDEATION' : activeSession.step,
                    name: newName,
                    isProcessing: false
                });
            }

        } catch (e: any) {
            console.error(e);
            if (e instanceof ApiError && e.status === 402 && e.reason) {
                setPaywallInfo({ reason: e.reason as 'monthly_limit' | 'feature_gated', format: activeSession.writingFormat });
                // Refresh usage count in the background
                fetchUsage().then(d => { if (d) setUserUsage(d); });
            } else {
                showToast("Failed to generate ideas", "error");
            }
            updateActiveSession({ isProcessing: false });
        }
    };

    const handleIdeaDecision = async (id: string, decision: 'APPROVE' | 'REJECT', feedback?: string) => {
        if (decision === 'REJECT') {
            updateActiveSession({ ideas: activeSession.ideas.filter(i => i.id !== id) });
        } else {
            const updatedIdeas = activeSession.ideas.map(i => i.id === id ? { ...i, isApproved: true, userFeedback: feedback } : i);
            updateActiveSession({ ideas: updatedIdeas, isRefining: true });

            // If Newsletter, we don't auto-generate more ideas on approval, we move to drafting eventually
            if (activeSession.writingFormat === 'Newsletter') {
                updateActiveSession({ isRefining: false });
                return;
            }

            const selectedFindings = activeSession.researchResults?.filter(r =>
                activeSession.selectedResearchIds?.includes(r.id)
            ) || [];

            try {
                const customStyle = getCustomStyleData(activeSession.writingStyle);
                const moreIdeas = await geminiService.generateIdeas(
                    activeSession.brief,
                    activeSession.writingStyle,
                    activeSession.writingFormat,
                    updatedIdeas,
                    customStyle?.prompts,
                    guardrails,
                    selectedFindings,
                    customStyle?.nativeFormat,
                    selectedProvider
                );
                const twoNew = moreIdeas.slice(0, 2);

                setSessions(prev => prev.map(s => {
                    if (s.id === activeSessionId) {
                        return { ...s, ideas: [...s.ideas, ...twoNew], isRefining: false };
                    }
                    return s;
                }));

            } catch (e) {
                console.error("Error fetching more ideas", e);
                showToast("Idea approved, but failed to generate more concepts", "info");
                updateActiveSession({ isRefining: false });
            }
        }
    };

    const moveToDrafts = async () => {
        const approvedIdeas = activeSession.ideas.filter(i => i.isApproved);
        if (approvedIdeas.length === 0) {
            showToast("Please approve at least one idea", "error");
            return;
        }

        if (activeSession.writingFormat === 'Newsletter' && !activeSession.selectedNewsletterSubjectLine) {
            showToast("Please select a subject line", "error");
            return;
        }

        updateActiveSession({ step: 'DRAFTING', isProcessing: true });

        const sessionId = activeSession.id;

        for (const idea of approvedIdeas) {
            await processDraftGeneration(sessionId, idea);
        }

        updateSessionById(sessionId, { isProcessing: false });
    };

    const processDraftGeneration = async (sessionId: string, idea: Idea, additionalFeedback?: string) => {
        const currentSession = sessions.find(s => s.id === sessionId);
        if (!currentSession) return;

        if (additionalFeedback) {
            updateSessionById(sessionId, { isProcessing: true });
        }

        const selectedFindings = currentSession.researchResults?.filter(r =>
            currentSession.selectedResearchIds?.includes(r.id)
        ) || [];

        try {
            const customStyle = getCustomStyleData(currentSession.writingStyle);
            const rawDrafts = await geminiService.generateDrafts(
                idea,
                currentSession.writingStyle,
                currentSession.writingFormat,
                additionalFeedback,
                customStyle?.prompts,
                guardrails,
                selectedFindings,
                customStyle?.nativeFormat,
                currentSession.selectedNewsletterSubjectLine, // Pass subject line if exists
                selectedProvider
            );

            const newDrafts: Draft[] = rawDrafts.map(content => ({
                id: crypto.randomUUID(),
                ideaId: idea.id,
                content,
            }));

            setSessions(prev => prev.map(s => {
                if (s.id === sessionId) {
                    return { ...s, drafts: [...s.drafts, ...newDrafts] };
                }
                return s;
            }));

        } catch (e: any) {
            console.error("Error generating drafts for idea", idea.id, e);
            if (e instanceof ApiError && e.status === 402 && e.reason) {
                setPaywallInfo({ reason: e.reason as 'monthly_limit' | 'feature_gated', format: currentSession.writingFormat });
                fetchUsage().then(d => { if (d) setUserUsage(d); });
            } else {
                showToast("Failed to generate drafts", "error");
            }
        } finally {
            if (additionalFeedback) {
                updateSessionById(sessionId, { isProcessing: false });
            }
        }
    };

    const handleDraftDelete = (id: string) => {
        updateActiveSession({ drafts: activeSession.drafts.filter(d => d.id !== id) });
    };

    const handleDraftDuplicate = (id: string) => {
        const draft = activeSession.drafts.find(d => d.id === id);
        if (!draft) return;
        const idea = activeSession.ideas.find(i => i.id === draft.ideaId);
        if (!idea) return;
        processDraftGeneration(activeSession.id, idea);
    };

    const handleDraftEdit = (id: string, newContent: string) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return {
                    ...s,
                    drafts: s.drafts.map(d => d.id === id ? { ...d, content: newContent } : d)
                };
            }
            return s;
        }));
    };

    const handleDraftRefine = async (id: string, feedback: string) => {
        const draft = activeSession.drafts.find(d => d.id === id);
        if (!draft) return;

        const customStyle = getCustomStyleData(activeSession.writingStyle);

        try {
            // Generate new refined content
            const newContent = await geminiService.refineDraft(
                draft.content,
                feedback,
                activeSession.writingStyle,
                activeSession.writingFormat,
                customStyle?.prompts,
                guardrails,
                customStyle?.nativeFormat,
                selectedProvider
            );

            // Create new draft object with the refined content
            const newDraft: Draft = {
                id: crypto.randomUUID(),
                ideaId: draft.ideaId,
                content: newContent,
            };

            // Append to session
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return { ...s, drafts: [...s.drafts, newDraft] };
                }
                return s;
            }));

            showToast("New variation created", "success");

        } catch (e: any) {
            console.error("Refine failed", e);
            if (e instanceof ApiError && e.status === 402 && e.reason) {
                setPaywallInfo({ reason: e.reason as 'monthly_limit' | 'feature_gated', format: activeSession.writingFormat });
                fetchUsage().then(d => { if (d) setUserUsage(d); });
            } else {
                showToast("Failed to refine draft", "error");
            }
        }
    };

    // --- Throttled Handlers (prevent double-click bugs) ---
    const throttledGenerateIdeas = useThrottledCallback(handleGenerateIdeas);
    const throttledMoveToDrafts = useThrottledCallback(moveToDrafts);
    const throttledDraftRefine = useThrottledCallback(handleDraftRefine);
    const throttledFetchResearch = useThrottledCallback(handleFetchResearch);

    // --- Render ---

    return (
        <div className="flex flex-col md:flex-row h-full bg-gray-50 dark:bg-black text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-300 ease-in-out relative">

            {/* Vanta.js Clouds Background — full opacity on Brief, subtle on other steps */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${activeSession.step === 'BRIEF' ? 'opacity-100' : 'opacity-30'}`} style={{ pointerEvents: 'none' }}>
                <VantaClouds />
            </div>

            {/* Edge fades — always full strength on mobile, independent of Vanta opacity */}
            <div className="absolute inset-0 z-[1] pointer-events-none md:hidden">
                <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-t from-transparent to-white/60 dark:to-black/60" />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-black" />
            </div>

            {/* Global Progress Bar */}
            <ProgressBar isLoading={isGlobalLoading} />

            <Sidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                activeSessionStep={activeSession.step}
                onNewSession={handleNewSession}
                onSelectSession={handleSelectSession}
                onPinSession={handlePinSession}
                onDeleteSession={handleDeleteSession}
                onOpenGuardrails={() => setIsGuardrailsOpen(true)}
                onOpenSettings={() => {
                    setSettingsInitialTab('general');
                    setIsSettingsOpen(true);
                }}
                onLogout={async () => {
                    // Clear all user-specific data before logging out so the next
                    // account doesn't see stale localStorage from the previous user.
                    const userKeys = [
                        'alfred_sessions',
                        'alfred_activeSessionId',
                        'alfred_customStyles',
                        'alfred_guardrails',
                        'alfred_researchProfiles',
                        'alfred_provider',
                    ];
                    userKeys.forEach(k => localStorage.removeItem(k));
                    showToast('Signed out.', 'info');
                    await logout();
                }}
                theme={theme}
                onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
                {/* Toggle Theme Button - Top Right Absolute - HIDDEN ON MOBILE */}
                <div className="absolute top-3 right-3 md:top-4 md:right-4 z-40 hidden md:block">
                    <button
                        onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white shadow-sm transition-all hover:scale-105"
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
                    <div className="max-w-4xl mx-auto">

                        {activeSession.step === 'BRIEF' && (
                            <div key={`brief-${activeSessionId}`} className="animate-in fade-in duration-500 ease-out">
                            <BriefView
                                activeSession={activeSession}
                                customStyles={customStyles}
                                researchProfiles={researchProfiles}
                                onUpdateSession={updateActiveSession}
                                onGenerateIdeas={throttledGenerateIdeas}
                                onOpenStyleLibrary={() => setIsStyleLibraryOpen(true)}
                                onOpenStyleModal={() => {
                                    setEditingStyle(null);
                                    setIsStyleUploadOpen(true);
                                }}
                                onFetchResearch={throttledFetchResearch}
                                onFetchMoreResearch={handleFetchMoreResearch}
                                onToggleResearchFinding={toggleResearchFinding}
                                onOpenResearchSettings={handleOpenResearchSettings}
                                selectedProvider={selectedProvider}
                            />
                            </div>
                        )}

                        {activeSession.step === 'IDEATION' && (
                            <div key={`ideation-${activeSessionId}`} className="animate-in fade-in slide-in-from-right-6 duration-500 ease-out">
                            <IdeationView
                                activeSession={activeSession}
                                onUpdateSession={updateActiveSession}
                                onIdeaDecision={handleIdeaDecision}
                                onMoveToDrafts={throttledMoveToDrafts}
                            />
                            </div>
                        )}

                        {activeSession.step === 'DRAFTING' && (
                            <div key={`drafting-${activeSessionId}`} className="animate-in fade-in slide-in-from-right-6 duration-500 ease-out">
                            <DraftingView
                                activeSession={activeSession}
                                onUpdateSession={updateActiveSession}
                                onDraftDelete={handleDraftDelete}
                                onDraftDuplicate={handleDraftDuplicate}
                                onGenerateDrafts={(idea, feedback) => processDraftGeneration(activeSession.id, idea, feedback)}
                                onNewSession={handleNewSession}
                                onBackToIdeation={() => updateActiveSession({ step: 'IDEATION' })}
                                onDraftEdit={handleDraftEdit}
                                onDraftRefine={throttledDraftRefine}
                            />
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Modals */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                initialTab={settingsInitialTab}
                userUsage={userUsage}
                customStyles={customStyles}
                onDeleteStyle={handleDeleteCustomStyle}
                onEditStyle={(style) => {
                    setEditingStyle(style);
                    setIsSettingsOpen(false);
                    setIsStyleUploadOpen(true);
                }}
                onClearHistory={handleClearHistory}
                researchProfiles={researchProfiles}
                onAddResearchProfile={handleAddResearchProfile}
                onUpdateResearchProfile={handleUpdateResearchProfile}
                onDeleteResearchProfile={handleDeleteResearchProfile}
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
                onCreateStyle={() => {
                    setEditingStyle(null);
                    setIsSettingsOpen(false);
                    setIsStyleUploadOpen(true);
                }}
            />

            <StyleUploadModal
                isOpen={isStyleUploadOpen}
                onClose={() => setIsStyleUploadOpen(false)}
                onStyleCreated={handleStyleSave}
                guardrails={guardrails}
                initialStyle={editingStyle}
            />

            <StyleLibraryModal
                isOpen={isStyleLibraryOpen}
                onClose={() => setIsStyleLibraryOpen(false)}
                presets={FORMAT_LIBRARY}
                onSelect={handleSelectFormat}
                currentFormat={activeSession.writingFormat}
            />

            <GuardrailsModal
                isOpen={isGuardrailsOpen}
                onClose={() => setIsGuardrailsOpen(false)}
                initialGuardrails={guardrails}
                onSave={(g) => {
                    setGuardrails(g);
                    showToast("Global guardrails updated", "success");
                }}
            />

            <PaywallModal
                isOpen={paywallInfo !== null}
                onClose={() => setPaywallInfo(null)}
                reason={paywallInfo?.reason ?? 'monthly_limit'}
                format={paywallInfo?.format}
                userUsage={userUsage}
                userId={user?.$id ?? ''}
                userEmail={user?.email ?? ''}
                userName={user?.name}
            />
        </div>
    );
}

function AppGate() {
    const { user, loading, verifyEmail } = useAuth();
    const [verifying, setVerifying] = useState(false);
    const [recoveryParams, setRecoveryParams] = useState<{ userId: string; secret: string } | null>(null);

    // Handle callback links from email:
    //   • Password recovery:     ?type=recovery&userId=xxx&secret=yyy
    //   • Email verification:    ?userId=xxx&secret=yyy  (no type param)
    //   • Google OAuth:          ?type=oauth&userId=xxx&secret=yyy  ← handled by AuthContext, skip here
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const secret = params.get('secret');
        const type   = params.get('type');

        if (!userId || !secret) return;

        // OAuth callback — AuthContext handles this; bail so we don't clean the URL first.
        // (Child effects run before parent effects in React, so we must leave the URL intact.)
        if (type === 'oauth') return;

        // Clean the URL immediately so refresh doesn't re-trigger
        window.history.replaceState({}, '', window.location.pathname);

        if (type === 'recovery') {
            // Password recovery — store params and show reset form
            setRecoveryParams({ userId, secret });
        } else {
            // Email verification
            setVerifying(true);
            verifyEmail(userId, secret)
                .catch(err => console.error('[AppGate] Email verification failed:', err))
                .finally(() => setVerifying(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount only

    // Password reset takes priority — show regardless of auth state
    if (recoveryParams) {
        return (
            <PasswordResetView
                userId={recoveryParams.userId}
                secret={recoveryParams.secret}
                onDone={() => setRecoveryParams(null)}
            />
        );
    }

    if (loading || verifying) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="animate-spin text-zinc-400" size={24} />
            </div>
        );
    }

    if (!user) {
        return <AuthView />;
    }

    // Logged in but email not yet verified → show verification screen
    if (!user.emailVerification) {
        return <EmailVerificationView />;
    }

    return <Dashboard />;
}

export default function Page() {
    return (
        <ToastProvider>
            <AppGate />
        </ToastProvider>
    );
}
