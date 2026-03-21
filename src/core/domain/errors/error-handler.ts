import { DomainError } from './domain-error';

type ErrorHandler<T> = (error: DomainError) => T;

export class ErrorMatcher<T = void> {
  private handlers: Map<string, ErrorHandler<T>> = new Map();
  private defaultHandler?: ErrorHandler<T>;

  /**
   * Registra handler para código de erro específico
   */
  on(code: string, handler: ErrorHandler<T>): this {
    this.handlers.set(code, handler);
    return this;
  }

  /**
   * Registra handler para múltiplos códigos
   */
  onAny(codes: string[], handler: ErrorHandler<T>): this {
    codes.forEach(code => this.handlers.set(code, handler));
    return this;
  }

  /**
   * Handler padrão para erros não tratados
   */
  otherwise(handler: ErrorHandler<T>): this {
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
