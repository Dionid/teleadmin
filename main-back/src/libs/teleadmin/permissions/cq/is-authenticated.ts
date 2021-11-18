import { CommandOrQuery } from "fdd-ts/cqrs";
import { PermissionDeniedError } from "fdd-ts/errors";

export const isAuthenticated = async <CQ extends CommandOrQuery<any, any>>(
  cq: CQ
): Promise<CQ> => {
  if (!cq.meta.userId) {
    throw new PermissionDeniedError(`User must be authenticated`);
  }

  return cq;
};
