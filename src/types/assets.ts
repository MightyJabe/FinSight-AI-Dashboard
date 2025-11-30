export type AssetType =
  | 'real_estate'
  | 'vehicle'
  | 'jewelry'
  | 'collectibles'
  | 'business_equity'
  | 'precious_metals'
  | 'art'
  | 'intellectual_property'
  | 'cash'
  | 'checking_account'
  | 'savings_account'
  | 'investment'
  | 'cryptocurrency'
  | 'other';

export interface PhysicalAsset {
  id: string;
  userId: string;
  type: AssetType;
  name: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  depreciationRate?: number;
  appreciationRate?: number;
  location?: string;
  insuranceValue?: number;
  photos?: string[];
  documents?: string[];
  notes?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleAsset extends PhysicalAsset {
  type: 'vehicle';
  metadata: {
    make: string;
    model: string;
    year: number;
    mileage: number;
    vin?: string;
    licensePlate?: string;
  };
}

export interface RealEstateAsset extends PhysicalAsset {
  type: 'real_estate';
  metadata: {
    address: string;
    propertyType: 'house' | 'condo' | 'land' | 'commercial';
    squareFeet?: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
  };
}

export interface InformalDebt {
  id: string;
  userId: string;
  type: 'owed_to_me' | 'i_owe';
  person: string;
  amount: number;
  originalAmount: number;
  date: string;
  reason: string;
  dueDate?: string;
  status: 'pending' | 'partially_paid' | 'paid';
  reminders: boolean;
  createdAt: string;
  updatedAt: string;
}
