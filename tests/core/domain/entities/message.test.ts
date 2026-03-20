import { describe, it, expect } from 'vitest';
import { Message } from '../../../../src/core/domain/entities/message';
import { Platform } from '../../../../src/core/domain/value-objects/platform';
import { MessageType } from '../../../../src/core/domain/value-objects/message-type';
import { Media } from '../../../../src/core/domain/value-objects/media';
import { ResultFactory } from '../../../../src/shared/result';

describe('Message Entity', () => {
  const validMessageProps = {
    id: 'msg-123',
    originId: 'orig-456',
    platform: Platform.TELEGRAM,
    type: MessageType.TEXT,
    content: 'Hello World',
    senderId: 'user-789',
    groupId: 'group-101'
  };

  it('should create a valid text message', () => {
    const messageResult = Message.create(
      validMessageProps.id,
      validMessageProps.originId,
      validMessageProps.platform,
      validMessageProps.type,
      validMessageProps.content,
      validMessageProps.senderId,
      validMessageProps.groupId
    );

    expect(messageResult.success).toBe(true);
    if (messageResult.success) {
      const message = messageResult.value;
      expect(message.id).toBe(validMessageProps.id);
      expect(message.content).toBe(validMessageProps.content);
      expect(message.processed).toBe(false);
      expect(message.errorCount).toBe(0);
    }
  });

  it('should fail with empty content for text message', () => {
    const messageResult = Message.create(
      validMessageProps.id,
      validMessageProps.originId,
      validMessageProps.platform,
      MessageType.TEXT,
      '', // Empty content
      validMessageProps.senderId,
      validMessageProps.groupId
    );

    expect(messageResult.success).toBe(false);
  });

  it('should create a message with media', () => {
    const mediaResult = Media.create(
      'media-123',
      'https://example.com/image.jpg',
      'image/jpeg',
      { width: 800, height: 600 }
    );

    expect(mediaResult.success).toBe(true);

    if (mediaResult.success) {
      const messageResult = Message.create(
        validMessageProps.id,
        validMessageProps.originId,
        validMessageProps.platform,
        MessageType.IMAGE,
        'Check this image!',
        validMessageProps.senderId,
        validMessageProps.groupId,
        new Date(),
        mediaResult.value
      );

      expect(messageResult.success).toBe(true);
      if (messageResult.success) {
        expect(messageResult.value.hasMedia()).toBe(true);
        expect(messageResult.value.media).toBeDefined();
      }
    }
  });

  it('should fail media message without media object', () => {
    const messageResult = Message.create(
      validMessageProps.id,
      validMessageProps.originId,
      validMessageProps.platform,
      MessageType.IMAGE, // Media type
      'No media provided',
      validMessageProps.senderId,
      validMessageProps.groupId
    );

    expect(messageResult.success).toBe(false);
  });

  it('should mark message as processed', () => {
    const messageResult = Message.create(
    validMessageProps.id,
    validMessageProps.originId,
    validMessageProps.platform,
    validMessageProps.type,
    validMessageProps.content,
    validMessageProps.senderId,
    validMessageProps.groupId
  );
    
    expect(messageResult.success).toBe(true);
    if (messageResult.success) {
      const message = messageResult.value;
      expect(message.processed).toBe(false);
      
      message.markAsProcessed();
      expect(message.processed).toBe(true);
      expect(message.errorCount).toBe(0);
    }
  });

  it('should handle retry logic', () => {
    const messageResult = Message.create(
    validMessageProps.id,
    validMessageProps.originId,
    validMessageProps.platform,
    validMessageProps.type,
    validMessageProps.content,
    validMessageProps.senderId,
    validMessageProps.groupId
  );
    expect(messageResult.success).toBe(true);
    if (messageResult.success) {
      const message = messageResult.value;
      
      // First failure
      message.markAsFailed();
      expect(message.processed).toBe(false);
      expect(message.errorCount).toBe(1);
      expect(message.canRetry()).toBe(true);
      
      // Multiple failures
      for (let i = 0; i < 4; i++) {
        message.markAsFailed();
      }
      
      expect(message.errorCount).toBe(5);
      expect(message.canRetry()).toBe(false);
      expect(message.shouldDiscard()).toBe(true);
    }
  });
});
