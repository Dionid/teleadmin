import { Knex } from "knex";
import {
  TgSourceParticipantStatusDS,
  TgSourceParticipantStatusType,
} from "modules/main/command/projections/tg-participant-status";
import { TgSourceId } from "modules/main/command/projections/tg-source";
import {
  TgSourceParticipant,
  TgSourceParticipantDS,
} from "modules/main/command/projections/tg-source-participant";
import { TgUserId } from "modules/main/command/projections/tg-user";

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

export type TgSourceParticipantWithStatusDS = ReturnType<
  typeof TgSourceParticipantWithStatusDS
>;

export const TgSourceParticipantWithStatusDS = (
  knex: Knex,
  tgSourceParticipantDS: TgSourceParticipantDS,
  tgSourceParticipantStatusDS: TgSourceParticipantStatusDS
) => {
  return {
    findByTgUserIdAndTgSourceId: async (
      tgUserId: TgUserId,
      tgSourceId: TgSourceId
    ): Promise<TgSourceParticipantWithStatus> => {
      const participant =
        await tgSourceParticipantDS.findByTgUserIdAndTgSourceId(
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
        await tgSourceParticipantStatusDS.findLatestStatusByTgSourceParticipantId(
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
    },
  };
};
