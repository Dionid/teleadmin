import { Command, CommandFactory } from "libs/@fdd/cqrs";
import { EventBus, FullEvent } from "libs/@fdd/eda";
import { InternalError, NotFoundError } from "libs/@fdd/errors";
import { checkIfMeIsChannelAdmin } from "libs/telegram-js/check-if-me-is-channel-admin";
import { TelegramClientRef } from "libs/telegram-js/client";
import { getAllChannelParticipants } from "libs/telegram-js/get-channel-partisipants";
import { TgSourceParticipantsParsedEvent } from "modules/main/command/handlers/parse-tg-source-participants/events";
import { markLeftParticipants } from "modules/main/command/handlers/parse-tg-source-participants/operations/mark-left-participants";
import {
  tgUserDoesntExist,
  tgUserExist,
} from "modules/main/command/handlers/parse-tg-source-participants/operations/user-presence";
import { TgSourceParticipantStatusDS } from "modules/main/command/projections/tg-participant-status";
import {
  TgSourceDS,
  TgSourceId,
} from "modules/main/command/projections/tg-source";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgSourceParticipantWithStatusDS } from "modules/main/command/projections/tg-source-participant-with-status";
import {
  TgUser,
  TgUserDS,
  TgUserTgId,
} from "modules/main/command/projections/tg-user";
import { Api } from "telegram";
import { Logger } from "winston";

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
  CommandFactory<ParseTgSourceParticipantsCmd>("ParseTgSourceParticipantsCmd");

const isUser =
  (logger: Logger) =>
  (u: TypeUser): u is User => {
    const val = u instanceof User;

    if (!val) {
      logger.warn(`Is not type User`, u);
    }

    return val;
  };

export type ParseTgSourceParticipantsCmdHandler =
  typeof ParseTgSourceParticipantsCmdHandler;

export const ParseTgSourceParticipantsCmdHandler =
  (
    logger: Logger,
    client: TelegramClientRef,
    eventBus: EventBus,
    tgUserDS: TgUserDS,
    tgSourceParticipantDS: TgSourceParticipantDS,
    tgSourceDS: TgSourceDS,
    tgSourceParticipantStatusDS: TgSourceParticipantStatusDS,
    tgSourceParticipantWithStatusDS: TgSourceParticipantWithStatusDS
  ) =>
  async (cmd: ParseTgSourceParticipantsCmd) => {
    // . Check that TgSource is exist
    const source = await tgSourceDS.findByIdAndNotDeleted(cmd.data.sourceId);

    if (!source) {
      throw new NotFoundError(
        `Source with tg id ${cmd.data.sourceId} not found`
      );
    }

    // . Check if homunculus is admin
    await checkIfMeIsChannelAdmin(client.ref, source.tgId);

    // . Get participants
    const tgAllParticipants = await getAllChannelParticipants(
      client.ref,
      source.tgId
    );

    if (!(tgAllParticipants instanceof ChannelParticipants)) {
      throw new InternalError(
        "Result of Api.channels.GetParticipants is not ChannelParticipants"
      );
    }

    // . Parse
    const tgUsers: TgUser[] = await Promise.all(
      tgAllParticipants.users.filter(isUser(logger)).map(async (user) => {
        const tgUser = await tgUserDS.findByTgId(TgUserTgId.ofString(user.id));

        if (!tgUser) {
          return await tgUserDoesntExist(
            tgUserDS,
            user,
            source.id,
            tgSourceParticipantDS,
            tgSourceParticipantStatusDS
          );
        }

        return await tgUserExist(
          tgUserDS,
          tgSourceParticipantWithStatusDS,
          tgSourceParticipantDS,
          tgSourceParticipantStatusDS,
          tgUser,
          user,
          source
        );
      })
    );

    // . Get all participants not in this list & status "Joined" | "Rejoined" -> "Left"
    await markLeftParticipants(
      tgSourceParticipantDS,
      tgSourceParticipantStatusDS,
      tgUsers,
      source
    );

    eventBus.publish([
      FullEvent.fromCmdOrQuery({
        event: TgSourceParticipantsParsedEvent.new({}),
        meta: cmd.meta,
      }),
    ]);
  };
