import { NextRequest, NextResponse } from 'next/server';

import { createProactiveInsightsService } from '@/lib/ai-proactive-insights';
import { validateAuthToken } from '@/lib/auth-server';
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId, error } = await validateAuthToken(req);
    if (error) return error;

    const service = createProactiveInsightsService(userId);
    const insights = await service.getInsights();

    return NextResponse.json({ success: true, insights });
  } catch (error) {
    logger.error('Error fetching proactive insights', { error });
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, error } = await validateAuthToken(req);
    if (error) return error;
    const { type } = await req.json();

    const service = createProactiveInsightsService(userId);
    let insight;

    switch (type) {
      case 'weekly':
        insight = await service.generateWeeklySummary();
        break;
      case 'monthly':
        insight = await service.generateMonthlySummary();
        break;
      case 'unusual':
        insight = await service.detectUnusualSpending();
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, insight });
  } catch (error) {
    logger.error('Error generating proactive insight', { error });
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
