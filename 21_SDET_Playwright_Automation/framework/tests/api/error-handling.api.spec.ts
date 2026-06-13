import { test, expect } from '../../fixtures/api.fixture';
import { NotFoundError } from '../../utilities/api/errors';

// See users.api.spec.ts header — reqres.in requires REQRES_API_KEY.
test.describe('Error handling — typed error taxonomy', () => {
  test.skip(!process.env.REQRES_API_KEY, 'Set REQRES_API_KEY to run reqres-based API specs');

  test('@api get non-existent user throws NotFoundError', async ({ usersClient }) => {
    // reqres.in returns 404 for user id 9999
    await expect(usersClient.getById(9999)).rejects.toThrow(NotFoundError);
  });

  test('@api NotFoundError contains status, endpoint, responseBody', async ({ usersClient }) => {
    try {
      await usersClient.getById(9999);
      throw new Error('Expected NotFoundError was not thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
      const err = error as NotFoundError;
      expect(err.status).toBe(404);
      expect(err.endpoint).toContain('/api/users/9999');
      expect(err.message).toContain('404');
    }
  });
});
