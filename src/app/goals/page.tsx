'use client';

import { Edit2, Plus, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { useSession } from '@/components/providers/SessionProvider';
import { Card, CardContent, EmptyState } from '@/components/ui';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
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
                <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
                  Financial Goals
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Track your progress toward financial milestones
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full',
                  'bg-foreground text-background text-sm font-medium',
                  'hover:opacity-90 transition-opacity'
                )}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Goal</span>
              </button>
            </div>
          </header>

          {goals.length === 0 ? (
            <Card variant="elevated" className="max-w-md mx-auto mt-20">
              <CardContent className="py-12">
                <EmptyState
                  icon={<Target className="w-16 h-16" />}
                  title="No goals yet"
                  description="Start by creating your first financial goal"
                  action={{
                    label: 'Create Your First Goal',
                    onClick: () => setShowForm(true),
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in delay-75">
              {goals.map(goal => {
                const progress = getProgress(goal);
                const monthsLeft = getMonthsRemaining(goal.deadline);
                const suggested = getSuggestedMonthly(goal);

                return (
                  <div
                    key={goal.id}
                    className="rounded-2xl bg-card border border-border p-6 hover:border-border/80 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">{goal.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {goalTypeLabels[goal.type]}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-1 text-xs rounded-full',
                              goal.priority === 'high' &&
                                'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                              goal.priority === 'medium' &&
                                'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                              goal.priority === 'low' &&
                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
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
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Current</p>
                        <p className="text-lg font-semibold text-foreground tabular-nums">
                          {formatCurrency(goal.currentAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Target</p>
                        <p className="text-lg font-semibold text-foreground tabular-nums">
                          {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className="text-foreground">
                          {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Months remaining</span>
                        <span className="text-foreground">{monthsLeft}</span>
                      </div>
                      {progress < 100 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Suggested monthly</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl animate-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {goal ? 'Edit Goal' : 'Create New Goal'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Goal Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as Goal['type'] })}
              className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
              <label className="block text-sm font-medium text-foreground mb-2">
                Target Amount
              </label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={e =>
                  setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Amount
              </label>
              <input
                type="number"
                value={formData.currentAmount}
                onChange={e =>
                  setFormData({ ...formData, currentAmount: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={e =>
                setFormData({ ...formData, priority: e.target.value as Goal['priority'] })
              }
              className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              {goal ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
