import { Knex } from "knex";
import { FullEvent } from "libs/@fdd/eda";
import { EventModel } from "libs/main-db/models/event";

export type EventBusPersistor = {
  knex: Knex;
};

export const make = (knex: Knex): EventBusPersistor => {
  return {
    knex,
  };
};

export const saveEvent =
  (persistor: EventBusPersistor) => async (event: FullEvent) => {
    await EventModel(persistor.knex).insert({
      id: event.meta.id,
      createdAt: new Date(),
      type: event.type,
      data: event.data,
      version: event.version,
      userId: event.meta.userId,
      rootTransactionId: event.meta.rootTransactionId,
    });

    return event;
  };
