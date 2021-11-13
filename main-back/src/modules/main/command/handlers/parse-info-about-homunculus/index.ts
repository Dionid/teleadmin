import { Command, CommandFactory } from "libs/@fdd/cqrs";
import { CriticalError } from "libs/@fdd/errors";
import { TelegramClientRef } from "libs/telegram-js/client";
import {
  TgUser,
  TgUserDS,
  TgUserTgId,
} from "modules/main/command/projections/tg-user";
import { Api } from "telegram";

export type ParseInfoAboutHomunculusCmd = Command<
  "ParseInfoAboutHomunculusCmd",
  Record<any, any>
>;
export const ParseInfoAboutHomunculusCmd =
  CommandFactory<ParseInfoAboutHomunculusCmd>("ParseInfoAboutHomunculusCmd");

export const ParseInfoAboutHomunculusCmdHandler =
  (clientRef: TelegramClientRef, tgUserDS: TgUserDS) =>
  async (cmd: ParseInfoAboutHomunculusCmd) => {
    // . Get homunculus info
    const me = await clientRef.ref.getMe();

    if (!(me instanceof Api.User)) {
      throw new CriticalError("Information about homunculus is not User type");
    }

    const homunculus = await tgUserDS.findByTgId(TgUserTgId.ofString(me.id));

    // . Create homunculus if not exists
    if (!homunculus) {
      const newHomunculus: TgUser = TgUser.newFromTgApiUser(me);
      await tgUserDS.create(newHomunculus);

      return;
    }

    // . Update homunculus if exist
    const updatedHomunculus: TgUser = TgUser.mergeWithTgApiUser(homunculus, me);
    await tgUserDS.update(updatedHomunculus);
  };
