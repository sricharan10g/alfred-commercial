"use client";

import React, { useState } from 'react';
import { X, Lock, Zap, Crown, Loader2 } from 'lucide-react';

interface UserUsage {
    plan: string;
    monthCount: number;
    monthlyLimit: number;
    remaining: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    reason: 'monthly_limit' | 'feature_gated';
    format?: string;
    userUsage: UserUsage | null;
    userId: string;
    userEmail: string;
    userName?: string;
}

export default function PaywallModal({ isOpen, onClose, reason, format, userUsage, userId, userEmail, userName }: Props) {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    if (!isOpen) return null;

    const usagePct = userUsage
        ? Math.min(100, Math.round((userUsage.monthCount / userUsage.monthlyLimit) * 100))
        : 100;

    const handleUpgrade = async (plan: 'starter' | 'pro') => {
        setLoadingPlan(plan);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, userId, email: userEmail, name: userName }),
            });
            const data = await res.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error(data.error || 'No checkout URL received');
            }
        } catch (err) {
            console.error('[PaywallModal] Checkout error:', err);
            alert('Something went wrong starting checkout. Please try again.');
            setLoadingPlan(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-10"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                        <Lock size={22} className="text-amber-600 dark:text-amber-400" />
                    </div>

                    {reason === 'monthly_limit' ? (
                        <>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                                Monthly limit reached
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                You&apos;ve used all {userUsage?.monthlyLimit ?? 40} generations on your Free plan this month.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                                Paid plan required
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">{format}</span> is only available on Starter and Pro plans.
                            </p>
                        </>
                    )}
                </div>

                {/* Usage progress bar — only shown for monthly limit */}
                {reason === 'monthly_limit' && userUsage && (
                    <div className="px-6 pb-4">
                        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                            <span>{userUsage.monthCount} used</span>
                            <span>{userUsage.monthlyLimit} total</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all"
                                style={{ width: `${usagePct}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5 text-center">
                            Resets on the 1st of next month
                        </p>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 mx-6" />

                {/* Plan cards */}
                <div className="p-6 space-y-3">
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                        Upgrade to continue
                    </p>

                    {/* Starter Plan */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                    <Zap size={16} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="font-semibold text-zinc-900 dark:text-white text-sm">Starter</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">350 generations · All formats</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-zinc-900 dark:text-white">$9</div>
                                <div className="text-xs text-zinc-400">/month</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleUpgrade('starter')}
                            disabled={loadingPlan !== null}
                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {loadingPlan === 'starter' ? <><Loader2 size={14} className="animate-spin" /> Redirecting...</> : 'Upgrade to Starter'}
                        </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="relative rounded-xl border-2 border-purple-500 dark:border-purple-600 p-4 bg-purple-50/50 dark:bg-purple-900/10">
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-semibold uppercase tracking-wider">
                                Most Popular
                            </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                    <Crown size={16} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <div className="font-semibold text-zinc-900 dark:text-white text-sm">Pro</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">1,500 generations · All formats</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-zinc-900 dark:text-white">$29</div>
                                <div className="text-xs text-zinc-400">/month</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleUpgrade('pro')}
                            disabled={loadingPlan !== null}
                            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {loadingPlan === 'pro' ? <><Loader2 size={14} className="animate-spin" /> Redirecting...</> : 'Upgrade to Pro'}
                        </button>
                    </div>

                    {/* Stay on free */}
                    <div className="text-center pt-1">
                        <button
                            onClick={onClose}
                            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            Continue with Free plan →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
