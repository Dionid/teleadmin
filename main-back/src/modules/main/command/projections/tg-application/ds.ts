import { countMoreThanZero } from "fdd-ts/knex-utils";
import { NotEmptyString } from "functional-oriented-programming-ts/branded";
import { TgApplicationTable } from "libs/main-db/models";
import { BaseDS } from "libs/teleadmin/projections/ds";
import { TgApplication } from "modules/main/command/projections/tg-application/projection";

export type TgApplicationDS = BaseDS;

export const isExistByAppId = async (
  ds: TgApplicationDS,
  appId: NotEmptyString
): Promise<boolean> => {
  const res = await TgApplicationTable(ds.knex)
    .where({
      appId,
    })
    .count({ count: "*" });
  const count = res[0].count;

  return countMoreThanZero(count);
};

export const isMainAppExist = async (ds: TgApplicationDS): Promise<boolean> => {
  const res = await TgApplicationTable(ds.knex)
    .where({
      main: true,
    })
    .count({ count: "*" });
  const count = res[0].count;

  return countMoreThanZero(count);
};

// . COMMAND
export const create = async (
  ds: TgApplicationDS,
  projection: TgApplication
): Promise<TgApplication> => {
  await TgApplicationTable(ds.knex).insert(projection);

  return projection;
};

export const TgApplicationDS = {
  isExistByAppId,
  isMainAppExist,
  create,
};
