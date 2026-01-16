import { NextRequest, NextResponse } from 'next/server';

import { adminAuth,adminDb } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest) {
    try {
        // Get userId from session cookie
        const sessionCookie = request.cookies.get('session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
        const userId = decodedClaims.uid;

        // Get the connection ID from query params (optional - if not provided, delete all)
        const { searchParams } = new URL(request.url);
        const connectionId = searchParams.get('connectionId');

        console.log(`[Clear Data] Clearing banking data for user ${userId}, connectionId: ${connectionId || 'all'}`);

        // Delete transactions
        const transactionsRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('transactions');

        let transactionsQuery;
        if (connectionId) {
            transactionsQuery = transactionsRef.where('connectionId', '==', connectionId);
        } else {
            transactionsQuery = transactionsRef;
        }

        const transactionsSnapshot = await transactionsQuery.get();
        const txBatch = adminDb.batch();
        transactionsSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            txBatch.delete(doc.ref);
        });
        await txBatch.commit();
        console.log(`[Clear Data] Deleted ${transactionsSnapshot.size} transactions`);

        // Delete accounts
        const accountsRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('accounts');

        let accountsQuery;
        if (connectionId) {
            accountsQuery = accountsRef.where('connectionId', '==', connectionId);
        } else {
            accountsQuery = accountsRef;
        }

        const accountsSnapshot = await accountsQuery.get();
        const accountsBatch = adminDb.batch();
        accountsSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            accountsBatch.delete(doc.ref);
        });
        await accountsBatch.commit();
        console.log(`[Clear Data] Deleted ${accountsSnapshot.size} accounts`);

        // Delete banking connections
        const connectionsRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('banking_connections');

        let connectionsQuery;
        if (connectionId) {
            connectionsQuery = connectionsRef.where('id', '==', connectionId);
        } else {
            connectionsQuery = connectionsRef;
        }

        const connectionsSnapshot = await connectionsQuery.get();
        const connectionsBatch = adminDb.batch();
        connectionsSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            connectionsBatch.delete(doc.ref);
        });
        await connectionsBatch.commit();
        console.log(`[Clear Data] Deleted ${connectionsSnapshot.size} banking connections`);

        // Delete categorized transactions (AI-categorized data)
        const categorizedRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('categorizedTransactions');

        const categorizedSnapshot = await categorizedRef.get();
        const categorizedBatch = adminDb.batch();
        categorizedSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            categorizedBatch.delete(doc.ref);
        });
        await categorizedBatch.commit();
        console.log(`[Clear Data] Deleted ${categorizedSnapshot.size} categorized transactions`);

        return NextResponse.json({
            success: true,
            deleted: {
                transactions: transactionsSnapshot.size,
                accounts: accountsSnapshot.size,
                connections: connectionsSnapshot.size,
                categorizedTransactions: categorizedSnapshot.size
            }
        });

    } catch (error) {
        console.error('Error clearing banking data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to clear data' },
            { status: 500 }
        );
    }
}
