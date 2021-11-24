import { NotEmptyString } from "@fop-ts/core/Branded-common-types";
import { Context } from "libs/fdd-ts/context";
import { TgHomunculusTable } from "libs/main-db/models";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import {
  TgHomunculus,
  TgHomunculusId,
  TgHomunculusPhone,
} from "modules/main/command/projections/tg-homunculus/projection";

const TgHomunculusDM = {
  fromTable: (table: TgHomunculusTable): TgHomunculus => {
    return {
      ...table,
      id: table.id as TgHomunculusId,
      phone: table.phone as TgHomunculusPhone,
      authToken: table.authToken ? (table.authToken as NotEmptyString) : null,
    };
  },
};

export const isExistByPhone = async (
  phone: TgHomunculusPhone
): Promise<boolean> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgHomunculusTable(knex)
    .where({
      phone,
    })
    .count({ count: "*" });
  const count = res[0].count;

  return !!count && +count > 0;
};

export const isExistByMaster = async (): Promise<boolean> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgHomunculusTable(knex)
    .where({
      master: true,
    })
    .count({ count: "*" });
  const count = res[0].count;

  return !!count && +count > 0;
};

export const getByPhone = async (
  phone: TgHomunculusPhone
): Promise<TgHomunculus | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgHomunculusTable(knex)
    .where({
      phone,
    })
    .first();

  return res === undefined ? undefined : TgHomunculusDM.fromTable(res);
};

export const create = async (projection: TgHomunculus): Promise<void> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  await TgHomunculusTable(knex).insert(projection);
};

export const update = async (projection: TgHomunculus): Promise<void> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  await TgHomunculusTable(knex)
    .where({ phone: projection.phone })
    .update(projection);
};

export const TgHomunculusDS = {
  isExistByPhone,
  isExistByMaster,
  getByPhone,
  create,
  update,
};
