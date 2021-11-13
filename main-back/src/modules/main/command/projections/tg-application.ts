import { Knex } from "knex";
import { BrandedPrimitive } from "libs/@fdd/branded";
import { countMoreThanZero } from "libs/@fdd/knex/fns";
import { NotEmptyString, UUID } from "libs/@fdd/nominal/common";
import { TgApplicationTable } from "libs/main-db/models";

export type TgApplicationId = BrandedPrimitive<
  UUID,
  { readonly TgApplicationId: unique symbol }
>;
export const TgApplicationId = {
  new: () => {
    return UUID.new() as TgApplicationId;
  },
  ofString: (value: string) => {
    return UUID.ofString(value) as TgApplicationId;
  },
};

export type TgApplication = TgApplicationTable & {
  id: TgApplicationId;
  name: NotEmptyString;
  appId: NotEmptyString;
  appHash: NotEmptyString;
  main: boolean;
};

export type TgApplicationDS = ReturnType<typeof TgApplicationDS>;

export const TgApplicationDS = (knex: Knex) => {
  return {
    // . QUERY
    isExistByAppId: async (appId: NotEmptyString): Promise<boolean> => {
      const res = await TgApplicationTable(knex)
        .where({
          appId,
        })
        .count({ count: "*" });
      const count = res[0].count;

      return countMoreThanZero(count);
    },

    isMainAppExist: async (): Promise<boolean> => {
      const res = await TgApplicationTable(knex)
        .where({
          main: true,
        })
        .count({ count: "*" });
      const count = res[0].count;

      return countMoreThanZero(count);
    },

    // . COMMAND
    create: async (projection: TgApplication): Promise<void> => {
      await TgApplicationTable(knex).insert(projection);
    },
  };
};
