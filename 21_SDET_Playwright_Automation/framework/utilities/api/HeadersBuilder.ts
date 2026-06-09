/**
 * Fluent builder for constructing HTTP request headers.
 *
 * @example
 * const headers = HeadersBuilder.new()
 *   .withContentType()
 *   .withBearer('tok-123')
 *   .withCustom('X-Request-ID', 'uuid-456')
 *   .build();
 */
export class HeadersBuilder {
  private headers: Record<string, string> = {};

  private constructor() {}

  /** Start a new builder chain. */
  static new(): HeadersBuilder {
    return new HeadersBuilder();
  }

  /** Set Content-Type to application/json (default). */
  withContentType(mime = 'application/json'): this {
    this.headers['Content-Type'] = mime;
    return this;
  }

  /** Set Accept to application/json. */
  withAccept(mime = 'application/json'): this {
    this.headers['Accept'] = mime;
    return this;
  }

  /** Attach an Authorization Bearer token. */
  withBearer(token: string): this {
    this.headers['Authorization'] = `Bearer ${token}`;
    return this;
  }

  /** Attach a Basic Auth header. */
  withBasicAuth(username: string, password: string): this {
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    this.headers['Authorization'] = `Basic ${encoded}`;
    return this;
  }

  /** Add an arbitrary custom header. */
  withCustom(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  /** Set the standard headers for JSON API calls. */
  withJsonDefaults(): this {
    return this.withContentType().withAccept();
  }

  /** Build and return the header record. */
  build(): Record<string, string> {
    return { ...this.headers };
  }
}
