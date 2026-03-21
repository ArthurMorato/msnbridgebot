import { DomainError } from "./domain-error";

export class LoopPreventionError extends DomainError {
  constructor(
    public readonly messageId: string,
    public readonly platform: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      `Loop prevention triggered for message ${messageId} from ${platform}`,
      'LOOP_PREVENTION_ERROR',
      {
        messageId,
        platform,
        ...metadata
      }
    );
  }
}

export class MessageProcessingError extends DomainError {
  constructor(
    public readonly stage: 'validation' | 'mapping' | 'routing',
    public readonly originalError?: Error,
    metadata?: Record<string, unknown>
  ) {
    super(
      `Failed to process message at stage: ${stage}`,
      'MESSAGE_PROCESSING_ERROR',
      {
        stage,
        originalError: originalError?.message,
        ...metadata
      }
    );
  }
}

export class MessageFormatError extends DomainError {
  constructor(
    public readonly field: string,
    public readonly value: unknown,
    public readonly expectedType: string
  ) {
    super(
      `Invalid format for field ${field}: expected ${expectedType}, got ${typeof value}`,
      'MESSAGE_FORMAT_ERROR',
      { field, value, expectedType }
    );
  }
}
