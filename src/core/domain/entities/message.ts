import { Result, ResultFactory } from '../../../shared/result';
import { ValidationError, DomainError } from '../errors';
import { Platform, PlatformValidator } from '../value-objects/platform';
import { MessageType, MessageTypeValidator } from '../value-objects/message-type';
import { Media } from '../value-objects/media';

export interface MessageProps {
  originId: string;
  platform: Platform;
  type: MessageType;
  content: string;
  senderId: string;
  groupId: string;
  timestamp: Date;
  media?: Media;
  metadata?: Record<string, unknown>;
  processed: boolean;
  errorCount: number;
}

export class MessageProcessingError extends DomainError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'MESSAGE_PROCESSING_ERROR', metadata);
  }
}

export class Message {
  private constructor(
    public readonly id: string,
    private props: MessageProps
  ) {}

  // Factory method principal
  static create(
    id: string,
    originId: string,
    platform: Platform,
    type: MessageType,
    content: string,
    senderId: string,
    groupId: string,
    timestamp: Date = new Date(),
    media?: Media,
    metadata: Record<string, unknown> = {}
  ): Result<Message> {
    const validationResult = this.validateBasicFields(
      id, originId, platform, type, content, senderId, groupId
    );
    
    if (!validationResult.success) {
      return ResultFactory.fail(validationResult.error);
    }

    // Valida consistência entre tipo e conteúdo
    const consistencyResult = this.validateTypeConsistency(type, content, media);
    if (!consistencyResult.success) {
      return ResultFactory.fail(consistencyResult.error);
    }

    const props: MessageProps = {
      originId,
      platform,
      type,
      content,
      senderId,
      groupId,
      timestamp,
      media,
      metadata,
      processed: false,
      errorCount: 0
    };

    return ResultFactory.ok(new Message(id, props));
  }

  private static validateBasicFields(
    id: string,
    originId: string,
    platform: Platform,
    type: MessageType,
    content: string,
    senderId: string,
    groupId: string
  ): Result<void> {
    // Valida ID
    if (!id || id.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('Message ID cannot be empty', 'id')
      );
    }

    // Valida Origin ID
    if (!originId || originId.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('Origin ID cannot be empty', 'originId')
      );
    }

    // Valida Platform já é enum, mas garantimos
    const platformValidation = PlatformValidator.validate(platform);
    if (!platformValidation.success) {
      return ResultFactory.fail(platformValidation.error);
    }

    // Valida MessageType
    const typeValidation = MessageTypeValidator.validate(type);
    if (!typeValidation.success) {
      return ResultFactory.fail(typeValidation.error);
    }

    // Valida Content - pode ser vazio para mensagens apenas de mídia
    if (content === null || content === undefined) {
      return ResultFactory.fail(
        new ValidationError('Content cannot be null or undefined', 'content')
      );
    }

    // Valida Sender ID
    if (!senderId || senderId.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('Sender ID cannot be empty', 'senderId')
      );
    }

    // Valida Group ID
    if (!groupId || groupId.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('Group ID cannot be empty', 'groupId')
      );
    }

    return ResultFactory.ok(void 0);
  }

  private static validateTypeConsistency(
    type: MessageType,
    content: string,
    media?: Media
  ): Result<void> {
    // Mensagens de texto devem ter conteúdo não vazio
    if (MessageTypeValidator.isTextType(type) && content.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError(
          'Text messages must have non-empty content',
          'content'
        )
      );
    }

    // Mensagens de mídia devem ter objeto Media
    if (MessageTypeValidator.isMediaType(type) && !media) {
      return ResultFactory.fail(
        new ValidationError(
          `Media messages of type ${type} must have a Media object`,
          'media'
        )
      );
    }

    return ResultFactory.ok(void 0);
  }

  // Getters
  get originId(): string {
    return this.props.originId;
  }

  get platform(): Platform {
    return this.props.platform;
  }

  get type(): MessageType {
    return this.props.type;
  }

  get content(): string {
    return this.props.content;
  }

  get senderId(): string {
    return this.props.senderId;
  }

  get groupId(): string {
    return this.props.groupId;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  get media(): Media | undefined {
    return this.props.media;
  }

  get metadata(): Record<string, unknown> {
    return { ...this.props.metadata || {} };
  }

  get processed(): boolean {
    return this.props.processed;
  }

  get errorCount(): number {
    return this.props.errorCount;
  }

  // Business methods
  markAsProcessed(): void {
    if (!this.props.processed) {
      this.props.processed = true;
      this.props.errorCount = 0;
    }
  }

  markAsFailed(): void {
    this.props.processed = false;
    this.props.errorCount += 1;
  }

  canRetry(): boolean {
    return this.props.errorCount < 5; // Máximo de 5 tentativas
  }

  shouldDiscard(): boolean {
    return this.props.errorCount >= 5;
  }

  updateContent(newContent: string): Result<void> {
    if (MessageTypeValidator.isTextType(this.props.type) && newContent.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('Text messages cannot have empty content', 'content')
      );
    }
    
    this.props.content = newContent;
    return ResultFactory.ok(void 0);
  }

  updateMedia(media: Media): Result<void> {
    if (!MessageTypeValidator.isMediaType(this.props.type)) {
      return ResultFactory.fail(
        new ValidationError(
          'Cannot add media to non-media message type',
          'type'
        )
      );
    }
    
    this.props.media = media;
    return ResultFactory.ok(void 0);
  }

  updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
  }

  // Helper methods
  hasMedia(): boolean {
    return this.props.media !== undefined;
  }

  isTextOnly(): boolean {
    return MessageTypeValidator.isTextType(this.props.type) && !this.hasMedia();
  }

  getContentPreview(maxLength: number = 100): string {
    if (this.props.content.length <= maxLength) {
      return this.props.content;
    }
    return this.props.content.substring(0, maxLength) + '...';
  }

  // Generate unique hash for idempotency
  generateHash(): string {
    const data = `${this.props.originId}-${this.props.platform}-${this.props.senderId}-${this.props.groupId}-${this.props.timestamp.getTime()}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16);
  }
}
