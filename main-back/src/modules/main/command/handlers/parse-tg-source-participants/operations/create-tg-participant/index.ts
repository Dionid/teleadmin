import {
  TgSourceParticipantStatus,
  TgSourceParticipantStatusDS,
} from "modules/main/command/projections/tg-participant-status";
import { TgSourceId } from "modules/main/command/projections/tg-source";
import {
  TgSourceParticipant,
  TgSourceParticipantDS,
  TgSourceParticipantId,
} from "modules/main/command/projections/tg-source-participant";
import { TgUserId } from "modules/main/command/projections/tg-user";

export const createTgParticipant = async (
  sourceId: TgSourceId,
  userId: TgUserId,
  tgSourceParticipantDS: TgSourceParticipantDS,
  tgSourceParticipantStatusDS: TgSourceParticipantStatusDS
) => {
  const tgSourceParticipant: TgSourceParticipant = {
    id: TgSourceParticipantId.new(),
    tgSourceId: sourceId,
    tgUserId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await tgSourceParticipantDS.create(tgSourceParticipant, true);

  // . If was not a user -> "Joined"
  const tgSourceParticipantStatus: TgSourceParticipantStatus =
    TgSourceParticipantStatus.newJoined(tgSourceParticipant.id);
  await tgSourceParticipantStatusDS.create(tgSourceParticipantStatus);
};
