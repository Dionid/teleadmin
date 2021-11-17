import { Command, CommandFactory } from "fdd-ts/cqrs";
import { EventBusService } from "fdd-ts/eda";
import { NotFoundError } from "fdd-ts/errors";
import { NotEmptyString } from "libs/@fdd/branded/common";
import { AuthTokenToHomunculusSet } from "modules/main/command/handlers/set-authtoken-to-homunculus/events";
import {
  TgHomunculusDS,
  TgHomunculusPhone,
} from "modules/main/command/projections/tg-homunculus";
import { v4 } from "uuid";

export type SetAuthTokenToHomunculusCmd = Command<
  "SetAuthTokenToHomunculusCmd",
  {
    phone: TgHomunculusPhone;
    authToken: NotEmptyString;
  }
>;
export const SetAuthTokenToHomunculusCmd =
  CommandFactory<SetAuthTokenToHomunculusCmd>("SetAuthTokenToHomunculusCmd");

export const SetAuthTokenToHomunculusCmdHandler =
  (tgHomunculusDS: TgHomunculusDS, eventBus: EventBusService) =>
  async (cmd: SetAuthTokenToHomunculusCmd) => {
    // . Find Homunculus by phone
    const homunculus = await tgHomunculusDS.getByPhone(cmd.data.phone);

    if (!homunculus) {
      throw new NotFoundError(
        `Homunculus by phone ${cmd.data.phone} does not exist`
      );
    }

    // . Set authToken
    homunculus.authToken = cmd.data.authToken;

    // . Update Homunculus
    await tgHomunculusDS.update(homunculus);

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
