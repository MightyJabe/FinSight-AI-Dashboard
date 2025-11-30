'use client';

import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useSession } from '@/components/providers/SessionProvider';
import { uploadReceipt } from '@/lib/firebase-storage';

const QUICK_CATEGORIES = [
  { name: 'Coffee', icon: '☕', amount: 5 },
  { name: 'Lunch', icon: '🍔', amount: 15 },
  { name: 'Gas', icon: '⛽', amount: 50 },
  { name: 'Groceries', icon: '🛒', amount: 100 },
  { name: 'Transport', icon: '🚗', amount: 20 },
  { name: 'Other', icon: '💰', amount: 0 },
];

export default function QuickCashEntry() {
  const { firebaseUser } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAccounts = async () => {
    if (!firebaseUser || accounts.length > 0) return;
    try {
      const response = await fetch('/api/liquid-assets', {
        headers: { Authorization: `Bearer ${await firebaseUser.getIdToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data || []);
        if (data.length > 0) setSelectedAccount(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleQuickEntry = async (category: string, amount: number, receiptUrl?: string) => {
    if (!firebaseUser) {
      toast.error('Please sign in');
      return;
    }

    if (!selectedAccount) {
      await loadAccounts();
      setIsExpanded(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/manual-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
        },
        body: JSON.stringify({
          type: 'transactions',
          data: {
            type: 'expense',
            amount,
            category,
            date: new Date().toISOString().split('T')[0],
            recurrence: 'none',
            description: `Quick entry: ${category}`,
            accountId: selectedAccount,
            receiptUrl,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to add transaction');
      toast.success(`${category} - $${amount} added`);
      setIsOpen(false);
      setIsExpanded(false);
    } catch (error) {
      toast.error('Failed to add transaction');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomEntry = async () => {
    if (!customAmount || !customCategory) {
      toast.error('Please enter amount and category');
      return;
    }

    let receiptUrl = '';
    if (receiptFile && firebaseUser) {
      try {
        receiptUrl = await uploadReceipt(firebaseUser.uid, receiptFile);
        toast.success('Receipt uploaded');
      } catch (error) {
        console.error('Receipt upload failed:', error);
        toast.error('Receipt upload failed, but transaction will be saved');
      }
    }

    await handleQuickEntry(customCategory, parseFloat(customAmount), receiptUrl);
    setCustomAmount('');
    setCustomCategory('');
    setReceiptFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Max 5MB');
        return;
      }
      setReceiptFile(file);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          loadAccounts();
        }}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-50 transition-all"
        aria-label="Quick cash entry"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 p-4 w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Quick Cash Entry</h3>
        <button
          onClick={() => {
            setIsOpen(false);
            setIsExpanded(false);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {accounts.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {QUICK_CATEGORIES.map(cat => (
          <button
            key={cat.name}
            onClick={() => handleQuickEntry(cat.name, cat.amount || 0)}
            disabled={loading || !selectedAccount}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50"
          >
            <span className="text-2xl mb-1">{cat.icon}</span>
            <span className="text-xs font-medium text-gray-700">{cat.name}</span>
            {cat.amount > 0 && <span className="text-xs text-gray-500">${cat.amount}</span>}
          </button>
        ))}
      </div>

      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Custom Amount
        </button>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Category"
            value={customCategory}
            onChange={e => setCustomCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="number"
            placeholder="Amount"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            step="0.01"
          />
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              {receiptFile ? `📷 ${receiptFile.name}` : '📷 Add Receipt (Optional)'}
            </button>
          </div>
          <button
            onClick={handleCustomEntry}
            disabled={loading || !selectedAccount}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            Add Transaction
          </button>
        </div>
      )}

      {accounts.length === 0 && (
        <p className="text-xs text-gray-500 mt-2">
          No cash accounts found. Add one in Manual Data first.
        </p>
      )}
    </div>
  );
}
