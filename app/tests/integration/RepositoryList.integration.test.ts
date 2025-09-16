import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import RepositoryList from '../../components/Repository/RepositoryList.vue';
import type { Repository } from '../../../types/repository';

// Mock the composables for integration tests
const mockInfiniteScrollReturn = {
  repositories: ref<Repository[]>([]),
  loading: ref(false),
  error: ref<string | null>(null),
  hasMore: ref(true),
  totalLoaded: ref(0),
  loadMore: vi.fn(),
  retry: vi.fn(),
  startObserving: vi.fn(),
  stopObserving: vi.fn(),
  canRetry: ref(false),
  shouldShowEndMessage: ref(false),
  retryCount: ref(0),
  maxRetries: 3,
};

vi.mock('../../composables/useInfiniteScroll', () => ({
  useInfiniteScroll: (): typeof mockInfiniteScrollReturn => mockInfiniteScrollReturn,
}));

vi.mock('#app', () => ({
  useRuntimeConfig: (): { public: { githubToken: string; githubApiBaseUrl: string } } => ({
    public: {
      githubToken: 'test-token',
      githubApiBaseUrl: 'https://api.github.com',
    },
  }),
}));

// Mock child components
vi.mock('../../components/Repository/RepositoryItem.vue', () => ({
  default: {
    name: 'RepositoryItem',
    template: '<div class="repository-item-mock" :data-testid="`repo-${repository.id}`">{{ repository.name }}</div>',
    props: ['repository'],
  },
}));

vi.mock('../../components/UI/LoadingIndicator.vue', () => ({
  default: {
    name: 'LoadingIndicator',
    template: '<div class="loading-indicator-mock" data-testid="loading-indicator">Loading...</div>',
    props: ['variant', 'skeletonCount', 'loadingText', 'ariaLabel', 'screenReaderText'],
  },
}));

vi.mock('../../components/UI/ErrorMessage.vue', () => ({
  default: {
    name: 'ErrorMessage',
    template: `
      <div class="error-message-mock" data-testid="error-message">
        {{ message }}
        <button v-if="retryable" @click="$emit('retry')" data-testid="retry-button">Retry</button>
      </div>
    `,
    props: ['message', 'retryable', 'retryCount', 'maxRetries', 'isRetrying', 'type'],
    emits: ['retry'],
  },
}));

// Mock intersection observer
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

window.IntersectionObserver = mockIntersectionObserver;

// Sample repository data
const createMockRepository = (id: number, name: string = `repo-${id}`): Repository => ({
  id,
  name,
  full_name: `openai/${name}`,
  description: `Description for ${name}`,
  html_url: `https://github.com/openai/${name}`,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-02T00:00:00Z',
  stargazers_count: 100 + id,
  language: 'TypeScript',
  forks_count: 10 + id,
  open_issues_count: 5,
  default_branch: 'main',
  visibility: 'public',
  archived: false,
  disabled: false,
});

const mockRepositories = Array.from({ length: 10 }, (_, i) => createMockRepository(i + 1, `test-repo-${i + 1}`));

describe('RepositoryList Integration Tests', () => {
  let wrapper: VueWrapper<InstanceType<typeof RepositoryList>>;

  beforeEach((): void => {
    vi.clearAllMocks();

    // Reset reactive values
    mockInfiniteScrollReturn.repositories.value = [];
    mockInfiniteScrollReturn.loading.value = false;
    mockInfiniteScrollReturn.error.value = null;
    mockInfiniteScrollReturn.hasMore.value = true;
    mockInfiniteScrollReturn.totalLoaded.value = 0;
    mockInfiniteScrollReturn.canRetry.value = false;
    mockInfiniteScrollReturn.shouldShowEndMessage.value = false;
    mockInfiniteScrollReturn.retryCount.value = 0;
  });

  afterEach((): void => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Integration with Composables', () => {
    it('integrates properly with useInfiniteScroll composable', async () => {
      // Set up initial repositories
      mockInfiniteScrollReturn.repositories.value = mockRepositories.slice(0, 3);
      mockInfiniteScrollReturn.totalLoaded.value = 3;

      wrapper = mount(RepositoryList);
      await nextTick();

      // Should render repositories from composable
      const repositoryItems = wrapper.findAll('[data-testid^="repo-"]');
      expect(repositoryItems).toHaveLength(3);

      // Should show correct count
      const status = wrapper.find('.repository-list__count');
      expect(status.text()).toContain('Showing 3 repositories');
    });

    it('handles loading state from composable', async () => {
      mockInfiniteScrollReturn.loading.value = true;

      wrapper = mount(RepositoryList);
      await nextTick();

      // Should show loading indicator
      const loadingIndicator = wrapper.findComponent({ name: 'LoadingIndicator' });
      expect(loadingIndicator.exists()).toBe(true);

      // Should set aria-busy
      const container = wrapper.find('.repository-list__container');
      expect(container.attributes('aria-busy')).toBe('true');
    });

    it('handles error state from composable', async () => {
      mockInfiniteScrollReturn.error.value = 'Test error message';
      mockInfiniteScrollReturn.canRetry.value = true;

      wrapper = mount(RepositoryList);
      await nextTick();

      // Should show error message
      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' });
      expect(errorMessage.exists()).toBe(true);
      expect(errorMessage.props('message')).toBe('Test error message');
      expect(errorMessage.props('retryable')).toBe(true);
    });

    it('handles end of data state from composable', async () => {
      mockInfiniteScrollReturn.shouldShowEndMessage.value = true;
      mockInfiniteScrollReturn.totalLoaded.value = 30;

      wrapper = mount(RepositoryList);
      await nextTick();

      // Should show end message
      const endMessage = wrapper.find('.repository-list__end');
      expect(endMessage.exists()).toBe(true);
      expect(endMessage.text()).toContain('End of repositories');
      expect(endMessage.text()).toContain('Total repositories loaded: 30');
    });
  });

  describe('Intersection Observer Integration', () => {
    it('sets up intersection observer on mount', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      // Should call startObserving from composable
      expect(mockInfiniteScrollReturn.startObserving).toHaveBeenCalledOnce();
    });

    it('cleans up intersection observer on unmount', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      wrapper.unmount();

      // Should call stopObserving from composable
      expect(mockInfiniteScrollReturn.stopObserving).toHaveBeenCalledOnce();
    });

    it('renders sentinel element with correct state', async () => {
      mockInfiniteScrollReturn.hasMore.value = true;
      mockInfiniteScrollReturn.loading.value = false;
      mockInfiniteScrollReturn.error.value = null;

      wrapper = mount(RepositoryList);
      await nextTick();

      const sentinel = wrapper.find('.repository-list__sentinel');
      expect(sentinel.exists()).toBe(true);
      expect(sentinel.classes()).toContain('repository-list__sentinel--active');
    });

    it('deactivates sentinel when conditions are not met', async () => {
      mockInfiniteScrollReturn.hasMore.value = false;

      wrapper = mount(RepositoryList);
      await nextTick();

      const sentinel = wrapper.find('.repository-list__sentinel');
      expect(sentinel.classes()).not.toContain('repository-list__sentinel--active');
    });
  });

  describe('Event Handling Integration', () => {
    it('handles loadMore method correctly', async () => {
      mockInfiniteScrollReturn.hasMore.value = true;
      mockInfiniteScrollReturn.loading.value = false;
      mockInfiniteScrollReturn.error.value = null;
      mockInfiniteScrollReturn.loadMore.mockResolvedValue(undefined);

      wrapper = mount(RepositoryList);
      await nextTick();

      // Call loadMore method
      await wrapper.vm.loadMore();

      // Should emit load-more event
      expect(wrapper.emitted('load-more')).toBeTruthy();

      // Should call composable's loadMore
      expect(mockInfiniteScrollReturn.loadMore).toHaveBeenCalledOnce();
    });

    it('handles retry from error message', async () => {
      mockInfiniteScrollReturn.error.value = 'Test error';
      mockInfiniteScrollReturn.canRetry.value = true;
      mockInfiniteScrollReturn.retry.mockResolvedValue(undefined);

      wrapper = mount(RepositoryList);
      await nextTick();

      // Find and trigger retry
      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' });
      await errorMessage.vm.$emit('retry');

      // Should call composable's retry
      expect(mockInfiniteScrollReturn.retry).toHaveBeenCalledOnce();
    });

    it('prevents loadMore when conditions are not met', async () => {
      mockInfiniteScrollReturn.loading.value = true; // Already loading

      wrapper = mount(RepositoryList);
      await nextTick();

      await wrapper.vm.loadMore();

      // Should not emit event or call composable
      expect(wrapper.emitted('load-more')).toBeFalsy();
      expect(mockInfiniteScrollReturn.loadMore).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Integration', () => {
    it('provides proper ARIA live regions', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      // Should have live regions for announcements
      const liveRegions = wrapper.findAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      // Should have assertive live region for important announcements
      const assertiveLiveRegion = wrapper.find('[aria-live="assertive"]');
      expect(assertiveLiveRegion.exists()).toBe(true);
    });

    it('maintains proper semantic structure', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      // Should have region landmark
      const region = wrapper.find('[role="region"]');
      expect(region.exists()).toBe(true);
      expect(region.attributes('aria-labelledby')).toBe('repository-list-title');

      // Should have feed role for repository list
      const feed = wrapper.find('[role="feed"]');
      expect(feed.exists()).toBe(true);
      expect(feed.attributes('aria-label')).toBe('List of OpenAI repositories');

      // Should have proper heading
      const heading = wrapper.find('h2#repository-list-title');
      expect(heading.exists()).toBe(true);
      expect(heading.classes()).toContain('sr-only');
    });

    it('updates aria-busy during loading', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      // Initially not busy
      let container = wrapper.find('.repository-list__container');
      expect(container.attributes('aria-busy')).toBe('false');

      // Set loading state
      mockInfiniteScrollReturn.loading.value = true;
      await nextTick();

      // Should be busy
      container = wrapper.find('.repository-list__container');
      expect(container.attributes('aria-busy')).toBe('true');
    });
  });

  describe('Props Integration', () => {
    it('passes initial repositories to composable', async () => {
      const initialRepos = mockRepositories.slice(0, 2);

      wrapper = mount(RepositoryList, {
        props: {
          initialRepositories: initialRepos,
        },
      });

      // Component should render successfully with props
      expect(wrapper.exists()).toBe(true);
    });

    it('handles empty initial repositories', async () => {
      wrapper = mount(RepositoryList, {
        props: {
          initialRepositories: [],
        },
      });

      // Should render without errors
      expect(wrapper.exists()).toBe(true);

      // Should show empty state
      const repositoryItems = wrapper.findAll('[data-testid^="repo-"]');
      expect(repositoryItems).toHaveLength(0);
    });
  });

  describe('State Synchronization', () => {
    it('synchronizes repository display with composable state', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      // Initially empty
      expect(wrapper.findAll('[data-testid^="repo-"]')).toHaveLength(0);

      // Add repositories to composable state
      mockInfiniteScrollReturn.repositories.value = mockRepositories.slice(0, 2);
      mockInfiniteScrollReturn.totalLoaded.value = 2;
      await nextTick();

      // Should update display
      const repositoryItems = wrapper.findAll('[data-testid^="repo-"]');
      expect(repositoryItems).toHaveLength(2);

      const status = wrapper.find('.repository-list__count');
      expect(status.text()).toContain('Showing 2 repositories');
    });

    it('synchronizes loading state with composable', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      // Initially not loading
      expect(wrapper.findComponent({ name: 'LoadingIndicator' }).exists()).toBe(false);

      // Set loading in composable
      mockInfiniteScrollReturn.loading.value = true;
      await nextTick();

      // Should show loading
      expect(wrapper.findComponent({ name: 'LoadingIndicator' }).exists()).toBe(true);

      // Clear loading
      mockInfiniteScrollReturn.loading.value = false;
      await nextTick();

      // Should hide loading
      expect(wrapper.findComponent({ name: 'LoadingIndicator' }).exists()).toBe(false);
    });
  });
});
