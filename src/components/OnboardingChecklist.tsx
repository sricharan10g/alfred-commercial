'use client';

import React, { useState } from 'react';
import { Check, ChevronRight, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { OnboardingState } from '../types';

type StepKey = keyof OnboardingState['steps'];

interface StepItem {
    key: StepKey;
    label: string;
}

const STEP_ITEMS: StepItem[] = [
    { key: 'formats', label: 'What do you create?' },
    { key: 'audience', label: 'Who reads your work?' },
    { key: 'tone',    label: "What's your voice?" },
    { key: 'samples', label: 'Show Alfred how you write' },
    { key: 'pillars', label: 'Your content pillars' },
    { key: 'referral', label: 'How did you find us?' },
];

interface Props {
    onboardingState: OnboardingState;
    onOpenStep: (step: StepKey) => void;
    isCollapsed: boolean;
}

const OnboardingChecklist: React.FC<Props> = ({ onboardingState, onOpenStep, isCollapsed }) => {
    const completedCount = Object.values(onboardingState.steps).filter(Boolean).length;
    const total = STEP_ITEMS.length;
    const allDone = onboardingState.completedAt != null;

    const [isMinimized, setIsMinimized] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('alfred_onboarding_minimized') === 'true';
        }
        return false;
    });

    const toggleMinimized = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = !isMinimized;
        setIsMinimized(next);
        localStorage.setItem('alfred_onboarding_minimized', String(next));
    };

    // Hide entirely once completed
    if (allDone) return null;

    // ── Collapsed sidebar view — small progress ring ──────────────────────────
    if (isCollapsed) {
        return (
            <div className="mx-2 mb-3 px-2 py-3 flex justify-center rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30">
                <button
                    onClick={() => {
                        const nextStep = STEP_ITEMS.find(s => !onboardingState.steps[s.key]);
                        if (nextStep) onOpenStep(nextStep.key);
                    }}
                    title={`Set up Alfred — ${completedCount}/${total} done`}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="relative w-8 h-8">
                        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5"
                                className="text-zinc-200 dark:text-zinc-800" />
                            <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5"
                                strokeDasharray={`${(completedCount / total) * 75.4} 75.4`}
                                className="text-zinc-800 dark:text-zinc-200 transition-all duration-500" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                            {completedCount}/{total}
                        </span>
                    </div>
                    <Sparkles size={10} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                </button>
            </div>
        );
    }

    // ── Expanded sidebar view ─────────────────────────────────────────────────
    return (
        <div className="mx-3 mb-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden">
            {/* Header — always visible, click chevron to minimize */}
            <div className="flex items-center justify-between px-3 py-2.5 gap-2 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <Sparkles size={12} className="text-zinc-500 shrink-0" />
                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">
                        Set up Alfred
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-600 tabular-nums">
                        {completedCount}/{total}
                    </span>
                    <button
                        onClick={toggleMinimized}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-0.5 rounded"
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                    </button>
                </div>
            </div>

            {/* Collapsible body — grid-rows animation */}
            <div className={`grid transition-all duration-300 ease-in-out ${isMinimized ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                <div className="overflow-hidden">
                    {/* Divider */}
                    <div className="border-t border-zinc-200/60 dark:border-zinc-800/40" />

                    {/* Step list */}
                    <div className="py-1">
                        {STEP_ITEMS.map(item => {
                            const done = onboardingState.steps[item.key];
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => !done && onOpenStep(item.key)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors group ${
                                        done
                                            ? 'cursor-default'
                                            : 'hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 cursor-pointer'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                                        done
                                            ? 'bg-zinc-800 dark:bg-zinc-200 border-zinc-800 dark:border-zinc-200'
                                            : 'border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-500 dark:group-hover:border-zinc-400'
                                    }`}>
                                        {done && <Check size={9} className="text-white dark:text-black" strokeWidth={3} />}
                                    </div>
                                    <span className={`text-xs flex-1 truncate ${
                                        done
                                            ? 'text-zinc-400 dark:text-zinc-600 line-through'
                                            : 'text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
                                    }`}>
                                        {item.label}
                                    </span>
                                    {!done && (
                                        <ChevronRight size={12} className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 shrink-0 transition-colors" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Progress bar */}
                    <div className="px-3 pb-3 pt-1">
                        <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-zinc-700 dark:bg-zinc-300 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(completedCount / total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingChecklist;
