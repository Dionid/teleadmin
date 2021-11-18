import { UUID } from "fdd-ts/fop-utils";
import {
  BrandedPrimitive,
  NotEmptyString,
} from "functional-oriented-programming-ts/branded";
import { Knex } from "knex";
import { TgHomunculusTable } from "libs/main-db/models";

export type TgHomunculusId = BrandedPrimitive<
  UUID,
  { readonly TgHomunculusId: unique symbol }
>;
export const TgHomunculusId = {
  new: () => {
    return UUID.create() as TgHomunculusId;
  },
  ofString: (value: string) => {
    return UUID.ofString(value) as TgHomunculusId;
  },
};

export type TgHomunculusPhone = BrandedPrimitive<
  NotEmptyString,
  { readonly HomunculusPhone: unique symbol }
>;
export const TgHomunculusPhone = {
  ofString: (value: string) => {
    return NotEmptyString.ofString(value) as TgHomunculusPhone;
  },
};

export type TgHomunculus = TgHomunculusTable & {
  id: TgHomunculusId;
  phone: TgHomunculusPhone;
  master: boolean;
  authToken: NotEmptyString | null;
};

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

export type TgHomunculusDS = ReturnType<typeof TgHomunculusDS>;

export const TgHomunculusDS = (deps: { knex: Knex }) => {
  const { knex } = deps;

  return {
    isExistByPhone: async (phone: TgHomunculusPhone): Promise<boolean> => {
      const res = await TgHomunculusTable(knex)
        .where({
          phone,
        })
        .count({ count: "*" });
      const count = res[0].count;

      return !!count && +count > 0;
    },

    isExistByMaster: async (): Promise<boolean> => {
      const res = await TgHomunculusTable(knex)
        .where({
          master: true,
        })
        .count({ count: "*" });
      const count = res[0].count;

      return !!count && +count > 0;
    },

    getByPhone: async (
      phone: TgHomunculusPhone
    ): Promise<TgHomunculus | undefined> => {
      const res = await TgHomunculusTable(knex)
        .where({
          phone,
        })
        .first();

      return res === undefined ? undefined : TgHomunculusDM.fromTable(res);
    },

    create: async (projection: TgHomunculus): Promise<void> => {
      await TgHomunculusTable(knex).insert(projection);
    },

    update: async (projection: TgHomunculus): Promise<void> => {
      await TgHomunculusTable(knex)
        .where({ phone: projection.phone })
        .update(projection);
    },
  };
};
