import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingIndicator from '../../components/UI/LoadingIndicator.vue';

describe('LoadingIndicator', () => {
  describe('Skeleton variant', () => {
    it('renders skeleton loading pattern by default', () => {
      const wrapper = mount(LoadingIndicator);

      expect(wrapper.find('.skeleton-container').exists()).toBe(true);
      expect(wrapper.find('.spinner-container').exists()).toBe(false);
      expect(wrapper.find('.dots-container').exists()).toBe(false);
    });

    it('renders correct number of skeleton items', () => {
      const wrapper = mount(LoadingIndicator, {
        props: {
          skeletonCount: 5,
        },
      });

      const skeletonItems = wrapper.findAll('.skeleton-item');
      expect(skeletonItems).toHaveLength(5);
    });

    it('renders skeleton items with proper structure', () => {
      const wrapper = mount(LoadingIndicator);

      const skeletonItem = wrapper.find('.skeleton-item');
      expect(skeletonItem.find('.skeleton-avatar').exists()).toBe(true);
      expect(skeletonItem.find('.skeleton-content').exists()).toBe(true);
      expect(skeletonItem.find('.skeleton-title').exists()).toBe(true);
      expect(skeletonItem.find('.skeleton-description').exists()).toBe(true);
      expect(skeletonItem.find('.skeleton-meta').exists()).toBe(true);
    });
  });

  describe('Spinner variant', () => {
    it('renders spinner loading pattern', () => {
      const wrapper = mount(LoadingIndicator, {
        props: {
          variant: 'spinner',
        },
      });

      expect(wrapper.find('.spinner-container').exists()).toBe(true);
      expect(wrapper.find('.skeleton-container').exists()).toBe(false);
      expect(wrapper.find('.dots-container').exists()).toBe(false);
    });

    it('renders spinner with loading text', () => {
      const loadingText = 'Custom loading message';
      const wrapper = mount(LoadingIndicator, {
        props: {
          variant: 'spinner',
          loadingText,
        },
      });

      expect(wrapper.find('.spinner').exists()).toBe(true);
      expect(wrapper.find('.loading-text').text()).toBe(loadingText);
    });
  });

  describe('Dots variant', () => {
    it('renders dots loading pattern', () => {
      const wrapper = mount(LoadingIndicator, {
        props: {
          variant: 'dots',
        },
      });

      expect(wrapper.find('.dots-container').exists()).toBe(true);
      expect(wrapper.find('.skeleton-container').exists()).toBe(false);
      expect(wrapper.find('.spinner-container').exists()).toBe(false);
    });

    it('renders three dots', () => {
      const wrapper = mount(LoadingIndicator, {
        props: {
          variant: 'dots',
        },
      });

      const dots = wrapper.findAll('.dot');
      expect(dots).toHaveLength(3);
    });
  });

  describe('Accessibility features', () => {
    it('has proper ARIA attributes', () => {
      const ariaLabel = 'Custom loading label';
      const wrapper = mount(LoadingIndicator, {
        props: {
          ariaLabel,
        },
      });

      const container = wrapper.find('.loading-indicator');
      expect(container.attributes('role')).toBe('status');
      expect(container.attributes('aria-label')).toBe(ariaLabel);
      expect(container.attributes('aria-live')).toBe('polite');
    });

    it('includes screen reader text', () => {
      const screenReaderText = 'Custom screen reader message';
      const wrapper = mount(LoadingIndicator, {
        props: {
          screenReaderText,
        },
      });

      const srText = wrapper.find('.sr-only');
      expect(srText.exists()).toBe(true);
      expect(srText.text()).toBe(screenReaderText);
    });

    it('uses default accessibility text when not provided', () => {
      const wrapper = mount(LoadingIndicator);

      const container = wrapper.find('.loading-indicator');
      expect(container.attributes('aria-label')).toBe('Loading content');

      const srText = wrapper.find('.sr-only');
      expect(srText.text()).toBe('Loading more repositories, please wait');
    });

    it('marks decorative elements as aria-hidden', () => {
      const spinnerWrapper = mount(LoadingIndicator, {
        props: { variant: 'spinner' },
      });
      expect(spinnerWrapper.find('.spinner').attributes('aria-hidden')).toBe('true');

      const dotsWrapper = mount(LoadingIndicator, {
        props: { variant: 'dots' },
      });
      expect(dotsWrapper.find('.dots').attributes('aria-hidden')).toBe('true');
    });
  });

  describe('Props handling', () => {
    it('uses default props when none provided', () => {
      const wrapper = mount(LoadingIndicator);

      expect(wrapper.find('.skeleton-container').exists()).toBe(true);
      expect(wrapper.findAll('.skeleton-item')).toHaveLength(3);
      expect(wrapper.find('.loading-indicator').attributes('aria-label')).toBe('Loading content');
    });

    it('accepts custom loading text', () => {
      const customText = 'Fetching data...';
      const wrapper = mount(LoadingIndicator, {
        props: {
          variant: 'spinner',
          loadingText: customText,
        },
      });

      expect(wrapper.find('.loading-text').text()).toBe(customText);
    });

    it('accepts custom skeleton count', () => {
      const wrapper = mount(LoadingIndicator, {
        props: {
          skeletonCount: 7,
        },
      });

      expect(wrapper.findAll('.skeleton-item')).toHaveLength(7);
    });
  });

  describe('CSS classes and styling', () => {
    it('applies correct CSS classes for skeleton variant', () => {
      const wrapper = mount(LoadingIndicator);

      expect(wrapper.find('.skeleton-container').exists()).toBe(true);
      expect(wrapper.find('.skeleton-item').exists()).toBe(true);
      expect(wrapper.find('.skeleton-avatar').exists()).toBe(true);
      expect(wrapper.find('.skeleton-content').exists()).toBe(true);
    });

    it('applies correct CSS classes for spinner variant', () => {
      const wrapper = mount(LoadingIndicator, {
        props: { variant: 'spinner' },
      });

      expect(wrapper.find('.spinner-container').exists()).toBe(true);
      expect(wrapper.find('.spinner').exists()).toBe(true);
    });

    it('applies correct CSS classes for dots variant', () => {
      const wrapper = mount(LoadingIndicator, {
        props: { variant: 'dots' },
      });

      expect(wrapper.find('.dots-container').exists()).toBe(true);
      expect(wrapper.find('.dots').exists()).toBe(true);
      expect(wrapper.find('.dot').exists()).toBe(true);
    });

    it('has screen reader only class for accessibility text', () => {
      const wrapper = mount(LoadingIndicator);

      const srText = wrapper.find('.sr-only');
      expect(srText.exists()).toBe(true);
    });
  });

  describe('Component structure', () => {
    it('renders main container with proper role', () => {
      const wrapper = mount(LoadingIndicator);

      const container = wrapper.find('.loading-indicator');
      expect(container.exists()).toBe(true);
      expect(container.attributes('role')).toBe('status');
    });

    it('conditionally renders variants based on props', () => {
      // Test skeleton (default)
      const skeletonWrapper = mount(LoadingIndicator);
      expect(skeletonWrapper.find('.skeleton-container').exists()).toBe(true);
      expect(skeletonWrapper.find('.spinner-container').exists()).toBe(false);
      expect(skeletonWrapper.find('.dots-container').exists()).toBe(false);

      // Test spinner
      const spinnerWrapper = mount(LoadingIndicator, {
        props: { variant: 'spinner' },
      });
      expect(spinnerWrapper.find('.skeleton-container').exists()).toBe(false);
      expect(spinnerWrapper.find('.spinner-container').exists()).toBe(true);
      expect(spinnerWrapper.find('.dots-container').exists()).toBe(false);

      // Test dots
      const dotsWrapper = mount(LoadingIndicator, {
        props: { variant: 'dots' },
      });
      expect(dotsWrapper.find('.skeleton-container').exists()).toBe(false);
      expect(dotsWrapper.find('.spinner-container').exists()).toBe(false);
      expect(dotsWrapper.find('.dots-container').exists()).toBe(true);
    });
  });
});
