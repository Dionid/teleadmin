import { Command, CommandBehavior } from "@fdd-node/core/cqrs/command";
import { EventBus } from "@fdd-node/core/eda/event-bus";
import { NotFoundError } from "@fdd-node/core/errors";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { AuthTokenToHomunculusSetEvent } from "modules/main/command/handlers/set-authtoken-to-homunculus/events";
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
  CommandBehavior.createCurriedType<SetAuthTokenToHomunculusCmd>(
    "SetAuthTokenToHomunculusCmd"
  );

export const SetAuthTokenToHomunculusCmdHandler = async (
  cmd: SetAuthTokenToHomunculusCmd
) => {
  const { eventBus } = Context.getStoreOrThrowError(GlobalContext);
  // . Find Homunculus by phone
  const homunculus = await TgHomunculusDS.getByPhone(cmd.data.phone);

  if (!homunculus) {
    throw new NotFoundError(
      `Homunculus by phone ${cmd.data.phone} does not exist`
    );
  }

  // . Set authToken
  homunculus.authToken = cmd.data.authToken;

  // . Update Homunculus
  await TgHomunculusDS.update(homunculus);

  // . Send Event
  const event: AuthTokenToHomunculusSetEvent =
    AuthTokenToHomunculusSetEvent.create({
      authToken: homunculus.authToken,
    });

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
