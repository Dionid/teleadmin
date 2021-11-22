import { EventBus } from "@fdd-node/core/eda";
import { EventBusInMemory } from "@fdd-node/core/eda-in-memory";
import { EventBusInMemoryPersistor } from "@fdd-node/core/eda-in-memory/event-bus-inmemory";
import { Logger } from "libs/teleadmin/deps/logger";

export const initEventBus = (
  eventBusPersistorService: EventBusInMemoryPersistor,
  logger: Logger
): EventBus => {
  return EventBus.create(
    EventBusInMemory.create({
      persistor: eventBusPersistorService,
      tx: false,
      onError: (e) => {
        logger.error(`EventBus Error: `, e);
      },
      log: logger.debug,
    }),
    EventBusInMemory
  );
};
