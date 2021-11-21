import { Command, CommandBehaviorFactory } from "@fdd-node/core/cqrs";
import { NotFoundError } from "@fdd-node/core/errors";
import { telegramClient } from "apps/main-gql/set-tg-client";
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
export const LeaveAndDeleteSourceCmd =
  CommandBehaviorFactory<LeaveAndDeleteSourceCmd>("LeaveAndDeleteSourceCmd");

export const LeaveAndDeleteSourceCmdHandler = async (
  cmd: LeaveAndDeleteSourceCmd
) => {
  // . Get source
  const source = await TgSourceDS.findByIdAndNotDeleted(cmd.data.sourceId);

  if (!source) {
    throw new NotFoundError(`Source not found`);
  }

  // . Leave source
  await telegramClient.invoke(
    new Api.channels.LeaveChannel({
      channel: new PeerChannel({
        channelId: source.tgId,
      }),
    })
  );

  // . Delete source
  await TgSourceDS.remove(source);
};
