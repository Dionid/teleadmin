import { NotEmptyString } from "functional-oriented-programming-ts/branded";
import { Knex } from "knex";
import { TgUserTable } from "libs/main-db/models";
import {
  TgUser,
  TgUserId,
  TgUserTgId,
  TgUserUsername,
} from "modules/main/command/projections/tg-user/projection";

export type TgUserDS = ReturnType<typeof TgUserDS>;

export const TgUserDS = (knex: Knex) => {
  return {
    findByTgId: async (tgId: TgUserTgId): Promise<TgUser | undefined> => {
      const res = await TgUserTable(knex).where("tgId", tgId).first();

      return !res
        ? undefined
        : {
            ...res,
            id: res.id as TgUserId,
            tgId: res.tgId as TgUserTgId,
            tgUsername: res.tgUsername as TgUserUsername | null,
            tgPhone: res.tgPhone as NotEmptyString | null,
          };
    },

    update: async (projection: TgUser): Promise<void> => {
      await TgUserTable(knex).where({ id: projection.id }).update(projection);
    },

    create: async (
      projection: TgUser,
      ignoreTgId: boolean = false
    ): Promise<void> => {
      if (!ignoreTgId) {
        return TgUserTable(knex).insert(projection);
      }

      await TgUserTable(knex).insert(projection).onConflict("tgId").ignore();
    },
  };
};
