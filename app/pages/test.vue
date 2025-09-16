<template>
  <div class="test-page">
    <h1>Test Page</h1>
    <p>Testing RepositoryItem component</p>

    <div v-if="mockRepository">
      <RepositoryItem :repository="mockRepository" />
    </div>
  </div>
</template>

<script setup lang="ts">
import RepositoryItem from '../components/Repository/RepositoryItem.vue';
import type { Repository } from '../../types/repository';

// Define component name for Vue DevTools
defineOptions({
  name: 'TestPage',
});

// Mock repository data for testing
const mockRepository: Repository = {
  id: 1,
  name: 'test-repo',
  full_name: 'openai/test-repo',
  description: 'This is a test repository',
  html_url: 'https://github.com/openai/test-repo',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  stargazers_count: 1234,
  language: 'TypeScript',
  forks_count: 56,
  open_issues_count: 10,
  default_branch: 'main',
  visibility: 'public',
  archived: false,
  disabled: false,
};
</script>

<style scoped>
.test-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #24292f;
  margin-bottom: 1rem;
}

p {
  color: #656d76;
  margin-bottom: 2rem;
}
</style>
