// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  // Custom ESLint configuration for Vue.js and TypeScript
  {
    rules: {
      // Vue.js specific rules
      'vue/multi-word-component-names': 'error',
      'vue/no-unused-vars': 'error',
      'vue/require-default-prop': 'error',
      'vue/require-prop-types': 'error',

      // General code quality rules
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // TypeScript-specific configuration
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // JavaScript-specific configuration
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      // Disable TypeScript rules for JavaScript files
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow console statements in scripts
      'no-console': 'off',
      // Allow unused vars in scripts
      'no-unused-vars': 'warn',
    },
  },
  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.test.js', '**/tests/**/*'],
    rules: {
      // More lenient rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off',
    },
  }
);
