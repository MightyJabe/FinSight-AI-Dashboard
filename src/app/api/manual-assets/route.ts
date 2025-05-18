import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const snapshot = await db.collection('users').doc(userId).collection('manualAssets').get();
    const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching manual assets:', error);
    return NextResponse.json({ error: 'Failed to fetch manual assets' }, { status: 500 });
  }
}

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
    const { name, amount, type, description } = body;

    if (!name || !amount || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assetData = {
      name,
      amount: parseFloat(amount),
      type,
      description: description || '',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db
      .collection('users')
      .doc(userId)
      .collection('manualAssets')
      .add(assetData);

    return NextResponse.json({ id: docRef.id, ...assetData });
  } catch (error) {
    console.error('Error adding manual asset:', error);
    return NextResponse.json({ error: 'Failed to add manual asset' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('id');

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    await db.collection('users').doc(userId).collection('manualAssets').doc(assetId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manual asset:', error);
    return NextResponse.json({ error: 'Failed to delete manual asset' }, { status: 500 });
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
    const assetId = searchParams.get('id');
    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, amount, type, description } = body;
    if (!name || !amount || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assetData = {
      name,
      amount: parseFloat(amount),
      type,
      description: description || '',
    };

    await db
      .collection('users')
      .doc(userId)
      .collection('manualAssets')
      .doc(assetId)
      .update(assetData);

    return NextResponse.json({ id: assetId, ...assetData });
  } catch (error) {
    console.error('Error updating manual asset:', error);
    return NextResponse.json({ error: 'Failed to update manual asset' }, { status: 500 });
  }
}
