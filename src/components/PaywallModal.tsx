"use client";

import React, { useState } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';

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
            alert('Checkout failed. Please try again.');
            setLoadingPlan(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-zinc-700/30 overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors z-10"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="px-6 pt-8 pb-4 text-center">
                    {reason === 'monthly_limit' ? (
                        <>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                                You&apos;ve hit the limit
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                All {userUsage?.monthlyLimit ?? 40} free generations used this month.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                                Unlock {format}
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                This format requires a Starter or Pro plan.
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
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all"
                                style={{ width: `${usagePct}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 text-center">
                            Resets next month
                        </p>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t border-zinc-100/50 dark:border-zinc-800/30 mx-6" />

                {/* Plan options */}
                <div className="p-6 space-y-3">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                        Pick a plan
                    </p>

                    {/* Starter Plan */}
                    <button
                        onClick={() => handleUpgrade('starter')}
                        disabled={loadingPlan !== null}
                        className="w-full text-left p-4 rounded-xl border border-transparent hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-all duration-200 disabled:opacity-60 group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">Starter</p>
                                    <span className="text-xs text-zinc-500">$9/mo</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5">350 generations, every format</p>
                            </div>
                            <div className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                {loadingPlan === 'starter' ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                            </div>
                        </div>
                    </button>

                    {/* Pro Plan */}
                    <button
                        onClick={() => handleUpgrade('pro')}
                        disabled={loadingPlan !== null}
                        className="w-full text-left p-4 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 transition-all duration-200 disabled:opacity-60 group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">Pro</p>
                                    <span className="text-xs text-zinc-500">$29/mo</span>
                                    <span className="text-[9px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                                        Popular
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5">1,500 generations, every format</p>
                            </div>
                            <div className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                {loadingPlan === 'pro' ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                            </div>
                        </div>
                    </button>

                    {/* Dismiss */}
                    <div className="text-center pt-2">
                        <button
                            onClick={onClose}
                            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
