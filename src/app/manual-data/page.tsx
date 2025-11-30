'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useSession } from '@/components/providers/SessionProvider';
import { Button, Card, CardContent } from '@/components/ui';

interface AssetForm {
  name: string;
  amount: string;
  type: string;
  description: string;
  purchasePrice: string;
  purchaseDate: string;
  location: string;
  insuranceValue: string;
  // Vehicle specific
  make: string;
  model: string;
  year: string;
  mileage: string;
  vin: string;
  // Real estate specific
  address: string;
  propertyType: string;
  squareFeet: string;
}

interface DebtForm {
  person: string;
  amount: string;
  type: 'owed_to_me' | 'i_owe';
  reason: string;
  dueDate: string;
  reminders: boolean;
}

interface LiabilityForm {
  name: string;
  amount: string;
  type: string;
}

interface TransactionForm {
  type: string;
  amount: string;
  category: string;
  date: string;
  recurrence: string;
  description: string;
  accountId: string;
}

interface LiquidAccount {
  id: string;
  name: string;
}

/**
 *
 */
export default function ManualDataPage() {
  const { firebaseUser } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'asset' | 'liability' | 'transaction' | 'debt'>(
    'asset'
  );
  const [loading, setLoading] = useState(false);
  const [liquidAccounts, setLiquidAccounts] = useState<LiquidAccount[]>([]);

  // Form states
  const [assetForm, setAssetForm] = useState<AssetForm>({
    name: '',
    amount: '',
    type: '',
    description: '',
    purchasePrice: '',
    purchaseDate: '',
    location: '',
    insuranceValue: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    vin: '',
    address: '',
    propertyType: 'house',
    squareFeet: '',
  });

  const [debtForm, setDebtForm] = useState<DebtForm>({
    person: '',
    amount: '',
    type: 'i_owe',
    reason: '',
    dueDate: '',
    reminders: false,
  });

  const [liabilityForm, setLiabilityForm] = useState<LiabilityForm>({
    name: '',
    amount: '',
    type: 'loan',
  });

  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    type: 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0] as string,
    recurrence: 'none',
    description: '',
    accountId: '',
  });

  // Effect to fetch liquid accounts when transaction tab is active and user is available
  useEffect(() => {
    if (activeTab === 'transaction' && firebaseUser) {
      const fetchLiquidAccounts = async () => {
        try {
          setLoading(true);
          if (!firebaseUser) return;
          const response = await fetch('/api/liquid-assets', {
            headers: {
              Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch liquid accounts');
          }
          const data = await response.json();
          setLiquidAccounts(data || []);
        } catch (error) {
          toast.error('Could not load your accounts. Please try again.');
          console.error('Failed to fetch liquid accounts:', error);
          setLiquidAccounts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchLiquidAccounts();
    }
  }, [activeTab, firebaseUser]);

  // Form handlers
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      toast.error('Please sign in to add assets');
      return;
    }
    if (!assetForm.type) {
      toast.error('Please select an asset type.');
      return;
    }

    setLoading(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const metadata: Record<string, any> = {};

      if (assetForm.type === 'vehicle') {
        metadata.make = assetForm.make;
        metadata.model = assetForm.model;
        metadata.year = assetForm.year ? parseInt(assetForm.year) : undefined;
        metadata.mileage = assetForm.mileage ? parseInt(assetForm.mileage) : undefined;
        metadata.vin = assetForm.vin;
      } else if (assetForm.type === 'real_estate') {
        metadata.address = assetForm.address;
        metadata.propertyType = assetForm.propertyType;
        metadata.squareFeet = assetForm.squareFeet ? parseInt(assetForm.squareFeet) : undefined;
      }

      const response = await fetch('/api/manual-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          type: 'manualAssets',
          data: {
            ...assetForm,
            amount: parseFloat(assetForm.amount),
            purchasePrice: assetForm.purchasePrice
              ? parseFloat(assetForm.purchasePrice)
              : parseFloat(assetForm.amount),
            insuranceValue: assetForm.insuranceValue
              ? parseFloat(assetForm.insuranceValue)
              : undefined,
            metadata,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to add asset');

      toast.success('Asset added successfully');
      setAssetForm({
        name: '',
        amount: '',
        type: '',
        description: '',
        purchasePrice: '',
        purchaseDate: '',
        location: '',
        insuranceValue: '',
        make: '',
        model: '',
        year: '',
        mileage: '',
        vin: '',
        address: '',
        propertyType: 'house',
        squareFeet: '',
      });
      router.refresh();
    } catch (error) {
      toast.error('Failed to add asset. Check console for details.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLiabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      toast.error('Please sign in to add liabilities');
      return;
    }

    setLoading(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/manual-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          type: 'manualLiabilities',
          data: { ...liabilityForm, amount: parseFloat(liabilityForm.amount) },
        }),
      });

      if (!response.ok) throw new Error('Failed to add liability');

      toast.success('Liability added successfully');
      setLiabilityForm({ name: '', amount: '', type: 'loan' });
      router.refresh();
    } catch (error) {
      toast.error('Failed to add liability. Check console for details.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      toast.error('Please sign in to add transactions');
      return;
    }
    if (!transactionForm.accountId) {
      toast.error('Please select an account for the transaction.');
      return;
    }

    setLoading(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/manual-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          type: 'transactions',
          data: { ...transactionForm, amount: parseFloat(transactionForm.amount) },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add transaction');
      }

      toast.success('Transaction added successfully');
      setTransactionForm({
        type: 'expense',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0] as string,
        recurrence: 'none',
        description: '',
        accountId: '',
      });
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while adding transaction. Check console for details.'
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Add Financial Data</h1>
          <p className="mt-2 text-lg text-gray-600">
            Add accounts, transactions, and other financial information that isn&apos;t connected to
            your bank.
          </p>
        </div>

        <Card variant="flat" className="mb-8">
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 text-base font-semibold transition-colors ${
                activeTab === 'asset'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('asset')}
            >
              Add Asset
            </button>
            <button
              className={`flex-1 py-3 text-base font-semibold transition-colors ${
                activeTab === 'liability'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('liability')}
            >
              Add Debt
            </button>
            <button
              className={`flex-1 py-3 text-base font-semibold transition-colors ${
                activeTab === 'transaction'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('transaction')}
            >
              Add Transaction
            </button>
            <button
              className={`flex-1 py-3 text-base font-semibold transition-colors ${
                activeTab === 'debt'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('debt')}
            >
              Informal Debt
            </button>
          </div>
        </Card>

        {activeTab === 'asset' && (
          <Card variant="elevated">
            <CardContent>
              <form onSubmit={handleAssetSubmit} className="space-y-6">
                <div>
                  <label htmlFor="assetName" className="block text-sm font-medium text-gray-700">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    id="assetName"
                    value={assetForm.name}
                    onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="assetAmount" className="block text-sm font-medium text-gray-700">
                    Value
                  </label>
                  <input
                    type="number"
                    id="assetAmount"
                    value={assetForm.amount}
                    onChange={e => setAssetForm({ ...assetForm, amount: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="assetType" className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    id="assetType"
                    value={assetForm.type}
                    onChange={e => setAssetForm({ ...assetForm, type: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Type</option>
                    <optgroup label="Liquid Assets">
                      <option value="cash">Cash</option>
                      <option value="checking_account">Checking Account</option>
                      <option value="savings_account">Savings Account</option>
                    </optgroup>
                    <optgroup label="Investments">
                      <option value="investment">Investment Account</option>
                      <option value="cryptocurrency">Cryptocurrency</option>
                    </optgroup>
                    <optgroup label="Physical Assets">
                      <option value="real_estate">Real Estate</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="jewelry">Jewelry</option>
                      <option value="collectibles">Collectibles</option>
                      <option value="art">Art</option>
                      <option value="precious_metals">Precious Metals</option>
                    </optgroup>
                    <optgroup label="Business">
                      <option value="business_equity">Business Equity</option>
                      <option value="intellectual_property">Intellectual Property</option>
                    </optgroup>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="purchasePrice"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Purchase Price (Optional)
                    </label>
                    <input
                      type="number"
                      id="purchasePrice"
                      value={assetForm.purchasePrice}
                      onChange={e => setAssetForm({ ...assetForm, purchasePrice: e.target.value })}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="purchaseDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Purchase Date (Optional)
                    </label>
                    <input
                      type="date"
                      id="purchaseDate"
                      value={assetForm.purchaseDate}
                      onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Vehicle-specific fields */}
                {assetForm.type === 'vehicle' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label htmlFor="make" className="block text-sm font-medium text-gray-700">
                          Make
                        </label>
                        <input
                          type="text"
                          id="make"
                          value={assetForm.make}
                          onChange={e => setAssetForm({ ...assetForm, make: e.target.value })}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Toyota"
                        />
                      </div>
                      <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                          Model
                        </label>
                        <input
                          type="text"
                          id="model"
                          value={assetForm.model}
                          onChange={e => setAssetForm({ ...assetForm, model: e.target.value })}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Camry"
                        />
                      </div>
                      <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                          Year
                        </label>
                        <input
                          type="number"
                          id="year"
                          value={assetForm.year}
                          onChange={e => setAssetForm({ ...assetForm, year: e.target.value })}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="2020"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="mileage"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Mileage
                        </label>
                        <input
                          type="number"
                          id="mileage"
                          value={assetForm.mileage}
                          onChange={e => setAssetForm({ ...assetForm, mileage: e.target.value })}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="50000"
                        />
                      </div>
                      <div>
                        <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
                          VIN (Optional)
                        </label>
                        <input
                          type="text"
                          id="vin"
                          value={assetForm.vin}
                          onChange={e => setAssetForm({ ...assetForm, vin: e.target.value })}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Real Estate-specific fields */}
                {assetForm.type === 'real_estate' && (
                  <>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={assetForm.address}
                        onChange={e => setAssetForm({ ...assetForm, address: e.target.value })}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="123 Main St, City, State ZIP"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="propertyType"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Property Type
                        </label>
                        <select
                          id="propertyType"
                          value={assetForm.propertyType}
                          onChange={e =>
                            setAssetForm({ ...assetForm, propertyType: e.target.value })
                          }
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="house">House</option>
                          <option value="condo">Condo</option>
                          <option value="land">Land</option>
                          <option value="commercial">Commercial</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="squareFeet"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Square Feet (Optional)
                        </label>
                        <input
                          type="number"
                          id="squareFeet"
                          value={assetForm.squareFeet}
                          onChange={e => setAssetForm({ ...assetForm, squareFeet: e.target.value })}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={assetForm.location}
                      onChange={e => setAssetForm({ ...assetForm, location: e.target.value })}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Home, Storage, etc."
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="insuranceValue"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Insurance Value (Optional)
                    </label>
                    <input
                      type="number"
                      id="insuranceValue"
                      value={assetForm.insuranceValue}
                      onChange={e => setAssetForm({ ...assetForm, insuranceValue: e.target.value })}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="assetDescription"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Notes (Optional)
                  </label>
                  <textarea
                    id="assetDescription"
                    value={assetForm.description}
                    onChange={e => setAssetForm({ ...assetForm, description: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                  loading={loading}
                >
                  {loading ? 'Adding Asset...' : 'Add Asset'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'liability' && (
          <Card variant="elevated">
            <CardContent>
              <form onSubmit={handleLiabilitySubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="liabilityName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Liability Name
                  </label>
                  <input
                    type="text"
                    id="liabilityName"
                    value={liabilityForm.name}
                    onChange={e => setLiabilityForm({ ...liabilityForm, name: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="liabilityAmount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Amount
                  </label>
                  <input
                    type="number"
                    id="liabilityAmount"
                    value={liabilityForm.amount}
                    onChange={e => setLiabilityForm({ ...liabilityForm, amount: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label
                    htmlFor="liabilityType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Type
                  </label>
                  <select
                    id="liabilityType"
                    value={liabilityForm.type}
                    onChange={e => setLiabilityForm({ ...liabilityForm, type: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="loan">Loan</option>
                    <option value="credit card">Credit Card</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                  loading={loading}
                >
                  {loading ? 'Adding Liability...' : 'Add Liability'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'debt' && (
          <Card variant="elevated">
            <CardContent>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!firebaseUser) {
                    toast.error('Please sign in to add debts');
                    return;
                  }
                  setLoading(true);
                  try {
                    const idToken = await firebaseUser.getIdToken();
                    const response = await fetch('/api/manual-data', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                      },
                      body: JSON.stringify({
                        type: 'informalDebts',
                        data: { ...debtForm, amount: parseFloat(debtForm.amount) },
                      }),
                    });
                    if (!response.ok) throw new Error('Failed to add debt');
                    toast.success('Debt added successfully');
                    setDebtForm({
                      person: '',
                      amount: '',
                      type: 'i_owe',
                      reason: '',
                      dueDate: '',
                      reminders: false,
                    });
                    router.refresh();
                  } catch (error) {
                    toast.error('Failed to add debt');
                    console.error(error);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="debtType" className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    id="debtType"
                    value={debtForm.type}
                    onChange={e =>
                      setDebtForm({ ...debtForm, type: e.target.value as 'owed_to_me' | 'i_owe' })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="i_owe">I Owe</option>
                    <option value="owed_to_me">Owed to Me</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="person" className="block text-sm font-medium text-gray-700">
                    Person
                  </label>
                  <input
                    type="text"
                    id="person"
                    value={debtForm.person}
                    onChange={e => setDebtForm({ ...debtForm, person: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="debtAmount" className="block text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      id="debtAmount"
                      value={debtForm.amount}
                      onChange={e => setDebtForm({ ...debtForm, amount: e.target.value })}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      value={debtForm.dueDate}
                      onChange={e => setDebtForm({ ...debtForm, dueDate: e.target.value })}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <textarea
                    id="reason"
                    value={debtForm.reason}
                    onChange={e => setDebtForm({ ...debtForm, reason: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Loan for car repair"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reminders"
                    checked={debtForm.reminders}
                    onChange={e => setDebtForm({ ...debtForm, reminders: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="reminders" className="ml-2 block text-sm text-gray-700">
                    Enable reminders
                  </label>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                  loading={loading}
                >
                  {loading ? 'Adding Debt...' : 'Add Debt'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'transaction' && (
          <Card variant="elevated">
            <CardContent>
              <form onSubmit={handleTransactionSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="transactionAccount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Account
                  </label>
                  <select
                    id="transactionAccount"
                    value={transactionForm.accountId}
                    onChange={e =>
                      setTransactionForm({ ...transactionForm, accountId: e.target.value || '' })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    disabled={loading || liquidAccounts.length === 0}
                  >
                    <option value="">Select Account</option>
                    {liquidAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                  {liquidAccounts.length === 0 && !loading && (
                    <p className="text-xs text-gray-500 mt-1">
                      No cash accounts found. Please add a cash-like asset first (e.g., Checking
                      Account, Savings Account, Cash, Wallet).
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="transactionType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Type
                    </label>
                    <select
                      id="transactionType"
                      value={transactionForm.type}
                      onChange={e =>
                        setTransactionForm({ ...transactionForm, type: e.target.value })
                      }
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="transactionAmount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Amount
                    </label>
                    <input
                      type="number"
                      id="transactionAmount"
                      value={transactionForm.amount}
                      onChange={e =>
                        setTransactionForm({ ...transactionForm, amount: e.target.value })
                      }
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="transactionCategory"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    id="transactionCategory"
                    placeholder="E.g., Groceries, Salary, Utilities"
                    value={transactionForm.category}
                    onChange={e =>
                      setTransactionForm({ ...transactionForm, category: e.target.value })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="transactionDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      id="transactionDate"
                      value={transactionForm.date}
                      onChange={e =>
                        setTransactionForm({ ...transactionForm, date: e.target.value })
                      }
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="transactionRecurrence"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Recurrence
                    </label>
                    <select
                      id="transactionRecurrence"
                      value={transactionForm.recurrence}
                      onChange={e =>
                        setTransactionForm({ ...transactionForm, recurrence: e.target.value })
                      }
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="none">One-time</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="transactionDescription"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="transactionDescription"
                    value={transactionForm.description}
                    onChange={e =>
                      setTransactionForm({ ...transactionForm, description: e.target.value })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading || (activeTab === 'transaction' && liquidAccounts.length === 0)}
                  loading={loading}
                >
                  {loading ? 'Adding Transaction...' : 'Add Transaction'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
