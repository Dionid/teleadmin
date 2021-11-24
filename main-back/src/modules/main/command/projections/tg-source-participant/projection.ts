import { UUID } from "@fdd-node-ts/core/fop-utils";
import { BrandedPrimitive } from "@fop-ts/core/Branded";
import { TgSourceParticipantTable } from "libs/main-db/models";
import { TgSourceId } from "modules/main/command/projections/tg-source";
import { TgUserId } from "modules/main/command/projections/tg-user";

export type TgSourceParticipantId = BrandedPrimitive<
  UUID,
  { readonly MemberId: unique symbol }
>;
export const TgSourceParticipantId = {
  create: () => {
    return UUID.create() as TgSourceParticipantId;
  },
  ofString: (value: string) => {
    return UUID.ofString(value) as TgSourceParticipantId;
  },
};
export type TgSourceParticipant = TgSourceParticipantTable & {
  id: TgSourceParticipantId;
  tgUserId: TgUserId;
  tgSourceId: TgSourceId;
};
