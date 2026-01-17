import { NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { encryptSensitiveData } from '@/lib/encryption';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

// Zod schema for crypto connection
const connectSchema = z.object({
  exchange: z.enum(['coinbase', 'binance', 'kraken', 'bit2c', 'wallet']),
  apiKey: z.string().min(10, 'API key too short').max(500),
  apiSecret: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const body = await req.json();
    const parsed = connectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { exchange, apiKey, apiSecret } = parsed.data;

    // For wallet type, validate address format and blockchain
    if (exchange === 'wallet') {
      if (!apiSecret) {
        return NextResponse.json({ error: 'Blockchain is required' }, { status: 400 });
      }

      // Basic address validation
      const address = apiKey.trim();
      if (address.length < 26) {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
      }

      // Validate blockchain-specific format
      if (apiSecret === 'ethereum' || apiSecret === 'polygon') {
        if (!address.startsWith('0x') || address.length !== 42) {
          return NextResponse.json(
            { error: 'Invalid Ethereum/Polygon address format' },
            { status: 400 }
          );
        }
      } else if (apiSecret === 'bitcoin') {
        if (!address.match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/)) {
          return NextResponse.json({ error: 'Invalid Bitcoin address format' }, { status: 400 });
        }
      } else if (apiSecret === 'solana') {
        if (address.length < 32 || address.length > 44) {
          return NextResponse.json({ error: 'Invalid Solana address format' }, { status: 400 });
        }
      }

      await db.collection('crypto_accounts').add({
        userId,
        type: 'wallet',
        address,
        blockchain: apiSecret,
        createdAt: new Date(),
        status: 'active',
      });
    } else {
      if (!apiSecret) {
        return NextResponse.json({ error: 'API secret is required' }, { status: 400 });
      }

      // Validate API key format (basic check)
      if (apiKey.trim().length < 10 || apiSecret.trim().length < 10) {
        return NextResponse.json({ error: 'Invalid API credentials' }, { status: 400 });
      }

      // SECURITY: Encrypt API credentials before storing
      const encryptedApiKey = encryptSensitiveData(apiKey.trim());
      const encryptedApiSecret = encryptSensitiveData(apiSecret.trim());

      await db.collection('crypto_accounts').add({
        userId,
        exchange,
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        createdAt: new Date(),
        status: 'active',
      });

      logger.info('Crypto exchange connected with encrypted credentials', { userId, exchange });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error connecting crypto', { error });
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
