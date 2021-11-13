import { InternalError } from "libs/@fdd/errors";

export const getEnvOrThrow =
  (log?: (e: Error) => any) =>
  (envName: string): string => {
    const value = process.env[envName];

    if (!value) {
      const err = new InternalError(`Env variable '${envName}' is required`);

      if (log) {
        log(err);
      }

      throw err;
    }

    return value;
  };
