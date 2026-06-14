# OpenTelemetry Integration for the API Client

The `ApiCore` class is instrumented with OpenTelemetry spans that capture HTTP method,
URL, target, and status code for every outgoing request. Trace context is automatically
propagated via W3C `traceparent` headers so that downstream services can correlate
their spans with the test run.

---

## Installation

```bash
npm install @opentelemetry/api
```

> Without the package the tracing helpers in `telemetry.ts` degrade to no-op stubs,
> so existing tests continue to work. The `@opentelemetry/api` package is a **runtime
> peer dependency** — you do not need it to compile or run tests that do not use tracing.

---

## Configuration

Instrumentation is opt-in. You configure the tracer provider **once**, before any test
runs, using the OpenTelemetry SDK auto-instrumentation or manual SDK setup.

### Option A — OTLP Exporter (Grafana Tempo, Jaeger, etc.)

```ts
// otel.ts  — import this at the very top of your setup file
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    // Default OTLP endpoint. Override with OTEL_EXPORTER_OTLP_ENDPOINT env var.
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### Option B — Jaeger Direct

```ts
import { JaegerExporter } from '@opentelemetry/exporter-trace-jaeger';

const exporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT ?? 'http://localhost:14268/api/traces',
});
```

### Option C — Datadog

```ts
import { DatadogExporter } from '@opentelemetry/exporter-trace-otlp-http';

const exporter = new DatadogExporter({
  // DD_API_KEY must be set in the environment
  agentUrl: 'https://api.datadoghq.com/api/v0/traces',
});
```

---

## Span Attributes

Every API call emits a span named `http.<method>` (e.g. `http.get`, `http.post`) with:

| Attribute          | Description                          | Example                         |
| ------------------ | ------------------------------------ | ------------------------------- |
| `http.method`      | HTTP verb                            | `GET`                           |
| `http.url`         | Full request URL                     | `https://api.example.com/users` |
| `http.target`      | Request path + query                 | `/users?page=1`                 |
| `http.status_code` | Numeric HTTP response status         | `200`                           |
| `error`            | Set to `true` when the request threw | `true`                          |

Exception details are recorded via `span.recordException()` on failure.

---

## Trace Propagation

`ApiCore` calls `propagation.inject()` before every request, adding a `traceparent`
header to the outgoing HTTP request. Any service that reads W3C trace context headers
will see the Playwright test span as the parent.

---

## Correlating Test Failures with Traces

1. Give each Playwright test run a unique `test.run_id` attribute on the tracer:

   ```ts
   const tracer = getApiTracer('playwright-tests');
   // At test setup:
   tracer.startSpan('test.setup', { attributes: { 'test.run_id': process.env.TEST_RUN_ID } }).end();
   ```

2. When a test fails, log the current trace ID:

   ```ts
   import { trace } from '@opentelemetry/api';
   const activeSpan = trace.getActiveSpan();
   const spanContext = activeSpan?.spanContext();
   console.log(`TraceID: ${spanContext?.traceId}`);
   ```

3. Use the trace ID to jump directly to the spans in Jaeger, Tempo, or Datadog.

---

## Running Tests

```bash
# Standard run (no tracing)
npx playwright test

# With OTLP exporter
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces npx playwright test

# With Jaeger
JAEGER_ENDPOINT=http://localhost:14268/api/traces npx playwright test
```

---

## Files

| File                                | Purpose                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `utilities/api/telemetry.ts`        | No-op-safe helpers: `getApiTracer`, `createApiSpan`, `propagation` |
| `utilities/api/ApiCore.ts`          | Instrumented HTTP client (adds spans + propagation)                |
| `utilities/api/TELEMETRY_README.md` | This document                                                      |
