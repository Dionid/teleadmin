import { QueryResolvers } from "apps/main-gql/infra/gql/gqlgen-types";
import { mapTgSource, mapTgUser } from "apps/main-gql/infra/gql/mappers";
import { ResolversCtx } from "apps/main-gql/infra/gql/resolver-ctx";
import { mapArray } from "functional-oriented-programming-ts";
import { mapCommonSearchParamsToQuery } from "libs/@fdd/apollo-knex/query";
import { mapCountToNumber } from "libs/@fdd/knex/fns";
import { getQueryFields } from "libs/apollo/query-fields";
import {
  TgSourceParticipantStatusTable,
  TgSourceParticipantStatusTableName,
  TgSourceParticipantTable,
  TgSourceParticipantTableName,
  TgSourceTable,
  TgUserTable,
} from "libs/main-db/models";
import { TgUser } from "libs/main-db/schemats-schema";
import { isAuthenticated } from "libs/teleadmin/permissions/gql/is-authenticated";

export const Query: QueryResolvers<ResolversCtx> = {
  tgSource: isAuthenticated(async (parent, args, context) => {
    const res = await mapCommonSearchParamsToQuery(args)(
      TgSourceTable(context.tx).where({ deletedAt: null })
    );

    return res.map(mapTgSource);
  }),
  tgSourceAggregate: isAuthenticated(async (parent, args, context, info) => {
    // . MOVED TO TgSourceAggregateQuery
    // const parsedFields = getQueryFields(info.fieldNodes);
    // let count = 0;
    // let nodes: TgSource[] = [];
    //
    // if (parsedFields.aggregate) {
    //   if (parsedFields.aggregate.subFields?.count) {
    //     const countRes = await mapCommonSearchParamsToQuery(args)(
    //       TgSourceTable(context.tx)
    //         .where({ deletedAt: null })
    //         .count({ count: "*" })
    //     );
    //     count = mapCountToNumber(countRes);
    //   }
    //
    //   if (parsedFields.nodes) {
    //     nodes = await mapCommonSearchParamsToQuery(args)(
    //       TgSourceTable(context.tx).where({ deletedAt: null })
    //     );
    //   }
    // }

    return {
      aggregate: {
        count: 0,
      },
      nodes: [],
    };
  }),
  tgSourceByPK: isAuthenticated(async (parent, args, context) => {
    const res = await TgSourceTable(context.tx).where({ id: args.id }).first();

    return res ? mapTgSource(res) : null;
  }),
  tgUser: isAuthenticated(async (parent, args, context) => {
    return mapArray(mapTgUser)(
      await mapCommonSearchParamsToQuery(args)(TgUserTable(context.tx))
    );
  }),
  tgUserAggregate: isAuthenticated(async (parent, args, context, info) => {
    const parsedFields = getQueryFields(info.fieldNodes);
    let count = 0;
    let nodes: TgUser[] = [];

    if (parsedFields.aggregate) {
      if (parsedFields.aggregate.subFields?.count) {
        const countRes = await mapCommonSearchParamsToQuery(args)(
          TgUserTable(context.tx).count({ count: "*" })
        );
        count = mapCountToNumber(countRes);
      }

      if (parsedFields.nodes) {
        nodes = await mapCommonSearchParamsToQuery(args)(
          TgUserTable(context.tx)
        );
      }
    }

    return {
      aggregate: {
        count,
      },
      nodes: mapArray(mapTgUser)(nodes),
    };
  }),
  tgUserByPk: isAuthenticated(async (parent, args, context, info) => {
    const res = await TgUserTable(context.tx).where({ id: args.id }).first();

    return res ? mapTgUser(res) : null;
  }),
  tgParticipantsAnalytics: isAuthenticated(
    async (parent, args, context, info) => {
      const participantStatuses = await TgSourceParticipantStatusTable(
        context.tx
      )
        .whereBetween("createdAt", [args.from, args.to])
        .whereExists(
          TgSourceParticipantTable(context.tx)
            .where("tgSourceId", args.sourceId)
            .where(
              context.tx.raw(
                // TODO. Make constants
                `${TgSourceParticipantStatusTableName}."tg_source_participant_id" = ${TgSourceParticipantTableName}."id"`
              )
            )
        );

      const tgSourceParticipants = await TgSourceParticipantTable(
        context.tx
      ).whereIn(
        "id",
        participantStatuses.map((status) => status.tgSourceParticipantId)
      );

      const tgUsersWithId = await TgUserTable(context.tx)
        .whereIn(
          "id",
          TgSourceParticipantTable(context.tx)
            .whereIn(
              "id",
              tgSourceParticipants.map((status) => status.id)
            )
            .select("tgUserId")
        )
        .select("id");

      return participantStatuses.reduce<{
        leftUserIds: string[];
        joinedUserIds: string[];
        rejoinedUserIds: string[];
      }>(
        (agg, cur) => {
          const user = tgUsersWithId.find((user) => {
            return tgSourceParticipants.some(
              (participant) => participant.tgUserId === user.id
            );
          });

          if (user) {
            switch (cur.type) {
              case "Left":
                agg.leftUserIds.push(user.id);
                break;
              case "Joined":
                agg.joinedUserIds.push(user.id);
                break;
              case "Rejoined":
                agg.rejoinedUserIds.push(user.id);
                break;
            }
          }

          return agg;
        },
        {
          leftUserIds: [],
          joinedUserIds: [],
          rejoinedUserIds: [],
        }
      );
    }
  ),
};
