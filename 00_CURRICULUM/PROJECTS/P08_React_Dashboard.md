# 🔨 Mini-Project P08 — React Dashboard

> **Semester:** 3, Weeks 9–10  
> **Topics:** React 18 · TypeScript · React Query · recharts · CSS Grid  
> **Est. time:** 6–8 hours  
> **Language:** TypeScript + React 18 (Vite)

---

## 🎯 Business Requirement (The PM Brief)

*The CTO wants a real-time analytics dashboard for a SaaS product. Engineers need to see key metrics at a glance: active users, revenue trends, error rates, and recent activity. Build a polished, production-grade dashboard with live data polling.*

---

## 📋 Technical Specification

### Pages / Views

| Route | Description |
|---|---|
| `/` | Main dashboard: 4 stat cards + revenue chart + recent activity table |
| `/users` | User analytics: growth chart, country breakdown, retention table |
| `/errors` | Error log: filterable table of recent errors with stack traces |

### Component Architecture

```
App
├── Layout
│   ├── Sidebar (navigation)
│   └── TopBar (user avatar, theme toggle, search)
├── DashboardPage
│   ├── StatCard × 4 (Active Users, Revenue, Errors, Uptime)
│   ├── RevenueChart (recharts LineChart, last 30 days)
│   ├── RecentActivity (table with type badge + timestamp)
│   └── SystemHealth (status indicators per service)
├── UsersPage
│   ├── UserGrowthChart (recharts AreaChart)
│   ├── CountryBreakdown (recharts PieChart)
│   └── RetentionTable (cohort grid)
└── ErrorsPage
    ├── ErrorFilter (severity select + search input)
    └── ErrorTable (filterable, sortable)
```

### Data Contracts (TypeScript Interfaces)

```typescript
interface StatCard {
  title: string;
  value: number | string;
  delta: number;        // % change from previous period
  deltaLabel: string;   // "vs last 7 days"
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

interface RevenuePoint {
  date: string;         // "2024-01-15"
  revenue: number;
  expenses: number;
  profit: number;
}

interface ActivityEvent {
  id: string;
  type: 'USER_SIGNUP' | 'PAYMENT' | 'ERROR' | 'DEPLOYMENT';
  message: string;
  userId?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

interface ErrorLog {
  id: string;
  message: string;
  stack: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
}
```

---

## 📝 Skeleton Code

### `src/hooks/useDashboardStats.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { StatCard, RevenuePoint, ActivityEvent } from '../types';

// Polls every 30 seconds — shows real-time feel
export function useDashboardStats() {
  return useQuery<StatCard[]>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/api/dashboard/stats').then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useRevenueChart(days: number = 30) {
  return useQuery<RevenuePoint[]>({
    queryKey: ['dashboard', 'revenue', days],
    queryFn: () => api.get(`/api/dashboard/revenue?days=${days}`).then(r => r.data),
  });
}

export function useRecentActivity() {
  return useQuery<ActivityEvent[]>({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => api.get('/api/dashboard/activity?limit=20').then(r => r.data),
    refetchInterval: 15_000,
  });
}
```

### `src/components/StatCard.tsx`
```tsx
import React from 'react';
import type { StatCard as StatCardProps } from '../types';

export function StatCard({ title, value, delta, deltaLabel, trend, icon }: StatCardProps) {
  const trendColor = trend === 'up' ? 'var(--green-500)'
                   : trend === 'down' ? 'var(--red-500)'
                   : 'var(--gray-400)';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div className="stat-card" role="article" aria-label={title}>
      <div className="stat-card__header">
        <span className="stat-card__icon">{icon}</span>
        <h3 className="stat-card__title">{title}</h3>
      </div>
      <p className="stat-card__value">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="stat-card__delta" style={{ color: trendColor }}>
        {trendIcon} {Math.abs(delta)}% <span className="stat-card__delta-label">{deltaLabel}</span>
      </p>
    </div>
  );
}
```

### `src/components/RevenueChart.tsx`
```tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRevenueChart } from '../hooks/useDashboardStats';

export function RevenueChart() {
  const { data, isLoading, error } = useRevenueChart(30);

  if (isLoading) return <div className="chart-skeleton" aria-busy="true" />;
  if (error) return <div className="chart-error">Failed to load revenue data</div>;

  return (
    <div className="chart-container">
      <h2 className="chart-title">Revenue vs Expenses (Last 30 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="var(--green-500)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expenses" stroke="var(--red-400)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="profit" stroke="var(--blue-500)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Mock API server (`src/mocks/handlers.ts` — MSW)
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/dashboard/stats', () => {
    return HttpResponse.json([
      { title: 'Active Users', value: 12_847, delta: 8.2, deltaLabel: 'vs last 7 days', trend: 'up', icon: '👥' },
      { title: 'Revenue', value: '$48,290', delta: 12.1, deltaLabel: 'vs last month', trend: 'up', icon: '💰' },
      { title: 'Error Rate', value: '0.12%', delta: -3.4, deltaLabel: 'vs yesterday', trend: 'down', icon: '⚠️' },
      { title: 'Uptime', value: '99.98%', delta: 0.01, deltaLabel: 'vs last week', trend: 'neutral', icon: '🟢' },
    ]);
  }),

  http.get('/api/dashboard/revenue', ({ request }) => {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') ?? '30');
    const data = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 86400000).toISOString().slice(0, 10),
      revenue: 1000 + Math.random() * 500,
      expenses: 600 + Math.random() * 200,
      profit: 400 + Math.random() * 300,
    }));
    return HttpResponse.json(data);
  }),
];
```

---

## ✅ Acceptance Criteria

- [ ] All 3 routes render with real (mocked) data
- [ ] Revenue chart shows 30-day trend with 3 lines
- [ ] Stat cards auto-refresh every 30 seconds (see React Query refetchInterval)
- [ ] Loading skeletons show while data loads (not spinners — CSS skeleton animation)
- [ ] Dark mode toggle works via CSS variables
- [ ] TypeScript strict — zero `any` types
- [ ] Fully keyboard-navigable (Tab + Enter)
- [ ] Responsive: works on 1280px, 1024px, 768px

---

## 🎨 CSS Design System (index.css tokens)

```css
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --border-color: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --green-500: #22c55e;
  --red-400: #f87171;
  --blue-500: #3b82f6;
  --purple-500: #a855f7;
  --gray-400: #9ca3af;
  --radius: 12px;
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.stat-card__value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0.5rem 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}
@media (max-width: 1024px) { .dashboard-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px)  { .dashboard-grid { grid-template-columns: 1fr; } }

.chart-skeleton {
  height: 300px;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border-color) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius);
}
@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 🔴 Failure Scenarios & Erklärungen

| Mistake | Why | Fix |
|---|---|---|
| `useEffect(() => { fetch(url) }, [])` in component | No caching, no dedup, no background refresh | Use React Query `useQuery` — handles all this |
| Polling with `setInterval` in `useEffect` | Memory leak on unmount, duplicate intervals | Use React Query `refetchInterval` — auto-cleans |
| No loading state — renders empty chart | Chart flashes on load, confusing UX | Show skeleton immediately; chart fades in with data |
| `any` for chart data | TypeScript provides no safety on data shape | Define `RevenuePoint` interface, use it everywhere |
| Hardcoded colors in recharts `stroke` | Breaks dark mode | Use `var(--green-500)` CSS variables — theme-aware |

---

## 🚀 Extension Challenges

1. **Live WebSocket updates:** Replace polling with a WebSocket that pushes updates from the server
2. **Date range picker:** Let users select custom date ranges for the revenue chart
3. **Export to CSV:** Add a "Download CSV" button to the revenue table
4. **Alert thresholds:** Highlight a stat card red if the metric crosses a threshold

---

[← Back to Semester 3 Guide](../../00_CURRICULUM/SEMESTER_3_GUIDE.md)
