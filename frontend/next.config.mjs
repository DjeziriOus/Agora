/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL;
    if (!backend) {
      throw new Error(
        "NEXT_PUBLIC_API_URL env var is required for /api/auth rewrites",
      );
    }
    return [
      {
        source: "/api/auth/:path*",
        destination: `${backend}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
