/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.CAMPUSOS_BUILD_DIR || ".next",
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
