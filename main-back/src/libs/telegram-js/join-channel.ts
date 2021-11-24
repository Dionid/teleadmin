import { returnOnThrow } from "@fdd-node-ts/core/errors";
import { TgSourceInviteLinkHash } from "libs/telegram-js/types";
import { Api, TelegramClient } from "telegram";

import TypeUpdates = Api.TypeUpdates;

export const joinChannel =
  (client: TelegramClient) =>
  (
    sourceInviteLinkHash: TgSourceInviteLinkHash
  ): Promise<TypeUpdates | Error> => {
    return returnOnThrow(() =>
      client.invoke(
        new Api.messages.ImportChatInvite({
          hash: sourceInviteLinkHash,
        })
      )
    );
  };
