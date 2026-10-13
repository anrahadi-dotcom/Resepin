export function onRequestPost() {
  return Response.json({
    detail: 'Scan kamera belum tersedia di versi Cloudflare. Tambahkan bahan secara manual atau jalankan server Resepin lokal.'
  }, { status: 501 });
}
