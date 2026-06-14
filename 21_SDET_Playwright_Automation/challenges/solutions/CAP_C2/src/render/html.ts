import { css } from "./css";
import type { AggregatedResult, SuiteSummary } from "../types";

export function renderHtml(
  data: AggregatedResult,
  _outputFolder: string,
): string {
  const { overall, byProject, byOwner, slowestTests, failedTests } = data;
  const passRate =
    overall.total > 0
      ? ((overall.passed / overall.total) * 100).toFixed(1)
      : "0.0";

  const projectRows = Object.entries(byProject)
    .map(
      ([name, s]) =>
        `<tr>` +
        `<td>${escapeHtml(name)}</td>` +
        `<td>${s.total}</td>` +
        `<td><span class="badge badge-pass">${s.passed}</span></td>` +
        `<td><span class="badge badge-fail">${s.failed}</span></td>` +
        `<td><span class="badge badge-flaky">${s.flaky}</span></td>` +
        `<td><span class="badge badge-skip">${s.skipped}</span></td>` +
        `<td>${fmtDuration(s.duration)}</td>` +
        `<td>${fmtPct(s)}</td>` +
        `</tr>`,
    )
    .join("");

  const ownerRows = Object.entries(byOwner)
    .map(
      ([name, s]) =>
        `<tr>` +
        `<td>${escapeHtml(name)}</td>` +
        `<td>${s.total}</td>` +
        `<td><span class="badge badge-pass">${s.passed}</span></td>` +
        `<td><span class="badge badge-fail">${s.failed}</span></td>` +
        `<td><span class="badge badge-flaky">${s.flaky}</span></td>` +
        `<td><span class="badge badge-skip">${s.skipped}</span></td>` +
        `<td>${fmtDuration(s.duration)}</td>` +
        `<td>${fmtPct(s)}</td>` +
        `</tr>`,
    )
    .join("");

  const slowestRows = slowestTests
    .slice(0, 10)
    .map(
      (t) =>
        `<tr>` +
        `<td>${escapeHtml(t.title)}</td>` +
        `<td>${fmtDuration(t.duration)}</td>` +
        `<td><span class="tag">${escapeHtml(t.file)}</span></td>` +
        `</tr>`,
    )
    .join("");

  const failedRows = failedTests
    .map(
      (t) =>
        `<tr data-status="fail">` +
        `<td>${escapeHtml(t.title)}</td>` +
        `<td><span class="error-msg">${escapeHtml(t.error)}</span></td>` +
        `<td><span class="tag">${escapeHtml(t.file)}</span></td>` +
        `</tr>`,
    )
    .join("");

  const ownerSection =
    Object.keys(byOwner).length > 0
      ? `<div class="section">
    <h2>Per-Owner Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Owner</th><th>Total</th><th>Passed</th><th>Failed</th><th>Flaky</th><th>Skipped</th><th>Duration</th><th>Pass %</th>
        </tr>
      </thead>
      <tbody>${ownerRows}</tbody>
    </table>
  </div>`
      : "";

  const ownerDropdown =
    Object.keys(byOwner).length > 0
      ? `<label style="margin-left:8px">Owner:</label>
    <select onchange="filterByOwner(this.value)">
      <option value="">All</option>
      ${Object.keys(byOwner)
        .map(
          (o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`,
        )
        .join("")}
    </select>`
      : "";

  const scripts = `<script>
    const ALL_RESULTS = ${JSON.stringify(data)};
    const TR = document.querySelectorAll('tr[data-status]');

    function showAll() {
      TR.forEach(function(r) { r.classList.remove('hidden'); });
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    }

    function showFailed() {
      TR.forEach(function(r) {
        r.classList.toggle('hidden', r.getAttribute('data-status') !== 'fail');
      });
    }

    function filterByOwner(owner) {
      TR.forEach(function(r) {
        var rowOwner = r.getAttribute('data-owner') || '';
        r.classList.toggle('hidden', owner !== '' && rowOwner !== owner);
      });
    }

    function filterByTag(tag) {
      TR.forEach(function(r) {
        var tags = (r.getAttribute('data-tags') || '').split(',').filter(Boolean);
        r.classList.toggle('hidden', tag !== '' && tags.indexOf(tag) === -1);
      });
    }
  </script>`;

  return (
    "<!DOCTYPE html>\n" +
    '<html lang="en">\n' +
    "<head>\n" +
    '  <meta charset="UTF-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
    "  <title>Playwright Team Reporter</title>\n" +
    "  <style>" +
    css +
    "</style>\n" +
    "</head>\n" +
    "<body>\n" +
    '<div class="container">\n' +
    "\n" +
    "  <header>\n" +
    "    <h1>Playwright Team Reporter</h1>\n" +
    '    <span style="color:var(--text-muted);font-size:0.8rem">' +
    new Date().toLocaleString() +
    "</span>\n" +
    "  </header>\n" +
    "\n" +
    '  <div class="top-bar">\n' +
    '    <div class="stat-card">\n' +
    '      <div class="value">' +
    overall.total +
    "</div>\n" +
    '      <div class="label">Total</div>\n' +
    "    </div>\n" +
    '    <div class="stat-card passed">\n' +
    '      <div class="value">' +
    overall.passed +
    "</div>\n" +
    '      <div class="label">Passed</div>\n' +
    "    </div>\n" +
    '    <div class="stat-card failed">\n' +
    '      <div class="value">' +
    overall.failed +
    "</div>\n" +
    '      <div class="label">Failed</div>\n' +
    "    </div>\n" +
    '    <div class="stat-card flaky">\n' +
    '      <div class="value">' +
    overall.flaky +
    "</div>\n" +
    '      <div class="label">Flaky</div>\n' +
    "    </div>\n" +
    '    <div class="stat-card skipped">\n' +
    '      <div class="value">' +
    overall.skipped +
    "</div>\n" +
    '      <div class="label">Skipped</div>\n' +
    "    </div>\n" +
    '    <div class="pass-rate-bar">\n' +
    '      <div class="rate" style="color:' +
    (Number(passRate) >= 80
      ? "var(--pass)"
      : Number(passRate) >= 50
        ? "var(--flaky)"
        : "var(--fail)") +
    '">' +
    passRate +
    "%</div>\n" +
    '      <div class="progress-track">\n' +
    '        <div class="progress-fill" style="width:' +
    passRate +
    "%;background:" +
    (Number(passRate) >= 80
      ? "var(--pass)"
      : Number(passRate) >= 50
        ? "var(--flaky)"
        : "var(--fail)") +
    '"></div>\n' +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    '  <div class="filters">\n' +
    "    <label>Filters:</label>\n" +
    '    <button class="filter-btn active" onclick="showAll()">All</button>\n' +
    '    <button class="filter-btn" onclick="showFailed()">Failed Only</button>\n' +
    '    <button class="filter-btn" onclick="filterByTag(\'smoke\')">@smoke</button>\n' +
    '    <button class="filter-btn" onclick="filterByTag(\'regression\')">@regression</button>\n' +
    ownerDropdown +
    "  </div>\n" +
    "\n" +
    '  <div class="section">\n' +
    "    <h2>Per-Project Breakdown</h2>\n" +
    "    <table>\n" +
    "      <thead>\n" +
    "        <tr>\n" +
    "          <th>Project</th><th>Total</th><th>Passed</th><th>Failed</th><th>Flaky</th><th>Skipped</th><th>Duration</th><th>Pass %</th>\n" +
    "        </tr>\n" +
    "      </thead>\n" +
    "      <tbody>" +
    projectRows +
    "</tbody>\n" +
    "    </table>\n" +
    "  </div>\n" +
    "\n" +
    ownerSection +
    "\n" +
    '  <div class="section">\n' +
    "    <h2>Top 10 Slowest Tests</h2>\n" +
    "    <table>\n" +
    "      <thead>\n" +
    "        <tr>\n" +
    "          <th>Test</th><th>Duration</th><th>File</th>\n" +
    "        </tr>\n" +
    "      </thead>\n" +
    "      <tbody>" +
    (slowestRows ||
      '<tr><td colspan="3" class="empty-state">No test data</td></tr>') +
    "</tbody>\n" +
    "    </table>\n" +
    "  </div>\n" +
    "\n" +
    '  <div class="section">\n' +
    "    <h2>Failed Tests</h2>\n" +
    "    <table>\n" +
    "      <thead>\n" +
    "        <tr>\n" +
    "          <th>Test</th><th>Error</th><th>File</th>\n" +
    "        </tr>\n" +
    "      </thead>\n" +
    "      <tbody>" +
    (failedRows ||
      '<tr><td colspan="3" class="empty-state">No failures</td></tr>') +
    "</tbody>\n" +
    "    </table>\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n" +
    scripts +
    "</body>\n" +
    "</html>"
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return ms + "ms";
  return (ms / 1000).toFixed(2) + "s";
}

function fmtPct(s: SuiteSummary): string {
  if (s.total === 0) return "—";
  return ((s.passed / s.total) * 100).toFixed(1) + "%";
}
