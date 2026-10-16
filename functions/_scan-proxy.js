export async function proxyScan(request, env, endpoint) {
  const baseUrl = env.RESEPIN_SCAN_API_URL;
  const token = env.RESEPIN_SCAN_TOKEN;
  if (!baseUrl || !token) {
    return Response.json({
      detail: 'Pemindai foto belum dikonfigurasi. Mode Demo dan input manual tetap tersedia.'
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  let target;
  try {
    const base = new URL(baseUrl);
    if (base.protocol !== 'https:') throw new Error('HTTPS required');
    target = new URL(endpoint, base.href.endsWith('/') ? base : `${base.href}/`);
  } catch {
    return Response.json({ detail: 'Konfigurasi server pemindai tidak valid.' }, { status: 503 });
  }

  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  });
  const contentType = request.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);
  const origin = request.headers.get('Origin');
  if (origin) headers.set('Origin', origin);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'POST' ? request.body : undefined,
      redirect: 'manual'
    });
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    const upstreamType = upstream.headers.get('Content-Type');
    if (upstreamType) responseHeaders.set('Content-Type', upstreamType);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders
    });
  } catch {
    return Response.json({
      detail: 'Server pemindai sedang tidur atau tidak dapat dijangkau. Coba lagi sebentar.'
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
