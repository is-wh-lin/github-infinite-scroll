import type { Ref } from 'vue';

/**
 * Repository interface representing a GitHub repository
 * Based on GitHub API v2022-11-28 response structure
 */
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  stargazers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  visibility: 'public' | 'private';
  archived: boolean;
  disabled: boolean;
}

/**
 * GitHub API response structure for repository listings
 */
export interface GitHubAPIResponse {
  data: Repository[];
  hasMore: boolean;
  nextPage: number | null;
  totalCount?: number;
}

/**
 * Application state interface for managing infinite scroll state
 */
export interface AppState {
  repositories: Repository[];
  currentPage: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalLoaded: number;
  initialLoad: boolean;
}

/**
 * Return type for useInfiniteScroll composable
 */
export interface UseInfiniteScrollReturn {
  repositories: Ref<Repository[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  hasMore: Ref<boolean>;
  totalLoaded: Ref<number>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

/**
 * Return type for useGitHubAPI composable
 */
export interface UseGitHubAPIReturn {
  fetchRepositories: (page: number, perPage: number) => Promise<GitHubAPIResponse>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  rateLimitRemaining: Ref<number | null>;
  rateLimitReset: Ref<Date | null>;
}

/**
 * GitHub API request parameters
 */
export interface GitHubAPIParams {
  page: number;
  per_page: number;
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
  type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member';
}

/**
 * Error types for better error handling
 */
export type APIErrorType = 'network_error' | 'rate_limit_exceeded' | 'api_error' | 'validation_error' | 'unknown_error';

/**
 * Structured error interface
 */
export interface APIError {
  type: APIErrorType;
  message: string;
  statusCode?: number;
  retryAfter?: number;
  details?: Record<string, unknown>;
}
