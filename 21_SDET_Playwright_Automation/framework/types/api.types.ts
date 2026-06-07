export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  errors?: ApiError[];
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ReqresUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

export interface ReqresUserListResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: ReqresUser[];
}

export interface ReqresCreateUserPayload {
  name: string;
  job: string;
}

export interface ReqresCreateUserResponse {
  id: string;
  name: string;
  job: string;
  createdAt: string;
}
