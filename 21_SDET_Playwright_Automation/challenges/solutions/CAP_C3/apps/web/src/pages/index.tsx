import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, OverviewData } from '../api';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getOverview()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Test Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Last 30 days overview
          </p>
        </div>
        <nav className="header-links">
          <Link href="/">Overview</Link>
          <Link href="/owners">Owners</Link>
        </nav>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">Failed to load: {error}</div>}

      {!loading && !error && data && (
        <>
          <div className="card-grid">
            <div className="card">
              <div className="label">Total Runs</div>
              <div className="value">{data.totalRuns}</div>
            </div>
            <div className="card">
              <div className="label">Pass Rate</div>
              <div className={`value ${data.passRate >= 80 ? 'success' : data.passRate >= 50 ? 'warning' : 'danger'}`}>
                {data.passRate}%
              </div>
            </div>
            <div className="card">
              <div className="label">Failing Tests</div>
              <div className="value danger">{data.failingTests.length}</div>
            </div>
            <div className="card">
              <div className="label">Slowest Tests</div>
              <div className="value warning">{data.slowestTests.length}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="section">
              <h2>Top 10 Failing Tests</h2>
              {data.failingTests.length === 0 ? (
                <div className="empty">No failing tests in the last 30 days</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Fail</th>
                      <th>Pass</th>
                      <th>Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.failingTests.map((t) => (
                      <tr key={t.name}>
                        <td>
                          <Link href={`/test/${encodeURIComponent(t.name)}`}>{t.name}</Link>
                        </td>
                        <td style={{ color: 'var(--danger)' }}>{t.failCount}</td>
                        <td style={{ color: 'var(--success)' }}>{t.passCount}</td>
                        <td className="duration-ms">{formatDuration(t.avgDurationMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="section">
              <h2>Top 10 Slowest Tests</h2>
              {data.slowestTests.length === 0 ? (
                <div className="empty">No data available</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Avg Duration</th>
                      <th>Runs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slowestTests.map((t) => (
                      <tr key={t.name}>
                        <td>
                          <Link href={`/test/${encodeURIComponent(t.name)}`}>{t.name}</Link>
                        </td>
                        <td className="duration-ms">{formatDuration(t.avgDurationMs)}</td>
                        <td>{t.runCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && !error && !data && (
        <div className="empty">No data available. Ingest some Playwright reports to get started.</div>
      )}
    </div>
  );
}