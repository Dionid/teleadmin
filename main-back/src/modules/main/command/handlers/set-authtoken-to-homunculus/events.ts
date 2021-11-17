import { Event } from "fdd-ts/eda/events";
import { NotEmptyString } from "libs/@fdd/branded/common";

export type AuthTokenToHomunculusSet = Event<
  "AuthTokenToHomunculusSet",
  "v1",
  {
    authToken: NotEmptyString;
  }
>;
