import { PublicError } from "fdd-ts/errors";
import { NotEmptyString } from "functional-oriented-programming-ts/branded";
import { Knex } from "knex";
import { TgSourceTable } from "libs/main-db/models";
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
export type TgSourceDS = ReturnType<typeof TgSourceDS>;

export const TgSourceDS = (knex: Knex) => {
  const update = async (projection: TgSource): Promise<TgSource> => {
    await TgSourceTable(knex).where({ id: projection.id }).update(projection);

    return projection;
  };

  return {
    findAllNotDeleted: async (): Promise<TgSource[]> => {
      const res = await TgSourceTable(knex).where({ deletedAt: null }).select();

      return res.map(TgSourceDM.fromTableData);
    },
    findByName: async (name: NotEmptyString): Promise<TgSource | undefined> => {
      const res = await TgSourceTable(knex).where("tgName", name).first();

      return !res ? undefined : TgSourceDM.fromTableData(res);
    },
    findByTgId: async (tgId: TgSourceTgId): Promise<TgSource | undefined> => {
      const res = await TgSourceTable(knex).where("tgId", tgId).first();

      return !res ? undefined : TgSourceDM.fromTableData(res);
    },
    findByTgIdAndNotDeleted: async (
      tgId: TgSourceTgId
    ): Promise<TgSource | undefined> => {
      const res = await TgSourceTable(knex)
        .where({ tgId, deletedAt: null })
        .first();

      return !res ? undefined : TgSourceDM.fromTableData(res);
    },
    findByIdAndNotDeleted: async (
      id: TgSourceId
    ): Promise<TgSource | undefined> => {
      const res = await TgSourceTable(knex)
        .where({ id, deletedAt: null })
        .first();

      return !res ? undefined : TgSourceDM.fromTableData(res);
    },
    create: async (projection: TgSource): Promise<TgSource> => {
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
    },
    update,
    delete: async (projection: TgSource): Promise<void> => {
      const deletedSource: TgSource = {
        ...projection,
        deletedAt: new Date(),
      };
      await update(deletedSource);
    },
  };
};
