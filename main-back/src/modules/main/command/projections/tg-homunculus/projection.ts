import { UUID } from "@fdd-node/core/fop-utils";
import { BrandedPrimitive, NotEmptyString } from "@fop-ts/core/branded";
import { TgHomunculusTable } from "libs/main-db/models";

export type TgHomunculusId = BrandedPrimitive<
  UUID,
  { readonly TgHomunculusId: unique symbol }
>;
export const TgHomunculusId = {
  create: () => {
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
