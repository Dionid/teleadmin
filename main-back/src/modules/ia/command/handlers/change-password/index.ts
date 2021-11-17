import { Command } from "fdd-ts/cqrs";
import { CriticalError } from "fdd-ts/errors";
import {
  User,
  UserDS,
  UserHashedPassword,
  UserId,
} from "modules/ia/command/projections/user";

export type ChangePasswordCmd = Command<
  "ChangePasswordCmd",
  {
    oldPassword: UserHashedPassword;
    newPassword: UserHashedPassword;
    id: UserId;
  }
>;

export const ChangePasswordCmdHandler =
  (userDS: UserDS) => async (cmd: ChangePasswordCmd) => {
    // . Get user
    const user = await userDS.findById(cmd.data.id);

    if (!user) {
      throw new CriticalError("User not found");
    }

    if (!UserHashedPassword.compare(user.password, cmd.data.oldPassword)) {
      throw new CriticalError(`Old password is incorrect`);
    }

    const newPassUser: User = {
      ...user,
      password: cmd.data.newPassword,
    };
    await userDS.update(newPassUser);
  };
