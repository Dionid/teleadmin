import { PublicError } from "fdd-ts/errors";

export class UserAlreadyInChannelError extends PublicError {
  constructor() {
    super(`You in this tg channel`);
  }
}
