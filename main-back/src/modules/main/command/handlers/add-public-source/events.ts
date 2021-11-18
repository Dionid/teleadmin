import { Event, EventBehaviour } from "fdd-ts/eda/events";
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
export const PublicSourceAddedEvent =
  EventBehaviour.create<PublicSourceAddedEvent>("PublicSourceAdded", "v1.1");
