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
import { appLogger } from "libs/teleadmin/deps/logger";
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
      // . TX
      appLogger.debug("CREATING TX");
      const tx = await storage.knex.transaction();
      appLogger.debug("TX CREATED");

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
      const isAuthenticatedAndNotDemoAspect = pipe(
        curry(IsNotDemo),
        isAuthenticated
      );

      // . COMMAND HANDLERS
      const createFirstAdmin = CreateFirstAdminCmdHandler;

      const createUser = pipe(isAuthenticatedAndNotDemoAspect)(
        CreateUserCmdHandler
      );

      const authenticateCmdHandler = AuthenticateCmdHandler(jwtSecret);
      const createAndSetMainApplicationCmdHandler = pipe(
        isAuthenticatedAndNotDemoAspect
      )(CreateAndSetMainApplicationCmdHandler);

      const createAndSetMasterHomunculusCmdHandler = pipe(
        isAuthenticatedAndNotDemoAspect
      )(CreateAndSetMasterHomunculusCmdHandler);

      const addPublicSourceCmdHandler = pipe(isAuthenticatedAndNotDemoAspect)(
        AddPublicSourceCmdHandler
      );
      const addPrivateSourceCmdHandler = pipe(
        isAuthenticatedAndNotDemoAspect,
        Context.runC3(GlobalContext, workflowContextStorage)
      )(AddPrivateSourceCmdHandler);

      const parseTgSourceParticipantsCmdHandler = pipe(
        isAuthenticatedAndNotDemoAspect
      )(ParseTgSourceParticipantsCmdHandler);
      const leaveAndDeleteSourceCmdHandler = pipe(
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
              if (ctx.errors && ctx.errors.length > 0) {
                return;
              }

              try {
                appLogger.debug("COMMITTING");
                await ctx.context.tx.commit();
                appLogger.debug("COMMITTED");
                await EventBus.commit(ctx.context.eventBus);
              } catch (e) {
                appLogger.error(e);
                throw e;
              }
            },
            didEncounterErrors: async (ctx) => {
              try {
                appLogger.debug("ROLLING");
                await ctx.context.tx.rollback();
                appLogger.debug("ROLLED");
                await EventBus.rollback(ctx.context.eventBus);
              } catch (e) {
                appLogger.error(e);
                throw e;
              }
            },
          };
        },
      } as ApolloServerPlugin<ResolversCtx>,
    ],
  });
};
