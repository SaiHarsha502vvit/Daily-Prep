/**
 * QUIZ 02 — Challenge 12 [EASY]: Write the Typed Response Interface
 *
 * GIVEN JSON:
 *   { "orderId": "ORD-2026-001", "status": "PROCESSING", "totalAmount": 299.99,
 *     "currency": "USD", "lineItems": [{ "sku": "PROD-A", "description": ...,
 *     "quantity": 2, "unitPrice": 149.995, "discountApplied": true,
 *     "discountCode": "SAVE10" }],
 *     "shippingAddress": { "line1": "123 Main St", "city": "Austin", "state": "TX",
 *     "postalCode": "78701", "country": "US" },
 *     "createdAt": "2026-05-28T09:00:00Z", "estimatedDelivery": "2026-06-02",
 *     "trackingNumber": null }
 *
 * QUESTION: Write the complete TypeScript interface for this response.
 */

import { test, expect } from "@playwright/test";

// ============================================================
// ✅ SOLUTION — TypeScript interfaces
// ============================================================

/** Valid states an order can be in (string literal union). */
type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

/**
 * A single line item within an order.
 * discountCode is string | null because the API always includes the field
 * but sets it to null when no discount was applied.
 */
interface LineItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountApplied: boolean;
  discountCode: string | null; // null when no discount; never omitted
}

/**
 * A physical shipping address.
 * line2 is optional because many addresses don't have an apartment/suite.
 */
interface ShippingAddress {
  line1: string;
  line2?: string; // optional — apartment / suite / etc.
  city: string;
  state: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2, e.g. 'US'
}

/**
 * Complete typed response for GET /orders/{id}.
 */
interface OrderResponse {
  orderId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string; // ISO 4217, e.g. 'USD'
  lineItems: LineItem[];
  shippingAddress: ShippingAddress;
  createdAt: string; // ISO 8601 timestamp — parse if you need Date math
  estimatedDelivery: string; // ISO 8601 date string, e.g. '2026-06-02'
  trackingNumber: string | null; // null before the shipment is picked up
}

// ============================================================
// Usage in API tests
// ============================================================

test("GET /orders/:id — verify structure", async ({ request }) => {
  const response = await request.get("/api/v1/orders/ORD-2026-001");
  expect(response.ok()).toBeTruthy();

  // Cast with the typed interface — get compile-time safety in assertions
  const order = (await response.json()) as OrderResponse;

  // TypeScript now knows the shape — full autocomplete + type checking
  expect(order.orderId).toBe("ORD-2026-001");
  expect(order.status).toBe("PROCESSING");
  expect(order.totalAmount).toBeGreaterThan(0);
  expect(order.lineItems).toHaveLength(1);

  const item = order.lineItems[0]!;
  expect(item.sku).toBe("PROD-A");
  expect(item.quantity).toBeGreaterThan(0);
  expect(item.discountApplied).toBe(true);
  expect(item.discountCode).toBe("SAVE10");

  expect(order.shippingAddress.city).toBe("Austin");
  expect(order.trackingNumber).toBeNull(); // not shipped yet
});

// ============================================================
// Advanced: use discriminated unions for order status variants
// ============================================================

interface BaseOrder {
  orderId: string;
  totalAmount: number;
  lineItems: LineItem[];
}

interface PendingOrder extends BaseOrder {
  status: "PENDING";
  trackingNumber: null; // always null when PENDING
}

interface ShippedOrder extends BaseOrder {
  status: "SHIPPED" | "DELIVERED";
  trackingNumber: string; // always present when shipped
  estimatedDelivery: string;
}

type TypedOrder = PendingOrder | ShippedOrder;

function assertOrderShipped(order: TypedOrder): asserts order is ShippedOrder {
  if (order.status !== "SHIPPED" && order.status !== "DELIVERED") {
    throw new Error(`Expected shipped/delivered order, got ${order.status}`);
  }
}

export type {
  OrderStatus,
  LineItem,
  ShippingAddress,
  OrderResponse,
  TypedOrder,
  PendingOrder,
  ShippedOrder,
};
export { assertOrderShipped };

// WHY
// Typed API interfaces give you:
//   1. Autocomplete — IDE suggests field names as you write assertions.
//   2. Compile-time safety — typos like `order.ordrid` fail at tsc, not at
//      runtime when the test silently passes with undefined.
//   3. Refactoring confidence — rename a field and TypeScript shows every
//      caller that needs to update.
//   4. Documentation — the interface is live documentation of the API contract.
//
// string | null vs string | undefined:
//   string | null   → the API always includes the field; its value is null
//                     when absent (explicit null — JSON serialized as `null`)
//   string | undefined → the API may omit the field entirely (key not present
//                     in the JSON response)
//   Ask the backend team which one they use; the JSON schema or swagger spec
//   will tell you.  When unsure, use string | null — it's safer for
//   serialization/deserialization.
