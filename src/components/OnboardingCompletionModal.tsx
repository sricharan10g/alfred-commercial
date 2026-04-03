'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { OnboardingProfile } from '../types';

interface Props {
    profile: Partial<OnboardingProfile>;
    userName?: string;
    onStartWriting: (prefill: string) => void;
}

const TONE_LABEL: Record<string, string> = {
    bold: 'Bold & Direct',
    conversational: 'Conversational',
    witty: 'Witty',
    inspirational: 'Inspirational',
    analytical: 'Analytical',
};

const OnboardingCompletionModal: React.FC<Props> = ({ profile, userName, onStartWriting }) => {
    const [visible, setVisible] = useState(false);

    // Fade in on mount
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    const firstName = userName?.split(' ')[0];
    const firstPillar = profile.pillars?.find(p => p.trim()) ?? '';
    const prefill = firstPillar
        ? `Write about ${firstPillar}${profile.audience ? ` for ${profile.audience}` : ''}`
        : '';

    const profileRows = [
        profile.formats?.length
            ? { label: 'Formats', value: profile.formats.join(', ') }
            : null,
        profile.audience
            ? { label: 'Audience', value: profile.audience }
            : null,
        profile.tone
            ? { label: 'Voice', value: TONE_LABEL[profile.tone] ?? profile.tone }
            : null,
        profile.pillars?.some(p => p.trim())
            ? { label: 'Topics', value: profile.pillars.filter(p => p.trim()).join(' · ') }
            : null,
    ].filter(Boolean) as { label: string; value: string }[];

    return (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`w-full max-w-sm mx-4 transition-all duration-500 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>

                {/* Glow orb */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.3)]">
                            <Sparkles size={28} className="text-black" />
                        </div>
                    </div>
                </div>

                {/* Headline */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {firstName ? `${firstName}, Alfred is ready.` : 'Alfred is ready.'}
                    </h1>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Your voice, your audience, your topics — all set.
                        <br />
                        Let&apos;s write something.
                    </p>
                </div>

                {/* Profile card */}
                {profileRows.length > 0 && (
                    <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl p-4 mb-5 space-y-2.5">
                        {profileRows.map(row => (
                            <div key={row.label} className="flex items-start gap-3">
                                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-16 shrink-0 pt-px">
                                    {row.label}
                                </span>
                                <span className="text-sm text-zinc-300 leading-snug">{row.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={() => onStartWriting(prefill)}
                    className="w-full bg-white text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors shadow-lg text-sm"
                >
                    Write your first post <ArrowRight size={16} />
                </button>

                {/* Skip */}
                <button
                    onClick={() => onStartWriting('')}
                    className="w-full mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-2"
                >
                    Go to dashboard
                </button>
            </div>
        </div>
    );
};

export default OnboardingCompletionModal;
