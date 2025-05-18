import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const snapshot = await db.collection('users').doc(userId).collection('manualLiabilities').get();
    const liabilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ liabilities });
  } catch (error) {
    console.error('Error fetching manual liabilities:', error);
    return NextResponse.json({ error: 'Failed to fetch manual liabilities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { name, amount, type } = await request.json();
    if (!name || typeof amount !== 'number' || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const docRef = await db.collection('users').doc(userId).collection('manualLiabilities').add({
      name,
      amount,
      type,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ id: docRef.id, name, amount, type });
  } catch (error) {
    console.error('Error adding manual liability:', error);
    return NextResponse.json({ error: 'Failed to add manual liability' }, { status: 500 });
  }
}

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
    const liabilityId = searchParams.get('id');
    if (!liabilityId) {
      return NextResponse.json({ error: 'Liability ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, amount, type } = body;
    if (!name || !amount || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const liabilityData = {
      name,
      amount: parseFloat(amount),
      type,
    };

    await db
      .collection('users')
      .doc(userId)
      .collection('manualLiabilities')
      .doc(liabilityId)
      .update(liabilityData);

    return NextResponse.json({ id: liabilityId, ...liabilityData });
  } catch (error) {
    console.error('Error updating manual liability:', error);
    return NextResponse.json({ error: 'Failed to update manual liability' }, { status: 500 });
  }
}
