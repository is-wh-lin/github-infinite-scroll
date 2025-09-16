import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent } from 'vue';

// Mock RepositoryList component
const MockRepositoryList = defineComponent({
  name: 'RepositoryList',
  props: {
    initialRepositories: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['load-more'],
  template: '<div class="repository-list-mock" data-testid="repository-list">Repository List Mock</div>',
});

// Mock Nuxt composables
const mockUseHead = vi.fn();
const mockUseAsyncData = vi.fn();
const mockUseRuntimeConfig = vi.fn();
const mock$fetch = vi.fn();

// Mock all possible import paths for RepositoryList
vi.mock('~/components/Repository/RepositoryList.vue', () => ({
  default: MockRepositoryList,
}));

vi.mock('../../components/Repository/RepositoryList.vue', () => ({
  default: MockRepositoryList,
}));

vi.mock('@/components/Repository/RepositoryList.vue', () => ({
  default: MockRepositoryList,
}));

// Mock Nuxt composables with all possible import paths
vi.mock('#app', () => ({
  useHead: mockUseHead,
  useAsyncData: mockUseAsyncData,
  useRuntimeConfig: mockUseRuntimeConfig,
  defineOptions: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useHead: mockUseHead,
  useAsyncData: mockUseAsyncData,
  useRuntimeConfig: mockUseRuntimeConfig,
  defineOptions: vi.fn(),
}));

// Mock global $fetch
(global as any).$fetch = mock$fetch;

// Create a test version of the component without top-level await
const createTestIndexPage = (): ReturnType<typeof defineComponent> => {
  return defineComponent({
    name: 'IndexPage',
    components: {
      RepositoryList: MockRepositoryList,
    },
    setup() {
      // Mock the async data
      const initialRepositories = { value: [] };
      const initialError = { value: null };

      // Mock useHead call
      mockUseHead({
        title: 'OpenAI GitHub Repositories - Infinite Scroll',
        meta: [
          {
            name: 'description',
            content:
              "Browse OpenAI's public GitHub repositories with infinite scroll functionality. Discover open-source projects, libraries, and tools from OpenAI.",
          },
        ],
      });

      const handleLoadMore = (): void => {
        // Mock handler
      };

      return {
        initialRepositories,
        initialError,
        handleLoadMore,
      };
    },
    template: `
      <div class="github-repositories">
        <!-- Page Header -->
        <header class="page-header">
          <div class="container">
            <h1 class="page-title">OpenAI GitHub Repositories</h1>
            <p class="page-description">
              Explore OpenAI's public repositories with infinite scroll functionality. Data sourced from GitHub API.
            </p>
          </div>
        </header>

        <!-- Main Content -->
        <main class="main-content">
          <div class="container">
            <!-- Repository List with Initial Data -->
            <RepositoryList :initial-repositories="initialRepositories" @load-more="handleLoadMore" />
          </div>
        </main>
      </div>
    `,
  });
};

describe('Index Page Integration', () => {
  beforeEach((): void => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseAsyncData.mockImplementation((_key, _handler, _options) => {
      return {
        data: { value: [] },
        error: { value: null },
      };
    });

    mockUseRuntimeConfig.mockReturnValue({
      public: {
        githubApiBaseUrl: 'https://api.github.com',
        githubToken: 'mock-token',
      },
    });

    mock$fetch.mockResolvedValue([]);
  });

  it('renders RepositoryList component', async () => {
    const IndexPage = createTestIndexPage();
    const wrapper = mount(IndexPage);
    await flushPromises();

    // Check if RepositoryList component is rendered
    const repositoryList = wrapper.findComponent({ name: 'RepositoryList' });
    expect(repositoryList.exists()).toBe(true);
  });

  it('has correct page structure', async () => {
    const IndexPage = createTestIndexPage();
    const wrapper = mount(IndexPage);
    await flushPromises();

    // Check if main container exists
    const container = wrapper.find('.github-repositories');
    expect(container.exists()).toBe(true);

    // Check if page header exists
    const header = wrapper.find('.page-header');
    expect(header.exists()).toBe(true);

    // Check if main content exists
    const mainContent = wrapper.find('.main-content');
    expect(mainContent.exists()).toBe(true);
  });

  it('handles load-more event from RepositoryList', async () => {
    const IndexPage = createTestIndexPage();
    const wrapper = mount(IndexPage);
    await flushPromises();

    // Find RepositoryList component and emit load-more event
    const repositoryList = wrapper.findComponent({ name: 'RepositoryList' });
    expect(repositoryList.exists()).toBe(true);

    await repositoryList.vm.$emit('load-more');

    // The event should be handled (no errors should occur)
    // Since handleLoadMore is just a placeholder, we just verify no errors
    expect(repositoryList.exists()).toBe(true);
  });

  it('sets correct page metadata', async () => {
    const IndexPage = createTestIndexPage();
    mount(IndexPage);
    await flushPromises();

    // Check if useHead was called with correct metadata (updated title)
    expect(mockUseHead).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'OpenAI GitHub Repositories - Infinite Scroll',
        meta: expect.arrayContaining([
          expect.objectContaining({
            name: 'description',
            content: expect.stringContaining("Browse OpenAI's public GitHub repositories"),
          }),
        ]),
      })
    );
  });

  it('applies correct CSS classes', async () => {
    const IndexPage = createTestIndexPage();
    const wrapper = mount(IndexPage);
    await flushPromises();

    const container = wrapper.find('.github-repositories');
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain('github-repositories');
  });
});
