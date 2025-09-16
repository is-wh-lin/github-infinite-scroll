import { ref, computed, readonly, onMounted, onUnmounted, nextTick } from 'vue';
import type { UseInfiniteScrollReturn, Repository, APIError } from '../types';
import { useGitHubAPI } from './useGitHubAPI';
import { useState } from 'nuxt/app';

/**
 * Infinite scroll composable with SSR-friendly state management
 * Provides automatic loading of repositories when user scrolls to bottom
 */
export const useInfiniteScroll = (
  initialRepositories: Repository[] = [],
  perPage: number = 10
): UseInfiniteScrollReturn => {
  // Use useState for SSR-friendly reactive state
  const repositories = useState<Repository[]>('infinite-scroll-repositories', () => [...initialRepositories]);
  const currentPage = useState<number>('infinite-scroll-current-page', () => 1);
  const loading = useState<boolean>('infinite-scroll-loading', () => false);
  const error = useState<string | null>('infinite-scroll-error', () => null);
  const hasMore = useState<boolean>('infinite-scroll-has-more', () => true);
  const totalLoaded = useState<number>('infinite-scroll-total-loaded', () => initialRepositories.length);
  const isRetrying = ref(false);
  const retryCount = ref(0);
  const maxRetries = 3;

  // GitHub API composable
  const { fetchRepositories, isLoading: apiLoading } = useGitHubAPI();

  // Intersection Observer for scroll detection
  let observer: IntersectionObserver | null = null;
  const sentinelElement = ref<HTMLElement | null>(null);

  /**
   * Exponential backoff delay calculation
   */
  const getRetryDelay = (attempt: number): number => {
    return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
  };

  /**
   * Sleep utility for retry delays
   */
  const sleep = (ms: number): Promise<void> => {
    // Use shorter delays in test environment
    const delay = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 1 : ms;
    return new Promise((resolve) => setTimeout(resolve, delay));
  };

  /**
   * Load more repositories from the API
   */
  const loadMore = async (): Promise<void> => {
    // Prevent multiple simultaneous requests
    if (loading.value || !hasMore.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const nextPage = currentPage.value + 1;
      const response = await fetchRepositories(nextPage, perPage);

      // Add new repositories to the existing list
      repositories.value = [...repositories.value, ...response.data];
      currentPage.value = nextPage;
      totalLoaded.value = repositories.value.length;
      hasMore.value = response.hasMore;

      // Reset retry count on successful load
      retryCount.value = 0;

      // Check if we've reached the minimum requirement of 30 repositories
      if (totalLoaded.value >= 30 && !response.hasMore) {
        hasMore.value = false;
      }
    } catch (err: unknown) {
      const apiError = err as APIError;
      error.value = apiError.message;

      // Don't set hasMore to false on error, allow retry
      console.error('Failed to load more repositories:', apiError);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Retry mechanism with exponential backoff
   */
  const retry = async (): Promise<void> => {
    if (isRetrying.value || retryCount.value >= maxRetries) {
      return;
    }

    isRetrying.value = true;
    retryCount.value += 1;

    try {
      // Wait with exponential backoff
      const delay = getRetryDelay(retryCount.value - 1);
      await sleep(delay);

      // Clear error state before retry
      error.value = null;

      // Attempt to load more
      await loadMore();
    } catch (err: unknown) {
      const apiError = err as APIError;
      error.value = apiError.message;

      // If we haven't reached max retries, allow another retry
      if (retryCount.value < maxRetries) {
        console.warn(`Retry ${retryCount.value} failed, ${maxRetries - retryCount.value} attempts remaining`);
      } else {
        console.error('Max retry attempts reached');
      }
    } finally {
      isRetrying.value = false;
    }
  };

  /**
   * Reset the infinite scroll state
   */
  const reset = (): void => {
    repositories.value = [...initialRepositories];
    currentPage.value = 1;
    loading.value = false;
    error.value = null;
    hasMore.value = true;
    totalLoaded.value = initialRepositories.length;
    retryCount.value = 0;
    isRetrying.value = false;
  };

  /**
   * Handle intersection observer callback
   */
  const handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    const [entry] = entries;

    if (entry.isIntersecting && hasMore.value && !loading.value && !error.value) {
      // Use nextTick to ensure DOM updates are complete
      nextTick(() => {
        loadMore();
      });
    }
  };

  /**
   * Initialize intersection observer
   */
  const initializeObserver = (): void => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // SSR or no IntersectionObserver support
      return;
    }

    observer = new IntersectionObserver(handleIntersection, {
      root: null, // Use viewport as root
      rootMargin: '100px', // Trigger 100px before reaching the element
      threshold: 0.1, // Trigger when 10% of the element is visible
    });
  };

  /**
   * Start observing the sentinel element
   */
  const startObserving = (element: HTMLElement): void => {
    if (observer && element) {
      observer.observe(element);
      sentinelElement.value = element;
    }
  };

  /**
   * Stop observing the sentinel element
   */
  const stopObserving = (): void => {
    if (observer && sentinelElement.value) {
      observer.unobserve(sentinelElement.value);
      sentinelElement.value = null;
    }
  };

  /**
   * Cleanup observer
   */
  const cleanup = (): void => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  // Computed properties for additional state
  const isLoadingOrRetrying = computed(() => loading.value || isRetrying.value || apiLoading.value);
  const canRetry = computed(() => error.value !== null && retryCount.value < maxRetries && !isRetrying.value);
  const shouldShowEndMessage = computed(() => !hasMore.value && totalLoaded.value > 0 && !isLoadingOrRetrying.value);

  // Lifecycle hooks - only in browser environment
  if (typeof window !== 'undefined') {
    onMounted(() => {
      initializeObserver();
    });

    onUnmounted(() => {
      cleanup();
    });
  }

  return {
    repositories,
    loading: isLoadingOrRetrying,
    error,
    hasMore,
    totalLoaded,
    loadMore,
    retry,
    reset,
    // Additional utilities for components
    startObserving,
    stopObserving,
    canRetry,
    shouldShowEndMessage,
    retryCount,
    maxRetries,
  };
};
