import { DomainError } from "./domain-error";

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly field?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', { field, ...metadata });
  }
}
