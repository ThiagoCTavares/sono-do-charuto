import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permite que o Next.js processe SVGs (necessário para o Dicebear)
    dangerouslyAllowSVG: true,
    // Camada extra de segurança para os SVGs
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;