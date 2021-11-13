import { TgSourceResolvers } from "apps/main-gql/infra/gql/gqlgen-types";
import { ResolversCtx } from "apps/main-gql/infra/gql/resolver-ctx";
import { countToNumber } from "libs/@fdd/knex/fns";
import { TgSourceParticipantTable } from "libs/main-db/models";

export const TgSourceQuery: TgSourceResolvers<ResolversCtx> = {
  participants: async (parent, args, context) => {
    return TgSourceParticipantTable(context.tx)
      .where({ tgSourceId: parent.id })
      .select();
  },
  participantsAggregate: async (parent, args, context) => {
    const nodes = await TgSourceParticipantTable(context.tx)
      .where({ tgSourceId: parent.id })
      .select();

    const res = await TgSourceParticipantTable(context.tx)
      .where({ tgSourceId: parent.id })
      .count({ count: "*" });

    const count = countToNumber(res[0].count);

    return {
      aggregate: {
        count,
      },
      nodes,
    };
  },
};
