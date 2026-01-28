'use client';

import { Building2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ConnectBankCTAProps {
  accountCount: number;
  onConnect: () => void;
}

export function ConnectBankCTA({ accountCount, onConnect }: ConnectBankCTAProps) {
  if (accountCount === 0) {
    return (
      <div className="p-8 rounded-2xl bg-card border-2 border-dashed border-border text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Connect Your Bank Account</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Link your bank accounts to see your total net worth. We support major banks including
          Hapoalim, Leumi, Discount, Mizrahi-Tefahot, and more.
        </p>
        <Button onClick={onConnect} variant="primary" size="lg">
          <Plus className="w-4 h-4" />
          Connect Bank Account
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <Button onClick={onConnect} variant="outline" size="sm">
        <Plus className="w-4 h-4" />
        Add Another Account
      </Button>
    </div>
  );
}
