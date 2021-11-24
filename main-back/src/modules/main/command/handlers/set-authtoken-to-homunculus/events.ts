import { EventBehavior, Event } from "@fdd-node-ts/core/eda/event";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";

export type AuthTokenToHomunculusSetEvent = Event<
  "AuthTokenToHomunculusSetEvent",
  "v1",
  {
    authToken: NotEmptyString;
  }
>;
export const AuthTokenToHomunculusSetEvent =
  EventBehavior.createCurriedNameVersion<AuthTokenToHomunculusSetEvent>(
    "AuthTokenToHomunculusSetEvent",
    "v1"
  );
