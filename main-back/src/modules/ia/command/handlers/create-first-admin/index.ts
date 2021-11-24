import { Command, CommandBehavior } from "@fdd-node/core/cqrs/command";
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
export const CreateFirstAdminCmd =
  CommandBehavior.createCurriedType<CreateFirstAdminCmd>("CreateFirstAdminCmd");

export type CreateFirstAdminCmdHandler = typeof CreateFirstAdminCmdHandler;

export const CreateFirstAdminCmdHandler = async (cmd: CreateFirstAdminCmd) => {
  const user = await UserDS.findAny();

  if (user) {
    throw new Error("Admin is already exist");
  }

  const newUser = User.newUnactivatedUser(cmd.data.email, cmd.data.password);
  await UserDS.create(newUser);
};
