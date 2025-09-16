// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/test-utils', '@nuxt/ui'],
  // Enable SSR for proper initial data loading
  ssr: true,

  // Runtime configuration for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    githubToken: process.env.GITHUB_TOKEN,

    // Public keys (exposed to client-side)
    public: {
      githubApiBaseUrl: process.env.GITHUB_API_BASE_URL || 'https://api.github.com',
      // Expose token to client for SPA mode (be careful in production)
      githubToken: process.env.GITHUB_TOKEN,
    },
  },
});
