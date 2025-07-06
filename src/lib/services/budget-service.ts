import { db } from '@/lib/firebase-admin';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get user budgets from Firestore
 */
export async function getUserBudgets(userId: string): Promise<{ [category: string]: number }> {
  try {
    const budgetsSnapshot = await db.collection('users').doc(userId).collection('budgets').get();

    const budgets: { [category: string]: number } = {};

    budgetsSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      if (data.category && typeof data.amount === 'number') {
        budgets[data.category] = data.amount;
      }
    });

    // Add default budgets if none exist
    if (Object.keys(budgets).length === 0) {
      return {
        'Food and Drink': 500,
        Transportation: 300,
        Shopping: 200,
        Entertainment: 150,
        Bills: 800,
        Healthcare: 100,
      };
    }

    return budgets;
  } catch (error) {
    console.error('Error fetching user budgets:', error);
    // Return default budgets on error
    return {
      'Food and Drink': 500,
      Transportation: 300,
      Shopping: 200,
      Entertainment: 150,
      Bills: 800,
      Healthcare: 100,
    };
  }
}

/**
 * Set budget for a category
 */
export async function setBudget(
  userId: string,
  category: string,
  amount: number,
  period: 'monthly' | 'weekly' | 'yearly' = 'monthly'
): Promise<void> {
  try {
    await db.collection('users').doc(userId).collection('budgets').doc(category).set(
      {
        category,
        amount,
        period,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error setting budget:', error);
    throw error;
  }
}

/**
 * Get budget for a specific category
 */
export async function getBudgetForCategory(
  userId: string,
  category: string
): Promise<number | null> {
  try {
    const budgetDoc = await db
      .collection('users')
      .doc(userId)
      .collection('budgets')
      .doc(category)
      .get();

    if (budgetDoc.exists) {
      const data = budgetDoc.data();
      return data?.amount || null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching budget for category:', error);
    return null;
  }
}
