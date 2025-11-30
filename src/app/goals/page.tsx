'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiTarget, FiTrash2 } from 'react-icons/fi';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { useSession } from '@/components/providers/SessionProvider';
import { Button, Card, CardContent, EmptyState } from '@/components/ui';
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

  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Financial Goals</h1>
              <p className="text-gray-600">Track your progress toward financial milestones</p>
            </div>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<FiPlus className="w-5 h-5" />}
              onClick={() => setShowForm(true)}
            >
              Add Goal
            </Button>
          </div>

          {goals.length === 0 ? (
            <Card variant="elevated" className="max-w-md mx-auto mt-20">
              <CardContent className="py-12">
                <EmptyState
                  icon={<FiTarget className="w-16 h-16" />}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {goals.map(goal => {
                const progress = getProgress(goal);
                const monthsLeft = getMonthsRemaining(goal.deadline);
                const suggested = getSuggestedMonthly(goal);

                return (
                  <Card key={goal.id} variant="elevated" hover>
                    <CardContent>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{goal.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {goalTypeLabels[goal.type]}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${priorityColors[goal.priority]}`}
                            >
                              {goal.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingGoal(goal);
                              setShowForm(true);
                            }}
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(goal.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(goal.currentAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(goal.targetAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Deadline</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Months remaining</span>
                          <span className="text-gray-900 dark:text-white">{monthsLeft}</span>
                        </div>
                        {progress < 100 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Suggested monthly
                            </span>
                            <span className="font-medium text-blue-600">
                              {formatCurrency(suggested)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {goal ? 'Edit Goal' : 'Create New Goal'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as Goal['type'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Amount
              </label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={e =>
                  setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Amount
              </label>
              <input
                type="number"
                value={formData.currentAmount}
                onChange={e =>
                  setFormData({ ...formData, currentAmount: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={e =>
                setFormData({ ...formData, priority: e.target.value as Goal['priority'] })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {goal ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
