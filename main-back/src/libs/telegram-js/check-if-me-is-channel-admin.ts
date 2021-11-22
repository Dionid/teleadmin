import {
  InternalError,
  NotFoundError,
  PermissionDeniedError,
  PublicError,
  returnOnThrow,
} from "@fdd-node/core/errors";
import { TgSourceTgId } from "modules/main/command/projections/tg-source";
import { Api, TelegramClient } from "telegram";

import ChannelParticipants = Api.channels.ChannelParticipants;
import ChannelParticipantAdmin = Api.ChannelParticipantAdmin;
import PeerChannel = Api.PeerChannel;

export const checkIfMeIsChannelAdmin = async (
  client: TelegramClient,
  sourceNameOrId: string | TgSourceTgId
) => {
  // . Check if admin
  const resultOrErr = await returnOnThrow(() =>
    client.invoke(
      new Api.channels.GetParticipants({
        channel:
          typeof sourceNameOrId === "number"
            ? new PeerChannel({
                channelId: sourceNameOrId,
              })
            : sourceNameOrId,
        filter: new Api.ChannelParticipantsAdmins(),
      })
    )
  );

  if (resultOrErr instanceof Error) {
    if (resultOrErr.message.includes("No user has")) {
      throw new NotFoundError(
        "Channel name is incorrect or yoy haven't added homunculus to private channel"
      );
    }

    if (resultOrErr.message.includes("CHAT_ADMIN_REQUIRED")) {
      throw new PermissionDeniedError("Homunculus must be admin");
    }

    throw resultOrErr;
  }

  // . Understand that homunculus is admin
  if (resultOrErr instanceof ChannelParticipants) {
    const homunclusIsAdmin = resultOrErr.participants.some((participant) => {
      if (participant instanceof ChannelParticipantAdmin) {
        return participant.self;
      }

      return false;
    });

    if (!homunclusIsAdmin) {
      throw new PublicError("Homunculus must be admin");
    }
  } else {
    throw new InternalError(
      `Result of Api.channels.GetParticipants is not ChannelParticipants ${resultOrErr}`
    );
  }
};
