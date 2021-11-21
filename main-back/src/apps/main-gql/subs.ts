import { Event, EventBus, EventBehaviourFactory } from "@fdd-node/core/eda";
import { NotFoundError } from "@fdd-node/core/errors";
import {
  initTgClient,
  TgClientConnectedEvent,
} from "apps/main-gql/set-tg-client";
import { CronJob } from "cron";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { appLogger } from "libs/teleadmin/deps/logger";
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
  EventBehaviourFactory.create<CronSourcesParsingCompletedEvent>(
    "CronSourcesParsingCompletedEvent",
    "v1"
  );

export const subscribeOnEvents = (job: CronJob) => {
  const storage = Context.getStoreOrThrowError(GlobalContext);
  EventBus.subscribe<TgClientConnectedEvent>(
    storage.eventBus,
    TgClientConnectedEvent.name(),
    async (event) => {
      await storage.knex.transaction(async (tx) => {
        Context.run(
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
        await initTgClient(storage.knex, storage.eventBus);
      } catch (e) {
        if (e instanceof NotFoundError) {
          appLogger.error(e);
        } else {
          throw e;
        }
      }
    }
  );
};
