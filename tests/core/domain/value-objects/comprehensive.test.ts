import { describe, it, expect } from 'vitest';
import { Media } from '../../../../src/core/domain/value-objects/media';
import { MessageType, MessageTypeValidator } from '../../../../src/core/domain/value-objects/message-type';
import { Platform, PlatformValidator } from '../../../../src/core/domain/value-objects/platform';
import { ValidationError } from '../../../../src/core/domain/errors';

describe('Value Objects - Validações e Comportamentos', () => {
  describe('Media', () => {
    it('deve criar mídia válida', () => {
      const result = Media.create(
        'media-001',
        'https://example.com/image.jpg',
        'image/jpeg',
        {
          filename: 'photo.jpg',
          size: 1024000,
          width: 1920,
          height: 1080,
          duration: 60,
          mimeType: 'image/jpeg',
          caption: 'Beautiful landscape'
        }
      );
      
      expect(result.success).toBe(true);
      if (result.success) {
        const media = result.value;
        expect(media.id).toBe('media-001');
        expect(media.url).toBe('https://example.com/image.jpg');
        expect(media.type).toBe('image/jpeg');
        expect(media.metadata.filename).toBe('photo.jpg');
        expect(media.getSizeInMB()).toBeCloseTo(0.98, 2); // 1024000 bytes ≈ 0.98 MB
        expect(media.getAspectRatio()).toBeCloseTo(1.78, 2); // 1920/1080 ≈ 1.78
        expect(media.hasDimensions()).toBe(true);
      }
    });

    it('deve falhar com URL inválida', () => {
      const result = Media.create(
        'media-001',
        'invalid-url',
        'image/jpeg'
      );
      
      expect(result.success).toBe(false);
    });

    it('deve falhar com tamanho negativo', () => {
      const result = Media.create(
        'media-001',
        'https://example.com/image.jpg',
        'image/jpeg',
        { size: -100 }
      );
      
      expect(result.success).toBe(false);
    });

    it('deve criar cópia imutável com legenda', () => {
      const mediaResult = Media.create(
        'media-001',
        'https://example.com/image.jpg',
        'image/jpeg'
      );
      
      expect(mediaResult.success).toBe(true);
      if (mediaResult.success) {
        const original = mediaResult.value;
        const withCaption = original.withCaption('Nova legenda');
        
        expect(original.metadata.caption).toBeUndefined();
        expect(withCaption.metadata.caption).toBe('Nova legenda');
        expect(original).not.toBe(withCaption); // Instâncias diferentes
      }
    });
  });

  describe('MessageType', () => {
    it('deve validar tipos corretos', () => {
      expect(MessageTypeValidator.isValid('text')).toBe(true);
      expect(MessageTypeValidator.isValid('image')).toBe(true);
      expect(MessageTypeValidator.isValid('invalid')).toBe(false);
    });

    it('deve identificar tipos de mídia', () => {
      expect(MessageTypeValidator.isMediaType(MessageType.IMAGE)).toBe(true);
      expect(MessageTypeValidator.isMediaType(MessageType.VIDEO)).toBe(true);
      expect(MessageTypeValidator.isMediaType(MessageType.DOCUMENT)).toBe(true);
      expect(MessageTypeValidator.isMediaType(MessageType.TEXT)).toBe(false);
    });

    it('deve identificar tipo de texto', () => {
      expect(MessageTypeValidator.isTextType(MessageType.TEXT)).toBe(true);
      expect(MessageTypeValidator.isTextType(MessageType.IMAGE)).toBe(false);
    });
  });

  describe('Platform', () => {
    it('deve validar plataformas corretas', () => {
      expect(PlatformValidator.isValid('telegram')).toBe(true);
      expect(PlatformValidator.isValid('whatsapp')).toBe(true);
      expect(PlatformValidator.isValid('discord')).toBe(false);
    });

    it('deve retornar erro de validação para plataforma inválida', () => {
      const result = PlatformValidator.validate('discord');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });
});
