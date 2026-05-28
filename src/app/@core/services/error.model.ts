export type ErrorSeverity = 'toast' | 'inline' | 'page';

export interface AppError {
  code: string;
  httpStatus: number;
  i18nKey: string;
  params?: Record<string, string>;
  correlationId?: string;
  raw?: unknown;
}

export interface ErrorContext {
  severity?: ErrorSeverity;
  silent?: boolean;
  source?: string;
}

export const SUPPRESS_GLOBAL_ERROR_HEADER = 'X-Suppress-Global-Error';
