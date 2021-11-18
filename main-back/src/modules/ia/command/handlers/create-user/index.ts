import { Command, CommandFactory } from "fdd-ts/cqrs";
import { PublicError } from "fdd-ts/errors";
import {
  User,
  UserDS,
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
export const CreateUserCmd = CommandFactory("CreateUserCmd");

export type CreateUserCmdHandler = ReturnType<typeof CreateUserCmdHandler>;

export const CreateUserCmdHandler =
  (userDS: UserDS) => async (cmd: CreateUserCmd) => {
    const newUser = User.newUnactivatedUser(cmd.data.email, cmd.data.password);

    try {
      await userDS.create(newUser);
    } catch (e) {
      if (e instanceof Error && e.message.includes("user_email_key")) {
        throw new PublicError("User with this email already exists");
      }

      throw e;
    }
  };
