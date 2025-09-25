import { ref, readonly } from 'vue';
import type {
  UseGitHubAPIReturn,
  GitHubAPIResponse,
  Repository,
  GitHubAPIParams,
  APIError,
  APIErrorType,
} from '../../types';

/**
 * GitHub API integration composable
 * Provides methods to fetch OpenAI repositories with proper error handling and rate limiting
 */
export const useGitHubAPI = (): UseGitHubAPIReturn => {
  // Reactive state for API status
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const rateLimitRemaining = ref<number | null>(null);
  const rateLimitReset = ref<Date | null>(null);

  /**
   * Validates a repository object against expected schema
   */
  const validateRepository = (repo: unknown): repo is Repository => {
    if (typeof repo !== 'object' || repo === null) {
      return false;
    }

    const r = repo as Record<string, unknown>;
    return (
      typeof r.id === 'number' &&
      typeof r.name === 'string' &&
      typeof r.full_name === 'string' &&
      (typeof r.description === 'string' || r.description === null) &&
      typeof r.html_url === 'string' &&
      typeof r.created_at === 'string' &&
      typeof r.updated_at === 'string' &&
      typeof r.stargazers_count === 'number' &&
      (typeof r.language === 'string' || r.language === null)
    );
  };

  /**
   * Creates a structured API error from various error sources
   */
  const createAPIError = (error: unknown, statusCode?: number): APIError => {
    let type: APIErrorType = 'unknown_error';
    let message = 'An unexpected error occurred';
    let retryAfter: number | undefined;

    const errorObj = error as Record<string, unknown>;

    if (statusCode) {
      switch (statusCode) {
        case 403:
          if (errorObj?.message && typeof errorObj.message === 'string' && errorObj.message.includes('rate limit')) {
            type = 'rate_limit_exceeded';
            message = 'GitHub API rate limit exceeded. Please try again later.';
            retryAfter = typeof errorObj.retryAfter === 'number' ? errorObj.retryAfter : undefined;
          } else {
            type = 'api_error';
            message = 'Access forbidden. Please check API permissions.';
          }
          break;
        case 404:
          type = 'api_error';
          message = 'Repository not found or organization does not exist.';
          break;
        case 422:
          type = 'validation_error';
          message = 'Invalid request parameters.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          type = 'api_error';
          message = 'GitHub API is temporarily unavailable. Please try again later.';
          break;
        default:
          if (statusCode >= 400 && statusCode < 500) {
            type = 'api_error';
            message = `Client error: ${
              (typeof errorObj?.message === 'string' ? errorObj.message : null) || 'Invalid request'
            }`;
          } else if (statusCode >= 500) {
            type = 'api_error';
            message = `Server error: ${
              (typeof errorObj?.message === 'string' ? errorObj.message : null) || 'Internal server error'
            }`;
          }
      }
    } else {
      if (errorObj?.name === 'TypeError' || errorObj?.code === 'NETWORK_ERROR') {
        type = 'network_error';
        message = 'Network error. Please check your internet connection and try again.';
      }
    }

    return {
      type,
      message,
      statusCode,
      retryAfter,
      details: error as Record<string, unknown>,
    };
  };

  /**
   * Fetches repositories from GitHub API with proper error handling
   */
  const fetchRepositories = async (page: number = 1, perPage: number = 10): Promise<GitHubAPIResponse> => {
    // Validate input parameters
    if (page < 1 || perPage < 1 || perPage > 100) {
      const validationError = createAPIError({ message: 'Invalid pagination parameters' }, 422);
      error.value = validationError.message;
      throw validationError;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const params: GitHubAPIParams = {
        page,
        per_page: perPage,
        sort: 'created',
        direction: 'desc',
        type: 'public',
      };

      // Get runtime config for API credentials and environment settings
      const config = useRuntimeConfig();
      // Use token from public config (available in development) or private config (server-side)
      const githubToken = config.public.githubToken || config.githubToken;

      // Prepare headers with optional authentication
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        // Only send User-Agent from server to avoid CORS/proxy issues on browsers
        ...(typeof window === 'undefined' ? { 'User-Agent': 'GitHub-Infinite-Scroll-App' } : {}),
      };

      // Add authorization header if token is available
      if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`;
        // Development mode: log token usage for verification
        if (process.env.NODE_ENV === 'development') {
          console.log('🔑 Using GitHub Token for authenticated requests');
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️ Using unauthenticated GitHub API (60 requests/hour limit)');
      }

      // Use GitHub API with authentication when token is available
      // Authenticated requests provide 5000 requests per hour, unauthenticated provide 60
      const data = await $fetch<Repository[]>('/orgs/openai/repos', {
        baseURL: config.public.githubApiBaseUrl || 'https://api.github.com',
        headers,
        params,
        onResponse({ response }) {
          // Extract rate limit information from headers
          const remaining = response.headers.get('x-ratelimit-remaining');
          const reset = response.headers.get('x-ratelimit-reset');

          if (remaining) {
            rateLimitRemaining.value = parseInt(remaining, 10);
          }

          if (reset) {
            rateLimitReset.value = new Date(parseInt(reset, 10) * 1000);
          }
        },
        onResponseError({ response }) {
          // Handle rate limiting specifically
          if (response.status === 403) {
            const retryAfter = response.headers.get('retry-after');
            if (retryAfter) {
              throw createAPIError(
                {
                  message: 'Rate limit exceeded',
                  retryAfter: parseInt(retryAfter, 10),
                },
                403
              );
            }
          }
        },
      });

      if (!Array.isArray(data)) {
        const validationError = createAPIError({ message: 'Invalid API response format' }, 422);
        error.value = validationError.message;
        throw validationError;
      }

      // Validate each repository object
      const validRepositories: Repository[] = [];
      for (const repo of data) {
        if (validateRepository(repo)) {
          validRepositories.push(repo);
        } else {
          // Skip invalid repository objects silently
          // In production, you might want to log this to a proper logging service;
        }
      }

      // Determine if there are more pages
      const hasMore = validRepositories.length === perPage;
      const nextPage = hasMore ? page + 1 : null;

      return {
        data: validRepositories,
        hasMore,
        nextPage,
        totalCount: validRepositories.length,
      };
    } catch (err: unknown) {
      // Handle different types of errors
      let apiError: APIError;

      const errorObj = err as Record<string, unknown>;
      if (errorObj.type) {
        // Already a structured API error
        apiError = err as APIError;
      } else {
        // Create structured error from unknown error
        apiError = createAPIError(err, typeof errorObj.statusCode === 'number' ? errorObj.statusCode : undefined);
      }

      error.value = apiError.message;

      // Re-throw for caller to handle
      throw apiError;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    fetchRepositories,
    isLoading: readonly(isLoading),
    error: readonly(error),
    rateLimitRemaining: readonly(rateLimitRemaining),
    rateLimitReset: readonly(rateLimitReset),
  };
};
