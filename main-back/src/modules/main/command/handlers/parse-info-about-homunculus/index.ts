import { Command, CommandBehaviorFactory } from "@fdd-node/core/cqrs";
import { CriticalError } from "@fdd-node/core/errors";
import { telegramClient } from "apps/main-gql/set-tg-client";
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
  CommandBehaviorFactory<ParseInfoAboutHomunculusCmd>(
    "ParseInfoAboutHomunculusCmd"
  );

export const ParseInfoAboutHomunculusCmdHandler = async (
  cmd: ParseInfoAboutHomunculusCmd
) => {
  // . Get homunculus info
  const me = await telegramClient.getMe();

  if (!(me instanceof Api.User)) {
    throw new CriticalError("Information about homunculus is not User type");
  }

  const homunculus = await TgUserDS.findByTgId(TgUserTgId.ofString(me.id));

  // . Create homunculus if not exists
  if (!homunculus) {
    const newHomunculus: TgUser = TgUser.createFromTgApiUser(me);
    await TgUserDS.create(newHomunculus);

    return;
  }

  // . Update homunculus if exist
  const updatedHomunculus: TgUser = TgUser.mergeWithTgApiUser(homunculus, me);
  await TgUserDS.update(updatedHomunculus);
};
