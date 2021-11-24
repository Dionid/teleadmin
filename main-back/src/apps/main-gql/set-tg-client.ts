import { Event, EventBehavior } from "@fdd-node-ts/core/eda/event";
import { EventBus } from "@fdd-node-ts/core/eda/event-bus";
import { FullEvent } from "@fdd-node-ts/core/eda/full-event";
import { NotFoundError } from "@fdd-node-ts/core/errors";
import { Context } from "libs/fdd-ts/context";
import { TgApplicationTable, TgHomunculusTable } from "libs/main-db/models";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export type TgClientConnectedEvent = Event<
  "TgClientConnectedEvent",
  "v1",
  Record<any, any>
>;
export const TgClientConnectedEvent =
  EventBehavior.createCurriedNameVersion<TgClientConnectedEvent>(
    "TgClientConnectedEvent",
    "v1"
  );

export let telegramClient: TelegramClient;

export const initTgClient = async (): Promise<TelegramClient> => {
  const { knex, eventBus } = Context.getStoreOrThrowError(GlobalContext);

  // . Get TgApp.apiId and tgApp.apiHash
  const result = await TgApplicationTable(knex)
    .where({ main: true })
    .select("appId", "appHash");
  const mainApp = result[0];

  if (!mainApp) {
    throw new NotFoundError("No main app");
  }

  const homunculusRes = await TgHomunculusTable(knex)
    .where({ master: true })
    .select("authToken");
  const homunculus = homunculusRes[0];

  if (!homunculus) {
    throw new NotFoundError("No master homunculus");
  }

  if (!homunculus.authToken) {
    throw new NotFoundError("No auth token on master homunculus");
  }

  const stringSession = new StringSession(homunculus.authToken);

  telegramClient = new TelegramClient(
    stringSession,
    parseInt(mainApp.appId),
    mainApp.appHash,
    {
      connectionRetries: 5,
    }
  );

  await telegramClient.connect();

  EventBus.publish(eventBus, [
    FullEvent.ofEvent({
      event: TgClientConnectedEvent.create({}),
      userId: null,
    }),
  ]);

  return telegramClient;
};

// export const initTgClient = (
//   knex: Knex,
// ): [{ ref: TelegramClient }, () => void] => {
//   const telegramClient: { ref: TelegramClient } = {
//     ref: new TelegramClient(new StringSession(""), 111, "qwewe", {}),
//   };
//
//   const setTgClient = async () => {
//     // . Get TgApp.apiId and tgApp.apiHash
//     const result = await TgApplicationTable(knex)
//       .where({ main: true })
//       .select("appId", "appHash");
//     const mainApp = result[0];
//
//     if (!mainApp) {
//       throw new NotFoundError("No main app");
//     }
//
//     const homunculusRes = await TgHomunculusTable(knex)
//       .where({ master: true })
//       .select("authToken");
//     const homunculus = homunculusRes[0];
//
//     if (!homunculus) {
//       throw new NotFoundError("No master homunculus");
//     }
//
//     if (!homunculus.authToken) {
//       throw new NotFoundError("No auth token on master homunculus");
//     }
//
//     const stringSession = new StringSession(homunculus.authToken);
//
//     telegramClient.ref = new TelegramClient(
//       stringSession,
//       parseInt(mainApp.appId),
//       mainApp.appHash,
//       {
//         connectionRetries: 5,
//       }
//     );
//
//     await telegramClient.ref.connect();
//
//     EventBus.publish(eventBus, [
//       FullEvent.ofEvent({
//         event: TgClientConnectedEvent.create({}),
//         userId: null,
//       }),
//     ]);
//   };
//
//   return [telegramClient, setTgClient];
// };
