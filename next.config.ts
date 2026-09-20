import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O export estático só entra em produção; em dev o next mantém os recursos completos.
  ...(process.env.NODE_ENV === "production" ? { output: "export" } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
