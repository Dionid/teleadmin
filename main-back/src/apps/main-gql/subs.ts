import { TgClientConnectedEvent } from "apps/main-gql/set-tg-client";
import { CronJob } from "cron";
import { Event, EventBus, EventBehaviour } from "fdd-ts/eda";
import { NotFoundError } from "fdd-ts/errors";
import { Knex } from "knex";
import { TelegramClientRef } from "libs/telegram-js/client";
import {
  ParseInfoAboutHomunculusCmd,
  ParseInfoAboutHomunculusCmdHandler,
} from "modules/main/command/handlers/parse-info-about-homunculus";
import { AuthTokenToHomunculusSetEvent } from "modules/main/command/handlers/set-authtoken-to-homunculus/events";
import { Logger } from "winston";

export type CronSourcesParsingCompletedEvent = Event<
  "CronSourcesParsingCompletedEvent",
  "v1",
  Record<any, any>
>;
export const CronSourcesParsingCompletedEvent =
  EventBehaviour.create<CronSourcesParsingCompletedEvent>(
    "CronSourcesParsingCompletedEvent",
    "v1"
  );

export const subscribeOnEvents = (
  logger: Logger,
  eventBus: EventBus,
  knex: Knex,
  setTgClient: () => void,
  clientRef: TelegramClientRef,
  job: CronJob
) => {
  EventBus.subscribe<TgClientConnectedEvent>(
    eventBus,
    TgClientConnectedEvent.type,
    async (event) => {
      await knex.transaction(async (tx) => {
        await ParseInfoAboutHomunculusCmdHandler(clientRef, {
          knex: tx,
          logger,
        })(ParseInfoAboutHomunculusCmd.create({}, { userId: null }));
      });
      job.start();
    }
  );
  EventBus.subscribe<AuthTokenToHomunculusSetEvent>(
    eventBus,
    "AuthTokenToHomunculusSetEvent",
    async (event) => {
      try {
        await setTgClient();
      } catch (e) {
        if (e instanceof NotFoundError) {
          logger.error(e);
        } else {
          throw e;
        }
      }
    }
  );
};
