'use client';

import { Edit2, Plus, Target, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { useSession } from '@/components/providers/SessionProvider';
import { Button, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';

interface Goal {
  id: string;
  name: string;
  type:
    | 'emergency_fund'
    | 'home'
    | 'vacation'
    | 'car'
    | 'debt_payoff'
    | 'retirement'
    | 'education'
    | 'other';
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlyContribution?: number;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export default function GoalsPage() {
  const { firebaseUser } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  const fetchGoals = async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/goals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal?')) return;
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success('Goal deleted');
        fetchGoals();
      }
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const getProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getMonthsRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const months = Math.max(
      0,
      Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    return months;
  };

  const getSuggestedMonthly = (goal: Goal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const months = getMonthsRemaining(goal.deadline);
    return months > 0 ? remaining / months : 0;
  };

  const goalTypeLabels: Record<Goal['type'], string> = {
    emergency_fund: 'Emergency Fund',
    home: 'Home Purchase',
    vacation: 'Vacation',
    car: 'Car Purchase',
    debt_payoff: 'Debt Payoff',
    retirement: 'Retirement',
    education: 'Education',
    other: 'Other',
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          {/* Header */}
          <header className="mb-10 animate-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Savings & Planning</p>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight gradient-text">
                  Financial Goals
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Track your progress toward financial milestones
                </p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                variant="default"
                size="default"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Add Goal</span>
              </Button>
            </div>
          </header>

          {goals.length === 0 ? (
            <div className="max-w-md mx-auto mt-20">
              <EmptyState
                variant="card"
                icon={<Target className="w-16 h-16" />}
                title="No goals yet"
                description="Start by creating your first financial goal and track your progress toward financial milestones"
                action={{
                  label: 'Create Your First Goal',
                  onClick: () => setShowForm(true),
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in delay-75">
              {goals.map(goal => {
                const progress = getProgress(goal);
                const monthsLeft = getMonthsRemaining(goal.deadline);
                const suggested = getSuggestedMonthly(goal);

                return (
                  <div
                    key={goal.id}
                    className="rounded-2xl glass-card-strong p-6 hover:scale-[1.01] transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1 gradient-text">
                          {goal.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {goalTypeLabels[goal.type]}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm',
                              goal.priority === 'high' &&
                                'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30',
                              goal.priority === 'medium' &&
                                'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30',
                              goal.priority === 'low' &&
                                'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            )}
                          >
                            {goal.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setShowForm(true);
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 transition-all duration-200 hover:scale-110"
                          aria-label="Edit goal"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-200 hover:scale-110"
                          aria-label="Delete goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold gradient-text">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 dark:bg-slate-800/30 rounded-full h-3 backdrop-blur-sm overflow-hidden border border-white/20">
                        <div
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 shadow-lg glow-lg"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="rounded-xl bg-blue-500/10 dark:bg-blue-500/5 p-3 border border-blue-500/20">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Current</p>
                        <p className="text-lg font-bold text-foreground tabular-nums">
                          {formatCurrency(goal.currentAmount)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-purple-500/10 dark:bg-purple-500/5 p-3 border border-purple-500/20">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Target</p>
                        <p className="text-lg font-bold text-foreground tabular-nums">
                          {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 dark:border-slate-700/50 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Deadline</span>
                        <span className="text-foreground font-semibold">
                          {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Months remaining</span>
                        <span className="text-foreground font-semibold">{monthsLeft}</span>
                      </div>
                      {progress < 100 && (
                        <div className="flex justify-between text-sm mt-3 pt-3 border-t border-dashed border-white/10 dark:border-slate-700/50">
                          <span className="text-muted-foreground font-medium">Suggested monthly</span>
                          <span className="font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                            {formatCurrency(suggested)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showForm && (
            <GoalForm
              goal={editingGoal}
              onClose={() => {
                setShowForm(false);
                setEditingGoal(null);
              }}
              onSuccess={() => {
                setShowForm(false);
                setEditingGoal(null);
                fetchGoals();
              }}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

function GoalForm({
  goal,
  onClose,
  onSuccess,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { firebaseUser } = useSession();
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    type: goal?.type || 'other',
    targetAmount: goal?.targetAmount || 0,
    currentAmount: goal?.currentAmount || 0,
    deadline: goal?.deadline || '',
    priority: goal?.priority || 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await firebaseUser?.getIdToken();
      const url = goal ? `/api/goals/${goal.id}` : '/api/goals';
      const method = goal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(goal ? 'Goal updated' : 'Goal created');
        onSuccess();
      } else {
        toast.error('Failed to save goal');
      }
    } catch {
      toast.error('Error saving goal');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="glass-card-strong rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-200 hover:scale-110"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Goal Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-blue-500/30 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="e.g., Emergency Fund"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as Goal['type'] })}
              className="w-full px-4 py-3 border border-blue-500/30 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            >
              <option value="emergency_fund">Emergency Fund</option>
              <option value="home">Home Purchase</option>
              <option value="vacation">Vacation</option>
              <option value="car">Car Purchase</option>
              <option value="debt_payoff">Debt Payoff</option>
              <option value="retirement">Retirement</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Target Amount
              </label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={e =>
                  setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="10000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Current Amount
              </label>
              <input
                type="number"
                value={formData.currentAmount}
                onChange={e =>
                  setFormData({ ...formData, currentAmount: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="2500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-3 border border-blue-500/30 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={e =>
                setFormData({ ...formData, priority: e.target.value as Goal['priority'] })
              }
              className="w-full px-4 py-3 border border-blue-500/30 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t border-white/10 dark:border-slate-700/50">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="default"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="default"
            >
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
