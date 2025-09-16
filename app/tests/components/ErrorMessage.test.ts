import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ErrorMessage from '../../components/UI/ErrorMessage.vue';
import type { ErrorMessageProps } from '../../../types/components';

describe('ErrorMessage', () => {
  const defaultProps: ErrorMessageProps = {
    message: 'Something went wrong',
    retryable: true,
    type: 'error',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders error message with default props', () => {
      const wrapper = mount(ErrorMessage, {
        props: defaultProps,
      });

      expect(wrapper.find('.error-message').exists()).toBe(true);
      expect(wrapper.find('.error-message__text').text()).toBe('Something went wrong');
      expect(wrapper.find('.error-message__title').text()).toBe('Error');
    });

    it('renders with correct ARIA attributes', () => {
      const wrapper = mount(ErrorMessage, {
        props: defaultProps,
      });

      const errorElement = wrapper.find('.error-message');
      expect(errorElement.attributes('role')).toBe('alert');
      expect(errorElement.attributes('aria-live')).toBe('assertive');
    });

    it('applies correct CSS classes based on type', () => {
      const wrapper = mount(ErrorMessage, {
        props: { ...defaultProps, type: 'warning' },
      });

      expect(wrapper.find('.error-message--warning').exists()).toBe(true);
    });
  });

  describe('Error Types', () => {
    it('displays correct title for different error types', async () => {
      const wrapper = mount(ErrorMessage, {
        props: { ...defaultProps, type: 'warning' },
      });

      expect(wrapper.find('.error-message__title').text()).toBe('Warning');

      await wrapper.setProps({ type: 'info' });
      expect(wrapper.find('.error-message__title').text()).toBe('Information');
    });

    it('detects rate limit errors and shows appropriate title', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: 'API rate limit exceeded. Please try again later.',
        },
      });

      expect(wrapper.find('.error-message__title').text()).toBe('Rate Limit Exceeded');
    });

    it('detects network errors and shows appropriate title', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: 'Network connection failed. Please check your internet.',
        },
      });

      expect(wrapper.find('.error-message__title').text()).toBe('Connection Error');
    });

    it('detects API errors and shows appropriate title', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: 'API server returned an error.',
        },
      });

      expect(wrapper.find('.error-message__title').text()).toBe('API Error');
    });
  });

  describe('Error Details', () => {
    it('shows rate limit reset time when provided', () => {
      const resetTime = new Date('2024-01-01T12:00:00Z');
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: 'Rate limit exceeded',
          rateLimitReset: resetTime,
        },
      });

      expect(wrapper.find('.error-message__details').exists()).toBe(true);
      expect(wrapper.text()).toContain('Rate limit will reset at');
    });

    it('shows network error details for connection issues', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: 'Network connection failed',
        },
      });

      expect(wrapper.find('.error-message__details').exists()).toBe(true);
      expect(wrapper.text()).toContain('Please check your internet connection');
    });

    it('does not show details for generic errors', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: 'Generic error message',
        },
      });

      expect(wrapper.find('.error-message__details').exists()).toBe(false);
    });
  });

  describe('Retry Functionality', () => {
    it('shows retry button when retryable is true', () => {
      const wrapper = mount(ErrorMessage, {
        props: { ...defaultProps, retryable: true },
      });

      expect(wrapper.find('.error-message__retry-btn').exists()).toBe(true);
    });

    it('hides retry button when retryable is false', () => {
      const wrapper = mount(ErrorMessage, {
        props: { ...defaultProps, retryable: false },
      });

      expect(wrapper.find('.error-message__retry-btn').exists()).toBe(false);
    });

    it('emits retry event when retry button is clicked', async () => {
      const wrapper = mount(ErrorMessage, {
        props: defaultProps,
      });

      await wrapper.find('.error-message__retry-btn').trigger('click');
      expect(wrapper.emitted('retry')).toHaveLength(1);
    });

    it('shows retry count in button text', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          retryCount: 2,
          maxRetries: 3,
        },
      });

      expect(wrapper.find('.error-message__retry-btn').text()).toContain('Retry (2/3)');
    });

    it('shows "Try Again" for first attempt', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          retryCount: 0,
        },
      });

      expect(wrapper.find('.error-message__retry-btn').text()).toBe('Try Again');
    });

    it('disables retry button when isRetrying is true', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          isRetrying: true,
        },
      });

      const retryButton = wrapper.find('.error-message__retry-btn');
      expect(retryButton.attributes('disabled')).toBeDefined();
      expect(retryButton.text()).toContain('Retrying...');
    });

    it('shows spinner when retrying', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          isRetrying: true,
        },
      });

      expect(wrapper.find('.retry-spinner').exists()).toBe(true);
      expect(wrapper.find('.retry-icon').exists()).toBe(false);
    });

    it('prevents retry when max retries reached', async () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          retryCount: 3,
          maxRetries: 3,
        },
      });

      await wrapper.find('.error-message__retry-btn').trigger('click');
      expect(wrapper.emitted('retry')).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on retry button', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          retryCount: 1,
          maxRetries: 3,
        },
      });

      const retryButton = wrapper.find('.error-message__retry-btn');
      expect(retryButton.attributes('aria-label')).toContain('Retry loading repositories');
      expect(retryButton.attributes('aria-label')).toContain('Attempt 2 of 3');
    });

    it('updates aria-live based on error type', async () => {
      const wrapper = mount(ErrorMessage, {
        props: { ...defaultProps, type: 'error' },
      });

      expect(wrapper.find('.error-message').attributes('aria-live')).toBe('assertive');

      await wrapper.setProps({ type: 'warning' });
      expect(wrapper.find('.error-message').attributes('aria-live')).toBe('polite');
    });

    it('provides screen reader announcements', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          isRetrying: true,
        },
      });

      expect(wrapper.find('.sr-only').text()).toContain('Retrying to load repositories');
    });

    it('has proper icon accessibility attributes', () => {
      const wrapper = mount(ErrorMessage, {
        props: defaultProps,
      });

      const icon = wrapper.find('.error-message__icon');
      expect(icon.attributes('aria-hidden')).toBe('true');
    });
  });

  describe('Visual States', () => {
    it('applies correct styling for error type', () => {
      const wrapper = mount(ErrorMessage, {
        props: { ...defaultProps, type: 'error' },
      });

      expect(wrapper.find('.error-message--error').exists()).toBe(true);
    });

    it('applies correct styling for warning type', () => {
      const wrapper = mount(ErrorMessage, {
        props: { ...defaultProps, type: 'warning' },
      });

      expect(wrapper.find('.error-message--warning').exists()).toBe(true);
    });

    it('applies correct styling for info type', () => {
      const wrapper = mount(ErrorMessage, {
        props: { ...defaultProps, type: 'info' },
      });

      expect(wrapper.find('.error-message--info').exists()).toBe(true);
    });

    it('shows correct icon for each error type', async () => {
      const wrapper = mount(ErrorMessage, {
        props: { ...defaultProps, type: 'error' },
      });

      expect(wrapper.find('.error-icon').exists()).toBe(true);

      await wrapper.setProps({ type: 'warning' });
      expect(wrapper.find('.warning-icon').exists()).toBe(true);

      await wrapper.setProps({ type: 'info' });
      expect(wrapper.find('.info-icon').exists()).toBe(true);
    });
  });

  describe('Props Validation', () => {
    it('handles missing optional props gracefully', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          message: 'Test error',
        },
      });

      expect(wrapper.find('.error-message').exists()).toBe(true);
      expect(wrapper.find('.error-message__retry-btn').exists()).toBe(true); // retryable defaults to true
    });

    it('handles null rateLimitReset gracefully', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: 'Rate limit exceeded',
          rateLimitReset: null,
        },
      });

      expect(wrapper.find('.error-message__details').exists()).toBe(false);
    });
  });

  describe('Reactive Updates', () => {
    it('updates screen reader announcement when message changes', async () => {
      const wrapper = mount(ErrorMessage, {
        props: defaultProps,
      });

      // Trigger retry to set hasRetried to true
      await wrapper.find('.error-message__retry-btn').trigger('click');

      // Change message
      await wrapper.setProps({ message: 'New error message' });

      // Should reset hasRetried and update announcement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((wrapper.vm as any).hasRetried).toBe(false);
    });

    it('updates button text when retry count changes', async () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          retryCount: 0,
          maxRetries: 3,
        },
      });

      expect(wrapper.find('.error-message__retry-btn').text()).toBe('Try Again');

      await wrapper.setProps({ retryCount: 1 });
      expect(wrapper.find('.error-message__retry-btn').text()).toContain('Retry (1/3)');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty message gracefully', () => {
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: '',
        },
      });

      expect(wrapper.find('.error-message__text').text()).toBe('');
      expect(wrapper.find('.error-message').exists()).toBe(true);
    });

    it('handles very long error messages', () => {
      const longMessage = 'A'.repeat(500);
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: longMessage,
        },
      });

      expect(wrapper.find('.error-message__text').text()).toBe(longMessage);
    });

    it('handles special characters in error messages', () => {
      const specialMessage = 'Error: <script>alert("xss")</script> & "quotes"';
      const wrapper = mount(ErrorMessage, {
        props: {
          ...defaultProps,
          message: specialMessage,
        },
      });

      expect(wrapper.find('.error-message__text').text()).toBe(specialMessage);
    });
  });
});
