import * as path from 'path';

import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `[env.loader] Missing required env variable: ${key}\n` +
        `→ Copy .env.example to .env and fill in ${key}.`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? fallback : value;
}

function boolEnv(key: string, fallback: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true' || value === '1';
}

function numberEnv(key: string, fallback: number): number {
  const value = process.env[key];
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`[env.loader] ${key} must be a number, got: ${value}`);
  }
  return parsed;
}

export type EnvName = 'local' | 'dev' | 'staging' | 'prod';

export interface EnvironmentConfig {
  env: EnvName;
  headless: boolean;
  defaultTimeoutMs: number;
  orangehrm: {
    baseUrl: string;
    demoUsername: string;
    demoPassword: string;
  };
  api: {
    baseUrl: string;
  };
  flags: {
    logApiSteps: boolean;
  };
}

function parseEnvName(raw: string): EnvName {
  const valid: EnvName[] = ['local', 'dev', 'staging', 'prod'];
  if (!valid.includes(raw as EnvName)) {
    throw new Error(`[env.loader] ENV must be one of ${valid.join(', ')}, got: ${raw}`);
  }
  return raw as EnvName;
}

export const envConfig: EnvironmentConfig = {
  env: parseEnvName(optionalEnv('ENV', 'local')),
  headless: boolEnv('HEADLESS', true),
  defaultTimeoutMs: numberEnv('DEFAULT_TIMEOUT_MS', 30000),
  orangehrm: {
    baseUrl: requireEnv('ORANGEHRM_BASE_URL').replace(/\/$/, ''),
    demoUsername: optionalEnv('ORANGEHRM_DEMO_USERNAME', 'Admin'),
    demoPassword: optionalEnv('ORANGEHRM_DEMO_PASSWORD', 'admin123'),
  },
  api: {
    baseUrl: requireEnv('API_BASE_URL').replace(/\/$/, ''),
  },
  flags: {
    logApiSteps: boolEnv('LOG_API_STEPS', false),
  },
};
