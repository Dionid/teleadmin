import { EventBus } from "fdd-ts/eda";
import { Knex } from "knex";
import { initCreatedAndSettedMasterHomunculusEventHandler } from "modules/orchestrator/handlers/created-and-setted-master-homunculus-event";
import { Logger } from "winston";

export const initOrchestrator = (
  logger: Logger,
  eventBus: EventBus,
  knex: Knex
) => {
  initCreatedAndSettedMasterHomunculusEventHandler(logger, eventBus, knex);
};
