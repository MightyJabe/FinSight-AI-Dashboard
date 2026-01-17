import { useCallback, useState } from 'react';
import useSWR from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import type {
  RetirementProjection,
  RetirementRecommendation,
} from '@/lib/services/israeli-retirement-calculator';

export interface RetirementInputs {
  currentAge: number;
  gender: 'male' | 'female';
  currentSalary: number;
  yearsWorked: number;
  desiredMonthlyIncome: number;
  earlyRetirement: boolean;
  expectedReturnRate?: number;
  inflationRate?: number;
}

interface RetirementCalculationResponse {
  success: boolean;
  data: {
    projection: RetirementProjection;
    recommendations: RetirementRecommendation[];
    inputs: RetirementInputs & {
      pensionFundsCount: number;
      totalPensionValue: number;
      additionalSavings: number;
    };
  };
  error?: string;
}

interface RetirementDataResponse {
  success: boolean;
  data: {
    savedSettings: Partial<RetirementInputs>;
    pensionFunds: {
      count: number;
      totalValue: number;
      byType: Record<string, number>;
    };
  };
}

export function useRetirement() {
  const { firebaseUser } = useSession();
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<RetirementCalculationResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(
    async (url: string) => {
      if (!firebaseUser) throw new Error('No auth');
      const token = await firebaseUser.getIdToken();
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
    [firebaseUser]
  );

  const { data, isLoading, mutate } = useSWR<RetirementDataResponse>(
    firebaseUser ? '/api/retirement/calculate' : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const calculate = useCallback(
    async (inputs: RetirementInputs) => {
      if (!firebaseUser) return;
      setIsCalculating(true);
      setError(null);

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/retirement/calculate', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inputs),
        });

        const result: RetirementCalculationResponse = await response.json();

        if (result.success) {
          setCalculationResult(result.data);
        } else {
          setError(result.error || 'Calculation failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Calculation failed');
      } finally {
        setIsCalculating(false);
      }
    },
    [firebaseUser]
  );

  const reset = useCallback(() => {
    setCalculationResult(null);
    setError(null);
  }, []);

  return {
    savedSettings: data?.data?.savedSettings ?? null,
    pensionFunds: data?.data?.pensionFunds ?? null,
    projection: calculationResult?.projection ?? null,
    recommendations: calculationResult?.recommendations ?? [],
    enrichedInputs: calculationResult?.inputs ?? null,
    isLoading,
    isCalculating,
    error,
    calculate,
    reset,
    refresh: mutate,
  };
}
