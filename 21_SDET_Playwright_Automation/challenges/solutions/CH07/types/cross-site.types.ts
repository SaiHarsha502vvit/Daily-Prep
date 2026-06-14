export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
}

export interface CreateCustomerPayload {
  name: string;
  job: string;
}

export interface CreateCustomerResponse {
  id: string;
  name: string;
  job: string;
  createdAt: string;
}

export interface Order {
  id: number;
  customerId: number;
  product: string;
  amount: number;
  status: "pending" | "confirmed" | "shipped";
}

export interface CreateOrderPayload {
  customerId: number;
  product: string;
  amount: number;
}

export interface CreateOrderResponse {
  id: number;
  customerId: number;
  product: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  customerId: number;
  type: "ORDER_CONFIRMED" | "ORDER_SHIPPED" | "ORDER_CANCELLED";
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  data: NotificationRecord[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface TestData {
  customerId: string;
  customerEmail: string;
  orderId: number;
  orderConfirmationCode: string;
}
