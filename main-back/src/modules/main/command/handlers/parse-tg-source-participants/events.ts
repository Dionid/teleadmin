import {Event, EventFactory} from "libs/@fdd/eda/events";

export type TgSourceParticipantsParsedEvent = Event<
  "TgSourceParticipantsParsedEvent",
  "v1",
  Record<any, any>
>;
export const TgSourceParticipantsParsedEvent =
  EventFactory<TgSourceParticipantsParsedEvent>(
    "TgSourceParticipantsParsedEvent",
    "v1"
  );
