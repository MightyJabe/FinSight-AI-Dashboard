import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    await auth.verifyIdToken(token);

    // Mock insights data for now
    const insights = [
      {
        id: '1',
        title: 'Spending Analysis',
        description: 'Your spending on dining out has increased by 15% this month.',
        type: 'spending',
        severity: 'warning',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Savings Opportunity',
        description: 'You could save $200/month by reducing subscription services.',
        type: 'savings',
        severity: 'info',
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error in insights route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
