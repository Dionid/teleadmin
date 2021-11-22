import { NotEmptyString } from "@fop-ts/core/branded";
import { Context } from "libs/fdd-ts/context";
import { TgUserTable } from "libs/main-db/models";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import {
  TgUser,
  TgUserId,
  TgUserTgId,
  TgUserUsername,
} from "modules/main/command/projections/tg-user/projection";

export const findByTgId = async (
  tgId: TgUserTgId
): Promise<TgUser | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

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
};

export const update = async (projection: TgUser): Promise<TgUser> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  await TgUserTable(knex).where({ id: projection.id }).update(projection);

  return projection;
};

export const create = async (
  projection: TgUser,
  ignoreTgId: boolean = false
): Promise<TgUser> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  if (!ignoreTgId) {
    await TgUserTable(knex).insert(projection);
  } else {
    await TgUserTable(knex).insert(projection).onConflict("tgId").ignore();
  }

  return projection;
};

export const TgUserDS = {
  findByTgId,
  update,
  create,
};
