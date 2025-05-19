import { NextResponse } from 'next/server';

import { auth, db } from '@/lib/firebase-admin';

/**
 *
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualTransactions')
      .orderBy('date', 'desc')
      .get();
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching manual transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch manual transactions' }, { status: 500 });
  }
}

/**
 *
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { type, amount, category, date, recurrence, description } = body;
    if (!type || !amount || !category || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const txnData = {
      type, // 'expense' or 'income'
      amount: parseFloat(amount),
      category,
      date,
      recurrence: recurrence || 'none', // 'none', 'weekly', 'monthly', 'yearly'
      description: description || '',
      createdAt: new Date().toISOString(),
    };
    const docRef = await db
      .collection('users')
      .doc(userId)
      .collection('manualTransactions')
      .add(txnData);
    return NextResponse.json({ id: docRef.id, ...txnData });
  } catch (error) {
    console.error('Error adding manual transaction:', error);
    return NextResponse.json({ error: 'Failed to add manual transaction' }, { status: 500 });
  }
}

/**
 *
 */
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const txnId = searchParams.get('id');
    if (!txnId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { type, amount, category, date, recurrence, description } = body;
    if (!type || !amount || !category || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const txnData = {
      type,
      amount: parseFloat(amount),
      category,
      date,
      recurrence: recurrence || 'none',
      description: description || '',
    };

    await db
      .collection('users')
      .doc(userId)
      .collection('manualTransactions')
      .doc(txnId)
      .update(txnData);

    return NextResponse.json({ id: txnId, ...txnData });
  } catch (error) {
    console.error('Error updating manual transaction:', error);
    return NextResponse.json({ error: 'Failed to update manual transaction' }, { status: 500 });
  }
}
