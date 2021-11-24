import {
  CommandOrQuery,
  CommandQueryHandler,
} from "@fdd-node-ts/core/cqrs/common";
import { PermissionDeniedError } from "@fdd-node-ts/core/errors";

export const isAuthenticated =
  <CQ extends CommandOrQuery<any, any, R>, R>(
    handler: CommandQueryHandler<CQ, R>
  ) =>
  async (cq: CQ): Promise<R> => {
    console.log("ISAUTHENTICATED");
    console.log(cq);

    if (!cq.meta.userId) {
      throw new PermissionDeniedError(`User must be authenticated`);
    }

    return handler(cq);
  };
