import type { Page } from '@playwright/test';

export interface PerfMetrics {
  fcp: number;
  lcp: number;
  ttfb: number;
}

/**
 * Measures Core Web Vitals for a page load using Performance Observer.
 * Reads FCP (First Contentful Paint), LCP (Largest Contentful Paint),
 * and TTFB (Time To First Byte) from the Performance API.
 *
 * @param page - Playwright page instance
 * @returns Promise resolving to PerfMetrics with timing values in ms
 */
export async function measurePageLoad(page: Page): Promise<PerfMetrics> {
  return await page.evaluate(() => {
    return new Promise<PerfMetrics>((resolve) => {
      const metrics: PerfMetrics = {
        fcp: 0,
        lcp: 0,
        ttfb: 0,
      };

      // Get TTFB from navigation timing
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.ttfb = navigation.responseStart;
      }

      // Use PerformanceObserver for FCP
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(
          (e) => e.entryType === 'paint' && e.name === 'first-contentful-paint',
        );
        if (fcpEntry) {
          metrics.fcp = fcpEntry.startTime;
        }
      });

      // Use PerformanceObserver for LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
        if (lastEntry) {
          metrics.lcp = lastEntry.startTime;
        }
        // Resolve once we have LCP (typically the last metric to fire)
        resolve(metrics);
        fcpObserver.disconnect();
        lcpObserver.disconnect();
      });

      try {
        fcpObserver.observe({ type: 'paint', buffered: true });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Fallback timeout in case LCP doesn't fire
        setTimeout(() => {
          resolve(metrics);
          fcpObserver.disconnect();
          lcpObserver.disconnect();
        }, 5000);
      } catch {
        resolve(metrics);
      }
    });
  });
}

/**
 * Asserts that performance metrics are within acceptable budget.
 *
 * @param metrics - PerfMetrics from measurePageLoad()
 * @param budget - Budget with maxFCP and maxLCP thresholds in ms
 * @throws Error with details if any metric exceeds its budget
 */
export function assertWithinBudget(
  metrics: PerfMetrics,
  budget: { maxFCP: number; maxLCP: number },
): void {
  const failures: string[] = [];

  if (metrics.fcp > budget.maxFCP) {
    failures.push(`FCP: ${metrics.fcp.toFixed(0)}ms exceeds budget of ${budget.maxFCP}ms`);
  }

  if (metrics.lcp > budget.maxLCP) {
    failures.push(`LCP: ${metrics.lcp.toFixed(0)}ms exceeds budget of ${budget.maxLCP}ms`);
  }

  if (failures.length > 0) {
    throw new Error(
      `Performance budget exceeded:\n  ${failures.join('\n  ')}\n\n` +
        `Current metrics: FCP=${metrics.fcp.toFixed(0)}ms, LCP=${metrics.lcp.toFixed(0)}ms, TTFB=${metrics.ttfb.toFixed(0)}ms`,
    );
  }
}
