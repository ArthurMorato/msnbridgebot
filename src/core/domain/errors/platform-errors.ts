import { DomainError } from "./domain-error";

export class InvalidPlatformError extends DomainError {
  constructor(
    public readonly platform: string,
    public readonly supportedPlatforms: string[] = ['telegram', 'whatsapp']
  ) {
    super(
      `Platform '${platform}' is not supported. Supported: ${supportedPlatforms.join(', ')}`,
      'INVALID_PLATFORM_ERROR',
      { platform, supportedPlatforms }
    );
  }
}

export class PlatformUnavailableError extends DomainError {
  constructor(
    public readonly platform: string,
    public readonly reason: string,
    public readonly retryAfter?: number // segundos
  ) {
    super(
      `Platform ${platform} is unavailable: ${reason}`,
      'PLATFORM_UNAVAILABLE_ERROR',
      { platform, reason, retryAfter }
    );
  }
}

export class PlatformRateLimitError extends DomainError {
  constructor(
    public readonly platform: string,
    public readonly limit: number,
    public readonly resetAt: Date
  ) {
    super(
      `Rate limit exceeded for ${platform}: ${limit} requests`,
      'PLATFORM_RATE_LIMIT_ERROR',
      { platform, limit, resetAt: resetAt.toISOString() }
    );
  }
}
