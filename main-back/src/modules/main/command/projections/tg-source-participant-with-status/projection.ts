import { TgSourceParticipantStatusType } from "modules/main/command/projections/tg-participant-status";
import { TgSourceParticipant } from "modules/main/command/projections/tg-source-participant";

export type TgSourceParticipantWithStatusStatus =
  | TgSourceParticipantStatusType
  | "None";
export type TgSourceParticipantWithStatus =
  | {
      participant: TgSourceParticipant;
      status: TgSourceParticipantWithStatusStatus;
    }
  | {
      participant: undefined;
      status: undefined;
    };
