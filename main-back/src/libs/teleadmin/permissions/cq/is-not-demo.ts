import { Knex } from "knex";
import { CommandOrQuery } from "libs/@fdd/cqrs";
import { CriticalError, PermissionDeniedError } from "libs/@fdd/errors";
import { UserTable } from "libs/main-db/models";

export const IsNotDemo =
  (knex: Knex) =>
  async <CQ extends CommandOrQuery<any, any>>(cq: CQ): Promise<CQ> => {
    if (!cq.meta.userId) {
      throw new PermissionDeniedError(`User must be authenticated`);
    }

    const demoUser = await UserTable(knex)
      .where({ id: cq.meta.userId })
      .first();

    if (!demoUser) {
      throw new CriticalError("User not found");
    }

    if (demoUser.demo) {
      throw new PermissionDeniedError(`Not permitted for demo User`);
    }

    return cq;
  };
