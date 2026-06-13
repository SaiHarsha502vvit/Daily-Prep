import { test, expect } from '../../fixtures/api.fixture';

test.describe('Users API — full CRUD flow', () => {
  test('@api list users returns paginated results', async ({ usersClient }) => {
    const page1 = await usersClient.list(1);

    expect(page1.page).toBe(1);
    expect(page1.per_page).toBeGreaterThan(0);
    expect(page1.total).toBeGreaterThan(0);
    expect(page1.total_pages).toBeGreaterThan(0);
    expect(page1.data.length).toBeGreaterThan(0);

    const first = page1.data[0];
    expect(first).toBeDefined();
    expect(first!.email).toContain('@');
    expect(first!.first_name).toBeTruthy();
    expect(first!.last_name).toBeTruthy();
  });

  test('@api get user by id returns a valid user', async ({ usersClient }) => {
    const user = await usersClient.getById(2);

    expect(user.id).toBe(2);
    expect(user.email).toContain('@');
    expect(user.first_name).toBeTruthy();
    expect(user.last_name).toBeTruthy();
    expect(user.avatar).toContain('https://');
  });

  test('@api create user echoes payload with new id', async ({ usersClient }) => {
    const payload = { name: 'Neo Anderson', job: 'The One' };
    const created = await usersClient.create(payload);

    expect(created.name).toBe(payload.name);
    expect(created.job).toBe(payload.job);
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
  });

  test('@api update user returns updated fields', async ({ usersClient }) => {
    const payload = { name: 'Trinity', job: 'Hacker' };
    const updated = await usersClient.update(2, payload);

    expect(updated.name).toBe(payload.name);
    expect(updated.job).toBe(payload.job);
    expect(updated.updatedAt).toBeTruthy();
  });

  test('@api patch user returns updated fields', async ({ usersClient }) => {
    const payload = { name: 'Morpheus', job: 'Captain' };
    const patched = await usersClient.patch(2, payload);

    expect(patched.name).toBe(payload.name);
    expect(patched.job).toBe(payload.job);
    expect(patched.updatedAt).toBeTruthy();
  });

  test('@api delete user returns no content', async ({ usersClient }) => {
    // reqres.in always returns 204 for delete
    await expect(usersClient.delete(2)).resolves.toBeUndefined();
  });
});
