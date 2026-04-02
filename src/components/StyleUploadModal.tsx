import React, { useState, useEffect } from 'react';
import { Upload, Loader2, X, AlertCircle, Save, ArrowLeft, FileText, Type, ChevronDown, ChevronRight, Bot, Sparkles, ScanEye } from 'lucide-react';
import { parseCsvTrainingData } from '../services/csvService';
import { createStyleFromData, createStyleFromDescription } from '../services/aiClient';
import { CustomStyle, AgentType, Guardrails } from '../types';
import { FORMAT_LIBRARY } from '../constants';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onStyleCreated: (style: CustomStyle) => void;
    guardrails: Guardrails;
    initialStyle?: CustomStyle | null;
}

const StyleUploadModal: React.FC<Props> = ({ isOpen, onClose, onStyleCreated, guardrails, initialStyle }) => {
    const [mode, setMode] = useState<'csv' | 'prompt'>('csv');
    const [styleName, setStyleName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');

    // New state for selecting the native format of the CSV data
    const [selectedFormat, setSelectedFormat] = useState<string>(FORMAT_LIBRARY[0].name);

    const [status, setStatus] = useState<'IDLE' | 'PARSING' | 'ANALYZING' | 'REVIEW' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    // Staging state for review
    const [generatedStyle, setGeneratedStyle] = useState<CustomStyle | null>(null);
    const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.IDEA_GENERATOR);

    // Initialize with style if editing
    useEffect(() => {
        if (isOpen && initialStyle) {
            setGeneratedStyle(initialStyle);
            setStatus('REVIEW');
            setStyleName(initialStyle.name);
        } else if (!isOpen) {
            // Reset when closed
            setTimeout(() => {
                setStatus('IDLE');
                setFile(null);
                setDescription('');
                setStyleName('');
                setGeneratedStyle(null);
                setMode('csv');
                setSelectedFormat(FORMAT_LIBRARY[0].name);
                setActiveAgent(AgentType.IDEA_GENERATOR);
            }, 300);
        }
    }, [isOpen, initialStyle]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // Auto-suggest name from file
            if (!styleName) {
                setStyleName(e.target.files[0].name.replace('.csv', '').split('_').join(' '));
            }
        }
    };

    const handleAnalyze = async () => {
        if (!styleName) return;

        try {
            if (mode === 'csv') {
                if (!file) return;
                setStatus('PARSING');
                const data = await parseCsvTrainingData(file);

                setStatus('ANALYZING');
                // Pass the selectedFormat as the nativeFormat
                const newStyle = await createStyleFromData(styleName, data, selectedFormat, guardrails);
                setGeneratedStyle(newStyle);
            } else {
                if (!description) return;
                setStatus('ANALYZING');
                const newStyle = await createStyleFromDescription(styleName, description, guardrails);
                setGeneratedStyle(newStyle);
            }

            setStatus('REVIEW');

        } catch (e: any) {
            console.error(e);
            setStatus('ERROR');
            setErrorMsg(e.message || "Failed to process style");
        }
    };

    const handleUpdatePrompt = (agentType: AgentType, text: string) => {
        if (!generatedStyle) return;
        setGeneratedStyle({
            ...generatedStyle,
            prompts: {
                ...generatedStyle.prompts,
                [agentType]: text
            }
        });
    };

    const handleFinalSave = () => {
        if (!generatedStyle) return;
        onStyleCreated(generatedStyle);
        setStatus('SUCCESS');

        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const handleBackToUpload = () => {
        setStatus('IDLE');
        setGeneratedStyle(null);
        setFile(null);
    };

    // --- Render Views ---

    const renderInputView = () => (
        <div className="space-y-4 p-6">
            {/* Mode Toggle */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
                <button
                    onClick={() => setMode('csv')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${mode === 'csv' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    <FileText size={14} /> Upload CSV
                </button>
                <button
                    onClick={() => setMode('prompt')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${mode === 'prompt' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    <Type size={14} /> Describe it
                </button>
            </div>

            <div>
                <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Style Name</label>
                <input
                    type="text"
                    value={styleName}
                    onChange={(e) => setStyleName(e.target.value)}
                    placeholder=""
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 transition-colors duration-200"
                />
            </div>

            {mode === 'csv' ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Format</label>
                        <div className="relative">
                            <select
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                className="w-full appearance-none bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 transition-colors duration-200"
                            >
                                {FORMAT_LIBRARY.map(fmt => (
                                    <option key={fmt.id} value={fmt.name}>{fmt.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                            Match this to your data so the AI can nail the structure when writing.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Upload File</label>
                        <div className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors duration-200">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full">
                                {file ? (
                                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded text-sm border border-zinc-200 dark:border-zinc-700">
                                        <span>{file.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-full border border-zinc-200 dark:border-zinc-800">
                                            <Upload size={16} className="text-zinc-500" />
                                        </div>
                                        <span className="text-zinc-500 dark:text-zinc-400 text-xs">Click to upload</span>
                                    </>
                                )}
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600">Needs a &apos;Content&apos; column</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Voice, tone, personality — describe it."
                        className="w-full h-32 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 resize-none transition-colors duration-200 leading-relaxed"
                    />
                </div>
            )}

            {status === 'ERROR' && (
                <div className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/20 p-3 rounded-lg flex items-start gap-2 border border-red-200 dark:border-red-900/50">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    {errorMsg}
                </div>
            )}

            <button
                onClick={handleAnalyze}
                disabled={!styleName || (mode === 'csv' && !file) || (mode === 'prompt' && !description) || (status !== 'IDLE' && status !== 'ERROR')}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {status === 'PARSING' && <><Loader2 size={16} className="animate-spin" /> Reading file...</>}
                {status === 'ANALYZING' && <><Loader2 size={16} className="animate-spin" /> {mode === 'csv' ? 'Learning your style...' : 'Building your persona...'}</>}
                {(status === 'IDLE' || status === 'ERROR') && "Create style"}
            </button>
        </div>
    );

    const renderReviewView = () => {
        if (!generatedStyle) return null;

        const agents = [
            { type: AgentType.IDEA_GENERATOR, icon: <Sparkles size={14} />, label: "Idea Generator" },
            { type: AgentType.DRAFT_WRITER, icon: <Bot size={14} />, label: "Draft Writer" },
            { type: AgentType.VIRAL_CHECK, icon: <ScanEye size={14} />, label: "Viral Check" }
        ];

        return (
            <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        {!initialStyle && (
                            <button
                                onClick={handleBackToUpload}
                                className="p-1.5 -ml-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {generatedStyle.name}
                                </h2>
                                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900/50">
                                    {generatedStyle.role || 'Custom Persona'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleFinalSave}
                            className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-lg font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Save size={12} /> Save
                        </button>
                    </div>
                </div>

                {/* Main Layout */}
                <div className="flex flex-1 min-h-0">
                    {/* Sidebar / Tabs */}
                    <div className="w-56 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col p-2 gap-0.5 shrink-0 overflow-y-auto">
                        <p className="px-3 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mb-1">Agents</p>
                        {agents.map((agent) => {
                            const isActive = activeAgent === agent.type;
                            return (
                                <button
                                    key={agent.type}
                                    onClick={() => setActiveAgent(agent.type)}
                                    className={`
                                    text-left px-3 py-2.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-between group
                                    ${isActive
                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50'
                                        }
                                 `}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1 rounded ${isActive ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                                            {agent.icon}
                                        </div>
                                        {agent.label}
                                    </div>
                                    {isActive && <ChevronRight size={12} className="text-zinc-400" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-black relative">
                        <div className="absolute inset-0 flex flex-col">
                            <div className="shrink-0 p-3 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black z-10 flex justify-between items-center">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    System Instruction
                                </label>
                                <span className="text-[10px] font-mono text-zinc-400">
                                    {generatedStyle.prompts[activeAgent].length} chars
                                </span>
                            </div>

                            <div className="flex-1 relative overflow-hidden group">
                                <textarea
                                    value={generatedStyle.prompts[activeAgent]}
                                    onChange={(e) => handleUpdatePrompt(activeAgent, e.target.value)}
                                    spellCheck={false}
                                    className="w-full h-full p-6 bg-transparent border-none outline-none resize-none font-mono text-xs md:text-sm leading-relaxed text-zinc-800 dark:text-zinc-300 custom-scrollbar focus:bg-zinc-50/50 dark:focus:bg-zinc-900/30 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4 transition-colors duration-200">
            <div
                className={`bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-white/20 dark:border-zinc-700/30 w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col ${status === 'REVIEW' ? 'max-w-4xl h-[550px] p-0' : 'max-w-md p-0'}`}
            >

                {/* Header - Only show title in upload mode, review mode has its own header */}
                {status !== 'REVIEW' && (
                    <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-900">
                        <h2 className="text-zinc-900 dark:text-white font-semibold transition-colors duration-200">{status === 'SUCCESS' ? 'Style Created' : 'New Writing Style'}</h2>
                        <button onClick={onClose}><X size={20} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors" /></button>
                    </div>
                )}

                {status === 'SUCCESS' ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 p-6">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2 animate-in zoom-in duration-300">
                            <Save size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-medium text-zinc-900 dark:text-white transition-colors duration-200">{initialStyle ? 'Changes Saved!' : 'Persona Created!'}</h3>
                            {!initialStyle && <p className="text-zinc-500 text-sm mt-2">You can now select <strong>{styleName}</strong> from the main menu.</p>}
                        </div>
                    </div>
                ) : (
                    status === 'REVIEW' ? renderReviewView() : renderInputView()
                )}
            </div>
        </div>
    );
};

export default StyleUploadModal;