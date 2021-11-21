import * as KnexUtils from "@fdd-node/core/knex-utils";
import knex, { Knex } from "knex";

import Logger = Knex.Logger;

export let mainDbConnection: Knex;

export const initMainDbConnection = (
  connectionString: string,
  client: "pg",
  logger: Logger
): Knex => {
  mainDbConnection = knex({
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

  return mainDbConnection;
};
