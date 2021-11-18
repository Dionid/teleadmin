import { Command } from "fdd-ts/cqrs";
import { CriticalError } from "fdd-ts/errors";
import { CommonDS } from "modules/ia/command/projections";
import {
  UserDS,
  User,
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
  (commonDS: CommonDS) => async (cmd: ChangePasswordCmd) => {
    // . Get user
    const user = await UserDS.findById(commonDS, cmd.data.id);

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
    await UserDS.update(commonDS, newPassUser);
  };
