<template>
  <div class="github-repositories">
    <RepositoryList @load-more="handleLoadMore" />
  </div>
</template>

<script setup lang="ts">
import { useHead } from 'nuxt/app';
import RepositoryList from '../components/Repository/RepositoryList.vue';

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

// Handle load more events from RepositoryList component
const handleLoadMore = (): void => {
  // This event is emitted when the RepositoryList component loads more data
  // We can add any page-level logic here if needed
  // For now, the RepositoryList component handles everything internally
};
</script>

<style scoped>
.github-repositories {
  min-height: 100vh;
  background-color: #f6f8fa;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .github-repositories {
    background-color: #0d1117;
  }
}
</style>
