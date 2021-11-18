import { CronSourcesParsingCompletedEvent } from "apps/main-gql/subs";
import { CronJob } from "cron";
import { EventBusService, FullEvent } from "fdd-ts/eda";
import { Knex } from "knex";
import { TelegramClientRef } from "libs/telegram-js/client";
import {
  ParseTgSourceParticipantsCmd,
  ParseTgSourceParticipantsCmdHandler,
} from "modules/main/command/handlers/parse-tg-source-participants";
import { TgSourceParticipantStatusDS } from "modules/main/command/projections/tg-participant-status";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgSourceParticipantWithStatusDS } from "modules/main/command/projections/tg-source-participant-with-status";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
import { TgUserDS } from "modules/main/command/projections/tg-user";
import { Logger } from "winston";

export const initCronJobs = (
  knex: Knex,
  logger: Logger,
  telegramClientRef: TelegramClientRef,
  eventBus: EventBusService
) => {
  const parseSourcesJob = new CronJob("5 0 * * *", async () => {
    const sources = await TgSourceDS(knex).findAllNotDeleted();
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
          const tgSourceParticipantStatusDS = TgSourceParticipantStatusDS(tx);
          const tgSourceParticipantDS = TgSourceParticipantDS(tx);

          await ParseTgSourceParticipantsCmdHandler(
            logger,
            telegramClientRef,
            eventBus,
            TgUserDS(tx),
            tgSourceParticipantDS,
            TgSourceDS(tx),
            tgSourceParticipantStatusDS,
            TgSourceParticipantWithStatusDS(
              tx,
              tgSourceParticipantDS,
              tgSourceParticipantStatusDS
            )
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
