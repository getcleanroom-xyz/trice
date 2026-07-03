import type { NextConfig } from "next";

// Next.js 16: Turbopack is the default bundler for `next dev` and `next build`,
// no --turbopack flag needed. `middleware.ts` was renamed to `proxy.ts` in this
// version to make the network boundary explicit — see app/proxy.ts if we add
// device-token handling for the draggable-layout persistence later.
const nextConfig: NextConfig = {
  typedRoutes: true,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon).*)",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
