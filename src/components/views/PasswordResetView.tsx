import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Command, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
    userId: string;
    secret: string;
    onDone: () => void;
}

const PasswordResetView: React.FC<Props> = ({ userId, secret, onDone }) => {
    const { confirmPasswordReset } = useAuth();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await confirmPasswordReset(userId, secret, password);
            setSuccess(true);
            // Redirect to sign-in after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } catch (err: any) {
            setError(err?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-12 zoom-in-95 duration-1000 ease-out">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-6">
                        <div className="h-12 w-12 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg">
                            <Command size={24} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Set a new password
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Choose a strong password for your account.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">

                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    Password updated!
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Redirecting you to sign in…
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-col items-center gap-3 pb-2">
                                <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <KeyRound size={28} className="text-zinc-500 dark:text-zinc-400" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-300"
                                    placeholder="At least 8 characters"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-300"
                                    placeholder="••••••••"
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
                                className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                {isLoading ? 'Updating…' : 'Update Password'}
                            </button>
                        </form>
                    )}

                    {!success && (
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
                            <button
                                onClick={onDone}
                                className="text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors duration-200"
                            >
                                Back to sign in
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-xs text-center text-zinc-400 dark:text-zinc-600">
                    Reset links expire after 1 hour.
                </p>
            </div>
        </div>
    );
};

export default PasswordResetView;
