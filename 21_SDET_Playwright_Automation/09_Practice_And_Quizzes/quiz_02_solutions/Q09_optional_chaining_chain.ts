/**
 * QUIZ 02 — Challenge 9 [HARD]: Explain This Optional Chaining Chain
 *
 * GIVEN CODE:
 *   const primaryPhone = response
 *     ?.customer?.contact?.addresses
 *     ?.find(addr => addr.type === 'HOME')
 *     ?.phones
 *     ?.find(phone => phone.primary);
 *   return primaryPhone?.number ?? null;
 *
 * QUESTION: What does each ?. do?  What happens if addresses is undefined?
 *           What does ?? null do?
 */

// ============================================================
// EXPLANATION — step by step
// ============================================================

interface Phone {
  number: string;
  primary: boolean;
}

interface Address {
  type: string;
  phones: Phone[];
}

interface Contact {
  addresses?: Address[];
}

interface Customer {
  contact?: Contact;
}

interface ApiResponse {
  customer?: Customer;
}

async function getPrimaryPhoneNumber(
  response: ApiResponse,
): Promise<string | null> {
  // Each ?. is the OPTIONAL CHAINING OPERATOR.
  // It short-circuits and returns `undefined` (without throwing) if the
  // left-hand side is null or undefined.
  //
  // Step-by-step evaluation:
  //
  // response?.customer
  //   → if response is null/undefined → return undefined
  //   → else                          → return response.customer
  //
  // ?.contact
  //   → if .customer was undefined → return undefined (skip .contact)
  //   → else                       → return .customer.contact
  //
  // ?.addresses
  //   → if .contact was undefined → return undefined
  //   → else                      → return .contact.addresses
  //
  // ?.find(addr => addr.type === 'HOME')
  //   → if .addresses was undefined → return undefined (no TypeError!)
  //   → else                        → Array.prototype.find() — returns the
  //                                   first matching Address or undefined
  //
  // ?.phones
  //   → if .find() returned undefined (no HOME address) → return undefined
  //   → else → return the matched address's .phones array
  //
  // ?.find(phone => phone.primary)
  //   → if .phones was undefined → return undefined
  //   → else                     → find the primary Phone or undefined

  const primaryPhone = response?.customer?.contact?.addresses
    ?.find((addr) => addr.type === "HOME")
    ?.phones?.find((phone) => phone.primary);

  // primaryPhone?.number
  //   → if primaryPhone is undefined → return undefined
  //   → else                         → return primaryPhone.number
  //
  // ?? null  (NULLISH COALESCING OPERATOR)
  //   → if the left side is null OR undefined → return null (the right side)
  //   → else                                  → return the left-side value
  //   Note: ?? is stricter than ||  —  it only catches null/undefined,
  //         not falsy values like '' or 0.
  return primaryPhone?.number ?? null;
}

// ============================================================
// Demonstration of different input shapes
// ============================================================

async function runExamples() {
  // 1 — Full happy-path response
  const full: ApiResponse = {
    customer: {
      contact: {
        addresses: [
          {
            type: "WORK",
            phones: [{ number: "512-000-0001", primary: false }],
          },
          {
            type: "HOME",
            phones: [
              { number: "512-000-0002", primary: false },
              { number: "512-000-0003", primary: true }, // ← target
            ],
          },
        ],
      },
    },
  };
  console.log(await getPrimaryPhoneNumber(full)); // → '512-000-0003'

  // 2 — addresses is undefined
  const noAddresses: ApiResponse = {
    customer: { contact: { addresses: undefined } },
  };
  console.log(await getPrimaryPhoneNumber(noAddresses)); // → null  (no error!)

  // 3 — customer is undefined
  const noCustomer: ApiResponse = {};
  console.log(await getPrimaryPhoneNumber(noCustomer)); // → null

  // 4 — no HOME address
  const noHome: ApiResponse = {
    customer: {
      contact: {
        addresses: [
          { type: "WORK", phones: [{ number: "512-000-0001", primary: true }] },
        ],
      },
    },
  };
  console.log(await getPrimaryPhoneNumber(noHome)); // → null

  // 5 — no primary phone in HOME address
  const noPrimary: ApiResponse = {
    customer: {
      contact: {
        addresses: [
          {
            type: "HOME",
            phones: [{ number: "512-000-0004", primary: false }],
          },
        ],
      },
    },
  };
  console.log(await getPrimaryPhoneNumber(noPrimary)); // → null
}

// Equivalent WITHOUT optional chaining (verbose, error-prone):
async function getPrimaryPhoneNumber_verbose(
  response: ApiResponse,
): Promise<string | null> {
  if (!response) return null;
  if (!response.customer) return null;
  if (!response.customer.contact) return null;
  if (!response.customer.contact.addresses) return null;

  const homeAddr = response.customer.contact.addresses.find(
    (a) => a.type === "HOME",
  );
  if (!homeAddr) return null;
  if (!homeAddr.phones) return null;

  const primaryPhone = homeAddr.phones.find((p) => p.primary);
  if (!primaryPhone) return null;

  return primaryPhone.number ?? null;
}

export { getPrimaryPhoneNumber, getPrimaryPhoneNumber_verbose, runExamples };

// WHY
// Enterprise APIs return deeply nested optional structures.  Before optional
// chaining you had to write defensive null checks at every level (see
// getPrimaryPhoneNumber_verbose above).  Optional chaining collapses all of
// that into a single linear expression that safely returns `undefined` at the
// first missing link in the chain.
//
// ?. vs &&:
//   obj?.prop    → short-circuits on null/undefined, returns undefined
//   obj && obj.prop → short-circuits on ANY falsy (0, '', false, NaN too)
//
// ?? vs ||:
//   a ?? b  → returns b only if a is null or undefined
//   a || b  → returns b if a is ANY falsy value (can cause bugs with 0 or '')
//
// Use ?. + ?? together when navigating optional nested API responses in test
// assertions and helper functions.
