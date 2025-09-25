/**
 * GitHub Pages Client-Side Routing Plugin
 *
 * This plugin handles client-side routing for GitHub Pages deployment,
 * ensuring proper navigation and URL handling when the app is served
 * from a repository subdirectory.
 */

import type { NavigationFailure } from 'vue-router';

export default defineNuxtPlugin(() => {
  // Only run on client-side
  if (import.meta.server) return;

  const router = useRouter();
  const route = useRoute();

  // Check if we're running on GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io');

  // Get base URL from runtime config
  const config = useRuntimeConfig();
  const baseURL = config.public.baseURL || '/';

  /**
   * Handle initial page load routing
   * This handles cases where users navigate directly to a route
   */
  const handleInitialRouting = (): void => {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;

    // If we have a hash route, handle it
    if (currentHash && currentHash.startsWith('#/')) {
      const hashRoute = currentHash.substring(2); // Remove '#/'

      if (hashRoute && hashRoute !== route.path) {
        // Navigate to the hash route
        router.push(hashRoute).catch(() => {
          // If route doesn't exist, redirect to home
          router.push('/');
        });
      }
    }

    // Handle GitHub Pages subdirectory routing
    if (isGitHubPages && baseURL !== '/') {
      const expectedBasePath = baseURL.replace(/\/$/, '');

      if (!currentPath.startsWith(expectedBasePath)) {
        // Redirect to proper base path
        const newPath = expectedBasePath + (currentPath === '/' ? '' : currentPath);
        window.history.replaceState(null, '', newPath);
      }
    }
  };

  /**
   * Handle browser back/forward navigation
   */
  const handlePopState = (_event: PopStateEvent): void => {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;

    // Handle hash routing
    if (currentHash && currentHash.startsWith('#/')) {
      const hashRoute = currentHash.substring(2);
      router.push(hashRoute).catch(() => {
        router.push('/');
      });
      return;
    }

    // Handle regular routing
    if (isGitHubPages && baseURL !== '/') {
      const expectedBasePath = baseURL.replace(/\/$/, '');
      const routePath = currentPath.replace(expectedBasePath, '') || '/';

      if (routePath !== route.path) {
        router.push(routePath).catch(() => {
          router.push('/');
        });
      }
    }
  };

  /**
   * Update URL when route changes
   */
  const handleRouteChange = (to: { path: string }, from: { path: string }): void => {
    // Don't update URL if we're navigating to the same route
    if (to.path === from.path) return;

    // Update browser URL to match the route
    if (isGitHubPages && baseURL !== '/') {
      const fullPath = baseURL.replace(/\/$/, '') + to.path;

      // Use replaceState to avoid adding to history
      if (window.location.pathname !== fullPath) {
        window.history.replaceState(null, '', fullPath);
      }
    }
  };

  /**
   * Handle external link clicks to ensure they work properly
   */
  const handleLinkClicks = (event: Event): void => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');

    if (!link) return;

    const href = link.getAttribute('href');

    // Skip if it's an external link
    if (!href || href.startsWith('http') || href.startsWith('//')) {
      return;
    }

    // Skip if it's a hash link
    if (href.startsWith('#')) {
      return;
    }

    // Handle internal navigation
    if (href.startsWith('/')) {
      event.preventDefault();

      router.push(href).catch(() => {
        // If route doesn't exist, let the browser handle it
        window.location.href = href;
      });
    }
  };

  /**
   * Initialize the routing plugin
   */
  const initializeRouting = (): void => {
    // Handle initial page load
    handleInitialRouting();

    // Listen for browser navigation
    window.addEventListener('popstate', handlePopState);

    // Listen for route changes
    router.afterEach(handleRouteChange);

    // Handle link clicks
    document.addEventListener('click', handleLinkClicks);

    // Add error handling for failed navigation
    router.onError((_error) => {
      // Fallback to home page on navigation errors
      if (route.path !== '/') {
        router.push('/').catch(() => {
          // If even home navigation fails, reload the page
          window.location.href = baseURL;
        });
      }
    });
  };

  // Initialize immediately when plugin loads (client-side only)
  initializeRouting();

  // Provide utilities for components to use
  return {
    provide: {
      githubPagesRouting: {
        isGitHubPages,
        baseURL,

        /**
         * Generate a proper URL for GitHub Pages
         */
        generateUrl: (path: string): string => {
          if (isGitHubPages && baseURL !== '/') {
            return baseURL.replace(/\/$/, '') + path;
          }
          return path;
        },

        /**
         * Navigate to a route with proper GitHub Pages handling
         */
        navigateTo: async (path: string): Promise<NavigationFailure | undefined> => {
          const result = await router.push(path);
          return result || undefined;
        },
      },
    },
  };
});
