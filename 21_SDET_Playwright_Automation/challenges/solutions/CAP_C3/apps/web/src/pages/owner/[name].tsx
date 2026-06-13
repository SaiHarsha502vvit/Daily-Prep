import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { api, OwnerSummary } from '../../api';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export default function OwnerViewPage() {
  const router = useRouter();
  const name = Array.isArray(router.query.name) ? router.query.name[0] : router.query.name || '';
  const [data, setData] = useState<OwnerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    api
      .getOwnerSummary(decodeURIComponent(name))
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  return (
    <div className="container">
      <Link href="/owners" className="back-link">
        &larr; Back to Owners
      </Link>

      <div className="header">
        <div>
          <h1>Owner: {name || '...'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Last 30 days summary
          </p>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">Failed to load: {error}</div>}

      {!loading && !error && data && (
        <>
          <div className="card-grid">
            <div className="card">
              <div className="label">Total Tests</div>
              <div className="value">{data.totalTests}</div>
            </div>
            <div className="card">
              <div className="label">Pass Rate</div>
              <div className={`value ${data.passRate >= 80 ? 'success' : data.passRate >= 50 ? 'warning' : 'danger'}`}>
                {data.passRate}%
              </div>
            </div>
            <div className="card">
              <div className="label">Passed</div>
              <div className="value success">{data.passed}</div>
            </div>
            <div className="card">
              <div className="label">Failed</div>
              <div className="value danger">{data.failed}</div>
            </div>
            <div className="card">
              <div className="label">Skipped</div>
              <div className="value warning">{data.skipped}</div>
            </div>
            <div className="card">
              <div className="label">Avg Duration</div>
              <div className="value" style={{ fontSize: '1.25rem' }}>{formatDuration(data.avgDurationMs)}</div>
            </div>
          </div>

          {data.topFailing.length > 0 && (
            <div className="section">
              <h2>Top Failing Tests</h2>
              <table>
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Failures (30d)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topFailing.map((t) => (
                    <tr key={t.name}>
                      <td>
                        <Link href={`/test/${encodeURIComponent(t.name)}`}>{t.name}</Link>
                      </td>
                      <td style={{ color: 'var(--danger)' }}>{t.failCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.notRunIn30Days.length > 0 && (
            <div className="section">
              <h2>Tests Not Run in 30 Days</h2>
              <table>
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Last Run</th>
                  </tr>
                </thead>
                <tbody>
                  {data.notRunIn30Days.map((t) => (
                    <tr key={t.testName}>
                      <td>
                        <Link href={`/test/${encodeURIComponent(t.testName)}`}>{t.testName}</Link>
                      </td>
                      <td className="duration-ms">{formatDate(t.lastRun)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && !error && !data && (
        <div className="empty">No data available for this owner.</div>
      )}
    </div>
  );
}