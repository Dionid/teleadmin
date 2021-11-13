import { Knex } from "knex";
import { EventBus } from "libs/@fdd/eda";
import { initCreatedAndSettedMasterHomunculusEventHandler } from "modules/orchestrator/handlers/created-and-setted-master-homunculus-event";
import { Logger } from "winston";

export const initOrchestrator = (
  logger: Logger,
  eventBus: EventBus,
  knex: Knex
) => {
  initCreatedAndSettedMasterHomunculusEventHandler(logger, eventBus, knex);
};
