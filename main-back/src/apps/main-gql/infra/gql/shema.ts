import "graphql-import-node";
import { typeDefs } from "apps/main-gql/infra/gql/type-defs";
import { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "graphql-tools";

import { resolvers } from "./resolver-map";

const schema: GraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export { schema };
