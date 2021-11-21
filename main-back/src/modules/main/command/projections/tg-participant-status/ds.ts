import { Context } from "libs/fdd-ts/context";
import { TgSourceParticipantStatusTable } from "libs/main-db/models";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import {
  TgSourceParticipantStatus,
  TgSourceParticipantStatusId,
  TgSourceParticipantStatusType,
} from "modules/main/command/projections/tg-participant-status/projection";
import { TgSourceParticipantId } from "modules/main/command/projections/tg-source-participant";

export const findLatestStatusByTgSourceParticipantId = async (
  tgSourceParticipantId: TgSourceParticipantId
): Promise<TgSourceParticipantStatus | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

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
};

export const create = async (
  projection: TgSourceParticipantStatus
): Promise<void> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  return TgSourceParticipantStatusTable(knex).insert(projection);
};

export const TgSourceParticipantStatusDS = {
  findLatestStatusByTgSourceParticipantId,
  create,
};
