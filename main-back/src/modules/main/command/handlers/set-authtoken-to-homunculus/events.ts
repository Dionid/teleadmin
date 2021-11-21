import { EventBehaviourFactory, Event } from "@fdd-node/core/eda";
import { NotEmptyString } from "@fop-ts/core/branded";

export type AuthTokenToHomunculusSetEvent = Event<
  "AuthTokenToHomunculusSetEvent",
  "v1",
  {
    authToken: NotEmptyString;
  }
>;
export const AuthTokenToHomunculusSetEvent =
  EventBehaviourFactory.create<AuthTokenToHomunculusSetEvent>(
    "AuthTokenToHomunculusSetEvent",
    "v1"
  );
