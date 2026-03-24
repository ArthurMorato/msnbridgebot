import { describe, it, expect } from 'vitest';
import { 
  DomainError,
  LoopPreventionError,
  MessageProcessingError,
  MessageFormatError,
  InvalidPlatformError,
  PlatformUnavailableError,
  PlatformRateLimitError,
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
  ErrorMatcher
} from '../../../../src/core/domain/errors';

describe('Sistema de Erros - Pattern Matching e Tipagem', () => {
  describe('Erros Específicos', () => {
    it('deve criar LoopPreventionError com metadados', () => {
      const error = new LoopPreventionError(
        'msg-001',
        'telegram',
        { retryCount: 3 }
      );
      
      expect(error).toBeInstanceOf(DomainError);
      expect(error.code).toBe('LOOP_PREVENTION_ERROR');
      expect(error.message).toContain('Loop prevention');
      expect(error.metadata?.messageId).toBe('msg-001');
      expect(error.metadata?.platform).toBe('telegram');
      expect(error.metadata?.retryCount).toBe(3);
    });

    it('deve serializar e desserializar corretamente com toJSON', () => {
  const error = new LoopPreventionError('msg-001', 'telegram', { retryCount: 3 });
  
  const serialized = JSON.stringify(error);
  const parsed = JSON.parse(serialized);
  
  // Verifica propriedades básicas
  expect(parsed.name).toBe('LoopPreventionError');
  expect(parsed.message).toBeTypeOf('string');
  expect(parsed.message).toContain('Loop prevention');
  expect(parsed.code).toBe('LOOP_PREVENTION_ERROR');
  
  // Verifica metadados
  expect(parsed.metadata).toBeDefined();
  expect(parsed.metadata.messageId).toBe('msg-001');
  expect(parsed.metadata.platform).toBe('telegram');
  expect(parsed.metadata.retryCount).toBe(3);
  
  // Verifica que pode ser reconstruído (opcional)
  const reconstructed = new LoopPreventionError(
    parsed.metadata.messageId,
    parsed.metadata.platform,
    parsed.metadata
  );
  
  expect(reconstructed.message).toBe(error.message);
  expect(reconstructed.code).toBe(error.code);
});


    it('deve criar PlatformRateLimitError com reset time', () => {
      const resetAt = new Date('2024-01-01T12:00:00Z');
      const error = new PlatformRateLimitError(
        'telegram',
        100,
        resetAt
      );
      
      expect(error.code).toBe('PLATFORM_RATE_LIMIT_ERROR');
      expect(error.metadata?.resetAt).toBe(resetAt.toISOString());
    });

    it('deve criar ValidationError com detalhes', () => {
      const error = new ValidationError(
        'email',
        'Invalid format',
        'invalid-email'
      );
      
      expect(error.field).toBe('email');
      expect(error.violation).toBe('Invalid format');
      expect(error.value).toBe('invalid-email');
    });
  });

  describe('ErrorMatcher - Pattern Matching', () => {
    it('deve executar handler para código específico', () => {
      const matcher = new ErrorMatcher<string>()
        .on('VALIDATION_ERROR', (error: ValidationError) => `Validation failed: ${error.field}`)
        .on('LOOP_PREVENTION_ERROR', () => 'Loop detected')
        .otherwise((error: DomainError) => `Default: ${error.code}`);
      
      const validationError = new ValidationError('email', 'Invalid');
      const result = matcher.match(validationError);
      
      expect(result).toBe('Validation failed: email');
    });

    it('deve executar handler padrão quando não encontrado', () => {
      const matcher = new ErrorMatcher<string>()
        .on('PLATFORM_RATE_LIMIT_ERROR', () => 'Rate limit')
        .otherwise((error: DomainError) => `Default: ${error.code}`);
      
      const unknownError = new InvalidPlatformError('discord');
      const result = matcher.match(unknownError);
      
      expect(result).toBe('Default: INVALID_PLATFORM_ERROR');
    });

    it('deve lançar erro se nenhum handler encontrado', () => {
      const matcher = new ErrorMatcher<string>()
        .on('PLATFORM_RATE_LIMIT_ERROR', () => 'Rate limit');
      
      const unknownError = new ValidationError('email', 'Invalid');
      
      expect(() => matcher.match(unknownError)).toThrow();
    });

    it('deve suportar múltiplos códigos com onAny', () => {
      const matcher = new ErrorMatcher<string>()
        .onAny(
          ['VALIDATION_ERROR', 'REQUIRED_FIELD_ERROR'],
          () => 'Field error'
        )
        .otherwise(() => 'Other');
      
      const validationError = new ValidationError('email', 'Invalid');
      const requiredError = new RequiredFieldError('email');
      const otherError = new LoopPreventionError('msg-001', 'telegram');
      
      expect(matcher.match(validationError)).toBe('Field error');
      expect(matcher.match(requiredError)).toBe('Field error');
      expect(matcher.match(otherError)).toBe('Other');
    });
  });

  describe('Hierarquia de Erros', () => {
    it('deve manter stack trace', () => {
      const error = new ValidationError('field', 'Invalid');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });

    it('deve preservar propriedades em serialização', () => {
      const error = new LoopPreventionError('msg-001', 'telegram');
      
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);
      
      expect(typeof parsed.message).toBe('string');
      expect(parsed.message).toContain('Loop prevention');
      expect(parsed.code).toBe('LOOP_PREVENTION_ERROR');
    });
  });
});
