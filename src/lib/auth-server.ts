import { NextResponse } from 'next/server';

import { auth } from './firebase-admin';

/**
 * Extracts and validates the Firebase ID token from the Authorization header
 * @param request - The request object containing headers
 * @returns The user ID from the decoded token or an error response
 */
export async function validateAuthToken(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return { error: NextResponse.json({ error: 'Invalid token format' }, { status: 401 }) };
    }
    
    const decodedToken = await auth.verifyIdToken(idToken);
    return { userId: decodedToken.uid };
  } catch (error) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
}