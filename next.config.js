/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações básicas
  reactStrictMode: true,
  
  // Configurações de domínio
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://sistemavng.com.br' 
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ]
  },

  // Redirecionamentos
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: false,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: false,
      },
    ]
  },

  // Rewrites para API
  async rewrites() {
    return [
      {
        source: '/api/bling/:path*',
        destination: 'https://www.bling.com.br/Api/v3/:path*',
      },
    ]
  },

  // Configurações de imagem
  images: {
    domains: [
      'sistemavng.com.br',
      'www.sistemavng.com.br',
      'supabase.co',
      'bling.com.br',
      'www.bling.com.br',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Configurações experimentais
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
    ],
  },

  // Configurações de pacotes externos do servidor
  serverExternalPackages: ['@supabase/supabase-js'],

  // Configurações de compilação
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configurações de output
  output: 'standalone',
  
  // Configurações de bundle
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Otimizações para produção
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      }
    }

    return config
  },

  // Configurações de ambiente
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    DOMAIN: process.env.NODE_ENV === 'production' 
      ? 'https://sistemavng.com.br' 
      : 'http://localhost:3000',
  },

  // Configurações de TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // Configurações de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configurações de PWA (opcional)
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  //   disable: process.env.NODE_ENV === 'development',
  // },
}

module.exports = nextConfig