import { FullEvent } from "@fdd-node/core/eda/full-event";
import { Knex } from "knex";
import { EventModel } from "libs/main-db/models/event";

export type EventBusPersistor = {
  knex: Knex;
};

export const create = (knex: Knex): EventBusPersistor => {
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
    type: event.name,
    data: event.data,
    version: event.version,
    userId: event.meta.userId,
    rootTransactionId: event.meta.rootTransactionId,
  });

  return event;
};

export const EventBusPersistor = {
  create,
  saveEvent,
};

export const EventBusPersistorSF = {
  create: (persistor: EventBusPersistor) => {
    return {
      saveEvent: <E extends FullEvent>(event: E) =>
        saveEvent<E>(persistor, event),
    };
  },
};
