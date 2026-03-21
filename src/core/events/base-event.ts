export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;
  public readonly version: string = '1.0.0';

  protected constructor(
    public readonly eventType: string,
    public readonly aggregateId: string,
    public readonly payload: Record<string, unknown>,
    metadata?: {
      eventId?: string;
      timestamp?: Date;
      version?: string;
      correlationId?: string;
      causationId?: string;
    }
  ) {
    this.eventId = metadata?.eventId || crypto.randomUUID();
    this.timestamp = metadata?.timestamp || new Date();
    this.version = metadata?.version || this.version;
    
    // Metadata para tracing distribuído (lição de microservices)
    Object.assign(this, {
      correlationId: metadata?.correlationId,
      causationId: metadata?.causationId
    });
  }

  /**
   * Serialização para persistência em event store
   * Baseado em padrões de Event Sourcing de 2018
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      timestamp: this.timestamp.toISOString(),
      version: this.version,
      payload: this.payload,
      metadata: {
        correlationId: (this as any).correlationId,
        causationId: (this as any).causationId
      }
    };
  }

  /**
   * Factory method para reconstrução a partir de storage
   * LIÇÃO DE 2019: Sempre mantenha backward compatibility
   */
  static fromJSON(data: Record<string, unknown>): DomainEvent {
    // Implementação específica nas classes filhas
    throw new Error('Method must be implemented by subclass');
  }
}
