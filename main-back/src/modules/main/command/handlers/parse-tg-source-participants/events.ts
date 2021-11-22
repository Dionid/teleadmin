import { Event, EventBehaviourFactory } from "@fdd-node/core/eda";

export type TgSourceParticipantsParsedEvent = Event<
  "TgSourceParticipantsParsedEvent",
  "v1",
  Record<any, any>
>;
export const TgSourceParticipantsParsedEvent =
  EventBehaviourFactory.create<TgSourceParticipantsParsedEvent>(
    "TgSourceParticipantsParsedEvent",
    "v1"
  );
