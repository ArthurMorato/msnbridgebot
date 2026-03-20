import { describe, it, expect } from 'vitest';
import { Media } from '../../../src/core/domain/value-objects/media';

describe('Media Value Object', () => {
  it('should create valid media object', () => {
    const mediaResult = Media.create(
      'img-123',
      'https://example.com/image.jpg',
      'image/jpeg',
      {
        width: 1920,
        height: 1080,
        size: 2048000, // 2MB
        caption: 'Beautiful landscape'
      }
    );

    expect(mediaResult.success).toBe(true);
    if (mediaResult.success) {
      const media = mediaResult.value;
      expect(media.id).toBe('img-123');
      expect(media.url).toBe('https://example.com/image.jpg');
      expect(media.type).toBe('image/jpeg');
      expect(media.metadata.width).toBe(1920);
      expect(media.getSizeInMB()).toBeCloseTo(1.95, 2); // 2MB in MB
      expect(media.getAspectRatio()).toBeCloseTo(1.78, 2); // 1920/1080
    }
  });

  it('should fail with invalid URL', () => {
    const mediaResult = Media.create(
      'img-123',
      'invalid-url',
      'image/jpeg'
    );

    expect(mediaResult.success).toBe(false);
  });

  it('should fail with negative dimensions', () => {
    const mediaResult = Media.create(
      'img-123',
      'https://example.com/image.jpg',
      'image/jpeg',
      {
        width: -100,
        height: -100
      }
    );

    expect(mediaResult.success).toBe(false);
  });

  it('should create immutable updates', () => {
    const mediaResult = Media.create(
      'img-123',
      'https://example.com/image.jpg',
      'image/jpeg',
      { width: 800, height: 600 }
    );

    expect(mediaResult.success).toBe(true);
    if (mediaResult.success) {
      const originalMedia = mediaResult.value;
      const updatedMedia = originalMedia.withCaption('New caption');
      
      expect(originalMedia.metadata.caption).toBeUndefined();
      expect(updatedMedia.metadata.caption).toBe('New caption');
      expect(originalMedia).not.toBe(updatedMedia); // Different instances
    }
  });
});
