import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight, AlertCircle, Mail, X } from 'lucide-react';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
        <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
);

const CommandKeyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
    </svg>
);

type Mode = 'login' | 'signup' | 'forgot' | 'forgot-sent';

interface Props {
    /** Optional dismiss handler — if omitted the modal is not closeable */
    onClose?: () => void;
    /** Contextual message shown above the card, e.g. "5 free briefs used — sign up to continue" */
    reason?: string;
    /** Which form to show first */
    defaultMode?: 'login' | 'signup';
}

const AuthModal: React.FC<Props> = ({ onClose, reason, defaultMode = 'signup' }) => {
    const { login, loginWithGoogle, register, requestPasswordReset } = useAuth();
    const [mode, setMode] = useState<Mode>(defaultMode);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (mode === 'login') {
                await login(email, password);
            } else if (mode === 'signup') {
                await register(email, password, name);
            } else if (mode === 'forgot') {
                await requestPasswordReset(email);
                setMode('forgot-sent');
            }
        } catch (err: any) {
            setError(err.message || "That didn't work. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const reset = (next: Mode) => {
        setMode(next);
        setError('');
        setEmail('');
        setPassword('');
        setName('');
        setAgreedToTerms(false);
    };

    const inputClass = "w-full bg-transparent border-0 border-b-[1.5px] border-white/20 rounded-none px-0 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/60 transition-colors duration-300";
    const labelClass = "text-[11px] font-semibold text-zinc-400 uppercase tracking-wider";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal card */}
            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute -top-10 right-0 text-zinc-500 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Reason badge */}
                {reason && (
                    <p className="text-center text-sm text-zinc-300 leading-relaxed mb-5 px-2">
                        {reason}
                    </p>
                )}

                {/* Logo */}
                <div className="flex justify-center mb-5">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-black shadow-2xl">
                        <CommandKeyIcon />
                    </div>
                </div>

                {/* Glass card */}
                <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.8)] overflow-hidden text-white">
                    {mode === 'forgot-sent' ? (
                        <div className="p-8 space-y-6">
                            <div className="flex flex-col items-center gap-3 py-2">
                                <div className="h-14 w-14 rounded-2xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
                                    <Mail size={28} className="text-zinc-300" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">Check your inbox</h2>
                                <p className="text-sm text-center text-zinc-300 leading-relaxed">
                                    We sent a reset link to <span className="text-white font-medium">{email}</span>.
                                    <br /><span className="text-xs text-zinc-500">Expires in 1 hour.</span>
                                </p>
                            </div>
                            <div className="pt-4 border-t border-white/[0.1] text-center">
                                <button onClick={() => reset('login')} className="text-sm text-zinc-400 hover:text-white transition-colors">
                                    Back to sign in
                                </button>
                            </div>
                        </div>
                    ) : mode === 'forgot' ? (
                        <div className="p-8 space-y-5">
                            <h2 className="text-lg font-semibold text-center">Reset your password</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className={labelClass}>Email</label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                                </div>
                                {error && (
                                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                        <AlertCircle size={14} className="shrink-0" />{error}
                                    </div>
                                )}
                                <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-semibold py-2.5 rounded-xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40">
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><span>Send reset link</span><ArrowRight size={16} /></>}
                                </button>
                            </form>
                            <div className="pt-4 border-t border-white/[0.1] text-center">
                                <button onClick={() => reset('login')} className="text-sm text-zinc-400 hover:text-white transition-colors">Back to sign in</button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 space-y-5">
                            <h2 className="text-lg font-semibold text-center">
                                {mode === 'login' ? 'Welcome back' : 'Create your free account'}
                            </h2>

                            {/* Google */}
                            <button
                                type="button"
                                onClick={loginWithGoogle}
                                className="w-full flex items-center justify-center gap-3 bg-white/[0.1] border border-white/[0.15] hover:bg-white/[0.18] text-white font-medium py-2.5 rounded-xl transition-all backdrop-blur-sm"
                            >
                                <GoogleIcon />
                                Continue with Google
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-white/[0.12]" />
                                <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">or</span>
                                <div className="flex-1 h-px bg-white/[0.12]" />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {mode === 'signup' && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className={labelClass}>Name</label>
                                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className={labelClass}>Email</label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className={labelClass}>Password</label>
                                        {mode === 'login' && (
                                            <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-[11px] text-zinc-500 hover:text-white transition-colors">
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>
                                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                        <AlertCircle size={14} className="shrink-0" />{error}
                                    </div>
                                )}

                                {mode === 'signup' && (
                                    <label className="flex items-start gap-2.5 cursor-pointer animate-in fade-in duration-300">
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={e => setAgreedToTerms(e.target.checked)}
                                            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border border-white/30 bg-white/10 accent-white cursor-pointer"
                                        />
                                        <span className="text-[11px] text-zinc-400 leading-relaxed">
                                            I agree to the{' '}
                                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors">Terms</a>
                                            {' '}and{' '}
                                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors">Privacy Policy</a>
                                        </span>
                                    </label>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || (mode === 'signup' && !agreedToTerms)}
                                    className="w-full bg-white text-black font-semibold py-2.5 rounded-xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 mt-1 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {isLoading
                                        ? <Loader2 size={18} className="animate-spin text-black" />
                                        : <>{mode === 'login' ? 'Sign In' : 'Create Free Account'} <ArrowRight size={16} /></>}
                                </button>
                            </form>

                            <div className="pt-4 border-t border-white/[0.1] text-center">
                                <button onClick={() => reset(mode === 'login' ? 'signup' : 'login')} className="text-sm text-zinc-400 hover:text-white transition-colors">
                                    {mode === 'login' ? "New here? Sign up free" : "Already have an account? Sign in"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Legal */}
                <div className="flex justify-center gap-4 mt-4">
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">Privacy Policy</a>
                    <span className="text-zinc-700 text-[10px]">·</span>
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
