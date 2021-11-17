import { CriticalError } from "fdd-ts/errors";
import jwt from "jsonwebtoken";

export type JWTToken = {
  sub: string;
  userEmail: string;
};
export const JWTToken = {
  sign: (secret: string, token: JWTToken) => {
    return jwt.sign(token, secret);
  },
  verify: (secret: string, token: string): JWTToken => {
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === "string") {
      throw new CriticalError(`Decoded JWT is string, ${decoded}`);
    }

    if (!decoded.sub || !decoded.userEmail) {
      throw new CriticalError(`Decoded JWT is not fullfilled, ${decoded}`);
    }

    return {
      sub: decoded.sub,
      userEmail: decoded.userEmail,
    };
  },
};
