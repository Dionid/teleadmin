import { Command, CommandFactory } from "fdd-ts/cqrs";
import { NotFoundError } from "fdd-ts/errors";
import { TelegramClientRef } from "libs/telegram-js/client";
import { TgSourceId } from "modules/main/command/projections/tg-source";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
import { Api } from "telegram";

import PeerChannel = Api.PeerChannel;

export type LeaveAndDeleteSourceCmd = Command<
  "LeaveAndDeleteSourceCmd",
  {
    sourceId: TgSourceId;
  }
>;
export const LeaveAndDeleteSourceCmd = CommandFactory<LeaveAndDeleteSourceCmd>(
  "LeaveAndDeleteSourceCmd"
);

export const LeaveAndDeleteSourceCmdHandler =
  (client: TelegramClientRef, tgSourceDS: TgSourceDS) =>
  async (cmd: LeaveAndDeleteSourceCmd) => {
    // . Get source
    const source = await tgSourceDS.findByIdAndNotDeleted(cmd.data.sourceId);

    if (!source) {
      throw new NotFoundError(`Source not found`);
    }

    // . Leave source
    await client.ref.invoke(
      new Api.channels.LeaveChannel({
        channel: new PeerChannel({
          channelId: source.tgId,
        }),
      })
    );

    // . Delete source
    await tgSourceDS.delete(source);
  };
