import { LineChart, PieChart } from 'lucide-react';
import { Line, Pie } from 'react-chartjs-2';

interface ChartsSectionProps {
  netWorthHistory: Array<{ month: string; netWorth: number }>;
  assetPieData: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
  liabilityPieData: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
}

export function ChartsSection({
  netWorthHistory,
  assetPieData,
  liabilityPieData,
}: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
      {/* Net Worth Over Time */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Net Worth Over Time</h2>
          <LineChart className="h-5 w-5 text-blue-500" />
        </div>
        <div className="h-64">
          <Line
            data={{
              labels: netWorthHistory.map(d => d.month),
              datasets: [
                {
                  label: 'Net Worth',
                  data: netWorthHistory.map(d => d.netWorth),
                  borderColor: '#2563eb',
                  backgroundColor: 'rgba(37,99,235,0.1)',
                  tension: 0.4,
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
            }}
          />
        </div>
      </div>

      {/* Asset Allocation Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Asset Allocation</h2>
          <PieChart className="h-5 w-5 text-green-500" />
        </div>
        <div className="h-64 flex items-center justify-center">
          <Pie
            data={assetPieData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
            }}
          />
        </div>
      </div>

      {/* Liability Allocation Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Liability Allocation</h2>
          <PieChart className="h-5 w-5 text-red-500" />
        </div>
        <div className="h-64 flex items-center justify-center">
          <Pie
            data={liabilityPieData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
            }}
          />
        </div>
      </div>
    </div>
  );
}
