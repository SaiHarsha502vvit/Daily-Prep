import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { api, TestDetailData } from '../../api';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function TestDetailPage() {
  const router = useRouter();
  const name = Array.isArray(router.query.name) ? router.query.name[0] : router.query.name || '';
  const [data, setData] = useState<TestDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    api
      .getTestDetail(decodeURIComponent(name))
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  return (
    <div className="container">
      <Link href="/" className="back-link">
        &larr; Back to Overview
      </Link>

      <div className="header">
        <div>
          <h1>Test Detail</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', wordBreak: 'break-all' }}>
            {name || '...'}
          </p>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">Failed to load: {error}</div>}

      {!loading && !error && data && (
        <>
          {data.branches.length === 0 ? (
            <div className="empty">No runs found for this test in the last 30 days.</div>
          ) : (
            data.branches.map((branch) => (
              <div key={branch.branch} className="branch-group">
                <div className="branch-name">{branch.branch}</div>
                <div className="section">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branch.history.map((h) => (
                        <tr key={h.runId + h.timestamp}>
                          <td className="duration-ms">{formatDate(h.timestamp)}</td>
                          <td>
                            <span className={`status-badge ${h.status}`}>{h.status}</span>
                          </td>
                          <td className="duration-ms">{formatDuration(h.durationMs)}</td>
                          <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {h.errorMessage ? (
                              <span title={h.errorMessage} style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                                {h.errorMessage.split('\n')[0]}
                              </span>
                            ) : (
                              <span className="empty-value">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {!loading && !error && !data && (
        <div className="empty">No data available for this test.</div>
      )}
    </div>
  );
}