import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGitHubPagesRouting } from '../../composables/useGitHubPagesRouting';

// Mock Nuxt composables
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  resolve: vi.fn(),
};

const mockRoute = {
  path: '/',
};

const mockConfig = {
  public: {
    baseURL: '/',
  },
};

// Mock the global functions
(global as any).useRouter = vi.fn(() => mockRouter);
(global as any).useRoute = vi.fn(() => mockRoute);
(global as any).useRuntimeConfig = vi.fn(() => mockConfig);
(global as any).computed = vi.fn((fn) => ({ value: fn() }));
(global as any).readonly = vi.fn((ref) => ref);
(global as any).process = { server: false };

// Mock window object
const mockWindow = {
  location: {
    hostname: 'example.com',
    href: 'https://example.com/',
    origin: 'https://example.com',
    replace: vi.fn(),
  },
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('useGitHubPagesRouting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindow.location.hostname = 'example.com';
    mockConfig.public.baseURL = '/';
    mockRoute.path = '/';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isGitHubPages detection', () => {
    it('should detect GitHub Pages hostname', () => {
      mockWindow.location.hostname = 'username.github.io';
      const { isGitHubPages } = useGitHubPagesRouting();
      expect(isGitHubPages.value).toBe(true);
    });

    it('should not detect non-GitHub Pages hostname', () => {
      mockWindow.location.hostname = 'example.com';
      const { isGitHubPages } = useGitHubPagesRouting();
      expect(isGitHubPages.value).toBe(false);
    });
  });

  describe('generateUrl', () => {
    it('should generate URL with base path for GitHub Pages', () => {
      mockWindow.location.hostname = 'username.github.io';
      mockConfig.public.baseURL = '/repository-name/';

      const { generateUrl } = useGitHubPagesRouting();
      const url = generateUrl('/test');

      expect(url).toBe('/repository-name/test');
    });

    it('should generate normal URL for non-GitHub Pages', () => {
      mockWindow.location.hostname = 'example.com';
      mockConfig.public.baseURL = '/';

      const { generateUrl } = useGitHubPagesRouting();
      const url = generateUrl('/test');

      expect(url).toBe('/test');
    });

    it('should handle paths without leading slash', () => {
      const { generateUrl } = useGitHubPagesRouting();
      const url = generateUrl('test');

      expect(url).toBe('/test');
    });
  });

  describe('navigateTo', () => {
    it('should use router.push for internal navigation', async () => {
      const { navigateTo } = useGitHubPagesRouting();
      await navigateTo('/test');

      expect(mockRouter.push).toHaveBeenCalledWith('/test');
    });

    it('should use router.replace when replace option is true', async () => {
      const { navigateTo } = useGitHubPagesRouting();
      await navigateTo('/test', { replace: true });

      expect(mockRouter.replace).toHaveBeenCalledWith('/test');
    });

    it('should handle external navigation', async () => {
      const originalHref = mockWindow.location.href;
      const { navigateTo } = useGitHubPagesRouting();

      await navigateTo('https://external.com', { external: true });

      expect(mockWindow.location.href).toBe('https://external.com');

      // Restore original href
      mockWindow.location.href = originalHref;
    });

    it('should fallback to window.location on router error', async () => {
      mockRouter.push.mockRejectedValue(new Error('Router error'));
      const originalHref = mockWindow.location.href;

      const { navigateTo } = useGitHubPagesRouting();
      await navigateTo('/test');

      expect(mockWindow.location.href).toBe('/test');

      // Restore original href
      mockWindow.location.href = originalHref;
    });
  });

  describe('isCurrentRoute', () => {
    it('should return true for current route', () => {
      mockRoute.path = '/test';
      const { isCurrentRoute } = useGitHubPagesRouting();

      expect(isCurrentRoute('/test')).toBe(true);
    });

    it('should return false for different route', () => {
      mockRoute.path = '/test';
      const { isCurrentRoute } = useGitHubPagesRouting();

      expect(isCurrentRoute('/other')).toBe(false);
    });

    it('should handle paths without leading slash', () => {
      mockRoute.path = '/test';
      const { isCurrentRoute } = useGitHubPagesRouting();

      expect(isCurrentRoute('test')).toBe(true);
    });
  });

  describe('getCanonicalUrl', () => {
    it('should generate canonical URL with origin', () => {
      mockWindow.location.origin = 'https://example.com';
      mockRoute.path = '/test';

      const { getCanonicalUrl } = useGitHubPagesRouting();
      const url = getCanonicalUrl();

      expect(url).toBe('https://example.com/test');
    });

    it('should use provided path for canonical URL', () => {
      mockWindow.location.origin = 'https://example.com';

      const { getCanonicalUrl } = useGitHubPagesRouting();
      const url = getCanonicalUrl('/custom');

      expect(url).toBe('https://example.com/custom');
    });
  });

  describe('getBreadcrumbs', () => {
    it('should generate breadcrumbs for root path', () => {
      mockRoute.path = '/';
      const { getBreadcrumbs } = useGitHubPagesRouting();
      const breadcrumbs = getBreadcrumbs();

      expect(breadcrumbs).toEqual([
        {
          label: 'Home',
          path: '/',
          current: true,
        },
      ]);
    });

    it('should generate breadcrumbs for nested path', () => {
      mockRoute.path = '/category/item';
      const { getBreadcrumbs } = useGitHubPagesRouting();
      const breadcrumbs = getBreadcrumbs();

      expect(breadcrumbs).toEqual([
        {
          label: 'Home',
          path: '/',
          current: false,
        },
        {
          label: 'Category',
          path: '/category',
          current: false,
        },
        {
          label: 'Item',
          path: '/category/item',
          current: true,
        },
      ]);
    });
  });

  describe('handleLinkClick', () => {
    it('should prevent default and navigate for internal links', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      } as any;

      const { handleLinkClick } = useGitHubPagesRouting();
      handleLinkClick(mockEvent, '/internal');

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/internal');
    });

    it('should not prevent default for external links', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      } as any;

      const { handleLinkClick } = useGitHubPagesRouting();
      handleLinkClick(mockEvent, 'https://external.com');

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should not prevent default for hash links', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      } as any;

      const { handleLinkClick } = useGitHubPagesRouting();
      handleLinkClick(mockEvent, '#section');

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });
});
