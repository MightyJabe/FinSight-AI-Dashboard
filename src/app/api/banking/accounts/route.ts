import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Fetch accounts from Firestore (cached from scrape)
        const accountsSnapshot = await adminDb
            .collection('users')
            .doc(userId)
            .collection('accounts')
            .get();

        if (accountsSnapshot.empty) {
            return NextResponse.json({ accounts: [] });
        }

        const accounts = accountsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`[Accounts] Returning ${accounts.length} cached accounts for user ${userId}`);

        return NextResponse.json({ accounts });

    } catch (error: any) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
