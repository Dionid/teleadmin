import { ApolloServer } from "apollo-server";
import { ApolloServerPlugin } from "apollo-server-plugin-base";
import { ResolversCtx } from "apps/main-gql/infra/gql/resolver-ctx";
import { schema } from "apps/main-gql/infra/gql/shema";
import { Maybe, pipeAsync } from "functional-oriented-programming-ts";
import { GraphQLError } from "graphql";
import { Knex } from "knex";
import { EventBus } from "libs/@fdd/eda";
import { InternalError, PermissionDeniedError } from "libs/@fdd/errors";
import { UserTable } from "libs/main-db/models";
import { JWTToken } from "libs/teleadmin/jwt-token";
import { isAuthenticated } from "libs/teleadmin/permissions/cq/is-authenticated";
import { IsNotDemo } from "libs/teleadmin/permissions/cq/is-not-demo";
import { TelegramClientRef } from "libs/telegram-js/client";
import { AuthenticateCmdHandler } from "modules/ia/command/handlers/authenticate";
import { CreateFirstAdminCmdHandler } from "modules/ia/command/handlers/create-first-admin";
import { CreateUserCmdHandler } from "modules/ia/command/handlers/create-user";
import { UserDS, UserId } from "modules/ia/command/projections/user";
import { AddPrivateSourceCmdHandler } from "modules/main/command/handlers/add-private-source";
import { AddPublicSourceCmdHandler } from "modules/main/command/handlers/add-public-source";
import { CreateAndSetMainApplicationCmdHandler } from "modules/main/command/handlers/create-and-set-main-application";
import { CreateAndSetMasterHomunculusCmdHandler } from "modules/main/command/handlers/create-and-set-main-homunculus";
import { LeaveAndDeleteSourceCmdHandler } from "modules/main/command/handlers/leave-and-delete-source";
import { ParseTgSourceParticipantsCmdHandler } from "modules/main/command/handlers/parse-tg-source-participants";
import { TgApplicationDS } from "modules/main/command/projections/tg-application";
import { TgHomunculusDS } from "modules/main/command/projections/tg-homunculus";
import { TgSourceParticipantStatusDS } from "modules/main/command/projections/tg-participant-status";
import { TgSourceDS } from "modules/main/command/projections/tg-source";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgSourceParticipantWithStatusDS } from "modules/main/command/projections/tg-source-participant-with-status";
import { TgUserDS } from "modules/main/command/projections/tg-user";
import { Logger } from "winston";

export const initServer = (
  logger: Logger,
  eventBus: EventBus,
  knex: Knex,
  telegramClient: TelegramClientRef,
  jwtSecret: string,
  passwordHashSalt: string
) => {
  return new ApolloServer({
    schema,
    context: async ({
      req,
    }): Promise<ResolversCtx | { token?: string; userId?: string }> => {
      // . TX
      logger.debug("CREATING TX");
      const tx = await knex.transaction();
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
      const txEventBus = eventBus.tx();

      // . DS
      const tgApplicationDS = TgApplicationDS(tx);
      const homunculusDS = TgHomunculusDS({
        knex: tx,
      });
      const tgSourceDS = TgSourceDS(tx);
      const tgUserDS = TgUserDS(tx);
      const tgSourceParticipantDS = TgSourceParticipantDS(tx);
      const tgSourceParticipantStatusDS = TgSourceParticipantStatusDS(tx);
      const tgSourceParticipantWithStatusDS = TgSourceParticipantWithStatusDS(
        tx,
        tgSourceParticipantDS,
        tgSourceParticipantStatusDS
      );
      const userDS = UserDS(tx);

      // . ASPECTS
      const isAuthenticatedAndNotDemoAspect = pipeAsync(
        isAuthenticated,
        IsNotDemo(tx)
      );

      // . COMMAND HANDLERS
      const createFirstAdmin = CreateFirstAdminCmdHandler(userDS);
      const createUser = pipeAsync(
        isAuthenticatedAndNotDemoAspect,
        CreateUserCmdHandler(userDS)
      );
      const authenticate = AuthenticateCmdHandler(jwtSecret, userDS);
      const createAndSetMainApplicationCmdHandler = pipeAsync(
        isAuthenticatedAndNotDemoAspect,
        CreateAndSetMainApplicationCmdHandler(tgApplicationDS)
      );

      const createAndSetMasterHomunculusCmdHandler = pipeAsync(
        isAuthenticatedAndNotDemoAspect,
        CreateAndSetMasterHomunculusCmdHandler(homunculusDS, txEventBus)
      );

      const addPublicSourceCmdHandler = pipeAsync(
        isAuthenticatedAndNotDemoAspect,
        AddPublicSourceCmdHandler(telegramClient, txEventBus, tgSourceDS)
      );
      const addPrivateSourceCmdHandler = pipeAsync(
        isAuthenticatedAndNotDemoAspect,
        AddPrivateSourceCmdHandler(telegramClient, txEventBus, tgSourceDS)
      );
      const parseTgSourceParticipantsCmdHandler = pipeAsync(
        isAuthenticatedAndNotDemoAspect,
        ParseTgSourceParticipantsCmdHandler(
          logger,
          telegramClient,
          txEventBus,
          tgUserDS,
          tgSourceParticipantDS,
          tgSourceDS,
          tgSourceParticipantStatusDS,
          tgSourceParticipantWithStatusDS
        )
      );
      const leaveAndDeleteSourceCmdHandler = pipeAsync(
        isAuthenticatedAndNotDemoAspect,
        LeaveAndDeleteSourceCmdHandler(telegramClient, txEventBus, tgSourceDS)
      );

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
              authenticate,
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
                logger.debug("COMMITTING");
                await ctx.context.tx.commit();
                logger.debug("COMMITTED");
                ctx.context.eventBus.commit();
              } catch (e) {
                logger.error(e);
                throw e;
              }
            },
            didEncounterErrors: async (ctx) => {
              try {
                logger.debug("ROLLING");
                await ctx.context.tx.rollback();
                logger.debug("ROLLED");
                ctx.context.eventBus.rollback();
              } catch (e) {
                logger.error(e);
                throw e;
              }
            },
          };
        },
      } as ApolloServerPlugin<ResolversCtx>,
    ],
  });
};
