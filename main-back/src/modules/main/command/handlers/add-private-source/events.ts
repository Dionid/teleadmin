import { Event, EventFactory } from "fdd-ts/eda/events";
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
  ...EventFactory.new<PrivateSourceAddedEvent>("PrivateSourceAdded", "v1"),
  fromTgSource: (tgSource: TgSource, wasDeleted: boolean) => {
    return PrivateSourceAddedEvent.new({
      id: tgSource.id,
      tgId: tgSource.tgId,
      tgName: tgSource.tgName,
      wasDeleted,
    });
  },
};
