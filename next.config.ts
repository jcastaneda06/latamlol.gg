import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.communitydragon.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.communitydragon.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.merakianalytics.com",
        pathname: "/**",
      },
    ],
  },
  // Allow server-side Riot API calls
  serverExternalPackages: ["@fightmegg/riot-api"],
};

export default nextConfig;
