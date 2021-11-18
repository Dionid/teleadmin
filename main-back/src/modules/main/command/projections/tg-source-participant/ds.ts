import { Knex } from "knex";
import {
  TgSourceParticipantStatusTable,
  TgSourceParticipantStatusTableName,
  TgSourceParticipantTable,
  TgSourceParticipantTableName,
} from "libs/main-db/models";
import { TgSourceId } from "modules/main/command/projections/tg-source";
import {
  TgSourceParticipant,
  TgSourceParticipantId,
} from "modules/main/command/projections/tg-source-participant/projection";
import { TgUserId } from "modules/main/command/projections/tg-user";

export const TgSourceParticipantDM = {
  fromTableData: (tableData: TgSourceParticipantTable): TgSourceParticipant => {
    return {
      ...tableData,
      id: tableData.id as TgSourceParticipantId,
      tgUserId: tableData.tgUserId as TgUserId,
      tgSourceId: tableData.tgSourceId as TgSourceId,
    };
  },
};
export type TgSourceParticipantDS = ReturnType<typeof TgSourceParticipantDS>;

export const TgSourceParticipantDS = (knex: Knex) => {
  return {
    getTgSourceIdAndTgUserIdNotInWithStatusJoinedRejoined: async (
      tgSourceId: TgSourceId,
      tgUserIds: TgUserId[]
    ): Promise<TgSourceParticipant[]> => {
      const result = await knex<TgSourceParticipantTable>({
        a: TgSourceParticipantTableName,
      })
        .whereNotIn("tgUserId", tgUserIds)
        .andWhere("tgSourceId", tgSourceId)
        .andWhere(
          knex.raw(
            "0 < ?",
            knex<TgSourceParticipantStatusTable>({
              b: TgSourceParticipantStatusTableName,
            })
              // TODO. User const variable
              .where(knex.raw(`"a"."id" = "b"."tg_source_participant_id"`))
              .whereIn("type", ["Joined", "Rejoined"])
              .groupBy("createdAt")
              .orderBy("createdAt", "desc")
              .limit(1)
              .count()
          )
        );

      return result.map(TgSourceParticipantDM.fromTableData);
    },

    findByTgUserIdAndTgSourceId: async (
      tgUserId: TgUserId,
      tgSourceId: TgSourceId
    ): Promise<TgSourceParticipant | undefined> => {
      const res = await TgSourceParticipantTable(knex)
        .where({
          tgUserId,
          tgSourceId,
        })
        .first();

      return !res ? undefined : TgSourceParticipantDM.fromTableData(res);
    },

    create: async (
      projection: TgSourceParticipant,
      ignoreTgId: boolean = false
    ): Promise<void> => {
      if (!ignoreTgId) {
        return TgSourceParticipantTable(knex).insert(projection);
      }

      await TgSourceParticipantTable(knex)
        .insert(projection)
        .onConflict(["tgSourceId", "tgUserId"])
        .ignore();
    },
  };
};