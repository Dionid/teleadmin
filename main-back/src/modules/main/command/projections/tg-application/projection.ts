import { UUID } from "@fdd-node/core/fop-utils";
import { BrandedPrimitive } from "@fop-ts/core/Branded";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";
import { TgApplicationTable } from "libs/main-db/models";

export type TgApplicationId = BrandedPrimitive<
  UUID,
  { readonly TgApplicationId: unique symbol }
>;
export const TgApplicationId = {
  create: () => {
    return UUID.create() as TgApplicationId;
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
