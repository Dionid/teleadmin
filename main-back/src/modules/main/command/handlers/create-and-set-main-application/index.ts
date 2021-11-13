import { Command, CommandFactory } from "libs/@fdd/cqrs";
import { NotEmptyString } from "libs/@fdd/nominal/common";
import {
  TgApplication,
  TgApplicationDS,
  TgApplicationId,
} from "modules/main/command/projections/tg-application";

export type CreateAndSetMainApplicationCmd = Command<
  "CreateAndSetMainApplicationCmd",
  {
    name: NotEmptyString;
    appId: NotEmptyString;
    appHash: NotEmptyString;
  }
>;
export const CreateAndSetMainApplicationCmd =
  CommandFactory<CreateAndSetMainApplicationCmd>(
    "CreateAndSetMainApplicationCmd"
  );

export type CreateAndSetMainApplicationCmdHandler = ReturnType<
  typeof CreateAndSetMainApplicationCmdHandler
>;

export const CreateAndSetMainApplicationCmdHandler =
  (tgAppDS: TgApplicationDS) => async (cmd: CreateAndSetMainApplicationCmd) => {
    // . Check that there is no app with this appId
    if (await tgAppDS.isExistByAppId(cmd.data.appId)) {
      throw new Error(`There is already app with app id ${cmd.data.appId}`);
    }

    // . Check that there is no main app
    if (await tgAppDS.isMainAppExist()) {
      throw new Error("Main app already exist");
    }

    // ? Check that app in tg is exists
    // ...

    // . Create new Application
    const app: TgApplication = {
      id: TgApplicationId.new(),
      name: cmd.data.name,
      appId: cmd.data.appId,
      appHash: cmd.data.appHash,
      main: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await tgAppDS.create(app);

    // . Send TgApplicationCreatedAndSettedAsMainEvent
    // ...
  };
