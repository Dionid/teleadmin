import { createTgParticipant } from "modules/main/command/handlers/parse-tg-source-participants/operations/create-tg-participant";
import {
  tgUserIsNotParticipant,
  tgUserIsParticipant,
} from "modules/main/command/handlers/parse-tg-source-participants/operations/tg-user-participants";
import { MainModuleDS } from "modules/main/command/projections";
import {
  TgSource,
  TgSourceId,
} from "modules/main/command/projections/tg-source";
import { TgSourceParticipantWithStatusDS } from "modules/main/command/projections/tg-source-participant-with-status";
import { TgUser, TgUserDS } from "modules/main/command/projections/tg-user";
import { Api } from "telegram";

export const tgUserExist = async (
  ds: MainModuleDS,
  tgUser: TgUser,
  user: Api.User,
  source: TgSource
) => {
  // . Update its info
  const updatedTgUser: TgUser = TgUser.mergeWithTgApiUser(tgUser, user);
  await TgUserDS.update(ds, updatedTgUser);

  // . Get Status
  const tgSourceParticipantWithStatus =
    await TgSourceParticipantWithStatusDS.findByTgUserIdAndTgSourceId(
      ds,
      tgUser.id,
      source.id
    );

  // . If was not a participant -> "Joined"
  if (!tgSourceParticipantWithStatus.participant) {
    await tgUserIsNotParticipant(ds, tgUser, source);
  } else {
    await tgUserIsParticipant(ds, tgSourceParticipantWithStatus);
  }

  return tgUser;
};

export const tgUserDoesntExist = async (
  ds: MainModuleDS,
  user: Api.User,
  sourceId: TgSourceId
) => {
  // . Create TgUser
  const tgUser = TgUser.createFromTgApiUser(user);
  await TgUserDS.create(ds, tgUser, true);

  // . Create TgParticipant for TgUser
  await createTgParticipant(ds, sourceId, tgUser.id);

  return tgUser;
};
