import { Command, CommandFactory } from "fdd-ts/cqrs";
import { EventBusService } from "fdd-ts/eda";
import { FullEvent } from "fdd-ts/eda/events";
import { InternalError, NotFoundError } from "fdd-ts/errors";
import { checkIfMeIsChannelAdmin } from "libs/telegram-js/check-if-me-is-channel-admin";
import { TelegramClientRef } from "libs/telegram-js/client";
import { getAllChannelParticipants } from "libs/telegram-js/get-channel-partisipants";
import { TgSourceParticipantsParsedEvent } from "modules/main/command/handlers/parse-tg-source-participants/events";
import { markLeftParticipants } from "modules/main/command/handlers/parse-tg-source-participants/operations/mark-left-participants";
import {
  tgUserDoesntExist,
  tgUserExist,
} from "modules/main/command/handlers/parse-tg-source-participants/operations/user-presence";
import { MainModuleDS } from "modules/main/command/projections";
import { TgSourceId } from "modules/main/command/projections/tg-source";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
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
    eventBus: EventBusService,
    ds: MainModuleDS
  ) =>
  async (cmd: ParseTgSourceParticipantsCmd) => {
    // . Check that TgSource is exist
    const source = await TgSourceDS.findByIdAndNotDeleted(
      ds,
      cmd.data.sourceId
    );

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
        const tgUser = await TgUserDS.findByTgId(
          ds,
          TgUserTgId.ofString(user.id)
        );

        if (!tgUser) {
          return await tgUserDoesntExist(ds, user, source.id);
        }

        return await tgUserExist(ds, tgUser, user, source);
      })
    );

    // . Get all participants not in this list & status "Joined" | "Rejoined" -> "Left"
    await markLeftParticipants(ds, tgUsers, source);

    eventBus.publish([
      FullEvent.fromCmdOrQuery({
        event: TgSourceParticipantsParsedEvent.create({}),
        meta: cmd.meta,
      }),
    ]);
  };
