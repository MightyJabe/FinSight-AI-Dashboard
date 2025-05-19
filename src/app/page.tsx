import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  LineChart,
  PieChart,
  TrendingUp,
} from 'lucide-react';

/**
 *
 */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <section className="px-6 py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            AI-Powered Financial Insights
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get real-time analytics and predictive insights to make smarter financial decisions
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Get Started
            </button>
            <button className="px-6 py-2.5 border border-border rounded-lg hover:bg-accent/10 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 p-6">
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
      </main>
    </div>
  );
}
