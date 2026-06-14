import { useEffect, useState } from "react";
import Link from "next/link";
import { api, OwnerList } from "../../api";

export default function OwnersPage() {
  const [data, setData] = useState<OwnerList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getOwners()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Test Owners</h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              marginTop: "0.25rem",
            }}
          >
            Browse tests by owner
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
          {data.owners.length === 0 ? (
            <div className="empty">
              No owner data available. Add an `owner` field to your test
              results.
            </div>
          ) : (
            <div className="section">
              <div className="owner-list">
                {data.owners.map((o) => (
                  <Link
                    key={o.name}
                    href={`/owner/${encodeURIComponent(o.name)}`}
                    className="owner-badge"
                  >
                    {o.name}{" "}
                    <span style={{ color: "var(--text-muted)" }}>
                      ({o.testCount})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && !data && (
        <div className="empty">No owner data available.</div>
      )}
    </div>
  );
}
