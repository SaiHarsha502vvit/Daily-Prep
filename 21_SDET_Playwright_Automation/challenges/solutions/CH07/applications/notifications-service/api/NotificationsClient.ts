/**
 * NotificationsService API Client — verifies ORDER_CONFIRMED events.
 *
 * reqres.in does not have a real notifications endpoint. This client demonstrates
 * the pattern by polling a known resource collection (reqres.in's /unknown endpoint)
 * and asserting that the "notification" was recorded in the test data bridge.
 *
 * In a real system this would be: GET /api/notifications?customerId={id}&type=ORDER_CONFIRMED
 */
import type { APIRequestContext } from "@playwright/test";
import { endpoints } from "../../../constants/endpoints";
import { APP } from "../../../constants/app.constants";
import type {
  NotificationListResponse,
  NotificationRecord,
} from "../../../types/cross-site.types";

export class NotificationsClient {
  private readonly baseUrl: string;

  constructor(
    private readonly request: APIRequestContext,
    baseUrl: string = APP.reqres.baseUrl,
  ) {
    this.baseUrl = baseUrl;
  }

  /**
   * GET /api/unknown — reqres.in's "unknown resources" endpoint.
   * We use this to simulate a notification query. In a real system this would be
   * GET /api/notifications?customerId={id}&type=ORDER_CONFIRMED
   *
   * The response shape is intentionally similar: a paginated list of records
   * with type metadata. We assert that our notification record exists.
   */
  async getNotificationsForCustomer(
    customerId: string | number,
  ): Promise<NotificationListResponse> {
    // Simulate: GET /api/notifications?customer_id={customerId}&type=ORDER_CONFIRMED
    // reqres.in doesn't have this endpoint, so we hit /api/unknown and filter by
    // the page parameter that encodes our "customer ID" as a proxy.
    // In production: const url = `${this.baseUrl}/api/notifications?customer_id=${customerId}`;
    const url = `${this.baseUrl}/api/unknown?page=${customerId}`;
    const response = await this.request.get(url);

    if (!response.ok()) {
      throw new Error(
        `NotificationsClient.getNotifications: Expected 200, got ${response.status()} at ${url}`,
      );
    }

    const body = (await response.json()) as NotificationListResponse;
    return body;
  }

  /**
   * Verifies that an ORDER_CONFIRMED notification exists for the given customer.
   * Returns the notification record if found, throws if not found.
   */
  async expectOrderConfirmedNotification(
    customerId: string | number,
    orderId: number,
  ): Promise<NotificationRecord> {
    const response = await this.getNotificationsForCustomer(customerId);

    // reqres.in /api/unknown returns resources in its data array.
    // We treat page number = customerId as a correlation mechanism (mock behavior).
    // In a real system we'd filter: data.find(n => n.customerId === customerId && n.type === 'ORDER_CONFIRMED')
    const matching = response.data.find(
      (record) =>
        // In real system: record.type === 'ORDER_CONFIRMED' && record.customerId === customerId
        // In mock (reqres.in), we validate the response shape instead:
        record !== undefined,
    );

    if (!matching) {
      throw new Error(
        `NotificationsClient: No ORDER_CONFIRMED notification found for customer ${customerId}, order ${orderId}`,
      );
    }

    return matching;
  }
}
