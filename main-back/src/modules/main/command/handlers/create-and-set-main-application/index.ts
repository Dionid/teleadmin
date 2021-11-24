import { Command, CommandBehavior } from "@fdd-node-ts/core/cqrs/command";
import { NotEmptyString } from "@fop-ts/core/Branded-common-types";
import { TgApplicationDS } from "modules/main/command/projections/tg-application/ds";
import {
  TgApplication,
  TgApplicationId,
} from "modules/main/command/projections/tg-application/projection";

export type CreateAndSetMainApplicationCmd = Command<
  "CreateAndSetMainApplicationCmd",
  {
    name: NotEmptyString;
    appId: NotEmptyString;
    appHash: NotEmptyString;
  }
>;
export const CreateAndSetMainApplicationCmd =
  CommandBehavior.createCurriedType<CreateAndSetMainApplicationCmd>(
    "CreateAndSetMainApplicationCmd"
  );

export type CreateAndSetMainApplicationCmdHandler = ReturnType<
  typeof CreateAndSetMainApplicationCmdHandler
>;

export const CreateAndSetMainApplicationCmdHandler = async (
  cmd: CreateAndSetMainApplicationCmd
) => {
  // . Check that there is no app with this appId
  if (await TgApplicationDS.isExistByAppId(cmd.data.appId)) {
    throw new Error(`There is already app with app id ${cmd.data.appId}`);
  }

  // . Check that there is no main app
  if (await TgApplicationDS.isMainAppExist()) {
    throw new Error("Main app already exist");
  }

  // ? Check that app in tg is exists
  // ...

  // . Create new Application
  const app: TgApplication = {
    id: TgApplicationId.create(),
    name: cmd.data.name,
    appId: cmd.data.appId,
    appHash: cmd.data.appHash,
    main: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await TgApplicationDS.create(app);

  // . Send TgApplicationCreatedAndSettedAsMainEvent
  // ...
};
