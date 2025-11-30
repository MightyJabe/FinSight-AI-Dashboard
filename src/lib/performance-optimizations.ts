/**
 * Performance Optimizations for FinSight AI Dashboard
 * Implements dynamic imports, code splitting, and memoization strategies
 */

import dynamic from 'next/dynamic';
import React, { memo } from 'react';

// Dynamic imports for heavy components
export const DynamicChartComponents = {
  SpendingTrends: dynamic(() => import('@/components/analytics/SpendingTrends'), {
    loading: () =>
      React.createElement('div', { className: 'animate-pulse bg-gray-200 h-64 rounded-lg' }),
    ssr: false,
  }),
};

// Memoized components for better performance
export const MemoizedComponents = {
  MetricCard: memo(function MetricCard({ title, value, trend, icon: Icon, color = 'blue' }: any) {
    return React.createElement(
      'div',
      {
        className:
          'bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200',
      },
      [
        React.createElement(
          'div',
          {
            key: 'header',
            className: 'flex items-center justify-between mb-4',
          },
          [
            React.createElement(
              'div',
              {
                key: 'icon',
                className: `w-12 h-12 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-lg flex items-center justify-center`,
              },
              React.createElement(Icon, { className: 'w-6 h-6 text-white' })
            ),
            trend &&
              React.createElement(
                'div',
                {
                  key: 'trend',
                  className: `flex items-center space-x-1 text-sm ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`,
                },
                React.createElement('span', { className: 'font-medium' }, trend.label)
              ),
          ]
        ),
        React.createElement('div', { key: 'content' }, [
          React.createElement(
            'p',
            {
              key: 'title',
              className: 'text-sm font-medium text-gray-600 mb-1',
            },
            title
          ),
          React.createElement(
            'p',
            {
              key: 'value',
              className: 'text-2xl font-bold text-gray-900',
            },
            value
          ),
        ]),
      ]
    );
  }),
};

// Bundle splitting configuration
export const bundleOptimizations = {
  // Split chart libraries into separate chunks
  chartLibraries: () => import('chart.js'),

  // Split AI/ML libraries
  openai: () => import('openai'),

  // Split authentication libraries
  firebase: () => import('firebase/app'),
};

// Performance monitoring utilities
export const performanceMonitor = {
  measureComponentRender: (componentName: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = performance.now();
      return () => {
        const endTime = performance.now();
        console.log(`${componentName} render time: ${endTime - startTime}ms`);
      };
    }
    return () => {};
  },

  measureAPICall: (apiName: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = performance.now();
      return () => {
        const endTime = performance.now();
        console.log(`${apiName} API call time: ${endTime - startTime}ms`);
      };
    }
    return () => {};
  },
};

// Image optimization utilities
export const imageOptimizations = {
  // Lazy loading configuration
  lazyLoadConfig: {
    threshold: 0.1,
    rootMargin: '50px',
  },

  // Image format preferences
  formats: ['avif', 'webp', 'jpg'],

  // Responsive image sizes
  sizes: {
    mobile: '(max-width: 768px) 100vw',
    tablet: '(max-width: 1024px) 50vw',
    desktop: '33vw',
  },
};

// Cache optimization strategies
export const cacheStrategies = {
  // SWR configuration for different data types
  dashboardData: {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 2,
  },

  transactionData: {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30 seconds
    errorRetryCount: 3,
  },

  staticData: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 1,
  },
};

// Memory optimization utilities
export const memoryOptimizations = {
  // Cleanup functions for components
  cleanupChart: (chartRef: any) => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
  },

  // Debounce utility for search/filter inputs
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },

  // Throttle utility for scroll/resize events
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },
};

// Network optimization utilities
export const networkOptimizations = {
  // Request batching for multiple API calls
  batchRequests: async (requests: Promise<any>[], batchSize = 3) => {
    const results = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);

      // Small delay between batches to prevent overwhelming the server
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    return results;
  },

  // Request deduplication
  requestCache: new Map<string, Promise<any>>(),

  deduplicateRequest: <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
    if (networkOptimizations.requestCache.has(key)) {
      return networkOptimizations.requestCache.get(key)!;
    }

    const request = requestFn().finally(() => {
      networkOptimizations.requestCache.delete(key);
    });

    networkOptimizations.requestCache.set(key, request);
    return request;
  },
};

// Performance metrics collection
export const performanceMetrics = {
  // Web Vitals tracking
  trackWebVitals: () => {
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS(console.log);
        onFCP(console.log);
        onLCP(console.log);
        onTTFB(console.log);
        onINP(console.log);
      });
    }
  },

  // Custom performance markers
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        console.log(`${name}: ${measure.duration}ms`);
      }
    }
  },
};

const performanceOptimizations = {
  DynamicChartComponents,
  MemoizedComponents,
  bundleOptimizations,
  performanceMonitor,
  imageOptimizations,
  cacheStrategies,
  memoryOptimizations,
  networkOptimizations,
  performanceMetrics,
};

export default performanceOptimizations;
