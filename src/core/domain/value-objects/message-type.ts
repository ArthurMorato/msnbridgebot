export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT = 'contact',
  POLL = 'poll'
}

export class MessageTypeValidator {
  static isValid(type: string): type is MessageType {
    return Object.values(MessageType).includes(type as MessageType);
  }

  static validate(type: string): Result<MessageType> {
    if (this.isValid(type)) {
      return ResultFactory.ok(type);
    }
    return ResultFactory.fail(
      new ValidationError(
        `Invalid message type: ${type}. Valid types are: ${Object.values(MessageType).join(', ')}`,
        'messageType'
      )
    );
  }

  static isMediaType(type: MessageType): boolean {
    return [
      MessageType.IMAGE,
      MessageType.VIDEO,
      MessageType.DOCUMENT,
      MessageType.AUDIO,
      MessageType.STICKER
    ].includes(type);
  }

  static isTextType(type: MessageType): boolean {
    return type === MessageType.TEXT;
  }
}
