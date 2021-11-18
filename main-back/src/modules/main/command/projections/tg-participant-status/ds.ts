import { TgSourceParticipantStatusTable } from "libs/main-db/models";
import { BaseDS } from "libs/teleadmin/projections/ds";
import {
  TgSourceParticipantStatus,
  TgSourceParticipantStatusId,
  TgSourceParticipantStatusType,
} from "modules/main/command/projections/tg-participant-status/projection";
import { TgSourceParticipantId } from "modules/main/command/projections/tg-source-participant";

export type TgSourceParticipantStatusDS = BaseDS;

export const findLatestStatusByTgSourceParticipantId = async (
  ds: TgSourceParticipantStatusDS,
  tgSourceParticipantId: TgSourceParticipantId
): Promise<TgSourceParticipantStatus | undefined> => {
  const res = await TgSourceParticipantStatusTable(ds.knex)
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
};

export const create = async (
  ds: TgSourceParticipantStatusDS,
  projection: TgSourceParticipantStatus
): Promise<void> => {
  return TgSourceParticipantStatusTable(ds.knex).insert(projection);
};

export const TgSourceParticipantStatusDS = {
  findLatestStatusByTgSourceParticipantId,
  create,
};
