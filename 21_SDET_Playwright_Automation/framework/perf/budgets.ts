/**
 * Performance Budget Configuration
 *
 * Defines maximum allowed values for Core Web Vitals metrics.
 * These thresholds are used to catch performance regressions.
 */

export const PERF_BUDGETS = {
  orangehrm: {
    loginLoad: { maxFCP: 2000, maxLCP: 3000 },
    dashboardLoad: { maxFCP: 2500, maxLCP: 4000 },
  },
} as const;
