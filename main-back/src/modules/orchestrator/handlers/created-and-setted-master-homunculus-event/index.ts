import { Event, FullEvent, EventBus } from "@fdd-node/core/eda";
import { CriticalError } from "@fdd-node/core/errors";
import { NotEmptyString } from "@fop-ts/core/branded";
import { Context } from "libs/fdd-ts/context";
import { TgApplicationTable } from "libs/main-db/models";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { CreatedAndSettedMasterHomunculusEvent } from "modules/main/command/handlers/create-and-set-main-homunculus";
import {
  SetAuthTokenToHomunculusCmd,
  SetAuthTokenToHomunculusCmdHandler,
} from "modules/main/command/handlers/set-authtoken-to-homunculus";
import { TgHomunculusPhone } from "modules/main/command/projections/tg-homunculus";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export type HomunculusPhoneCodeReceived = Event<
  "HomunculusPhoneCodeReceived",
  "v1",
  {
    phone: TgHomunculusPhone;
    code: string;
  }
>;

export const initCreatedAndSettedMasterHomunculusEventHandler = () => {
  const storage = Context.getStoreOrThrowError(GlobalContext);
  EventBus.subscribe<CreatedAndSettedMasterHomunculusEvent>(
    storage.eventBus,
    CreatedAndSettedMasterHomunculusEvent.name(),
    async (event) => {
      // . Get TgApp.apiId and tgApp.apiHash
      const result = await TgApplicationTable(storage.knex)
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
          storage.logger.debug("Waiting for code");

          for await (const e of EventBus.observe<
            FullEvent<HomunculusPhoneCodeReceived>
          >(storage.eventBus, "HomunculusPhoneCodeReceived")) {
            storage.logger.debug(
              "HomunculusPhoneCodeReceived EVENT RECEIVED",
              e.data
            );

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

      storage.logger.info("You should now be connected.");

      const authToken = client.session.save() as unknown as NotEmptyString;

      await storage.knex.transaction(async (tx) => {
        await Context.run(
          GlobalContext,
          {
            ...storage,
            knex: tx,
          },
          async () => {
            await SetAuthTokenToHomunculusCmdHandler(
              SetAuthTokenToHomunculusCmd.create(
                {
                  phone: event.data.phone,
                  authToken,
                },
                { userId: null }
              )
            );
          }
        );
      });
    }
  );
};
