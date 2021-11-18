import { UUID } from "fdd-ts/fop-utils";
import { BrandedPrimitive } from "functional-oriented-programming-ts/branded";
import { Knex } from "knex";
import { TgSourceParticipantStatusTable } from "libs/main-db/models";
import { TgSourceParticipantId } from "modules/main/command/projections/tg-source-participant";

export type TgSourceParticipantStatusId = BrandedPrimitive<
  UUID,
  { readonly TgSourceParticipantStatusId: unique symbol }
>;
export const TgSourceParticipantStatusId = {
  new: () => {
    return UUID.create() as TgSourceParticipantStatusId;
  },
  ofString: (value: string) => {
    return UUID.ofString(value) as TgSourceParticipantStatusId;
  },
};

export type TgSourceParticipantStatusType = "Joined" | "Left" | "Rejoined";
export type TgSourceParticipantStatus = TgSourceParticipantStatusTable & {
  id: TgSourceParticipantStatusId;
  tgSourceParticipantId: TgSourceParticipantId;
  type: TgSourceParticipantStatusType;
};

export const TgSourceParticipantStatus = {
  new: (
    tgSourceParticipantId: TgSourceParticipantId,
    type: TgSourceParticipantStatusType
  ) => {
    return {
      id: TgSourceParticipantStatusId.new(),
      tgSourceParticipantId,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
  newJoined: (
    tgSourceParticipantId: TgSourceParticipantId
  ): TgSourceParticipantStatus => {
    return TgSourceParticipantStatus.new(tgSourceParticipantId, "Joined");
  },
  newRejoined: (
    tgSourceParticipantId: TgSourceParticipantId
  ): TgSourceParticipantStatus => {
    return TgSourceParticipantStatus.new(tgSourceParticipantId, "Rejoined");
  },
  newLeft: (
    tgSourceParticipantId: TgSourceParticipantId
  ): TgSourceParticipantStatus => {
    return TgSourceParticipantStatus.new(tgSourceParticipantId, "Left");
  },
};

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
