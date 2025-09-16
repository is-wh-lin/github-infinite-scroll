<template>
  <div class="github-repositories">
    <header class="page-header">
      <h1>OpenAI GitHub Repositories</h1>
      <p>Explore OpenAI's public repositories with infinite scroll</p>
    </header>

    <main class="repositories-container">
      <!-- Repository List -->
      <div v-if="repositories && repositories.length > 0" class="repositories-list">
        <RepositoryItem v-for="repository in repositories" :key="repository.id" :repository="repository" />
      </div>

      <!-- Loading State -->
      <LoadingIndicator
        v-if="loading"
        variant="skeleton"
        :skeleton-count="3"
        loading-text="Loading repositories..."
        aria-label="Loading GitHub repositories"
        screen-reader-text="Loading OpenAI repositories, please wait"
      />

      <!-- Error State -->
      <div v-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button v-if="canRetry" class="retry-button" @click="retry">Retry ({{ retryCount }}/{{ maxRetries }})</button>
      </div>

      <!-- End Message -->
      <div v-if="shouldShowEndMessage" class="end-message">
        <p>You've reached the end! Loaded {{ totalLoaded }} repositories.</p>
      </div>

      <!-- Intersection Observer Sentinel -->
      <div ref="sentinelRef" class="scroll-sentinel" aria-hidden="true" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useInfiniteScroll } from '../composables/useInfiniteScroll';
import RepositoryItem from '../components/Repository/RepositoryItem.vue';
import LoadingIndicator from '../components/UI/LoadingIndicator.vue';
import { useHead } from 'nuxt/app';

// Define component name for Vue DevTools
defineOptions({
  name: 'GitHubRepositoriesPage',
});

// Set page metadata
useHead({
  title: 'OpenAI GitHub Repositories',
  meta: [
    {
      name: 'description',
      content: "Browse OpenAI's public GitHub repositories with infinite scroll functionality",
    },
  ],
});

// Initialize infinite scroll
const {
  repositories,
  loading,
  error,
  totalLoaded,
  loadMore,
  retry,
  startObserving,
  stopObserving,
  canRetry,
  shouldShowEndMessage,
  retryCount,
  maxRetries,
} = useInfiniteScroll([], 10);

// Sentinel element for intersection observer
const sentinelRef = ref<HTMLElement | null>(null);

// Load initial data and set up observer
onMounted(async () => {
  try {
    // Load first page
    await loadMore();

    // Set up intersection observer for infinite scroll
    if (sentinelRef.value) {
      startObserving(sentinelRef.value);
    }
  } catch {
    // Error will be handled by the loadMore function
    // The error state is managed internally by useInfiniteScroll
  }
});

// Cleanup observer when component unmounts
onUnmounted(() => {
  stopObserving();
});
</script>

<style scoped>
.github-repositories {
  min-height: 100vh;
  background-color: #f6f8fa;
  padding: 2rem 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #24292f;
  margin-bottom: 0.5rem;
}

.page-header p {
  font-size: 1.125rem;
  color: #656d76;
  margin: 0;
}

.repositories-container {
  max-width: 800px;
  margin: 0 auto;
}

.repositories-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  gap: 1rem;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  margin: 1rem 0;
}

.error-message {
  color: #c53030;
  margin: 0;
  text-align: center;
  font-size: 1rem;
}

.retry-button {
  background: #0366d6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.retry-button:hover {
  background: #0256cc;
}

.retry-button:focus {
  outline: 2px solid #0366d6;
  outline-offset: 2px;
}

.end-message {
  text-align: center;
  padding: 2rem;
  color: #656d76;
  font-size: 1rem;
  background: #f6f8fa;
  border-radius: 8px;
  margin: 1rem 0;
}

.scroll-sentinel {
  height: 1px;
  width: 100%;
  margin-top: 2rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .github-repositories {
    padding: 1rem 0.5rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .page-header p {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 1.75rem;
  }

  .error-state,
  .loading-state {
    padding: 1.5rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .github-repositories {
    background-color: #0d1117;
  }

  .page-header h1 {
    color: #f0f6fc;
  }

  .page-header p {
    color: #8b949e;
  }

  .loading-state p {
    color: #8b949e;
  }

  .end-message {
    background: #161b22;
    color: #8b949e;
  }

  .error-state {
    background: #2d1b1b;
    border-color: #6f2c2c;
  }
}
</style>
