import {Event, EventFactory} from "libs/@fdd/eda/events";
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

const additionalFns = {
  fromTgSource: (tgSource: TgSource, wasDeleted: boolean) => {
    return PrivateSourceAddedEvent.new({
      id: tgSource.id,
      tgId: tgSource.tgId,
      tgName: tgSource.tgName,
      wasDeleted,
    });
  },
};

export const PrivateSourceAddedEvent = EventFactory<
  PrivateSourceAddedEvent,
  typeof additionalFns
>("PrivateSourceAdded", "v1", additionalFns);
