import { Event, EventBehavior } from "@fdd-node/core/eda/event";
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
  EventBehavior.createCurriedNameVersion<PublicSourceAddedEvent>(
    "PublicSourceAdded",
    "v1.1"
  );
