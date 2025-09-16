import { vi, beforeEach } from 'vitest';

// Mock console.warn to avoid noise in tests
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock Nuxt composables
vi.stubGlobal(
  'useRuntimeConfig',
  vi.fn(() => ({
    public: {
      githubToken: 'mock-token',
      githubApiBaseUrl: 'https://api.github.com',
    },
    githubToken: 'mock-token',
  }))
);

// Mock Vue lifecycle hooks to suppress warnings in tests
vi.stubGlobal('onMounted', vi.fn());
vi.stubGlobal('onUnmounted', vi.fn());

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});
