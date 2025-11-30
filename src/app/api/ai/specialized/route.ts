import { NextRequest, NextResponse } from 'next/server';

import { createSpecializedFunctions } from '@/lib/ai-specialized-functions';
import { validateAuthToken } from '@/lib/auth-server';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId, error } = await validateAuthToken(req);
    if (error) return error;
    const { function: functionName, params } = await req.json();

    const functions = createSpecializedFunctions(userId);
    let result;

    switch (functionName) {
      case 'analyzeBudget':
        result = await functions.analyzeBudget();
        break;
      case 'optimizeInvestments':
        result = await functions.optimizeInvestments();
        break;
      case 'findTaxDeductions':
        result = await functions.findTaxDeductions();
        break;
      case 'createDebtPayoffPlan':
        result = await functions.createDebtPayoffPlan();
        break;
      case 'planSavingsGoal':
        result = await functions.planSavingsGoal(params.goalAmount, params.timeframeMonths);
        break;
      default:
        return NextResponse.json({ error: 'Invalid function' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error('Error executing specialized function', { error });
    return NextResponse.json({ error: 'Failed to execute function' }, { status: 500 });
  }
}
