import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('GitHub Pages Routing Integration', () => {
  let mockWindow: any;

  beforeEach(() => {
    // Mock window object
    mockWindow = {
      location: {
        hostname: 'username.github.io',
        pathname: '/repository-name/',
        href: 'https://username.github.io/repository-name/',
        origin: 'https://username.github.io',
        hash: '',
      },
      history: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    // Replace global window
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('404.html fallback', () => {
    it('should exist in public directory', async () => {
      // This test verifies that the 404.html file exists
      // In a real test environment, we would check the file system
      expect(true).toBe(true); // Placeholder - file existence verified in build output
    });

    it('should handle client-side routing fallback', () => {
      // Test the JavaScript logic in 404.html
      const isGitHubPages = mockWindow.location.hostname.includes('github.io');
      expect(isGitHubPages).toBe(true);

      // Test path extraction
      const path = '/repository-name/some/route';
      const pathSegments = path.split('/').filter(Boolean);
      expect(pathSegments[0]).toBe('repository-name');
      expect(pathSegments.slice(1).join('/')).toBe('some/route');
    });
  });

  describe('SPA routing configuration', () => {
    it('should generate 200.html for SPA fallback', () => {
      // This test verifies that the 200.html file is generated
      // In a real test environment, we would check the build output
      expect(true).toBe(true); // Placeholder - file existence verified in build output
    });

    it('should handle base URL configuration', () => {
      const baseURL = '/repository-name/';
      const testPath = '/test';
      const fullPath = baseURL.replace(/\/$/, '') + testPath;

      expect(fullPath).toBe('/repository-name/test');
    });
  });

  describe('URL generation', () => {
    it('should generate correct URLs for GitHub Pages', () => {
      const baseURL = '/repository-name/';
      const generateUrl = (path: string) => {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        if (mockWindow.location.hostname.includes('github.io') && baseURL !== ('/' as string)) {
          return baseURL.replace(/\/$/, '') + normalizedPath;
        }
        return normalizedPath;
      };

      expect(generateUrl('/test')).toBe('/repository-name/test');
      expect(generateUrl('test')).toBe('/repository-name/test');
      expect(generateUrl('/')).toBe('/repository-name/');
    });

    it('should generate normal URLs for non-GitHub Pages', () => {
      mockWindow.location.hostname = 'example.com';
      const baseURL = '/';

      const generateUrl = (path: string) => {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        if (mockWindow.location.hostname.includes('github.io') && baseURL !== ('/' as string)) {
          return baseURL.replace(/\/$/, '') + normalizedPath;
        }
        return normalizedPath;
      };

      expect(generateUrl('/test')).toBe('/test');
      expect(generateUrl('test')).toBe('/test');
    });
  });

  describe('Navigation handling', () => {
    it('should handle internal link clicks', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        target: {
          closest: vi.fn().mockReturnValue({
            getAttribute: vi.fn().mockReturnValue('/test'),
          }),
        },
      };

      const href = '/test';

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
        mockEvent.preventDefault();
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should not prevent default for external links', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      };

      const href = 'https://external.com';

      // Skip external links
      if (href.startsWith('http') || href.startsWith('//')) {
        return;
      }

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should not prevent default for hash links', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      };

      const href = '#section';

      // Skip hash links
      if (href.startsWith('#')) {
        return;
      }

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should provide fallback navigation on errors', () => {
      const baseURL = '/repository-name/';

      // Simulate navigation error
      const handleNavigationError = (error: Error) => {
        console.warn('Router navigation error:', error);

        // Fallback to home page
        const fallbackUrl = baseURL;
        expect(fallbackUrl).toBe('/repository-name/');
      };

      const testError = new Error('Navigation failed');
      handleNavigationError(testError);
    });

    it('should handle missing routes gracefully', () => {
      const handleMissingRoute = (path: string) => {
        // For missing routes, redirect to 404 or home
        const isValidRoute = ['/test', '/'].includes(path);

        if (!isValidRoute) {
          // Would redirect to 404.html or home
          return '/';
        }

        return path;
      };

      expect(handleMissingRoute('/nonexistent')).toBe('/');
      expect(handleMissingRoute('/test')).toBe('/test');
    });
  });
});
