import { initCronJobs } from "apps/main-gql/cron";
import { EventBusPersistorService} from "apps/main-gql/event-bus-persistor";
import { initServer } from "apps/main-gql/server";
import { initTgClient } from "apps/main-gql/set-tg-client";
import { subscribeOnEvents } from "apps/main-gql/subs";
import * as dotenv from "dotenv";
import {getEnvOrThrow} from "fdd-ts";
import knex from "knex";
import { EventBusInMemoryService} from "libs/@fdd/eda-inmemory";
import { NotFoundError } from "libs/@fdd/errors";
import { knexSnakeCaseMappers } from "libs/@fdd/knex/snakecase";
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
  // const prodFormat = winston.format.json()

  // . Logger
  const logger = winston.createLogger({
    level: "debug",
    format: devFormat,
    defaultMeta: { service: "teleadmin-main-gql" },
    transports: [
      new winston.transports.Console(),
      // new winston.transports.File({ filename: 'error.log', level: 'error' }),
      // new winston.transports.File({ filename: 'combined.log' }),
    ],
  });

  // ENV const
  const getEnvOrThrowLogs = getEnvOrThrow(logger.error);

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
    ...knexSnakeCaseMappers(),
  });

  // . EDA
  const eventBusPersistorService = EventBusPersistorService.new({
    knex: pg
  });

  // . EDA
  const eventBus = EventBusInMemoryService.new({
    persistor: eventBusPersistorService,
    tx: false,
    onError: (e) => {
      logger.error(e);
    },
    log: logger.debug,
  });

  const [telegramClientRef, setTgClient] = initTgClient(pg, eventBus);

  const { parseSourcesJob } = initCronJobs(
    pg,
    logger,
    telegramClientRef,
    eventBus,
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
    eventBus,
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
