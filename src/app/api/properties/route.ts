import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import logger from '@/lib/logger';
import {
  addProperty,
  deleteProperty,
  getRealEstateProperties,
  updateProperty,
} from '@/lib/services/real-estate-service';

// Validation schemas
const mortgageSchema = z.object({
  lender: z.string().min(1),
  originalAmount: z.number().min(0),
  currentBalance: z.number().min(0),
  monthlyPayment: z.number().min(0),
  interestRate: z.number().min(0).max(100),
}).optional();

const createPropertySchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(500).optional(),
  purchasePrice: z.number().min(0),
  purchaseDate: z.string().datetime().optional(),
  currentValue: z.number().min(0),
  valuationSource: z.enum(['manual', 'estimated', 'api']).default('manual'),
  propertyType: z.enum(['residential', 'commercial', 'land', 'other']).default('residential'),
  currency: z.string().length(3).default('ILS'),
  mortgage: mortgageSchema,
  notes: z.string().max(1000).optional(),
});

const updatePropertySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(500).optional(),
  currentValue: z.number().min(0).optional(),
  valuationSource: z.enum(['manual', 'estimated', 'api']).optional(),
  mortgage: mortgageSchema,
  notes: z.string().max(1000).optional(),
});

const deletePropertySchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/properties - Get all properties for the user
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const result = await getRealEstateProperties(authResult.userId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in GET /api/properties', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/properties - Add a new property
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await req.json();
    const parsed = createPropertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const property = await addProperty(authResult.userId, {
      name: parsed.data.name,
      address: parsed.data.address,
      purchasePrice: parsed.data.purchasePrice,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : undefined,
      currentValue: parsed.data.currentValue,
      valuationSource: parsed.data.valuationSource,
      propertyType: parsed.data.propertyType,
      currency: parsed.data.currency,
      mortgage: parsed.data.mortgage,
      notes: parsed.data.notes,
      lastValuationDate: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: property,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/properties', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to create property' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/properties - Update a property
 */
export async function PUT(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await req.json();
    const parsed = updatePropertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { id, name, address, currentValue, valuationSource, mortgage, notes } = parsed.data;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (currentValue !== undefined) {
      updates.currentValue = currentValue;
      updates.lastValuationDate = new Date();
    }
    if (valuationSource !== undefined) updates.valuationSource = valuationSource;
    if (mortgage !== undefined) updates.mortgage = mortgage;
    if (notes !== undefined) updates.notes = notes;

    await updateProperty(authResult.userId, id, updates);

    return NextResponse.json({
      success: true,
      message: 'Property updated',
    });
  } catch (error) {
    logger.error('Error in PUT /api/properties', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/properties - Delete a property
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await req.json();
    const parsed = deletePropertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    await deleteProperty(authResult.userId, parsed.data.id);

    return NextResponse.json({
      success: true,
      message: 'Property deleted',
    });
  } catch (error) {
    logger.error('Error in DELETE /api/properties', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
