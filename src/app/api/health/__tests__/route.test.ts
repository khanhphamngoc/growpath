import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.hoisted ensures these mocks exist before the module factory runs (factories are hoisted)
const { mockQueryRaw, mockPing } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
  mockPing: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: { $queryRaw: mockQueryRaw } }));
vi.mock('@/lib/redis', () => ({ redis: { ping: mockPing } }));

import { GET } from '../route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with ok status when db and redis are healthy', async () => {
    mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    mockPing.mockResolvedValueOnce('PONG');

    const response = await GET();
    const body = await response.json() as Record<string, string>;

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.redis).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('returns 503 with degraded status when db is down', async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error('connection refused'));
    mockPing.mockResolvedValueOnce('PONG');

    const response = await GET();
    const body = await response.json() as Record<string, string>;

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.db).toBe('error');
    expect(body.redis).toBe('ok');
  });

  it('returns 503 with degraded status when redis is down', async () => {
    mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    mockPing.mockRejectedValueOnce(new Error('connection refused'));

    const response = await GET();
    const body = await response.json() as Record<string, string>;

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.db).toBe('ok');
    expect(body.redis).toBe('error');
  });

  it('returns 503 when both db and redis are down', async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error('db down'));
    mockPing.mockRejectedValueOnce(new Error('redis down'));

    const response = await GET();
    const body = await response.json() as Record<string, string>;

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.db).toBe('error');
    expect(body.redis).toBe('error');
  });
});
