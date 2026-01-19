import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

// Zod schemas for input validation
const manualAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.preprocess(val => parseFloat(String(val)), z.number().finite()),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  purchasePrice: z.preprocess(
    val => (val ? parseFloat(String(val)) : undefined),
    z.number().finite().optional()
  ),
  purchaseDate: z.string().optional(),
  location: z.string().optional(),
  insuranceValue: z.preprocess(
    val => (val ? parseFloat(String(val)) : undefined),
    z.number().finite().optional()
  ),
  metadata: z.record(z.any()).optional(),
});

const informalDebtSchema = z.object({
  person: z.string().min(1, 'Person is required'),
  amount: z.preprocess(val => parseFloat(String(val)), z.number().finite()),
  type: z.enum(['owed_to_me', 'i_owe']),
  reason: z.string().min(1, 'Reason is required'),
  dueDate: z.string().optional(),
  reminders: z.boolean().default(false),
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
  type: z.enum(['manualAssets', 'manualLiabilities', 'transactions', 'informalDebts']),
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
      case 'informalDebts':
        collectionName = `users/${userId}/informalDebts`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid data type specified' }, { status: 400 });
    }

    // Get the data from Firestore
    const snapshot = await db.collection(collectionName).orderBy('date', 'desc').get();
    const data = snapshot.docs.map((doc: any) => {
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
    logger.error('Error fetching manual data', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/manual-data',
      method: 'GET',
    });
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
          validatedData.date = new Date(validatedData.date).toISOString();
        }
        break;
      case 'informalDebts':
        collectionName = `users/${userId}/informalDebts`;
        {
          const debtParse = informalDebtSchema.safeParse(data);
          if (!debtParse.success) {
            return NextResponse.json(
              {
                success: false,
                errors: debtParse.error.flatten().fieldErrors,
              },
              { status: 400 }
            );
          }
          validatedData = {
            ...debtParse.data,
            originalAmount: debtParse.data.amount,
            status: 'pending',
            date: new Date().toISOString(),
          };
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
    logger.error('Error adding manual data', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/manual-data',
      method: 'POST',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
