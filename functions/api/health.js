import { proxyScan } from '../_scan-proxy.js';

export function onRequestGet({ request, env }) {
  return proxyScan(request, env, '/api/health');
}
