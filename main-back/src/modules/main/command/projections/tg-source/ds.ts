import { PublicError } from "@fdd-node/core/errors";
import { NotEmptyString } from "@fop-ts/core/branded";
import { Context } from "libs/fdd-ts/context";
import { TgSourceTable } from "libs/main-db/models";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import {
  TgSource,
  TgSourceId,
  TgSourceTgId,
  TgSourceType,
} from "modules/main/command/projections/tg-source/projection";

const TgSourceDM = {
  fromTableData: (tableData: TgSourceTable) => {
    return {
      ...tableData,
      id: tableData.id as TgSourceId,
      tgName: tableData.tgName as NotEmptyString,
      tgId: tableData.tgId as TgSourceTgId,
      type: tableData.type as TgSourceType,
    };
  },
};

export const findAllNotDeleted = async (): Promise<TgSource[]> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgSourceTable(knex).where({ deletedAt: null }).select();

  return res.map(TgSourceDM.fromTableData);
};

export const findByName = async (
  name: NotEmptyString
): Promise<TgSource | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgSourceTable(knex).where("tgName", name).first();

  return !res ? undefined : TgSourceDM.fromTableData(res);
};

export const findByTgId = async (
  tgId: TgSourceTgId
): Promise<TgSource | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgSourceTable(knex).where("tgId", tgId).first();

  return !res ? undefined : TgSourceDM.fromTableData(res);
};

export const findByTgIdAndNotDeleted = async (
  tgId: TgSourceTgId
): Promise<TgSource | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgSourceTable(knex)
    .where({ tgId, deletedAt: null })
    .first();

  return !res ? undefined : TgSourceDM.fromTableData(res);
};

export const findByIdAndNotDeleted = async (
  id: TgSourceId
): Promise<TgSource | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await TgSourceTable(knex).where({ id, deletedAt: null }).first();

  return !res ? undefined : TgSourceDM.fromTableData(res);
};

export const update = async (projection: TgSource): Promise<TgSource> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  await TgSourceTable(knex).where({ id: projection.id }).update(projection);

  return projection;
};

export const create = async (projection: TgSource): Promise<TgSource> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  try {
    await TgSourceTable(knex).insert(projection);

    return projection;
  } catch (e) {
    if (e instanceof Error) {
      if (
        e.message.includes(
          `duplicate key value violates unique constraint "tg_source_tg_id_key"`
        )
      ) {
        throw new PublicError(
          `TgSource with ${projection.tgId} already exists`
        );
      }

      throw e;
    }

    throw e;
  }
};

export const remove = async (projection: TgSource): Promise<void> => {
  const deletedSource: TgSource = {
    ...projection,
    deletedAt: new Date(),
  };
  await update(deletedSource);
};

export const TgSourceDS = {
  findAllNotDeleted,
  findByName,
  findByTgId,
  findByTgIdAndNotDeleted,
  findByIdAndNotDeleted,
  update,
  create,
  remove,
};
