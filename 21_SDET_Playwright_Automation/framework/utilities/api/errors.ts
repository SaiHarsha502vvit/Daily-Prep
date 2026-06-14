import { AppConstants } from '../../constants/app.constants';

/**
 * Base class for all API errors.
 * Carries the HTTP status, a human-readable message, the endpoint,
 * and the raw response body for debugging.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly endpoint: string;
  readonly responseBody: unknown;
  readonly timestamp: string;

  constructor(status: number, message: string, endpoint: string, responseBody: unknown) {
    super(`[${status}] ${message} — ${endpoint}`);
    this.name = 'ApiError';
    this.status = status;
    this.message = message;
    this.endpoint = endpoint;
    this.responseBody = responseBody;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/** 400 Bad Request */
export class BadRequestError extends ApiError {
  constructor(message: string, endpoint: string, responseBody: unknown) {
    super(AppConstants.HTTP_BAD_REQUEST, message, endpoint, responseBody);
    this.name = 'BadRequestError';
  }
}

/** 401 Unauthorized */
export class UnauthorizedError extends ApiError {
  constructor(message: string, endpoint: string, responseBody: unknown) {
    super(AppConstants.HTTP_UNAUTHORIZED, message, endpoint, responseBody);
    this.name = 'UnauthorizedError';
  }
}

/** 403 Forbidden */
export class ForbiddenError extends ApiError {
  constructor(message: string, endpoint: string, responseBody: unknown) {
    super(AppConstants.HTTP_FORBIDDEN, message, endpoint, responseBody);
    this.name = 'ForbiddenError';
  }
}

/** 404 Not Found */
export class NotFoundError extends ApiError {
  constructor(message: string, endpoint: string, responseBody: unknown) {
    super(AppConstants.HTTP_NOT_FOUND, message, endpoint, responseBody);
    this.name = 'NotFoundError';
  }
}

/** 409 Conflict */
export class ConflictError extends ApiError {
  constructor(message: string, endpoint: string, responseBody: unknown) {
    super(AppConstants.HTTP_CONFLICT, message, endpoint, responseBody);
    this.name = 'ConflictError';
  }
}

/** 429 Too Many Requests */
export class RateLimitError extends ApiError {
  constructor(message: string, endpoint: string, responseBody: unknown) {
    super(AppConstants.HTTP_TOO_MANY_REQUESTS, message, endpoint, responseBody);
    this.name = 'RateLimitError';
  }
}

/** 500+ Server errors */
export class ServerError extends ApiError {
  constructor(status: number, message: string, endpoint: string, responseBody: unknown) {
    super(status, message, endpoint, responseBody);
    this.name = 'ServerError';
  }
}

/** Response schema mismatch (runtime validation failure) */
export class ValidationError extends ApiError {
  readonly validationMessage: string;

  constructor(message: string, endpoint: string, responseBody: unknown, validationMessage: string) {
    super(-1, message, endpoint, responseBody);
    this.name = 'ValidationError';
    this.validationMessage = validationMessage;
  }
}

/** Network / timeout errors */
export class NetworkError extends ApiError {
  readonly originalError: Error;

  constructor(message: string, endpoint: string, originalError: Error) {
    super(-2, message, endpoint, null);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

/**
 * Factory that maps an HTTP status code to the correct typed error.
 */
export function createStatusError(
  status: number,
  message: string,
  endpoint: string,
  responseBody: unknown,
): ApiError {
  switch (status) {
    case AppConstants.HTTP_BAD_REQUEST:
      return new BadRequestError(message, endpoint, responseBody);
    case AppConstants.HTTP_UNAUTHORIZED:
      return new UnauthorizedError(message, endpoint, responseBody);
    case AppConstants.HTTP_FORBIDDEN:
      return new ForbiddenError(message, endpoint, responseBody);
    case AppConstants.HTTP_NOT_FOUND:
      return new NotFoundError(message, endpoint, responseBody);
    case AppConstants.HTTP_CONFLICT:
      return new ConflictError(message, endpoint, responseBody);
    case AppConstants.HTTP_TOO_MANY_REQUESTS:
      return new RateLimitError(message, endpoint, responseBody);
    default:
      if (status >= AppConstants.HTTP_INTERNAL_SERVER_ERROR) {
        return new ServerError(status, message, endpoint, responseBody);
      }
      return new ApiError(status, message, endpoint, responseBody);
  }
}
