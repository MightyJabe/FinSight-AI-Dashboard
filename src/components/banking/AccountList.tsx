'use client';

import React from 'react';
import useSWR from 'swr';

import { Skeleton } from '@/components/common/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { BankingAccount } from '@/lib/banking/types';
import { formatCurrency } from '@/lib/utils';

const fetcher = async (url: string, token: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
};

export function AccountList() {
    const { user, loading: authLoading } = useAuth();

    const { data, error, isLoading } = useSWR(
        user ? ['/api/banking/accounts', user] : null,
        ([url, user]) => user.getIdToken().then(token => fetcher(url, token))
    );

    if (authLoading || isLoading) {
        return <Skeleton className="w-full h-40" />;
    }

    if (error) {
        return <div className="text-red-500">Failed to load accounts</div>;
    }

    const accounts: BankingAccount[] = data?.accounts || [];

    if (accounts.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>No Accounts Connected</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Link your bank account to see your financial overview.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map(account => (
                <Card key={account.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {account.name}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">{account.institutionName}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(account.balance.current, account.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {account.type} - {account.mask ? `...${account.mask}` : ''}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
