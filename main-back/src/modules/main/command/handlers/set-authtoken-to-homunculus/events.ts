import { Event } from "fdd-ts/eda/events";
import { NotEmptyString } from "functional-oriented-programming-ts/branded";

export type AuthTokenToHomunculusSet = Event<
  "AuthTokenToHomunculusSet",
  "v1",
  {
    authToken: NotEmptyString;
  }
>;
