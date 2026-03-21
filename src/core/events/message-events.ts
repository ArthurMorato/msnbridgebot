import { DomainEvent } from './base-event';

/**
 * LIÇÃO DE 2017: Eventos muito granulares causam overhead
 * LIÇÃO DE 2021: Eventos muito agregados perdem contexto
 * BALANCE: Um evento por etapa significativa do ciclo de vida
 */

export class MessageReceivedEvent extends DomainEvent {
  constructor(
    public readonly messageId: string,
    public readonly platform: string,
    public readonly senderId: string,
    public readonly content: string,
    public readonly metadata: {
      chatId?: string;
      isGroup?: boolean;
      hasMedia?: boolean;
      mediaType?: string;
    } = {},
    eventMetadata?: {
      eventId?: string;
      timestamp?: Date;
      correlationId?: string;
    }
  ) {
    super(
      'MESSAGE_RECEIVED',
      messageId,
      {
        messageId,
        platform,
        senderId,
        content,
        metadata
      },
      eventMetadata
    );
  }

  static fromJSON(data: Record<string, unknown>): MessageReceivedEvent {
    const payload = data.payload as Record<string, unknown>;
    return new MessageReceivedEvent(
      payload.messageId as string,
      payload.platform as string,
      payload.senderId as string,
      payload.content as string,
      payload.metadata as any,
      {
        eventId: data.eventId as string,
        timestamp: new Date(data.timestamp as string),
        correlationId: (data.metadata as any)?.correlationId
      }
    );
  }
}

export class MessageProcessedEvent extends DomainEvent {
  constructor(
    public readonly messageId: string,
    public readonly processingResult: 'success' | 'failed' | 'duplicate',
    public readonly destinationPlatforms: string[],
    public readonly processingTimeMs: number,
    public readonly error?: {
      code: string;
      message: string;
    },
    eventMetadata?: {
      eventId?: string;
      timestamp?: Date;
      correlationId?: string;
      causationId?: string;
    }
  ) {
    super(
      'MESSAGE_PROCESSED',
      messageId,
      {
        messageId,
        processingResult,
        destinationPlatforms,
        processingTimeMs,
        error
      },
      eventMetadata
    );
  }

  static fromJSON(data: Record<string, unknown>): MessageProcessedEvent {
    const payload = data.payload as Record<string, unknown>;
    return new MessageProcessedEvent(
      payload.messageId as string,
      payload.processingResult as any,
      payload.destinationPlatforms as string[],
      payload.processingTimeMs as number,
      payload.error as any,
      {
        eventId: data.eventId as string,
        timestamp: new Date(data.timestamp as string),
        correlationId: (data.metadata as any)?.correlationId,
        causationId: (data.metadata as any)?.causationId
      }
    );
  }
}

export class MessageForwardedEvent extends DomainEvent {
  constructor(
    public readonly originalMessageId: string,
    public readonly targetPlatform: string,
    public readonly targetMessageId: string,
    public readonly forwardingResult: 'success' | 'failed' | 'partial',
    public readonly details: {
      mediaTransferred?: boolean;
      contentTransformed?: boolean;
      retryAttempt?: number;
    } = {},
    eventMetadata?: {
      eventId?: string;
      timestamp?: Date;
      correlationId?: string;
      causationId?: string;
    }
  ) {
    super(
      'MESSAGE_FORWARDED',
      originalMessageId,
      {
        originalMessageId,
        targetPlatform,
        targetMessageId,
        forwardingResult,
        details
      },
      eventMetadata
    );
  }

  static fromJSON(data: Record<string, unknown>): MessageForwardedEvent {
    const payload = data.payload as Record<string, unknown>;
    return new MessageForwardedEvent(
      payload.originalMessageId as string,
      payload.targetPlatform as string,
      payload.targetMessageId as string,
      payload.forwardingResult as any,
      payload.details as any,
      {
        eventId: data.eventId as string,
        timestamp: new Date(data.timestamp as string),
        correlationId: (data.metadata as any)?.correlationId,
        causationId: (data.metadata as any)?.causationId
      }
    );
  }
}
