import { createTgParticipant } from "modules/main/command/handlers/parse-tg-source-participants/operations/create-tg-participant";
import {
  TgSourceParticipantStatus,
  TgSourceParticipantStatusDS,
} from "modules/main/command/projections/tg-participant-status";
import { TgSource } from "modules/main/command/projections/tg-source";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgSourceParticipantWithStatus } from "modules/main/command/projections/tg-source-participant-with-status";
import { TgUser } from "modules/main/command/projections/tg-user";

export const tgUserIsParticipant = async (
  tgSourceParticipantStatusDS: TgSourceParticipantStatusDS,
  tgSourceParticipantWithStatus: TgSourceParticipantWithStatus
) => {
  switch (tgSourceParticipantWithStatus.status) {
    case "Joined":
      break;
    case "Rejoined":
      break;
    case "Left":
      await tgSourceParticipantStatusDS.create(
        TgSourceParticipantStatus.newRejoined(
          tgSourceParticipantWithStatus.participant.id
        )
      );
      break;
    case "None":
      await tgSourceParticipantStatusDS.create(
        TgSourceParticipantStatus.newJoined(
          tgSourceParticipantWithStatus.participant.id
        )
      );
      break;
  }
};

export const tgUserIsNotParticipant = async (
  tgSourceParticipantDS: TgSourceParticipantDS,
  tgSourceParticipantStatusDS: TgSourceParticipantStatusDS,

  tgUser: TgUser,
  source: TgSource
) => {
  await createTgParticipant(
    source.id,
    tgUser.id,
    tgSourceParticipantDS,
    tgSourceParticipantStatusDS
  );
};
