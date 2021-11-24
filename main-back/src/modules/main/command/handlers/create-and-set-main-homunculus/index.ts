import { Command, CommandBehavior } from "@fdd-node/core/cqrs/command";
import { Event, EventBehavior } from "@fdd-node/core/eda/event";
import { EventBus } from "@fdd-node/core/eda/event-bus";
import { FullEvent } from "@fdd-node/core/eda/full-event";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import {
  TgHomunculus,
  TgHomunculusDS,
  TgHomunculusId,
  TgHomunculusPhone,
} from "modules/main/command/projections/tg-homunculus";

export type CreatedAndSettedMasterHomunculusEvent = Event<
  "CreatedAndSettedMasterHomunculusEvent",
  "v1",
  {
    phone: TgHomunculusPhone;
  }
>;
export const CreatedAndSettedMasterHomunculusEvent =
  EventBehavior.createCurriedNameVersion<CreatedAndSettedMasterHomunculusEvent>(
    "CreatedAndSettedMasterHomunculusEvent",
    "v1"
  );

export type CreateAndSetMasterHomunculusCmd = Command<
  "CreateAndSetMasterHomunculusCmd",
  {
    phone: TgHomunculusPhone;
  }
>;
export const CreateAndSetMasterHomunculusCmd =
  CommandBehavior.createCurriedType<CreateAndSetMasterHomunculusCmd>(
    "CreateAndSetMasterHomunculusCmd"
  );

export type CreateAndSetMasterHomunculusCmdHandler = ReturnType<
  typeof CreateAndSetMasterHomunculusCmdHandler
>;

export const CreateAndSetMasterHomunculusCmdHandler = async (
  cmd: CreateAndSetMasterHomunculusCmd
) => {
  const { eventBus } = Context.getStoreOrThrowError(GlobalContext);

  // . Check that there is no Homunculus with this phone
  if (await TgHomunculusDS.isExistByPhone(cmd.data.phone)) {
    throw new Error("Homunculus with this phone already exists");
  }

  // . Check that there is no main Homunculus
  if (await TgHomunculusDS.isExistByMaster()) {
    throw new Error("Master Homunculus already exists");
  }

  // . Create new Homunculus
  const homunculus: TgHomunculus = {
    id: TgHomunculusId.create(),
    phone: cmd.data.phone,
    master: true,
    authToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await TgHomunculusDS.create(homunculus);

  // . Send CreatedAndSettedMasterHomunculusEvent
  const event = CreatedAndSettedMasterHomunculusEvent.create({
    phone: homunculus.phone,
  });

  EventBus.publish(eventBus, [
    FullEvent.ofCmdOrQuery({
      event,
      meta: cmd.meta,
    }),
  ]);
};
