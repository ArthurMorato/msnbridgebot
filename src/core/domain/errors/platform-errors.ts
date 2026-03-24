import { DomainError } from "./domain-error";

export class LoopPreventionError extends DomainError {
  constructor(
    messageId: string,
    platform: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      `Loop prevention triggered for message ${messageId} on platform ${platform}`,
      'LOOP_PREVENTION_ERROR',
      { 
        ...metadata,
        messageId,
        platform 
      }
    );
  }

  /**
   * Mantém compatibilidade com serialização personalizada
   */
  toJSON(): Record<string, unknown> {
    const base = super.toJSON();
    return {
      ...base,
      // Adiciona propriedades específicas da subclasse
      messageId: this.metadata?.messageId,
      platform: this.metadata?.platform
    };
  }
}

export class MessageProcessingError extends DomainError {
  constructor(
    message: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      message,
      'MESSAGE_PROCESSING_ERROR',
      metadata
    );
  }
}

export class MessageFormatError extends DomainError {
  constructor(
    message: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      `Invalid message format: ${message}`,
      'MESSAGE_FORMAT_ERROR',
      metadata
    );
  }
}

export class InvalidPlatformError extends DomainError {
  constructor(
    platform: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      `Invalid or unsupported platform: ${platform}`,
      'INVALID_PLATFORM_ERROR',
      { 
        ...metadata,
        platform 
      }
    );
  }
}

export class PlatformUnavailableError extends DomainError {
  constructor(
    platform: string,
    reason?: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      `Platform ${platform} is currently unavailable${reason ? `: ${reason}` : ''}`,
      'PLATFORM_UNAVAILABLE_ERROR',
      { 
        ...metadata,
        platform,
        reason 
      }
    );
  }
}

export class PlatformRateLimitError extends DomainError {
  constructor(
    platform: string,
    limit?: number,
    resetAt?: Date,
    metadata?: Record<string, unknown>
  ) {
    const resetMsg = resetAt ? `, resets at: ${resetAt.toISOString()}` : '';
    const limitMsg = limit ? ` (limit: ${limit})` : '';
    
    super(
      `Rate limit exceeded for platform ${platform}${limitMsg}${resetMsg}`,
      'PLATFORM_RATE_LIMIT_ERROR',
      { 
        ...metadata,
        platform,
        limit,
        resetAt: resetAt?.toISOString()
      }
    );
  }
}
