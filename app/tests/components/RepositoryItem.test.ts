import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RepositoryItem from '../../components/Repository/RepositoryItem.vue';
import type { Repository } from '../../../types/repository';

// Mock repository data for testing
const mockRepository: Repository = {
  id: 123456,
  name: 'test-repository',
  full_name: 'openai/test-repository',
  description: 'A test repository for unit testing',
  html_url: 'https://github.com/openai/test-repository',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-12-01T00:00:00Z',
  stargazers_count: 1250,
  language: 'TypeScript',
  forks_count: 89,
  open_issues_count: 5,
  default_branch: 'main',
  visibility: 'public',
  archived: false,
  disabled: false,
};

const mockRepositoryWithoutDescription: Repository = {
  ...mockRepository,
  id: 123457,
  name: 'no-description-repo',
  description: null,
};

const mockRepositoryWithoutLanguage: Repository = {
  ...mockRepository,
  id: 123458,
  name: 'no-language-repo',
  language: null,
};

const mockRepositoryWithLargeNumbers: Repository = {
  ...mockRepository,
  id: 123459,
  name: 'popular-repo',
  stargazers_count: 15750,
  forks_count: 2500000,
};

describe('RepositoryItem.vue', () => {
  describe('Basic Rendering', () => {
    it('renders repository information correctly', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      // Check if main elements are rendered
      expect(wrapper.find('.repository-item').exists()).toBe(true);
      expect(wrapper.find('.repository-title').exists()).toBe(true);
      expect(wrapper.find('.repository-description').exists()).toBe(true);
      expect(wrapper.find('.repository-meta').exists()).toBe(true);
    });

    it('displays repository name as title', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const title = wrapper.find('.repository-title');
      expect(title.text()).toContain(mockRepository.name);
    });

    it('displays repository description', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const description = wrapper.find('.repository-description');
      expect(description.text()).toBe(mockRepository.description);
    });

    it('creates proper link to repository', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const link = wrapper.find('.repository-link');
      expect(link.attributes('href')).toBe(mockRepository.html_url);
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const article = wrapper.find('.repository-item');
      expect(article.attributes('role')).toBe('article');
      expect(article.attributes('aria-labelledby')).toBe(`repo-title-${mockRepository.id}`);

      const title = wrapper.find('.repository-title');
      expect(title.attributes('id')).toBe(`repo-title-${mockRepository.id}`);

      const link = wrapper.find('.repository-link');
      expect(link.attributes('aria-describedby')).toBe(`repo-desc-${mockRepository.id}`);
    });

    it('includes screen reader text for external link', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const srText = wrapper.find('.sr-only');
      expect(srText.text()).toBe('(opens in new tab)');
    });

    it('has proper ARIA labels for meta information', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const language = wrapper.find('.repository-language');
      expect(language.attributes('aria-label')).toBe(`Primary language: ${mockRepository.language}`);

      const stars = wrapper.find('.repository-stars');
      expect(stars.attributes('aria-label')).toBe(`${mockRepository.stargazers_count} stars`);

      const forks = wrapper.find('.repository-forks');
      expect(forks.attributes('aria-label')).toBe(`${mockRepository.forks_count} forks`);
    });

    it('handles missing description accessibility', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepositoryWithoutDescription },
      });

      const link = wrapper.find('.repository-link');
      expect(link.attributes('aria-describedby')).toBeUndefined();

      const description = wrapper.find('.repository-description');
      expect(description.text()).toBe('No description available');
      expect(description.classes()).toContain('repository-description--empty');
    });
  });

  describe('Edge Cases', () => {
    it('handles repository without description', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepositoryWithoutDescription },
      });

      const description = wrapper.find('.repository-description');
      expect(description.text()).toBe('No description available');
      expect(description.classes()).toContain('repository-description--empty');
    });

    it('handles repository without language', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepositoryWithoutLanguage },
      });

      const language = wrapper.find('.repository-language');
      expect(language.exists()).toBe(false);
    });

    it('formats large numbers correctly', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepositoryWithLargeNumbers },
      });

      const stars = wrapper.find('.repository-stars');
      expect(stars.text()).toContain('15.8k'); // 15750 formatted

      const forks = wrapper.find('.repository-forks');
      expect(forks.text()).toContain('2.5M'); // 2500000 formatted
    });

    it('handles zero values correctly', () => {
      const zeroStarsRepo = { ...mockRepository, stargazers_count: 0, forks_count: 0 };
      const wrapper = mount(RepositoryItem, {
        props: { repository: zeroStarsRepo },
      });

      const stars = wrapper.find('.repository-stars');
      expect(stars.text()).toContain('0');

      const forks = wrapper.find('.repository-forks');
      expect(forks.text()).toContain('0');
    });
  });

  describe('Number Formatting', () => {
    it('formats numbers under 1000 as-is', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: { ...mockRepository, stargazers_count: 999 } },
      });

      const stars = wrapper.find('.repository-stars');
      expect(stars.text()).toContain('999');
    });

    it('formats thousands with k suffix', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: { ...mockRepository, stargazers_count: 1500 } },
      });

      const stars = wrapper.find('.repository-stars');
      expect(stars.text()).toContain('1.5k');
    });

    it('formats millions with M suffix', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: { ...mockRepository, stargazers_count: 2500000 } },
      });

      const stars = wrapper.find('.repository-stars');
      expect(stars.text()).toContain('2.5M');
    });

    it('removes trailing zeros in formatted numbers', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: { ...mockRepository, stargazers_count: 1000 } },
      });

      const stars = wrapper.find('.repository-stars');
      expect(stars.text()).toContain('1k'); // Not '1.0k'
    });
  });

  describe('Language Display', () => {
    it('displays language with colored dot', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const language = wrapper.find('.repository-language');
      expect(language.exists()).toBe(true);
      expect(language.text()).toContain(mockRepository.language);

      const languageDot = wrapper.find('.language-dot');
      expect(languageDot.exists()).toBe(true);
      expect(languageDot.classes()).toContain('language-typescript');
    });

    it('handles different language cases correctly', () => {
      const jsRepo = { ...mockRepository, language: 'JavaScript' };
      const wrapper = mount(RepositoryItem, {
        props: { repository: jsRepo },
      });

      const languageDot = wrapper.find('.language-dot');
      expect(languageDot.classes()).toContain('language-javascript');
    });
  });

  describe('Interactive Elements', () => {
    it('has focusable link element', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const link = wrapper.find('.repository-link');
      expect(link.element.tagName).toBe('A');
      expect(link.attributes('href')).toBeTruthy();
    });

    it('maintains proper tab order', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      // The link should be the only focusable element
      const focusableElements = wrapper.findAll('a, button, input, select, textarea, [tabindex]');
      expect(focusableElements).toHaveLength(1);
      expect(focusableElements[0]?.classes()).toContain('repository-link');
    });
  });

  describe('Semantic HTML Structure', () => {
    it('uses proper semantic HTML elements', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      // Check semantic structure
      expect(wrapper.find('article').exists()).toBe(true);
      expect(wrapper.find('header').exists()).toBe(true);
      expect(wrapper.find('h3').exists()).toBe(true);
      expect(wrapper.find('a').exists()).toBe(true);
      expect(wrapper.find('p').exists()).toBe(true);
    });

    it('has proper heading hierarchy', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const heading = wrapper.find('h3');
      expect(heading.exists()).toBe(true);
      expect(heading.classes()).toContain('repository-title');
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      expect(wrapper.find('.repository-item').exists()).toBe(true);
      expect(wrapper.find('.repository-header').exists()).toBe(true);
      expect(wrapper.find('.repository-title').exists()).toBe(true);
      expect(wrapper.find('.repository-link').exists()).toBe(true);
      expect(wrapper.find('.repository-content').exists()).toBe(true);
      expect(wrapper.find('.repository-description').exists()).toBe(true);
      expect(wrapper.find('.repository-meta').exists()).toBe(true);
    });

    it('applies empty description class when needed', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepositoryWithoutDescription },
      });

      const description = wrapper.find('.repository-description');
      expect(description.classes()).toContain('repository-description--empty');
    });
  });

  describe('Icons', () => {
    it('includes star and fork icons', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const starIcon = wrapper.find('.star-icon');
      expect(starIcon.exists()).toBe(true);
      expect(starIcon.attributes('aria-hidden')).toBe('true');

      const forkIcon = wrapper.find('.fork-icon');
      expect(forkIcon.exists()).toBe(true);
      expect(forkIcon.attributes('aria-hidden')).toBe('true');
    });

    it('has proper SVG attributes for accessibility', () => {
      const wrapper = mount(RepositoryItem, {
        props: { repository: mockRepository },
      });

      const icons = wrapper.findAll('svg');
      icons.forEach((icon) => {
        expect(icon.attributes('aria-hidden')).toBe('true');
        expect(icon.attributes('width')).toBe('16');
        expect(icon.attributes('height')).toBe('16');
      });
    });
  });
});
