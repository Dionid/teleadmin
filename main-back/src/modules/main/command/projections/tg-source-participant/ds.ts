import {
  TgSourceParticipantStatusTable,
  TgSourceParticipantStatusTableName,
  TgSourceParticipantTable,
  TgSourceParticipantTableName,
} from "libs/main-db/models";
import { BaseDS } from "libs/teleadmin/projections/ds";
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
export type TgSourceParticipantDS = BaseDS;

export const getTgSourceIdAndTgUserIdNotInWithStatusJoinedRejoined = async (
  ds: TgSourceParticipantDS,
  tgSourceId: TgSourceId,
  tgUserIds: TgUserId[]
): Promise<TgSourceParticipant[]> => {
  const result = await ds
    .knex<TgSourceParticipantTable>({
      a: TgSourceParticipantTableName,
    })
    .whereNotIn("tgUserId", tgUserIds)
    .andWhere("tgSourceId", tgSourceId)
    .andWhere(
      ds.knex.raw(
        "0 < ?",
        ds
          .knex<TgSourceParticipantStatusTable>({
            b: TgSourceParticipantStatusTableName,
          })
          // TODO. User const variable
          .where(ds.knex.raw(`"a"."id" = "b"."tg_source_participant_id"`))
          .whereIn("type", ["Joined", "Rejoined"])
          .groupBy("createdAt")
          .orderBy("createdAt", "desc")
          .limit(1)
          .count()
      )
    );

  return result.map(TgSourceParticipantDM.fromTableData);
};

export const findByTgUserIdAndTgSourceId = async (
  ds: TgSourceParticipantDS,
  tgUserId: TgUserId,
  tgSourceId: TgSourceId
): Promise<TgSourceParticipant | undefined> => {
  const res = await TgSourceParticipantTable(ds.knex)
    .where({
      tgUserId,
      tgSourceId,
    })
    .first();

  return !res ? undefined : TgSourceParticipantDM.fromTableData(res);
};

export const create = async (
  ds: TgSourceParticipantDS,
  projection: TgSourceParticipant,
  ignoreTgId: boolean = false
): Promise<void> => {
  if (!ignoreTgId) {
    return TgSourceParticipantTable(ds.knex).insert(projection);
  }

  await TgSourceParticipantTable(ds.knex)
    .insert(projection)
    .onConflict(["tgSourceId", "tgUserId"])
    .ignore();
};

export const TgSourceParticipantDS = {
  getTgSourceIdAndTgUserIdNotInWithStatusJoinedRejoined,
  findByTgUserIdAndTgSourceId,
  create,
};
