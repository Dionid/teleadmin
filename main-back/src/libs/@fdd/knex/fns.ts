import { pipe } from "functional-oriented-programming-ts";
import { Knex } from "knex";

export type Count = string | number | undefined;

export const countToNumber = (count: string | number | undefined): number => {
  return count ? +count : 0;
};

export const countMoreThanZero = (count: Count): boolean => {
  return !!count && +count > 0;
};

export const selectQuery = <Q extends Knex.QueryBuilder>(q: Q): Q => {
  return q.select() as Q;
};

export const mapCount = (result: Array<{ count?: Count }>) => {
  return result[0].count;
};

export const mapCountToNumber = pipe(mapCount, countToNumber);
