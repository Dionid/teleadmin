import { UUID } from "@fdd-node-ts/core/fop-utils";
import { BrandedPrimitive } from "@fop-ts/core/Branded";
import { TgSourceParticipantStatusTable } from "libs/main-db/models";
import { TgSourceParticipantId } from "modules/main/command/projections/tg-source-participant";

export type TgSourceParticipantStatusId = BrandedPrimitive<
  UUID,
  { readonly TgSourceParticipantStatusId: unique symbol }
>;
export const TgSourceParticipantStatusId = {
  create: () => {
    return UUID.create() as TgSourceParticipantStatusId;
  },
  ofString: (value: string) => {
    return UUID.ofString(value) as TgSourceParticipantStatusId;
  },
};
export type TgSourceParticipantStatusType = "Joined" | "Left" | "Rejoined";
export type TgSourceParticipantStatus = TgSourceParticipantStatusTable & {
  id: TgSourceParticipantStatusId;
  tgSourceParticipantId: TgSourceParticipantId;
  type: TgSourceParticipantStatusType;
};
export const TgSourceParticipantStatus = {
  create: (
    tgSourceParticipantId: TgSourceParticipantId,
    type: TgSourceParticipantStatusType
  ) => {
    return {
      id: TgSourceParticipantStatusId.create(),
      tgSourceParticipantId,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
  createJoined: (
    tgSourceParticipantId: TgSourceParticipantId
  ): TgSourceParticipantStatus => {
    return TgSourceParticipantStatus.create(tgSourceParticipantId, "Joined");
  },
  createRejoined: (
    tgSourceParticipantId: TgSourceParticipantId
  ): TgSourceParticipantStatus => {
    return TgSourceParticipantStatus.create(tgSourceParticipantId, "Rejoined");
  },
  createLeft: (
    tgSourceParticipantId: TgSourceParticipantId
  ): TgSourceParticipantStatus => {
    return TgSourceParticipantStatus.create(tgSourceParticipantId, "Left");
  },
};
