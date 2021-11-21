import { FullEvent } from "@fdd-node/core/eda";
import { Knex } from "knex";
import { EventModel } from "libs/main-db/models/event";

export type EventBusPersistor = {
  knex: Knex;
};

export const newEventBusPersistor = (knex: Knex): EventBusPersistor => {
  return {
    knex,
  };
};

export const saveEvent = async <E extends FullEvent>(
  persistor: EventBusPersistor,
  event: E
): Promise<E> => {
  await EventModel(persistor.knex).insert({
    id: event.meta.id,
    createdAt: new Date(),
    type: event.name(),
    data: event.data,
    version: event.version,
    userId: event.meta.userId,
    rootTransactionId: event.meta.rootTransactionId,
  });

  return event;
};

export const EventBusPersistor = {
  new: newEventBusPersistor,
  saveEvent,
};

export const EventBusPersistorService = {
  new: (persistor: EventBusPersistor) => {
    return {
      saveEvent: <E extends FullEvent>(event: E) =>
        saveEvent<E>(persistor, event),
    };
  },
};
