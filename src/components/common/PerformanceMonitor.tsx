'use client';

import { useEffect } from 'react';

import { performanceMetrics } from '@/lib/performance-optimizations';

/**
 * Performance monitoring component that tracks Web Vitals and custom metrics
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Track Web Vitals
    performanceMetrics.trackWebVitals();

    // Mark app initialization
    performanceMetrics.mark('app-init');

    // Measure time to interactive
    const measureTTI = () => {
      performanceMetrics.mark('app-interactive');
      performanceMetrics.measure('time-to-interactive', 'app-init', 'app-interactive');
    };

    // Measure after a short delay to ensure app is interactive
    const timer = setTimeout(measureTTI, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Only render in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
      Performance Monitor Active
    </div>
  );
}

export default PerformanceMonitor;
