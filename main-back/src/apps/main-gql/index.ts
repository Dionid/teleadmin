import { initCronJobs } from "apps/main-gql/cron";
import { EventBusPersistorService } from "apps/main-gql/event-bus-persistor";
import { initServer } from "apps/main-gql/server";
import { initTgClient } from "apps/main-gql/set-tg-client";
import { subscribeOnEvents } from "apps/main-gql/subs";
import * as dotenv from "dotenv";
import { EventBus } from "fdd-ts/eda";
import {
  EventBusInMemory,
  EventBusInMemoryService,
} from "fdd-ts/eda-in-memory";
import * as Env from "fdd-ts/env";
import { NotFoundError } from "fdd-ts/errors";
import * as KnexUtils from "fdd-ts/knex-utils";
import knex from "knex";
import { initOrchestrator } from "modules/orchestrator";
import winston from "winston";

dotenv.config();

const main = async () => {
  const devFormat = winston.format.combine(
    winston.format.colorize({
      all: true,
    }),
    winston.format.label({
      label: "[LOGGER]",
    }),
    winston.format.timestamp({
      format: "YY-MM-DD HH:MM:SS",
    }),
    winston.format.printf(
      (info) =>
        ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`
    )
  );

  // . Logger
  const logger = winston.createLogger({
    level: "debug",
    format: devFormat,
    defaultMeta: { service: "teleadmin-main-gql" },
    transports: [new winston.transports.Console()],
  });

  // ENV const
  const getEnvOrThrowLogs = Env.getEnvOrThrow(logger.error);

  const connectionString = getEnvOrThrowLogs("MAIN_DB_CONNECTION_STRING");
  const jwtSecret = getEnvOrThrowLogs("JWT_SECRET");
  const passwordHashSalt = getEnvOrThrowLogs("PASSWORD_HASH_SALT");

  // . DB
  const pg = knex({
    client: "pg",
    debug: true,
    log: logger,
    connection: {
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    searchPath: ["knex", "public"],
    ...KnexUtils.knexSnakeCaseMappers(),
  });

  // . EDA
  const eventBusPersistorService = EventBusPersistorService.new({
    knex: pg,
  });

  // . EDA
  const eventBusService = EventBusInMemoryService.create({
    persistor: eventBusPersistorService,
    tx: false,
    onError: (e) => {
      logger.error(e);
    },
    log: logger.debug,
  });

  const eventBus = EventBus.create(
    EventBusInMemory.create({
      persistor: eventBusPersistorService,
      tx: false,
      onError: (e) => {
        logger.error(e);
      },
      log: logger.debug,
    }),
    EventBusInMemory
  );

  const [telegramClientRef, setTgClient] = initTgClient(pg, eventBus);

  const { parseSourcesJob } = initCronJobs(
    pg,
    logger,
    telegramClientRef,
    eventBusService,
    {
      knex: pg,
      logger,
    }
  );

  // . INTERNAL SUBSCRIBE
  subscribeOnEvents(
    logger,
    eventBus,
    pg,
    setTgClient,
    telegramClientRef,
    parseSourcesJob
  );

  // . ORCHESTRATOR
  initOrchestrator(logger, eventBus, pg);

  // . SERVER
  const server = initServer(
    logger,
    eventBusService,
    pg,
    telegramClientRef,
    jwtSecret,
    passwordHashSalt
  );

  // . Set TG Client
  try {
    await setTgClient();
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
};

main();
