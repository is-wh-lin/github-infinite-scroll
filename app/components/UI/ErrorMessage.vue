<template>
  <div
    class="error-message"
    role="alert"
    :aria-live="ariaLive"
    :class="[`error-message--${type}`, { 'error-message--retryable': retryable }]"
  >
    <!-- Error Icon -->
    <div class="error-message__icon" aria-hidden="true">
      <svg v-if="type === 'error'" class="error-icon" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd"
        />
      </svg>
      <svg v-else-if="type === 'warning'" class="warning-icon" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <svg v-else class="info-icon" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <!-- Error Content -->
    <div class="error-message__content">
      <h3 class="error-message__title">
        {{ errorTitle }}
      </h3>
      <p class="error-message__text">
        {{ message }}
      </p>

      <!-- Additional error details for specific error types -->
      <div v-if="showDetails" class="error-message__details">
        <p v-if="isRateLimitError" class="error-message__detail">Rate limit will reset at {{ rateLimitResetTime }}</p>
        <p v-if="isNetworkError" class="error-message__detail">Please check your internet connection and try again.</p>
      </div>
    </div>

    <!-- Retry Button -->
    <div v-if="retryable" class="error-message__actions">
      <button
        type="button"
        class="error-message__retry-btn"
        :disabled="isRetrying"
        :aria-label="retryButtonAriaLabel"
        @click="handleRetry"
      >
        <span v-if="isRetrying" class="retry-spinner" aria-hidden="true" />
        <svg v-else class="retry-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {{ retryButtonText }}
      </button>
    </div>

    <!-- Screen reader announcements -->
    <div class="sr-only" aria-live="assertive">
      {{ screenReaderAnnouncement }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ErrorMessageProps, ErrorMessageEmits } from '../../../types/components';

interface Props extends ErrorMessageProps {
  retryCount?: number;
  maxRetries?: number;
  rateLimitReset?: Date | null;
  isRetrying?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  retryable: true,
  type: 'error',
  retryCount: 0,
  maxRetries: 3,
  rateLimitReset: null,
  isRetrying: false,
});

const emit = defineEmits<ErrorMessageEmits>();

// Internal state for retry handling
const hasRetried = ref(false);

// Computed properties for error type detection
const isRateLimitError = computed(
  () =>
    props.message.toLowerCase().includes('rate limit') ||
    props.message.toLowerCase().includes('api rate limit exceeded')
);

const isNetworkError = computed(
  () =>
    props.message.toLowerCase().includes('network') ||
    props.message.toLowerCase().includes('connection') ||
    props.message.toLowerCase().includes('fetch')
);

const isAPIError = computed(() => props.message.toLowerCase().includes('api') && !isRateLimitError.value);

// Computed properties for UI content
const errorTitle = computed(() => {
  switch (props.type) {
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Information';
    default:
      if (isRateLimitError.value) return 'Rate Limit Exceeded';
      if (isNetworkError.value) return 'Connection Error';
      if (isAPIError.value) return 'API Error';
      return 'Error';
  }
});

const showDetails = computed(() => (isRateLimitError.value && props.rateLimitReset) || isNetworkError.value);

const rateLimitResetTime = computed(() => {
  if (!props.rateLimitReset) return '';
  return props.rateLimitReset.toLocaleTimeString();
});

const retryButtonText = computed(() => {
  if (props.isRetrying) return 'Retrying...';
  if (props.retryCount > 0) return `Retry (${props.retryCount}/${props.maxRetries})`;
  return 'Try Again';
});

const retryButtonAriaLabel = computed(() => {
  if (props.isRetrying) return 'Retrying to load repositories';
  return `Retry loading repositories. Attempt ${props.retryCount + 1} of ${props.maxRetries}`;
});

const ariaLive = computed(() => {
  return props.type === 'error' ? 'assertive' : 'polite';
});

const screenReaderAnnouncement = computed(() => {
  if (props.isRetrying) return 'Retrying to load repositories';
  if (hasRetried.value) return `Error occurred: ${props.message}. Retry button available.`;
  return '';
});

// Methods
const handleRetry = (): void => {
  if (props.isRetrying || props.retryCount >= props.maxRetries) return;

  hasRetried.value = true;
  emit('retry');
};

// Watch for message changes to update screen reader announcements
watch(
  () => props.message,
  () => {
    hasRetried.value = false;
  }
);
</script>

<style scoped>
.error-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid;
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
  margin: 1rem 0;
}

.error-message--warning {
  background-color: #fffbeb;
  border-color: #fed7aa;
  color: #92400e;
}

.error-message--info {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

.error-message__icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;
}

.error-icon,
.warning-icon,
.info-icon {
  width: 100%;
  height: 100%;
}

.error-message__content {
  flex: 1;
  min-width: 0;
}

.error-message__title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  line-height: 1.25;
}

.error-message__text {
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.error-message__details {
  margin-top: 0.5rem;
}

.error-message__detail {
  font-size: 0.75rem;
  opacity: 0.8;
  margin: 0.25rem 0 0 0;
  line-height: 1.4;
}

.error-message__actions {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
}

.error-message__retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  background-color: #dc2626;
  color: white;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  text-decoration: none;
}

.error-message--warning .error-message__retry-btn {
  background-color: #d97706;
}

.error-message--info .error-message__retry-btn {
  background-color: #2563eb;
}

.error-message__retry-btn:hover:not(:disabled) {
  background-color: #b91c1c;
  transform: translateY(-1px);
}

.error-message--warning .error-message__retry-btn:hover:not(:disabled) {
  background-color: #b45309;
}

.error-message--info .error-message__retry-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.error-message__retry-btn:focus {
  outline: 2px solid;
  outline-offset: 2px;
  outline-color: currentColor;
}

.error-message__retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.retry-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.retry-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Responsive design */
@media (max-width: 640px) {
  .error-message {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .error-message__actions {
    align-self: stretch;
  }

  .error-message__retry-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .error-message__retry-btn {
    transition: none;
  }

  .error-message__retry-btn:hover:not(:disabled) {
    transform: none;
  }

  .retry-spinner {
    animation: none;
    border: 2px solid currentColor;
    border-radius: 0;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .error-message {
    border-width: 2px;
  }

  .error-message__retry-btn {
    border: 2px solid currentColor;
  }
}

/* Focus visible support */
.error-message__retry-btn:focus-visible {
  outline: 2px solid;
  outline-offset: 2px;
}

/* Dark mode support (if needed) */
@media (prefers-color-scheme: dark) {
  .error-message {
    background-color: #450a0a;
    border-color: #7f1d1d;
    color: #fca5a5;
  }

  .error-message--warning {
    background-color: #451a03;
    border-color: #78350f;
    color: #fdba74;
  }

  .error-message--info {
    background-color: #1e3a8a;
    border-color: #3730a3;
    color: #93c5fd;
  }
}
</style>
