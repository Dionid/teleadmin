import { Command, CommandFactory } from "fdd-ts/cqrs";
import { EventBusService } from "fdd-ts/eda";
import { FullEvent } from "fdd-ts/eda/events";
import { PublicError, returnOnThrow } from "fdd-ts/errors";
import { NotEmptyString } from "functional-oriented-programming-ts/branded";
import { TelegramClientRef } from "libs/telegram-js/client";
import { PublicSourceAddedEvent } from "modules/main/command/handlers/add-public-source/events";
import {
  TgSource,
  TgSourceDS,
  TgSourceId,
  TgSourceTgId,
  TgSourceType,
} from "modules/main/command/projections/tg-source";
import { Api } from "telegram";

import Channel = Api.Channel;
import ChatFull = Api.messages.ChatFull;

export type AddPublicSourceCmd = Command<
  "AddPublicSourceCmd",
  {
    sourceName: NotEmptyString;
    sourceType: TgSourceType;
  }
>;
export const AddPublicSourceCmd =
  CommandFactory<AddPublicSourceCmd>("AddPublicSourceCmd");

export type AddPublicSourceCmdHandler = ReturnType<
  typeof AddPublicSourceCmdHandler
>;

const getChannelTitle = (channelResultOrErr: ChatFull): string => {
  const channelAdditionalInfo = channelResultOrErr.chats.find(
    (c) => c.id === channelResultOrErr.fullChat.id
  );

  if (channelAdditionalInfo instanceof Channel) {
    return channelAdditionalInfo.title;
  }

  return "";
};

const sourceWasDeleted = async (
  client: TelegramClientRef,
  tgSourceDS: TgSourceDS,
  eventBus: EventBusService,
  cmd: AddPublicSourceCmd,
  source: TgSource
) => {
  // TODO. If it was already deleted than we still can be in channel
  // . Join channel
  const resultOrErr = await returnOnThrow(() =>
    client.ref.invoke(
      new Api.channels.JoinChannel({
        channel: cmd.data.sourceName,
      })
    )
  );

  if (resultOrErr instanceof Error) {
    throw resultOrErr;
  }

  // . Get channel info
  const channelResultOrErr = await returnOnThrow(() =>
    client.ref.invoke(
      new Api.channels.GetFullChannel({
        channel: cmd.data.sourceName,
      })
    )
  );

  if (channelResultOrErr instanceof Error) {
    throw channelResultOrErr;
  }

  // . Create new source
  const updatedDeletedSource: TgSource = {
    ...source,
    updatedAt: new Date(),
    tgId: TgSourceTgId.ofNumber(channelResultOrErr.fullChat.id),
    tgName: NotEmptyString.ofString(cmd.data.sourceName),
    tgTitle: getChannelTitle(channelResultOrErr),
    deletedAt: null,
  };
  await tgSourceDS.update(updatedDeletedSource);

  // . Success
  const event = PublicSourceAddedEvent.create({
    id: updatedDeletedSource.id,
    tgId: updatedDeletedSource.tgId,
    tgName: updatedDeletedSource.tgName,
    wasDeleted: true,
  });
  eventBus.publish([
    FullEvent.fromCmdOrQuery({
      event,
      meta: cmd.meta,
    }),
  ]);
};

const sourceIsNew = async (
  client: TelegramClientRef,
  tgSourceDS: TgSourceDS,
  eventBus: EventBusService,
  cmd: AddPublicSourceCmd
) => {
  // . Join channel
  const resultOrErr = await returnOnThrow(() =>
    client.ref.invoke(
      new Api.channels.JoinChannel({
        channel: cmd.data.sourceName,
      })
    )
  );

  if (resultOrErr instanceof Error) {
    throw resultOrErr;
  }

  // . Get channel info
  const channelResultOrErr = await returnOnThrow(() =>
    client.ref.invoke(
      new Api.channels.GetFullChannel({
        channel: cmd.data.sourceName,
      })
    )
  );

  if (channelResultOrErr instanceof Error) {
    throw channelResultOrErr;
  }

  // TODO. Find source by id
  // ...

  // . Create new source
  const newSource: TgSource = {
    id: TgSourceId.new(),
    createdAt: new Date(),
    updatedAt: new Date(),
    tgId: TgSourceTgId.ofNumber(channelResultOrErr.fullChat.id),
    type: cmd.data.sourceType,
    tgName: NotEmptyString.ofString(cmd.data.sourceName),
    tgTitle: getChannelTitle(channelResultOrErr),
    deletedAt: null,
  };
  await tgSourceDS.create(newSource);

  // . Success
  const event = PublicSourceAddedEvent.create({
    id: newSource.id,
    tgId: newSource.tgId,
    tgName: newSource.tgName,
    wasDeleted: false,
  });
  eventBus.publish([
    FullEvent.fromCmdOrQuery({
      event,
      meta: cmd.meta,
    }),
  ]);
};

export const AddPublicSourceCmdHandler =
  (
    client: TelegramClientRef,
    eventBus: EventBusService,
    tgSourceDS: TgSourceDS
  ) =>
  async (cmd: AddPublicSourceCmd) => {
    // . Check if source like that doesn't exist
    const source = await tgSourceDS.findByName(cmd.data.sourceName);

    if (!source) {
      await sourceIsNew(client, tgSourceDS, eventBus, cmd);
    } else if (TgSource.wasDeleted(source)) {
      await sourceWasDeleted(client, tgSourceDS, eventBus, cmd, source);
    } else {
      throw new PublicError(
        `you already have source with tg name ${cmd.data.sourceName}`
      );
    }
  };
