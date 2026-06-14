export const css = `
:root {
  --bg: #0f172a;
  --surface: #1e293b;
  --surface2: #334155;
  --border: #475569;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --accent: #38bdf8;
  --pass: #4ade80;
  --fail: #f87171;
  --flaky: #fbbf24;
  --skip: #a78bfa;
  --radius: 8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  padding: 24px;
}

.container { max-width: 1200px; margin: 0 auto; }

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

h1 { font-size: 1.5rem; font-weight: 700; color: var(--accent); }

.top-bar {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 24px;
  min-width: 100px;
  text-align: center;
}

.stat-card .value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-card .label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-card.passed .value { color: var(--pass); }
.stat-card.failed .value { color: var(--fail); }
.stat-card.flaky .value { color: var(--flaky); }
.stat-card.skipped .value { color: var(--skip); }

.pass-rate-bar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
}

.pass-rate-bar .rate {
  font-size: 2rem;
  font-weight: 700;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: var(--surface2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--pass);
  transition: width 0.3s ease;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  align-items: center;
}

.filters label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text);
  padding: 4px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}

.filter-btn:hover { background: var(--surface2); }
.filter-btn.active { background: var(--accent); color: #0f172a; border-color: var(--accent); }

select {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  padding: 4px 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.section { margin-bottom: 32px; }

h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th {
  text-align: left;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--surface2);
}

tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--surface); }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-pass { background: rgba(74, 222, 128, 0.15); color: var(--pass); }
.badge-fail { background: rgba(248, 113, 113, 0.15); color: var(--fail); }
.badge-flaky { background: rgba(251, 191, 36, 0.15); color: var(--flaky); }
.badge-skip { background: rgba(167, 139, 250, 0.15); color: var(--skip); }

.tag {
  display: inline-block;
  background: var(--surface2);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-right: 4px;
}

.error-msg {
  font-size: 0.75rem;
  color: var(--fail);
  font-family: 'Consolas', monospace;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 500px;
}

.hidden { display: none; }

.empty-state {
  color: var(--text-muted);
  font-style: italic;
  padding: 16px;
  text-align: center;
}
`;
