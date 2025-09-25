# GitHub Infinite Scroll

[![Deploy to GitHub Pages](https://github.com/is-wh-lin/github-infinite-scroll/actions/workflows/deploy.yml/badge.svg)](https://github.com/is-wh-lin/github-infinite-scroll/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://is-wh-lin.github.io/github-infinite-scroll)
[![Build Status](https://img.shields.io/github/actions/workflow/status/is-wh-lin/github-infinite-scroll/deploy.yml?branch=main&label=Build)](https://github.com/is-wh-lin/github-infinite-scroll/actions)
[![Last Deployment](https://img.shields.io/github/last-commit/is-wh-lin/github-infinite-scroll/gh-pages?label=Last%20Deployment)](https://github.com/is-wh-lin/github-infinite-scroll/commits/gh-pages)

A modern Nuxt 4 application that displays OpenAI's GitHub repositories with infinite scroll functionality.

## Core Features

- **Infinite Scroll** - Seamless browsing experience with automatic loading of more repositories
- **GitHub API Integration** - Real-time fetching of OpenAI organization repository data
- **Responsive Design** - Support for various screen sizes and devices
- **TypeScript** - Complete type safety support
- **Error Handling** - Comprehensive error states and user feedback
- **Loading States** - Visual indicators for data loading operations
- **Rate Limit Management** - Graceful handling of GitHub API rate limits

## Technology Stack

- **Nuxt 4** - Vue.js meta-framework with SSR enabled
- **Vue 3** - Frontend framework using Composition API
- **TypeScript** - Strict type checking
- **Vitest** - Modern testing framework
- **ESLint** - Code quality assurance

## Project Structure

```
app/
├── components/     # Vue components
├── composables/    # Composition functions
├── pages/         # File-based routing
└── tests/         # Test files

types/             # TypeScript type definitions
public/            # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Configuration

#### Development Setup
For development with higher API rate limits, you can configure:

```bash
# .env (optional)
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_API_BASE_URL=https://api.github.com
```

#### Production Deployment on GitHub Pages

**Option 1: Unauthenticated Access (Default)**
- No token required
- Rate limit: 60 requests/hour
- Works for public repositories

**Option 2: Authenticated Access (Higher Rate Limits)**
For higher API rate limits (5000 requests/hour), set up a personal access token:

1. **Create Personal Access Token**:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Create new token with `public_repo` scope
   - Copy the generated token

2. **Add to Repository Secrets**:
   - Go to Repository → Settings → Secrets and variables → Actions
   - Add new secret named `PERSONAL_ACCESS_TOKEN`
   - Paste your personal access token as the value

3. **Benefits**:
   - Rate limit: 5000 requests/hour (vs 60 for unauthenticated)
   - More reliable API access
   - Better performance for heavy usage

## Development

### Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

### Code Quality

```bash
# Run ESLint checks
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# TypeScript type checking
npm run type-check
```

### Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run
```

## Build and Deployment

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Static Site Generation

```bash
npm run generate
```



## API Integration

This application uses the GitHub REST API to fetch OpenAI organization repository data. Key features include:

- Paginated repository list loading
- Rate limit monitoring
- Error handling and retry mechanisms
- Data validation and type safety

## Testing Strategy

- **Unit Tests** - Composables and utility functions
- **Component Tests** - Vue component behavior and rendering
- **Integration Tests** - API integration and data flow
- **Type Tests** - TypeScript type definition validation

## Documentation

- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
