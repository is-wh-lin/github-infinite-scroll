/**
 * GitHub Pages Routing Composable
 *
 * Provides utilities for handling navigation and URL generation
 * in GitHub Pages environment with proper subdirectory support.
 */

export const useGitHubPagesRouting = (): {
  isGitHubPages: Readonly<Ref<boolean>>;
  baseURL: Readonly<Ref<string>>;
  generateUrl: (path: string) => string;
  navigateTo: (path: string, options?: { replace?: boolean; external?: boolean }) => Promise<void>;
  getCurrentUrl: () => string;
  isCurrentRoute: (path: string) => boolean;
  getCanonicalUrl: (path?: string) => string;
  handleLinkClick: (event: Event, href: string) => void;
  getBreadcrumbs: () => Array<{ label: string; path: string; current: boolean }>;
  preloadRoute: (path: string) => void;
} => {
  const router = useRouter();
  const route = useRoute();
  const config = useRuntimeConfig();

  // Check if we're running on GitHub Pages
  const isGitHubPages = computed(() => {
    if (import.meta.server) return false;
    return window.location.hostname.includes('github.io');
  });

  // Get base URL from configuration
  const baseURL = computed(() => config.public.baseURL || '/');

  /**
   * Generate a proper URL for the current environment
   * @param path - The path to generate URL for
   * @returns Properly formatted URL
   */
  const generateUrl = (path: string): string => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (isGitHubPages.value && baseURL.value !== '/') {
      return baseURL.value.replace(/\/$/, '') + normalizedPath;
    }

    return normalizedPath;
  };

  /**
   * Navigate to a route with proper GitHub Pages handling
   * @param path - The path to navigate to
   * @param options - Navigation options
   */
  const navigateTo = async (path: string, options: { replace?: boolean; external?: boolean } = {}): Promise<void> => {
    try {
      if (options.external) {
        // Handle external navigation
        window.location.href = path;
        return;
      }

      // Handle internal navigation
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;

      if (options.replace) {
        await router.replace(normalizedPath);
      } else {
        await router.push(normalizedPath);
      }
    } catch {
      // Fallback to browser navigation
      if (options.replace) {
        window.location.replace(generateUrl(path));
      } else {
        window.location.href = generateUrl(path);
      }
    }
  };

  /**
   * Get the current full URL
   * @returns Current full URL
   */
  const getCurrentUrl = (): string => {
    if (import.meta.server) {
      return generateUrl(route.path);
    }

    return window.location.href;
  };

  /**
   * Check if a path is the current route
   * @param path - Path to check
   * @returns True if path matches current route
   */
  const isCurrentRoute = (path: string): boolean => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return route.path === normalizedPath;
  };

  /**
   * Generate a canonical URL for SEO
   * @param path - Path to generate canonical URL for
   * @returns Canonical URL
   */
  const getCanonicalUrl = (path?: string): string => {
    const targetPath = path || route.path;

    if (import.meta.server) {
      return generateUrl(targetPath);
    }

    const origin = window.location.origin;
    return origin + generateUrl(targetPath);
  };

  /**
   * Handle link clicks to ensure proper navigation
   * @param event - Click event
   * @param href - Link href attribute
   */
  const handleLinkClick = (event: Event, href: string): void => {
    // Skip external links
    if (href.startsWith('http') || href.startsWith('//')) {
      return;
    }

    // Skip hash links
    if (href.startsWith('#')) {
      return;
    }

    // Handle internal links
    if (href.startsWith('/')) {
      event.preventDefault();
      navigateTo(href);
    }
  };

  /**
   * Get breadcrumb data for current route
   * @returns Breadcrumb items
   */
  const getBreadcrumbs = (): Array<{ label: string; path: string; current: boolean }> => {
    const pathSegments = route.path.split('/').filter(Boolean);
    const breadcrumbs = [
      {
        label: 'Home',
        path: '/',
        current: route.path === '/',
      },
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  /**
   * Preload a route for better performance
   * @param path - Path to preload
   */
  const preloadRoute = (path: string): void => {
    if (import.meta.server) return;

    try {
      router.resolve(path);
    } catch {
      // Silently fail preload attempts
    }
  };

  return {
    // Computed properties
    isGitHubPages: readonly(isGitHubPages),
    baseURL: readonly(baseURL),

    // Methods
    generateUrl,
    navigateTo,
    getCurrentUrl,
    isCurrentRoute,
    getCanonicalUrl,
    handleLinkClick,
    getBreadcrumbs,
    preloadRoute,
  };
};
