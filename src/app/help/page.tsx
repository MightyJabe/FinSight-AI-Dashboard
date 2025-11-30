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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Help & Support</h1>
          <p className="mt-2 text-lg text-gray-600">
            Get help with using FinSight AI and find answers to common questions.
          </p>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6 hover:shadow-xl transition-shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Getting Started</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {gettingStartedSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6 hover:shadow-xl transition-shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-4 pb-3">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Support Options */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Get Support</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportOptions.map((option, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <option.icon className="h-6 w-6 text-primary mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{option.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                      <a
                        href={option.href}
                        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {option.action}
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
