import { authenticator } from 'otplib';

const REFRESH_WINDOW_SECONDS = 5;

export function generateTotp(secret: string): string {
  return authenticator.generate(secret);
}

export async function generateFreshTotp(secret: string): Promise<string> {
  if (authenticator.timeRemaining() < REFRESH_WINDOW_SECONDS) {
    const waitMs = (authenticator.timeRemaining() + 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return authenticator.generate(secret);
}

export function timeRemainingMs(): number {
  return authenticator.timeRemaining() * 1000;
}
