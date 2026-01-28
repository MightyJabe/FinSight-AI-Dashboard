'use client';

import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  Calendar,
  Clock,
  DollarSign,
  Landmark,
  Lightbulb,
  PiggyBank,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

import { Skeleton } from '@/components/common/SkeletonLoader';
import { type RetirementInputs,useRetirement } from '@/hooks/use-retirement';
import type {
  RetirementProjection,
  RetirementRecommendation,
} from '@/lib/services/israeli-retirement-calculator';
import { cn, formatCurrency } from '@/lib/utils';

// Readiness score thresholds
const READINESS_COLORS = {
  excellent: { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Excellent' },
  good: { bg: 'bg-teal-500', text: 'text-teal-400', label: 'Good' },
  fair: { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Fair' },
  poor: { bg: 'bg-rose-500', text: 'text-rose-400', label: 'Needs Work' },
};

function getReadinessColor(score: number) {
  if (score >= 90) return READINESS_COLORS.excellent;
  if (score >= 70) return READINESS_COLORS.good;
  if (score >= 50) return READINESS_COLORS.fair;
  return READINESS_COLORS.poor;
}

function InputForm({
  onCalculate,
  isCalculating,
  savedSettings,
}: {
  onCalculate: (inputs: RetirementInputs) => void;
  isCalculating: boolean;
  savedSettings: Partial<RetirementInputs> | null;
}) {
  const [formData, setFormData] = useState<RetirementInputs>({
    currentAge: savedSettings?.currentAge || 35,
    gender: savedSettings?.gender || 'male',
    currentSalary: savedSettings?.currentSalary || 15000,
    yearsWorked: savedSettings?.yearsWorked || 10,
    desiredMonthlyIncome: savedSettings?.desiredMonthlyIncome || 12000,
    earlyRetirement: savedSettings?.earlyRetirement || false,
    expectedReturnRate: 5,
    inflationRate: 2.5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const updateField = <K extends keyof RetirementInputs>(
    field: K,
    value: RetirementInputs[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Details */}
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800/50">
        <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-amber-400" />
          Personal Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-neutral-400 text-sm font-medium mb-2">
              Current Age
            </label>
            <input
              type="number"
              min={18}
              max={80}
              value={formData.currentAge}
              onChange={(e) => updateField('currentAge', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-neutral-400 text-sm font-medium mb-2">
              Gender
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateField('gender', 'male')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  formData.gender === 'male'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50 hover:text-white'
                )}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => updateField('gender', 'female')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  formData.gender === 'female'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50 hover:text-white'
                )}
              >
                Female
              </button>
            </div>
          </div>
          <div>
            <label className="block text-neutral-400 text-sm font-medium mb-2">
              Years Worked
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={formData.yearsWorked}
              onChange={(e) => updateField('yearsWorked', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="earlyRetirement"
              checked={formData.earlyRetirement}
              onChange={(e) => updateField('earlyRetirement', e.target.checked)}
              className="w-5 h-5 rounded bg-neutral-800 border-neutral-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900"
            />
            <label htmlFor="earlyRetirement" className="text-neutral-300 text-sm">
              Plan for Early Retirement (age 60)
            </label>
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800/50">
        <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-400" />
          Financial Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-neutral-400 text-sm font-medium mb-2">
              Current Monthly Salary (ILS)
            </label>
            <input
              type="number"
              min={0}
              value={formData.currentSalary}
              onChange={(e) => updateField('currentSalary', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-neutral-400 text-sm font-medium mb-2">
              Desired Monthly Income at Retirement (ILS)
            </label>
            <input
              type="number"
              min={0}
              value={formData.desiredMonthlyIncome}
              onChange={(e) => updateField('desiredMonthlyIncome', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isCalculating}
        className={cn(
          'w-full flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-semibold transition-all duration-300',
          'bg-gradient-to-r from-amber-600 to-orange-600 text-white',
          'hover:from-amber-500 hover:to-orange-500 hover:scale-[1.02] active:scale-100',
          'shadow-xl shadow-amber-900/30 hover:shadow-2xl hover:shadow-amber-900/40',
          'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100'
        )}
      >
        <Calculator className={cn('w-5 h-5', isCalculating && 'animate-spin')} />
        {isCalculating ? 'Calculating...' : 'Calculate Retirement'}
      </button>
    </form>
  );
}

function ReadinessGauge({ score }: { score: number }) {
  const colors = getReadinessColor(score);

  return (
    <div className="relative w-48 h-24 mx-auto">
      {/* Background arc */}
      <svg className="w-full h-full" viewBox="0 0 200 100">
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          className="text-neutral-800"
        />
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke="url(#readinessGradient)"
          strokeWidth="20"
          strokeDasharray={`${(score / 100) * 283} 283`}
        />
        <defs>
          <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      {/* Score display */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <p className={cn('text-4xl font-bold', colors.text)}>{score}%</p>
        <p className="text-neutral-400 text-sm">{colors.label}</p>
      </div>
    </div>
  );
}

function ProjectionHero({
  projection,
  onReset,
}: {
  projection: RetirementProjection;
  onReset: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-950 via-orange-900 to-red-950 p-10 lg:p-14">
      {/* Decorative glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full blur-[120px]',
            projection.readinessScore >= 70 ? 'bg-emerald-500/30' : 'bg-amber-500/30'
          )}
        />
        <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <p className="text-amber-300/80 text-sm font-semibold uppercase tracking-[0.2em]">
                Retirement Readiness
              </p>
              <button
                onClick={onReset}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <ReadinessGauge score={projection.readinessScore} />

            {/* Key stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2 text-amber-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Retirement Age
                </div>
                <p className="text-white text-xl font-bold">{projection.retirementAge}</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2 text-amber-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Years Left
                </div>
                <p className="text-white text-xl font-bold">{projection.yearsToRetirement}</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2 text-amber-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Monthly Income
                </div>
                <p className="text-white text-xl font-bold">
                  {formatCurrency(projection.totalMonthlyIncome, 'ILS')}
                </p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2 text-amber-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Years of Income
                </div>
                <p className="text-white text-xl font-bold">
                  {projection.yearsOfIncome > 50 ? '50+' : projection.yearsOfIncome}
                </p>
              </div>
            </div>
          </div>

          {/* Income breakdown */}
          <div className="lg:w-80 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-amber-400" />
              Projected Monthly Income
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Pension Funds</span>
                <span className="text-white font-medium">
                  {formatCurrency(projection.monthlyPensionIncome, 'ILS')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Bituach Leumi</span>
                <span className="text-white font-medium">
                  {formatCurrency(projection.monthlyBituachLeumi, 'ILS')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Savings</span>
                <span className="text-white font-medium">
                  {formatCurrency(projection.monthlyFromSavings, 'ILS')}
                </span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-white font-semibold">Total</span>
                <span className="text-amber-400 font-bold text-lg">
                  {formatCurrency(projection.totalMonthlyIncome, 'ILS')}
                </span>
              </div>
              {projection.incomeGap > 0 && (
                <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg px-3 py-2 mt-2">
                  <p className="text-rose-300 text-sm">
                    Gap: {formatCurrency(projection.incomeGap, 'ILS')}/month
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectedValueCards({ projection }: { projection: RetirementProjection }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Landmark className="w-5 h-5 text-amber-400" />
          </div>
          <h4 className="text-neutral-400 text-sm font-medium">Pension Funds</h4>
        </div>
        <p className="text-white text-2xl font-bold mb-1">
          {formatCurrency(projection.projectedPensionValue, 'ILS')}
        </p>
        <p className="text-neutral-500 text-xs">Projected at retirement</p>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <PiggyBank className="w-5 h-5 text-emerald-400" />
          </div>
          <h4 className="text-neutral-400 text-sm font-medium">Additional Savings</h4>
        </div>
        <p className="text-white text-2xl font-bold mb-1">
          {formatCurrency(projection.projectedSavingsValue, 'ILS')}
        </p>
        <p className="text-neutral-500 text-xs">Projected at retirement</p>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <h4 className="text-neutral-400 text-sm font-medium">Total Net Worth</h4>
        </div>
        <p className="text-white text-2xl font-bold mb-1">
          {formatCurrency(projection.totalProjectedValue, 'ILS')}
        </p>
        <p className="text-neutral-500 text-xs">At retirement</p>
      </div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: RetirementRecommendation }) {
  const [expanded, setExpanded] = useState(false);

  const impactColors = {
    high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-neutral-800/50">
      <div
        className="p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Lightbulb className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                  impactColors[rec.impact]
                )}
              >
                {rec.impact} impact
              </span>
            </div>
            <h4 className="text-white font-semibold text-lg mb-2">{rec.title}</h4>
            <p className="text-neutral-400 text-sm">{rec.description}</p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 border-t border-neutral-800/50 pt-4">
          <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mb-3">
            Action Steps:
          </p>
          <div className="space-y-2">
            {rec.actionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 px-3 py-2 rounded-lg bg-neutral-800/50"
              >
                <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-12 lg:p-16 text-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/20 mb-8">
          <Calculator className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-3xl lg:text-4xl font-display text-white tracking-tight mb-5">
          Plan Your Retirement
        </h2>
        <p className="text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
          Calculate your retirement readiness with Israeli-specific pension projections, Bituach
          Leumi estimates, and personalized recommendations.
        </p>
      </div>
    </div>
  );
}

export default function RetirementPage() {
  const {
    savedSettings,
    pensionFunds,
    projection,
    recommendations,
    isLoading,
    isCalculating,
    error,
    calculate,
    reset,
  } = useRetirement();

  const hasProjection = projection !== null;

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display text-white tracking-tight mb-2">
              Retirement Calculator
            </h1>
            <p className="text-neutral-400">
              Israeli-specific pension planning with Bituach Leumi projections
            </p>
          </div>
          {pensionFunds && (
            <div className="hidden md:block text-right">
              <p className="text-neutral-400 text-sm">Pension Funds Connected</p>
              <p className="text-white font-semibold">
                {pensionFunds.count} funds ({formatCurrency(pensionFunds.totalValue, 'ILS')})
              </p>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-80 rounded-2xl bg-neutral-800/50" />
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="h-32 rounded-2xl bg-neutral-800/50" />
              <Skeleton className="h-32 rounded-2xl bg-neutral-800/50" />
              <Skeleton className="h-32 rounded-2xl bg-neutral-800/50" />
            </div>
          </div>
        ) : hasProjection ? (
          <div className="space-y-8">
            {/* Projection Hero */}
            <ProjectionHero projection={projection} onReset={reset} />

            {/* Value cards */}
            <ProjectedValueCards projection={projection} />

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Recommendations
                </h2>
                <div className="grid gap-4">
                  {recommendations.map((rec) => (
                    <RecommendationCard key={rec.id} rec={rec} />
                  ))}
                </div>
              </div>
            )}

            {/* Monthly saving recommendation */}
            {projection.recommendedMonthlySaving > 0 && (
              <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 backdrop-blur-sm rounded-2xl p-6 border border-amber-800/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-amber-300 font-semibold">Close the Gap</h3>
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  To reach your desired retirement income, consider saving an additional{' '}
                  <span className="text-amber-400 font-semibold">
                    {formatCurrency(projection.recommendedMonthlySaving, 'ILS')}
                  </span>{' '}
                  per month. This will help close the income gap of{' '}
                  {formatCurrency(projection.incomeGap, 'ILS')}/month.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EmptyState />
            <InputForm
              onCalculate={calculate}
              isCalculating={isCalculating}
              savedSettings={savedSettings}
            />
          </div>
        )}
      </div>
    </div>
  );
}
