import { NextRequest } from 'next/server';
import { mockDataStore } from '@/lib/mock-data-store';

export const dynamic = 'force-dynamic';

async function mockProxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return mockDataStore.handleRequest(request, path);
}

export const GET = mockProxy;
export const POST = mockProxy;
export const PUT = mockProxy;
export const DELETE = mockProxy;
