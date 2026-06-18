import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev-only indicator out of the bottom-center controls.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
