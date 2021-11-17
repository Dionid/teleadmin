import { Event, EventFactory } from "fdd-ts/eda/events";

export type TgSourceParticipantsParsedEvent = Event<
  "TgSourceParticipantsParsedEvent",
  "v1",
  Record<any, any>
>;
export const TgSourceParticipantsParsedEvent =
  EventFactory.new<TgSourceParticipantsParsedEvent>(
    "TgSourceParticipantsParsedEvent",
    "v1"
  );
