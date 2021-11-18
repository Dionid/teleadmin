import { UUID } from "fdd-ts/fop-utils";
import {
  BrandedPrimitive,
  NotEmptyString,
} from "functional-oriented-programming-ts/branded";
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
