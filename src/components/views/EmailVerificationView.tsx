import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Command, Mail, RefreshCw, LogOut } from 'lucide-react';

const RESEND_COOLDOWN = 30; // seconds

const EmailVerificationView: React.FC = () => {
    const { user, logout, sendVerification } = useAuth();
    const [isSending, setIsSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [message, setMessage] = useState('');
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Tick cooldown timer down every second
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleResend = async () => {
        if (isSending || cooldown > 0) return;
        setIsSending(true);
        setMessage('');
        try {
            await sendVerification();
            setMessage('Verification email sent! Check your inbox.');
            setCooldown(RESEND_COOLDOWN);
        } catch (err: any) {
            setMessage(err?.message || 'Failed to resend. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
        } finally {
            setIsLoggingOut(false);
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
                        Verify your email
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Almost there — just one more step.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">

                    {/* Inbox illustration */}
                    <div className="flex flex-col items-center gap-3 py-2">
                        <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Mail size={28} className="text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            We sent a verification link to{' '}
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {user?.email}
                            </span>
                            .<br />Click the link in that email to activate your account.
                        </p>
                    </div>

                    {/* Status message */}
                    {message && (
                        <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg px-3 py-2">
                            {message}
                        </p>
                    )}

                    {/* Resend button */}
                    <button
                        onClick={handleResend}
                        disabled={isSending || cooldown > 0}
                        className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {cooldown > 0
                            ? `Resend in ${cooldown}s`
                            : isSending
                            ? 'Sending…'
                            : 'Resend verification email'}
                    </button>

                    {/* Divider + logout */}
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
                        <p className="text-xs text-zinc-400 dark:text-zinc-600 mb-3">
                            Wrong email address?
                        </p>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors duration-200"
                        >
                            {isLoggingOut
                                ? <Loader2 size={14} className="animate-spin" />
                                : <LogOut size={14} />}
                            Log out and use a different email
                        </button>
                    </div>
                </div>

                {/* Help text */}
                <p className="text-xs text-center text-zinc-400 dark:text-zinc-600">
                    Can't find the email? Check your spam folder.
                </p>
            </div>
        </div>
    );
};

export default EmailVerificationView;
