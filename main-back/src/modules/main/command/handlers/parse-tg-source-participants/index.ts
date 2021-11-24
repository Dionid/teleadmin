import { Command, CommandBehavior } from "@fdd-node/core/cqrs/command";
import { EventBus } from "@fdd-node/core/eda/event-bus";
import { FullEvent } from "@fdd-node/core/eda/full-event";
import { InternalError, NotFoundError } from "@fdd-node/core/errors";
import { telegramClient } from "apps/main-gql/set-tg-client";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { checkIfMeIsChannelAdmin } from "libs/telegram-js/check-if-me-is-channel-admin";
import { getAllChannelParticipants } from "libs/telegram-js/get-channel-partisipants";
import { TgSourceParticipantsParsedEvent } from "modules/main/command/handlers/parse-tg-source-participants/events";
import { markLeftParticipants } from "modules/main/command/handlers/parse-tg-source-participants/operations/mark-left-participants";
import {
  tgUserDoesntExist,
  tgUserExist,
} from "modules/main/command/handlers/parse-tg-source-participants/operations/user-presence";
import { TgSourceId } from "modules/main/command/projections/tg-source";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
import {
  TgUser,
  TgUserDS,
  TgUserTgId,
} from "modules/main/command/projections/tg-user";
import { Api } from "telegram";

import User = Api.User;
import ChannelParticipants = Api.channels.ChannelParticipants;
import TypeUser = Api.TypeUser;

export type ParseTgSourceParticipantsCmd = Command<
  "ParseTgSourceParticipantsCmd",
  {
    sourceId: TgSourceId;
  }
>;
export const ParseTgSourceParticipantsCmd =
  CommandBehavior.createCurriedType<ParseTgSourceParticipantsCmd>(
    "ParseTgSourceParticipantsCmd"
  );

const isUser = (u: TypeUser): u is User => {
  const { logger } = Context.getStoreOrThrowError(GlobalContext);

  const val = u instanceof User;

  if (!val) {
    logger.warn(`Is not type User`, u);
  }

  return val;
};

export type ParseTgSourceParticipantsCmdHandler =
  typeof ParseTgSourceParticipantsCmdHandler;

export const ParseTgSourceParticipantsCmdHandler = async (
  cmd: ParseTgSourceParticipantsCmd
) => {
  const { eventBus } = Context.getStoreOrThrowError(GlobalContext);
  // . Check that TgSource is exist
  const source = await TgSourceDS.findByIdAndNotDeleted(cmd.data.sourceId);

  if (!source) {
    throw new NotFoundError(`Source with tg id ${cmd.data.sourceId} not found`);
  }

  // . Check if homunculus is admin
  await checkIfMeIsChannelAdmin(telegramClient, source.tgId);

  // . Get participants
  const tgAllParticipants = await getAllChannelParticipants(
    telegramClient,
    source.tgId
  );

  if (!(tgAllParticipants instanceof ChannelParticipants)) {
    throw new InternalError(
      "Result of Api.channels.GetParticipants is not ChannelParticipants"
    );
  }

  // . Parse
  const tgUsers: TgUser[] = await Promise.all(
    tgAllParticipants.users.filter(isUser).map(async (user) => {
      const tgUser = await TgUserDS.findByTgId(TgUserTgId.ofString(user.id));

      if (!tgUser) {
        return await tgUserDoesntExist(user, source.id);
      }

      return await tgUserExist(tgUser, user, source);
    })
  );

  // . Get all participants not in this list & status "Joined" | "Rejoined" -> "Left"
  await markLeftParticipants(tgUsers, source);

  EventBus.publish(eventBus, [
    FullEvent.ofCmdOrQuery({
      event: TgSourceParticipantsParsedEvent.create({}),
      meta: cmd.meta,
    }),
  ]);
};
