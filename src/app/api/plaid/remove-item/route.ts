import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth, db } from '@/lib/firebase-admin';
import { plaidClient } from '@/lib/plaid';

// Zod schema for input validation
const removeItemSchema = z.object({
  itemId: z.string().min(1, 'itemId is required'),
});

/**
 *
 */
async function getUserIdFromSession(): Promise<string | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    console.error('Error verifying session cookie for Plaid item removal:', error);
    return null;
  }
}

/**
 *
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User session is invalid or missing.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = removeItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { itemId } = parsed.data;

    const itemDocRef = db.collection('users').doc(userId).collection('plaidItems').doc(itemId);
    const itemDoc = await itemDocRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json({ error: 'Plaid item not found for this user.' }, { status: 404 });
    }

    const accessToken = itemDoc.data()?.accessToken as string | undefined;

    // Step 1: Attempt to remove the item from Plaid (invalidates access token)
    if (accessToken) {
      try {
        await plaidClient.itemRemove({ access_token: accessToken });
      } catch (plaidError: unknown) {
        // Log the error but proceed with removing from Firestore, as the token might be already invalid
        // or the item doesn't exist on Plaid's side anymore.
        console.warn(
          `Could not remove Plaid item ${itemId} from Plaid systems (might be already removed or token invalid):`,
          plaidError instanceof Error ? plaidError.message : plaidError
        );
      }
    }

    // Step 2: Delete the item from Firestore
    await itemDocRef.delete();

    return NextResponse.json({ message: 'Plaid item unlinked successfully.', itemId });
  } catch (error: unknown) {
    console.error('Error unlinking Plaid item:', error);
    let errorMessage = 'Failed to unlink Plaid item';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
