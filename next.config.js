/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep server-only secrets out of the client bundle explicitly.
  env: {},
};
module.exports = nextConfig;
