import { Maybe } from "functional-oriented-programming-ts";
import { Knex } from "knex";
import { CommandHandler } from "libs/@fdd/cqrs";
import { EventBusService} from "libs/@fdd/eda";
import { AuthenticateCmdHandler } from "modules/ia/command/handlers/authenticate";
import { CreateFirstAdminCmdHandler } from "modules/ia/command/handlers/create-first-admin";
import { CreateUserCmdHandler } from "modules/ia/command/handlers/create-user";
import { UserId } from "modules/ia/command/projections/user";
import { AddPrivateSourceCmd } from "modules/main/command/handlers/add-private-source";
import { AddPublicSourceCmd } from "modules/main/command/handlers/add-public-source";
import { CreateAndSetMainApplicationCmd } from "modules/main/command/handlers/create-and-set-main-application";
import { CreateAndSetMasterHomunculusCmd } from "modules/main/command/handlers/create-and-set-main-homunculus";
import { LeaveAndDeleteSourceCmd } from "modules/main/command/handlers/leave-and-delete-source";
import { ParseTgSourceParticipantsCmd } from "modules/main/command/handlers/parse-tg-source-participants";

export type ResolversCtx = {
  tx: Knex.Transaction;
  eventBus: EventBusService;
  userId: Maybe<UserId>;
  modules: {
    main: {
      commands: {
        createAndSetMainApplicationCmdHandler: CommandHandler<CreateAndSetMainApplicationCmd>;
        createAndSetMasterHomunculusCmdHandler: CommandHandler<CreateAndSetMasterHomunculusCmd>;
        addPublicSourceCmdHandler: CommandHandler<AddPublicSourceCmd>;
        addPrivateSourceCmdHandler: CommandHandler<AddPrivateSourceCmd>;
        parseTgSourceParticipantsCmdHandler: CommandHandler<ParseTgSourceParticipantsCmd>;
        leaveAndDeleteSourceCmdHandler: CommandHandler<LeaveAndDeleteSourceCmd>;
      };
    };
    authn: {
      passwordHashSalt: string;
      commands: {
        createFirstAdmin: CreateFirstAdminCmdHandler;
        createUser: CreateUserCmdHandler;
        authenticate: AuthenticateCmdHandler;
      };
    };
  };
};
