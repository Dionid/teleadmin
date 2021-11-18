import { createTgParticipant } from "modules/main/command/handlers/parse-tg-source-participants/operations/create-tg-participant";
import { MainModuleDS } from "modules/main/command/projections";
import {
  TgSourceParticipantStatus,
  TgSourceParticipantStatusDS,
} from "modules/main/command/projections/tg-participant-status";
import { TgSource } from "modules/main/command/projections/tg-source";
import { TgSourceParticipantWithStatus } from "modules/main/command/projections/tg-source-participant-with-status";
import { TgUser } from "modules/main/command/projections/tg-user";

export const tgUserIsParticipant = async (
  ds: MainModuleDS,
  tgSourceParticipantWithStatus: TgSourceParticipantWithStatus
) => {
  switch (tgSourceParticipantWithStatus.status) {
    case "Joined":
      break;
    case "Rejoined":
      break;
    case "Left":
      await TgSourceParticipantStatusDS.create(
        ds,
        TgSourceParticipantStatus.createRejoined(
          tgSourceParticipantWithStatus.participant.id
        )
      );
      break;
    case "None":
      await TgSourceParticipantStatusDS.create(
        ds,
        TgSourceParticipantStatus.createJoined(
          tgSourceParticipantWithStatus.participant.id
        )
      );
      break;
  }
};

export const tgUserIsNotParticipant = async (
  ds: MainModuleDS,

  tgUser: TgUser,
  source: TgSource
) => {
  await createTgParticipant(ds, source.id, tgUser.id);
};
