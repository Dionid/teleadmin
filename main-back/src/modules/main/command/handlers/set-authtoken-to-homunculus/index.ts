import { Command, CommandFactory } from "libs/@fdd/cqrs";
import { EventBus } from "libs/@fdd/eda";
import { NotFoundError } from "libs/@fdd/errors";
import { NotEmptyString } from "libs/@fdd/nominal/common";
import { AuthTokenToHomunculusSet } from "modules/main/command/handlers/set-authtoken-to-homunculus/events";
import {TgHomunculusDS} from "modules/main/command/projections/tg-homunculus-s/ds";
import { v4 } from "uuid";

import * as TgHomunculus from "../../projections/tg-homunculus-s";

export type SetAuthTokenToHomunculusCmd = Command<
  "SetAuthTokenToHomunculusCmd",
  {
    phone: TgHomunculus.TgHomunculusPhone;
    authToken: NotEmptyString;
  }
>;
export const SetAuthTokenToHomunculusCmd =
  CommandFactory<SetAuthTokenToHomunculusCmd>("SetAuthTokenToHomunculusCmd");

export const SetAuthTokenToHomunculusCmdHandler =
  (
    ds: TgHomunculusDS,
    eventBus: EventBus,
  ) =>
  async (cmd: SetAuthTokenToHomunculusCmd) => {
    // . Find Homunculus by phone
    const homunculus = await TgHomunculusDS.getByPhone(ds)(cmd.data.phone);

    if (!homunculus) {
      throw new NotFoundError(
        `Homunculus by phone ${cmd.data.phone} does not exist`
      );
    }

    // . Set authToken
    homunculus.authToken = cmd.data.authToken;

    // . Update Homunculus
    await TgHomunculusDS.update(ds)(homunculus);

    // . Send Event
    const event: AuthTokenToHomunculusSet = {
      type: "AuthTokenToHomunculusSet",
      version: "v1",
      data: {
        authToken: homunculus.authToken,
      },
    };

    eventBus.publish([
      {
        ...event,
        meta: {
          id: v4(),
          createdAt: new Date(),
          userId: cmd.meta.userId,
          rootTransactionId: cmd.meta.transactionId,
        },
      },
    ]);
  };
