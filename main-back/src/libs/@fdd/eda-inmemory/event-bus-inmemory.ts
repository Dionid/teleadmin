import { Deferred } from "libs/@fdd/deferred";
import {
  Event,
  EventBus,
  EventBusService,
  EventHandler,
  FullEvent,
} from "libs/@fdd/eda";

export type EventBusInMemoryPersistor = {
  saveEvent: <E extends FullEvent>(event: E) => Promise<E>;
};

export type EventBusInMemory = EventBus & {
  tx: boolean;
  storedEvents: FullEvent[];
  eventHandlers: Record<string, Array<EventHandler<any>>>;
  onError: (e: any) => void;
  persistor?: EventBusInMemoryPersistor;
  log?: (...args: any) => void;
};

export const newEventBusInMemory = (
  props: {
    tx?: boolean;
    storedEvents?: FullEvent[];
    eventHandlers?: Record<string, Array<EventHandler<any>>>;
    persistor?: EventBusInMemoryPersistor;
    onError?: (e: any) => void;
    log?: (...args: any) => void;
  } = {}
): EventBusInMemory => {
  return {
    tx: props.tx || false,
    onError:
      props.onError ||
      ((e) => {
        throw e;
      }),
    storedEvents: props.storedEvents || [],
    eventHandlers: props.eventHandlers || {},
    persistor: props.persistor,
    log: props.log,
  } as EventBusInMemory;
};

export const unsubscribe = async <E extends Event<any, any, any>>(
  ebps: EventBusInMemory,
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
): Promise<EventBusInMemory> => {
  if (ebps.eventHandlers[eventName]) {
    ebps.eventHandlers[eventName] = ebps.eventHandlers[eventName].filter(
      (c) => c === eventHandler
    );
  }

  return ebps;
};

export const unsubscribeC =
  <E extends Event<any, any, any>>(
    eventName: E["type"],
    eventHandler: EventHandler<FullEvent<E>>
  ) =>
  async (ebps: EventBusInMemory): Promise<EventBusInMemory> => {
    return unsubscribe(ebps, eventName, eventHandler);
  };

export const subscribe = async <E extends Event<any, any, any>>(
  ebps: EventBusInMemory,
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
): Promise<EventBusInMemory> => {
  if (ebps.eventHandlers[eventName]) {
    ebps.eventHandlers[eventName].push(eventHandler);
  } else {
    ebps.eventHandlers[eventName] = [eventHandler];
  }

  return {
    ...ebps,
    eventHandlers: {
      ...ebps.eventHandlers,
    },
  };
};

export const subscribeC =
  <E extends Event<any, any, any>>(
    eventName: E["type"],
    eventHandler: EventHandler<FullEvent<E>>
  ) =>
  async (ebps: EventBusInMemory): Promise<EventBusInMemory> => {
    return subscribe(ebps, eventName, eventHandler);
  };

const dispatch =
  (events: readonly FullEvent[]) => async (ebps: EventBusInMemory) => {
    await events.map(async (event) => {
      const handlers = ebps.eventHandlers[event.type];

      if (ebps.persistor) {
        try {
          await ebps.persistor.saveEvent(event);
        } catch (e) {
          ebps.onError(e);
        }
      }

      if (handlers) {
        await handlers.map(async (callback) => {
          try {
            await callback(event);
          } catch (e) {
            ebps.onError(e);
          }
        });
      }
    });
  };

export const publish = async (
  ebps: EventBusInMemory,
  events: readonly FullEvent[]
): Promise<void> => {
  if (ebps.tx) {
    ebps.storedEvents.push(...events);

    return;
  }

  await dispatch(events)(ebps);
};

export const publishC =
  (events: readonly FullEvent[]) =>
  async (ebps: EventBusInMemory): Promise<void> => {
    return publish(ebps, events);
  };

export const tx = async (ebps: EventBusInMemory): Promise<EventBusInMemory> => {
  return {
    ...ebps,
    tx: true,
    storedEvents: [],
  };
};

export const commit = async (
  ebps: EventBusInMemory
): Promise<EventBusInMemory> => {
  if (!ebps.tx) {
    return ebps;
  }

  await dispatch(ebps.storedEvents)(ebps);

  return {
    ...ebps,
    tx: false,
    storedEvents: [],
  };
};

export const rollback = async (
  ebps: EventBusInMemory
): Promise<EventBusInMemory> => {
  if (!ebps.tx) {
    return ebps;
  }

  return {
    ...ebps,
    tx: false,
    storedEvents: [],
  };
};

export const pull = async <E extends Event<any, any, any>>(
  ebps: EventBusInMemory,
  eventName: E["type"]
): Promise<E> => {
  return new Promise((resolve, reject) => {
    const callback: EventHandler<FullEvent<E>> = async (event) => {
      resolve(event);
      await unsubscribe(ebps, eventName, callback);
    };

    subscribe<E>(ebps, eventName, callback);
  });
};

export const pullC =
  <E extends Event<any, any, any>>(eventName: E["type"]) =>
  (ebps: EventBusInMemory): Promise<E> =>
    pull(ebps, eventName);

export async function* observe<E extends Event<any, any, any>>(
  ebps: EventBusInMemory,
  eventName: E["type"]
): AsyncGenerator<{ stop: () => void; data: E }, void, unknown> {
  let stop = false;
  let deff = Deferred.new<E>();

  const callback: EventHandler<E> = async (e) => {
    deff.resolve(e);
    deff = Deferred.new();
  };

  await subscribe<E>(ebps, eventName, callback);

  while (!stop) {
    const event = await deff.promise;
    yield {
      stop: () => {
        unsubscribe(ebps, eventName, callback);
        stop = true;
      },
      data: event,
    };
  }
}

export const observeC =
  <E extends Event<any, any, any>>(eventName: E["type"]) =>
  (
    ebps: EventBusInMemory
  ): AsyncGenerator<{ stop: () => void; data: E }, void, unknown> =>
    observe(ebps, eventName);

export type EventBusInMemoryBehaviour = typeof EventBusInMemory;
export const EventBusInMemory = {
  new: newEventBusInMemory,
  unsubscribe,
  unsubscribeC,
  subscribe,
  subscribeC,
  publish,
  publishC,
  pull,
  pullC,
  observe,
  observeC,
  tx,
  commit,
  rollback,
};

export type EventBusInMemoryService = EventBusService;
export const EventBusInMemoryService = {
  fromEventBusInmemory: (ebps: EventBusInMemory): EventBusService => {
    return {
      unsubscribe: async <E extends Event<any, any, any>>(
        eventName: E["type"],
        eventHandler: EventHandler<FullEvent<E>>
      ) =>
        EventBusInMemoryService.new(
          await unsubscribe(ebps, eventName, eventHandler)
        ),
      subscribe: async <E extends Event<any, any, any>>(
        eventName: E["type"],
        eventHandler: EventHandler<FullEvent<E>>
      ) =>
        EventBusInMemoryService.new(
          await subscribe(ebps, eventName, eventHandler)
        ),
      publish: async (events: readonly FullEvent[]) => publish(ebps, events),
      pull: async <E extends Event<any, any, any>>(eventName: E["type"]) =>
        pull(ebps, eventName),
      observe: <E extends Event<any, any, any>>(eventName: E["type"]) =>
        observe(ebps, eventName),
      tx: async () => EventBusInMemoryService.new(await tx(ebps)),
      commit: async () => EventBusInMemoryService.new(await commit(ebps)),
      rollback: async () => EventBusInMemoryService.new(await rollback(ebps)),
    };
  },
  new: (props: {
    tx?: boolean;
    storedEvents?: FullEvent[];
    eventHandlers?: Record<string, Array<EventHandler<any>>>;
    persistor?: EventBusInMemoryPersistor;
    onError?: (e: any) => void;
    log?: (...args: any) => void;
  }): EventBusService => {
    return EventBusInMemoryService.fromEventBusInmemory(
      newEventBusInMemory(props)
    );
  },
};
