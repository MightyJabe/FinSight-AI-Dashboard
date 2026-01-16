import { NextRequest, NextResponse } from 'next/server';
import { CountryCode, LinkTokenCreateRequest, Products } from 'plaid';

import { plaidApi } from '@/lib/banking/plaidClient';
import { encryptSensitiveData } from '@/lib/encryption';
import { adminAuth,adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// GET: Create Plaid Link Token
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const request: LinkTokenCreateRequest = {
            user: { client_user_id: userId },
            client_name: 'FinSight AI',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us, CountryCode.Ca, CountryCode.Gb, CountryCode.Fr],
            language: 'en',
        };

        const response = await plaidApi.linkTokenCreate(request);
        return NextResponse.json({ link_token: response.data.link_token });

    } catch (error: any) {
        console.error('Error creating link token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Exchange Token (Plaid) OR Scrape & Save (Israel)
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();
        const { provider, publicToken, credentials, companyId } = body;

        let accessToken = '';
        let itemId = '';
        let institutionName = '';

        if (provider === 'plaid') {
            const response = await plaidApi.itemPublicTokenExchange({
                public_token: publicToken,
            });
            accessToken = response.data.access_token;
            itemId = response.data.item_id;
            institutionName = 'Plaid Bank';
        } else if (provider === 'israel') {
            const credsString = JSON.stringify({ companyId, creds: credentials });

            // Import and use the scrapeAll method for single scrape
            const { IsraelClient } = await import('@/lib/banking/israelClient');
            const israelClient = new IsraelClient();

            let scrapedAccounts = [];
            let scrapedTransactions = [];

            try {
                // Single scrape that returns both accounts and transactions
                const result = await israelClient.scrapeAll(credsString);
                scrapedAccounts = result.accounts;
                scrapedTransactions = result.transactions;
                console.log(`[Connect] Scraped ${scrapedAccounts.length} accounts, ${scrapedTransactions.length} transactions`);

            } catch (err: any) {
                console.error('Scraper error:', err);
                return NextResponse.json({ error: `Scraper Failed: ${err.message}` }, { status: 400 });
            }

            // Encrypt credentials for future use (if needed for refresh)
            const encrypted = encryptSensitiveData(credsString);
            accessToken = JSON.stringify(encrypted);
            itemId = companyId;
            institutionName = companyId;

            // Save connection first
            const connectionRef = adminDb.collection('users').doc(userId).collection('banking_connections').doc();
            await connectionRef.set({
                id: connectionRef.id,
                userId,
                provider,
                itemId,
                institutionName,
                accessToken,
                status: 'active',
                lastSynced: new Date(),
                createdAt: new Date()
            });

            // Helper to sanitize document IDs for Firestore
            const sanitizeDocId = (id: string): string => {
                if (!id || typeof id !== 'string') {
                    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }
                // Replace invalid characters (/, \, ., ..)
                return id.replace(/[\/\\\.]/g, '_').substring(0, 100);
            };

            // Save accounts to Firestore
            const accountsBatch = adminDb.batch();
            for (const account of scrapedAccounts) {
                const docId = sanitizeDocId(String(account.id));
                const accountRef = adminDb
                    .collection('users')
                    .doc(userId)
                    .collection('accounts')
                    .doc(docId);
                accountsBatch.set(accountRef, {
                    ...account,
                    connectionId: connectionRef.id,
                    userId,
                    updatedAt: new Date()
                });
            }
            await accountsBatch.commit();
            console.log(`[Connect] Saved ${scrapedAccounts.length} accounts to Firestore`);

            // Save transactions to Firestore
            const txBatch = adminDb.batch();
            for (const tx of scrapedTransactions) {
                const docId = sanitizeDocId(String(tx.id));
                const txRef = adminDb
                    .collection('users')
                    .doc(userId)
                    .collection('transactions')
                    .doc(docId);
                txBatch.set(txRef, {
                    ...tx,
                    connectionId: connectionRef.id,
                    userId,
                    updatedAt: new Date()
                });
            }
            await txBatch.commit();
            console.log(`[Connect] Saved ${scrapedTransactions.length} transactions to Firestore`);

            return NextResponse.json({
                success: true,
                connectionId: connectionRef.id,
                accountsCount: scrapedAccounts.length,
                transactionsCount: scrapedTransactions.length
            });
        } else {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        // Plaid path: Save connection only (accounts fetched on-demand)
        const connectionRef = adminDb.collection('users').doc(userId).collection('banking_connections').doc();
        await connectionRef.set({
            id: connectionRef.id,
            userId,
            provider,
            itemId,
            institutionName,
            accessToken,
            status: 'active',
            lastSynced: new Date(),
            createdAt: new Date()
        });

        return NextResponse.json({ success: true, connectionId: connectionRef.id });

    } catch (error: any) {
        console.error('Error exchanging token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
