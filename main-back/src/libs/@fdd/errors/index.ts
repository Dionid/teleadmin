export class CodeError extends Error {
  private code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

// . Accessibility errors
export class PublicError extends CodeError {
  internalMessage: string;

  constructor(publicMessage: string, internalMessage?: string, code?: string) {
    super(publicMessage, code);
    this.internalMessage = internalMessage || publicMessage;
  }
}
export class InternalError extends CodeError {}

// . Status errors
export class CriticalError extends InternalError {}

export class ValidationError extends PublicError {}
export class PermissionDeniedError extends PublicError {}
export class NotFoundError extends PublicError {}

export class UnauthorizedError extends PermissionDeniedError {
  constructor() {
    super("You must be authorized");
  }
}

export const throwOnUndefined = <T>(error: Error, value: T | undefined): T => {
  if (value === undefined) {
    throw error;
  }

  return value;
};

export const throwOnError =
  (fn?: (prevErr: Error) => Error) =>
  <T>(value: T): Exclude<T, Error> => {
    if (value instanceof Error) {
      throw fn ? fn(value) : value;
    }

    return value as Exclude<T, Error>;
  };

// export const throwOnError =
//   (fn?: (prevErr: Error) => Error) =>
//   <T>(value: T): Exclude<T, Error> => {
//     if (value instanceof Error) {
//       throw fn ? fn(value) : value;
//     }
//
//     return value as Exclude<T, Error>;
//   };

export const returnOnThrow = async <R>(
  callback: () => Promise<R>
): Promise<R | Error> => {
  try {
    return await callback();
  } catch (e) {
    if (!(e instanceof Error)) {
      throw e;
    }

    return e;
  }
};
