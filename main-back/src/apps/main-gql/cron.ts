import { EventBus, FullEvent } from "@fdd-node/core/eda";
import { CronSourcesParsingCompletedEvent } from "apps/main-gql/subs";
import { CronJob } from "cron";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { appLogger } from "libs/teleadmin/deps/logger";
import {
  ParseTgSourceParticipantsCmd,
  ParseTgSourceParticipantsCmdHandler,
} from "modules/main/command/handlers/parse-tg-source-participants";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";

export const initCronJobs = () => {
  const storage = Context.getStoreOrThrowError(GlobalContext);
  const parseSourcesJob = new CronJob("5 0 * * *", async () => {
    const sources = await TgSourceDS.findAllNotDeleted();
    await Promise.all(
      sources.map(async (source) => {
        appLogger.debug("SOURCE PARSING FIRED");
        const cmd: ParseTgSourceParticipantsCmd =
          ParseTgSourceParticipantsCmd.create(
            {
              sourceId: source.id,
            },
            { userId: null }
          ); // TODO. Change to server userid
        await storage.knex.transaction(async (tx) => {
          await Context.run(
            GlobalContext,
            {
              ...storage,
              knex: tx,
            },
            async () => {
              await ParseTgSourceParticipantsCmdHandler(cmd);
            }
          );
        });
      })
    );
    await EventBus.publish(storage.eventBus, [
      FullEvent.ofEvent({
        event: CronSourcesParsingCompletedEvent.create({}),
        userId: null, // TODO. Change to server userid
      }),
    ]);
  });

  appLogger.info(`Cron jobs setted up`);

  return {
    parseSourcesJob,
  };
};
