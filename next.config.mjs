/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  agentRules: false,
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { cpus: 1 }
};

export default nextConfig;
