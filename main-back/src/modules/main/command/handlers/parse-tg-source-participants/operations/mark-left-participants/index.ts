import {
  TgSourceParticipantStatus,
  TgSourceParticipantStatusDS,
} from "modules/main/command/projections/tg-participant-status";
import { TgSource } from "modules/main/command/projections/tg-source";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgUser } from "modules/main/command/projections/tg-user";

export const markLeftParticipants = async (
  tgSourceParticipantDS: TgSourceParticipantDS,
  tgSourceParticipantStatusDS: TgSourceParticipantStatusDS,
  tgUsers: TgUser[],
  source: TgSource
) => {
  // . Get all participants not in this list & status "Joined" | "Rejoined" -> "Left"
  const deltaTgParticipants =
    await tgSourceParticipantDS.getTgSourceIdAndTgUserIdNotInWithStatusJoinedRejoined(
      source.id,
      tgUsers.map((user) => user.id)
    );
  await Promise.all(
    deltaTgParticipants.map(async (participant) => {
      const tgSourceParticipantStatus: TgSourceParticipantStatus =
        TgSourceParticipantStatus.newLeft(participant.id);
      await tgSourceParticipantStatusDS.create(tgSourceParticipantStatus);
    })
  );
};
