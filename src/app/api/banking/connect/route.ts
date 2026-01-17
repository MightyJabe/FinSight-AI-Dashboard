import { NextRequest, NextResponse } from 'next/server';
import { CountryCode, LinkTokenCreateRequest, Products } from 'plaid';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { plaidApi } from '@/lib/banking/plaidClient';
import { encryptSensitiveData } from '@/lib/encryption';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Zod validation schemas for POST body
const plaidConnectionSchema = z.object({
  provider: z.literal('plaid'),
  publicToken: z.string().min(1, 'Public token is required'),
});

const israelConnectionSchema = z.object({
  provider: z.literal('israel'),
  companyId: z.string().min(1, 'Company ID is required'),
  credentials: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    id: z.string().optional(),
    num: z.string().optional(),
    card6Digits: z.string().optional(),
  }).passthrough(), // Allow additional credential fields
});

const connectionSchema = z.discriminatedUnion('provider', [
  plaidConnectionSchema,
  israelConnectionSchema,
]);

// GET: Create Plaid Link Token
export async function GET(req: NextRequest) {
    try {
        const authResult = await validateAuthToken(req);
        if (authResult.error) {
            return authResult.error;
        }
        const userId = authResult.userId;

        const request: LinkTokenCreateRequest = {
            user: { client_user_id: userId },
            client_name: 'FinSight AI',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us, CountryCode.Ca, CountryCode.Gb, CountryCode.Fr],
            language: 'en',
        };

        const response = await plaidApi.linkTokenCreate(request);
        return NextResponse.json({ link_token: response.data.link_token });

    } catch (error) {
        logger.error('Error creating link token', { error });
        return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
    }
}

// POST: Exchange Token (Plaid) OR Scrape & Save (Israel)
export async function POST(req: NextRequest) {
    try {
        const authResult = await validateAuthToken(req);
        if (authResult.error) {
            return authResult.error;
        }
        const userId = authResult.userId;

        const body = await req.json();
        const parsed = connectionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, errors: parsed.error.formErrors.fieldErrors },
                { status: 400 }
            );
        }

        const validatedData = parsed.data;

        let accessToken = '';
        let itemId = '';
        let institutionName = '';

        if (validatedData.provider === 'plaid') {
            const response = await plaidApi.itemPublicTokenExchange({
                public_token: validatedData.publicToken,
            });
            accessToken = response.data.access_token;
            itemId = response.data.item_id;
            institutionName = 'Plaid Bank';
        } else if (validatedData.provider === 'israel') {
            const { companyId, credentials } = validatedData;
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
                logger.info(`[Connect] Scraped ${scrapedAccounts.length} accounts, ${scrapedTransactions.length} transactions`);

            } catch (err) {
                logger.error('Scraper error', { error: err });
                return NextResponse.json({ error: 'Scraper failed' }, { status: 400 });
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
                provider: validatedData.provider,
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
            logger.info(`[Connect] Saved ${scrapedAccounts.length} accounts to Firestore`);

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
            logger.info(`[Connect] Saved ${scrapedTransactions.length} transactions to Firestore`);

            return NextResponse.json({
                success: true,
                connectionId: connectionRef.id,
                accountsCount: scrapedAccounts.length,
                transactionsCount: scrapedTransactions.length
            });
        }

        // Plaid path: Save connection only (accounts fetched on-demand)
        const connectionRef = adminDb.collection('users').doc(userId).collection('banking_connections').doc();
        await connectionRef.set({
            id: connectionRef.id,
            userId,
            provider: validatedData.provider,
            itemId,
            institutionName,
            accessToken,
            status: 'active',
            lastSynced: new Date(),
            createdAt: new Date()
        });

        return NextResponse.json({ success: true, connectionId: connectionRef.id });

    } catch (error) {
        logger.error('Error exchanging token', { error });
        return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
    }
}
