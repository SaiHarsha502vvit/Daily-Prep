import { envConfig } from '../config/env.loader';

export class AppConstants {
  static readonly ENABLE_API_TEST_STEPS = envConfig.flags.logApiSteps;

  static readonly HTTP_OK = 200;
  static readonly HTTP_CREATED = 201;
  static readonly HTTP_ACCEPTED = 202;
  static readonly HTTP_NO_CONTENT = 204;
  static readonly HTTP_MOVED_PERMANENTLY = 301;
  static readonly HTTP_FOUND = 302;
  static readonly HTTP_BAD_REQUEST = 400;
  static readonly HTTP_UNAUTHORIZED = 401;
  static readonly HTTP_FORBIDDEN = 403;
  static readonly HTTP_NOT_FOUND = 404;
  static readonly HTTP_CONFLICT = 409;
  static readonly HTTP_UNPROCESSABLE = 422;
  static readonly HTTP_TOO_MANY_REQUESTS = 429;
  static readonly HTTP_INTERNAL_SERVER_ERROR = 500;
  static readonly HTTP_BAD_GATEWAY = 502;
  static readonly HTTP_SERVICE_UNAVAILABLE = 503;
  static readonly HTTP_GATEWAY_TIMEOUT = 504;

  static readonly DEFAULT_RETRIES = 2;
  static readonly DEFAULT_RETRY_DELAY_MS = 1_000;
}
