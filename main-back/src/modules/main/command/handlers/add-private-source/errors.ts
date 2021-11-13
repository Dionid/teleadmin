import { PublicError } from "libs/@fdd/errors";

export class UserAlreadyInChannelError extends PublicError {
  constructor() {
    super(`You in this tg channel`);
  }
}
