<template>
  <div id="app">
    <!-- Error boundary for routing errors -->
    <NuxtErrorBoundary>
      <NuxtPage />

      <template #error="{ error, clearError }">
        <div class="error-container">
          <div class="error-content">
            <h1>Something went wrong</h1>
            <p>{{ error.message || 'An unexpected error occurred' }}</p>
            <div class="error-actions">
              <button class="retry-button" @click="clearError">Try Again</button>
              <button class="home-button" @click="navigateHome">Go Home</button>
            </div>
          </div>
        </div>
      </template>
    </NuxtErrorBoundary>
  </div>
</template>
<script setup lang="ts">
// Use the GitHub Pages routing composable
const { navigateTo } = useGitHubPagesRouting();

// Handle navigation to home page
const navigateHome = (): void => {
  navigateTo('/');
};

// Set up global error handling
onErrorCaptured((_error) => {
  // Let the error boundary handle it
  return false;
});

// Set up proper head configuration for GitHub Pages
useHead({
  htmlAttrs: {
    lang: 'en',
  },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'format-detection', content: 'telephone=no' },
  ],
});
</script>

<style>
/* Global styles for error handling */
.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f6f8fa;
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-content h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #24292f;
  margin-bottom: 1rem;
}

.error-content p {
  font-size: 1.125rem;
  color: #656d76;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.retry-button,
.home-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.retry-button {
  background-color: #0969da;
  color: white;
}

.retry-button:hover {
  background-color: #0860ca;
}

.home-button {
  background-color: #2da44e;
  color: white;
}

.home-button:hover {
  background-color: #2c974b;
}

.retry-button:focus,
.home-button:focus {
  outline: 2px solid #0969da;
  outline-offset: 2px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .error-container {
    background-color: #0d1117;
  }

  .error-content h1 {
    color: #f0f6fc;
  }

  .error-content p {
    color: #8b949e;
  }
}

/* Responsive design */
@media (max-width: 480px) {
  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .retry-button,
  .home-button {
    width: 100%;
    max-width: 200px;
  }
}

/* Ensure proper layout for the app */
#app {
  min-height: 100vh;
}
</style>
