import { Command, CommandFactory } from "fdd-ts/cqrs";
import { CriticalError } from "fdd-ts/errors";
import { TelegramClientRef } from "libs/telegram-js/client";
import { MainModuleDS } from "modules/main/command/projections";
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
  (clientRef: TelegramClientRef, ds: MainModuleDS) =>
  async (cmd: ParseInfoAboutHomunculusCmd) => {
    // . Get homunculus info
    const me = await clientRef.ref.getMe();

    if (!(me instanceof Api.User)) {
      throw new CriticalError("Information about homunculus is not User type");
    }

    const homunculus = await TgUserDS.findByTgId(
      ds,
      TgUserTgId.ofString(me.id)
    );

    // . Create homunculus if not exists
    if (!homunculus) {
      const newHomunculus: TgUser = TgUser.createFromTgApiUser(me);
      await TgUserDS.create(ds, newHomunculus);

      return;
    }

    // . Update homunculus if exist
    const updatedHomunculus: TgUser = TgUser.mergeWithTgApiUser(homunculus, me);
    await TgUserDS.update(ds, updatedHomunculus);
  };
