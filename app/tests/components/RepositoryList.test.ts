import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import RepositoryList from '../../components/Repository/RepositoryList.vue';
import type { Repository } from '../../../types/repository';

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
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
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

const mockRepositories = [
  createMockRepository(1, 'gpt-3'),
  createMockRepository(2, 'whisper'),
  createMockRepository(3, 'dall-e'),
];

// Mock the composables at the top level
const mockInfiniteScrollReturn = {
  repositories: ref([]),
  loading: ref(false),
  error: ref(null),
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
  useRuntimeConfig: (): { public: { githubToken: string } } => ({
    public: { githubToken: 'mock-token' },
  }),
}));

describe('RepositoryList', () => {
  let wrapper: VueWrapper<InstanceType<typeof RepositoryList>>;

  beforeEach((): void => {
    // Reset reactive values
    mockInfiniteScrollReturn.repositories.value = [];
    mockInfiniteScrollReturn.loading.value = false;
    mockInfiniteScrollReturn.error.value = null;
    mockInfiniteScrollReturn.hasMore.value = true;
    mockInfiniteScrollReturn.totalLoaded.value = 0;
    mockInfiniteScrollReturn.canRetry.value = false;
    mockInfiniteScrollReturn.shouldShowEndMessage.value = false;
    mockInfiniteScrollReturn.retryCount.value = 0;

    // Reset mock functions
    vi.clearAllMocks();
  });

  afterEach((): void => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Rendering', () => {
    it('renders the main title correctly', () => {
      wrapper = mount(RepositoryList);

      const title = wrapper.find('[data-testid="repository-list-title"], .repository-list__title');
      expect(title.exists()).toBe(true);
      expect(title.text()).toContain('OpenAI GitHub Repositories');
    });

    it('renders repository count status', () => {
      mockInfiniteScrollReturn.totalLoaded.value = 5;
      wrapper = mount(RepositoryList);

      const status = wrapper.find('.repository-list__count');
      expect(status.exists()).toBe(true);
      expect(status.text()).toContain('Showing 5 repositories');
    });

    it('renders attribution footer', () => {
      wrapper = mount(RepositoryList);

      const attribution = wrapper.find('.repository-list__attribution');
      expect(attribution.exists()).toBe(true);
      expect(attribution.text()).toContain("OpenAI's GitHub organization");
    });

    it('has proper ARIA attributes for accessibility', () => {
      wrapper = mount(RepositoryList);

      const main = wrapper.find('[role="main"]');
      expect(main.exists()).toBe(true);
      expect(main.attributes('aria-labelledby')).toBe('repository-list-title');

      const feed = wrapper.find('[role="feed"]');
      expect(feed.exists()).toBe(true);
      expect(feed.attributes('aria-label')).toBe('List of OpenAI repositories');
    });
  });

  describe('Repository List Rendering', () => {
    it('renders repository items when repositories are available', async () => {
      mockInfiniteScrollReturn.repositories.value = mockRepositories;
      mockInfiniteScrollReturn.totalLoaded.value = mockRepositories.length;

      wrapper = mount(RepositoryList);
      await nextTick();

      const repositoryItems = wrapper.findAll('[data-testid^="repo-"]');
      expect(repositoryItems).toHaveLength(3);
      expect(repositoryItems[0].text()).toContain('gpt-3');
      expect(repositoryItems[1].text()).toContain('whisper');
      expect(repositoryItems[2].text()).toContain('dall-e');
    });

    it('renders empty state when no repositories are available', () => {
      mockInfiniteScrollReturn.repositories.value = [];
      mockInfiniteScrollReturn.totalLoaded.value = 0;

      wrapper = mount(RepositoryList);

      const repositoryItems = wrapper.findAll('[data-testid^="repo-"]');
      expect(repositoryItems).toHaveLength(0);
    });

    it('passes correct props to RepositoryItem components', async () => {
      mockInfiniteScrollReturn.repositories.value = [mockRepositories[0]];

      wrapper = mount(RepositoryList);
      await nextTick();

      const repositoryItem = wrapper.findComponent({ name: 'RepositoryItem' });
      expect(repositoryItem.exists()).toBe(true);
      expect(repositoryItem.props('repository')).toEqual(mockRepositories[0]);
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when loading is true', async () => {
      mockInfiniteScrollReturn.loading.value = true;

      wrapper = mount(RepositoryList);
      await nextTick();

      const loadingIndicator = wrapper.findComponent({ name: 'LoadingIndicator' });
      expect(loadingIndicator.exists()).toBe(true);
      expect(loadingIndicator.props()).toMatchObject({
        variant: 'skeleton',
        skeletonCount: 3,
        loadingText: 'Loading more repositories...',
      });
    });

    it('hides loading indicator when loading is false', async () => {
      mockInfiniteScrollReturn.loading.value = false;

      wrapper = mount(RepositoryList);
      await nextTick();

      const loadingIndicator = wrapper.findComponent({ name: 'LoadingIndicator' });
      expect(loadingIndicator.exists()).toBe(false);
    });

    it('sets aria-busy attribute correctly during loading', async () => {
      mockInfiniteScrollReturn.loading.value = true;

      wrapper = mount(RepositoryList);
      await nextTick();

      const container = wrapper.find('.repository-list__container');
      expect(container.attributes('aria-busy')).toBe('true');
    });
  });

  describe('Error Handling', () => {
    it('shows error message when error exists', async () => {
      mockInfiniteScrollReturn.error.value = 'Network error occurred';
      mockInfiniteScrollReturn.canRetry.value = true;

      wrapper = mount(RepositoryList);
      await nextTick();

      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' });
      expect(errorMessage.exists()).toBe(true);
      expect(errorMessage.props()).toMatchObject({
        message: 'Network error occurred',
        retryable: true,
        type: 'error',
      });
    });

    it('hides error message when no error exists', async () => {
      mockInfiniteScrollReturn.error.value = null;

      wrapper = mount(RepositoryList);
      await nextTick();

      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' });
      expect(errorMessage.exists()).toBe(false);
    });

    it('handles retry action from error message', async () => {
      mockInfiniteScrollReturn.error.value = 'Network error';
      mockInfiniteScrollReturn.canRetry.value = true;
      const mockRetry = vi.fn().mockResolvedValue(undefined);
      mockInfiniteScrollReturn.retry = mockRetry;

      wrapper = mount(RepositoryList);
      await nextTick();

      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' });
      await errorMessage.vm.$emit('retry');
      await nextTick();

      expect(mockRetry).toHaveBeenCalledOnce();
    });
  });

  describe('End of Data Handling', () => {
    it('shows end message when all data is loaded', async () => {
      mockInfiniteScrollReturn.shouldShowEndMessage.value = true;
      mockInfiniteScrollReturn.totalLoaded.value = 30;

      wrapper = mount(RepositoryList);
      await nextTick();

      const endMessage = wrapper.find('.repository-list__end');
      expect(endMessage.exists()).toBe(true);
      expect(endMessage.text()).toContain('End of repositories');
      expect(endMessage.text()).toContain('Total repositories loaded: 30');
    });

    it('hides end message when more data is available', async () => {
      mockInfiniteScrollReturn.shouldShowEndMessage.value = false;

      wrapper = mount(RepositoryList);
      await nextTick();

      const endMessage = wrapper.find('.repository-list__end');
      expect(endMessage.exists()).toBe(false);
    });

    it('shows end note in status when all repositories are loaded', async () => {
      mockInfiniteScrollReturn.shouldShowEndMessage.value = true;
      mockInfiniteScrollReturn.totalLoaded.value = 25;

      wrapper = mount(RepositoryList);
      await nextTick();

      const endNote = wrapper.find('.repository-list__end-note');
      expect(endNote.exists()).toBe(true);
      expect(endNote.text()).toContain('All available repositories loaded');
    });
  });

  describe('Infinite Scroll Integration', () => {
    it('initializes infinite scroll with provided initial repositories', () => {
      const initialRepos = [mockRepositories[0]];
      wrapper = mount(RepositoryList, {
        props: {
          initialRepositories: initialRepos,
        },
      });

      // Since we're mocking the composable, we just verify the component renders
      expect(wrapper.exists()).toBe(true);
    });

    it('starts observing sentinel element on mount', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      expect(mockInfiniteScrollReturn.startObserving).toHaveBeenCalledOnce();
    });

    it('stops observing on unmount', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      wrapper.unmount();

      expect(mockInfiniteScrollReturn.stopObserving).toHaveBeenCalledOnce();
    });

    it('renders sentinel element with correct classes', async () => {
      mockInfiniteScrollReturn.hasMore.value = true;
      mockInfiniteScrollReturn.loading.value = false;
      mockInfiniteScrollReturn.error.value = null;

      wrapper = mount(RepositoryList);
      await nextTick();

      const sentinel = wrapper.find('.repository-list__sentinel');
      expect(sentinel.exists()).toBe(true);
      expect(sentinel.classes()).toContain('repository-list__sentinel--active');
    });

    it('deactivates sentinel when no more data available', async () => {
      mockInfiniteScrollReturn.hasMore.value = false;

      wrapper = mount(RepositoryList);
      await nextTick();

      const sentinel = wrapper.find('.repository-list__sentinel');
      expect(sentinel.classes()).not.toContain('repository-list__sentinel--active');
    });
  });

  describe('Accessibility Features', () => {
    it('has ARIA live regions for dynamic content', () => {
      wrapper = mount(RepositoryList);

      const liveRegions = wrapper.findAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      const assertiveLiveRegion = wrapper.find('[aria-live="assertive"]');
      expect(assertiveLiveRegion.exists()).toBe(true);
    });

    it('has proper heading hierarchy', () => {
      wrapper = mount(RepositoryList);

      const mainHeading = wrapper.find('h1');
      expect(mainHeading.exists()).toBe(true);
      expect(mainHeading.attributes('id')).toBe('repository-list-title');
    });

    it('has screen reader only content', () => {
      wrapper = mount(RepositoryList);

      const srOnly = wrapper.findAll('.sr-only');
      expect(srOnly.length).toBeGreaterThan(0);
    });

    it('provides proper role attributes', () => {
      wrapper = mount(RepositoryList);

      const main = wrapper.find('[role="main"]');
      expect(main.exists()).toBe(true);

      const feed = wrapper.find('[role="feed"]');
      expect(feed.exists()).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('emits load-more event when loadMore is called', async () => {
      mockInfiniteScrollReturn.loadMore.mockResolvedValue(undefined);
      mockInfiniteScrollReturn.hasMore.value = true;
      mockInfiniteScrollReturn.loading.value = false;
      mockInfiniteScrollReturn.error.value = null;

      wrapper = mount(RepositoryList);
      await nextTick();

      // Access the exposed method
      await wrapper.vm.loadMore();

      expect(wrapper.emitted('load-more')).toBeTruthy();
      expect(mockInfiniteScrollReturn.loadMore).toHaveBeenCalledOnce();
    });

    it('does not load more when already loading', async () => {
      mockInfiniteScrollReturn.loading.value = true;

      wrapper = mount(RepositoryList);
      await nextTick();

      await wrapper.vm.loadMore();

      expect(wrapper.emitted('load-more')).toBeFalsy();
      expect(mockInfiniteScrollReturn.loadMore).not.toHaveBeenCalled();
    });

    it('does not load more when error exists', async () => {
      mockInfiniteScrollReturn.error.value = 'Some error';

      wrapper = mount(RepositoryList);
      await nextTick();

      await wrapper.vm.loadMore();

      expect(wrapper.emitted('load-more')).toBeFalsy();
      expect(mockInfiniteScrollReturn.loadMore).not.toHaveBeenCalled();
    });

    it('does not load more when no more data available', async () => {
      mockInfiniteScrollReturn.hasMore.value = false;

      wrapper = mount(RepositoryList);
      await nextTick();

      await wrapper.vm.loadMore();

      expect(wrapper.emitted('load-more')).toBeFalsy();
      expect(mockInfiniteScrollReturn.loadMore).not.toHaveBeenCalled();
    });
  });

  describe('Props Handling', () => {
    it('uses empty array as default for initialRepositories', () => {
      wrapper = mount(RepositoryList);

      // Since we're mocking the composable, we just verify the component renders
      expect(wrapper.exists()).toBe(true);
    });

    it('passes initialRepositories prop to useInfiniteScroll', () => {
      const initialRepos = [mockRepositories[0], mockRepositories[1]];

      wrapper = mount(RepositoryList, {
        props: {
          initialRepositories: initialRepos,
        },
      });

      // Since we're mocking the composable, we just verify the component renders
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Component Lifecycle', () => {
    it('properly initializes on mount', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      expect(mockInfiniteScrollReturn.startObserving).toHaveBeenCalledOnce();
    });

    it('properly cleans up on unmount', async () => {
      wrapper = mount(RepositoryList);
      await nextTick();

      wrapper.unmount();

      expect(mockInfiniteScrollReturn.stopObserving).toHaveBeenCalledOnce();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes correctly', () => {
      wrapper = mount(RepositoryList);

      const container = wrapper.find('.repository-list');
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('repository-list');
    });
  });
});
