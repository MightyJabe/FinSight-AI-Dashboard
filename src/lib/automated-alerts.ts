import { queryDocToData } from '@/types/firestore';

import { adminDb as db } from './firebase-admin';
import logger from './logger';

export interface Alert {
  id?: string;
  userId: string;
  type:
    | 'unusual_spending'
    | 'bill_due'
    | 'investment_opportunity'
    | 'tax_tip'
    | 'subscription_increase'
    | 'budget_warning';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export async function generateAlerts(userId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Fetch user's transactions and accounts
  const [transactionsSnapshot, , goalsSnapshot] = await Promise.all([
    db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('date', 'desc')
      .limit(100)
      .get(),
    db.collection('users').doc(userId).collection('accounts').get(),
    db.collection('goals').where('userId', '==', userId).get(),
  ]);

  const transactions = transactionsSnapshot.docs.map(doc => queryDocToData(doc));
  const goals = goalsSnapshot.docs.map(doc => queryDocToData(doc));

  // 1. Unusual Spending Detection
  const recentSpending = transactions
    .filter(
      (t: any) =>
        t.type === 'expense' && new Date(t.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    )
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

  const avgWeeklySpending =
    transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) / 12; // Rough average

  if (recentSpending > avgWeeklySpending * 1.5) {
    alerts.push({
      userId,
      type: 'unusual_spending',
      title: 'Unusual Spending Detected',
      message: `Your spending this week ($${recentSpending.toFixed(2)}) is 50% higher than usual. Review your recent transactions.`,
      priority: 'high',
      actionUrl: '/transactions',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Bill Due Reminders (check for recurring transactions)
  const recurringTransactions = transactions.filter((t: any) => t.recurring === true);
  const upcomingBills = recurringTransactions.filter((t: any) => {
    const nextDue = new Date(t.nextDueDate);
    const daysUntilDue = (nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilDue > 0 && daysUntilDue <= 3;
  });

  upcomingBills.forEach((bill: any) => {
    alerts.push({
      userId,
      type: 'bill_due',
      title: 'Bill Due Soon',
      message: `${bill.description} ($${Math.abs(bill.amount).toFixed(2)}) is due in ${Math.ceil((new Date(bill.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days.`,
      priority: 'medium',
      actionUrl: '/transactions',
      read: false,
      createdAt: new Date().toISOString(),
    });
  });

  // 3. Budget Overspending Warnings
  const monthlySpending = transactions
    .filter((t: any) => {
      const txDate = new Date(t.date);
      const now = new Date();
      return (
        t.type === 'expense' &&
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

  // Assume budget of $3000/month (should fetch from user settings)
  const monthlyBudget = 3000;
  if (monthlySpending > monthlyBudget * 0.9) {
    alerts.push({
      userId,
      type: 'budget_warning',
      title: 'Budget Alert',
      message: `You've spent $${monthlySpending.toFixed(2)} of your $${monthlyBudget} monthly budget (${((monthlySpending / monthlyBudget) * 100).toFixed(0)}%).`,
      priority: monthlySpending > monthlyBudget ? 'high' : 'medium',
      actionUrl: '/dashboard',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Goal Progress Alerts
  goals.forEach((goal: any) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const monthsLeft = Math.ceil(
      (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (progress >= 100) {
      alerts.push({
        userId,
        type: 'investment_opportunity',
        title: 'Goal Achieved! 🎉',
        message: `Congratulations! You've reached your goal: ${goal.name}`,
        priority: 'low',
        actionUrl: '/goals',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } else if (monthsLeft <= 1 && progress < 80) {
      alerts.push({
        userId,
        type: 'budget_warning',
        title: 'Goal Deadline Approaching',
        message: `Your goal "${goal.name}" is due soon but only ${progress.toFixed(0)}% complete. Consider increasing contributions.`,
        priority: 'high',
        actionUrl: '/goals',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // 5. Tax Optimization Tips (simple example)
  const taxDeductibleExpenses = transactions.filter(
    (t: any) => t.category && ['Medical', 'Charity', 'Business'].includes(t.category)
  );

  if (taxDeductibleExpenses.length > 5) {
    alerts.push({
      userId,
      type: 'tax_tip',
      title: 'Tax Deduction Opportunity',
      message: `You have ${taxDeductibleExpenses.length} potentially tax-deductible expenses. Review them in the Tax Intelligence page.`,
      priority: 'medium',
      actionUrl: '/tax',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  const batch = db.batch();

  alerts.forEach(alert => {
    const docRef = db.collection('alerts').doc();
    batch.set(docRef, alert);
  });

  await batch.commit();
}

export async function getUserAlerts(userId: string, unreadOnly = false): Promise<Alert[]> {
  try {
    let query = db.collection('alerts').where('userId', '==', userId);

    if (unreadOnly) {
      query = query.where('read', '==', false) as any;
    }

    const snapshot = await query.get();
    const alerts = snapshot.docs.map(doc => queryDocToData<Alert>(doc));

    // Sort in memory instead of using Firestore orderBy (avoids index requirement)
    return alerts
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  } catch (error) {
    logger.error('Error fetching user alerts', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      unreadOnly,
      operation: 'getUserAlerts',
    });
    return [];
  }
}

export async function markAlertAsRead(alertId: string): Promise<void> {
  await db.collection('alerts').doc(alertId).update({ read: true });
}
