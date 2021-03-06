import { PermissionDeniedError } from "@fdd-node-ts/core/errors";
import { Maybe } from "@fop-ts/core/Types";
import { ResolverFn } from "apps/main-gql/infra/gql/gqlgen-types";
import { UserId } from "modules/ia/command/projections/user";

export const isAuthenticated =
  <TResult, TParent, TContext extends { userId: Maybe<UserId> }, TArgs>(
    handler: ResolverFn<TResult, TParent, TContext, TArgs>
  ): ResolverFn<TResult, TParent, TContext, TArgs> =>
  (parent, args, ctx, info) => {
    if (!ctx.userId) {
      throw new PermissionDeniedError(`You must be authenticated`);
    }

    return handler(parent, args, ctx, info);
  };
