import { Result, ResultFactory } from '../../../shared/result';
import { ValidationError } from '../errors';

export interface MediaMetadata {
  filename?: string;
  size?: number; // in bytes
  width?: number;
  height?: number;
  duration?: number; // in seconds
  mimeType?: string;
  caption?: string;
}

export class Media {
  private constructor(
    public readonly id: string,
    public readonly url: string,
    public readonly type: string,
    public readonly metadata: MediaMetadata,
    public readonly timestamp: Date
  ) {}

  // Factory method com validação
  static create(
    id: string,
    url: string,
    type: string,
    metadata: MediaMetadata = {},
    timestamp: Date = new Date()
  ): Result<Media> {
    const validationResult = this.validate(id, url, type, metadata);
    
    if (!validationResult.success) {
      return ResultFactory.fail(validationResult.error);
    }

    return ResultFactory.ok(new Media(id, url, type, metadata, timestamp));
  }

  private static validate(
    id: string,
    url: string,
    type: string,
    metadata: MediaMetadata
  ): Result<void> {
    // Valida ID
    if (!id || id.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('Media ID cannot be empty', 'id')
      );
    }

    // Valida URL
    if (!url || url.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('Media URL cannot be empty', 'url')
      );
    }

    try {
      new URL(url);
    } catch {
      return ResultFactory.fail(
        new ValidationError('Invalid URL format', 'url')
      );
    }

    // Valida type
    if (!type || type.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('Media type cannot be empty', 'type')
      );
    }

    // Valida metadata.size se existir
    if (metadata.size !== undefined && metadata.size < 0) {
      return ResultFactory.fail(
        new ValidationError('Media size cannot be negative', 'size')
      );
    }

    // Valida metadata.duration se existir
    if (metadata.duration !== undefined && metadata.duration < 0) {
      return ResultFactory.fail(
        new ValidationError('Media duration cannot be negative', 'duration')
      );
    }

    // Valida dimensões se existirem
    if (
      (metadata.width !== undefined && metadata.width < 0) ||
      (metadata.height !== undefined && metadata.height < 0)
    ) {
      return ResultFactory.fail(
        new ValidationError('Media dimensions cannot be negative', 'dimensions')
      );
    }

    return ResultFactory.ok(void 0);
  }

  // Helper methods
  getSizeInKB(): number | undefined {
    return this.metadata.size ? this.metadata.size / 1024 : undefined;
  }

  getSizeInMB(): number | undefined {
    const sizeInKB = this.getSizeInKB();
    return sizeInKB ? sizeInKB / 1024 : undefined;
  }

  hasDimensions(): boolean {
    return this.metadata.width !== undefined && this.metadata.height !== undefined;
  }

  getAspectRatio(): number | undefined {
    if (this.hasDimensions() && this.metadata.height! > 0) {
      return this.metadata.width! / this.metadata.height!;
    }
    return undefined;
  }

  // Immutable update methods
  withCaption(caption: string): Media {
    return new Media(
      this.id,
      this.url,
      this.type,
      { ...this.metadata, caption },
      this.timestamp
    );
  }

  withMetadata(metadata: Partial<MediaMetadata>): Media {
    return new Media(
      this.id,
      this.url,
      this.type,
      { ...this.metadata, ...metadata },
      this.timestamp
    );
  }
}
