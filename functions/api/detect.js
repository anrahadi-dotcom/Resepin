import { proxyScan } from '../_scan-proxy.js';

export function onRequestPost({ request, env }) {
  return proxyScan(request, env, '/api/detect');
}
