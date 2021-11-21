import { EventBus } from "@fdd-node/core/eda";
import { EventBusInMemory } from "@fdd-node/core/eda-in-memory";
import { EventBusInMemoryPersistor } from "@fdd-node/core/eda-in-memory/event-bus-inmemory";
import { Logger } from "winston";

export let eventBus: EventBus;

export const initEventBus = (
  eventBusPersistorService: EventBusInMemoryPersistor,
  logger: Logger
): EventBus => {
  eventBus = EventBus.create(
    EventBusInMemory.create({
      persistor: eventBusPersistorService,
      tx: false,
      onError: (e) => {
        logger.error(e);
      },
      log: logger.debug,
    }),
    EventBusInMemory
  );

  return eventBus;
};
