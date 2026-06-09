# Contract Testing — Pact

> Specialised reference for consumer-driven contract testing with Pact alongside Playwright. The why, the consumer test, the provider verification, the Pact Broker, the can-i-deploy gate, CI integration.

---

## Table of contents

1. [What contract testing is for](#1-what-its-for)
2. [Consumer vs provider](#2-consumer-vs-provider)
3. [Consumer test with Pact](#3-consumer-test)
4. [Provider verification](#4-provider-verification)
5. [The Pact Broker](#5-pact-broker)
6. [can-i-deploy](#6-can-i-deploy)
7. [When NOT to use contract testing](#7-when-not)

---

## 1. What it's for

Integration testing problem:
- Frontend deploys before backend.
- Backend deploys before frontend.
- Schema change breaks the contract silently.

Contract testing catches this: each side declares its expectations; both sides verify before deploying.

### 1.1 The shift-left

| Layer | When breakage detected |
|---|---|
| Production E2E | After deploy |
| Staging E2E | During deploy |
| Contract test | In CI, before merge |
| Static schema check | At lint time |

Contract testing moves API-mismatch failures to PR time.

---

## 2. Consumer vs provider

```
[Consumer (web app)] ──HTTP─→ [Provider (API service)]
       │                              │
       │ defines what it expects      │ verifies it can deliver
       │ in a "contract"              │
       ▼                              ▼
   pact.json ───────────────→ Pact Broker
```

### 2.1 Consumer-driven

The CONSUMER (frontend) drives the contract. It declares: "When I call GET /citations/{id}, I expect this response shape."

The PROVIDER (backend) MUST satisfy that contract.

This inverts traditional API design — the consumer says what it needs.

---

## 3. Consumer test

In the frontend repo (or Playwright suite testing the frontend):

```typescript
import { test, expect } from '@playwright/test';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const { string, integer, eachLike } = MatchersV3;

const pact = new PactV3({
  consumer: 'web-app',
  provider: 'citations-api',
});

test('GET /citations returns a list', async () => {
  pact
    .uponReceiving('a request for citations')
    .withRequest({
      method: 'GET',
      path: '/api/citations',
      headers: { Authorization: 'Bearer test-token' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: eachLike({
        id: string('CIT-001'),
        status: string('PAID'),
        amount: integer(150),
      }),
    });

  await pact.executeTest(async (mockServer) => {
    const response = await fetch(`${mockServer.url}/api/citations`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toMatch(/^CIT-/);
  });
});
```

The test produces a `pact.json` file describing the contract.

### 3.1 Matchers

`string('CIT-001')` says: "Expect a string. Use 'CIT-001' as the example for tests. The provider just needs to return SOME string here."

This is the key insight: matchers describe TYPES + SAMPLES. The provider doesn't need to match the exact sample, just the type.

---

## 4. Provider verification

In the backend repo:

```typescript
import { Verifier } from '@pact-foundation/pact';

await new Verifier({
  providerBaseUrl: 'http://localhost:8080',
  pactBrokerUrl: 'https://pact-broker.example.com',
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,
  provider: 'citations-api',
  providerVersion: process.env.GIT_SHA,
  publishVerificationResult: true,
}).verifyProvider();
```

This:
1. Downloads all pacts FROM consumers (from Pact Broker).
2. Runs the actual provider service.
3. Replays each consumer's expected requests against the provider.
4. Verifies responses match the contract.
5. Publishes pass/fail back to the broker.

### 4.1 Provider state

If a contract assumes "given a citation with ID CIT-001 exists":

```typescript
.given('a citation CIT-001 exists')
.uponReceiving('a request for CIT-001')
.withRequest({ method: 'GET', path: '/citations/CIT-001' })
// ...
```

The provider implementation must set up that state:

```typescript
new Verifier({
  // ...
  stateHandlers: {
    'a citation CIT-001 exists': async () => {
      await db.query('INSERT INTO citations VALUES ($1, $2, $3)', ['CIT-001', 'PAID', 150]);
    },
  },
});
```

---

## 5. Pact Broker

Central server hosting contracts:

```
Consumer test → publish pact → Broker
Provider verify → fetch pacts → Broker
                              ← publish results
```

Without a broker: contracts live as files in each repo. Hard to coordinate.

### 5.1 Self-hosted vs SaaS

- Self-hosted: `pact-foundation/pact-broker` Docker image. Free, requires ops.
- PactFlow: SaaS. Paid. Better UI, can-i-deploy automation, webhooks.

### 5.2 Publishing from CI

```bash
pact-broker publish ./pacts \
  --consumer-app-version=$GIT_SHA \
  --branch=$BRANCH \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN
```

---

## 6. can-i-deploy

The deployment gate:

```bash
pact-broker can-i-deploy \
  --pacticipant web-app \
  --version $GIT_SHA \
  --to-environment production
```

Returns:
- `0` (success) — all required contracts verified.
- non-zero — some consumer expectations not yet verified by provider.

### 6.1 The CI integration

```yaml
- name: Verify contracts
  run: pact-broker publish ./pacts --consumer-app-version=$GITHUB_SHA --broker-base-url=$URL

- name: Can I deploy?
  run: pact-broker can-i-deploy --pacticipant web-app --version $GITHUB_SHA --to-environment production
  # Build fails if this returns non-zero
```

Prevents deploys that would break a downstream consumer.

---

## 7. When NOT to use

- Internal monorepo where front + back deploy together: less benefit.
- Single-team services: communication > tooling.
- Public APIs with many consumers: too many contracts.
- Heavy event-driven (Kafka): use schema registry instead.

Contract testing shines for: microservices owned by separate teams, with separate release cadences.

---

## Cross-references

- API testing (the requests being contracted): [`../reference/06_api_testing.md`](../reference/06_api_testing.md)
- Mutation testing (test quality complement): [`./mutation_testing.md`](./mutation_testing.md)
