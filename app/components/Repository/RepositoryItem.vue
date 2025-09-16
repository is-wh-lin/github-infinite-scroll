<template>
  <article class="repository-item" :aria-labelledby="`repo-title-${repository.id}`" role="article">
    <header class="repository-header">
      <h3 :id="`repo-title-${repository.id}`" class="repository-title">
        <a
          :href="repository.html_url"
          target="_blank"
          rel="noopener noreferrer"
          class="repository-link"
          :aria-describedby="repository.description ? `repo-desc-${repository.id}` : undefined"
        >
          {{ repository.name }}
          <span class="sr-only">(opens in new tab)</span>
        </a>
      </h3>
    </header>

    <div class="repository-content">
      <p v-if="repository.description" :id="`repo-desc-${repository.id}`" class="repository-description">
        {{ repository.description }}
      </p>
      <p v-else class="repository-description repository-description--empty">No description available</p>

      <div class="repository-meta">
        <span
          v-if="repository.language"
          class="repository-language"
          :aria-label="`Primary language: ${repository.language}`"
        >
          <span class="language-dot" :class="`language-${repository.language.toLowerCase()}`" />
          {{ repository.language }}
        </span>

        <span class="repository-stars" :aria-label="`${repository.stargazers_count} stars`">
          <svg class="star-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"
            />
          </svg>
          {{ formatNumber(repository.stargazers_count) }}
        </span>

        <span class="repository-forks" :aria-label="`${repository.forks_count} forks`">
          <svg class="fork-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          {{ formatNumber(repository.forks_count) }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Repository } from '../../../types/repository';

interface Props {
  repository: Repository;
}

defineProps<Props>();

/**
 * Format large numbers with appropriate suffixes (k, M, etc.)
 */
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};
</script>

<style scoped>
.repository-item {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #ffffff;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.repository-item:hover {
  border-color: #0366d6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.repository-item:focus-within {
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
}

.repository-header {
  margin-bottom: 0.75rem;
}

.repository-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.25;
}

.repository-link {
  color: #0366d6;
  text-decoration: none;
  display: inline-block;
  transition: color 0.2s ease-in-out;
}

.repository-link:hover {
  color: #0256cc;
  text-decoration: underline;
}

.repository-link:focus {
  outline: 2px solid #0366d6;
  outline-offset: 2px;
  border-radius: 3px;
}

.repository-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.repository-description {
  margin: 0;
  color: #586069;
  line-height: 1.5;
  font-size: 0.875rem;
}

.repository-description--empty {
  font-style: italic;
  color: #959da5;
}

.repository-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: #586069;
  flex-wrap: wrap;
}

.repository-language,
.repository-stars,
.repository-forks {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.language-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

/* Language colors - common GitHub language colors */
.language-javascript {
  background-color: #f1e05a;
}
.language-typescript {
  background-color: #2b7489;
}
.language-python {
  background-color: #3572a5;
}
.language-java {
  background-color: #b07219;
}
.language-html {
  background-color: #e34c26;
}
.language-css {
  background-color: #563d7c;
}
.language-vue {
  background-color: #4fc08d;
}
.language-react {
  background-color: #61dafb;
}
.language-go {
  background-color: #00add8;
}
.language-rust {
  background-color: #dea584;
}
.language-php {
  background-color: #4f5d95;
}
.language-ruby {
  background-color: #701516;
}
.language-c {
  background-color: #555555;
}
.language-cpp {
  background-color: #f34b7d;
}
.language-csharp {
  background-color: #239120;
}
.language-swift {
  background-color: #ffac45;
}
.language-kotlin {
  background-color: #f18e33;
}
.language-dart {
  background-color: #00b4ab;
}
.language-shell {
  background-color: #89e051;
}
.language-dockerfile {
  background-color: #384d54;
}

/* Default language color */
.language-dot:not([class*='language-']) {
  background-color: #586069;
}

.star-icon,
.fork-icon {
  flex-shrink: 0;
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
  .repository-item {
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .repository-title {
    font-size: 1.125rem;
  }

  .repository-meta {
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .repository-item {
    padding: 0.75rem;
  }

  .repository-title {
    font-size: 1rem;
  }

  .repository-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .repository-item {
    border-color: #000000;
  }

  .repository-link {
    color: #0000ee;
  }

  .repository-description {
    color: #000000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .repository-item {
    transition: none;
  }

  .repository-item:hover {
    transform: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .repository-item {
    background: #0d1117;
    border-color: #30363d;
    color: #c9d1d9;
  }

  .repository-item:hover {
    border-color: #58a6ff;
  }

  .repository-item:focus-within {
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3);
  }

  .repository-link {
    color: #58a6ff;
  }

  .repository-link:hover {
    color: #79c0ff;
  }

  .repository-description {
    color: #8b949e;
  }

  .repository-description--empty {
    color: #6e7681;
  }

  .repository-meta {
    color: #8b949e;
  }
}
</style>
