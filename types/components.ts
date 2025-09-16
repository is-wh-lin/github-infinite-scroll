import type { Repository } from './repository';

/**
 * Props for RepositoryItem component
 */
export interface RepositoryItemProps {
  repository: Repository;
}

/**
 * Props for RepositoryList component
 */
export interface RepositoryListProps {
  initialRepositories?: Repository[];
}

/**
 * Emits for RepositoryList component
 */
export interface RepositoryListEmits {
  'load-more': [];
}

/**
 * Props for ErrorMessage component
 */
export interface ErrorMessageProps {
  message: string;
  retryable?: boolean;
  type?: 'error' | 'warning' | 'info';
}

/**
 * Emits for ErrorMessage component
 */
export interface ErrorMessageEmits {
  retry: [];
}

/**
 * Props for LoadingIndicator component
 */
export interface LoadingIndicatorProps {
  type?: 'spinner' | 'skeleton' | 'dots';
  size?: 'small' | 'medium' | 'large';
  message?: string;
}
