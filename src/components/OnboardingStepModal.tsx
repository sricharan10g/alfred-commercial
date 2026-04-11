'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, AlertCircle, Check, FileText, Type, ExternalLink } from 'lucide-react';
import { OnboardingState, OnboardingProfile, CustomStyle, Guardrails, CsvRow } from '../types';
import { parseCsvTrainingData } from '../services/csvService';
import { createStyleFromData, createStyleFromDescription } from '../services/aiClient';
import { useLocalStorage } from '../hooks/useLocalStorage';

// ── Step metadata ────────────────────────────────────────────────────────────

type StepKey = keyof OnboardingState['steps'];

const STEPS: { key: StepKey; title: string; subtitle: string }[] = [
    {
        key: 'formats',
        title: 'What do you create?',
        subtitle: 'Pick everything that applies. Alfred defaults to these.',
    },
    {
        key: 'audience',
        title: 'Who reads your work?',
        subtitle: 'Alfred writes to your readers, not the world.',
    },
    {
        key: 'tone',
        title: "What's your voice?",
        subtitle: 'Pick the style that feels most like you.',
    },
    {
        key: 'samples',
        title: 'Show Alfred how you write.',
        subtitle: 'Paste a few posts, or upload a CSV. Alfred learns your patterns.',
    },
    {
        key: 'pillars',
        title: 'What do you want to be known for?',
        subtitle: 'Up to 3 topics. Alfred keeps your content focused.',
    },
];

const FORMAT_OPTIONS = ['Tweet', 'Long Tweet', 'Thread', 'LinkedIn Post', 'Newsletter'];

const TONE_OPTIONS = [
    { id: 'bold', label: 'Bold & Direct', desc: 'Short sentences. Strong opinions. No fluff.' },
    { id: 'conversational', label: 'Conversational', desc: 'Like texting a smart friend. Easy to read.' },
    { id: 'witty', label: 'Witty', desc: 'Humour, irony, and a sharp edge.' },
    { id: 'inspirational', label: 'Inspirational', desc: 'Stories that move people to act.' },
    { id: 'analytical', label: 'Analytical', desc: 'Data-led. Deep dives. Thought leadership.' },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
    step: StepKey | null;
    currentProfile: Partial<OnboardingProfile>;
    onClose: () => void;
    onComplete: (step: StepKey, data: Partial<OnboardingProfile>) => void;
    onStyleCreated: (style: CustomStyle) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const OnboardingStepModal: React.FC<Props> = ({
    step,
    currentProfile,
    onClose,
    onComplete,
    onStyleCreated,
}) => {
    const [guardrails] = useLocalStorage<Guardrails>('alfred_guardrails', { dos: '', donts: '' });

    // Step 1 — formats
    const [selectedFormats, setSelectedFormats] = useState<string[]>(currentProfile.formats ?? []);

    // Step 2 — audience
    const [audience, setAudience] = useState(currentProfile.audience ?? '');

    // Step 3 — tone
    const [selectedTone, setSelectedTone] = useState(currentProfile.tone ?? '');

    // Step 4 — samples
    const [samplesTab, setSamplesTab] = useState<'paste' | 'upload'>('paste');
    const [pastedText, setPastedText] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [samplesStatus, setSamplesStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [samplesError, setSamplesError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step 5 — pillars
    const [pillars, setPillars] = useState<[string, string, string]>([
        currentProfile.pillars?.[0] ?? '',
        currentProfile.pillars?.[1] ?? '',
        currentProfile.pillars?.[2] ?? '',
    ]);

    if (!step) return null;

    const stepMeta = STEPS.find(s => s.key === step)!;

    // ── Handlers ────────────────────────────────────────────────────────────

    const toggleFormat = (fmt: string) => {
        setSelectedFormats(prev =>
            prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
        );
    };

    const handleSave = async () => {
        if (step === 'formats') {
            onComplete('formats', { formats: selectedFormats });
        } else if (step === 'audience') {
            onComplete('audience', { audience: audience.trim() });
        } else if (step === 'tone') {
            onComplete('tone', { tone: selectedTone });
        } else if (step === 'samples') {
            await handleSaveSamples();
        } else if (step === 'pillars') {
            onComplete('pillars', { pillars: pillars.filter(p => p.trim().length > 0) });
        }
    };

    const handleSaveSamples = async () => {
        setSamplesStatus('processing');
        setSamplesError('');
        try {
            const styleName = 'My Writing';
            let newStyle: CustomStyle;

            if (samplesTab === 'upload' && csvFile) {
                const data: CsvRow[] = await parseCsvTrainingData(csvFile);
                const nativeFormat = currentProfile.formats?.[0] ?? 'Tweet';
                newStyle = await createStyleFromData(styleName, data, nativeFormat, guardrails);
            } else {
                // Convert pasted text to description prompt
                const description = `These are writing samples from this creator. Learn their voice, tone, and style:\n\n${pastedText.trim()}`;
                newStyle = await createStyleFromDescription(styleName, description, guardrails);
            }

            onStyleCreated(newStyle);
            setSamplesStatus('done');
            onComplete('samples', { samplesStyleId: newStyle.id });
        } catch (e: any) {
            setSamplesStatus('error');
            setSamplesError(e.message || 'Something went wrong. Try again.');
        }
    };

    const canSave = () => {
        if (step === 'formats') return true; // can save with 0 selected (they skip)
        if (step === 'audience') return true;
        if (step === 'tone') return selectedTone.length > 0;
        if (step === 'samples') {
            if (samplesStatus === 'processing') return false;
            if (samplesTab === 'paste') return pastedText.trim().length > 20;
            if (samplesTab === 'upload') return csvFile !== null;
            return false;
        }
        if (step === 'pillars') return pillars.some(p => p.trim().length > 0);
        return true;
    };

    // ── Step content ─────────────────────────────────────────────────────────

    const renderStepContent = () => {
        if (step === 'formats') return renderFormats();
        if (step === 'audience') return renderAudience();
        if (step === 'tone') return renderTone();
        if (step === 'samples') return renderSamples();
        if (step === 'pillars') return renderPillars();
        return null;
    };

    const renderFormats = () => (
        <div className="flex flex-wrap gap-2.5">
            {FORMAT_OPTIONS.map(fmt => {
                const active = selectedFormats.includes(fmt);
                return (
                    <button
                        key={fmt}
                        onClick={() => toggleFormat(fmt)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                            active
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white'
                                : 'bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                        }`}
                    >
                        {active && <Check size={12} className="inline mr-1.5 -mt-0.5" />}
                        {fmt}
                    </button>
                );
            })}
        </div>
    );

    const renderAudience = () => (
        <div className="space-y-3">
            <textarea
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g. early-stage founders, indie hackers, product designers..."
                className="w-full h-28 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none transition-colors"
            />
            <p className="text-xs text-zinc-400">
                Be as specific as you like — the more detail, the better Alfred writes for them.
            </p>
        </div>
    );

    const renderTone = () => (
        <div className="space-y-2.5">
            {TONE_OPTIONS.map(tone => {
                const active = selectedTone === tone.id;
                return (
                    <button
                        key={tone.id}
                        onClick={() => setSelectedTone(tone.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                            active
                                ? 'bg-zinc-900 dark:bg-white/10 border-zinc-900 dark:border-white/30'
                                : 'bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-semibold ${active ? 'text-white dark:text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                    {tone.label}
                                </p>
                                <p className={`text-xs mt-0.5 ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                    {tone.desc}
                                </p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 shrink-0 ml-3 ${
                                active ? 'border-white bg-white' : 'border-zinc-300 dark:border-zinc-600'
                            }`}>
                                {active && <div className="w-full h-full rounded-full scale-50 bg-zinc-900 dark:bg-black" />}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );

    const renderSamples = () => (
        <div className="space-y-4">
            {/* Tab toggle */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
                <button
                    onClick={() => setSamplesTab('paste')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                        samplesTab === 'paste'
                            ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <Type size={13} /> Paste writing
                </button>
                <button
                    onClick={() => setSamplesTab('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                        samplesTab === 'upload'
                            ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <FileText size={13} /> Upload CSV
                </button>
            </div>

            {samplesTab === 'paste' ? (
                <div className="space-y-2">
                    <textarea
                        value={pastedText}
                        onChange={e => setPastedText(e.target.value)}
                        placeholder={"Paste 3–10 of your best posts, tweets, or paragraphs.\nSeparate each one with a blank line."}
                        className="w-full h-44 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none transition-colors leading-relaxed"
                    />
                    <p className="text-xs text-zinc-400">
                        The more examples you give, the more Alfred sounds like you.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* X Analytics tip */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Get your tweet history from X Analytics
                        </p>
                        <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
                            <li>Go to <span className="font-medium text-zinc-700 dark:text-zinc-400">X.com</span> → More → Creator Studio</li>
                            <li>Open <span className="font-medium text-zinc-700 dark:text-zinc-400">Data &amp; Analytics</span></li>
                            <li>Click <span className="font-medium text-zinc-700 dark:text-zinc-400">Export Data</span> → download the CSV</li>
                            <li>Upload it here — Alfred reads the content column automatically</li>
                        </ol>
                        <a
                            href="https://analytics.twitter.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors mt-1"
                        >
                            Open X Analytics <ExternalLink size={10} />
                        </a>
                    </div>

                    {/* File drop zone */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                            onChange={e => {
                                if (e.target.files?.[0]) setCsvFile(e.target.files[0]);
                            }}
                        />
                        {csvFile ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <FileText size={14} className="text-zinc-500" />
                                {csvFile.name}
                                <button
                                    onClick={e => { e.stopPropagation(); setCsvFile(null); }}
                                    className="ml-1 text-zinc-400 hover:text-red-500"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-full border border-zinc-200 dark:border-zinc-800">
                                    <Upload size={16} className="text-zinc-500" />
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Click to upload</p>
                                <p className="text-[11px] text-zinc-400 dark:text-zinc-600">CSV or TXT — needs a content or tweet column</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Processing / error states */}
            {samplesStatus === 'processing' && (
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <Loader2 size={14} className="animate-spin shrink-0" />
                    A moment please, Alfred is learning your style
                </div>
            )}
            {samplesStatus === 'error' && (
                <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    {samplesError}
                </div>
            )}
        </div>
    );

    const renderPillars = () => (
        <div className="space-y-3">
            {(['Topic 1', 'Topic 2', 'Topic 3'] as const).map((placeholder, i) => (
                <div key={i}>
                    <input
                        type="text"
                        value={pillars[i]}
                        onChange={e => {
                            const next: [string, string, string] = [...pillars] as [string, string, string];
                            next[i] = e.target.value;
                            setPillars(next);
                        }}
                        placeholder={placeholder}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                    />
                </div>
            ))}
            <p className="text-xs text-zinc-400">
                e.g. "SaaS growth", "Product design", "Founder mindset"
            </p>
        </div>
    );

    // ── Render ───────────────────────────────────────────────────────────────

    const stepIndex = STEPS.findIndex(s => s.key === step);

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm md:p-4">
            <div className="bg-white dark:bg-zinc-950/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-700/30 w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-300 ease-out overflow-hidden">

                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4">
                    <div className="flex-1 pr-4">
                        {/* Step counter */}
                        <div className="flex items-center gap-2 mb-3">
                            {STEPS.map((s, i) => (
                                <div
                                    key={s.key}
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                        i === stepIndex
                                            ? 'w-6 bg-zinc-900 dark:bg-white'
                                            : 'w-3 bg-zinc-200 dark:bg-zinc-700'
                                    }`}
                                />
                            ))}
                            <span className="text-[10px] text-zinc-400 ml-1">{stepIndex + 1} of {STEPS.length}</span>
                        </div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-white leading-snug">
                            {stepMeta.title}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1">{stepMeta.subtitle}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mt-1 shrink-0">
                        <X size={18} />
                    </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 mx-6" />

                {/* Step content */}
                <div className="px-6 py-5 max-h-[55vh] overflow-y-auto custom-scrollbar">
                    {renderStepContent()}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-2 flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors font-medium rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!canSave() || samplesStatus === 'processing'}
                        className="flex-1 py-2.5 text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {samplesStatus === 'processing' ? (
                            <><Loader2 size={14} className="animate-spin" /> Learning…</>
                        ) : (
                            'Save'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingStepModal;
