'use client';

import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  LineChart,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

/**
 *
 */
export default function Home() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

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
          <Card variant="elevated" hover>
            <CardContent>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">$45,231.89</p>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +20.1% from last month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" hover>
            <CardContent>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">2,350</p>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +15.3% from last month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" hover>
            <CardContent>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
                <LineChart className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">3.2%</p>
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 rotate-180" />
                  -1.1% from last month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" hover>
            <CardContent>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Market Share</h3>
                <PieChart className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">12.5%</p>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +2.4% from last month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Revenue Overview</CardTitle>
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                Chart placeholder
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Growth</CardTitle>
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                Chart placeholder
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
