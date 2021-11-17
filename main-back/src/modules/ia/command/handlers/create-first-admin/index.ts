import { Command, CommandFactory } from "fdd-ts/cqrs";
import {
  User,
  UserDS,
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
  (userDS: UserDS) => async (cmd: CreateFirstAdminCmd) => {
    const user = await userDS.findAny();

    if (user) {
      throw new Error("Admin is already exist");
    }

    const newUser = User.newUnactivatedUser(cmd.data.email, cmd.data.password);
    await userDS.create(newUser);
  };
