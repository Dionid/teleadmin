import { Command, CommandBehavior } from "@fdd-node-ts/core/cqrs/command";
import { PublicError } from "@fdd-node-ts/core/errors";
import {
  UserDS,
  User,
  UserEmail,
  UserHashedPassword,
} from "modules/ia/command/projections/user";

export type CreateUserCmd = Command<
  "CreateUserCmd",
  {
    email: UserEmail;
    password: UserHashedPassword;
  }
>;
export const CreateUserCmd = CommandBehavior.createCurriedType("CreateUserCmd");

export type CreateUserCmdHandler = typeof CreateUserCmdHandler;

export const CreateUserCmdHandler = async (cmd: CreateUserCmd) => {
  const newUser = User.newUnactivatedUser(cmd.data.email, cmd.data.password);

  try {
    await UserDS.create(newUser);
  } catch (e) {
    if (e instanceof Error && e.message.includes("user_email_key")) {
      throw new PublicError("User with this email already exists");
    }

    throw e;
  }
};
