import {Event, EventFactory} from "libs/@fdd/eda/events";
import {
  TgSourceId,
  TgSourceTgId,
} from "modules/main/command/projections/tg-source";

export type PublicSourceAddedEvent = Event<
  "PublicSourceAdded",
  "v1.1",
  {
    id: TgSourceId;
    tgId: TgSourceTgId;
    tgName: string | null;
    wasDeleted: boolean;
  }
>;
export const PublicSourceAddedEvent = EventFactory.new<PublicSourceAddedEvent>(
  "PublicSourceAdded",
  "v1.1"
);
