/**
 * Reqres.in API Types
 *
 * Typed interfaces for the reqres.in public demo API responses.
 */

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
  support?: {
    url: string;
    text: string;
  };
}

export interface ReqresUserResponse {
  data: ReqresUser;
  support?: {
    url: string;
    text: string;
  };
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

export interface ReqresUpdateUserResponse {
  name: string;
  job: string;
  updatedAt: string;
}
