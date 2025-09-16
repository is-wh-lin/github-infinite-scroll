import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import IndexPage from '../../pages/index.vue';

// Mock the composables
vi.mock('../../composables/useInfiniteScroll', () => ({
  useInfiniteScroll: vi.fn(() => ({
    repositories: [],
    loading: false,
    error: null,
    totalLoaded: 0,
    loadMore: vi.fn(),
    retry: vi.fn(),
    startObserving: vi.fn(),
    stopObserving: vi.fn(),
    canRetry: true,
    shouldShowEndMessage: false,
    retryCount: 0,
    maxRetries: 3,
  })),
}));

// Mock Nuxt composables
vi.mock('nuxt/app', () => ({
  useHead: vi.fn(),
}));

describe('Index Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ErrorMessage component when error occurs', async () => {
    const mockUseInfiniteScroll = await import('../../composables/useInfiniteScroll');

    // Mock error state
    vi.mocked(mockUseInfiniteScroll.useInfiniteScroll).mockReturnValue({
      repositories: [],
      loading: false,
      error: 'Failed to load repositories',
      totalLoaded: 0,
      loadMore: vi.fn(),
      retry: vi.fn(),
      startObserving: vi.fn(),
      stopObserving: vi.fn(),
      canRetry: true,
      shouldShowEndMessage: false,
      retryCount: 1,
      maxRetries: 3,
    });

    const wrapper = mount(IndexPage);

    // Check if ErrorMessage component is rendered
    const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' });
    expect(errorMessage.exists()).toBe(true);

    // Check if error message props are correctly passed
    expect(errorMessage.props('message')).toBe('Failed to load repositories');
    expect(errorMessage.props('retryable')).toBe(true);
    expect(errorMessage.props('retryCount')).toBe(1);
    expect(errorMessage.props('maxRetries')).toBe(3);
    expect(errorMessage.props('isRetrying')).toBe(false);
  });

  it('does not render ErrorMessage when no error', async () => {
    const mockUseInfiniteScroll = await import('../../composables/useInfiniteScroll');

    // Mock normal state (no error)
    vi.mocked(mockUseInfiniteScroll.useInfiniteScroll).mockReturnValue({
      repositories: [],
      loading: false,
      error: null,
      totalLoaded: 0,
      loadMore: vi.fn(),
      retry: vi.fn(),
      startObserving: vi.fn(),
      stopObserving: vi.fn(),
      canRetry: false,
      shouldShowEndMessage: false,
      retryCount: 0,
      maxRetries: 3,
    });

    const wrapper = mount(IndexPage);

    // Check if ErrorMessage component is not rendered
    const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' });
    expect(errorMessage.exists()).toBe(false);
  });

  it('calls retry function when ErrorMessage emits retry event', async () => {
    const mockUseInfiniteScroll = await import('../../composables/useInfiniteScroll');
    const mockRetry = vi.fn();

    // Mock error state with retry function
    vi.mocked(mockUseInfiniteScroll.useInfiniteScroll).mockReturnValue({
      repositories: [],
      loading: false,
      error: 'Network error occurred',
      totalLoaded: 0,
      loadMore: vi.fn(),
      retry: mockRetry,
      startObserving: vi.fn(),
      stopObserving: vi.fn(),
      canRetry: true,
      shouldShowEndMessage: false,
      retryCount: 0,
      maxRetries: 3,
    });

    const wrapper = mount(IndexPage);

    // Find ErrorMessage component and emit retry event
    const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' });
    await errorMessage.vm.$emit('retry');

    // Check if retry function was called
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('shows loading state in ErrorMessage when retrying', async () => {
    const mockUseInfiniteScroll = await import('../../composables/useInfiniteScroll');

    // Mock retrying state
    vi.mocked(mockUseInfiniteScroll.useInfiniteScroll).mockReturnValue({
      repositories: [],
      loading: true, // This represents retrying state
      error: 'Connection failed',
      totalLoaded: 0,
      loadMore: vi.fn(),
      retry: vi.fn(),
      startObserving: vi.fn(),
      stopObserving: vi.fn(),
      canRetry: true,
      shouldShowEndMessage: false,
      retryCount: 1,
      maxRetries: 3,
    });

    const wrapper = mount(IndexPage);

    // Check if ErrorMessage shows retrying state
    const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' });
    expect(errorMessage.props('isRetrying')).toBe(true);
  });

  it('renders repositories when available', async () => {
    const mockUseInfiniteScroll = await import('../../composables/useInfiniteScroll');

    const mockRepositories = [
      {
        id: 1,
        name: 'test-repo',
        full_name: 'openai/test-repo',
        description: 'Test repository',
        html_url: 'https://github.com/openai/test-repo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        stargazers_count: 100,
        language: 'TypeScript',
        forks_count: 10,
        open_issues_count: 5,
        default_branch: 'main',
        visibility: 'public' as const,
        archived: false,
        disabled: false,
      },
    ];

    // Mock state with repositories
    vi.mocked(mockUseInfiniteScroll.useInfiniteScroll).mockReturnValue({
      repositories: mockRepositories,
      loading: false,
      error: null,
      totalLoaded: 1,
      loadMore: vi.fn(),
      retry: vi.fn(),
      startObserving: vi.fn(),
      stopObserving: vi.fn(),
      canRetry: false,
      shouldShowEndMessage: false,
      retryCount: 0,
      maxRetries: 3,
    });

    const wrapper = mount(IndexPage);

    // Check if repositories are rendered
    const repositoryItems = wrapper.findAllComponents({ name: 'RepositoryItem' });
    expect(repositoryItems).toHaveLength(1);
  });
});
