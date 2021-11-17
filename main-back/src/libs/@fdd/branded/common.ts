import * as Errors from "fdd-ts/errors";
import { BrandedPrimitive } from "libs/@fdd/branded/index";
import * as uuid from "uuid";
import { v4 } from "uuid";

export const StringX = {
  ofString: (
    rules: {
      min?: number;
      max?: number;
    },
    value: string
  ) => {
    if (rules.min !== undefined && value.length < rules.min) {
      return new Errors.ValidationError(
        `${value} must be minimum ${rules.min} symbols`
      );
    }

    if (rules.max !== undefined && value.length > rules.max) {
      return new Errors.ValidationError(
        `${value} must be maximum ${rules.max} symbols`
      );
    }

    return value;
  },
};

export type NotEmptyString = BrandedPrimitive<
  string,
  { readonly NotEmptyString: unique symbol }
>;
export const NotEmptyString = {
  ofString: (value: string): NotEmptyString => {
    return StringX.ofString({ min: 1 }, value) as NotEmptyString;
  },
};

export type UUID = BrandedPrimitive<string, { readonly UUID: unique symbol }>;
export const UUID = {
  ofString: (value: string) => {
    return !uuid.validate(value)
      ? new Errors.ValidationError("not valid uuid")
      : (value as UUID);
  },
  new: () => {
    return UUID.ofString(v4()) as UUID;
  },
};
