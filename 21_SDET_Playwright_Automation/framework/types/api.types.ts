export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorItem {
  code: string;
  message: string;
  field?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  errors?: ApiErrorItem[];
}

/* ----- User types ----- */

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

export interface ListUsersResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: User[];
  support?: SupportInfo;
}

export interface GetUserResponse {
  data: User;
  support?: SupportInfo;
}

export interface CreateUserRequest {
  name: string;
  job: string;
}

export interface CreateUserResponse {
  id: string;
  name: string;
  job: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  name: string;
  job: string;
}

export interface UpdateUserResponse {
  name: string;
  job: string;
  updatedAt: string;
}

/* ----- Resource types ----- */

export interface Resource {
  id: number;
  name: string;
  year: number;
  color: string;
  pantone_value: string;
}

export interface ListResourcesResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: Resource[];
  support?: SupportInfo;
}

export interface GetResourceResponse {
  data: Resource;
  support?: SupportInfo;
}

/* ----- Support info (shared across many responses) ----- */

export interface SupportInfo {
  url: string;
  text: string;
}

/* ----- Auth types ----- */

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterSuccessResponse {
  id: number;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginSuccessResponse {
  token: string;
}

/* ----- Legacy exported names (kept for backwards compat) ----- */

export type ReqresUser = User;
export type ReqresUserListResponse = ListUsersResponse;
export type ReqresCreateUserPayload = CreateUserRequest;
export type ReqresCreateUserResponse = CreateUserResponse;
