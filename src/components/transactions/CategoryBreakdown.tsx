'use client';

import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  ChartType,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import { useEffect, useRef } from 'react';
import { Pie } from 'react-chartjs-2';

import type { Transaction } from '@/lib/finance';
import { getCategoryColor } from '@/utils/category-color';
import { formatCurrency, formatPercentage } from '@/utils/format';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CategoryBreakdownProps {
  transactions: Transaction[];
}

/**
 * Displays income and expense breakdowns by category using pie charts
 */
export function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
  const incomeChartRef = useRef<ChartJS<'pie'>>(null);
  const expensesChartRef = useRef<ChartJS<'pie'>>(null);

  // Cleanup Chart.js instances on unmount
  useEffect(() => {
    const incomeChart = incomeChartRef.current;
    const expensesChart = expensesChartRef.current;

    return () => {
      if (incomeChart) {
        incomeChart.destroy();
      }
      if (expensesChart) {
        expensesChart.destroy();
      }
    };
  }, []);

  // Calculate totals by category
  const categoryTotals = transactions.reduce(
    (acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate total income and expenses
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Get income categories and their colors
  const incomeCategories = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .map(([category]) => category);

  // Get expense categories and their colors
  const expenseCategories = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount < 0)
    .map(([category]) => category);

  // Prepare data for income pie chart
  const incomeData = {
    labels: incomeCategories,
    datasets: [
      {
        data: Object.entries(categoryTotals)
          .filter(([_, amount]) => amount > 0)
          .map(([_, amount]) => amount),
        backgroundColor: incomeCategories.map(category => {
          const color = getCategoryColor(category);
          return `rgb(var(--${color}))`;
        }),
      },
    ],
  };

  // Prepare data for expenses pie chart
  const expensesData = {
    labels: expenseCategories,
    datasets: [
      {
        data: Object.entries(categoryTotals)
          .filter(([_, amount]) => amount < 0)
          .map(([_, amount]) => Math.abs(amount)),
        backgroundColor: expenseCategories.map(category => {
          const color = getCategoryColor(category);
          return `rgb(var(--${color}))`;
        }),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<ChartType>) => {
            const value = context.raw as number;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = (value / total) * 100;
            return `${context.label}: ${formatCurrency(value)} (${formatPercentage(percentage)})`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Income</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          <div className="h-64 mt-4">
            <Pie data={incomeData} options={chartOptions} ref={incomeChartRef} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Expenses</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          <div className="h-64 mt-4">
            <Pie data={expensesData} options={chartOptions} ref={expensesChartRef} />
          </div>
        </div>
      </div>

      {/* Category Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Category Details</h3>
        <div className="space-y-4">
          {Object.entries(categoryTotals)
            .sort(([_, a], [__, b]) => Math.abs(b) - Math.abs(a))
            .map(([category, amount]) => {
              const isIncome = amount > 0;
              const percentage = isIncome
                ? (amount / totalIncome) * 100
                : (Math.abs(amount) / totalExpenses) * 100;
              const color = getCategoryColor(category);

              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{category}</p>
                      <p className="text-sm text-gray-500">
                        {formatPercentage(percentage)} of {isIncome ? 'income' : 'expenses'}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(amount)}
                    </p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full bg-${color}`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
