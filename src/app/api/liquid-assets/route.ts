import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Liquid asset types definition
const LIQUID_ASSET_TYPES = ['checking', 'savings', 'cash', 'money_market'];

/**
 *
 */
async function getUserIdFromSession(): Promise<string | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    return null;
  }
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
    return decodedClaims.uid;
  } catch (error) {
    logger.error('Error verifying session cookie', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/liquid-assets',
      operation: 'getUserIdFromSession',
    });
    return null;
  }
}

/**
 * Fetches all liquid assets (manual and Plaid) for the authenticated user.
 * Liquid assets are defined by LIQUID_ASSET_TYPES.
 */
export async function GET() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assetsSnapshot = await db.collection(`users/${userId}/manualAssets`).get();

    if (assetsSnapshot.empty) {
      return NextResponse.json([], { status: 200 }); // No assets found, return empty array
    }

    const allAssets = assetsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.data().name as string,
      type: doc.data().type as string,
      amount: doc.data().amount as number,
      // Add other fields if necessary, but keep it minimal for the dropdown
    }));

    const liquidAssets = allAssets.filter((asset: any) => LIQUID_ASSET_TYPES.includes(asset.type));

    // We only need id and name for the dropdown
    const dropdownAssets = liquidAssets.map((asset: any) => ({
      id: asset.id,
      name: `${asset.name} (${asset.type}) - Balance: ${asset.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
    }));

    return NextResponse.json(dropdownAssets, { status: 200 });
  } catch (error) {
    logger.error('Error fetching liquid assets', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/liquid-assets',
      method: 'GET',
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
