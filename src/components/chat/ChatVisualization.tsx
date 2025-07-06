import { BarChart3, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

interface ChatVisualizationProps {
  data: any;
  type?: 'spending' | 'networth' | 'budget' | 'trend' | 'accounts' | 'transactions';
}

export function ChatVisualization({ data, type }: ChatVisualizationProps) {
  if (!data) return null;

  // Net Worth Visualization
  if (type === 'networth' && data.netWorth !== undefined) {
    return (
      <div className="mt-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Net Worth Analysis</h3>
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-green-600">
              ${data.assets?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Liabilities</p>
            <p className="text-2xl font-bold text-red-600">
              ${data.liabilities?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Net Worth</p>
            <p className={`text-2xl font-bold ${data.netWorth >= 0 ? 'text-primary' : 'text-red-600'}`}>
              ${data.netWorth?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Spending by Category Visualization
  if (type === 'spending' && Array.isArray(data)) {
    const totalSpending = data.reduce((sum, item) => sum + item.amount, 0);
    
    return (
      <div className="mt-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Spending Breakdown</h3>
          <BarChart3 className="h-5 w-5 text-blue-600" />
        </div>
        
        <div className="space-y-3">
          {data.slice(0, 5).map((item, index) => {
            const percentage = (item.amount / totalSpending) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                    <span className="font-semibold">${item.amount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {data.length > 5 && (
          <p className="text-sm text-gray-600 mt-3">
            And {data.length - 5} more categories...
          </p>
        )}
        
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Spending</span>
            <span className="text-xl font-bold text-blue-600">
              ${totalSpending.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Account Balances Visualization
  if (type === 'accounts' && Array.isArray(data)) {
    const totalBalance = data.reduce((sum, account) => sum + account.balance, 0);
    
    return (
      <div className="mt-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Account Balances</h3>
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((account, index) => (
            <div key={index} className="bg-white/80 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{account.name}</p>
                <p className="text-sm text-gray-600">{account.type}</p>
              </div>
              <p className={`font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${account.balance.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Balance</span>
            <span className="text-xl font-bold text-green-600">
              ${totalBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Monthly Summary Visualization
  if (data.income !== undefined && data.expenses !== undefined) {
    const savings = data.income - data.expenses;
    const savingsRate = data.income > 0 ? (savings / data.income) * 100 : 0;
    
    return (
      <div className="mt-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Summary</h3>
          {savings >= 0 ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Income</p>
            <p className="text-xl font-bold text-green-600">
              ${data.income.toLocaleString()}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Expenses</p>
            <p className="text-xl font-bold text-red-600">
              ${data.expenses.toLocaleString()}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Savings</p>
            <p className={`text-xl font-bold ${savings >= 0 ? 'text-primary' : 'text-red-600'}`}>
              ${savings.toLocaleString()}
            </p>
          </div>
        </div>
        
        {data.income > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Savings Rate</span>
              <span className={`font-medium ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  savingsRate >= 20 ? 'bg-green-500' : savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.abs(savingsRate))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Recent Transactions Visualization
  if (type === 'transactions' && Array.isArray(data)) {
    return (
      <div className="mt-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <BarChart3 className="h-5 w-5 text-indigo-600" />
        </div>
        
        <div className="space-y-2">
          {data.slice(0, 5).map((txn, index) => (
            <div key={index} className="bg-white/80 rounded-lg p-3 flex justify-between items-center">
              <div className="flex-1">
                <p className="font-medium text-gray-900 truncate">{txn.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{new Date(txn.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="truncate">{txn.category}</span>
                </div>
              </div>
              <p className={`font-bold whitespace-nowrap ml-2 ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {txn.amount > 0 ? '+' : ''}${txn.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        
        {data.length > 5 && (
          <p className="text-sm text-gray-600 mt-3 text-center">
            Showing 5 of {data.length} transactions
          </p>
        )}
      </div>
    );
  }

  // Financial Health Score Visualization
  if (data.overallScore !== undefined) {
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };
    
    const getScoreGradient = (score: number) => {
      if (score >= 80) return 'from-green-500 to-green-600';
      if (score >= 60) return 'from-yellow-500 to-yellow-600';
      return 'from-red-500 to-red-600';
    };
    
    return (
      <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Financial Health Score</h3>
          <div className={`text-3xl font-bold ${getScoreColor(data.overallScore)}`}>
            {data.overallScore}/100
          </div>
        </div>
        
        <div className="relative pt-1">
          <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-white">
            <div
              style={{ width: `${data.overallScore}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r ${getScoreGradient(data.overallScore)} transition-all duration-500`}
            />
          </div>
        </div>
        
        {data.factors && data.factors.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Contributing Factors:</p>
            {data.factors.map((factor: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-sm text-gray-600">{factor}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default/Generic Data Display
  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm">
      <pre className="whitespace-pre-wrap text-gray-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}