import * as KnexUtils from "@fdd-node-ts/core/knex-utils";
import knex, { Knex } from "knex";

import Logger = Knex.Logger;

export const initMainDbConnection = (
  connectionString: string,
  client: "pg",
  logger: Logger
): Knex => {
  return knex({
    client,
    debug: true,
    log: logger,
    connection: {
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    searchPath: ["knex", "public"],
    ...KnexUtils.knexSnakeCaseMappers(),
  });
};
