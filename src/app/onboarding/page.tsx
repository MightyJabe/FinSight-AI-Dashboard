'use client';

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  type LucideIcon,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';

type StepId = 'welcome' | 'connect' | 'goals' | 'ai' | 'finish';

interface Step {
  id: StepId;
  title: string;
  description: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to FinSight',
    description: 'A quick guided setup to tailor insights to your finances.',
    icon: Sparkles,
  },
  {
    id: 'connect',
    title: 'Connect accounts or use demo data',
    description: 'Link a Plaid sandbox institution or explore with safe demo data.',
    icon: CreditCard,
  },
  {
    id: 'goals',
    title: 'Set your first goal',
    description: 'Tell us what you are aiming for so AI insights stay focused.',
    icon: Target,
  },
  {
    id: 'ai',
    title: 'Tune AI insights',
    description: 'Pick how proactive the assistant should be and preview Pro.',
    icon: Bot,
  },
  {
    id: 'finish',
    title: 'Ready to launch',
    description: 'Review and jump into your dashboard.',
    icon: CheckCircle2,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [useDemoData, setUseDemoData] = useState(false);
  const [goalName, setGoalName] = useState('Build a 3-month emergency fund');
  const [goalTarget, setGoalTarget] = useState('3000');
  const [proactiveInsights, setProactiveInsights] = useState(true);
  const [proTrial, setProTrial] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Prefill onboarding data if it exists
  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await fetch('/api/user/settings');
        if (!res.ok) return;
        const data = await res.json();
        setUseDemoData(Boolean(data.useDemoData));
        if (data.primaryGoal) setGoalName(data.primaryGoal);
        if (data.goalTarget) setGoalTarget(String(data.goalTarget));
        if (data.aiProactive !== undefined) setProactiveInsights(Boolean(data.aiProactive));
        if (data.proTrialRequested !== undefined) setProTrial(Boolean(data.proTrialRequested));
      } catch {
        // ignore
      }
    })();
  }, [user]);

  const progressPercent = useMemo(() => {
    if (steps.length <= 1) return 100;
    return Math.round((currentStep / (steps.length - 1)) * 100);
  }, [currentStep]);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const goNext = () => {
    if (isLastStep) {
      void completeOnboarding();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  const skip = () => router.push('/dashboard');

  const connectAccounts = () => router.push('/accounts');

  const completeOnboarding = async () => {
    try {
      setSaving(true);
      await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingComplete: true,
          useDemoData,
          primaryGoal: goalName,
          goalTarget: goalTarget ? Number(goalTarget) : undefined,
          proTrialRequested: proTrial,
          aiProactive: proactiveInsights,
        }),
      });
    } catch {
      // ignore; non-blocking
    } finally {
      setSaving(false);
      router.push('/dashboard');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="flex items-center gap-3 text-gray-700">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span>Preparing your onboarding...</span>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
              Guided Onboarding
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Get set up in minutes</h1>
            <p className="text-gray-600 mt-2">
              Follow the steps to connect data, set a goal, and personalize AI insights.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={skip}>
            Skip onboarding
          </Button>
        </div>

        <div className="h-2 w-full rounded-full bg-white/60 shadow-inner overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr,0.8fr] items-start">
          <Card className="shadow-xl border border-white/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <step.icon className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">{step.title}</CardTitle>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {step.id === 'welcome' && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <FeatureTile
                      icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                      title="Cash flow clarity"
                      description="Track income, spend, and net savings in one glance."
                    />
                    <FeatureTile
                      icon={<Bot className="h-5 w-5 text-indigo-600" />}
                      title="AI intelligence"
                      description="Personalized insights, weekly summaries, and alerts."
                    />
                    <FeatureTile
                      icon={<ShieldCheck className="h-5 w-5 text-blue-600" />}
                      title="Security first"
                      description="Bank-level encryption, scoped access, and rate limiting."
                    />
                    <FeatureTile
                      icon={<Rocket className="h-5 w-5 text-purple-600" />}
                      title="Fast start"
                      description="Use Plaid sandbox or demo data—no real accounts required."
                    />
                  </div>
                </div>
              )}

              {step.id === 'connect' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-dashed border-blue-200 bg-white/60 p-4">
                    <p className="text-sm text-gray-700 mb-3">
                      Choose how you want to explore FinSight. Sandbox is safe and fast; demo data
                      is instant.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button size="lg" onClick={connectAccounts} leftIcon={<CreditCard />}>
                        Connect with Plaid sandbox
                      </Button>
                      <Button
                        size="lg"
                        variant={useDemoData ? 'success' : 'outline'}
                        onClick={() => setUseDemoData(val => !val)}
                        leftIcon={<Sparkles />}
                      >
                        {useDemoData ? 'Demo data enabled' : 'Try with demo data'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      You can switch to real accounts anytime from Accounts.
                    </p>
                  </div>
                </div>
              )}

              {step.id === 'goals' && (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Setting one clear goal helps the AI prioritize recommendations.
                  </p>
                  <div className="space-y-3">
                    <label className="space-y-1 block">
                      <span className="text-sm text-gray-600">Primary goal</span>
                      <Input
                        value={goalName}
                        onChange={e => setGoalName(e.target.value)}
                        placeholder="Eg. Pay off credit card, build emergency fund"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-sm text-gray-600">Target amount (optional)</span>
                      <Input
                        value={goalTarget}
                        onChange={e => setGoalTarget(e.target.value)}
                        placeholder="5000"
                        type="number"
                        min="0"
                      />
                    </label>
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-sm text-green-800">
                    Tip: We’ll use this to power savings recommendations and alerts when you drift
                    off track.
                  </div>
                </div>
              )}

              {step.id === 'ai' && (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Control how proactive the assistant should be. You can change this later in
                    Settings.
                  </p>
                  <div className="space-y-3">
                    <ToggleRow
                      label="Proactive weekly summaries"
                      description="AI sends spending and cash flow highlights each week."
                      checked={proactiveInsights}
                      onChange={setProactiveInsights}
                    />
                    <ToggleRow
                      label="Enable Pro trial (14 days)"
                      description="Unlock personalized tax tips, subscriptions alerts, and investment nudges."
                      checked={proTrial}
                      onChange={setProTrial}
                    />
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                    Pro trial won’t start billing automatically in this build—use it to validate the
                    flow with early users.
                  </div>
                </div>
              )}

              {step.id === 'finish' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-green-100 bg-green-50 p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">You’re all set</p>
                      <p className="text-sm text-green-700">
                        {useDemoData
                          ? 'We’ll start with demo data so you can explore safely.'
                          : 'Your next step is to connect accounts or add manual assets.'}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      size="lg"
                      variant="primary"
                      onClick={() => router.push('/dashboard')}
                      rightIcon={<ArrowRight />}
                    >
                      Go to dashboard
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push('/insights')}
                      rightIcon={<Sparkles />}
                    >
                      Jump into AI insights
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    You can rerun onboarding anytime from Settings → Onboarding.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-white/60 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
              <p className="text-sm text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {steps.map((s, index) => {
                  const isActive = index === currentStep;
                  const isDone = index < currentStep;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        isActive
                          ? 'border-blue-200 bg-white'
                          : isDone
                            ? 'border-green-100 bg-green-50'
                            : 'border-transparent'
                      }`}
                    >
                      <s.icon
                        className={`h-5 w-5 ${
                          isDone ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{s.title}</p>
                        <p className="text-xs text-gray-600">{s.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={goBack} disabled={currentStep === 0}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={goNext}
                  rightIcon={<ArrowRight />}
                  loading={saving}
                >
                  {isLastStep ? 'Finish' : 'Continue'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
          {icon}
        </div>
        <p className="font-semibold text-gray-900">{title}</p>
      </div>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white/70 p-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </label>
  );
}
