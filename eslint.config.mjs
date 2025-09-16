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

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      // General code quality rules
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  }
);
