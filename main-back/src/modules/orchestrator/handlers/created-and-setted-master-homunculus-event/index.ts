import { Event, FullEvent, EventBus } from "fdd-ts/eda";
import { CriticalError } from "fdd-ts/errors";
import { NotEmptyString } from "functional-oriented-programming-ts/branded";
import { Knex } from "knex";
import { TgApplicationTable } from "libs/main-db/models";
import { CreatedAndSettedMasterHomunculusEvent } from "modules/main/command/handlers/create-and-set-main-homunculus";
import {
  SetAuthTokenToHomunculusCmd,
  SetAuthTokenToHomunculusCmdHandler,
} from "modules/main/command/handlers/set-authtoken-to-homunculus";
import {
  TgHomunculusDS,
  TgHomunculusPhone,
} from "modules/main/command/projections/tg-homunculus";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Logger } from "winston";

export type HomunculusPhoneCodeReceived = Event<
  "HomunculusPhoneCodeReceived",
  "v1",
  {
    phone: TgHomunculusPhone;
    code: string;
  }
>;

export const initCreatedAndSettedMasterHomunculusEventHandler = (
  logger: Logger,
  eventBus: EventBus,
  knex: Knex
) => {
  EventBus.subscribe<CreatedAndSettedMasterHomunculusEvent>(
    eventBus,
    CreatedAndSettedMasterHomunculusEvent.type,
    async (event) => {
      // . Get TgApp.apiId and tgApp.apiHash
      const result = await TgApplicationTable(knex)
        .where({ main: true })
        .select("appId", "appHash");
      const mainApp = result[0];

      if (!mainApp) {
        throw new CriticalError("No main app");
      }

      const stringSession = new StringSession("");

      const client = new TelegramClient(
        stringSession,
        parseInt(mainApp.appId),
        mainApp.appHash,
        {
          connectionRetries: 5,
        }
      );

      await client.start({
        phoneNumber: event.data.phone,
        phoneCode: async () => {
          logger.debug("Waiting for code");

          for await (const e of EventBus.observe<
            FullEvent<HomunculusPhoneCodeReceived>
          >(eventBus, "HomunculusPhoneCodeReceived")) {
            logger.debug("HomunculusPhoneCodeReceived EVENT RECEIVED", e.data);

            if (e.data.data.phone === event.data.phone) {
              e.stop();

              return e.data.data.code;
            }
          }

          throw new Error("No code received");
        },
        onError: (err) => {
          throw err;
        },
      });

      logger.info("You should now be connected.");

      const authToken = client.session.save() as unknown as NotEmptyString;

      await knex.transaction(async (tx) => {
        await SetAuthTokenToHomunculusCmdHandler(
          TgHomunculusDS({
            knex: tx,
          }),
          eventBus
        )(
          SetAuthTokenToHomunculusCmd.create(
            {
              phone: event.data.phone,
              authToken,
            },
            { userId: null }
          )
        );
      });
    }
  );
};
