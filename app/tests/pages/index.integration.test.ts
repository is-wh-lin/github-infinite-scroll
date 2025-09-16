import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import IndexPage from '../../pages/index.vue';

// Mock RepositoryList component
vi.mock('../../components/Repository/RepositoryList.vue', () => ({
  default: {
    name: 'RepositoryList',
    template: '<div class="repository-list-mock" data-testid="repository-list">Repository List Mock</div>',
    emits: ['load-more'],
  },
}));

// Mock Nuxt composables
vi.mock('nuxt/app', () => ({
  useHead: vi.fn(),
}));

describe('Index Page Integration', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it('renders RepositoryList component', () => {
    const wrapper = mount(IndexPage);

    // Check if RepositoryList component is rendered
    const repositoryList = wrapper.findComponent({ name: 'RepositoryList' });
    expect(repositoryList.exists()).toBe(true);
  });

  it('has correct page structure', () => {
    const wrapper = mount(IndexPage);

    // Check if main container exists
    const container = wrapper.find('.github-repositories');
    expect(container.exists()).toBe(true);

    // Check if RepositoryList is inside the container
    const repositoryList = container.findComponent({ name: 'RepositoryList' });
    expect(repositoryList.exists()).toBe(true);
  });

  it('handles load-more event from RepositoryList', async () => {
    const wrapper = mount(IndexPage);

    // Find RepositoryList component and emit load-more event
    const repositoryList = wrapper.findComponent({ name: 'RepositoryList' });
    await repositoryList.vm.$emit('load-more');

    // The event should be handled (no errors should occur)
    // Since handleLoadMore is just a placeholder, we just verify no errors
    expect(repositoryList.exists()).toBe(true);
  });

  it('sets correct page metadata', async () => {
    const { useHead } = await import('nuxt/app');
    const mockUseHead = vi.mocked(useHead);

    mount(IndexPage);

    // Check if useHead was called with correct metadata
    expect(mockUseHead).toHaveBeenCalledWith({
      title: 'OpenAI GitHub Repositories',
      meta: [
        {
          name: 'description',
          content: "Browse OpenAI's public GitHub repositories with infinite scroll functionality",
        },
      ],
    });
  });

  it('applies correct CSS classes', () => {
    const wrapper = mount(IndexPage);

    const container = wrapper.find('.github-repositories');
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain('github-repositories');
  });
});
