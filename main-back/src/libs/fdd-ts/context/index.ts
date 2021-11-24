import { AsyncLocalStorage } from "async_hooks";

import { CriticalError } from "@fdd-node-ts/core/errors";

export type Context<S> = AsyncLocalStorage<S>;

export const run = <S, P extends readonly unknown[], R>(
  ctx: Context<S>,
  storage: S,
  fn: (...args: P) => R,
  ...args: P
): R => {
  return ctx.run<R>(storage, fn as unknown as (...args: any[]) => R, ...args);
};

export const runC2 =
  <S, Ctx extends Context<S>, P extends readonly unknown[], R>(
    ctx: Ctx,
    storage: S,
    fn: (...args: P) => R
  ) =>
  (...args: P): R =>
    run(ctx, storage, fn, ...args);
export const runC3 =
  <S, Ctx extends Context<S>>(ctx: Ctx, storage: S) =>
  <P extends readonly unknown[], R>(fn: (...args: P) => R) =>
  (...args: P): R =>
    run(ctx, storage, fn, ...args);

export const getStoreOrThrowError = <S>(ctx: Context<S>): S => {
  const store = ctx.getStore();

  if (!store) {
    throw new CriticalError("Global store is undefined");
  }

  return store;
};

export const Context = {
  run,
  runC2,
  runC3,
  getStoreOrThrowError,
};
