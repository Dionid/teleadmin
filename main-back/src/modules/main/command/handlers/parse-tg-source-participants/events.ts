import { Event, EventBehavior } from "@fdd-node/core/eda/event";

export type TgSourceParticipantsParsedEvent = Event<
  "TgSourceParticipantsParsedEvent",
  "v1",
  Record<any, any>
>;
export const TgSourceParticipantsParsedEvent =
  EventBehavior.createCurriedNameVersion<TgSourceParticipantsParsedEvent>(
    "TgSourceParticipantsParsedEvent",
    "v1"
  );
