import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // /fr/ et /en/ deviennent out/fr/index.html et out/en/index.html :
  // servis tels quels par GitHub Pages, sans dépendre de la résolution des .html.
  trailingSlash: true,
  images: { unoptimized: true },
  // Deux layouts racine (`/` et `/[lang]`) : la 404 est une page autonome,
  // app/global-not-found.tsx.
  experimental: { globalNotFound: true },
};

export default nextConfig;
