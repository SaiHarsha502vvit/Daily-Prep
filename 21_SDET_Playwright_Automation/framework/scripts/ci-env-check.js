#!/usr/bin/env node
// ============================================================
// CI Environment Validation Script
// ============================================================
// Runs before tests in CI to validate:
//   - Required env vars are set
//   - Node version is compatible
//   - Playwright browsers are installed
//
// Usage:
//   node scripts/ci-env-check.js
// ============================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIN_NODE_MAJOR = 18;
const REQUIRED_VARS = [
  'ORANGEHRM_BASE_URL',
  'API_BASE_URL',
];
const OPTIONAL_VARS_WITH_DEFAULTS = [
  { key: 'ADMIN_USERNAME', fallback: 'Admin' },
  { key: 'ADMIN_PASSWORD', fallback: 'admin123' },
];

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function printTable(title, rows) {
  const width = 40;
  console.log(`\n${COLORS.cyan}${'='.repeat(width)}${COLORS.reset}`);
  console.log(`${COLORS.cyan}${title.padEnd(width)}${COLORS.reset}`);
  console.log(`${COLORS.cyan}${'='.repeat(width)}${COLORS.reset}`);
  rows.forEach(([label, status, detail]) => {
    const labelStr = label.padEnd(24, ' ');
    const statusStr = status.padEnd(8, ' ');
    const detailStr = detail || '';
    const color =
      status === 'PASS' ? COLORS.green : status === 'WARN' ? COLORS.yellow : COLORS.red;
    console.log(`${labelStr} ${color}${statusStr}${COLORS.reset} ${detailStr}`);
  });
}

function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.replace(/^v/, '').split('.')[0], 10);
  const pass = major >= MIN_NODE_MAJOR;
  return {
    label: 'Node Version',
    status: pass ? 'PASS' : 'FAIL',
    detail: `${version} (req >= v${MIN_NODE_MAJOR}.0.0)`,
  };
}

function checkPlaywrightBrowsers() {
  try {
    const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH || '';
    if (browsersPath && fs.existsSync(browsersPath)) {
      return {
        label: 'Browsers Installed',
        status: 'PASS',
        detail: `Found at ${browsersPath}`,
      };
    }
    // Check default location
    const defaultPath = path.join(require('os').homedir(), '.cache', 'ms-playwright');
    if (fs.existsSync(defaultPath)) {
      const dirs = fs.readdirSync(defaultPath).filter((d) => d.startsWith('chromium') || d.startsWith('firefox') || d.startsWith('webkit'));
      if (dirs.length > 0) {
        return {
          label: 'Browsers Installed',
          status: 'PASS',
          detail: `Found ${dirs.length} browser(s)`,
        };
      }
    }
    // Fallback: ask npx
    execSync('npx playwright install --with-deps chromium 2>&1', {
      stdio: 'pipe',
      timeout: 120_000,
    });
    return {
      label: 'Browsers Installed',
      status: 'PASS',
      detail: 'Auto-installed chromium',
    };
  } catch (err) {
    return {
      label: 'Browsers Installed',
      status: 'FAIL',
      detail: String(err?.message || err),
    };
  }
}

function checkRequiredVars() {
  return REQUIRED_VARS.map((key) => {
    const value = process.env[key];
    const pass = value !== undefined && value.trim() !== '';
    return {
      label: key,
      status: pass ? 'PASS' : 'FAIL',
      detail: pass ? 'set' : 'MISSING',
    };
  });
}

function checkOptionalVars() {
  return OPTIONAL_VARS_WITH_DEFAULTS.map(({ key, fallback }) => {
    const value = process.env[key];
    const pass = value !== undefined && value.trim() !== '';
    if (!pass) {
      process.env[key] = fallback;
    }
    return {
      label: `${key} (opt)`,
      status: pass ? 'PASS' : 'WARN',
      detail: pass ? 'set' : `defaulting to "${fallback}"`,
    };
  });
}

function main() {
  console.log(`${COLORS.cyan}Playwright CI Environment Check${COLORS.reset}`);

  const rows = [
    checkNodeVersion(),
    ...checkRequiredVars(),
    ...checkOptionalVars(),
    checkPlaywrightBrowsers(),
  ];

  printTable(
    'Validation Results',
    rows.map((r) => [r.label, r.status, r.detail])
  );

  const failures = rows.filter((r) => r.status === 'FAIL');
  if (failures.length > 0) {
    console.log(`\n${COLORS.red}[ERROR] ${failures.length} check(s) failed. Aborting.${COLORS.reset}\n`);
    process.exit(1);
  }

  console.log(`\n${COLORS.green}[OK] All checks passed.${COLORS.reset}\n`);
  process.exit(0);
}

main();
