import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';

import { Overview } from '@/lib/finance';
import { getCssVarColor } from '@/utils/get-css-var-color';
import { toRgba } from '@/utils/to-rgba';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsSectionProps {
  overview: Overview;
}

/**
 *
 */
export function ChartsSection({ overview }: ChartsSectionProps) {
  const {
    netWorthHistory,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    accounts,
    manualAssets,
    liabilities,
  } = overview;

  const netWorthChartRef = useRef<ChartJS<'line'>>(null);
  const cashFlowChartRef = useRef<ChartJS<'pie'>>(null);
  const assetAllocationChartRef = useRef<ChartJS<'pie'>>(null);
  const liabilityBreakdownChartRef = useRef<ChartJS<'pie'>>(null);

  const [chartColors, setChartColors] = useState({
    primary: getCssVarColor('--primary'),
    green: getCssVarColor('--green-500'),
    rose: getCssVarColor('--rose-500'),
    blue: getCssVarColor('--blue-600'),
    amber: getCssVarColor('--amber-500'),
    purple: getCssVarColor('--purple-500'),
  });

  useEffect(() => {
    setChartColors({
      primary: getCssVarColor('--primary'),
      green: getCssVarColor('--green-500'),
      rose: getCssVarColor('--rose-500'),
      blue: getCssVarColor('--blue-600'),
      amber: getCssVarColor('--amber-500'),
      purple: getCssVarColor('--purple-500'),
    });
  }, []);

  // Cleanup Chart.js instances on unmount
  useEffect(() => {
    const charts = [
      netWorthChartRef.current,
      cashFlowChartRef.current,
      assetAllocationChartRef.current,
      liabilityBreakdownChartRef.current,
    ];

    return () => {
      charts.forEach(chart => {
        if (chart) {
          chart.destroy();
        }
      });
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 8,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  // Prepare net worth history data
  const netWorthData = {
    labels: netWorthHistory.map(item => item.date),
    datasets: [
      {
        label: 'Net Worth',
        data: netWorthHistory.map(item => item.value),
        borderColor: chartColors.primary,
        backgroundColor: toRgba(chartColors.primary, 0.12), // 12% opacity
        fill: true,
      },
    ],
  };

  // Prepare cash flow data
  const cashFlowData = {
    labels: ['Income', 'Expenses', 'Savings'],
    datasets: [
      {
        data: [monthlyIncome, monthlyExpenses, monthlySavings],
        backgroundColor: [chartColors.green, chartColors.rose, chartColors.blue],
        borderWidth: 0,
      },
    ],
  };

  // Prepare asset allocation data
  const assetAllocationData = {
    labels: [...accounts.map(acc => acc.name), ...manualAssets.map(asset => asset.name)],
    datasets: [
      {
        data: [...accounts.map(acc => acc.balance), ...manualAssets.map(asset => asset.amount)],
        backgroundColor: [
          chartColors.blue,
          chartColors.green,
          chartColors.amber,
          chartColors.purple,
          chartColors.rose,
        ],
        borderWidth: 0,
      },
    ],
  };

  // Prepare liability breakdown data
  const liabilityBreakdownData = {
    labels: liabilities.map(liability => liability.name),
    datasets: [
      {
        data: liabilities.map(liability => liability.amount),
        backgroundColor: [
          chartColors.rose,
          chartColors.amber,
          chartColors.purple,
          chartColors.blue,
        ],
        borderWidth: 0,
      },
    ],
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, type: 'spring', stiffness: 80 },
    }),
  };

  return (
    <div className="space-y-8">
      {/* Net Worth History */}
      <motion.div
        className="bg-card/80 backdrop-blur rounded-xl shadow-lg p-6 border border-border/40 hover:shadow-xl transition-shadow duration-200"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={cardVariants}
        tabIndex={0}
      >
        <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
          Net Worth History
          <span className="text-xs text-muted-foreground font-normal">(trend over time)</span>
        </h3>
        <div className="h-[300px]">
          <Line data={netWorthData} options={lineChartOptions} ref={netWorthChartRef} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monthly Cash Flow */}
        <motion.div
          className="bg-card/80 backdrop-blur rounded-xl shadow-lg p-6 border border-border/40 hover:shadow-xl transition-shadow duration-200"
          initial="hidden"
          animate="visible"
          custom={1}
          variants={cardVariants}
          tabIndex={0}
        >
          <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
            Monthly Cash Flow
            <span className="text-xs text-muted-foreground font-normal">(income vs. expenses)</span>
          </h3>
          <div className="h-[300px]">
            <Pie data={cashFlowData} options={chartOptions} ref={cashFlowChartRef} />
          </div>
        </motion.div>

        {/* Asset Allocation */}
        <motion.div
          className="bg-card/80 backdrop-blur rounded-xl shadow-lg p-6 border border-border/40 hover:shadow-xl transition-shadow duration-200"
          initial="hidden"
          animate="visible"
          custom={2}
          variants={cardVariants}
          tabIndex={0}
        >
          <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
            Asset Allocation
            <span className="text-xs text-muted-foreground font-normal">(portfolio breakdown)</span>
          </h3>
          <div className="h-[300px]">
            <Pie data={assetAllocationData} options={chartOptions} ref={assetAllocationChartRef} />
          </div>
        </motion.div>

        {/* Liability Breakdown */}
        <motion.div
          className="bg-card/80 backdrop-blur rounded-xl shadow-lg p-6 border border-border/40 hover:shadow-xl transition-shadow duration-200"
          initial="hidden"
          animate="visible"
          custom={3}
          variants={cardVariants}
          tabIndex={0}
        >
          <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
            Liability Breakdown
            <span className="text-xs text-muted-foreground font-normal">(debts & obligations)</span>
          </h3>
          <div className="h-[300px]">
            <Pie
              data={liabilityBreakdownData}
              options={chartOptions}
              ref={liabilityBreakdownChartRef}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
