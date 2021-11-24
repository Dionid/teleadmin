import { countMoreThanZero } from "@fdd-node/core/knex-utils";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";
import { Context } from "libs/fdd-ts/context";
import { TgApplicationTable } from "libs/main-db/models";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { TgApplication } from "modules/main/command/projections/tg-application/projection";

export const isExistByAppId = async (
  appId: NotEmptyString
): Promise<boolean> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgApplicationTable(knex)
    .where({
      appId,
    })
    .count({ count: "*" });
  const count = res[0].count;

  return countMoreThanZero(count);
};

export const isMainAppExist = async (): Promise<boolean> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgApplicationTable(knex)
    .where({
      main: true,
    })
    .count({ count: "*" });
  const count = res[0].count;

  return countMoreThanZero(count);
};

// . COMMAND
export const create = async (
  projection: TgApplication
): Promise<TgApplication> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  await TgApplicationTable(knex).insert(projection);

  return projection;
};

export const TgApplicationDS = {
  isExistByAppId,
  isMainAppExist,
  create,
};
