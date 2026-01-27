'use client';

import { BookOpen, ChevronDown, ChevronRight, Mail, MessageCircle, Video } from 'lucide-react';
import { useState } from 'react';

/**
 *
 */
export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I connect my bank account?',
      answer:
        "Go to 'Accounts & Balances' and click 'Connect Bank Account'. We use Plaid to securely connect to your bank. You'll be redirected to your bank's login page to authorize the connection.",
    },
    {
      question: 'Is my financial data secure?',
      answer:
        'Yes! We use bank-level security with Plaid for connections and Firebase for authentication. Your data is encrypted and we never store your bank credentials.',
    },
    {
      question: 'How often does my data sync?',
      answer:
        'Bank account data syncs automatically every day. You can also manually refresh your data from the accounts page or insights page.',
    },
    {
      question: "Can I add accounts that aren't connected to a bank?",
      answer:
        "Yes! Use 'Add Data' to manually enter cash, investments, or other assets that aren't connected to a bank account.",
    },
    {
      question: 'How do the AI insights work?',
      answer:
        'Our AI analyzes your spending patterns, account balances, and financial goals to provide personalized recommendations for saving money and improving your financial health.',
    },
    {
      question: 'What if I see incorrect data?',
      answer:
        "If you notice incorrect transactions or balances, try refreshing your data first. For persistent issues, you can manually edit or add corrections through the 'Add Data' section.",
    },
  ];

  const gettingStartedSteps = [
    {
      title: 'Create Your Account',
      description: 'Sign up with your email and create a secure password.',
      icon: '1',
    },
    {
      title: 'Connect Your Bank',
      description: 'Link your bank accounts to automatically import transactions and balances.',
      icon: '2',
    },
    {
      title: 'Add Other Assets',
      description: 'Manually add cash, investments, or other financial accounts.',
      icon: '3',
    },
    {
      title: 'Review Your Overview',
      description: 'Check your dashboard to see your net worth and financial summary.',
      icon: '4',
    },
    {
      title: 'Get AI Insights',
      description: 'Visit the AI Insights page for personalized financial recommendations.',
      icon: '5',
    },
  ];

  const supportOptions = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: Mail,
      action: 'Contact Support',
      href: 'mailto:support@finsight.ai',
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: MessageCircle,
      action: 'Start Chat',
      href: '#',
    },
    {
      title: 'Documentation',
      description: 'Browse our detailed guides',
      icon: BookOpen,
      action: 'View Docs',
      href: '#',
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step tutorials',
      icon: Video,
      action: 'Watch Videos',
      href: '#',
    },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display gradient-text tracking-tight">Help & Support</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Get help with using FinSight AI and find answers to common questions.
          </p>
        </div>

        {/* Getting Started */}
        <div className="glass-card-strong rounded-2xl border border-border mb-6 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold gradient-text">Getting Started</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {gettingStartedSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 group/step">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-base font-bold shadow-lg glow-md group-hover/step:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover/step:gradient-text transition-all">{step.title}</h3>
                    <p className="text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="glass-card-strong rounded-2xl border border-border mb-6 hover:border-purple-500/30 transition-all duration-300">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold gradient-text">Frequently Asked Questions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="glass-card rounded-xl overflow-hidden border border-border hover:border-blue-500/30 transition-all duration-200 group/faq">
                  <button
                    className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-secondary/30 transition-colors"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-semibold text-foreground group-hover/faq:text-blue-600 dark:group-hover/faq:text-blue-400 transition-colors">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-3" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover/faq:text-blue-600 dark:group-hover/faq:text-blue-400 flex-shrink-0 ml-3 transition-colors" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-4 border-t border-border pt-4 bg-secondary/20">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Support Options */}
        <div className="glass-card-strong rounded-2xl border border-border hover:border-pink-500/30 transition-all duration-300">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold gradient-text">Get Support</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportOptions.map((option, index) => (
                <div
                  key={index}
                  className="glass-card p-5 border border-border rounded-xl hover:border-blue-500/50 transition-all duration-300 group/support card-hover"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-center group-hover/support:scale-110 group-hover/support:border-blue-500/40 transition-all">
                      <option.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{option.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">{option.description}</p>
                      <a
                        href={option.href}
                        className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-all"
                      >
                        {option.action} →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
