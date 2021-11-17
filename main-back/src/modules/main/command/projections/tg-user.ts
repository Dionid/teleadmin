import { Knex } from "knex";
import { BrandedPrimitive } from "libs/@fdd/branded";
import { NotEmptyString, UUID } from "libs/@fdd/branded/common";
import { TgUserTable } from "libs/main-db/models";
import { Api } from "telegram";

import UserProfilePhoto = Api.UserProfilePhoto;

export type TgUserId = BrandedPrimitive<
  UUID,
  { readonly TgUserId: unique symbol }
>;
export const TgUserId = {
  new: () => {
    return UUID.new() as TgUserId;
  },
  ofString: (value: string) => {
    return UUID.ofString(value) as TgUserId;
  },
};

export type TgUserTgId = BrandedPrimitive<
  number,
  { readonly TgUserTgId: unique symbol }
>;
export const TgUserTgId = {
  ofString: (value: number) => {
    return value as TgUserTgId;
  },
};

export type TgUserUsername = BrandedPrimitive<
  NotEmptyString,
  { readonly TgUserTgTgUsername: unique symbol }
>;
export const TgUserUsername = {
  ofString: (value: string) => {
    return NotEmptyString.ofString(value) as TgUserUsername;
  },
};

export type TgUser = TgUserTable & {
  id: TgUserId;
  tgId: TgUserTgId;
  tgUsername: TgUserUsername | null;
  tgPhone: NotEmptyString | null;
};
export const TgUser = {
  newFromTgApiUser: (user: Api.User): TgUser => {
    return {
      id: TgUserId.new(),
      tgId: TgUserTgId.ofString(user.id),
      tgUsername: !user.username
        ? null
        : TgUserUsername.ofString(user.username),
      createdAt: new Date(),
      updatedAt: new Date(),
      tgBot: user.bot || null,
      tgDeleted: user.deleted || null,
      tgVerified: user.verified || null,
      tgFake: user.fake || null,
      tgFirstName: user.firstName || null,
      tgLastName: user.lastName || null,
      tgPhone: !user.phone ? null : NotEmptyString.ofString(user.phone),
      tgPhotoId:
        user.photo instanceof UserProfilePhoto
          ? Number(user.photo.photoId)
          : null,
      tgLangCode: user.langCode || null,
    };
  },
  mergeWithTgApiUser: (currentUser: TgUser, newApiUser: Api.User): TgUser => {
    // . We need to prior newApiUser data, and use currentUser as fallback
    return {
      id: currentUser.id,
      tgId: currentUser.tgId,
      tgUsername: !newApiUser.username
        ? currentUser.tgUsername
        : TgUserUsername.ofString(newApiUser.username),
      createdAt: new Date(),
      updatedAt: new Date(),
      tgBot: newApiUser.bot || null,
      tgDeleted: newApiUser.deleted || null,
      tgVerified: newApiUser.verified || null,
      tgFake: newApiUser.fake || null,
      tgFirstName: newApiUser.firstName || currentUser.tgFirstName,
      tgLastName: newApiUser.lastName || currentUser.tgLastName,
      tgPhone: !newApiUser.phone
        ? currentUser.tgPhone
        : NotEmptyString.ofString(newApiUser.phone),
      tgPhotoId:
        newApiUser.photo instanceof UserProfilePhoto
          ? Number(newApiUser.photo.photoId)
          : null,
      tgLangCode: newApiUser.langCode || null,
    };
  },
};

export type TgUserDS = ReturnType<typeof TgUserDS>;

export const TgUserDS = (knex: Knex) => {
  return {
    findByTgId: async (tgId: TgUserTgId): Promise<TgUser | undefined> => {
      const res = await TgUserTable(knex).where("tgId", tgId).first();

      return !res
        ? undefined
        : {
            ...res,
            id: res.id as TgUserId,
            tgId: res.tgId as TgUserTgId,
            tgUsername: res.tgUsername as TgUserUsername | null,
            tgPhone: res.tgPhone as NotEmptyString | null,
          };
    },

    update: async (projection: TgUser): Promise<void> => {
      await TgUserTable(knex).where({ id: projection.id }).update(projection);
    },

    create: async (
      projection: TgUser,
      ignoreTgId: boolean = false
    ): Promise<void> => {
      if (!ignoreTgId) {
        return TgUserTable(knex).insert(projection);
      }

      await TgUserTable(knex).insert(projection).onConflict("tgId").ignore();
    },
  };
};
