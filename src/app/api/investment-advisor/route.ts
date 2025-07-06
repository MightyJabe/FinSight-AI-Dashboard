import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/firebase-admin';
import { analyzePortfolio, calculateRebalancingStrategy } from '@/lib/investment-advisor';
import logger from '@/lib/logger';
import type { InvestmentAccount } from '@/types/finance';

const querySchema = z.object({
  includeRebalancing: z.string().nullable().optional(),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive', 'very_aggressive']).nullable().optional(),
  userAge: z.string().nullable().optional(),
});

interface UserProfile {
  age?: number;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';
  investmentGoals?: string[];
  timeHorizon?: number; // years
}

/**
 * GET /api/investment-advisor - Get AI-powered investment recommendations
 */
export async function GET(request: NextRequest) {
  try {
    // Extract and validate authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 401 }
      );
    }
    
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user token' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      includeRebalancing: searchParams.get('includeRebalancing'),
      riskTolerance: searchParams.get('riskTolerance'),
      userAge: searchParams.get('userAge'),
    };
    
    const parsed = querySchema.safeParse(queryParams);

    if (!parsed.success) {
      logger.error('Query parameter validation failed', {
        queryParams,
        errors: parsed.error.issues,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: parsed.error.issues 
        },
        { status: 400 }
      );
    }

    const { includeRebalancing: includeRebalancingStr, riskTolerance, userAge: userAgeStr } = parsed.data;
    
    // Manual transformation after validation
    const includeRebalancing = includeRebalancingStr === 'true';
    const userAge = userAgeStr && userAgeStr !== 'null' ? parseInt(userAgeStr) : undefined;

    logger.info('Generating investment advisor recommendations', {
      userId,
      includeRebalancing,
      riskTolerance,
      userAge,
    });

    // Fetch user's investment accounts and profile
    const [investmentAccounts, userProfile] = await Promise.all([
      fetchUserInvestmentAccounts(userId),
      fetchUserProfile(userId),
    ]);

    // Use provided parameters or fall back to user profile defaults
    const finalAge = userAge ?? userProfile.age ?? 35;
    const finalRiskTolerance = riskTolerance ?? userProfile.riskTolerance ?? 'moderate';

    // Generate investment analysis
    const analysis = analyzePortfolio(investmentAccounts, finalAge, finalRiskTolerance);

    // Add rebalancing strategy if requested
    let rebalancingStrategy = null;
    if (includeRebalancing && analysis.rebalancingNeeded) {
      rebalancingStrategy = calculateRebalancingStrategy(analysis.allocations, analysis.totalValue);
    }

    logger.info('Investment advisor recommendations generated successfully', {
      userId,
      portfolioValue: analysis.totalValue,
      riskScore: analysis.riskAssessment.riskScore,
      recommendationCount: analysis.recommendations.length,
      rebalancingNeeded: analysis.rebalancingNeeded,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        rebalancingStrategy,
        userProfile: {
          age: finalAge,
          riskTolerance: finalRiskTolerance,
        },
      },
    });

  } catch (error) {
    logger.error('Error generating investment advisor recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate investment recommendations' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/investment-advisor - Update user investment profile
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 401 }
      );
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const profileSchema = z.object({
      age: z.number().min(18).max(100).optional(),
      riskTolerance: z.enum(['conservative', 'moderate', 'aggressive', 'very_aggressive']).optional(),
      investmentGoals: z.array(z.string()).optional(),
      timeHorizon: z.number().min(1).max(50).optional(),
    });

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid profile data',
          details: parsed.error.formErrors.fieldErrors 
        },
        { status: 400 }
      );
    }

    const profileData = parsed.data;

    // Update user's investment profile  
    const updateData: Partial<UserProfile> = {};
    if (profileData.age !== undefined) updateData.age = profileData.age;
    if (profileData.riskTolerance !== undefined) updateData.riskTolerance = profileData.riskTolerance;
    if (profileData.investmentGoals !== undefined) updateData.investmentGoals = profileData.investmentGoals;
    if (profileData.timeHorizon !== undefined) updateData.timeHorizon = profileData.timeHorizon;
    
    await updateUserProfile(userId, updateData);

    logger.info('User investment profile updated', {
      userId,
      updatedFields: Object.keys(profileData),
    });

    return NextResponse.json({
      success: true,
      message: 'Investment profile updated successfully',
    });

  } catch (error) {
    logger.error('Error updating investment profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update investment profile' 
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch user's investment accounts
 */
async function fetchUserInvestmentAccounts(userId: string): Promise<InvestmentAccount[]> {
  try {
    const db = (await import('@/lib/firebase-admin')).db;
    
    // Fetch investment accounts from Firebase
    const accountsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('accounts')
      .where('type', 'in', ['Investment', 'Retirement', '401k', 'IRA', 'Roth IRA', 'Brokerage'])
      .get();

    const accounts: InvestmentAccount[] = accountsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Investment Account',
        type: data.type || 'Investment',
        currentBalance: data.currentBalance || 0,
        source: data.source || 'manual',
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        holdings: data.holdings || [],
        performance: data.performance || {
          totalReturn: 0,
          dayChange: 0,
          dayChangePercent: 0,
        },
      };
    });

    return accounts;

  } catch (error) {
    logger.error('Error fetching user investment accounts', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return []; // Return empty array on error to not break the analysis
  }
}

/**
 * Fetch user's investment profile
 */
async function fetchUserProfile(userId: string): Promise<UserProfile> {
  try {
    const db = (await import('@/lib/firebase-admin')).db;
    
    const profileDoc = await db
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('investment-profile')
      .get();

    if (!profileDoc.exists) {
      return {}; // Return empty profile if not set
    }

    const profileData = profileDoc.data();
    return {
      age: profileData?.age,
      riskTolerance: profileData?.riskTolerance,
      investmentGoals: profileData?.investmentGoals || [],
      timeHorizon: profileData?.timeHorizon,
    };

  } catch (error) {
    logger.error('Error fetching user investment profile', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {}; // Return empty profile on error
  }
}

/**
 * Update user's investment profile
 */
async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
  try {
    const db = (await import('@/lib/firebase-admin')).db;
    
    await db
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('investment-profile')
      .set({
        ...profileData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

    logger.info('User investment profile updated successfully', {
      userId,
      updatedFields: Object.keys(profileData),
    });

  } catch (error) {
    logger.error('Error updating user investment profile', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}