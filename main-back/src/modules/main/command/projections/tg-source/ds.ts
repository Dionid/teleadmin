import { PublicError } from "fdd-ts/errors";
import { NotEmptyString } from "functional-oriented-programming-ts/branded";
import { TgSourceTable } from "libs/main-db/models";
import { BaseDS } from "libs/teleadmin/projections/ds";
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

export type TgSourceDS = BaseDS;

export const findAllNotDeleted = async (
  ds: TgSourceDS
): Promise<TgSource[]> => {
  const res = await TgSourceTable(ds.knex).where({ deletedAt: null }).select();

  return res.map(TgSourceDM.fromTableData);
};

export const findByName = async (
  ds: TgSourceDS,
  name: NotEmptyString
): Promise<TgSource | undefined> => {
  const res = await TgSourceTable(ds.knex).where("tgName", name).first();

  return !res ? undefined : TgSourceDM.fromTableData(res);
};

export const findByTgId = async (
  ds: TgSourceDS,
  tgId: TgSourceTgId
): Promise<TgSource | undefined> => {
  const res = await TgSourceTable(ds.knex).where("tgId", tgId).first();

  return !res ? undefined : TgSourceDM.fromTableData(res);
};

export const findByTgIdAndNotDeleted = async (
  ds: TgSourceDS,
  tgId: TgSourceTgId
): Promise<TgSource | undefined> => {
  const res = await TgSourceTable(ds.knex)
    .where({ tgId, deletedAt: null })
    .first();

  return !res ? undefined : TgSourceDM.fromTableData(res);
};

export const findByIdAndNotDeleted = async (
  ds: TgSourceDS,
  id: TgSourceId
): Promise<TgSource | undefined> => {
  const res = await TgSourceTable(ds.knex)
    .where({ id, deletedAt: null })
    .first();

  return !res ? undefined : TgSourceDM.fromTableData(res);
};

export const update = async (
  ds: TgSourceDS,
  projection: TgSource
): Promise<TgSource> => {
  await TgSourceTable(ds.knex).where({ id: projection.id }).update(projection);

  return projection;
};

export const create = async (
  ds: TgSourceDS,
  projection: TgSource
): Promise<TgSource> => {
  try {
    await TgSourceTable(ds.knex).insert(projection);

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

export const remove = async (
  ds: TgSourceDS,
  projection: TgSource
): Promise<void> => {
  const deletedSource: TgSource = {
    ...projection,
    deletedAt: new Date(),
  };
  await update(ds, deletedSource);
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
