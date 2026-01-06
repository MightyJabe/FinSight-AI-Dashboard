'use client';

import {
  ArrowRight,
  BarChart3,
  Bell,
  ChevronRight,
  CreditCard,
  Lock,
  PieChart,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/components/providers/SessionProvider';

export default function Home() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-32">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 animate-in">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                AI-Powered Financial Intelligence
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground mb-6 animate-in delay-75">
              Your finances,{' '}
              <span className="font-display italic text-emerald-600 dark:text-emerald-400">
                simplified
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in delay-150">
              Connect all your accounts in one place. Get AI-powered insights, track spending,
              and build wealth with intelligent recommendations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in delay-225">
              <Link href="/signup">
                <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background rounded-full text-base font-medium hover:opacity-90 transition-opacity shadow-lg">
                  Start for Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-secondary text-foreground rounded-full text-base font-medium hover:bg-muted transition-colors border border-border">
                  Sign In
                </button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground animate-in delay-300">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Bank-level security</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Real-time sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Smart alerts</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-20 max-w-5xl mx-auto animate-in delay-375">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-transparent to-violet-500/20 rounded-3xl blur-2xl" />

              {/* Dashboard preview card */}
              <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
                {/* Mock header bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                      app.finsight.ai/dashboard
                    </div>
                  </div>
                </div>

                {/* Mock dashboard content */}
                <div className="p-6 bg-gradient-to-b from-card to-secondary/30">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="col-span-2 p-6 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800">
                      <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Net Worth</p>
                      <p className="text-3xl font-display text-white">$127,450.82</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-emerald-400 text-sm">+5.2%</span>
                        <span className="text-neutral-500 text-sm">this month</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Income</p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">$12,500</p>
                      </div>
                      <div className="p-4 rounded-xl bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Expenses</p>
                        <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">$7,850</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {[40, 55, 45, 60, 52, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                      <div key={i} className="flex-1 flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-500/50 to-emerald-400 rounded-t"
                          style={{ height: `${h}px` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Everything you need to manage money
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features to help you track, analyze, and grow your wealth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">All Accounts, One View</h3>
              <p className="text-muted-foreground">
                Connect bank accounts, credit cards, investments, and crypto in one unified dashboard.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-violet-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Insights</h3>
              <p className="text-muted-foreground">
                Get personalized recommendations and predictions powered by advanced AI analysis.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Smart Categorization</h3>
              <p className="text-muted-foreground">
                Transactions are automatically categorized with AI, so you always know where money goes.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Investment Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your portfolio performance with real-time data and historical analysis.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-rose-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Spending Analytics</h3>
              <p className="text-muted-foreground">
                Beautiful charts and reports to understand your spending patterns over time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-teal-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Bill Reminders</h3>
              <p className="text-muted-foreground">
                Never miss a payment with smart alerts and upcoming bill notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <p className="text-5xl font-display text-foreground mb-2">10K+</p>
              <p className="text-muted-foreground">Active users</p>
            </div>
            <div>
              <p className="text-5xl font-display text-foreground mb-2">$2B+</p>
              <p className="text-muted-foreground">Assets tracked</p>
            </div>
            <div>
              <p className="text-5xl font-display text-foreground mb-2">99.9%</p>
              <p className="text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-black">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
            Ready to take control of your finances?
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
            Join thousands of users who are already managing their money smarter with FinSight AI.
          </p>
          <Link href="/signup">
            <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-neutral-900 rounded-full text-base font-medium hover:bg-neutral-100 transition-colors shadow-lg">
              Get Started Free
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
          <p className="mt-6 text-sm text-neutral-500">
            No credit card required. Free forever for basic features.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">FinSight AI</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FinSight AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
