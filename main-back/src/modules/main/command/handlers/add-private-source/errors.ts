import { PublicError } from "@fdd-node/core/errors";

export class UserAlreadyInChannelError extends PublicError {
  constructor() {
    super(`You in this tg channel`);
  }
}
