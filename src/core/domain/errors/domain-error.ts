export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Mantém o stack trace em ambientes que suportam
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converte o erro para um objeto serializável
   * Necessário porque JSON.stringify não serializa propriedades de Error por padrão
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      // Inclui stack apenas em ambiente de desenvolvimento/teste
      stack: process.env.NODE_ENV !== 'production' ? this.stack : undefined
    };
  }

  /**
   * Método toString personalizado
   */
  toString(): string {
    const metadataStr = this.metadata 
      ? ` | Metadata: ${JSON.stringify(this.metadata)}`
      : '';
    return `${this.name} [${this.code}]: ${this.message}${metadataStr}`;
  }
}
