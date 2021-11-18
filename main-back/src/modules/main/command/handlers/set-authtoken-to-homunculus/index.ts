import { Command, CommandFactory } from "fdd-ts/cqrs";
import { EventBus } from "fdd-ts/eda";
import { NotFoundError } from "fdd-ts/errors";
import { NotEmptyString } from "functional-oriented-programming-ts/branded";
import { AuthTokenToHomunculusSetEvent } from "modules/main/command/handlers/set-authtoken-to-homunculus/events";
import { MainModuleDS } from "modules/main/command/projections";
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
  (mainModuleDS: MainModuleDS, eventBus: EventBus) =>
  async (cmd: SetAuthTokenToHomunculusCmd) => {
    // . Find Homunculus by phone
    const homunculus = await TgHomunculusDS.getByPhone(
      mainModuleDS,
      cmd.data.phone
    );

    if (!homunculus) {
      throw new NotFoundError(
        `Homunculus by phone ${cmd.data.phone} does not exist`
      );
    }

    // . Set authToken
    homunculus.authToken = cmd.data.authToken;

    // . Update Homunculus
    await TgHomunculusDS.update(mainModuleDS, homunculus);

    // . Send Event
    const event: AuthTokenToHomunculusSetEvent = {
      type: "AuthTokenToHomunculusSetEvent",
      version: "v1",
      data: {
        authToken: homunculus.authToken,
      },
    };

    EventBus.publish(eventBus, [
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
