export type Deferred<D> = {
  promise: Promise<D>;
  resolve: (value: D | PromiseLike<D>) => void;
  reject: (value: D | PromiseLike<D>) => void;
};

export const Deferred = {
  new: <D>(timeout?: number) => {
    let resolve: (value: D | PromiseLike<D>) => void;
    let reject: (value: D | PromiseLike<D>) => void;
    const promise: Promise<D> = new Promise((res, rej) => {
      reject = rej;
      resolve = res;

      if (timeout) {
        setTimeout(() => {
          rej();
        }, timeout);
      }
    });

    return {
      promise,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      resolve,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      reject,
    };
  },
};
