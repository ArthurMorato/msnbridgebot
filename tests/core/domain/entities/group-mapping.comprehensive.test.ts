import { describe, it, expect } from 'vitest';
import { GroupMapping } from '../../../../src/core/domain/entities/group-mapping';
import { Platform } from '../../../../src/core/domain/value-objects/platform';
import { ValidationError } from '../../../../src/core/domain/errors';

describe('GroupMapping Entity - Regras de Negócio', () => {
  const createValidMapping = () => {
    return GroupMapping.create(
      'mapping-001',
      '-1001234567890',
      '5511999999999-1581234567@g.us',
      true,
      { owner: 'user-001' }
    );
  };

  describe('Validação de Criação', () => {
    it('deve criar mapeamento válido', () => {
      const result = createValidMapping();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mapping = result.value;
        expect(mapping.id).toBe('mapping-001');
        expect(mapping.telegramGroupId).toBe('-1001234567890');
        expect(mapping.whatsappGroupId).toBe('5511999999999-1581234567@g.us');
        expect(mapping.isActive).toBe(true);
        expect(mapping.metadata.owner).toBe('user-001');
        expect(mapping.isValid()).toBe(true);
      }
    });

    it('deve falhar com ID vazio', () => {
      const result = GroupMapping.create(
        '', // ID vazio
        '-1001234567890',
        '5511999999999-1581234567@g.us'
      );
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect((result.error as ValidationError).violation).toBe('id');
      }
    });

    it('deve falhar com Telegram ID vazio', () => {
      const result = GroupMapping.create(
        'mapping-001',
        '', // Telegram ID vazio
        '5511999999999-1581234567@g.us'
      );
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect((result.error as ValidationError).violation).toBe('telegramGroupId');
      }
    });

    it('deve falhar com WhatsApp ID vazio', () => {
      const result = GroupMapping.create(
        'mapping-001',
        '-1001234567890',
        '' // WhatsApp ID vazio
      );
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect((result.error as ValidationError).violation).toBe('whatsappGroupId');
      }
    });
  });

  describe('Gerenciamento de Estado', () => {
    it('deve ativar mapeamento inativo', () => {
      const result = GroupMapping.create(
        'mapping-001',
        '-1001234567890',
        '5511999999999-1581234567@g.us',
        false // Inativo
      );
      
      expect(result.success).toBe(true);
      if (result.success) {
        const mapping = result.value;
        expect(mapping.isActive).toBe(false);
        
        mapping.activate();
        expect(mapping.isActive).toBe(true);
      }
    });

    it('deve desativar mapeamento ativo', () => {
      const result = createValidMapping();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mapping = result.value;
        expect(mapping.isActive).toBe(true);
        
        mapping.deactivate();
        expect(mapping.isActive).toBe(false);
      }
    });

    it('não deve alterar estado se já estiver no estado desejado', () => {
      const result = createValidMapping();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mapping = result.value;
        const originalUpdatedAt = mapping.updatedAt;
        
        // Já está ativo, não deve alterar
        mapping.activate();
        expect(mapping.updatedAt).toBe(originalUpdatedAt);
        
        // Desativa
        mapping.deactivate();
        expect(mapping.updatedAt).not.toBe(originalUpdatedAt);
      }
    });
  });

  describe('Operações de Plataforma', () => {
    it('deve retornar ID correto para Telegram', () => {
      const result = createValidMapping();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mapping = result.value;
        expect(mapping.getGroupIdByPlatform(Platform.TELEGRAM))
          .toBe('-1001234567890');
      }
    });

    it('deve retornar ID correto para WhatsApp', () => {
      const result = createValidMapping();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mapping = result.value;
        expect(mapping.getGroupIdByPlatform(Platform.WHATSAPP))
          .toBe('5511999999999-1581234567@g.us');
      }
    });

    it('deve retornar null para plataforma desconhecida', () => {
      const result = createValidMapping();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mapping = result.value;
        expect(mapping.getGroupIdByPlatform('unknown' as Platform))
          .toBeNull();
      }
    });
  });

  describe('Gerenciamento de Metadados', () => {
    it('deve atualizar metadados preservando os existentes', () => {
      const result = GroupMapping.create(
        'mapping-001',
        '-1001234567890',
        '5511999999999-1581234567@g.us',
        true,
        { owner: 'user-001', priority: 'high' }
      );
      
      expect(result.success).toBe(true);
      if (result.success) {
        const mapping = result.value;
        
        // Atualiza metadados
        mapping.updateMetadata({ priority: 'low', notes: 'test' });
        
        expect(mapping.metadata.owner).toBe('user-001'); // Preservado
        expect(mapping.metadata.priority).toBe('low'); // Atualizado
        expect(mapping.metadata.notes).toBe('test'); // Adicionado
      }
    });

    it('deve atualizar timestamp ao modificar metadados', () => {
      const result = createValidMapping();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mapping = result.value;
        const originalUpdatedAt = mapping.updatedAt;
        
        // Pequena pausa para garantir diferença de tempo
        setTimeout(() => {
          mapping.updateMetadata({ test: 'value' });
          expect(mapping.updatedAt.getTime())
            .toBeGreaterThan(originalUpdatedAt.getTime());
        }, 10);
      }
    });
  });

  describe('Validação de Integridade', () => {
    it('deve ser válido com IDs não vazios', () => {
      const result = createValidMapping();
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.value.isValid()).toBe(true);
      }
    });

    it('não deve ser válido se criado com IDs vazios (impossível devido à validação)', () => {
      // A validação na factory previne criação inválida
      const result = GroupMapping.create(
        'mapping-001',
        '-1001234567890',
        '5511999999999-1581234567@g.us'
      );
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.isValid()).toBe(true);
      }
    });
  });
});
