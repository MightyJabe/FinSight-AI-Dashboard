/**
 * Real Estate Service
 *
 * Manages property tracking for net worth calculations.
 * Supports manual entry with optional market value estimation.
 */

import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export interface Property {
  id: string;
  name: string;
  address: string | undefined;
  purchasePrice: number;
  purchaseDate: Date | undefined;
  currentValue: number;
  lastValuationDate: Date;
  valuationSource: 'manual' | 'estimated' | 'api';
  propertyType: 'residential' | 'commercial' | 'land' | 'other';
  currency: string;
  mortgage: {
    lender: string;
    originalAmount: number;
    currentBalance: number;
    monthlyPayment: number;
    interestRate: number;
  } | undefined;
  notes: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface RealEstateResult {
  properties: Property[];
  totalValue: number;
  totalMortgageBalance: number;
  netEquity: number;
}

/**
 * Get all real estate properties for a user
 */
export async function getRealEstateProperties(userId: string): Promise<RealEstateResult> {
  try {
    const propertiesSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('properties')
      .get();

    if (propertiesSnapshot.empty) {
      return {
        properties: [],
        totalValue: 0,
        totalMortgageBalance: 0,
        netEquity: 0,
      };
    }

    const properties: Property[] = propertiesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Property',
        address: data.address,
        purchasePrice: Number(data.purchasePrice || 0),
        purchaseDate: data.purchaseDate?.toDate?.() || undefined,
        currentValue: Number(data.currentValue || data.purchasePrice || 0),
        lastValuationDate: data.lastValuationDate?.toDate?.() || new Date(),
        valuationSource: data.valuationSource || 'manual',
        propertyType: data.propertyType || 'residential',
        currency: data.currency || 'ILS',
        mortgage: data.mortgage ? {
          lender: data.mortgage.lender || '',
          originalAmount: Number(data.mortgage.originalAmount || 0),
          currentBalance: Number(data.mortgage.currentBalance || 0),
          monthlyPayment: Number(data.mortgage.monthlyPayment || 0),
          interestRate: Number(data.mortgage.interestRate || 0),
        } : undefined,
        notes: data.notes,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    });

    const totalValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
    const totalMortgageBalance = properties.reduce(
      (sum, p) => sum + (p.mortgage?.currentBalance || 0),
      0
    );
    const netEquity = totalValue - totalMortgageBalance;

    logger.info('Real estate properties fetched', {
      userId,
      propertyCount: properties.length,
      totalValue,
      netEquity,
    });

    return {
      properties,
      totalValue,
      totalMortgageBalance,
      netEquity,
    };
  } catch (error) {
    logger.error('Error fetching real estate properties', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      properties: [],
      totalValue: 0,
      totalMortgageBalance: 0,
      netEquity: 0,
    };
  }
}

/**
 * Add a new property
 */
export async function addProperty(
  userId: string,
  property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Property> {
  const now = new Date();
  const docRef = await adminDb
    .collection('users')
    .doc(userId)
    .collection('properties')
    .add({
      ...property,
      purchaseDate: property.purchaseDate || null,
      createdAt: now,
      updatedAt: now,
    });

  logger.info('Property added', { userId, propertyId: docRef.id, name: property.name });

  return {
    ...property,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update a property
 */
export async function updateProperty(
  userId: string,
  propertyId: string,
  updates: Partial<Omit<Property, 'id' | 'createdAt'>>
): Promise<void> {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('properties')
    .doc(propertyId)
    .update({
      ...updates,
      updatedAt: new Date(),
    });

  logger.info('Property updated', { userId, propertyId });
}

/**
 * Delete a property
 */
export async function deleteProperty(userId: string, propertyId: string): Promise<void> {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('properties')
    .doc(propertyId)
    .delete();

  logger.info('Property deleted', { userId, propertyId });
}

/**
 * Convert properties to account format for financial calculator
 */
export function propertiesToAccounts(properties: Property[]): Array<{
  id: string;
  name: string;
  balance: number;
  type: string;
}> {
  return properties.map((p) => ({
    id: p.id,
    name: p.name,
    balance: p.currentValue,
    type: 'real_estate',
  }));
}

/**
 * Get mortgage liabilities from properties
 */
export function getMortgageLiabilities(properties: Property[]): Array<{
  id: string;
  name: string;
  amount: number;
  type: string;
}> {
  return properties
    .filter((p) => p.mortgage && p.mortgage.currentBalance > 0)
    .map((p) => ({
      id: `mortgage-${p.id}`,
      name: `Mortgage - ${p.name}`,
      amount: p.mortgage!.currentBalance,
      type: 'mortgage',
    }));
}
