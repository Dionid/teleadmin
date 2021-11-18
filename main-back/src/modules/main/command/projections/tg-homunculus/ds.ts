import { NotEmptyString } from "functional-oriented-programming-ts/branded";
import { TgHomunculusTable } from "libs/main-db/models";
import { BaseDS } from "libs/teleadmin/projections/ds";
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
export type TgHomunculusDS = BaseDS;

export const isExistByPhone = async (
  ds: TgHomunculusDS,
  phone: TgHomunculusPhone
): Promise<boolean> => {
  const res = await TgHomunculusTable(ds.knex)
    .where({
      phone,
    })
    .count({ count: "*" });
  const count = res[0].count;

  return !!count && +count > 0;
};

export const isExistByMaster = async (ds: TgHomunculusDS): Promise<boolean> => {
  const res = await TgHomunculusTable(ds.knex)
    .where({
      master: true,
    })
    .count({ count: "*" });
  const count = res[0].count;

  return !!count && +count > 0;
};

export const getByPhone = async (
  ds: TgHomunculusDS,
  phone: TgHomunculusPhone
): Promise<TgHomunculus | undefined> => {
  const res = await TgHomunculusTable(ds.knex)
    .where({
      phone,
    })
    .first();

  return res === undefined ? undefined : TgHomunculusDM.fromTable(res);
};

export const create = async (
  ds: TgHomunculusDS,
  projection: TgHomunculus
): Promise<void> => {
  await TgHomunculusTable(ds.knex).insert(projection);
};

export const update = async (
  ds: TgHomunculusDS,
  projection: TgHomunculus
): Promise<void> => {
  await TgHomunculusTable(ds.knex)
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
