import { Maybe } from "functional-oriented-programming-ts";
import { v4 } from "uuid";

export type CommandOrQueryBaseMeta = {
  transactionId: string;
  createdAt: Date;
  userId: Maybe<string>;
  parentTransactionId?: string;
};

export type CommandOrQuery<
  Type extends string,
  Data extends Record<string, any>
> = {
  type: Type;
  data: Data;
  meta: CommandOrQueryBaseMeta;
};

export type Query<
  Type extends string,
  Data extends Record<string, any>,
  R
> = CommandOrQuery<Type, Data> & { _result?: R };
export const Query = {
  new: <Type extends string, Data extends Record<string, any>, R>(props: {
    type: Type;
    data: Data;
    userId: Maybe<string>;
    transactionId?: string;
    parentTransactionId?: string;
    createdAt?: Date;
  }): Query<Type, Data, R> => {
    return {
      type: props.type,
      data: props.data,
      meta: {
        userId: props.userId,
        transactionId: props.transactionId || v4(),
        parentTransactionId: props.parentTransactionId,
        createdAt: props.createdAt || new Date(),
      },
    };
  },
};

export const QueryFactory = <Q extends Query<any, any, any>>(
  type: Q["type"]
) => {
  return {
    new: (
      data: Q["data"],
      meta: {
        userId: Maybe<string>;
        transactionId?: string;
        parentTransactionId?: string;
        createdAt?: Date;
      }
    ): Query<Q["type"], Q["data"], Q["_result"]> => {
      return Query.new({
        type,
        data,
        ...meta,
      });
    },
    type,
  };
};

export type Command<
  Type extends string,
  Data extends Record<string, any>
> = Query<Type, Data, undefined>;

export const Command = {
  new: <Type extends string, Data extends Record<string, any>>(props: {
    type: Type;
    data: Data;
    userId: Maybe<string>;
    transactionId?: string;
    parentTransactionId?: string;
    createdAt?: Date;
  }): Command<Type, Data> => {
    return {
      type: props.type,
      data: props.data,
      meta: {
        userId: props.userId,
        transactionId: props.transactionId || v4(),
        parentTransactionId: props.parentTransactionId,
        createdAt: props.createdAt || new Date(),
      },
    };
  },
};

export const CommandFactory = <Cmd extends Command<any, any>>(
  type: Cmd["type"]
) => {
  return {
    new: (
      data: Cmd["data"],
      meta: {
        userId: Maybe<string>;
        transactionId?: string;
        parentTransactionId?: string;
        createdAt?: Date;
      }
    ): Command<Cmd["type"], Cmd["data"]> => {
      return Command.new({
        type,
        data,
        ...meta,
      });
    },
    type,
  };
};

export type Hybrid<
  Type extends string,
  Data extends Record<string, any>,
  R
> = Query<Type, Data, R>;
export const Hybrid = {
  new: <H extends Hybrid<any, any, any>>(props: {
    type: H["type"];
    data: H["data"];
    userId: Maybe<string>;
    transactionId?: string;
    parentTransactionId?: string;
    createdAt?: Date;
  }): Hybrid<H["type"], H["data"], H["_result"]> => {
    return {
      type: props.type,
      data: props.data,
      meta: {
        userId: props.userId,
        transactionId: props.transactionId || v4(),
        parentTransactionId: props.parentTransactionId,
        createdAt: props.createdAt || new Date(),
      },
    };
  },
};

export const HybridFactory = <H extends Hybrid<any, any, any>>(
  type: H["type"]
) => {
  return {
    new: (
      data: H["data"],
      meta: {
        userId: Maybe<string>;
        transactionId?: string;
        parentTransactionId?: string;
        createdAt?: Date;
      }
    ): Hybrid<H["type"], H["data"], H["_result"]> => {
      return Hybrid.new({
        type,
        data,
        ...meta,
      });
    },
    type,
  };
};

type NonUndefined<T> = Exclude<T, undefined>;

export type CommandQueryHandler<CQ extends CommandOrQuery<any, any>, R> = (
  query: CQ
) => Promise<R>;
export type QueryHandler<Q extends Query<any, any, any>> = CommandQueryHandler<
  Q,
  NonUndefined<Q["_result"]>
>;
export type CommandHandler<Cmd extends Command<any, any>> = CommandQueryHandler<
  Cmd,
  void
>;
export type HybridHandler<HybridCmd extends Hybrid<any, any, any>> =
  CommandQueryHandler<HybridCmd, NonUndefined<HybridCmd["_result"]>>;
