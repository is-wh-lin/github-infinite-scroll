<template>
  <div class="github-repositories">
    <!-- Page Header -->
    <header class="page-header">
      <div class="container">
        <h1 class="page-title">OpenAI GitHub Repositories</h1>
        <p class="page-description">
          Explore OpenAI's public repositories with infinite scroll functionality. Data sourced from GitHub API.
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container">
        <!-- Repository List with Initial Data -->
        <RepositoryList :initial-repositories="initialRepositories" @load-more="handleLoadMore" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Repository } from '../../types';

// Define component name for Vue DevTools
defineOptions({
  name: 'IndexPage',
});

// SSR-friendly initial data fetch using useAsyncData
const { data: initialRepositories } = await useAsyncData<Repository[]>(
  'initial-repositories',
  async () => {
    try {
      // Get runtime config for API configuration
      const config = useRuntimeConfig();
      const githubToken = config.public.githubToken || config.githubToken;

      // Prepare headers with optional authentication
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'GitHub-Infinite-Scroll-App',
      };

      // Add authorization header if token is available
      if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`;
      }

      // Fetch initial 10 repositories
      const repositories = await $fetch<Repository[]>('/orgs/openai/repos', {
        baseURL: config.public.githubApiBaseUrl || 'https://api.github.com',
        headers,
        params: {
          page: 1,
          per_page: 10,
          sort: 'created',
          direction: 'desc',
          type: 'public',
        },
      });

      // Validate and return repositories
      if (!Array.isArray(repositories)) {
        throw new Error('Invalid API response format');
      }

      return repositories;
    } catch {
      // Return empty array as fallback to prevent hydration issues
      // Error will be handled by the error boundary or logged elsewhere
      return [];
    }
  },
  {
    // SSR configuration
    server: true, // Enable server-side rendering
    default: () => [], // Default value to prevent hydration mismatches
  }
);

// Set page metadata with proper SEO
useHead({
  title: 'OpenAI GitHub Repositories - Infinite Scroll',
  meta: [
    {
      name: 'description',
      content:
        "Browse OpenAI's public GitHub repositories with infinite scroll functionality. Discover open-source projects, libraries, and tools from OpenAI.",
    },
    {
      name: 'keywords',
      content: 'OpenAI, GitHub, repositories, open source, infinite scroll, Vue.js, Nuxt',
    },
    {
      property: 'og:title',
      content: 'OpenAI GitHub Repositories - Infinite Scroll',
    },
    {
      property: 'og:description',
      content: "Browse OpenAI's public GitHub repositories with infinite scroll functionality.",
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary',
    },
    {
      name: 'twitter:title',
      content: 'OpenAI GitHub Repositories',
    },
    {
      name: 'twitter:description',
      content: "Browse OpenAI's public GitHub repositories with infinite scroll.",
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://github-infinite-scroll.example.com',
    },
  ],
});

// Handle load more events from RepositoryList component
const handleLoadMore = (): void => {
  // This event is emitted when the RepositoryList component loads more data
  // We can add any page-level logic here if needed (analytics, etc.)
  // The RepositoryList component handles the actual data loading
};

// Initial loading errors are handled by the useAsyncData composable
</script>

<style scoped>
.github-repositories {
  min-height: 100vh;
  background-color: #f6f8fa;
}

.page-header {
  background-color: #ffffff;
  border-bottom: 1px solid #d1d9e0;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #24292f;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.page-description {
  font-size: 1.125rem;
  color: #656d76;
  margin: 0;
  line-height: 1.5;
}

.main-content {
  padding-bottom: 2rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem 0;
    margin-bottom: 1.5rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-description {
    font-size: 1rem;
  }

  .container {
    padding: 0 0.75rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }

  .page-description {
    font-size: 0.9rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .github-repositories {
    background-color: #0d1117;
  }

  .page-header {
    background-color: #161b22;
    border-bottom-color: #30363d;
  }

  .page-title {
    color: #f0f6fc;
  }

  .page-description {
    color: #8b949e;
  }
}

/* Prevent layout shift during hydration */
.github-repositories {
  /* Reserve space for content to prevent CLS */
  min-height: 100vh;
}

/* Smooth transitions for better UX */
.page-header,
.main-content {
  transition: opacity 0.2s ease-in-out;
}

/* Focus styles for accessibility */
.page-title:focus,
.page-description:focus {
  outline: 2px solid #0969da;
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
