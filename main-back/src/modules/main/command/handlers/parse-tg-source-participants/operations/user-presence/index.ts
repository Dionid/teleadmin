import { createTgParticipant } from "modules/main/command/handlers/parse-tg-source-participants/operations/create-tg-participant";
import {
  tgUserIsNotParticipant,
  tgUserIsParticipant,
} from "modules/main/command/handlers/parse-tg-source-participants/operations/tg-user-participants";
import {
  TgSource,
  TgSourceId,
} from "modules/main/command/projections/tg-source";
import { TgSourceParticipantWithStatusDS } from "modules/main/command/projections/tg-source-participant-with-status";
import { TgUser, TgUserDS } from "modules/main/command/projections/tg-user";
import { Api } from "telegram";

export const tgUserExist = async (
  tgUser: TgUser,
  user: Api.User,
  source: TgSource
) => {
  // . Update its info
  const updatedTgUser: TgUser = TgUser.mergeWithTgApiUser(tgUser, user);
  await TgUserDS.update(updatedTgUser);

  // . Get Status
  const tgSourceParticipantWithStatus =
    await TgSourceParticipantWithStatusDS.findByTgUserIdAndTgSourceId(
      tgUser.id,
      source.id
    );

  // . If was not a participant -> "Joined"
  if (!tgSourceParticipantWithStatus.participant) {
    await tgUserIsNotParticipant(tgUser, source);
  } else {
    await tgUserIsParticipant(tgSourceParticipantWithStatus);
  }

  return tgUser;
};

export const tgUserDoesntExist = async (
  user: Api.User,
  sourceId: TgSourceId
) => {
  // . Create TgUser
  const tgUser = TgUser.createFromTgApiUser(user);
  await TgUserDS.create(tgUser, true);

  // . Create TgParticipant for TgUser
  await createTgParticipant(sourceId, tgUser.id);

  return tgUser;
};
