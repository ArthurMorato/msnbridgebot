export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

export class ResultFactory {
  static ok<T>(value: T): Result<T, never> {
    return { success: true, value };
  }

  static fail<E extends Error>(error: E): Result<never, E> {
    return { success: false, error };
  }
}
