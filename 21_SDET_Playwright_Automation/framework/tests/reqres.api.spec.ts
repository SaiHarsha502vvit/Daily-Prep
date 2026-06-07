import { test, expect } from '../fixtures/page.fixture';
import { endpoints } from '../constants/endpoints';
import { AppConstants } from '../constants/app.constants';
import { uniqueId } from '../utilities/data/data.loader';
import type {
  ReqresCreateUserPayload,
  ReqresCreateUserResponse,
  ReqresUser,
  ReqresUserListResponse,
} from '../types/api.types';

const COMMON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

test.describe('Reqres API — typed wrapper smoke', () => {
  test('@api list users returns typed page', async ({ apiUtils }) => {
    const response = await apiUtils.get(
      endpoints.reqres.USERS,
      COMMON_HEADERS,
      AppConstants.HTTP_OK,
      { queryParams: { page: '2' } }
    );
    const body = (await response.json()) as ReqresUserListResponse;
    expect(body.page).toBe(2);
    expect(body.data.length).toBeGreaterThan(0);
    const first: ReqresUser | undefined = body.data[0];
    expect(first?.email).toContain('@');
  });

  test('@api create user echoes payload', async ({ apiUtils }) => {
    const payload: ReqresCreateUserPayload = {
      name: `Test ${uniqueId('user')}`,
      job: 'SDET',
    };
    const response = await apiUtils.post(
      endpoints.reqres.USERS,
      COMMON_HEADERS,
      payload,
      AppConstants.HTTP_CREATED
    );
    const body = (await response.json()) as ReqresCreateUserResponse;
    expect(body.name).toBe(payload.name);
    expect(body.job).toBe(payload.job);
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
  });
});
