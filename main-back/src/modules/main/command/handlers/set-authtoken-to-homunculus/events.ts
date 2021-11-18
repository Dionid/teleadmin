import { EventBehaviour } from "fdd-ts/eda";
import { Event } from "fdd-ts/eda/events";
import { NotEmptyString } from "functional-oriented-programming-ts/branded";

export type AuthTokenToHomunculusSetEvent = Event<
  "AuthTokenToHomunculusSetEvent",
  "v1",
  {
    authToken: NotEmptyString;
  }
>;
export const AuthTokenToHomunculusSetEvent =
  EventBehaviour.create<AuthTokenToHomunculusSetEvent>(
    "AuthTokenToHomunculusSetEvent",
    "v1"
  );
