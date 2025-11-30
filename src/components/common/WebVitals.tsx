'use client';

import { useEffect } from 'react';

export function WebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(metric => {
        console.log('[Web Vitals] CLS:', metric.value);
        if (metric.value > 0.1) {
          console.warn('[Web Vitals] CLS needs improvement:', metric.value);
        }
      });

      onFCP(metric => {
        console.log('[Web Vitals] FCP:', metric.value);
        if (metric.value > 1800) {
          console.warn('[Web Vitals] FCP needs improvement:', metric.value);
        }
      });

      onLCP(metric => {
        console.log('[Web Vitals] LCP:', metric.value);
        if (metric.value > 2500) {
          console.warn('[Web Vitals] LCP needs improvement:', metric.value);
        }
      });

      onTTFB(metric => {
        console.log('[Web Vitals] TTFB:', metric.value);
        if (metric.value > 800) {
          console.warn('[Web Vitals] TTFB needs improvement:', metric.value);
        }
      });

      onINP(metric => {
        console.log('[Web Vitals] INP:', metric.value);
        if (metric.value > 200) {
          console.warn('[Web Vitals] INP needs improvement:', metric.value);
        }
      });
    });
  }, []);

  return null;
}
