import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (Number(request.headers.get('content-length') || 0) > 11 * 1024 * 1024) return Response.json({ detail: 'Request exceeds the 10 MB upload limit.' }, { status: 413 });
  const { path } = await context.params;
  const target = `${process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000'}/api/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const key of ['content-type','cookie','authorization','origin']) { const value = request.headers.get(key); if (value) headers.set(key,value); }
  try {
    const body = ['GET','HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
    if (body && body.byteLength > 11 * 1024 * 1024) return Response.json({ detail: 'Request exceeds upload limit.' }, { status: 413 });
    const result = await fetch(target, { method: request.method, headers, body, cache: 'no-store', redirect: 'manual' });
    const output = new Headers();
    for (const key of ['content-type','set-cookie','content-disposition']) { const value = result.headers.get(key); if (value) output.set(key,value); }
    output.set('cache-control', 'no-store');
    return new Response(result.body, { status: result.status, headers: output });
  } catch { return Response.json({ detail: 'The NMIP API is unavailable. Check that the backend is running.' }, { status: 503 }); }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
