import { ValidationError } from "@fdd-node-ts/core/errors";
import { UUID } from "@fdd-node-ts/core/fop-utils";
import { BrandedPrimitive } from "@fop-ts/core/Branded";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";
import { TgSourceTable } from "libs/main-db/models";

export type TgSourceId = BrandedPrimitive<
  UUID,
  { readonly SourceId: unique symbol }
>;
export const TgSourceId = {
  new: () => {
    return UUID.create() as TgSourceId;
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
