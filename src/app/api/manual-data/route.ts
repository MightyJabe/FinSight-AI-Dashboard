import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase-admin';

/**
 * Get or add manual data
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the type from query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Missing type in query params' }, { status: 400 });
    }

    let collectionName = '';
    switch (type) {
      case 'manualAssets':
        collectionName = `users/${userId}/manualAssets`;
        break;
      case 'manualLiabilities':
        collectionName = `users/${userId}/manualLiabilities`;
        break;
      case 'transactions':
        collectionName = `users/${userId}/transactions`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid data type specified' }, { status: 400 });
    }

    // Get the data from Firestore
    const snapshot = await db.collection(collectionName).orderBy('date', 'desc').get();
    const data = snapshot.docs.map(doc => {
      const docData = doc.data();
      return {
        id: doc.id,
        ...docData,
        date: docData.date?.toDate ? docData.date.toDate().toISOString() : docData.date,
        createdAt: docData.createdAt?.toDate
          ? docData.createdAt.toDate().toISOString()
          : docData.createdAt,
        updatedAt: docData.updatedAt?.toDate
          ? docData.updatedAt.toDate().toISOString()
          : docData.updatedAt,
      };
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching manual data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Add manual data
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data in request body' }, { status: 400 });
    }

    let collectionName = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Data structure is dynamic based on 'type' field
    const preparedData: Record<string, any> = { ...data };

    // Common fields
    const now = new Date();
    preparedData.createdAt = now;
    preparedData.updatedAt = now;
    preparedData.userId = userId;

    // Add type-specific validation
    switch (type) {
      case 'manualAssets':
        collectionName = `users/${userId}/manualAssets`;
        // Validate required fields for assets
        if (!data.name || !data.amount || !data.type) {
          return NextResponse.json(
            { error: 'Missing required fields for asset (name, amount, type)' },
            { status: 400 }
          );
        }
        preparedData.amount = parseFloat(data.amount);
        break;

      case 'manualLiabilities':
        collectionName = `users/${userId}/manualLiabilities`;
        // Validate required fields for liabilities
        if (!data.name || !data.amount || !data.type) {
          return NextResponse.json(
            { error: 'Missing required fields for liability (name, amount, type)' },
            { status: 400 }
          );
        }
        preparedData.amount = parseFloat(data.amount);
        break;

      case 'transactions':
        collectionName = `users/${userId}/transactions`;
        // Validate required fields for transactions
        if (!data.type || !data.amount || !data.category || !data.date || !data.accountId) {
          return NextResponse.json(
            {
              error:
                'Missing required fields for transaction (type, amount, category, date, accountId)',
            },
            { status: 400 }
          );
        }
        preparedData.amount = parseFloat(data.amount);
        preparedData.date = new Date(data.date); // Ensure date is stored as a Date object
        // accountId is already in data, so it will be in preparedData
        break;

      default:
        return NextResponse.json({ error: 'Invalid data type specified' }, { status: 400 });
    }

    // Save the document
    await db.collection(collectionName).add(preparedData);

    return NextResponse.json({
      success: true,
      data: preparedData,
    });
  } catch (error: unknown) {
    console.error('Error adding manual data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
