/** @type {import('next').NextConfig} */

// Páginas estáticas originales servidas tal cual desde public/.
// Los rewrites replican el comportamiento "cleanUrls" que antes daba vercel.json.
const staticPages = [
  'que-es',
  'como-funciona',
  'miembros',
  'proyectos',
  'podcast',
  'aliados',
  'contacto',
];

const nextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  async rewrites() {
    return {
      afterFiles: [
        { source: '/', destination: '/index.html' },
        ...staticPages.map((page) => ({
          source: `/${page}`,
          destination: `/${page}.html`,
        })),
      ],
    };
  },
  async redirects() {
    return [
      { source: '/index', destination: '/', permanent: true },
      ...staticPages.map((page) => ({
        source: `/${page}.html`,
        destination: `/${page}`,
        permanent: true,
      })),
      { source: '/apoya.html', destination: '/apoya', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/Assets/Videos/web/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/css/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/js/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
      },
    ];
  },
};

export default nextConfig;
