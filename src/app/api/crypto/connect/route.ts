import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const { exchange, apiKey, apiSecret } = await req.json();

    if (!exchange || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

      await db.collection('crypto_accounts').add({
        userId,
        exchange,
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        createdAt: new Date(),
        status: 'active',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting crypto:', error);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
