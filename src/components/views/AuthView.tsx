import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Command, ArrowRight, AlertCircle, Mail } from 'lucide-react';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
        <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
);

type Mode = 'login' | 'signup' | 'forgot' | 'forgot-sent';

const AuthView: React.FC = () => {
    const { login, loginWithGoogle, register, requestPasswordReset } = useAuth();
    const [mode, setMode] = useState<Mode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

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
            setError(err.message || 'Something went wrong. Please try again.');
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
    };

    // ── Forgot-sent confirmation screen ──────────────────────────────────────
    if (mode === 'forgot-sent') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-4">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-12 zoom-in-95 duration-1000 ease-out">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-6">
                            <div className="h-12 w-12 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg">
                                <Command size={24} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            We sent a password reset link to your email.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">
                        <div className="flex flex-col items-center gap-3 py-2">
                            <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <Mail size={28} className="text-zinc-500 dark:text-zinc-400" />
                            </div>
                            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Click the link in that email to set a new password.
                                <br />
                                <span className="text-xs text-zinc-400 dark:text-zinc-600">Links expire after 1 hour.</span>
                            </p>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
                            <button
                                onClick={switchToLogin}
                                className="text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors duration-200"
                            >
                                Back to sign in
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-center text-zinc-400 dark:text-zinc-600">
                        Can't find the email? Check your spam folder.
                    </p>
                </div>
            </div>
        );
    }

    // ── Forgot password form ──────────────────────────────────────────────────
    if (mode === 'forgot') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-4">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-12 zoom-in-95 duration-1000 ease-out">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-6">
                            <div className="h-12 w-12 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg">
                                <Command size={24} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Enter your email and we'll send you a reset link.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-300"
                                    placeholder="name@example.com"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                                    <AlertCircle size={14} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                                    <>Send reset email <ArrowRight size={16} /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                            <button
                                onClick={switchToLogin}
                                className="text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors duration-300"
                            >
                                Back to sign in
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Login / Signup form ───────────────────────────────────────────────────
    const isLogin = mode === 'login';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-12 zoom-in-95 duration-1000 ease-out">

                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-6">
                        <div className="h-12 w-12 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg animate-in zoom-in duration-1000 delay-200 fill-mode-backwards">
                            <Command size={24} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-backwards">
                        {isLogin ? 'Welcome back to Alfred' : 'Create your account'}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400 fill-mode-backwards">
                        {isLogin ? 'Enter your credentials to continue.' : 'Start automating your research and content.'}
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-backwards">
                    {/* Google OAuth button */}
                    <button
                        type="button"
                        onClick={loginWithGoogle}
                        className="w-full flex items-center justify-center gap-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium py-2.5 rounded-lg transition-colors duration-200 mb-4"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                        <span className="text-xs text-zinc-400 dark:text-zinc-600">or</span>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-500">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-300"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-300"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Password</label>
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => { setMode('forgot'); setError(''); }}
                                        className="text-xs text-zinc-400 hover:text-black dark:hover:text-white transition-colors duration-200"
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
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-300"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50 animate-in shake duration-500">
                                <AlertCircle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                        <button
                            onClick={isLogin ? switchToSignup : switchToLogin}
                            className="text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors duration-300"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
