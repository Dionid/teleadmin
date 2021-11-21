import { createTgParticipant } from "modules/main/command/handlers/parse-tg-source-participants/operations/create-tg-participant";
import {
  TgSourceParticipantStatus,
  TgSourceParticipantStatusDS,
} from "modules/main/command/projections/tg-participant-status";
import { TgSource } from "modules/main/command/projections/tg-source";
import { TgSourceParticipantWithStatus } from "modules/main/command/projections/tg-source-participant-with-status";
import { TgUser } from "modules/main/command/projections/tg-user";

export const tgUserIsParticipant = async (
  tgSourceParticipantWithStatus: TgSourceParticipantWithStatus
) => {
  switch (tgSourceParticipantWithStatus.status) {
    case "Joined":
      break;
    case "Rejoined":
      break;
    case "Left":
      await TgSourceParticipantStatusDS.create(
        TgSourceParticipantStatus.createRejoined(
          tgSourceParticipantWithStatus.participant.id
        )
      );
      break;
    case "None":
      await TgSourceParticipantStatusDS.create(
        TgSourceParticipantStatus.createJoined(
          tgSourceParticipantWithStatus.participant.id
        )
      );
      break;
  }
};

export const tgUserIsNotParticipant = async (
  tgUser: TgUser,
  source: TgSource
) => {
  await createTgParticipant(source.id, tgUser.id);
};
