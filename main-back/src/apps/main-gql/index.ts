import * as Env from "@fdd-node/core/env";
import { NotFoundError } from "@fdd-node/core/errors";
import { initCronJobs } from "apps/main-gql/cron";
import { EventBusPersistorService } from "apps/main-gql/event-bus-persistor";
import { initServer } from "apps/main-gql/server";
import { initTgClient } from "apps/main-gql/set-tg-client";
import { subscribeOnEvents } from "apps/main-gql/subs";
import * as dotenv from "dotenv";
import { Context } from "libs/fdd-ts/context";
import {
  GlobalContext,
  GlobalContextStorage,
} from "libs/teleadmin/contexts/global";
import { initEventBus } from "libs/teleadmin/deps/event-bus";
import { initAppLogger } from "libs/teleadmin/deps/logger";
import { initMainDbConnection } from "libs/teleadmin/deps/main-db";
import { initOrchestrator } from "modules/orchestrator";

dotenv.config();

const main = async () => {
  // . Logger
  const logger = initAppLogger("debug", "teleadmin-main-gql");

  // ENV const
  const getEnvOrThrowLogs = Env.getEnvOrThrow(logger.error);

  const connectionString = getEnvOrThrowLogs("MAIN_DB_CONNECTION_STRING");
  const jwtSecret = getEnvOrThrowLogs("JWT_SECRET");
  const passwordHashSalt = getEnvOrThrowLogs("PASSWORD_HASH_SALT");

  // . DB
  const pg = initMainDbConnection(connectionString, "pg", logger);

  // . EDA
  const eventBusPersistorService = EventBusPersistorService.new({
    knex: pg,
  });

  const eventBus = initEventBus(eventBusPersistorService, logger);

  const globalCtxStorage = GlobalContextStorage.create({
    knex: pg,
    eventBus,
    logger,
  });

  await Context.run(GlobalContext, globalCtxStorage, async () => {
    const { parseSourcesJob } = initCronJobs();

    // . INTERNAL SUBSCRIBE
    subscribeOnEvents(parseSourcesJob);

    // . ORCHESTRATOR
    initOrchestrator();

    // . SERVER
    const server = initServer(jwtSecret, passwordHashSalt);

    // . Set TG Client
    try {
      await initTgClient(pg, eventBus);
    } catch (e) {
      if (e instanceof NotFoundError) {
        logger.error(e);
      } else {
        throw e;
      }
    }

    // FIRE
    server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
      logger.info(`🚀  NEW Server ready at ${url}`);
    });
  });
};

main();
