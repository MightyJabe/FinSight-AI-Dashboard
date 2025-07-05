import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase-admin';

// Zod schemas for input validation
const manualAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.preprocess(val => parseFloat(String(val)), z.number().finite()),
  type: z.string().min(1, 'Type is required'),
});

const manualLiabilitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.preprocess(val => parseFloat(String(val)), z.number().finite()),
  type: z.string().min(1, 'Type is required'),
});

const transactionSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  amount: z.preprocess(val => parseFloat(String(val)), z.number().finite()),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  accountId: z.string().min(1, 'Account ID is required'),
});

const postBodySchema = z.object({
  type: z.enum(['manualAssets', 'manualLiabilities', 'transactions']),
  data: z.unknown(),
});

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
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
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
 * Add manual data (with Zod validation)
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
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const parsed = postBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { type, data } = parsed.data;

    let collectionName = '';
    let validatedData;
    // Validate and prepare data based on type
    switch (type) {
      case 'manualAssets':
        collectionName = `users/${userId}/manualAssets`;
        {
          const assetParse = manualAssetSchema.safeParse(data);
          if (!assetParse.success) {
            return NextResponse.json(
              {
                success: false,
                errors: assetParse.error.flatten().fieldErrors,
              },
              { status: 400 }
            );
          }
          validatedData = assetParse.data;
        }
        break;
      case 'manualLiabilities':
        collectionName = `users/${userId}/manualLiabilities`;
        {
          const liabilityParse = manualLiabilitySchema.safeParse(data);
          if (!liabilityParse.success) {
            return NextResponse.json(
              {
                success: false,
                errors: liabilityParse.error.flatten().fieldErrors,
              },
              { status: 400 }
            );
          }
          validatedData = liabilityParse.data;
        }
        break;
      case 'transactions':
        collectionName = `users/${userId}/transactions`;
        {
          const txnParse = transactionSchema.safeParse(data);
          if (!txnParse.success) {
            return NextResponse.json(
              {
                success: false,
                errors: txnParse.error.flatten().fieldErrors,
              },
              { status: 400 }
            );
          }
          validatedData = txnParse.data;
          validatedData.date = new Date(validatedData.date).toISOString(); // Ensure date is stored as ISO string
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid data type specified' }, { status: 400 });
    }

    // Common fields
    const now = new Date();
    const dataToSave = {
      ...validatedData,
      createdAt: now,
      updatedAt: now,
      userId: userId,
    };

    // Save the document
    await db.collection(collectionName).add(dataToSave);

    return NextResponse.json({
      success: true,
      data: dataToSave,
    });
  } catch (error: unknown) {
    console.error('Error adding manual data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
