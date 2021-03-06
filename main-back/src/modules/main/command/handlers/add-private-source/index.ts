import { Command, CommandBehavior } from "@fdd-node-ts/core/cqrs/command";
import { Event } from "@fdd-node-ts/core/eda/event";
import { EventBus } from "@fdd-node-ts/core/eda/event-bus";
import { FullEvent } from "@fdd-node-ts/core/eda/full-event";
import { PublicError, throwOnError } from "@fdd-node-ts/core/errors";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";
import { pipeAsync } from "@fop-ts/core/Pipe";
import { telegramClient } from "apps/main-gql/set-tg-client";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { getGullChannel } from "libs/telegram-js/get-full-channel";
import { joinChannel } from "libs/telegram-js/join-channel";
import { TgSourceInviteLinkHash } from "libs/telegram-js/types";
import { UserAlreadyInChannelError } from "modules/main/command/handlers/add-private-source/errors";
import { PrivateSourceAddedEvent } from "modules/main/command/handlers/add-private-source/events";
import {
  TgSource,
  TgSourceId,
  TgSourceTgId,
  TgSourceType,
} from "modules/main/command/projections/tg-source";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
import { Api } from "telegram";

import Channel = Api.Channel;
import Updates = Api.Updates;
import ChatFull = Api.messages.ChatFull;
import TypeChat = Api.TypeChat;

export type AddPrivateSourceCmd = Command<
  "AddPrivateSourceCmd",
  {
    sourceInviteLinkHash: TgSourceInviteLinkHash;
    sourceType: TgSourceType;
  }
>;
export const AddPrivateSourceCmd =
  CommandBehavior.createCurriedType<AddPrivateSourceCmd>("AddPrivateSourceCmd");

export type AddPrivateSourceCmdHandler = ReturnType<
  typeof AddPrivateSourceCmdHandler
>;

const checkThatUpdates = (result: Api.TypeUpdates) => {
  if (!(result instanceof Updates)) {
    throw new PublicError(
      "Result of Api.messages.ImportChatInvite is not type Updates"
    );
  }

  return result;
};

const getChannel = (channelResult: ChatFull): TypeChat | undefined => {
  return channelResult.chats.find((c) => c.id === channelResult.fullChat.id);
};

const getTgTitle = (channel: TypeChat | undefined): string => {
  return channel instanceof Channel ? channel.title : "";
};

const getTgName = (channel: TypeChat | undefined): NotEmptyString | null => {
  return channel instanceof Channel
    ? channel.username
      ? NotEmptyString.ofString(channel.username)
      : null
    : null;
};

const sourceHandler = async (
  sourceType: TgSourceType,
  channelResult: ChatFull,
  source: TgSource | undefined
): Promise<PrivateSourceAddedEvent> => {
  if (!source) {
    return await pipeAsync(TgSourceDS.create, (source: TgSource) => {
      return PrivateSourceAddedEvent.fromTgSource(source, false);
    })({
      id: TgSourceId.new(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tgId: TgSourceTgId.ofNumber(channelResult.fullChat.id),
      type: sourceType,
      tgName: getTgName(getChannel(channelResult)),
      tgTitle: getTgTitle(getChannel(channelResult)),
      deletedAt: null,
    });
  } else if (TgSource.wasDeleted(source)) {
    return await pipeAsync(TgSourceDS.update, (source: TgSource) => {
      return PrivateSourceAddedEvent.fromTgSource(source, true);
    })({
      ...source,
      updatedAt: new Date(),
      tgName: getTgName(getChannel(channelResult)),
      tgTitle: getTgTitle(getChannel(channelResult)),
      deletedAt: null,
    });
  } else {
    throw new PublicError(`You already have this source`);
  }
};

const createSource =
  (sourceType: TgSourceType) =>
  async (channelResult: ChatFull): Promise<PrivateSourceAddedEvent> => {
    return sourceHandler(
      sourceType,
      channelResult,
      await TgSourceDS.findByTgId(
        TgSourceTgId.ofNumber(channelResult.fullChat.id)
      )
    );
  };

const throwOnJoinChannelError = (resultOrErr: Api.TypeUpdates | Error) => {
  if (resultOrErr instanceof Error) {
    if (resultOrErr.message.includes("USER_ALREADY_PARTICIPANT")) {
      throw new UserAlreadyInChannelError();
    }

    throw resultOrErr;
  }

  return resultOrErr;
};

// . ATTENTION! There is 2 versions of logic, just for demo purpose
export const AddPrivateSourceCmdHandler = async (cmd: AddPrivateSourceCmd) => {
  const { eventBus } = Context.getStoreOrThrowError(GlobalContext);

  // .1. Pipe version
  await pipeAsync(
    joinChannel(telegramClient),
    throwOnJoinChannelError,
    checkThatUpdates,
    getGullChannel(telegramClient),
    throwOnError,
    createSource(cmd.data.sourceType),
    (event: Event<any, any, any>) => [
      FullEvent.ofCmdOrQuery({ event, meta: cmd.meta }),
    ],
    (events) => EventBus.publish(eventBus, events)
  )(cmd.data.sourceInviteLinkHash);

  // .2. Procedural version
  // // . Join channel
  // const resultOrErr = await returnOnThrow(() =>
  //   client.ref.invoke(
  //     new Api.messages.ImportChatInvite({
  //       hash: cmd.data.sourceInviteLinkHash,
  //     })
  //   )
  // );
  //
  // if (resultOrErr instanceof Error) {
  //   if (resultOrErr.message.includes("USER_ALREADY_PARTICIPANT")) {
  //     throw new UserAlreadyInChannelError();
  //   }
  //
  //   throw resultOrErr;
  // }
  //
  // if (!(resultOrErr instanceof Updates)) {
  //   throw new PublicError(
  //     "Result of Api.messages.ImportChatInvite is not type Updates"
  //   );
  // }
  //
  // // . Get channel info
  // const channelResultOrErr = await returnOnThrow(() =>
  //   client.ref.invoke(
  //     new Api.channels.GetFullChannel({
  //       channel: new PeerChannel({
  //         channelId: resultOrErr.chats[0].id,
  //       }),
  //     })
  //   )
  // );
  //
  // if (channelResultOrErr instanceof Error) {
  //   throw channelResultOrErr;
  // }
  //
  // let tgTitle = "";
  // let tgName: NotEmptyString | null = null;
  // const channelAdditionalInfo = channelResultOrErr.chats.find(
  //   (c) => c.id === channelResultOrErr.fullChat.id
  // );
  //
  // if (channelAdditionalInfo instanceof Channel) {
  //   tgTitle = channelAdditionalInfo.title;
  //   tgName = channelAdditionalInfo.username
  //     ? NotEmptyString.ofString(channelAdditionalInfo.username)
  //     : null;
  // }
  //
  // // . Check if source like that doesn't exist
  // const tgId = TgSourceTgId.ofNumber(channelResultOrErr.fullChat.id);
  //
  // const events: Array<Event<any, any, any>> = [];
  //
  // const source = await tgSourceDS.findByTgId(tgId);
  //
  // if (!source) {
  //   // . Create new source
  //   const newSource: TgSource = {
  //     id: TgSourceId.new(),
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     tgId: TgSourceTgId.ofNumber(channelResultOrErr.fullChat.id),
  //     type: cmd.data.sourceType,
  //     tgName,
  //     tgTitle,
  //     deletedAt: null,
  //   };
  //   await tgSourceDS.create(newSource);
  //
  //   // . Success
  //   events.push(
  //     PrivateSourceAddedEvent.new({
  //       id: newSource.id,
  //       tgId: newSource.tgId,
  //       tgName: newSource.tgName,
  //       wasDeleted: false,
  //     })
  //   );
  // } else if (TgSource.wasDeleted(source)) {
  //   // . Update deleted source
  //   const updatedSource: TgSource = {
  //     ...source,
  //     updatedAt: new Date(),
  //     tgName,
  //     tgTitle,
  //     deletedAt: null,
  //   };
  //   await tgSourceDS.update(updatedSource);
  //
  //   // . Success
  //   events.push(
  //     PrivateSourceAddedEvent.new({
  //       id: updatedSource.id,
  //       tgId: updatedSource.tgId,
  //       tgName: updatedSource.tgName,
  //       wasDeleted: true,
  //     })
  //   );
  // } else {
  //   throw new PublicError(`You already have this source`);
  // }
  //
  // eventBus.publish(
  //   events.map((event) =>
  //     FullEvent.ofCmdOrQuery({
  //       event,
  //       meta: cmd.meta,
  //     })
  //   )
  // );
};
