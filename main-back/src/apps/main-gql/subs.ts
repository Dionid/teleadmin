import { Event, EventBehavior } from "@fdd-node/core/eda/event";
import { EventBus } from "@fdd-node/core/eda/event-bus";
import { NotFoundError } from "@fdd-node/core/errors";
import {
  initTgClient,
  TgClientConnectedEvent,
} from "apps/main-gql/set-tg-client";
import { CronJob } from "cron";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import {
  ParseInfoAboutHomunculusCmd,
  ParseInfoAboutHomunculusCmdHandler,
} from "modules/main/command/handlers/parse-info-about-homunculus";
import { AuthTokenToHomunculusSetEvent } from "modules/main/command/handlers/set-authtoken-to-homunculus/events";

export type CronSourcesParsingCompletedEvent = Event<
  "CronSourcesParsingCompletedEvent",
  "v1",
  Record<any, any>
>;
export const CronSourcesParsingCompletedEvent =
  EventBehavior.createCurriedNameVersion<CronSourcesParsingCompletedEvent>(
    "CronSourcesParsingCompletedEvent",
    "v1"
  );

export const initSubsscribesOnEvents = (job: CronJob) => {
  const storage = Context.getStoreOrThrowError(GlobalContext);
  EventBus.subscribe<TgClientConnectedEvent>(
    storage.eventBus,
    TgClientConnectedEvent.name(),
    async (event) => {
      await storage.knex.transaction(async (tx) => {
        await Context.run(
          GlobalContext,
          {
            ...storage,
            knex: tx,
          },
          async () => {
            await ParseInfoAboutHomunculusCmdHandler(
              ParseInfoAboutHomunculusCmd.create({}, { userId: null })
            );
          }
        );
      });
      job.start();
    }
  );
  EventBus.subscribe<AuthTokenToHomunculusSetEvent>(
    storage.eventBus,
    "AuthTokenToHomunculusSetEvent",
    async (event) => {
      try {
        await initTgClient();
      } catch (e) {
        if (e instanceof NotFoundError) {
          storage.logger.error(e);
        } else {
          throw e;
        }
      }
    }
  );
};
