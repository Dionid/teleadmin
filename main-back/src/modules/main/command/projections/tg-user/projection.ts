import { UUID } from "@fdd-node/core/fop-utils";
import { BrandedPrimitive } from "@fop-ts/core/Branded";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";
import { TgUserTable } from "libs/main-db/models";
import { Api } from "telegram";

import UserProfilePhoto = Api.UserProfilePhoto;

export type TgUserId = BrandedPrimitive<
  UUID,
  { readonly TgUserId: unique symbol }
>;
export const TgUserId = {
  create: () => {
    return UUID.create() as TgUserId;
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
  createFromTgApiUser: (user: Api.User): TgUser => {
    return {
      id: TgUserId.create(),
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
