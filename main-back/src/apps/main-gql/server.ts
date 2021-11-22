import { CommandOrQuery, CommandQueryHandler } from "@fdd-node/core/cqrs";
import { EventBus } from "@fdd-node/core/eda";
import { InternalError, PermissionDeniedError } from "@fdd-node/core/errors";
import { Maybe, pipe } from "@fop-ts/core";
import { curry } from "@fop-ts/core/function/curry";
import { ApolloServer } from "apollo-server";
import { ApolloServerPlugin } from "apollo-server-plugin-base";
import { ResolversCtx } from "apps/main-gql/infra/gql/resolver-ctx";
import { schema } from "apps/main-gql/infra/gql/shema";
import { GraphQLError } from "graphql";
import { Context } from "libs/fdd-ts/context";
import { UserTable } from "libs/main-db/models";
import {
  GlobalContext,
  GlobalContextStorage,
} from "libs/teleadmin/contexts/global";
import { JWTToken } from "libs/teleadmin/jwt-token";
import { isAuthenticated } from "libs/teleadmin/permissions/cq/is-authenticated";
import { IsNotDemo } from "libs/teleadmin/permissions/cq/is-not-demo";
import { AuthenticateCmdHandler } from "modules/ia/command/handlers/authenticate";
import { CreateFirstAdminCmdHandler } from "modules/ia/command/handlers/create-first-admin";
import { CreateUserCmdHandler } from "modules/ia/command/handlers/create-user";
import { UserId } from "modules/ia/command/projections/user";
import { AddPrivateSourceCmdHandler } from "modules/main/command/handlers/add-private-source";
import { AddPublicSourceCmdHandler } from "modules/main/command/handlers/add-public-source";
import { CreateAndSetMainApplicationCmdHandler } from "modules/main/command/handlers/create-and-set-main-application";
import { CreateAndSetMasterHomunculusCmdHandler } from "modules/main/command/handlers/create-and-set-main-homunculus";
import { LeaveAndDeleteSourceCmdHandler } from "modules/main/command/handlers/leave-and-delete-source";
import { ParseTgSourceParticipantsCmdHandler } from "modules/main/command/handlers/parse-tg-source-participants";

export const initServer = (jwtSecret: string, passwordHashSalt: string) => {
  const storage = Context.getStoreOrThrowError(GlobalContext);

  return new ApolloServer({
    schema,
    context: async ({
      req,
    }): Promise<ResolversCtx | { token?: string; userId?: string }> => {
      const { logger } = Context.getStoreOrThrowError(GlobalContext);

      // . TX
      logger.debug("CREATING TX");
      const tx = await storage.knex.transaction();
      logger.debug("TX CREATED");

      // . AUTH_N
      const headerToken = req.headers.authorization;
      let reqUserId: Maybe<UserId> = null;

      if (headerToken) {
        const token = headerToken.split("Bearer ")[1];
        const decoded = JWTToken.verify(jwtSecret, token);
        const userId = UserId.ofString(decoded.sub);
        const user = await UserTable(tx).where({ id: userId }).first();

        if (!user) {
          throw new PermissionDeniedError(
            `User with UserID ${userId} not exist`
          );
        }

        reqUserId = userId;
      }

      // . EDA
      const txEventBus = await EventBus.tx(storage.eventBus);

      // . Global context
      const workflowContextStorage = GlobalContextStorage.create({
        ...storage,
        knex: tx,
        eventBus: txEventBus,
      });

      // . ASPECTS
      const contextAspect = <CQ extends CommandOrQuery<any, any>, R>(
        handler: CommandQueryHandler<CQ, R>
      ) => Context.runC2(GlobalContext, workflowContextStorage, handler);
      const isAuthenticatedAndNotDemoAspect = pipe(
        curry(IsNotDemo),
        isAuthenticated
      );

      // . COMMAND HANDLERS
      const createFirstAdmin = pipe(contextAspect)(CreateFirstAdminCmdHandler);

      const createUser = pipe(
        contextAspect,
        isAuthenticatedAndNotDemoAspect
      )(CreateUserCmdHandler);

      const authenticateCmdHandler = AuthenticateCmdHandler(jwtSecret);
      const createAndSetMainApplicationCmdHandler = pipe(
        contextAspect,
        isAuthenticatedAndNotDemoAspect
      )(CreateAndSetMainApplicationCmdHandler);

      const createAndSetMasterHomunculusCmdHandler = pipe(
        contextAspect,
        isAuthenticatedAndNotDemoAspect
      )(CreateAndSetMasterHomunculusCmdHandler);

      const addPublicSourceCmdHandler = pipe(
        contextAspect,
        isAuthenticatedAndNotDemoAspect
      )(AddPublicSourceCmdHandler);
      const addPrivateSourceCmdHandler = pipe(
        contextAspect,
        isAuthenticatedAndNotDemoAspect
      )(AddPrivateSourceCmdHandler);

      const parseTgSourceParticipantsCmdHandler = pipe(
        contextAspect,
        isAuthenticatedAndNotDemoAspect
      )(ParseTgSourceParticipantsCmdHandler);

      const leaveAndDeleteSourceCmdHandler = pipe(
        contextAspect,
        isAuthenticatedAndNotDemoAspect
      )(LeaveAndDeleteSourceCmdHandler);

      return {
        tx,
        userId: reqUserId,
        eventBus: txEventBus,
        modules: {
          main: {
            commands: {
              createAndSetMainApplicationCmdHandler,
              createAndSetMasterHomunculusCmdHandler,
              addPublicSourceCmdHandler,
              parseTgSourceParticipantsCmdHandler,
              addPrivateSourceCmdHandler,
              leaveAndDeleteSourceCmdHandler,
            },
          },
          authn: {
            passwordHashSalt,
            commands: {
              createFirstAdmin,
              createUser,
              authenticate: authenticateCmdHandler,
            },
          },
        },
      };
    },
    introspection: true,
    formatError: (err) => {
      // Don't give the specific errors to the client.
      if (err instanceof InternalError) {
        return new GraphQLError(err.message);
      }

      // Otherwise return the original error. The error can also
      // be manipulated in other ways, as long as it's returned.
      return err;
    },
    plugins: [
      {
        requestDidStart: async () => {
          return {
            willSendResponse: async (ctx) => {
              const { logger } = Context.getStoreOrThrowError(GlobalContext);

              if (ctx.errors && ctx.errors.length > 0) {
                return;
              }

              try {
                logger.debug("COMMITTING");
                await ctx.context.tx.commit();
                logger.debug("COMMITTED");
                await EventBus.commit(ctx.context.eventBus);
              } catch (e) {
                logger.error("willSendResponse", e);
                throw e;
              }
            },
            didEncounterErrors: async (ctx) => {
              const { logger } = Context.getStoreOrThrowError(GlobalContext);

              try {
                logger.debug("ROLLING");
                await ctx.context.tx.rollback();
                logger.debug("ROLLED");
                await EventBus.rollback(ctx.context.eventBus);
              } catch (e) {
                logger.error("didEncounterErrors", e);
                throw e;
              }
            },
          };
        },
      } as ApolloServerPlugin<ResolversCtx>,
    ],
  });
};
