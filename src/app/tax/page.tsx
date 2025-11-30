'use client';

import { useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function TaxPage() {
  const { firebaseUser: user } = useSession();
  const [activeTab, setActiveTab] = useState('deductions');
  const [loading, setLoading] = useState(false);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);

  const analyzeDeductions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/tax/analyze-deductions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year: new Date().getFullYear() }),
      });
      const data = await response.json();
      if (data.success) {
        setDeductions(data.deductibleExpenses);
      }
    } catch (error) {
      console.error('Error analyzing deductions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEstimates = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/tax/quarterly-estimates', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          income: 100000,
          deductions: 20000,
          filingStatus: 'single',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setEstimates(data.estimates);
      }
    } catch (error) {
      console.error('Error generating estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStrategies = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/tax/strategies', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          income: 100000,
          age: 35,
          has401k: true,
          hasHSA: false,
          investmentAccounts: 50000,
          charitableGiving: 5000,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setStrategies(data.strategies);
      }
    } catch (error) {
      console.error('Error generating strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Tax Intelligence</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="deductions">Deductible Expenses</TabsTrigger>
            <TabsTrigger value="estimates">Quarterly Estimates</TabsTrigger>
            <TabsTrigger value="strategies">Tax Strategies</TabsTrigger>
          </TabsList>

          <TabsContent value="deductions">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Tax-Deductible Expenses</h2>
                <Button onClick={analyzeDeductions} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Analyze Transactions'}
                </Button>
              </div>
              {deductions.length > 0 ? (
                <div className="space-y-4">
                  {deductions.map((deduction, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{deduction.merchant}</p>
                          <p className="text-sm text-gray-600">{deduction.deductionType}</p>
                          <p className="text-xs text-gray-500 mt-1">{deduction.notes}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${deduction.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round(deduction.confidence * 100)}% confidence
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <p className="text-lg font-semibold">
                      Total Deductible: $
                      {deductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  No deductions analyzed yet. Click &quot;Analyze Transactions&quot; to start.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="estimates">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Quarterly Tax Estimates</h2>
                <Button onClick={generateEstimates} disabled={loading}>
                  {loading ? 'Calculating...' : 'Generate Estimates'}
                </Button>
              </div>
              {estimates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {estimates.map(estimate => (
                    <div key={estimate.quarter} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">
                        Q{estimate.quarter} {estimate.year}
                      </h3>
                      <p className="text-sm text-gray-600">Due: {estimate.dueDate}</p>
                      <p className="text-2xl font-bold mt-2">${estimate.estimatedTax.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Income: ${estimate.estimatedIncome.toFixed(2)} | Deductions: $
                        {estimate.estimatedDeductions.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No estimates generated yet. Click &quot;Generate Estimates&quot; to start.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="strategies">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Tax Optimization Strategies</h2>
                <Button onClick={generateStrategies} disabled={loading}>
                  {loading ? 'Generating...' : 'Get Strategies'}
                </Button>
              </div>
              {strategies.length > 0 ? (
                <div className="space-y-4">
                  {strategies.map(strategy => (
                    <div key={strategy.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{strategy.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            strategy.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : strategy.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {strategy.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{strategy.description}</p>
                      <p className="text-lg font-bold text-green-600 mb-2">
                        Potential Savings: ${strategy.potentialSavings.toFixed(2)}
                      </p>
                      {strategy.actionItems && strategy.actionItems.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Action Items:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {strategy.actionItems.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No strategies generated yet. Click &quot;Get Strategies&quot; to start.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
