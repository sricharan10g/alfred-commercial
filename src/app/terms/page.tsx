import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Terms of Service — Alfred',
    description: 'Terms governing your use of Alfred, including subscription, refunds, and acceptable use.',
};

export default function TermsPage() {
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

                <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
                <p className="text-sm text-zinc-500 mb-12">Last updated: April 3, 2026</p>

                <div className="space-y-10 text-sm leading-relaxed">

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">1. Agreement</h2>
                        <p>
                            By creating an account or using Alfred (&ldquo;the Service&rdquo;), operated by <strong className="text-zinc-200">PickAndPartner</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), you agree to these Terms of Service. If you do not agree, do not use the Service.
                        </p>
                        <p className="mt-3">
                            Questions? Email us at{' '}
                            <a href="mailto:picknpartner@gmail.com" className="text-white underline underline-offset-2">
                                picknpartner@gmail.com
                            </a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">2. Eligibility</h2>
                        <p>You must be at least <strong className="text-zinc-200">16 years old</strong> to use Alfred. By using the Service, you represent that you meet this age requirement. If you are using Alfred on behalf of a company or other legal entity, you represent that you have authority to bind that entity to these Terms.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">3. Your Account</h2>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                            <li>You must provide accurate information when creating your account.</li>
                            <li>You are responsible for all activity that occurs under your account.</li>
                            <li>Notify us immediately at <a href="mailto:picknpartner@gmail.com" className="text-zinc-300 underline underline-offset-2">picknpartner@gmail.com</a> if you suspect unauthorized access.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">4. Subscriptions &amp; Billing</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Plans</h3>
                                <p>Alfred offers free and paid subscription plans. Paid plans are billed monthly in advance via <strong className="text-zinc-200">Dodo Payments</strong>. Current pricing is displayed on the upgrade screen within the app.</p>
                            </div>
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Auto-renewal</h3>
                                <p>Paid subscriptions renew automatically at the end of each billing period unless you cancel before the renewal date.</p>
                            </div>
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Cancellation</h3>
                                <p>You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period — you retain access to paid features until then.</p>
                            </div>
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Refunds</h3>
                                <p>We offer a <strong className="text-zinc-200">7-day refund</strong> on your first payment if you are unsatisfied with the Service. After 7 days, or on any subsequent billing cycle, payments are non-refundable. To request a refund within the eligible window, email <a href="mailto:picknpartner@gmail.com" className="text-zinc-300 underline underline-offset-2">picknpartner@gmail.com</a> with your account email and reason.</p>
                            </div>
                            <div>
                                <h3 className="text-zinc-200 font-medium mb-1">Price changes</h3>
                                <p>We reserve the right to change subscription prices. We will give you at least <strong className="text-zinc-200">30 days&apos; notice</strong> before a price change takes effect for your account.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">5. Acceptable Use Policy</h2>
                        <p className="mb-3">You agree <strong className="text-zinc-200">not</strong> to use Alfred to:</p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li>Generate content that is illegal, fraudulent, threatening, defamatory, or that infringes third-party intellectual property rights.</li>
                            <li>Create spam, phishing messages, or deceptive content at scale.</li>
                            <li>Generate content that sexualizes minors.</li>
                            <li>Spread deliberate disinformation or propaganda.</li>
                            <li>Circumvent rate limits, scrape the Service, or attempt to reverse-engineer our systems.</li>
                            <li>Resell or sublicense access to the Service without our written permission.</li>
                            <li>Violate any applicable law or regulation.</li>
                        </ul>
                        <p className="mt-3">Violation of this Acceptable Use Policy may result in immediate suspension or termination of your account without refund.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">6. AI-Generated Content</h2>
                        <div className="space-y-3">
                            <p>Alfred uses third-party AI models (Anthropic Claude, OpenAI GPT, Google Gemini) to generate text. You understand and agree that:</p>
                            <ul className="list-disc list-inside space-y-2 text-zinc-400">
                                <li>AI-generated content may be inaccurate, incomplete, or biased. Always review output before publishing.</li>
                                <li>We do not guarantee that AI output is original or free of third-party intellectual property. You are responsible for ensuring your use of generated content complies with applicable law.</li>
                                <li>You own the content you input and, subject to these Terms, the output generated for you. We do not claim ownership of your generated content.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">7. Intellectual Property</h2>
                        <p>The Alfred name, logo, design, and underlying software are the intellectual property of PickAndPartner. Nothing in these Terms grants you a right to use our trademarks or branding without our prior written consent.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">8. Disclaimer of Warranties</h2>
                        <p className="text-zinc-400">
                            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT AI OUTPUT WILL MEET YOUR REQUIREMENTS.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">9. Limitation of Liability</h2>
                        <p className="text-zinc-400">
                            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, PICKANDPARTNER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF, OR INABILITY TO USE, THE SERVICE. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE <strong className="text-zinc-300">12 MONTHS</strong> PRECEDING THE CLAIM.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">10. Indemnification</h2>
                        <p>You agree to indemnify and hold harmless PickAndPartner and its officers, employees, and agents from any claims, damages, or expenses arising from your violation of these Terms or your use of the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">11. Termination</h2>
                        <p>We may suspend or terminate your account at any time if you breach these Terms. You may delete your account at any time via the Settings page. Upon termination, your right to use the Service ceases immediately.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">12. Dispute Resolution</h2>
                        <p>
                            If you have a concern or dispute, please contact us first at{' '}
                            <a href="mailto:picknpartner@gmail.com" className="text-white underline underline-offset-2">picknpartner@gmail.com</a>{' '}
                            so we can try to resolve it informally. We will make a good-faith effort to address any issue within 30 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">13. Changes to These Terms</h2>
                        <p>We may update these Terms. If we make material changes, we will notify you by email or in-app notice at least <strong className="text-zinc-200">14 days</strong> before the new Terms take effect. Continued use of the Service after that date constitutes your acceptance of the updated Terms.</p>
                    </section>

                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-zinc-800/50 flex flex-wrap gap-4 text-xs text-zinc-600">
                    <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
                    <span>·</span>
                    <Link href="/" className="hover:text-zinc-400 transition-colors">Back to Alfred</Link>
                </div>
            </div>
        </div>
    );
}
