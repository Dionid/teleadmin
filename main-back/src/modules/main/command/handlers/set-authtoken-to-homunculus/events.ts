import { Event } from "libs/@fdd/eda";
import { NotEmptyString } from "libs/@fdd/nominal/common";

export type AuthTokenToHomunculusSet = Event<
  "AuthTokenToHomunculusSet",
  "v1",
  {
    authToken: NotEmptyString;
  }
>;
