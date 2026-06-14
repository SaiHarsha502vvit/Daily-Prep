import { APP } from "./app.constants";

export const endpoints = {
  orangehrm: {
    LOGIN: "/web/index.php/auth/login",
    DASHBOARD: "/web/index.php/dashboard/index",
  },
  reqres: {
    USERS: `${APP.reqres.baseUrl}/api/users`,
    USER_BY_ID: (id: string | number): string =>
      `${APP.reqres.baseUrl}/api/users/${id}`,
    LIST_USERS: (page: number = 1): string =>
      `${APP.reqres.baseUrl}/api/users?page=${page}`,
    CREATE_USER: `${APP.reqres.baseUrl}/api/users`,
    REGISTER: `${APP.reqres.baseUrl}/api/register`,
    LOGIN: `${APP.reqres.baseUrl}/api/login`,
    // Orders endpoint (simulated — reqres.in doesn't have orders, we use users as order records)
    ORDER_BY_CUSTOMER_ID: (customerId: string | number): string =>
      `${APP.reqres.baseUrl}/api/users/${customerId}`,
    // Notifications (simulated as a separate "resource" collection)
    NOTIFICATIONS: `${APP.reqres.baseUrl}/api/unknown`, // closest match in reqres.in
  },
  internet: {
    LOGIN: `${APP.internet.baseUrl}/login`,
    DROPDOWN: `${APP.internet.baseUrl}/dropdown`,
  },
} as const;
