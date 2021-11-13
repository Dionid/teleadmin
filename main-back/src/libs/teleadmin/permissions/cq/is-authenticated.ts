import { CommandOrQuery } from "libs/@fdd/cqrs";
import { PermissionDeniedError } from "libs/@fdd/errors";

export const isAuthenticated = async <CQ extends CommandOrQuery<any, any>>(
  cq: CQ
): Promise<CQ> => {
  if (!cq.meta.userId) {
    throw new PermissionDeniedError(`User must be authenticated`);
  }

  return cq;
};
