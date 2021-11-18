import { Knex } from "knex";
import { TgSourceParticipantStatusDS } from "modules/main/command/projections/tg-participant-status";
import { TgSourceId } from "modules/main/command/projections/tg-source";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgSourceParticipantWithStatus } from "modules/main/command/projections/tg-source-participant-with-status/projection";
import { TgUserId } from "modules/main/command/projections/tg-user";

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
