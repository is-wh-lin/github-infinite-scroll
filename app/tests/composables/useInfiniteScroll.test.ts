import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick, ref } from 'vue';
import type { Repository, GitHubAPIResponse, APIError } from '../../../types';

// Mock the useGitHubAPI composable
const mockFetchRepositories = vi.fn();
const mockUseState = vi.fn((key: string, init: () => unknown): unknown => {
  return ref(init());
});

vi.mock('../../composables/useGitHubAPI', () => ({
  useGitHubAPI: (): unknown => ({
    fetchRepositories: mockFetchRepositories,
    isLoading: { value: false },
    error: { value: null },
    rateLimitRemaining: { value: null },
    rateLimitReset: { value: null },
  }),
}));

vi.mock('#app', () => ({
  useState: mockUseState,
}));

// Make useState available globally for the composable
(global as Record<string, unknown>).useState = mockUseState;

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

mockIntersectionObserver.mockImplementation((callback) => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
  callback,
}));

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

// Sample repository data for testing
const createMockRepository = (id: number): Repository => ({
  id,
  name: `repo-${id}`,
  full_name: `openai/repo-${id}`,
  description: `Description for repository ${id}`,
  html_url: `https://github.com/openai/repo-${id}`,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  stargazers_count: 100 + id,
  language: 'TypeScript',
  forks_count: 10 + id,
  open_issues_count: id,
  default_branch: 'main',
  visibility: 'public',
  archived: false,
  disabled: false,
});

const mockRepositories = Array.from({ length: 10 }, (_, i) => createMockRepository(i + 1));

describe('useInfiniteScroll', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach((): void => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty repositories by default', async () => {
      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { repositories, loading, error, hasMore, totalLoaded } = useInfiniteScroll();

      expect(repositories.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBe(null);
      expect(hasMore.value).toBe(true);
      expect(totalLoaded.value).toBe(0);
    });

    it('should initialize with provided initial repositories', async () => {
      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const initialRepos = mockRepositories.slice(0, 3);
      const { repositories, totalLoaded } = useInfiniteScroll(initialRepos);

      expect(repositories.value).toEqual(initialRepos);
      expect(totalLoaded.value).toBe(3);
    });
  });

  describe('loadMore functionality', () => {
    it('should load more repositories successfully', async () => {
      const mockResponse: GitHubAPIResponse = {
        data: mockRepositories.slice(0, 5),
        hasMore: true,
        nextPage: 2,
        totalCount: 5,
      };

      mockFetchRepositories.mockResolvedValueOnce(mockResponse);

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { loadMore, repositories, totalLoaded, hasMore } = useInfiniteScroll();

      await loadMore();

      expect(mockFetchRepositories).toHaveBeenCalledWith(2, 10);
      expect(repositories.value).toEqual(mockResponse.data);
      expect(totalLoaded.value).toBe(5);
      expect(hasMore.value).toBe(true);
    });

    it('should append new repositories to existing ones', async () => {
      const initialRepos = mockRepositories.slice(0, 3);
      const newRepos = mockRepositories.slice(3, 6);

      const mockResponse: GitHubAPIResponse = {
        data: newRepos,
        hasMore: true,
        nextPage: 3,
        totalCount: 3,
      };

      mockFetchRepositories.mockResolvedValueOnce(mockResponse);

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { loadMore, repositories, totalLoaded } = useInfiniteScroll(initialRepos);

      await loadMore();

      expect(repositories.value).toEqual([...initialRepos, ...newRepos]);
      expect(totalLoaded.value).toBe(6);
    });

    it('should handle API errors gracefully', async () => {
      const apiError: APIError = {
        type: 'network_error',
        message: 'Network connection failed',
        statusCode: 500,
      };

      mockFetchRepositories.mockRejectedValueOnce(apiError);

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { loadMore, error, hasMore } = useInfiniteScroll();

      await loadMore();

      expect(error.value).toBe('Network connection failed');
      expect(hasMore.value).toBe(true); // Should still allow retry
    });

    it('should set hasMore to false when reaching 30+ repositories and no more data', async () => {
      const initialRepos = Array.from({ length: 25 }, (_, i) => createMockRepository(i + 1));
      const newRepos = Array.from({ length: 5 }, (_, i) => createMockRepository(i + 26));

      const mockResponse: GitHubAPIResponse = {
        data: newRepos,
        hasMore: false, // No more data from API
        nextPage: null,
        totalCount: 5,
      };

      mockFetchRepositories.mockResolvedValueOnce(mockResponse);

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { loadMore, hasMore, totalLoaded } = useInfiniteScroll(initialRepos);

      await loadMore();

      expect(totalLoaded.value).toBe(30);
      expect(hasMore.value).toBe(false);
    });
  });

  describe('retry functionality', () => {
    it('should retry failed requests', async () => {
      const apiError: APIError = {
        type: 'network_error',
        message: 'Network connection failed',
      };

      const mockResponse: GitHubAPIResponse = {
        data: mockRepositories.slice(0, 5),
        hasMore: true,
        nextPage: 2,
      };

      // First call fails, second succeeds
      mockFetchRepositories.mockRejectedValueOnce(apiError).mockResolvedValueOnce(mockResponse);

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { loadMore, retry, error, repositories } = useInfiniteScroll();

      // Initial load fails
      await loadMore();
      expect(error.value).toBe('Network connection failed');

      // Retry succeeds
      await retry();
      expect(repositories.value).toEqual(mockResponse.data);
      expect(error.value).toBe(null);
    });

    it('should respect maximum retry attempts', async () => {
      const apiError: APIError = {
        type: 'network_error',
        message: 'Network connection failed',
      };

      mockFetchRepositories.mockRejectedValue(apiError);

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { loadMore, retry, retryCount, maxRetries, canRetry } = useInfiniteScroll();

      // Initial load fails
      await loadMore();

      // Retry up to max attempts
      for (let i = 0; i < maxRetries; i++) {
        expect(canRetry.value).toBe(true);
        await retry();
        expect(retryCount.value).toBe(i + 1);
      }

      // Should not allow more retries
      expect(canRetry.value).toBe(false);
    }, 10000); // Increase timeout for this test
  });

  describe('reset functionality', () => {
    it('should reset all state to initial values', async () => {
      const initialRepos = mockRepositories.slice(0, 3);
      const mockResponse: GitHubAPIResponse = {
        data: mockRepositories.slice(3, 6),
        hasMore: true,
        nextPage: 2,
      };

      mockFetchRepositories.mockResolvedValueOnce(mockResponse);

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { loadMore, reset, repositories, totalLoaded, hasMore, error, loading } = useInfiniteScroll(initialRepos);

      // Load more data
      await loadMore();
      expect(repositories.value.length).toBe(6);

      // Reset state
      reset();

      expect(repositories.value).toEqual(initialRepos);
      expect(totalLoaded.value).toBe(3);
      expect(hasMore.value).toBe(true);
      expect(error.value).toBe(null);
      expect(loading.value).toBe(false);
    });
  });

  describe('observer utilities', () => {
    it('should provide startObserving and stopObserving functions', async () => {
      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { startObserving, stopObserving } = useInfiniteScroll();

      expect(typeof startObserving).toBe('function');
      expect(typeof stopObserving).toBe('function');
    });
  });

  describe('computed properties', () => {
    it('should indicate when retry is possible', async () => {
      const apiError: APIError = {
        type: 'network_error',
        message: 'Network connection failed',
      };

      mockFetchRepositories.mockRejectedValueOnce(apiError);

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { loadMore, canRetry, error, retryCount } = useInfiniteScroll();

      // Initially cannot retry
      expect(canRetry.value).toBe(false);

      // After error, can retry
      await loadMore();
      expect(error.value).toBeTruthy();

      // Check the conditions for canRetry
      expect(error.value !== null).toBe(true);
      expect(retryCount.value < 3).toBe(true); // maxRetries is 3

      // The computed should now be true
      expect(canRetry.value).toBe(true);
    });

    it('should show end message when appropriate', async () => {
      // Create a scenario where we have loaded 30+ repositories and no more data
      const initialRepos = Array.from({ length: 30 }, (_, i) => createMockRepository(i + 1));

      const mockResponse: GitHubAPIResponse = {
        data: [],
        hasMore: false, // No more data from API
        nextPage: null,
        totalCount: 0,
      };

      mockFetchRepositories.mockResolvedValueOnce(mockResponse);

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const { shouldShowEndMessage, hasMore, totalLoaded, loading, loadMore } = useInfiniteScroll(initialRepos);

      // Initially should not show end message (we have more data to load)
      expect(shouldShowEndMessage.value).toBe(false);

      // Load more to trigger the end condition
      await loadMore();

      // Wait for computed to update
      await nextTick();

      // Check the conditions
      expect(hasMore.value).toBe(false);
      expect(totalLoaded.value).toBe(30); // Should have 30 repositories
      expect(loading.value).toBe(false);

      expect(shouldShowEndMessage.value).toBe(true);
    });
  });

  describe('SSR compatibility', () => {
    it('should handle missing IntersectionObserver gracefully', async () => {
      // Temporarily remove IntersectionObserver
      const originalIntersectionObserver = window.IntersectionObserver;
      delete (window as unknown as Record<string, unknown>).IntersectionObserver;

      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      expect(() => {
        useInfiniteScroll();
      }).not.toThrow();

      // Restore IntersectionObserver
      window.IntersectionObserver = originalIntersectionObserver;
    });
  });

  describe('core functionality verification', () => {
    it('should provide all required interface methods', async () => {
      const { useInfiniteScroll } = await import('../../composables/useInfiniteScroll');
      const result = useInfiniteScroll();

      // Check all required properties exist
      expect(result).toHaveProperty('repositories');
      expect(result).toHaveProperty('loading');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('hasMore');
      expect(result).toHaveProperty('totalLoaded');
      expect(result).toHaveProperty('loadMore');
      expect(result).toHaveProperty('retry');
      expect(result).toHaveProperty('reset');
      expect(result).toHaveProperty('startObserving');
      expect(result).toHaveProperty('stopObserving');
      expect(result).toHaveProperty('canRetry');
      expect(result).toHaveProperty('shouldShowEndMessage');
      expect(result).toHaveProperty('retryCount');
      expect(result).toHaveProperty('maxRetries');

      // Check types
      expect(typeof result.loadMore).toBe('function');
      expect(typeof result.retry).toBe('function');
      expect(typeof result.reset).toBe('function');
      expect(typeof result.startObserving).toBe('function');
      expect(typeof result.stopObserving).toBe('function');
      expect(typeof result.maxRetries).toBe('number');
    });
  });
});
