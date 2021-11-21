import { TgSourceParticipantStatusDS } from "modules/main/command/projections/tg-participant-status";
import { TgSourceId } from "modules/main/command/projections/tg-source";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgSourceParticipantWithStatus } from "modules/main/command/projections/tg-source-participant-with-status/projection";
import { TgUserId } from "modules/main/command/projections/tg-user";

export const findByTgUserIdAndTgSourceId = async (
  tgUserId: TgUserId,
  tgSourceId: TgSourceId
): Promise<TgSourceParticipantWithStatus> => {
  const participant = await TgSourceParticipantDS.findByTgUserIdAndTgSourceId(
    tgUserId,
    tgSourceId
  );

  if (!participant) {
    return {
      participant: undefined,
      status: undefined,
    };
  }

  const status =
    await TgSourceParticipantStatusDS.findLatestStatusByTgSourceParticipantId(
      participant.id
    );

  if (!status) {
    return {
      participant,
      status: "None",
    };
  }

  return {
    participant,
    status: status.type,
  };
};

export const TgSourceParticipantWithStatusDS = {
  findByTgUserIdAndTgSourceId,
};
