/**
 * OpenTelemetry tracing helpers for the API client.
 *
 * Usage:
 *   import { getApiTracer, createApiSpan, propagation } from './telemetry';
 *
 * The functions here are safe to call even when @opentelemetry/api is not
 * installed — they fall back to no-op implementations.
 */
import type { Tracer, Span, Attributes } from '@opentelemetry/api';

// ---------------------------------------------------------------------------
// Conditional import — gracefully degrades when the package is absent
// ---------------------------------------------------------------------------

let _getTracer: (name: string) => Tracer = () =>
  ({
    startSpan: () => ({
      setAttribute: () => {},
      setAttributes: () => {},
      recordException: () => {},
      end: () => {},
      setStatus: () => {},
    }),
  }) as unknown as Tracer;

let _startSpan: (tracer: Tracer, name: string, opts?: { attributes?: Attributes }) => Span = () =>
  ({
    setAttribute: () => {},
    setAttributes: () => {},
    recordException: () => {},
    end: () => {},
    setStatus: () => {},
  }) as unknown as Span;

let _inject: (context: unknown, carrier: Record<string, string>) => void = () => {};

try {
  // Dynamic import so the module does not crash at bundle-time when the package is missing
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const otel = require('@opentelemetry/api');
  _getTracer = otel.trace.getTracer.bind(otel.trace);
  _startSpan = (tracer: Tracer, name: string, opts?: { attributes?: Attributes }) =>
    tracer.startSpan(name, opts);
  _inject = otel.propagation.inject.bind(otel.propagation);
} catch {
  // Package not available — stubs remain in place
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a `Tracer` for the given service name.
 * When @opentelemetry/api is absent, returns a no-op tracer.
 */
export function getApiTracer(serviceName = 'playwright-tests'): Tracer {
  return _getTracer(serviceName);
}

/**
 * Starts a new span with the given name and optional attributes.
 * When @opentelemetry/api is absent, returns a no-op span.
 */
export function createApiSpan(tracer: Tracer, name: string, attributes?: Attributes): Span {
  return _startSpan(tracer, name, { attributes });
}

/**
 * Injects the current trace context into a headers carrier (e.g. `Record<string, string>`)
 * so that downstream services can continue the trace.
 *
 * No-op when @opentelemetry/api is absent.
 */
export const propagation = {
  inject(carrier: Record<string, string>): void {
    _inject(undefined, carrier);
  },
};
