import { NextRequest, NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authResult = await validateAuthToken(req);
        if (authResult.error) {
            return authResult.error;
        }
        const userId = authResult.userId;

        // Fetch accounts from Firestore (cached from scrape)
        const accountsSnapshot = await adminDb
            .collection('users')
            .doc(userId)
            .collection('accounts')
            .get();

        if (accountsSnapshot.empty) {
            return NextResponse.json({ accounts: [] });
        }

        const accounts = accountsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data()
        }));

        logger.info('Returning cached accounts', { userId, count: accounts.length });

        return NextResponse.json({ accounts });

    } catch (error) {
        logger.error('Error fetching accounts', { error });
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}
