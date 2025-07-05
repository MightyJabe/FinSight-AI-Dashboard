import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  LineChart,
  PieChart,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

/**
 *
 */
export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-20 text-center flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-balance bg-gradient-to-r from-logoGradientStart to-logoGradientEnd bg-clip-text text-transparent">
          AI-Powered Financial Insights
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Get real-time analytics and predictive insights to make smarter financial decisions
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="primary" size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <div className="space-y-12">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-xl border border-border/40 bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">$45,231.89</p>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +20.1% from last month
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Active Users</h3>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">2,350</p>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +15.3% from last month
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Conversion Rate</h3>
              <LineChart className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">3.2%</p>
              <p className="text-xs text-red-500 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 rotate-180" />
                -1.1% from last month
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Market Share</h3>
              <PieChart className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">12.5%</p>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +2.4% from last month
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border/40 bg-card p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Revenue Overview</h2>
              <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                View Details
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
              Chart placeholder
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-card p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">User Growth</h2>
              <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                View Details
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
              Chart placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
