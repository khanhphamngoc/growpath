import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET() {
  const [dbResult, redisResult] = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const dbStatus = dbResult.status === 'fulfilled' ? 'ok' : 'error';
  const redisStatus = redisResult.status === 'fulfilled' ? 'ok' : 'error';
  const healthy = dbStatus === 'ok' && redisStatus === 'ok';

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
