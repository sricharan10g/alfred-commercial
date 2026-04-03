import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Command, ArrowRight, AlertCircle, Mail } from 'lucide-react';
import Galaxy from '../ui/Galaxy';
import CurvedLoop from '../ui/CurvedLoop';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
        <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
);

// ⌘ Command Key icon SVG — matches the attached image
const CommandKeyIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
    </svg>
);

type Mode = 'login' | 'signup' | 'forgot' | 'forgot-sent';

// Curved loop band configs
const LOOP_BANDS = [
    {
        text: "Blank Page? Gone. \u2726 Writer's Block? Dead. \u2726 Bad Tweets? Never Again. \u2726 ",
        speed: 1.2,
        curveAmount: 180,
        direction: 'left' as const,
        position: { top: '8%', left: '-5%', right: '-5%' },
        rotate: '-4deg',
        opacity: 0.12,
        fontSize: '2.2rem',
    },
    {
        text: "Your Followers Won't Know \u2726 Your Engagement Will \u2726 Powered by Alfred \u2726 ",
        speed: 0.8,
        curveAmount: -120,
        direction: 'right' as const,
        position: { top: '22%', left: '-8%', right: '-8%' },
        rotate: '2deg',
        opacity: 0.08,
        fontSize: '1.8rem',
    },
    {
        text: "Write. Post. Grow. \u2726 Write. Post. Grow. \u2726 Write. Post. Grow. \u2726 ",
        speed: 1.5,
        curveAmount: 140,
        direction: 'left' as const,
        position: { bottom: '22%', left: '-6%', right: '-6%' },
        rotate: '3deg',
        opacity: 0.1,
        fontSize: '2rem',
    },
    {
        text: "Write Less \u2726 Post More \u2726 Grow Faster \u2726 Think Bigger \u2726 Alfred Gets It \u2726 ",
        speed: 1,
        curveAmount: -160,
        direction: 'right' as const,
        position: { bottom: '8%', left: '-4%', right: '-4%' },
        rotate: '-2.5deg',
        opacity: 0.07,
        fontSize: '1.6rem',
    },
    {
        text: "Go Viral \u2726 Own Your Niche \u2726 Build Your Audience \u2726 Tweet Smarter \u2726 ",
        speed: 0.6,
        curveAmount: 100,
        direction: 'left' as const,
        position: { top: '48%', left: '-10%', right: '-10%' },
        rotate: '-1deg',
        opacity: 0.06,
        fontSize: '1.5rem',
    },
];

const AuthView: React.FC = () => {
    const { login, loginWithGoogle, register, requestPasswordReset } = useAuth();
    const [mode, setMode] = useState<Mode>('login');
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
            console.error(err);
            setError(err.message || 'That didn\'t work. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const switchToLogin = () => {
        setMode('login');
        setError('');
        setEmail('');
        setPassword('');
        setName('');
    };

    const switchToSignup = () => {
        setMode('signup');
        setError('');
        setEmail('');
        setPassword('');
        setName('');
        setAgreedToTerms(false);
    };

    // Dark glass input — underline only, white text
    const inputClass = "w-full bg-transparent border-0 border-b-[1.5px] border-white/20 rounded-none px-0 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/60 transition-colors duration-300";

    const labelClass = "text-[11px] font-semibold text-zinc-400 uppercase tracking-wider";

    // ── Render the inner content based on mode ───────────────────────────────
    const renderContent = () => {
        const isLogin = mode === 'login';

        // Forgot-sent confirmation
        if (mode === 'forgot-sent') {
            return (
                <div key="forgot-sent" className="w-full max-w-md space-y-6 relative z-10 px-4 animate-in fade-in duration-500 ease-out">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-2xl">
                                <CommandKeyIcon />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                            Check your inbox
                        </h1>
                    </div>

                    <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-8 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.6)] space-y-6">
                        <div className="flex flex-col items-center gap-3 py-2">
                            <div className="h-14 w-14 rounded-2xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] flex items-center justify-center">
                                <Mail size={28} className="text-zinc-300" />
                            </div>
                            <p className="text-sm text-center text-zinc-300 leading-relaxed">
                                We sent you a reset link. Click it to set a new password.
                                <br />
                                <span className="text-xs text-zinc-500">Expires in 1 hour.</span>
                            </p>
                        </div>

                        <div className="pt-4 border-t border-white/[0.1] text-center">
                            <button
                                onClick={switchToLogin}
                                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                            >
                                Back to sign in
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-center text-zinc-500">
                        Can&apos;t find the email? Check your spam folder.
                    </p>
                </div>
            );
        }

        // Forgot password form
        if (mode === 'forgot') {
            return (
                <div key="forgot" className="w-full max-w-md space-y-6 relative z-10 px-4 animate-in fade-in duration-500 ease-out">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-2xl">
                                <CommandKeyIcon />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                            Reset your password
                        </h1>
                    </div>

                    <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-8 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.6)]">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 backdrop-blur-sm p-3 rounded-xl border border-red-500/20">
                                    <AlertCircle size={14} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black font-semibold py-2.5 rounded-xl hover:bg-zinc-100 transition-all duration-300 flex items-center justify-center gap-2 mt-2 shadow-lg"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                                    <>Send reset link <ArrowRight size={16} /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-white/[0.1] text-center">
                            <button
                                onClick={switchToLogin}
                                className="text-sm text-zinc-400 hover:text-white transition-colors duration-300"
                            >
                                Back to sign in
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Login / Signup form
        return (
            <div key={isLogin ? 'login' : 'signup'} className="w-full max-w-md space-y-6 relative z-10 px-4 animate-in fade-in duration-500 ease-out">
                {/* Logo + heading */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-2xl">
                            <CommandKeyIcon />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                        {isLogin ? 'Alfred, by PickAndPartner' : 'Create account'}
                    </h1>
                </div>

                {/* Dark glass card */}
                <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-8 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.6)]">
                    {/* Google OAuth button */}
                    <button
                        type="button"
                        onClick={loginWithGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-white/[0.1] border border-white/[0.15] hover:bg-white/[0.18] text-white font-medium py-2.5 rounded-xl transition-all duration-300 mb-5 backdrop-blur-sm"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-white/[0.12]" />
                        <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-white/[0.12]" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className={labelClass}>Name</label>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={inputClass}
                                    placeholder="Your name"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className={labelClass}>Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className={labelClass}>Password</label>
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => { setMode('forgot'); setError(''); }}
                                        className="text-[11px] text-zinc-500 hover:text-white transition-colors duration-200"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 backdrop-blur-sm p-3 rounded-xl border border-red-500/20 animate-in shake duration-500">
                                <AlertCircle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <label className="flex items-start gap-2.5 cursor-pointer mt-1 animate-in fade-in duration-300">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border border-white/30 bg-white/10 accent-white cursor-pointer"
                                />
                                <span className="text-[11px] text-zinc-400 leading-relaxed">
                                    I agree to the{' '}
                                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors">
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors">
                                        Privacy Policy
                                    </a>
                                </span>
                            </label>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || (!isLogin && !agreedToTerms)}
                            className="w-full bg-white text-black font-semibold py-2.5 rounded-xl hover:bg-zinc-100 transition-all duration-300 flex items-center justify-center gap-2 mt-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin text-black" /> : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/[0.1] text-center">
                        <button
                            onClick={isLogin ? switchToSignup : switchToLogin}
                            className="text-sm text-zinc-400 hover:text-white transition-colors duration-300"
                        >
                            {isLogin ? "New here? Sign up" : "Already have one? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ── Single stable wrapper — background never re-mounts ───────────────────
    return (
        <div className="h-full w-full flex items-center justify-center text-white overflow-hidden relative">
            {/* Galaxy background — mounted once, never re-renders */}
            <div className="absolute inset-0 z-0">
                <Galaxy
                    speed={1}
                    density={0.7}
                    hueShift={140}
                    rotationSpeed={0.1}
                    starSpeed={0.5}
                    glowIntensity={0.2}
                    twinkleIntensity={0.2}
                    saturation={0}
                    mouseInteraction={true}
                    mouseRepulsion={true}
                    repulsionStrength={2}
                    autoCenterRepulsion={0}
                    transparent={false}
                />
            </div>

            {/* Curved loop bands — stable, behind card */}
            {LOOP_BANDS.map((band, i) => (
                <div
                    key={i}
                    className="absolute pointer-events-auto z-[1]"
                    style={{
                        ...band.position,
                        transform: `rotate(${band.rotate})`,
                        opacity: band.opacity,
                    }}
                >
                    <CurvedLoop
                        marqueeText={band.text}
                        speed={band.speed}
                        curveAmount={band.curveAmount}
                        direction={band.direction}
                        interactive={true}
                        className="curved-loop-band"
                        style={{ fontSize: band.fontSize }}
                    />
                </div>
            ))}
            <style>{`
                .curved-loop-band {
                    fill: rgba(255,255,255,0.9);
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 2rem;
                }
            `}</style>

            {/* Content — only this part swaps on mode change */}
            {renderContent()}

            {/* Legal footer */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                    Privacy Policy
                </a>
                <span className="text-zinc-700 text-[10px]">·</span>
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                    Terms of Service
                </a>
            </div>
        </div>
    );
};

export default AuthView;
