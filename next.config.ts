import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/i/teamlogos/nfl/500/**",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/profile_images/**",
      },
    ],
  },
};

export default nextConfig;
