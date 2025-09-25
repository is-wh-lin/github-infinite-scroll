// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/test-utils', '@nuxt/ui', '@nuxt/fonts'],

  // Static site generation configuration for GitHub Pages
  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true,
    },
    // Compression and optimization for static files
    compressPublicAssets: true,
    // Minify HTML, CSS, and JS
    minify: true,
    // Configure error pages for SPA routing
    // errorDocument is handled by the 404.html file in public directory
    // SPA fallback is handled by the 404.html file in public directory
  },

  // Configure for static generation
  ssr: true,

  // GitHub Pages deployment configuration
  app: {
    // Base URL for GitHub Pages subdirectory deployment
    // Will be set to repository name in production
    baseURL:
      process.env.NUXT_APP_BASE_URL || (process.env.NODE_ENV === 'production' ? '/github-infinite-scroll/' : '/'),

    // Build assets directory
    buildAssetsDir: '/assets/',

    // CDN URL for assets (GitHub Pages serves from same domain)
    cdnURL: process.env.NUXT_APP_CDN_URL || undefined,

    // Head configuration for optimization
    head: {
      // Preload critical resources
      link: [
        // Preconnect to external domains for faster loading
        { rel: 'preconnect', href: 'https://api.github.com' },
        { rel: 'dns-prefetch', href: 'https://api.github.com' },
      ],
      // Meta tags for optimization
      meta: [
        // Viewport optimization
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // Theme color for PWA-like experience
        { name: 'theme-color', content: '#000000' },
        // Optimize for mobile
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
      ],
    },
  },

  // Experimental features for better static generation
  experimental: {
    // Enable payload extraction for better performance
    payloadExtraction: false,
    // Enable view transitions for smoother navigation
    viewTransition: true,
  },

  // Runtime configuration for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    // GitHub token should remain private in SSR mode
    githubToken: process.env.GITHUB_TOKEN,

    // Public keys (exposed to client-side)
    public: {
      // GitHub API configuration for production
      githubApiBaseUrl: process.env.GITHUB_API_BASE_URL || 'https://api.github.com',

      // Expose token in development for easier testing, keep undefined in production
      githubToken: process.env.NODE_ENV === 'development' ? process.env.GITHUB_TOKEN : undefined,

      // Base URL for client-side routing and asset paths
      baseURL: process.env.NUXT_APP_BASE_URL || '/',

      // Environment indicator for conditional behavior
      environment: process.env.NODE_ENV || 'development',

      // API rate limiting configuration
      apiRateLimit: {
        // Requests per hour for authenticated requests (5000 for GitHub)
        maxRequests: process.env.GITHUB_API_RATE_LIMIT || '5000',
        // Enable rate limit handling
        enableRateLimitHandling: process.env.ENABLE_RATE_LIMIT_HANDLING !== 'false',
      },
    },
  },

  // CSS optimization
  css: [],

  // Font configuration
  fonts: {
    families: [
      // Sans-serif fonts for modern look
      { name: 'Inter', provider: 'google' },
      { name: 'Poppins', provider: 'google' },
    ],
    defaults: {
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  },

  // UI configuration for modern theme
  ui: {},

  // PostCSS configuration - simplified for compatibility
  postcss: {
    plugins: {
      autoprefixer: {},
    },
  },

  // Simplified Vite configuration for development compatibility
  vite: {
    optimizeDeps: {
      exclude: ['@tailwindcss/oxide'],
    },
  },

  // Image optimization would require @nuxt/image module
  // Uncomment and install @nuxt/image for advanced image optimization
  // image: {
  //   provider: 'ipx',
  //   format: ['webp', 'avif', 'png', 'jpg'],
  //   quality: 80,
  // },

  // Router configuration for GitHub Pages SPA routing
  router: {
    options: {
      // Enable strict mode for better performance
      strict: true,
      // Hash mode for GitHub Pages compatibility (fallback)
      hashMode: process.env.NUXT_ROUTER_HASH_MODE === 'true',
    },
  },

  // Features configuration for optimization
  features: {
    // Disable features not needed for static sites
    devLogs: process.env.NODE_ENV === 'development',
  },
});
