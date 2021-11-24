import { Command, CommandBehavior } from "@fdd-node-ts/core/cqrs/command";
import { EventBus } from "@fdd-node-ts/core/eda/event-bus";
import { FullEvent } from "@fdd-node-ts/core/eda/full-event";
import { PublicError, returnOnThrow } from "@fdd-node-ts/core/errors";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";
import { telegramClient } from "apps/main-gql/set-tg-client";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { PublicSourceAddedEvent } from "modules/main/command/handlers/add-public-source/events";
import {
  TgSource,
  TgSourceId,
  TgSourceTgId,
  TgSourceType,
} from "modules/main/command/projections/tg-source";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
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
  CommandBehavior.createCurriedType<AddPublicSourceCmd>("AddPublicSourceCmd");

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

const sourceWasDeleted = async (cmd: AddPublicSourceCmd, source: TgSource) => {
  const { eventBus } = Context.getStoreOrThrowError(GlobalContext);

  // TODO. If it was already deleted than we still can be in channel
  // . Join channel
  const resultOrErr = await returnOnThrow(() =>
    telegramClient.invoke(
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
    telegramClient.invoke(
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
  await TgSourceDS.update(updatedDeletedSource);

  // . Success
  const event = PublicSourceAddedEvent.create({
    id: updatedDeletedSource.id,
    tgId: updatedDeletedSource.tgId,
    tgName: updatedDeletedSource.tgName,
    wasDeleted: true,
  });
  EventBus.publish(eventBus, [
    FullEvent.ofCmdOrQuery({
      event,
      meta: cmd.meta,
    }),
  ]);
};

const sourceIsNew = async (cmd: AddPublicSourceCmd) => {
  const { eventBus } = Context.getStoreOrThrowError(GlobalContext);

  // . Join channel
  const resultOrErr = await returnOnThrow(() =>
    telegramClient.invoke(
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
    telegramClient.invoke(
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
  await TgSourceDS.create(newSource);

  // . Success
  const event = PublicSourceAddedEvent.create({
    id: newSource.id,
    tgId: newSource.tgId,
    tgName: newSource.tgName,
    wasDeleted: false,
  });
  EventBus.publish(eventBus, [
    FullEvent.ofCmdOrQuery({
      event,
      meta: cmd.meta,
    }),
  ]);
};

export const AddPublicSourceCmdHandler = async (cmd: AddPublicSourceCmd) => {
  // . Check if source like that doesn't exist
  const source = await TgSourceDS.findByName(cmd.data.sourceName);

  if (!source) {
    await sourceIsNew(cmd);
  } else if (TgSource.wasDeleted(source)) {
    await sourceWasDeleted(cmd, source);
  } else {
    throw new PublicError(
      `you already have source with tg name ${cmd.data.sourceName}`
    );
  }
};
