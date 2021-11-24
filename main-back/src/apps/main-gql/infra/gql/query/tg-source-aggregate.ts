import { mapCommonSearchParamsToQuery } from "@fdd-node-ts/core/apollo-knex";
import { mapCountToNumber } from "@fdd-node-ts/core/knex-utils";
import { TgSourceAggregateResolvers } from "apps/main-gql/infra/gql/gqlgen-types";
import { mapTgSource } from "apps/main-gql/infra/gql/mappers";
import { ResolversCtx } from "apps/main-gql/infra/gql/resolver-ctx";
import { getQueryFields } from "libs/apollo/query-fields";
import { TgSourceTable } from "libs/main-db/models";

export const TgSourceAggregateQuery: TgSourceAggregateResolvers<ResolversCtx> =
  {
    aggregate: async (parent, args, context, info) => {
      const parsedFields = getQueryFields(info.fieldNodes);
      let count = 0;

      if (parsedFields.count) {
        const countRes = await mapCommonSearchParamsToQuery(args)(
          TgSourceTable(context.tx)
            .where({ deletedAt: null })
            .count({ count: "*" })
        );
        count = mapCountToNumber(countRes);
      }

      return {
        count,
      };
    },
    nodes: async (parent, args, context, info) => {
      const nodes = await mapCommonSearchParamsToQuery(args)(
        TgSourceTable(context.tx).where({ deletedAt: null })
      );

      return nodes.map(mapTgSource);
    },
  };
