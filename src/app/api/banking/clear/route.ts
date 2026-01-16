import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

// Zod schema for query parameters
const clearDataQuerySchema = z.object({
  connectionId: z.string().optional(),
  confirm: z.literal('true'), // Require explicit confirmation
});

export async function DELETE(request: NextRequest) {
    try {
        // CSRF Protection: Check origin header matches expected domain
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        if (origin && host && !origin.includes(host.split(':')[0]!)) {
            logger.warn('CSRF protection triggered on banking clear', { origin, host });
            return NextResponse.json({ success: false, error: 'Invalid request origin' }, { status: 403 });
        }

        // Get userId from session cookie
        const sessionCookie = request.cookies.get('session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        let decodedClaims;
        try {
            decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
        }

        const userId = decodedClaims.uid;

        // Validate query parameters
        const { searchParams } = new URL(request.url);
        const queryValidation = clearDataQuerySchema.safeParse({
            connectionId: searchParams.get('connectionId') || undefined,
            confirm: searchParams.get('confirm'),
        });

        if (!queryValidation.success) {
            return NextResponse.json(
                { success: false, error: 'Missing confirmation parameter. Add ?confirm=true to confirm deletion.' },
                { status: 400 }
            );
        }

        const { connectionId } = queryValidation.data;

        // Audit log before deletion
        logger.info('Banking data deletion initiated', {
            userId,
            connectionId: connectionId || 'all',
            timestamp: new Date().toISOString()
        });

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
        logger.info('Deleted transactions', { userId, count: transactionsSnapshot.size });

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
        logger.info('Deleted accounts', { userId, count: accountsSnapshot.size });

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
        logger.info('Deleted banking connections', { userId, count: connectionsSnapshot.size });

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
        logger.info('Deleted categorized transactions', { userId, count: categorizedSnapshot.size });

        // Audit log completion
        logger.info('Banking data deletion completed', {
            userId,
            connectionId: connectionId || 'all',
            deleted: {
                transactions: transactionsSnapshot.size,
                accounts: accountsSnapshot.size,
                connections: connectionsSnapshot.size,
                categorizedTransactions: categorizedSnapshot.size
            }
        });

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
        // Log actual error server-side, return generic message to client
        logger.error('Error clearing banking data', { error });
        return NextResponse.json(
            { success: false, error: 'Failed to clear data' },
            { status: 500 }
        );
    }
}
