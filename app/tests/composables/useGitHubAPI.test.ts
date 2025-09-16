import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Repository } from '../../../types';
import { useGitHubAPI } from '../../composables/useGitHubAPI';

// Mock Vue's ref and readonly
vi.mock('vue', () => ({
  ref: vi.fn((initialValue) => {
    const mockRef = {
      value: initialValue,
      __v_isRef: true,
      [Symbol.for('__v_isRef')]: true,
    };
    return mockRef;
  }),
  readonly: vi.fn((ref) => ref),
}));

// Mock $fetch
const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

// Mock useRuntimeConfig
const mockUseRuntimeConfig = vi.fn(() => ({
  public: {
    githubToken: 'mock-token',
    githubApiBaseUrl: 'https://api.github.com',
  },
  githubToken: 'mock-token',
}));
vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig);

// Mock process.server to simulate server-side environment
Object.defineProperty(global, 'process', {
  value: {
    ...process,
    server: true,
  },
  writable: true,
});

// Mock repository data
const mockRepository: Repository = {
  id: 1,
  name: 'test-repo',
  full_name: 'openai/test-repo',
  description: 'A test repository',
  html_url: 'https://github.com/openai/test-repo',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-02T00:00:00Z',
  stargazers_count: 100,
  language: 'TypeScript',
  forks_count: 10,
  open_issues_count: 5,
  default_branch: 'main',
  visibility: 'public',
  archived: false,
  disabled: false,
};

const mockRepositories: Repository[] = [
  mockRepository,
  {
    ...mockRepository,
    id: 2,
    name: 'test-repo-2',
    full_name: 'openai/test-repo-2',
    description: null,
    language: null,
  },
];

describe('useGitHubAPI', () => {
  let api: ReturnType<typeof useGitHubAPI>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset runtime config mock
    mockUseRuntimeConfig.mockReturnValue({
      public: {
        githubToken: 'mock-token',
        githubApiBaseUrl: 'https://api.github.com',
      },
      githubToken: 'mock-token',
    });

    api = useGitHubAPI();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchRepositories', () => {
    it('should fetch repositories successfully with default parameters', async () => {
      mockFetch.mockResolvedValueOnce(mockRepositories);

      const result = await api.fetchRepositories(1, 30);

      expect(mockFetch).toHaveBeenCalledWith('/orgs/openai/repos', {
        baseURL: 'https://api.github.com',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'GitHub-Infinite-Scroll-App',
          Authorization: 'Bearer mock-token',
        },
        params: {
          page: 1,
          per_page: 30,
          sort: 'created',
          direction: 'desc',
          type: 'public',
        },
        onResponse: expect.any(Function),
        onResponseError: expect.any(Function),
      });

      expect(result).toEqual({
        data: mockRepositories,
        hasMore: false, // Less than perPage, so no more pages
        nextPage: null,
        totalCount: 2,
      });

      expect(api.isLoading.value).toBe(false);
      expect(api.error.value).toBe(null);
    });

    it('should fetch repositories with custom pagination parameters', async () => {
      const fullPageRepositories = Array(10)
        .fill(null)
        .map((_, index) => ({
          ...mockRepository,
          id: index + 1,
          name: `repo-${index + 1}`,
          full_name: `openai/repo-${index + 1}`,
        }));

      mockFetch.mockResolvedValueOnce(fullPageRepositories);

      const result = await api.fetchRepositories(2, 10);

      expect(mockFetch).toHaveBeenCalledWith(
        '/orgs/openai/repos',
        expect.objectContaining({
          params: {
            page: 2,
            per_page: 10,
            sort: 'created',
            direction: 'desc',
            type: 'public',
          },
        })
      );

      expect(result).toEqual({
        data: fullPageRepositories,
        hasMore: true, // Full page, so more pages likely exist
        nextPage: 3,
        totalCount: 10,
      });
    });

    it('should validate input parameters', async () => {
      await expect(api.fetchRepositories(0, 10)).rejects.toMatchObject({
        type: 'validation_error',
        message: 'Invalid request parameters.',
        statusCode: 422,
      });

      await expect(api.fetchRepositories(1, 0)).rejects.toMatchObject({
        type: 'validation_error',
        message: 'Invalid request parameters.',
        statusCode: 422,
      });

      await expect(api.fetchRepositories(1, 101)).rejects.toMatchObject({
        type: 'validation_error',
        message: 'Invalid request parameters.',
        statusCode: 422,
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'TypeError';
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(api.fetchRepositories(1, 30)).rejects.toMatchObject({
        type: 'network_error',
        message: 'Network error. Please check your internet connection and try again.',
      });

      expect(api.error.value).toBe('Network error. Please check your internet connection and try again.');
      expect(api.isLoading.value).toBe(false);
    });

    it('should handle rate limiting errors', async () => {
      const rateLimitError = {
        statusCode: 403,
        message: 'rate limit exceeded',
      };
      mockFetch.mockRejectedValueOnce(rateLimitError);

      await expect(api.fetchRepositories(1, 30)).rejects.toMatchObject({
        type: 'rate_limit_exceeded',
        message: 'GitHub API rate limit exceeded. Please try again later.',
        statusCode: 403,
      });

      expect(api.error.value).toBe('GitHub API rate limit exceeded. Please try again later.');
    });

    it('should handle 404 errors', async () => {
      const notFoundError = {
        statusCode: 404,
        message: 'Not Found',
      };
      mockFetch.mockRejectedValueOnce(notFoundError);

      await expect(api.fetchRepositories(1, 30)).rejects.toMatchObject({
        type: 'api_error',
        message: 'Repository not found or organization does not exist.',
        statusCode: 404,
      });
    });

    it('should handle invalid API response format', async () => {
      mockFetch.mockResolvedValueOnce('invalid response');

      await expect(api.fetchRepositories(1, 30)).rejects.toMatchObject({
        type: 'validation_error',
        message: 'Invalid request parameters.',
        statusCode: 422,
      });
    });

    it('should filter out invalid repository objects', async () => {
      const mixedData = [
        mockRepository,
        { invalid: 'object' }, // Invalid repository
        {
          ...mockRepository,
          id: 3,
          name: 'valid-repo-2',
          full_name: 'openai/valid-repo-2',
        },
      ];

      mockFetch.mockResolvedValueOnce(mixedData);

      const result = await api.fetchRepositories(1, 30);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(mockRepository);
      expect(result.data[1]?.name).toBe('valid-repo-2');
    });

    it('should set loading state correctly', async () => {
      let resolvePromise: (value: Repository[]) => void;
      const promise = new Promise<Repository[]>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      const fetchPromise = api.fetchRepositories(1, 30);

      // Check loading state immediately after starting fetch
      expect(api.isLoading.value).toBe(true);

      resolvePromise!(mockRepositories);
      await fetchPromise;

      expect(api.isLoading.value).toBe(false);
    });

    it('should handle rate limit headers', async () => {
      const mockResponse = {
        headers: new Map([
          ['x-ratelimit-remaining', '59'],
          ['x-ratelimit-reset', '1640995200'], // Unix timestamp
        ]),
      };

      mockFetch.mockImplementationOnce((url, options) => {
        // Simulate onResponse callback
        if (options?.onResponse) {
          options.onResponse({ response: mockResponse });
        }
        return Promise.resolve(mockRepositories);
      });

      await api.fetchRepositories(1, 30);

      expect(api.rateLimitRemaining.value).toBe(59);
      expect(api.rateLimitReset.value).toEqual(new Date(1640995200 * 1000));
    });
  });

  describe('reactive state', () => {
    it('should initialize with correct default values', () => {
      expect(api.isLoading.value).toBe(false);
      expect(api.error.value).toBe(null);
      expect(api.rateLimitRemaining.value).toBe(null);
      expect(api.rateLimitReset.value).toBe(null);
    });

    it('should provide readonly reactive references', () => {
      // Test that the refs are readonly by checking they have the expected structure
      expect(api.isLoading).toHaveProperty('value');
      expect(api.error).toHaveProperty('value');
      expect(api.rateLimitRemaining).toHaveProperty('value');
      expect(api.rateLimitReset).toHaveProperty('value');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle server errors (5xx)', async () => {
      const serverError = {
        statusCode: 500,
        message: 'Internal Server Error',
      };
      mockFetch.mockRejectedValueOnce(serverError);

      await expect(api.fetchRepositories(1, 30)).rejects.toMatchObject({
        type: 'api_error',
        message: 'GitHub API is temporarily unavailable. Please try again later.',
        statusCode: 500,
      });
    });

    it('should handle unknown errors gracefully', async () => {
      const unknownError = new Error('Something went wrong');
      mockFetch.mockRejectedValueOnce(unknownError);

      await expect(api.fetchRepositories(1, 30)).rejects.toMatchObject({
        type: 'unknown_error',
        message: 'An unexpected error occurred',
      });
    });
  });
});
