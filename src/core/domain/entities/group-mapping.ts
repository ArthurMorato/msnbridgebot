import { Result, ResultFactory } from '../../../shared/result';
import { ValidationError } from '../errors';
import { Platform, PlatformValidator } from '../value-objects/platform';

export interface GroupMappingProps {
  telegramGroupId: string;
  whatsappGroupId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export class GroupMapping {
  private constructor(
    public readonly id: string,
    private props: GroupMappingProps
  ) {}

  // Factory method
  static create(
    id: string,
    telegramGroupId: string,
    whatsappGroupId: string,
    isActive: boolean = true,
    metadata: Record<string, unknown> = {}
  ): Result<GroupMapping> {
    const validationResult = this.validate(id, telegramGroupId, whatsappGroupId);
    
    if (!validationResult.success) {
      return ResultFactory.fail(validationResult.error);
    }

    const now = new Date();
    const props: GroupMappingProps = {
      telegramGroupId,
      whatsappGroupId,
      isActive,
      createdAt: now,
      updatedAt: now,
      metadata
    };

    return ResultFactory.ok(new GroupMapping(id, props));
  }

  private static validate(
    id: string,
    telegramGroupId: string,
    whatsappGroupId: string
  ): Result<void> {
    // Valida ID
    if (!id || id.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('GroupMapping ID cannot be empty', 'id')
      );
    }

    // Valida Telegram Group ID
    if (!telegramGroupId || telegramGroupId.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('Telegram Group ID cannot be empty', 'telegramGroupId')
      );
    }

    // Valida WhatsApp Group ID
    if (!whatsappGroupId || whatsappGroupId.trim().length === 0) {
      return ResultFactory.fail(
        new ValidationError('WhatsApp Group ID cannot be empty', 'whatsappGroupId')
      );
    }

    return ResultFactory.ok(void 0);
  }

  // Getters
  get telegramGroupId(): string {
    return this.props.telegramGroupId;
  }

  get whatsappGroupId(): string {
    return this.props.whatsappGroupId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get metadata(): Record<string, unknown> {
    return { ...this.props.metadata || {} };
  }

  // Business methods
  activate(): void {
    if (!this.props.isActive) {
      this.props.isActive = true;
      this.props.updatedAt = new Date();
    }
  }

  deactivate(): void {
    if (this.props.isActive) {
      this.props.isActive = false;
      this.props.updatedAt = new Date();
    }
  }

  getGroupIdByPlatform(platform: Platform): string | null {
    switch (platform) {
      case Platform.TELEGRAM:
        return this.telegramGroupId;
      case Platform.WHATSAPP:
        return this.whatsappGroupId;
      default:
        return null;
    }
  }

  updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.props.updatedAt = new Date();
  }

  // Validation
  isValid(): boolean {
    return this.props.telegramGroupId.length > 0 && 
           this.props.whatsappGroupId.length > 0;
  }
}
