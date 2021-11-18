import { Event, EventBehaviour } from "fdd-ts/eda/events";

export type TgSourceParticipantsParsedEvent = Event<
  "TgSourceParticipantsParsedEvent",
  "v1",
  Record<any, any>
>;
export const TgSourceParticipantsParsedEvent =
  EventBehaviour.create<TgSourceParticipantsParsedEvent>(
    "TgSourceParticipantsParsedEvent",
    "v1"
  );
