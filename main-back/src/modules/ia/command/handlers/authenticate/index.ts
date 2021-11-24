import { CommandBehavior } from "@fdd-node/core/cqrs/command";
import { Hybrid } from "@fdd-node/core/cqrs/hybrid";
import { JWTToken } from "libs/teleadmin/jwt-token";
import {
  UserDS,
  UserEmail,
  UserHashedPassword,
} from "modules/ia/command/projections/user";

export class EmailOrPasswordIsIncorrect extends Error {
  constructor() {
    super(`Email or password is incorrect`);
  }
}

export type AuthenticateCmd = Hybrid<
  "AuthenticateCmd",
  {
    email: UserEmail;
    password: UserHashedPassword;
  },
  {
    jwtToken: string;
  }
>;
export const AuthenticateCmd =
  CommandBehavior.createCurriedType("AuthenticateCmd");

export type AuthenticateCmdHandler = ReturnType<typeof AuthenticateCmdHandler>;

export const AuthenticateCmdHandler =
  (salt: string) => async (cmd: AuthenticateCmd) => {
    // . Get user
    const user = await UserDS.findByEmail(cmd.data.email);

    if (!user) {
      throw new EmailOrPasswordIsIncorrect();
    }

    // . Compare passwords
    if (!UserHashedPassword.compare(user.password, cmd.data.password)) {
      throw new EmailOrPasswordIsIncorrect();
    }

    const token: JWTToken = {
      sub: user.id,
      userEmail: cmd.data.email,
    };

    // . Return JWT Token
    return {
      jwtToken: JWTToken.sign(salt, token),
    };
  };
