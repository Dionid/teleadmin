import { Knex } from "knex";
import { Event } from "libs/main-db/schemats-schema";

export type EventModel = Event;
export const EventModel = (knex: Knex) => knex<EventModel>("event");
