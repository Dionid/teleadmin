import {
  EventBusInMemory,
  EventBusInMemoryPersistor,
} from "@fdd-node-ts/core/eda-in-memory/event-bus-inmemory";
import { EventBus } from "@fdd-node-ts/core/eda/event-bus";
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
