import {
  Event,
  EventBus,
  EventBehaviourFactory,
  FullEvent,
} from "@fdd-node/core/eda";
import { NotFoundError } from "@fdd-node/core/errors";
import { Knex } from "knex";
import { TgApplicationTable, TgHomunculusTable } from "libs/main-db/models";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export type TgClientConnectedEvent = Event<
  "TgClientConnectedEvent",
  "v1",
  Record<any, any>
>;
export const TgClientConnectedEvent =
  EventBehaviourFactory.create<TgClientConnectedEvent>(
    "TgClientConnectedEvent",
    "v1"
  );

export let telegramClient: TelegramClient;

export const initTgClient = async (
  knex: Knex,
  eventBus: EventBus
): Promise<TelegramClient> => {
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
