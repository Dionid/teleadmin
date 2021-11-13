import { TgSourceParticipantResolvers } from "apps/main-gql/infra/gql/gqlgen-types";
import { ResolversCtx } from "apps/main-gql/infra/gql/resolver-ctx";
import {
  TgSourceParticipantStatusTable,
  TgUserTable,
} from "libs/main-db/models";

export const TgSourceParticipantQuery: TgSourceParticipantResolvers<ResolversCtx> =
  {
    lastStatus: async (parent, args, context) => {
      const res = await TgSourceParticipantStatusTable(context.tx)
        .where({
          tgSourceParticipantId: parent.id,
        })
        .orderBy("createdAt", "desc")
        .select("type")
        .first();

      return res ? res.type : null;
    },
    tgUser: async (parent, args, context) => {
      const user = await TgUserTable(context.tx)
        .where({ id: parent.tgUserId })
        .first();

      return user
        ? {
            ...user,
            tgPhotoId: user.tgPhotoId + "",
          }
        : null;
    },
  };
