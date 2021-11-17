import { PublicError, ValidationError } from "fdd-ts/errors";
import { UUID } from "fdd-ts/fop-utils";
import {
  BrandedPrimitive,
  NotEmptyString,
} from "functional-oriented-programming-ts/branded";
import { Knex } from "knex";
import { TgSourceTable } from "libs/main-db/models";

export type TgSourceId = BrandedPrimitive<
  UUID,
  { readonly SourceId: unique symbol }
>;
export const TgSourceId = {
  new: () => {
    return UUID.new() as TgSourceId;
  },
  ofString: (value: string) => {
    return UUID.ofString(value) as TgSourceId;
  },
};

export type TgSourceTgId = BrandedPrimitive<
  number,
  { readonly TgSourceTgId: unique symbol }
>;
export const TgSourceTgId = {
  ofNumber: (value: number) => {
    return value as TgSourceTgId;
  },
};

export type TgSourceType = "Channel" | "Chat";
export const TgSourceType = {
  fromString: (value: string): TgSourceType => {
    if (value !== "Channel" && value !== "Chat") {
      throw new ValidationError(`Tg Source type must be Channel or Chat`);
    }

    return value;
  },
};

export type TgSource = TgSourceTable & {
  id: TgSourceId;
  type: TgSourceType;
  tgName: NotEmptyString | null;
  tgId: TgSourceTgId;
};

export const TgSource = {
  wasDeleted: (tgSource: TgSource) => {
    return tgSource.deletedAt !== null;
  },
};

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
