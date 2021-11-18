import { Knex } from "knex";
import { TgSourceParticipantStatusTable } from "libs/main-db/models";
import {
  TgSourceParticipantStatus,
  TgSourceParticipantStatusId,
  TgSourceParticipantStatusType,
} from "modules/main/command/projections/tg-participant-status/projection";
import { TgSourceParticipantId } from "modules/main/command/projections/tg-source-participant";

export type TgSourceParticipantStatusDS = ReturnType<
  typeof TgSourceParticipantStatusDS
>;

export const TgSourceParticipantStatusDS = (knex: Knex) => {
  return {
    findLatestStatusByTgSourceParticipantId: async (
      tgSourceParticipantId: TgSourceParticipantId
    ): Promise<TgSourceParticipantStatus | undefined> => {
      const res = await TgSourceParticipantStatusTable(knex)
        .where({
          tgSourceParticipantId,
        })
        .orderBy("createdAt", "desc")
        .first();

      return !res
        ? undefined
        : {
            ...res,
            id: res.id as TgSourceParticipantStatusId,
            tgSourceParticipantId:
              res.tgSourceParticipantId as TgSourceParticipantId,
            type: res.type as TgSourceParticipantStatusType,
          };
    },

    create: async (projection: TgSourceParticipantStatus): Promise<void> => {
      return TgSourceParticipantStatusTable(knex).insert(projection);
    },
  };
};
