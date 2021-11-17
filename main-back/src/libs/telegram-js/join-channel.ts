import { returnOnThrow } from "fdd-ts/errors";
import { TgSourceInviteLinkHash } from "libs/telegram-js/types";
import { Api, TelegramClient } from "telegram";

import TypeUpdate = Api.TypeUpdate;

export const joinChannel =
  (client: TelegramClient) =>
  (
    sourceInviteLinkHash: TgSourceInviteLinkHash
  ): Promise<TypeUpdate | Error> => {
    return returnOnThrow(() =>
      client.invoke(
        new Api.messages.ImportChatInvite({
          hash: sourceInviteLinkHash,
        })
      )
    );
  };
