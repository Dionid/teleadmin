import { InternalError, NotFoundError, returnOnThrow } from "fdd-ts/errors";
import { Api, TelegramClient } from "telegram";

import ChannelParticipants = Api.channels.ChannelParticipants;
import PeerChannel = Api.PeerChannel;

export const getAllChannelParticipants = async (
  client: TelegramClient,
  sourceNameOrId: string | number,
  offset: number = 0,
  limit: number = 999999,
  aggregated?: ChannelParticipants
): Promise<Api.channels.TypeChannelParticipants> => {
  const resultOrErr = await returnOnThrow(() =>
    client.invoke(
      new Api.channels.GetParticipants({
        channel:
          typeof sourceNameOrId === "number"
            ? new PeerChannel({
                channelId: sourceNameOrId,
              })
            : sourceNameOrId,
        filter: new Api.ChannelParticipantsRecent(),
        limit,
        offset,
      })
    )
  );

  if (resultOrErr instanceof Error) {
    if (resultOrErr.message.includes("No user has")) {
      throw new NotFoundError(
        "Channel name is incorrect or yoy haven't added homunculus to private channel"
      );
    }

    throw resultOrErr;
  }

  if (resultOrErr instanceof ChannelParticipants) {
    if (aggregated) {
      resultOrErr.participants = resultOrErr.participants.concat(
        aggregated.participants
      );
      resultOrErr.users = resultOrErr.users.concat(aggregated.users);
      resultOrErr.chats = resultOrErr.chats.concat(aggregated.chats);
    }

    if (resultOrErr.participants.length < resultOrErr.count) {
      return getAllChannelParticipants(
        client,
        sourceNameOrId,
        resultOrErr.participants.length,
        limit,
        resultOrErr
      );
    }

    return resultOrErr;
  }

  throw new InternalError("Result in not instanceof ChannelParticipants");
};
