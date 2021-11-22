import { CommandOrQuery, CommandQueryHandler } from "@fdd-node/core/cqrs";
import { CriticalError, PermissionDeniedError } from "@fdd-node/core/errors";
import { Context } from "libs/fdd-ts/context";
import { UserTable } from "libs/main-db/models";
import { GlobalContext } from "libs/teleadmin/contexts/global";

export const IsNotDemo = async <CQ extends CommandOrQuery<any, any>, R>(
  handler: CommandQueryHandler<CQ, R>,
  cq: CQ
): Promise<R> => {
  console.log("ISNOTDEMO");
  console.log(cq);

  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  if (!cq.meta.userId) {
    throw new PermissionDeniedError(`User must be authenticated`);
  }

  const demoUser = await UserTable(knex).where({ id: cq.meta.userId }).first();

  if (!demoUser) {
    throw new CriticalError("User not found");
  }

  if (demoUser.demo) {
    throw new PermissionDeniedError(`Not permitted for demo User`);
  }

  return handler(cq);
};
