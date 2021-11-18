import { Command, CommandFactory } from "fdd-ts/cqrs";
import { IAModuleDS } from "modules/ia/command/projections";
import {
  UserDS,
  User,
  UserEmail,
  UserHashedPassword,
} from "modules/ia/command/projections/user";

export type CreateFirstAdminCmd = Command<
  "CreateFirstAdminCmd",
  {
    email: UserEmail;
    password: UserHashedPassword;
  }
>;
export const CreateFirstAdminCmd = CommandFactory<CreateFirstAdminCmd>(
  "CreateFirstAdminCmd"
);

export type CreateFirstAdminCmdHandler = ReturnType<
  typeof CreateFirstAdminCmdHandler
>;

export const CreateFirstAdminCmdHandler =
  (commonDS: IAModuleDS) => async (cmd: CreateFirstAdminCmd) => {
    const user = await UserDS.findAny(commonDS);

    if (user) {
      throw new Error("Admin is already exist");
    }

    const newUser = User.newUnactivatedUser(cmd.data.email, cmd.data.password);
    await UserDS.create(commonDS, newUser);
  };
