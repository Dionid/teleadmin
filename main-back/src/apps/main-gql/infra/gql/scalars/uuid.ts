import { ValidationError } from "@fdd-node-ts/core/errors";
import { GraphQLScalarType, Kind } from "graphql";
import { validate } from "uuid";

export const uuidScalar = new GraphQLScalarType({
  name: "UUID",
  description: "UUID custom scalar type",
  serialize(value: any) {
    return value; // Convert outgoing Date to integer for JSON
  },
  parseValue(value: any) {
    if (!validate(value)) {
      throw new ValidationError(`${value} is not uuid`);
    }

    return value; // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING && validate(ast.value)) {
      return ast.value; // Convert hard-coded AST string to integer and then to Date
    }

    return null; // Invalid hard-coded value (not an string)
  },
});
