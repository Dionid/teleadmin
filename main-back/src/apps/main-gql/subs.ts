import { TgClientConnectedEvent } from "apps/main-gql/set-tg-client";
import { CronJob } from "cron";
import { Event, EventBusService, EventFactory } from "fdd-ts/eda";
import { NotFoundError } from "fdd-ts/errors";
import { Knex } from "knex";
import { TelegramClientRef } from "libs/telegram-js/client";
import {
  ParseInfoAboutHomunculusCmd,
  ParseInfoAboutHomunculusCmdHandler,
} from "modules/main/command/handlers/parse-info-about-homunculus";
import { AuthTokenToHomunculusSet } from "modules/main/command/handlers/set-authtoken-to-homunculus/events";
import { TgUserDS } from "modules/main/command/projections/tg-user";
import { Logger } from "winston";

export type CronSourcesParsingCompletedEvent = Event<
  "CronSourcesParsingCompletedEvent",
  "v1",
  Record<any, any>
>;
export const CronSourcesParsingCompletedEvent =
  EventFactory.new<CronSourcesParsingCompletedEvent>(
    "CronSourcesParsingCompletedEvent",
    "v1"
  );

export const subscribeOnEvents = (
  logger: Logger,
  eventBus: EventBusService,
  knex: Knex,
  setTgClient: () => void,
  clientRef: TelegramClientRef,
  job: CronJob
) => {
  eventBus.subscribe<TgClientConnectedEvent>(
    TgClientConnectedEvent.type,
    async (event) => {
      await knex.transaction(async (tx) => {
        await ParseInfoAboutHomunculusCmdHandler(
          clientRef,
          TgUserDS(tx)
        )(ParseInfoAboutHomunculusCmd.new({}, { userId: null }));
      });
      job.start();
    }
  );
  eventBus.subscribe<AuthTokenToHomunculusSet>(
    "AuthTokenToHomunculusSet",
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
