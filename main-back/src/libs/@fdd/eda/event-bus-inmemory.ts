import {Deferred} from "libs/@fdd/deferred";
import {EventBusData, EventBusService} from "libs/@fdd/eda/event-bus";
import {Event, EventHandler, FullEvent} from "libs/@fdd/eda/index";

export type EventBusPersistor = {
  saveEvent: (event: FullEvent) => Promise<void>
  saveEvents: (event: readonly FullEvent[]) => Promise<void>
}

export type EventBusInmemory = EventBusData & {
  tx: boolean
  storedEvents: FullEvent[]
  eventHandlers: Record<string, Array<EventHandler<any>>>
  onError: (e: any) => void,
  persistor?: EventBusPersistor,
}

export const newEventBusInmemory = (props: {
  tx?: boolean
  storedEvents?: FullEvent[]
  eventHandlers?: Record<string, Array<EventHandler<any>>>
  persistor?: EventBusPersistor,
  onError?: (e: any) => void;
} = {}): EventBusInmemory => {
  return {
    tx: props.tx || false,
    onError: props.onError || ((e) => {
      throw e
    }),
    storedEvents: props.storedEvents || [],
    eventHandlers: props.eventHandlers || {},
    persistor: props.persistor,
  } as EventBusInmemory
}

export const unsubscribe = async <E extends Event<any, any, any>>(
  ebps: EventBusInmemory,
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
): Promise<EventBusInmemory> => {
  if (ebps.eventHandlers[eventName]) {
    ebps.eventHandlers[eventName] = ebps.eventHandlers[eventName].filter(
      (c) => c === eventHandler
    );
  }

  return ebps
}

export const unsubscribeC = <E extends Event<any, any, any>>(
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
) => async (ebps: EventBusInmemory): Promise<EventBusInmemory> => {
  return unsubscribe(ebps, eventName, eventHandler)
}

export const subscribe = async <E extends Event<any, any, any>>(
  ebps: EventBusInmemory,
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
): Promise<EventBusInmemory> => {
  if (ebps.eventHandlers[eventName]) {
    ebps.eventHandlers[eventName].push(eventHandler);
  } else {
    ebps.eventHandlers[eventName] = [eventHandler];
  }

  return {
    ...ebps,
    eventHandlers: {
      ...ebps.eventHandlers,
    }
  }
}

export const subscribeC = <E extends Event<any, any, any>>(
  eventName: E["type"],
  eventHandler: EventHandler<FullEvent<E>>
) => async (ebps: EventBusInmemory): Promise<EventBusInmemory> => {
  return subscribe(ebps, eventName, eventHandler)
}

const dispatch = (events: readonly FullEvent[]) => async (ebps: EventBusInmemory) => {
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

export const publish = async (ebps: EventBusInmemory, events: readonly FullEvent[]): Promise<void> => {
  if (ebps.tx) {
    ebps.storedEvents.push(...events)

    return
  }

  await dispatch(events)(ebps)
}


export const publishC = (events: readonly FullEvent[]) => async (ebps: EventBusInmemory): Promise<void> => {
  return publish(ebps, events)
}

export const tx = async (ebps: EventBusInmemory): Promise<EventBusInmemory> => {
  return {
    ...ebps,
    tx: true,
    storedEvents: [],
  }
}

export const commit = async (ebps: EventBusInmemory): Promise<EventBusInmemory> => {
  if (!ebps.tx) {
    return ebps
  }

  await dispatch(ebps.storedEvents)(ebps)

  return {
    ...ebps,
    tx: false,
    storedEvents: [],
  }
}

export const rollback = async (ebps: EventBusInmemory): Promise<EventBusInmemory> => {
  if (!ebps.tx) {
    return ebps
  }

  return {
    ...ebps,
    tx: false,
    storedEvents: [],
  }
}

export const pull = async <E extends Event<any, any, any>>(
  ebps: EventBusInmemory,
  eventName: E["type"]
): Promise<E> => {
  return new Promise((resolve, reject) => {
    const callback: EventHandler<FullEvent<E>> = async (event) => {
      resolve(event);
      await unsubscribe(ebps, eventName, callback);
    }

    subscribe<E>(ebps, eventName, callback);
  });
};

export const pullC = <E extends Event<any, any, any>>(
  eventName: E["type"]
) => (ebps: EventBusInmemory): Promise<E> => pull(ebps, eventName)

async function* observe<E extends Event<any, any, any>>(
  ebps: EventBusInmemory,
  eventName: E["type"]
): AsyncGenerator<{ stop: () => void; data: E }, void, unknown> {
  let stop = false;
  let deff = Deferred.new<E>();

  const callback: EventHandler<E> = async (e) => {
    deff.resolve(e);
    deff = Deferred.new();
  }

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

export const observeC = <E extends Event<any, any, any>>(
  eventName: E["type"]
) => (ebps: EventBusInmemory): AsyncGenerator<{ stop: () => void; data: E }, void, unknown> => observe(ebps, eventName)

export const EventBusInmemory = {
  new: newEventBusInmemory,
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
}

export type EventBusInmemoryService = EventBusService

export const EventBusInmemoryService = {
  fromEventBusInmemory: (ebps: EventBusInmemory): EventBusService => {
    return {
      unsubscribe: async <E extends Event<any, any, any>>(
        eventName: E["type"],
        eventHandler: EventHandler<FullEvent<E>>
      ) => EventBusInmemoryService.new(await unsubscribe(ebps, eventName, eventHandler)),
      subscribe: async <E extends Event<any, any, any>>(
        eventName: E["type"],
        eventHandler: EventHandler<FullEvent<E>>
      ) => EventBusInmemoryService.new(await subscribe(ebps, eventName, eventHandler)),
      publish: async (events: readonly FullEvent[]) => publish(ebps, events),
      pull: async <E extends Event<any, any, any>>(eventName: E["type"]) => pull(ebps, eventName),
      observe: <E extends Event<any, any, any>>(eventName: E["type"]) => observe(ebps, eventName),
      tx: async () => EventBusInmemoryService.new(await tx(ebps)),
      commit: async () => EventBusInmemoryService.new(await commit(ebps)),
      rollback: async () => EventBusInmemoryService.new(await rollback(ebps)),
    }
  },
  new: (props: {
    tx?: boolean
    storedEvents?: FullEvent[]
    eventHandlers?: Record<string, Array<EventHandler<any>>>
    persistor?: EventBusPersistor,
    onError?: (e: any) => void;
  }): EventBusService => {
    return EventBusInmemoryService.fromEventBusInmemory(EventBusInmemory.new(props))
  },
}
