import { DomainError } from "./domain-error";

export class ValidationError extends DomainError {
  constructor(
    public readonly field: string,
    public readonly violation: string,
    public readonly value?: unknown
  ) {
    super(
      `Validation failed for field '${field}': ${violation}`,
      'VALIDATION_ERROR',
      { field, violation, value }
    );
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(field: string) {
    super(field, 'Field is required');
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(field: string, format: string, value?: unknown) {
    super(field, `Must match format: ${format}`, value);
  }
}
