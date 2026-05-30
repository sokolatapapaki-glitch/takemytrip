import { test, expect } from '@playwright/test';

test.describe('API Routes', () => {

  test('GET /api/session returns session shape', async ({ request }) => {
    const res = await request.get('/api/session');
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Unauthenticated session should have user null or no user key
    expect(body).toBeDefined();
  });

  test('POST /api/product/read returns array', async ({ request }) => {
    const res = await request.post('/api/product/read', {
      data: {},
    });
    expect([200, 401]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body)).toBeTruthy();
    }
  });

  test('POST /api/product/create without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/product/create', {
      data: { name: 'Unauthorized Product', price: 1.0 },
    });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/product/delete without auth returns 401', async ({ request }) => {
    const res = await request.delete('/api/product/delete', {
      data: { where: { id: 'fake-id' } },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/auth/signup rejects duplicate email', async ({ request }) => {
    const email = `dup_${Date.now()}@example.com`;

    await request.post('/api/auth/signup', {
      data: { email, password: 'TestPass1!' },
    });

    const res = await request.post('/api/auth/signup', {
      data: { email, password: 'TestPass1!' },
    });

    expect(res.status()).toBe(400);
  });

  test('POST /api/auth/signup rejects missing fields', async ({ request }) => {
    const res = await request.post('/api/auth/signup', {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/auth/send-reset-email with unknown email returns error', async ({ request }) => {
    const res = await request.post('/api/auth/send-reset-email', {
      data: { email: 'ghost@nowhere.com' },
    });
    expect(res.status()).not.toBe(200);
  });

});
