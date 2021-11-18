import { TgApplicationDS } from "modules/main/command/projections/tg-application";
import { TgHomunculusDS } from "modules/main/command/projections/tg-homunculus";
import { TgSourceParticipantStatusDS } from "modules/main/command/projections/tg-participant-status";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgUserDS } from "modules/main/command/projections/tg-user";

export type MainModuleDS =
  | TgApplicationDS
  | TgHomunculusDS
  | TgSourceParticipantDS
  | TgSourceParticipantStatusDS
  | TgUserDS;
