import {Event, EventHandler, FullEvent} from "libs/@fdd/eda/index";

export type EventBusData = { readonly EBD: unique symbol }

export type unsubscribe<EBD extends EventBusData = EventBusData> = <E extends Event<any, any, any>>(
  ebd: EBD,
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
) => Promise<EBD>

export type unsubscribeC<EBD extends EventBusData = EventBusData> = <E extends Event<any, any, any>>(
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
) => (ebd: EBD) => Promise<EBD>

export type subscribe<EBD extends EventBusData = EventBusData> = <E extends Event<any, any, any>>(
  ebd: EBD,
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
) => Promise<EBD>

export type subscribeC<EBD extends EventBusData = EventBusData> = <E extends Event<any, any, any>>(
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
) => (ebd: EBD) => Promise<EBD>

export type publish<EBD extends EventBusData = EventBusData> = (ebd: EBD, events: readonly FullEvent[]) => Promise<void>

export type publishC<EBD extends EventBusData = EventBusData> = (events: readonly FullEvent[]) => (ebd: EBD) => Promise<void>

export type pull<EBD extends EventBusData = EventBusData> = <E extends Event<any, any, any>>(ebd: EBD, eventName: E["type"]) => Promise<E>

export type pullC<EBD extends EventBusData = EventBusData> = <E extends Event<any, any, any>>(eventName: E["type"]) => (ebd: EBD) => Promise<E>

export type observe<EBD extends EventBusData = EventBusData> = <E extends Event<any, any, any>>(ebd: EBD, eventName: E["type"]) => AsyncGenerator<{ stop: () => void; data: E }, void, unknown>

export type observeC<EBD extends EventBusData = EventBusData> = <E extends Event<any, any, any>>(eventName: E["type"]) => (ebd: EBD) => AsyncGenerator<{ stop: () => void; data: E }, void, unknown>

export type tx<EBD extends EventBusData = EventBusData> = (ebd: EBD) => Promise<EBD>

export type commit<EBD extends EventBusData = EventBusData> = (ebd: EBD) => Promise<EBD>

export type rollback<EBD extends EventBusData = EventBusData> = (ebd: EBD) => Promise<EBD>

export type EventBusBehaviour<EBD extends EventBusData = EventBusData> = {
  unsubscribe: unsubscribe<EBD>
  unsubscribeC: unsubscribeC<EBD>
  subscribe: subscribe<EBD>,
  subscribeC: subscribeC<EBD>,
  publish: publish<EBD>,
  publishC: publishC<EBD>,
  pull: pull<EBD>,
  pullC: pullC<EBD>,
  observe: observe<EBD>,
  observeC: observeC<EBD>,
  tx: tx<EBD>,
  commit: commit<EBD>,
  rollback: rollback<EBD>,
}

export type EventBusService = {
  unsubscribe<E extends Event<any, any, any>>(
    eventName: E["type"],
    eventHandler: EventHandler<FullEvent<E>>
  ): Promise<EventBusService>
  subscribe<E extends Event<any, any, any>>(
    eventName: E["type"],
    eventHandler: EventHandler<FullEvent<E>>
  ): Promise<EventBusService>,
  publish(events: readonly FullEvent[]): Promise<void>;
  pull<E extends Event<any, any, any>>(eventName: E["type"]): Promise<E>
  observe <E extends Event<any, any, any>>(eventName: E["type"]): AsyncGenerator<{ stop: () => void; data: E }, void, unknown>
  tx(): Promise<EventBusService>
  commit(): Promise<EventBusService>
  rollback(): Promise<EventBusService>
}
