import { Event, EventBehavior } from "@fdd-node/core/eda/event";
import {
  TgSource,
  TgSourceId,
  TgSourceTgId,
} from "modules/main/command/projections/tg-source";

export type PrivateSourceAddedEvent = Event<
  "PrivateSourceAdded",
  "v1",
  {
    id: TgSourceId;
    tgId: TgSourceTgId;
    tgName: string | null;
    wasDeleted: boolean;
  }
>;

export const PrivateSourceAddedEvent = {
  ...EventBehavior.createCurriedNameVersion<PrivateSourceAddedEvent>(
    "PrivateSourceAdded",
    "v1"
  ),
  fromTgSource: (tgSource: TgSource, wasDeleted: boolean) => {
    return PrivateSourceAddedEvent.create({
      id: tgSource.id,
      tgId: tgSource.tgId,
      tgName: tgSource.tgName,
      wasDeleted,
    });
  },
};
