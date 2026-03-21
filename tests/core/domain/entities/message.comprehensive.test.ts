import { describe, it, expect, beforeEach } from 'vitest';
import { Message } from '../../../../src/core/domain/entities/message';
import { Platform } from '../../../../src/core/domain/value-objects/platform';
import { MessageType } from '../../../../src/core/domain/value-objects/message-type';
import { Media } from '../../../../src/core/domain/value-objects/media';
import { ValidationError, LoopPreventionError } from '../../../../src/core/domain/errors';
import { ResultFactory } from '../../../../src/shared/result';

describe('Message Entity - Regras de Negócio', () => {
  const createValidTextMessage = () => {
    return Message.create(
      'msg-001',
      'orig-001',
      Platform.TELEGRAM,
      MessageType.TEXT,
      'Hello World',
      'user-001',
      'group-001'
    );
  };

  const createValidMediaMessage = async () => {
    const mediaResult = Media.create(
      'media-001',
      'https://example.com/image.jpg',
      'image/jpeg',
      { width: 800, height: 600, size: 1024000 }
    );
    
    if (!mediaResult.success) throw mediaResult.error;
    
    return Message.create(
      'msg-002',
      'orig-002',
      Platform.WHATSAPP,
      MessageType.IMAGE,
      'Check this image',
      'user-002',
      'group-002',
      new Date(),
      mediaResult.value
    );
  };

  describe('Validação de Criação', () => {
    it('deve criar mensagem de texto válida', () => {
      const result = createValidTextMessage();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const message = result.value;
        expect(message.id).toBe('msg-001');
        expect(message.content).toBe('Hello World');
        expect(message.platform).toBe(Platform.TELEGRAM);
        expect(message.type).toBe(MessageType.TEXT);
        expect(message.processed).toBe(false);
        expect(message.errorCount).toBe(0);
      }
    });

    it('deve falhar com conteúdo vazio para mensagem de texto', () => {
      const result = Message.create(
        'msg-001',
        'orig-001',
        Platform.TELEGRAM,
        MessageType.TEXT,
        '', // Conteúdo vazio
        'user-001',
        'group-001'
      );
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it('deve falhar com mensagem de mídia sem objeto Media', () => {
      const result = Message.create(
        'msg-001',
        'orig-001',
        Platform.TELEGRAM,
        MessageType.IMAGE, // Tipo de mídia
        'Sem mídia',
        'user-001',
        'group-001'
      );
      
      expect(result.success).toBe(false);
    });

    it('deve criar mensagem de mídia válida', async () => {
      const result = await createValidMediaMessage();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const message = result.value;
        expect(message.hasMedia()).toBe(true);
        expect(message.media).toBeDefined();
        expect(message.isTextOnly()).toBe(false);
      }
    });
  });

  describe('Regras de Processamento', () => {
    it('deve marcar mensagem como processada', () => {
      const result = createValidTextMessage();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const message = result.value;
        message.markAsProcessed();
        
        expect(message.processed).toBe(true);
        expect(message.errorCount).toBe(0);
      }
    });

    it('deve incrementar contador de erros ao falhar', () => {
      const result = createValidTextMessage();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const message = result.value;
        
        // Primeira falha
        message.markAsFailed();
        expect(message.processed).toBe(false);
        expect(message.errorCount).toBe(1);
        expect(message.canRetry()).toBe(true);
        
        // Segunda falha
        message.markAsFailed();
        expect(message.errorCount).toBe(2);
      }
    });

    it('deve permitir retentativa até 5 vezes', () => {
      const result = createValidTextMessage();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const message = result.value;
        
        // 4 falhas - ainda pode retentar
        for (let i = 0; i < 4; i++) {
          message.markAsFailed();
        }
        expect(message.canRetry()).toBe(true);
        
        // 5ª falha - não pode mais retentar
        message.markAsFailed();
        expect(message.canRetry()).toBe(false);
        expect(message.shouldDiscard()).toBe(true);
      }
    });

    it('deve resetar contador de erros ao processar com sucesso', () => {
      const result = createValidTextMessage();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const message = result.value;
        
        // Simula 2 falhas
        message.markAsFailed();
        message.markAsFailed();
        expect(message.errorCount).toBe(2);
        
        // Processa com sucesso
        message.markAsProcessed();
        expect(message.errorCount).toBe(0);
        expect(message.processed).toBe(true);
      }
    });
  });

  describe('Imutabilidade e Validações', () => {
    it('deve atualizar conteúdo com validação', () => {
      const result = createValidTextMessage();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const message = result.value;
        
        // Atualização válida
        const updateResult = message.updateContent('Novo conteúdo');
        expect(updateResult.success).toBe(true);
        expect(message.content).toBe('Novo conteúdo');
        
        // Atualização inválida (vazia para mensagem de texto)
        const invalidUpdate = message.updateContent('');
        expect(invalidUpdate.success).toBe(false);
      }
    });

    it('não deve permitir adicionar mídia a mensagem de texto', () => {
      const result = createValidTextMessage();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const message = result.value;
        const mediaResult = Media.create(
          'media-001',
          'https://example.com/image.jpg',
          'image/jpeg'
        );
        
        expect(mediaResult.success).toBe(true);
        if (mediaResult.success) {
          const updateResult = message.updateMedia(mediaResult.value);
          expect(updateResult.success).toBe(false);
        }
      }
    });

    it('deve gerar hash único para idempotência', () => {
      const result1 = Message.create(
        'msg-001',
        'orig-001',
        Platform.TELEGRAM,
        MessageType.TEXT,
        'Hello',
        'user-001',
        'group-001',
        new Date('2024-01-01T10:00:00Z')
      );
      
      const result2 = Message.create(
        'msg-002',
        'orig-001', // Mesma origem
        Platform.TELEGRAM,
        MessageType.TEXT,
        'Hello',
        'user-001',
        'group-001',
        new Date('2024-01-01T10:00:00Z') // Mesmo timestamp
      );
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      if (result1.success && result2.success) {
        // Mesmos dados devem gerar hash igual (para detecção de duplicata)
        expect(result1.value.generateHash()).toBe(result2.value.generateHash());
      }
    });
  });

  describe('Helper Methods', () => {
    it('deve retornar preview do conteúdo', () => {
      const longContent = 'A'.repeat(150);
      const result = Message.create(
        'msg-001',
        'orig-001',
        Platform.TELEGRAM,
        MessageType.TEXT,
        longContent,
        'user-001',
        'group-001'
      );
      
      expect(result.success).toBe(true);
      if (result.success) {
        const preview = result.value.getContentPreview(100);
        expect(preview.length).toBe(103); // 100 + '...'
        expect(preview.endsWith('...')).toBe(true);
      }
    });

    it('deve identificar se é apenas texto', () => {
      const textResult = createValidTextMessage();
      expect(textResult.success).toBe(true);
      
      if (textResult.success) {
        expect(textResult.value.isTextOnly()).toBe(true);
      }
      
      // Mensagem de mídia não é apenas texto
      createValidMediaMessage().then(mediaResult => {
        expect(mediaResult.success).toBe(true);
        if (mediaResult.success) {
          expect(mediaResult.value.isTextOnly()).toBe(false);
        }
      });
    });
  });
});
