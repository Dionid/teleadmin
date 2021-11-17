import { Knex } from "knex";
import { EventBusService} from "libs/@fdd/eda";
import {Event, EventFactory, FullEvent} from "libs/@fdd/eda/events";
import { NotFoundError } from "libs/@fdd/errors";
import { TgApplicationTable, TgHomunculusTable } from "libs/main-db/models";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export type TgClientConnectedEvent = Event<
  "TgClientConnectedEvent",
  "v1",
  Record<any, any>
>;
export const TgClientConnectedEvent = EventFactory<TgClientConnectedEvent>(
  "TgClientConnectedEvent",
  "v1"
);

export const initTgClient = (
  knex: Knex,
  eventBus: EventBusService,
): [{ ref: TelegramClient }, () => void] => {
  const telegramClient: { ref: TelegramClient } = {
    ref: new TelegramClient(new StringSession(""), 111, "qwewe", {}),
  };

  const setTgClient = async () => {
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

    telegramClient.ref = new TelegramClient(
      stringSession,
      parseInt(mainApp.appId),
      mainApp.appHash,
      {
        connectionRetries: 5,
      }
    );

    await telegramClient.ref.connect();

    await eventBus.publish(
      [
        FullEvent.fromEvent({
          event: TgClientConnectedEvent.new({}),
          userId: null,
        }),
      ]
    )
  };

  return [telegramClient, setTgClient];
};
