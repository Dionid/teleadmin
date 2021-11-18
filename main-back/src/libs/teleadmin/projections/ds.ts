import { Knex } from "knex";
import { Logger } from "winston";

export type KnexDS = {
  knex: Knex;
};

export type LoggerDS = {
  logger: Logger;
};

export type BaseDS = KnexDS & LoggerDS;
