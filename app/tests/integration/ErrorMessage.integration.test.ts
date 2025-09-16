import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ErrorMessage from '../../components/UI/ErrorMessage.vue';

describe('ErrorMessage Integration', () => {
  it('integrates properly with composable error handling', async () => {
    const wrapper = mount(ErrorMessage, {
      props: {
        message: 'Failed to load repositories',
        retryable: true,
        retryCount: 0,
        maxRetries: 3,
        isRetrying: false,
      },
    });

    // Verify error is displayed
    expect(wrapper.find('.error-message__text').text()).toBe('Failed to load repositories');
    expect(wrapper.find('.error-message__retry-btn').exists()).toBe(true);

    // Simulate retry click
    await wrapper.find('.error-message__retry-btn').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('handles different error types correctly', async () => {
    // Test rate limit error
    const wrapper = mount(ErrorMessage, {
      props: {
        message: 'API rate limit exceeded. Please try again later.',
        retryable: true,
        rateLimitReset: new Date(Date.now() + 3600000), // 1 hour from now
      },
    });

    expect(wrapper.find('.error-message__title').text()).toBe('Rate Limit Exceeded');
    expect(wrapper.find('.error-message__details').exists()).toBe(true);
    expect(wrapper.text()).toContain('Rate limit will reset at');
  });

  it('handles network errors with proper messaging', () => {
    const wrapper = mount(ErrorMessage, {
      props: {
        message: 'Network connection failed. Please check your internet.',
        retryable: true,
        type: 'error',
      },
    });

    expect(wrapper.find('.error-message__title').text()).toBe('Connection Error');
    expect(wrapper.find('.error-message__details').exists()).toBe(true);
    expect(wrapper.text()).toContain('Please check your internet connection');
  });

  it('prevents retry when max retries reached', async () => {
    const wrapper = mount(ErrorMessage, {
      props: {
        message: 'Persistent error',
        retryable: true,
        retryCount: 3, // Max retries reached
        maxRetries: 3,
      },
    });

    // Click retry button
    await wrapper.find('.error-message__retry-btn').trigger('click');

    // Should not emit retry event when max retries reached
    expect(wrapper.emitted('retry')).toBeFalsy();
  });

  it('shows retry progress correctly', async () => {
    const wrapper = mount(ErrorMessage, {
      props: {
        message: 'Temporary error',
        retryable: true,
        retryCount: 1,
        maxRetries: 3,
      },
    });

    expect(wrapper.find('.error-message__retry-btn').text()).toContain('Retry (1/3)');
  });

  it('handles retrying state correctly', () => {
    const wrapper = mount(ErrorMessage, {
      props: {
        message: 'Loading error',
        retryable: true,
        isRetrying: true,
      },
    });

    const retryButton = wrapper.find('.error-message__retry-btn');
    expect(retryButton.attributes('disabled')).toBeDefined();
    expect(retryButton.text()).toContain('Retrying...');
    expect(wrapper.find('.retry-spinner').exists()).toBe(true);
  });

  it('provides proper accessibility during error states', () => {
    const wrapper = mount(ErrorMessage, {
      props: {
        message: 'Accessibility test error',
        retryable: true,
        retryCount: 2,
        maxRetries: 3,
      },
    });

    const errorElement = wrapper.find('.error-message');
    const retryButton = wrapper.find('.error-message__retry-btn');

    // Check ARIA attributes
    expect(errorElement.attributes('role')).toBe('alert');
    expect(errorElement.attributes('aria-live')).toBe('assertive');
    expect(retryButton.attributes('aria-label')).toContain('Retry loading repositories');
    expect(retryButton.attributes('aria-label')).toContain('Attempt 3 of 3');
  });
});
