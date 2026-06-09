import { test, expect } from '../../fixtures/api.fixture';

test.describe('Resources API — list and get', () => {
  test('@api list resources returns paginated results', async ({ resourcesClient }) => {
    const page1 = await resourcesClient.list(1);

    expect(page1.page).toBe(1);
    expect(page1.per_page).toBeGreaterThan(0);
    expect(page1.total).toBeGreaterThan(0);
    expect(page1.total_pages).toBeGreaterThan(0);
    expect(page1.data.length).toBeGreaterThan(0);

    const first = page1.data[0];
    expect(first).toBeDefined();
    expect(first.name).toBeTruthy();
    expect(first.year).toBeGreaterThan(0);
    expect(first.color).toMatch(/^#/);
    expect(first.pantone_value).toBeTruthy();
  });

  test('@api get resource by id returns complete record', async ({ resourcesClient }) => {
    const resource = await resourcesClient.getById(2);

    expect(resource.id).toBe(2);
    expect(resource.name).toBeTruthy();
    expect(resource.year).toBeGreaterThan(0);
    expect(resource.color).toMatch(/^#/);
    expect(resource.pantone_value).toBeTruthy();
  });
});
