import crypto from "crypto";

import { ValidationError } from "@fdd-node/core/errors";
import { UUID } from "@fdd-node/core/fop-utils";
import { BrandedPrimitive } from "@fop-ts/core/branded";
import { UserTable } from "libs/main-db/models";

export type UserId = BrandedPrimitive<UUID, { readonly UserId: unique symbol }>;
export const UserId = {
  newDefault: (): UserId => {
    return UUID.create() as UserId;
  },
  ofString: (value: string): UserId => {
    return UUID.ofString(value) as UserId;
  },
};
export type UserEmail = BrandedPrimitive<
  string,
  { readonly UserEmail: unique symbol }
>;
export const UserEmail = {
  ofString: (value: string): UserEmail => {
    if (!value.includes("@")) {
      throw new ValidationError("Email is incorrect");
    }

    return value as UserEmail;
  },
};
export type UserHashedPassword = BrandedPrimitive<
  string,
  { readonly UserHashedPassword: unique symbol }
>;
export const UserHashedPassword = {
  _hash: (salt: string, value: string): string => {
    return crypto.pbkdf2Sync(value, salt, 1000, 64, `sha512`).toString(`hex`);
  },
  ofString: (salt: string, value: string): UserHashedPassword => {
    if (value.length < 6) {
      throw new Error("Must be more than 6 symbols");
    }

    return UserHashedPassword._hash(salt, value) as UserHashedPassword;
  },
  compare: (
    currentPassword: UserHashedPassword,
    comparePassword: UserHashedPassword
  ): boolean => {
    return currentPassword === comparePassword;
  },
};

export type User = UserTable & {
  id: UserId;
  email: UserEmail;
  password: UserHashedPassword;
};

export const User = {
  newUnactivatedUser: (
    email: UserEmail,
    password: UserHashedPassword
  ): User => {
    return {
      id: UserId.newDefault(),
      email,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEmailActivated: false,
      demo: false,
    };
  },
};
