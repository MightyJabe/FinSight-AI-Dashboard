import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        // Get userId from session cookie
        const sessionCookie = request.cookies.get('session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { adminAuth } = await import('@/lib/firebase-admin');
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
        const userId = decodedClaims.uid;

        // Fetch all transactions from the user's transactions subcollection
        const transactionsSnapshot = await adminDb
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .orderBy('date', 'desc')
            .get();

        const transactions = transactionsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            return {
                transaction_id: doc.id,
                id: doc.id,
                date: data.date || '',
                name: data.description || data.memo || 'Unknown',
                description: data.description || data.memo || 'Unknown',
                amount: data.chargedAmount || data.originalAmount || 0,
                originalAmount: data.originalAmount || data.chargedAmount || 0,
                originalCurrency: data.originalCurrency || 'ILS',
                chargedCurrency: data.chargedCurrency || 'ILS',
                category: data.category || 'Uncategorized',
                type: (data.chargedAmount || data.originalAmount || 0) > 0 ? 'income' : 'expense',
                account_name: data.institutionName || data.accountName || 'Israeli Bank',
                account_id: data.accountId || '',
                institutionName: data.institutionName || 'Israeli Bank',
                source: 'israel',
                status: data.status || 'completed',
                processedDate: data.processedDate || data.date || '',
            };
        });

        return NextResponse.json({
            success: true,
            transactions,
            count: transactions.length,
        });
    } catch (error) {
        console.error('Error fetching Israeli transactions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}
