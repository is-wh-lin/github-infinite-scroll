# GitHub Infinite Scroll

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
- **Nuxt UI** - Consistent design system
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

Create a `.env` file and configure GitHub Token (optional, for higher API rate limits):

```bash
# .env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_API_BASE_URL=https://api.github.com
```

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

This application uses the GitHub REST API v4 to fetch OpenAI organization repository data. Key features include:

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
