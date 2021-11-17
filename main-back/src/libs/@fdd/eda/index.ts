export * from "./events"
import * as EB from "./event-bus";

export type EventBus = EB.EventBus
export type EventBusBehaviour<EBD extends EB.EventBus = EB.EventBus> = EB.Behaviour<EBD>
export type EventBusService = EB.Service
