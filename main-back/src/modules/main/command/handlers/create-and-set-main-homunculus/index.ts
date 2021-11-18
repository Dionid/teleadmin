import { Command, CommandFactory } from "fdd-ts/cqrs";
import { EventBusService } from "fdd-ts/eda";
import { Event, EventBehaviour, FullEvent } from "fdd-ts/eda/events";
import { MainModuleDS } from "modules/main/command/projections";
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
  EventBehaviour.create<CreatedAndSettedMasterHomunculusEvent>(
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
  CommandFactory<CreateAndSetMasterHomunculusCmd>(
    "CreateAndSetMasterHomunculusCmd"
  );

export type CreateAndSetMasterHomunculusCmdHandler = ReturnType<
  typeof CreateAndSetMasterHomunculusCmdHandler
>;

export const CreateAndSetMasterHomunculusCmdHandler =
  (mainModuleDS: MainModuleDS, eventBus: EventBusService) =>
  async (cmd: CreateAndSetMasterHomunculusCmd) => {
    // . Check that there is no Homunculus with this phone
    if (await TgHomunculusDS.isExistByPhone(mainModuleDS, cmd.data.phone)) {
      throw new Error("Homunculus with this phone already exists");
    }

    // . Check that there is no main Homunculus
    if (await TgHomunculusDS.isExistByMaster(mainModuleDS)) {
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
    await TgHomunculusDS.create(mainModuleDS, homunculus);

    // . Send CreatedAndSettedMasterHomunculusEvent
    const event = CreatedAndSettedMasterHomunculusEvent.create({
      phone: homunculus.phone,
    });

    eventBus.publish([
      FullEvent.fromCmdOrQuery({
        event,
        meta: cmd.meta,
      }),
    ]);
  };
