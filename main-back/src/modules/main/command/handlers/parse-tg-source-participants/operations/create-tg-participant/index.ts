import { MainModuleDS } from "modules/main/command/projections";
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
  ds: MainModuleDS,
  sourceId: TgSourceId,
  userId: TgUserId
) => {
  const tgSourceParticipant: TgSourceParticipant = {
    id: TgSourceParticipantId.create(),
    tgSourceId: sourceId,
    tgUserId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await TgSourceParticipantDS.create(ds, tgSourceParticipant, true);

  // . If was not a user -> "Joined"
  const tgSourceParticipantStatus: TgSourceParticipantStatus =
    TgSourceParticipantStatus.createJoined(tgSourceParticipant.id);
  await TgSourceParticipantStatusDS.create(ds, tgSourceParticipantStatus);
};
