import { AsyncLocalStorage } from "async_hooks";

import { EventBus } from "@fdd-node/core/eda";
import { UUID } from "@fdd-node/core/fop-utils";
import { Knex } from "knex";
import { Logger } from "winston";

export type GlobalContextStorage = {
  knex: Knex;
  eventBus: EventBus;
  logger: Logger;
  txId: UUID;
};

export const GlobalContextStorage = {
  create: (props: {
    knex: Knex;
    eventBus: EventBus;
    logger: Logger;
    txId?: UUID;
  }): GlobalContextStorage => {
    return {
      ...props,
      txId: props.txId || UUID.create(),
    };
  },
};

export const GlobalContext = new AsyncLocalStorage<GlobalContextStorage>();
