<template>
  <div class="repository-list" role="main" aria-labelledby="repository-list-title">
    <!-- Main heading -->
    <h1 id="repository-list-title" class="repository-list__title">OpenAI GitHub Repositories</h1>

    <!-- Repository count and status -->
    <div class="repository-list__status" aria-live="polite" aria-atomic="false">
      <p class="repository-list__count">
        Showing {{ totalLoaded }} repositories
        <span v-if="shouldShowEndMessage" class="repository-list__end-note"> (All available repositories loaded) </span>
      </p>
    </div>

    <!-- Repository items container -->
    <div class="repository-list__container" role="feed" :aria-busy="loading" aria-label="List of OpenAI repositories">
      <!-- Repository items -->
      <div v-if="repositories.length > 0" class="repository-list__items">
        <RepositoryItem
          v-for="repository in repositories"
          :key="repository.id"
          :repository="repository"
          class="repository-list__item"
        />
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="repository-list__loading">
        <LoadingIndicator
          variant="skeleton"
          :skeleton-count="3"
          loading-text="Loading more repositories..."
          aria-label="Loading more repositories"
          screen-reader-text="Loading additional repositories from OpenAI"
        />
      </div>

      <!-- Error state -->
      <div v-if="error" class="repository-list__error">
        <ErrorMessage
          :message="error"
          :retryable="canRetry"
          :retry-count="retryCount"
          :max-retries="maxRetries"
          :is-retrying="loading"
          type="error"
          @retry="handleRetry"
        />
      </div>

      <!-- End of data message -->
      <div v-if="shouldShowEndMessage" class="repository-list__end" role="status" aria-live="polite">
        <div class="repository-list__end-content">
          <h3 class="repository-list__end-title">End of repositories</h3>
          <p class="repository-list__end-text">
            You've reached the end of OpenAI's public repositories.
            <br >
            Total repositories loaded: {{ totalLoaded }}
          </p>
        </div>
      </div>

      <!-- Intersection observer sentinel -->
      <div
        ref="sentinelRef"
        class="repository-list__sentinel"
        :class="{ 'repository-list__sentinel--active': hasMore && !loading && !error }"
        aria-hidden="true"
      />
    </div>

    <!-- ARIA live region for dynamic announcements -->
    <div class="sr-only" aria-live="assertive" aria-atomic="true">
      {{ liveRegionMessage }}
    </div>

    <!-- Attribution -->
    <footer class="repository-list__attribution">
      <p class="repository-list__attribution-text">
        Repository data provided by
        <a
          href="https://github.com/openai"
          target="_blank"
          rel="noopener noreferrer"
          class="repository-list__attribution-link"
        >
          OpenAI's GitHub organization
          <span class="sr-only">(opens in new tab)</span>
        </a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { RepositoryListProps, RepositoryListEmits } from '../../../types/components';
import { useInfiniteScroll } from '../../composables/useInfiniteScroll';
import RepositoryItem from './RepositoryItem.vue';
import LoadingIndicator from '../UI/LoadingIndicator.vue';
import ErrorMessage from '../UI/ErrorMessage.vue';

type Props = RepositoryListProps;

const props = withDefaults(defineProps<Props>(), {
  initialRepositories: () => [],
});

const emit = defineEmits<RepositoryListEmits>();

// Infinite scroll composable
const {
  repositories,
  loading,
  error,
  hasMore,
  totalLoaded,
  loadMore,
  retry,
  startObserving,
  stopObserving,
  canRetry,
  shouldShowEndMessage,
  retryCount,
  maxRetries,
} = useInfiniteScroll(props.initialRepositories);

// Template refs
const sentinelRef = ref<HTMLElement | null>(null);

// Live region message for screen readers
const liveRegionMessage = ref<string>('');

// Computed properties for accessibility
const isInitialLoad = computed(() => repositories.value.length === 0 && loading.value);

// Methods
const handleRetry = async (): Promise<void> => {
  liveRegionMessage.value = 'Retrying to load repositories...';

  try {
    await retry();
    liveRegionMessage.value = 'Retry successful. Loading repositories...';
  } catch {
    liveRegionMessage.value = 'Retry failed. Please try again.';
  }
};

const handleLoadMore = async (): Promise<void> => {
  if (!hasMore.value || loading.value || error.value) {
    return;
  }

  liveRegionMessage.value = 'Loading more repositories...';
  emit('load-more');

  try {
    await loadMore();

    // Announce successful load
    const newCount = repositories.value.length;
    liveRegionMessage.value = `Loaded more repositories. Now showing ${newCount} repositories.`;

    if (shouldShowEndMessage.value) {
      liveRegionMessage.value = `All repositories loaded. Total: ${newCount} repositories.`;
    }
  } catch {
    liveRegionMessage.value = 'Failed to load more repositories. Please try again.';
  }
};

// Setup intersection observer when component mounts
onMounted(async () => {
  await nextTick();

  if (sentinelRef.value) {
    startObserving(sentinelRef.value);
  }

  // Announce initial state
  if (repositories.value.length > 0) {
    liveRegionMessage.value = `Repository list loaded with ${repositories.value.length} repositories.`;
  }
});

// Cleanup intersection observer when component unmounts
onUnmounted(() => {
  stopObserving();
});

// Watch for changes in repositories to trigger load more
watch(
  () => repositories.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && newLength > 0) {
      // New repositories were added
      const addedCount = newLength - oldLength;
      if (addedCount > 0 && !isInitialLoad.value) {
        // Don't announce initial load, only subsequent loads
        setTimeout(() => {
          liveRegionMessage.value = `${addedCount} new repositories loaded. Total: ${newLength} repositories.`;
        }, 500); // Small delay to avoid conflicting announcements
      }
    }
  }
);

// Watch for error changes
watch(
  () => error.value,
  (newError) => {
    if (newError) {
      liveRegionMessage.value = `Error loading repositories: ${newError}`;
    }
  }
);

// Watch for end of data
watch(
  () => shouldShowEndMessage.value,
  (shouldShow) => {
    if (shouldShow) {
      setTimeout(() => {
        liveRegionMessage.value = `End of repositories reached. Total loaded: ${totalLoaded.value} repositories.`;
      }, 1000); // Delay to avoid conflicting with other announcements
    }
  }
);

// Expose methods for parent components if needed
defineExpose({
  loadMore: handleLoadMore,
  retry: handleRetry,
});
</script>

<style scoped>
.repository-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
}

.repository-list__title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
  text-align: center;
  line-height: 1.2;
}

.repository-list__status {
  margin-bottom: 1.5rem;
  text-align: center;
}

.repository-list__count {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

.repository-list__end-note {
  color: #059669;
  font-weight: 600;
}

.repository-list__container {
  position: relative;
}

.repository-list__items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.repository-list__item {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.repository-list__loading {
  margin-top: 2rem;
}

.repository-list__error {
  margin-top: 2rem;
}

.repository-list__end {
  margin-top: 3rem;
  padding: 2rem;
  text-align: center;
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  background-color: #f9fafb;
}

.repository-list__end-content {
  max-width: 400px;
  margin: 0 auto;
}

.repository-list__end-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.repository-list__end-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.repository-list__sentinel {
  height: 20px;
  margin-top: 2rem;
  pointer-events: none;
}

.repository-list__sentinel--active {
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.repository-list__attribution {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.repository-list__attribution-text {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

.repository-list__attribution-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.repository-list__attribution-link:hover {
  text-decoration: underline;
}

.repository-list__attribution-link:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 2px;
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
@media (max-width: 768px) {
  .repository-list {
    padding: 0.75rem;
  }

  .repository-list__title {
    font-size: 1.75rem;
  }

  .repository-list__items {
    gap: 0.75rem;
  }

  .repository-list__end {
    padding: 1.5rem;
    margin-top: 2rem;
  }
}

@media (max-width: 480px) {
  .repository-list {
    padding: 0.5rem;
  }

  .repository-list__title {
    font-size: 1.5rem;
  }

  .repository-list__end {
    padding: 1rem;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .repository-list__item {
    animation: none;
  }

  .repository-list__sentinel--active {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .repository-list__title {
    color: #000000;
  }

  .repository-list__end {
    border-color: #000000;
    background-color: #ffffff;
  }

  .repository-list__attribution-link {
    color: #0000ee;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .repository-list__title {
    color: #f9fafb;
  }

  .repository-list__count {
    color: #9ca3af;
  }

  .repository-list__end-note {
    color: #10b981;
  }

  .repository-list__end {
    border-color: #374151;
    background-color: #111827;
  }

  .repository-list__end-title {
    color: #f3f4f6;
  }

  .repository-list__end-text {
    color: #9ca3af;
  }

  .repository-list__attribution {
    border-color: #374151;
  }

  .repository-list__attribution-text {
    color: #6b7280;
  }

  .repository-list__attribution-link {
    color: #60a5fa;
  }
}

/* Focus management for accessibility */
.repository-list:focus-within .repository-list__container {
  outline: 2px solid #3b82f6;
  outline-offset: 4px;
  border-radius: 0.5rem;
}

/* Loading state styles */
.repository-list__container[aria-busy='true'] {
  position: relative;
}

.repository-list__container[aria-busy='true']::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  pointer-events: none;
  z-index: 1;
}

@media (prefers-color-scheme: dark) {
  .repository-list__container[aria-busy='true']::after {
    background: rgba(17, 24, 39, 0.8);
  }
}
</style>
