import { returnOnThrow } from "libs/@fdd/errors";
import { Api, TelegramClient } from "telegram";

import PeerChannel = Api.PeerChannel;
import Updates = Api.Updates;

export const getGullChannel = (client: TelegramClient) => (result: Updates) => {
  return returnOnThrow(() =>
    client.invoke(
      new Api.channels.GetFullChannel({
        channel: new PeerChannel({
          channelId: result.chats[0].id,
        }),
      })
    )
  );
};
