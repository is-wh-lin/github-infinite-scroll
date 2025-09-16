<template>
  <div class="loading-indicator" role="status" :aria-label="ariaLabel" aria-live="polite">
    <!-- Skeleton Loading Pattern -->
    <div v-if="variant === 'skeleton'" class="skeleton-container">
      <div v-for="n in skeletonCount" :key="n" class="skeleton-item">
        <div class="skeleton-avatar" />
        <div class="skeleton-content">
          <div class="skeleton-title" />
          <div class="skeleton-description" />
          <div class="skeleton-meta" />
        </div>
      </div>
    </div>

    <!-- Spinner Loading Pattern -->
    <div v-else-if="variant === 'spinner'" class="spinner-container">
      <div class="spinner" aria-hidden="true" />
      <span class="loading-text">{{ loadingText }}</span>
    </div>

    <!-- Dots Loading Pattern -->
    <div v-else class="dots-container">
      <div class="dots" aria-hidden="true">
        <div class="dot" />
        <div class="dot" />
        <div class="dot" />
      </div>
      <span class="loading-text">{{ loadingText }}</span>
    </div>

    <!-- Screen reader only text -->
    <span class="sr-only">{{ screenReaderText }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'skeleton' | 'spinner' | 'dots';
  skeletonCount?: number;
  loadingText?: string;
  ariaLabel?: string;
  screenReaderText?: string;
}

const _props = withDefaults(defineProps<Props>(), {
  variant: 'skeleton',
  skeletonCount: 3,
  loadingText: 'Loading repositories...',
  ariaLabel: 'Loading content',
  screenReaderText: 'Loading more repositories, please wait',
});
</script>

<style scoped>
.loading-indicator {
  width: 100%;
  padding: 1rem;
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

/* Skeleton Loading Styles */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
}

.skeleton-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-title {
  height: 1.25rem;
  width: 60%;
  border-radius: 0.25rem;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-description {
  height: 1rem;
  width: 80%;
  border-radius: 0.25rem;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  animation-delay: 0.1s;
}

.skeleton-meta {
  height: 0.875rem;
  width: 40%;
  border-radius: 0.25rem;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  animation-delay: 0.2s;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Spinner Loading Styles */
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Dots Loading Styles */
.dots-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: dot-bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}
.dot:nth-child(2) {
  animation-delay: -0.16s;
}
.dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes dot-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Loading text styles */
.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
}

/* Responsive design */
@media (max-width: 640px) {
  .skeleton-item {
    padding: 0.75rem;
  }

  .skeleton-avatar {
    width: 2.5rem;
    height: 2.5rem;
  }

  .loading-indicator {
    padding: 0.75rem;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .skeleton-title,
  .skeleton-description,
  .skeleton-meta,
  .skeleton-avatar {
    animation: none;
    background: #e5e7eb;
  }

  .spinner {
    animation: none;
    border-top-color: #e5e7eb;
  }

  .dot {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .skeleton-item {
    border-color: #000;
  }

  .skeleton-title,
  .skeleton-description,
  .skeleton-meta,
  .skeleton-avatar {
    background: #ccc;
  }

  .spinner {
    border-color: #000;
    border-top-color: #666;
  }
}
</style>
