import { NotEmptyString } from "functional-oriented-programming-ts/branded";
import { TgUserTable } from "libs/main-db/models";
import { BaseDS } from "libs/teleadmin/projections/ds";
import {
  TgUser,
  TgUserId,
  TgUserTgId,
  TgUserUsername,
} from "modules/main/command/projections/tg-user/projection";

export type TgUserDS = BaseDS;

export const findByTgId = async (
  ds: TgUserDS,
  tgId: TgUserTgId
): Promise<TgUser | undefined> => {
  const res = await TgUserTable(ds.knex).where("tgId", tgId).first();

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

export const update = async (
  ds: TgUserDS,
  projection: TgUser
): Promise<TgUser> => {
  await TgUserTable(ds.knex).where({ id: projection.id }).update(projection);

  return projection;
};

export const create = async (
  ds: TgUserDS,
  projection: TgUser,
  ignoreTgId: boolean = false
): Promise<TgUser> => {
  if (!ignoreTgId) {
    await TgUserTable(ds.knex).insert(projection);
  } else {
    await TgUserTable(ds.knex).insert(projection).onConflict("tgId").ignore();
  }

  return projection;
};

export const TgUserDS = {
  findByTgId,
  update,
  create,
};
