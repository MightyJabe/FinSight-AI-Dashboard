import { useRef } from 'react';

interface FabModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalTab: 'transaction' | 'asset' | 'liability';
  onTabChange: (tab: 'transaction' | 'asset' | 'liability') => void;
  txnForm: {
    type: string;
    amount: string;
    category: string;
    date: string;
    recurrence: string;
    description: string;
  };
  onTxnFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onTxnSubmit: (e: React.FormEvent) => void;
  txnLoading: boolean;
  modalAssetForm: {
    name: string;
    amount: string;
    type: string;
    description: string;
  };
  onModalAssetFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onModalAssetSubmit: (e: React.FormEvent) => void;
  modalAssetLoading: boolean;
  modalLiabilityForm: {
    name: string;
    amount: string;
    type: string;
  };
  onModalLiabilityFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onModalLiabilitySubmit: (e: React.FormEvent) => void;
  modalLiabilityLoading: boolean;
}

/**
 *
 */
export function FabModal({
  isOpen,
  onClose,
  modalTab,
  onTabChange,
  txnForm,
  onTxnFormChange,
  onTxnSubmit,
  txnLoading,
  modalAssetForm,
  onModalAssetFormChange,
  onModalAssetSubmit,
  modalAssetLoading,
  modalLiabilityForm,
  onModalLiabilityFormChange,
  onModalLiabilitySubmit,
  modalLiabilityLoading,
}: FabModalProps) {
  const fabRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* Floating Action Button */}
      <button
        ref={fabRef}
        className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl focus:outline-none"
        onClick={() => onTabChange('transaction')}
        aria-label="Add"
      >
        +
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex mb-6 border-b">
              <button
                className={`flex-1 py-3 text-base font-semibold ${modalTab === 'transaction' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                onClick={() => onTabChange('transaction')}
              >
                Add Expense/Income
              </button>
              <button
                className={`flex-1 py-3 text-base font-semibold ${modalTab === 'asset' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                onClick={() => onTabChange('asset')}
              >
                Add Asset
              </button>
              <button
                className={`flex-1 py-3 text-base font-semibold ${modalTab === 'liability' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                onClick={() => onTabChange('liability')}
              >
                Add Liability
              </button>
            </div>

            {modalTab === 'transaction' && (
              <form onSubmit={onTxnSubmit} className="space-y-6">
                <div className="flex gap-3">
                  <select
                    name="type"
                    value={txnForm.type}
                    onChange={onTxnFormChange}
                    className="border rounded-lg px-3 py-2 text-base"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount"
                    value={txnForm.amount}
                    onChange={onTxnFormChange}
                    className="w-40 border rounded-lg px-3 py-2 text-base"
                    required
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    value={txnForm.category}
                    onChange={onTxnFormChange}
                    className="flex-1 border rounded-lg px-3 py-2 text-base"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    type="date"
                    name="date"
                    value={txnForm.date}
                    onChange={onTxnFormChange}
                    className="border rounded-lg px-3 py-2 text-base"
                    required
                  />
                  <select
                    name="recurrence"
                    value={txnForm.recurrence}
                    onChange={onTxnFormChange}
                    className="border rounded-lg px-3 py-2 text-base"
                  >
                    <option value="none">One-time</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <textarea
                  name="description"
                  placeholder="Description (optional)"
                  value={txnForm.description}
                  onChange={onTxnFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-base"
                  rows={2}
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-base disabled:opacity-50"
                  disabled={txnLoading}
                >
                  {txnLoading ? 'Adding...' : 'Add Transaction'}
                </button>
              </form>
            )}

            {modalTab === 'asset' && (
              <form onSubmit={onModalAssetSubmit} className="space-y-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Asset Name"
                    value={modalAssetForm.name}
                    onChange={onModalAssetFormChange}
                    className="flex-1 border rounded-lg px-3 py-2 text-base"
                    required
                  />
                  <input
                    type="number"
                    name="amount"
                    placeholder="Value"
                    value={modalAssetForm.amount}
                    onChange={onModalAssetFormChange}
                    className="w-40 border rounded-lg px-3 py-2 text-base"
                    required
                    min="0"
                    step="0.01"
                  />
                  <select
                    name="type"
                    value={modalAssetForm.type}
                    onChange={onModalAssetFormChange}
                    className="border rounded-lg px-3 py-2 text-base"
                  >
                    <option value="real_estate">Real Estate</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="investment">Investment</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <textarea
                  name="description"
                  placeholder="Description (optional)"
                  value={modalAssetForm.description}
                  onChange={onModalAssetFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-base"
                  rows={2}
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-base disabled:opacity-50"
                  disabled={modalAssetLoading}
                >
                  {modalAssetLoading ? 'Adding...' : 'Add Asset'}
                </button>
              </form>
            )}

            {modalTab === 'liability' && (
              <form onSubmit={onModalLiabilitySubmit} className="space-y-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Liability Name"
                    value={modalLiabilityForm.name}
                    onChange={onModalLiabilityFormChange}
                    className="flex-1 border rounded-lg px-3 py-2 text-base"
                    required
                  />
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount"
                    value={modalLiabilityForm.amount}
                    onChange={onModalLiabilityFormChange}
                    className="w-40 border rounded-lg px-3 py-2 text-base"
                    required
                    min="0"
                    step="0.01"
                  />
                  <select
                    name="type"
                    value={modalLiabilityForm.type}
                    onChange={onModalLiabilityFormChange}
                    className="border rounded-lg px-3 py-2 text-base"
                  >
                    <option value="loan">Loan</option>
                    <option value="credit card">Credit Card</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-base disabled:opacity-50"
                  disabled={modalLiabilityLoading}
                >
                  {modalLiabilityLoading ? 'Adding...' : 'Add Liability'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
