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
        "NEXT_PUBLIC_API_URL env var is required for /api/* rewrites",
      );
    }
    // Proxy ALL /api/* through the frontend domain. Going direct to Railway
    // would make the session cookie cross-site → Brave (and Chrome with 3PCD)
    // drops it → every authenticated call returns 401.
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
