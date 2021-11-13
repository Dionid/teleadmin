import { MutationResolvers } from "apps/main-gql/infra/gql/gqlgen-types";
import { ResolversCtx } from "apps/main-gql/infra/gql/resolver-ctx";
import { NotEmptyString } from "libs/@fdd/nominal/common";
import { TgSourceInviteLinkHash } from "libs/telegram-js/types";
import { AuthenticateCmd } from "modules/ia/command/handlers/authenticate";
import { CreateFirstAdminCmd } from "modules/ia/command/handlers/create-first-admin";
import { CreateUserCmd } from "modules/ia/command/handlers/create-user";
import {
  UserEmail,
  UserHashedPassword,
} from "modules/ia/command/projections/user";
import { AddPrivateSourceCmd } from "modules/main/command/handlers/add-private-source";
import { AddPublicSourceCmd } from "modules/main/command/handlers/add-public-source";
import { CreateAndSetMainApplicationCmd } from "modules/main/command/handlers/create-and-set-main-application";
import { CreateAndSetMasterHomunculusCmd } from "modules/main/command/handlers/create-and-set-main-homunculus";
import { LeaveAndDeleteSourceCmd } from "modules/main/command/handlers/leave-and-delete-source";
import { ParseTgSourceParticipantsCmd } from "modules/main/command/handlers/parse-tg-source-participants";
import { TgHomunculusPhone } from "modules/main/command/projections/tg-homunculus";
import {
  TgSourceId,
  TgSourceType,
} from "modules/main/command/projections/tg-source";
import { HomunculusPhoneCodeReceived } from "modules/orchestrator/handlers/created-and-setted-master-homunculus-event";
import { v4 } from "uuid";

export const Mutation: MutationResolvers<ResolversCtx> = {
  createFirstAdmin: async (parent, args, ctx) => {
    const cmd = CreateFirstAdminCmd.new(
      {
        email: UserEmail.ofString(args.req.email),
        password: UserHashedPassword.ofString(
          ctx.modules.authn.passwordHashSalt,
          args.req.password
        ),
      },
      {
        userId: ctx.userId,
      }
    );

    await ctx.modules.authn.commands.createFirstAdmin(cmd);

    return {
      success: true,
    };
  },
  createUser: async (parent, args, ctx) => {
    const cmd = CreateUserCmd.new(
      {
        email: UserEmail.ofString(args.req.email),
        password: UserHashedPassword.ofString(
          ctx.modules.authn.passwordHashSalt,
          args.req.password
        ),
      },
      {
        userId: ctx.userId,
      }
    );

    await ctx.modules.authn.commands.createUser(cmd);

    return {
      success: true,
    };
  },
  authenticate: async (parent, args, ctx) => {
    const cmd = AuthenticateCmd.new(
      {
        email: UserEmail.ofString(args.req.email),
        password: UserHashedPassword.ofString(
          ctx.modules.authn.passwordHashSalt,
          args.req.password
        ),
      },
      {
        userId: ctx.userId,
      }
    );

    return await ctx.modules.authn.commands.authenticate(cmd);
  },

  createAndSetMasterHomunculus: async (parent, args, ctx) => {
    const cmd: CreateAndSetMasterHomunculusCmd =
      CreateAndSetMasterHomunculusCmd.new(
        {
          phone: TgHomunculusPhone.ofString(args.req.phone),
        },
        {
          userId: ctx.userId,
        }
      );

    await ctx.modules.main.commands.createAndSetMasterHomunculusCmdHandler(cmd);

    return {
      success: true,
    };
  },

  createAndSetMainApplication: async (parent, args, ctx) => {
    const cmd: CreateAndSetMainApplicationCmd =
      CreateAndSetMainApplicationCmd.new(
        {
          name: NotEmptyString.ofString(args.req.name),
          appId: NotEmptyString.ofString(args.req.appId),
          appHash: NotEmptyString.ofString(args.req.appHash),
        },
        {
          userId: ctx.userId,
        }
      );

    await ctx.modules.main.commands.createAndSetMainApplicationCmdHandler(cmd);

    return {
      success: true,
    };
  },

  sendCode: async (parent, args, ctx) => {
    const event: HomunculusPhoneCodeReceived = {
      type: "HomunculusPhoneCodeReceived",
      version: "v1",
      data: {
        phone: TgHomunculusPhone.ofString(args.req.phone),
        code: args.req.code,
      },
    };

    ctx.eventBus.publish([
      {
        ...event,
        meta: {
          id: v4(),
          rootTransactionId: v4(),
          createdAt: new Date(),
          userId: ctx.userId,
        },
      },
    ]);

    return {
      success: true,
    };
  },

  addPublicSource: async (parent, args, ctx) => {
    const cmd: AddPublicSourceCmd = AddPublicSourceCmd.new(
      {
        sourceName: NotEmptyString.ofString(args.req.name),
        sourceType: TgSourceType.fromString(args.req.type),
      },
      {
        userId: ctx.userId,
      }
    );

    await ctx.modules.main.commands.addPublicSourceCmdHandler(cmd);

    return {
      success: true,
    };
  },

  addPrivateSource: async (parent, args, ctx) => {
    const cmd = AddPrivateSourceCmd.new(
      {
        sourceInviteLinkHash: TgSourceInviteLinkHash.ofString(
          args.req.inviteLink
        ),
        sourceType: TgSourceType.fromString(args.req.type),
      },
      {
        userId: ctx.userId,
      }
    );

    await ctx.modules.main.commands.addPrivateSourceCmdHandler(cmd);

    return {
      success: true,
    };
  },

  parseTgSourceParticipants: async (parent, args, ctx) => {
    const cmd: ParseTgSourceParticipantsCmd = ParseTgSourceParticipantsCmd.new(
      {
        sourceId: TgSourceId.ofString(args.req.sourceId),
      },
      {
        userId: ctx.userId,
      }
    );

    await ctx.modules.main.commands.parseTgSourceParticipantsCmdHandler(cmd);

    return {
      success: true,
    };
  },

  leaveAndDeleteSource: async (parent, args, ctx) => {
    const cmd: LeaveAndDeleteSourceCmd = LeaveAndDeleteSourceCmd.new(
      {
        sourceId: TgSourceId.ofString(args.req.sourceId),
      },
      {
        userId: ctx.userId,
      }
    );

    await ctx.modules.main.commands.leaveAndDeleteSourceCmdHandler(cmd);

    return {
      success: true,
    };
  },
};
