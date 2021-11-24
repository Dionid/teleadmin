import { BrandedPrimitive } from "@fop-ts/core/Branded";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";

export type TgSourceInviteLinkHash = BrandedPrimitive<
  NotEmptyString,
  { readonly TgSourceInviteLinkHash: unique symbol }
>;
export const TgSourceInviteLinkHash = {
  ofString: (value: string): TgSourceInviteLinkHash => {
    const splitted = value.split("/");

    return splitted[splitted.length - 1] as TgSourceInviteLinkHash;
  },
};
