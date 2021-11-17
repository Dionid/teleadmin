import {Maybe} from "functional-oriented-programming-ts";
import {v4} from "uuid";

export type FullEventMeta = {
  userId: Maybe<string>;
  id: string;
  rootTransactionId: string;
  createdAt: Date;
};

export type FullEvent<E extends Event<any, any, any> = Event<any, any, any>> =
  E & {
  meta: FullEventMeta;
};

export const FullEvent = {
  fromEvent: <E extends Event<any, any, any>>(props: {
    event: E;
    id?: string;
    createdAt?: Date;
    userId: Maybe<string>;
    rootTransactionId?: string;
  }): FullEvent<E> => {
    const id = props.id || v4();

    return {
      ...props.event,
      meta: {
        id,
        createdAt: props.createdAt || new Date(),
        userId: props.userId,
        rootTransactionId: props.rootTransactionId || id,
      },
    };
  },
  fromParentEvent: <E extends Event<any, any, any>>(props: {
    event: E;
    parentEvent: FullEvent;
    id?: string;
    createdAt?: Date;
  }): FullEvent<E> => {
    return {
      ...props.event,
      meta: {
        id: props.id || v4(),
        createdAt: props.createdAt || new Date(),
        userId: props.parentEvent.meta.userId,
        rootTransactionId: props.parentEvent.meta.rootTransactionId,
      },
    };
  },
  fromCmdOrQuery: <E extends Event<any, any, any>>(props: {
    event: E;
    meta: { userId: Maybe<string>; transactionId: string };
    id?: string;
    createdAt?: Date;
  }): FullEvent<E> => {
    const id = props.id || v4();

    return {
      ...props.event,
      meta: {
        id,
        createdAt: props.createdAt || new Date(),
        userId: props.meta.userId,
        rootTransactionId: props.meta.transactionId || id,
      },
    };
  },
  mapEventsFromCmdOrQuery:
    (meta: { userId: Maybe<string>; transactionId: string }) =>
      (events: Array<Event<any, any, any>>) => {
        return events.map((event) => FullEvent.fromCmdOrQuery({event, meta}));
      },
};

export type Event<Type,
  Version extends string,
  Data extends Record<any, any>> = { type: Type; data: Data; version: Version };

export type EventFactory<E extends Event<any, any, any>> = {
  new: (data: E["data"]) => E;
  type: E["type"];
  version: E["version"];
  is: (e: Event<any, any, any>) => e is E;
  isFull: (e: FullEvent) => e is FullEvent<E>;
};

export const newEventFactory = <E extends Event<any, any, any>>(type: E["type"], version: E["version"]): EventFactory<E> => {
  return {
    new: (data: E["data"]): E => {
      return {
        type,
        data,
        version,
      } as E;
    },
    type,
    version,
    is: (e: Event<any, any, any>): e is E => {
      return e.type === type;
    },
    isFull: (e: FullEvent): e is FullEvent<E> => {
      return e.type === type;
    },
  };
}

export const EventFactory = {
  new: newEventFactory,
}

export type EventHandler<E extends FullEvent<any>> = (
  event: E
) => Promise<void>;
