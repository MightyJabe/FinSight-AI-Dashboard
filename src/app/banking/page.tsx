import React from 'react';
import { AddBankModal } from '@/components/banking/AddBankModal';
import { AccountList } from '@/components/banking/AccountList';

export default function BankingPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Banking Connections</h1>
                <AddBankModal />
            </div>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
                    <AccountList />
                </section>
            </div>
        </div>
    );
}
