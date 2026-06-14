import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: "${key}".\n` +
        `Add it to your .env file (see .env.example for required keys).`,
    );
  }
  return value.trim();
}

function optionalEnv(key: string): string | undefined {
  return process.env[key]?.trim();
}

function boolEnv(key: string): boolean {
  const raw = process.env[key]?.toLowerCase();
  return raw === "true" || raw === "1";
}

function numberEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

export interface EnvironmentConfig {
  orangehrm: { baseUrl: string; username: string; password: string };
  api: { baseUrl: string };
  headless: boolean;
  workers: number;
  logActions: boolean;
}

export const envConfig: EnvironmentConfig = Object.freeze({
  orangehrm: {
    baseUrl: requireEnv("ORANGEHRM_BASE_URL").replace(/\/$/, ""),
    username: requireEnv("ORANGEHRM_USERNAME"),
    password: requireEnv("ORANGEHRM_PASSWORD"),
  },
  api: {
    baseUrl: requireEnv("API_BASE_URL").replace(/\/$/, ""),
  },
  headless: boolEnv("HEADLESS"),
  workers: numberEnv("WORKERS", 4),
  logActions: boolEnv("LOG_ACTIONS"),
});
