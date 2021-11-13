import { createTgParticipant } from "modules/main/command/handlers/parse-tg-source-participants/operations/create-tg-participant";
import {
  tgUserIsNotParticipant,
  tgUserIsParticipant,
} from "modules/main/command/handlers/parse-tg-source-participants/operations/tg-user-participants";
import { TgSourceParticipantStatusDS } from "modules/main/command/projections/tg-participant-status";
import {
  TgSource,
  TgSourceId,
} from "modules/main/command/projections/tg-source";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgSourceParticipantWithStatusDS } from "modules/main/command/projections/tg-source-participant-with-status";
import { TgUser, TgUserDS } from "modules/main/command/projections/tg-user";
import { Api } from "telegram";

export const tgUserExist = async (
  tgUserDS: TgUserDS,
  tgSourceParticipantWithStatusDS: TgSourceParticipantWithStatusDS,
  tgSourceParticipantDS: TgSourceParticipantDS,
  tgSourceParticipantStatusDS: TgSourceParticipantStatusDS,

  tgUser: TgUser,
  user: Api.User,
  source: TgSource
) => {
  // . Update its info
  const updatedTgUser: TgUser = TgUser.mergeWithTgApiUser(tgUser, user);
  await tgUserDS.update(updatedTgUser);

  // . Get Status
  const tgSourceParticipantWithStatus =
    await tgSourceParticipantWithStatusDS.findByTgUserIdAndTgSourceId(
      tgUser.id,
      source.id
    );

  // . If was not a participant -> "Joined"
  if (!tgSourceParticipantWithStatus.participant) {
    await tgUserIsNotParticipant(
      tgSourceParticipantDS,
      tgSourceParticipantStatusDS,
      tgUser,
      source
    );
  } else {
    await tgUserIsParticipant(
      tgSourceParticipantStatusDS,
      tgSourceParticipantWithStatus
    );
  }

  return tgUser;
};

export const tgUserDoesntExist = async (
  tgUserDS: TgUserDS,
  user: Api.User,
  sourceId: TgSourceId,
  tgSourceParticipantDS: TgSourceParticipantDS,
  tgSourceParticipantStatusDS: TgSourceParticipantStatusDS
) => {
  // . Create TgUser
  const tgUser = TgUser.newFromTgApiUser(user);
  await tgUserDS.create(tgUser, true);

  // . Create TgParticipant for TgUser
  await createTgParticipant(
    sourceId,
    tgUser.id,
    tgSourceParticipantDS,
    tgSourceParticipantStatusDS
  );

  return tgUser;
};
