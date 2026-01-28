'use client';

import { AlertTriangle, Building2, CheckCircle2,Loader2, Shield } from 'lucide-react';
import React, { useCallback,useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { usePlaidLink } from 'react-plaid-link';

import { Button, Input, Modal, Select } from '@/components/ui';
import { useAuth } from '@/lib/auth';

// Bank-specific login field configurations from israeli-bank-scrapers
const BANK_CONFIGS: Record<string, { name: string; fields: { key: string; label: string; type?: string; placeholder?: string }[] }> = {
    hapoalim: {
        name: 'Bank Hapoalim',
        fields: [
            { key: 'userCode', label: 'User Code', placeholder: 'Enter your user code' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' }
        ]
    },
    leumi: {
        name: 'Bank Leumi',
        fields: [
            { key: 'username', label: 'Username', placeholder: 'Enter your username' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' }
        ]
    },
    discount: {
        name: 'Discount Bank',
        fields: [
            { key: 'id', label: 'ID Number', placeholder: 'Enter your ID' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            { key: 'num', label: 'Personal Code', placeholder: 'Personal code' }
        ]
    },
    mizrahi: {
        name: 'Mizrahi Tefahot',
        fields: [
            { key: 'username', label: 'Username', placeholder: 'Enter your username' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' }
        ]
    },
    max: {
        name: 'Max',
        fields: [
            { key: 'username', label: 'Username', placeholder: 'Enter your username' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' }
        ]
    },
    isracard: {
        name: 'Isracard',
        fields: [
            { key: 'id', label: 'ID Number', placeholder: 'Enter your ID' },
            { key: 'card6Digits', label: 'Last 6 Digits of Card', placeholder: '123456' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' }
        ]
    }
};

interface AddBankModalProps {
    onSuccess?: () => void;
}

export function AddBankModal({ onSuccess }: AddBankModalProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [provider, setProvider] = useState<'plaid' | 'israel'>('israel'); // Default to Israel for this context
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'authenticating' | 'scraping' | 'success' | 'error'>('idle');

    // Israel Form State
    const [israelBank, setIsraelBank] = useState('hapoalim');
    const [credentials, setCredentials] = useState<Record<string, string>>({});

    // Fetch Link Token for Plaid
    useEffect(() => {
        if (provider === 'plaid' && user && !linkToken) {
            const fetchLinkToken = async () => {
                try {
                    const token = user.getIdToken ? await user.getIdToken() : '';
                    const r = await fetch('/api/banking/connect', {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await r.json();
                    setLinkToken(data.link_token);
                } catch (err) {
                    console.error('Failed to fetch link token', err);
                }
            };
            fetchLinkToken();
        }
    }, [provider, user, linkToken]);

    const onPlaidSuccess = useCallback(async (public_token: string) => {
        setIsProcessing(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/banking/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ provider: 'plaid', publicToken: public_token })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Plaid account connected!');
                setIsOpen(false);
                onSuccess?.();
            } else {
                toast.error(`Connection failed: ${data.error}`);
            }
        } catch {
            toast.error('Connection error');
        } finally {
            setIsProcessing(false);
        }
    }, [user, onSuccess]);

    const { open: openPlaid, ready: plaidReady } = usePlaidLink({
        token: linkToken,
        onSuccess: onPlaidSuccess,
    });

    const handleIsraelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setConnectionStatus('connecting');

        try {
            const token = await user?.getIdToken();
            setConnectionStatus('authenticating');

            const res = await fetch('/api/banking/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    provider: 'israel',
                    companyId: israelBank,
                    credentials
                })
            });

            setConnectionStatus('scraping');
            const data = await res.json();

            if (data.success) {
                setConnectionStatus('success');
                toast.success(`Connected! Found ${data.accountsCount} account(s) with ${data.transactionsCount} transactions.`);
                setTimeout(() => {
                    setIsOpen(false);
                    setCredentials({});
                    setConnectionStatus('idle');
                    onSuccess?.();
                }, 1500);
            } else {
                setConnectionStatus('error');
                toast.error(`Connection failed: ${data.error}`);
                setTimeout(() => setConnectionStatus('idle'), 2000);
            }
        } catch {
            setConnectionStatus('error');
            toast.error('Scraper connection error');
            setTimeout(() => setConnectionStatus('idle'), 2000);
        } finally {
            setIsProcessing(false);
        }
    };

    // Reset credentials when bank changes
    const handleBankChange = (newBank: string) => {
        setIsraelBank(newBank);
        setCredentials({});
    };

    const currentBankConfig = BANK_CONFIGS[israelBank]!;

    const getStatusMessage = () => {
        switch (connectionStatus) {
            case 'connecting': return 'Initializing connection...';
            case 'authenticating': return 'A browser window will open. Please complete 2FA if prompted...';
            case 'scraping': return 'Fetching your accounts and transactions...';
            case 'success': return 'Success! Saving your data...';
            case 'error': return 'Connection failed. Please try again.';
            default: return null;
        }
    };

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2"
            >
                <Building2 className="w-4 h-4" />
                Connect Bank
            </Button>
            <Modal
                isOpen={isOpen}
                onClose={() => !isProcessing && setIsOpen(false)}
                title="Connect Bank Account"
                size="md"
            >
                <div className="space-y-6">
                    {/* Provider Selection Tabs */}
                    <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                        <button
                            type="button"
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${provider === 'israel'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            onClick={() => setProvider('israel')}
                        >
                            🇮🇱 Israeli Banks
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${provider === 'plaid'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            onClick={() => setProvider('plaid')}
                        >
                            🌍 Global (Plaid)
                        </button>
                    </div>

                    {provider === 'plaid' ? (
                        <div className="text-center py-6">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Connect to banks in US, UK, Canada, and Europe via Plaid&apos;s secure connection.
                            </p>
                            <Button
                                onClick={() => openPlaid()}
                                disabled={!plaidReady || isProcessing}
                                className="w-full"
                            >
                                {isProcessing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                                Launch Plaid Link
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* 2FA Warning Banner */}
                            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-800 dark:text-amber-200">
                                    <strong>2FA Required:</strong> A browser window will open for authentication.
                                    If your bank requires SMS verification, please enter the code when prompted.
                                </div>
                            </div>

                            {/* Status Message */}
                            {connectionStatus !== 'idle' && (
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${connectionStatus === 'success'
                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                        : connectionStatus === 'error'
                                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                    }`}>
                                    {connectionStatus === 'success' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    ) : connectionStatus === 'error' ? (
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    ) : (
                                        <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                                    )}
                                    <span className={`text-sm ${connectionStatus === 'success' ? 'text-green-800 dark:text-green-200' :
                                            connectionStatus === 'error' ? 'text-red-800 dark:text-red-200' :
                                                'text-blue-800 dark:text-blue-200'
                                        }`}>
                                        {getStatusMessage()}
                                    </span>
                                </div>
                            )}

                            <form onSubmit={handleIsraelSubmit} className="space-y-4">
                                {/* Bank Selection */}
                                <div className="space-y-2">
                                    <label htmlFor="bank" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Select Your Bank
                                    </label>
                                    <Select
                                        value={israelBank}
                                        onChange={(e) => handleBankChange(e.target.value)}
                                        disabled={isProcessing}
                                    >
                                        {Object.entries(BANK_CONFIGS).map(([key, config]) => (
                                            <option key={key} value={key}>{config.name}</option>
                                        ))}
                                    </Select>
                                </div>

                                {/* Dynamic Credential Fields */}
                                {currentBankConfig.fields.map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {field.label}
                                        </label>
                                        <Input
                                            id={field.key}
                                            type={field.type || 'text'}
                                            placeholder={field.placeholder}
                                            value={credentials[field.key] || ''}
                                            onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            required
                                            disabled={isProcessing}
                                            className="w-full"
                                        />
                                    </div>
                                ))}

                                {/* Security Notice */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>Your credentials are encrypted and never stored in plain text.</span>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2 w-4 h-4" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Building2 className="mr-2 w-4 h-4" />
                                            Connect & Import Data
                                        </>
                                    )}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
}
