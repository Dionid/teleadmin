import { Resolvers } from "apps/main-gql/infra/gql/gqlgen-types";
import { Mutation } from "apps/main-gql/infra/gql/mutation";
import { Query } from "apps/main-gql/infra/gql/query";
import { TgSourceQuery } from "apps/main-gql/infra/gql/query/tg-source";
import { TgSourceAggregateQuery } from "apps/main-gql/infra/gql/query/tg-source-aggregate";
import { TgSourceParticipantQuery } from "apps/main-gql/infra/gql/query/tg-source-participant";
import { ResolversCtx } from "apps/main-gql/infra/gql/resolver-ctx";
import { uuidScalar } from "apps/main-gql/infra/gql/scalars/uuid";

export const resolvers: Resolvers<ResolversCtx> = {
  UUID: uuidScalar,
  TgSourceParticipant: TgSourceParticipantQuery,
  TgSource: TgSourceQuery,
  Query,
  TgSourceAggregate: TgSourceAggregateQuery,
  Mutation,
};
