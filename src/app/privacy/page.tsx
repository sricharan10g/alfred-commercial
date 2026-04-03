import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Privacy Policy — Alfred',
    description: 'How Alfred collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-zinc-300">
            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Back link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-12"
                >
                    <ArrowLeft size={14} /> Back to Alfred
                </Link>

                <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                <p className="text-sm text-zinc-500 mb-12">Last updated: April 3, 2026</p>

                <div className="space-y-10 text-sm leading-relaxed">

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">1. Who We Are</h2>
                        <p>
                            Alfred is an AI-powered writing assistant operated by <strong className="text-zinc-200">PickAndPartner</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
                            This policy explains what personal data we collect when you use Alfred at{' '}
                            <span className="text-zinc-400">alfred.pickandpartner.com</span>, how we use it, and your rights regarding that data.
                        </p>
                        <p className="mt-3">
                            For data-related inquiries, contact us at:{' '}
                            <a href="mailto:picknpartner@gmail.com" className="text-white underline underline-offset-2">
                                picknpartner@gmail.com
                            </a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">2. Data We Collect</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Account data</h3>
                                <p>When you create an account we collect your name, email address, and a hashed password (or, if you sign in with Google, your Google profile name and email).</p>
                            </div>
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Usage data</h3>
                                <p>We record how many AI generations you have made in the current billing period so we can enforce plan limits.</p>
                            </div>
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Content you submit</h3>
                                <p>Text prompts and briefs you send to Alfred are forwarded to one of our AI providers (see section 5) to generate a response. We do not store your prompt content in our database beyond what is needed to return the response.</p>
                            </div>
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Payment data</h3>
                                <p>Subscription and billing information is handled entirely by <strong className="text-zinc-200">Dodo Payments</strong>. We receive only a confirmation of your subscription status; we never see or store your card number or full payment details.</p>
                            </div>
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Local browser storage</h3>
                                <p>Alfred stores certain preferences (theme, selected AI provider, custom writing styles, guardrails, session IDs) in your browser&apos;s <code className="text-zinc-400 bg-zinc-900 px-1 rounded">localStorage</code>. This data never leaves your device unless you explicitly sync it. We do not use HTTP tracking cookies, and we do not run any third-party analytics scripts.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">3. How We Use Your Data</h2>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li><span className="text-zinc-300">To provide the service</span> — authenticate you, enforce plan limits, and generate AI content.</li>
                            <li><span className="text-zinc-300">To process payments</span> — pass your email and user ID to Dodo Payments to create a checkout session.</li>
                            <li><span className="text-zinc-300">To send transactional emails</span> — password reset links and email verification notices only. We do not send marketing emails without your consent.</li>
                            <li><span className="text-zinc-300">To comply with legal obligations</span> — e.g. maintaining billing records.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">4. Legal Basis (GDPR)</h2>
                        <p>If you are located in the European Economic Area (EEA) or UK, we process your data under these legal bases:</p>
                        <ul className="list-disc list-inside space-y-2 mt-3 text-zinc-400">
                            <li><span className="text-zinc-300">Contract performance</span> — to deliver the service you signed up for.</li>
                            <li><span className="text-zinc-300">Legitimate interests</span> — to maintain security, prevent fraud, and improve the service.</li>
                            <li><span className="text-zinc-300">Consent</span> — where we ask for it explicitly (e.g. at account creation).</li>
                            <li><span className="text-zinc-300">Legal obligation</span> — where required by applicable law.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">5. Sub-Processors & Third Parties</h2>
                        <p className="mb-4">We share data with the following trusted sub-processors to operate Alfred:</p>
                        <div className="border border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-zinc-900 text-zinc-400">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium">Provider</th>
                                        <th className="text-left px-4 py-3 font-medium">Purpose</th>
                                        <th className="text-left px-4 py-3 font-medium">Data shared</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                    <tr>
                                        <td className="px-4 py-3 text-zinc-300 font-medium">Appwrite</td>
                                        <td className="px-4 py-3">Authentication &amp; database</td>
                                        <td className="px-4 py-3">Name, email, usage counts</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-zinc-300 font-medium">Dodo Payments</td>
                                        <td className="px-4 py-3">Payment processing</td>
                                        <td className="px-4 py-3">Email, user ID, plan selection</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-zinc-300 font-medium">Anthropic (Claude)</td>
                                        <td className="px-4 py-3">AI text generation</td>
                                        <td className="px-4 py-3">Your prompts (when Claude is selected)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-zinc-300 font-medium">OpenAI</td>
                                        <td className="px-4 py-3">AI text generation</td>
                                        <td className="px-4 py-3">Your prompts (when GPT is selected)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-zinc-300 font-medium">Google (Gemini)</td>
                                        <td className="px-4 py-3">AI text generation &amp; OAuth</td>
                                        <td className="px-4 py-3">Your prompts (when Gemini is selected); profile name &amp; email (Google sign-in)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-zinc-300 font-medium">Cloudflare</td>
                                        <td className="px-4 py-3">Hosting &amp; edge delivery</td>
                                        <td className="px-4 py-3">Request metadata (IP, headers)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-zinc-500 text-xs">We do not sell your personal data to any third party.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">6. Data Retention</h2>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li>Account data is retained for as long as your account is active.</li>
                            <li>After account deletion we remove your personal data within <strong className="text-zinc-300">30 days</strong>, except where retention is required by law (e.g. billing records, which are kept for <strong className="text-zinc-300">7 years</strong> for tax purposes).</li>
                            <li>Browser <code className="text-zinc-400 bg-zinc-900 px-1 rounded">localStorage</code> data is controlled entirely by you and is cleared when you clear your browser data.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">7. Your Rights</h2>
                        <p className="mb-3">Depending on your location you may have the right to:</p>
                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
                            <li><span className="text-zinc-300">Access</span> — request a copy of the personal data we hold about you.</li>
                            <li><span className="text-zinc-300">Correction</span> — ask us to fix inaccurate data.</li>
                            <li><span className="text-zinc-300">Deletion</span> — request that we delete your account and associated data.</li>
                            <li><span className="text-zinc-300">Portability</span> — receive your data in a machine-readable format.</li>
                            <li><span className="text-zinc-300">Objection / Restriction</span> — object to or restrict certain processing activities.</li>
                            <li><span className="text-zinc-300">Withdraw consent</span> — where we rely on consent, you may withdraw it at any time.</li>
                        </ul>
                        <p className="mt-3">
                            To exercise any of these rights, email{' '}
                            <a href="mailto:picknpartner@gmail.com" className="text-white underline underline-offset-2">
                                picknpartner@gmail.com
                            </a>. We will respond within 30 days.
                        </p>
                        <p className="mt-2 text-zinc-500">
                            EEA/UK residents may also lodge a complaint with their local data protection authority.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">8. International Transfers</h2>
                        <p>Alfred is hosted on Cloudflare&apos;s global edge network. If you are located in the EEA or UK, your data may be transferred to and processed in countries outside the EEA. Where this occurs, we rely on appropriate safeguards (such as Standard Contractual Clauses) to protect your data.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">9. Children</h2>
                        <p>Alfred is not directed at children under the age of 16. We do not knowingly collect personal data from children. If you believe a child has provided us with data, please contact us and we will delete it promptly.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">10. Changes to This Policy</h2>
                        <p>We may update this policy from time to time. If we make material changes, we will notify you by email or by displaying a notice in the app before the change takes effect. The &ldquo;Last updated&rdquo; date at the top of this page will always reflect the current version.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">11. Contact</h2>
                        <p>
                            Questions about this policy?{' '}
                            <a href="mailto:picknpartner@gmail.com" className="text-white underline underline-offset-2">
                                picknpartner@gmail.com
                            </a>
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-zinc-800/50 flex flex-wrap gap-4 text-xs text-zinc-600">
                    <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
                    <span>·</span>
                    <Link href="/" className="hover:text-zinc-400 transition-colors">Back to Alfred</Link>
                </div>
            </div>
        </div>
    );
}
