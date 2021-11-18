import { CronSourcesParsingCompletedEvent } from "apps/main-gql/subs";
import { CronJob } from "cron";
import { EventBusService, FullEvent } from "fdd-ts/eda";
import { Knex } from "knex";
import { TelegramClientRef } from "libs/telegram-js/client";
import {
  ParseTgSourceParticipantsCmd,
  ParseTgSourceParticipantsCmdHandler,
} from "modules/main/command/handlers/parse-tg-source-participants";
import { MainModuleDS } from "modules/main/command/projections";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
import { Logger } from "winston";

export const initCronJobs = (
  knex: Knex,
  logger: Logger,
  telegramClientRef: TelegramClientRef,
  eventBus: EventBusService,
  ds: MainModuleDS
) => {
  const parseSourcesJob = new CronJob("5 0 * * *", async () => {
    const sources = await TgSourceDS.findAllNotDeleted(ds);
    await Promise.all(
      sources.map(async (source) => {
        logger.debug("SOURCE PARSING FIRED");
        const cmd: ParseTgSourceParticipantsCmd =
          ParseTgSourceParticipantsCmd.create(
            {
              sourceId: source.id,
            },
            { userId: null }
          ); // TODO. Change to server userid
        await knex.transaction(async (tx) => {
          await ParseTgSourceParticipantsCmdHandler(
            logger,
            telegramClientRef,
            eventBus,
            ds
          )(cmd);
        });
      })
    );
    await eventBus.publish([
      FullEvent.fromEvent({
        event: CronSourcesParsingCompletedEvent.create({}),
        userId: null, // TODO. Change to server userid
      }),
    ]);
  });

  logger.info(`Cron jobs setted up`);

  return {
    parseSourcesJob,
  };
};
