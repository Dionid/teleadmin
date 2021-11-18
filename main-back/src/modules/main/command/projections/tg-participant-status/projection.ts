import { UUID } from "fdd-ts/fop-utils";
import { BrandedPrimitive } from "functional-oriented-programming-ts/branded";
import { TgSourceParticipantStatusTable } from "libs/main-db/models";
import { TgSourceParticipantId } from "modules/main/command/projections/tg-source-participant";

export type TgSourceParticipantStatusId = BrandedPrimitive<
  UUID,
  { readonly TgSourceParticipantStatusId: unique symbol }
>;
export const TgSourceParticipantStatusId = {
  new: () => {
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
  new: (
    tgSourceParticipantId: TgSourceParticipantId,
    type: TgSourceParticipantStatusType
  ) => {
    return {
      id: TgSourceParticipantStatusId.new(),
      tgSourceParticipantId,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
  newJoined: (
    tgSourceParticipantId: TgSourceParticipantId
  ): TgSourceParticipantStatus => {
    return TgSourceParticipantStatus.new(tgSourceParticipantId, "Joined");
  },
  newRejoined: (
    tgSourceParticipantId: TgSourceParticipantId
  ): TgSourceParticipantStatus => {
    return TgSourceParticipantStatus.new(tgSourceParticipantId, "Rejoined");
  },
  newLeft: (
    tgSourceParticipantId: TgSourceParticipantId
  ): TgSourceParticipantStatus => {
    return TgSourceParticipantStatus.new(tgSourceParticipantId, "Left");
  },
};
