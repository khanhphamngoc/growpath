import { describe, it, expect, afterAll } from 'vitest';
import { GET } from '@/app/api/health/route';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

describe('GET /api/health — integration', () => {
  afterAll(async () => {
    await db.$disconnect();
    await redis.quit();
  });

  it('returns 200 and connects to real PostgreSQL and Redis', async () => {
    const response = await GET();
    const body = await response.json() as Record<string, string>;

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.redis).toBe('ok');
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
