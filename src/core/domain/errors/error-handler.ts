import { DomainError } from './domain-error';

// Atualize o tipo para ser mais flexível
type ErrorHandler<T, E extends DomainError = DomainError> = (error: E) => T;

export class ErrorMatcher<T = void> {
  private handlers: Map<string, ErrorHandler<T, DomainError>> = new Map();
  private defaultHandler?: ErrorHandler<T, DomainError>;

  /**
   * Registra handler para código de erro específico
   * Agora aceita handlers com tipos específicos de DomainError
   */
  on<E extends DomainError>(code: string, handler: ErrorHandler<T, E>): this {
    this.handlers.set(code, handler as ErrorHandler<T, DomainError>);
    return this;
  }

  /**
   * Registra handler para múltiplos códigos
   */
  onAny(codes: string[], handler: ErrorHandler<T, DomainError>): this {
    codes.forEach(code => this.handlers.set(code, handler));
    return this;
  }

  /**
   * Handler padrão para erros não tratados
   */
  otherwise(handler: ErrorHandler<T, DomainError>): this {
    this.defaultHandler = handler;
    return this;
  }

  /**
   * Executa pattern matching
   */
  match(error: DomainError): T {
    const handler = this.handlers.get(error.code) || this.defaultHandler;
    
    if (!handler) {
      throw new Error(
        `No handler found for error code: ${error.code}. ` +
        `Registered handlers: ${Array.from(this.handlers.keys()).join(', ')}`
      );
    }

    return handler(error);
  }
}