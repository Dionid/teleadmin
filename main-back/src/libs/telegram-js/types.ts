import { BrandedPrimitive } from "libs/@fdd/branded";
import { NotEmptyString } from "libs/@fdd/nominal/common";

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
