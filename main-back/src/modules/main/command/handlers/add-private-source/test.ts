import { BigInteger } from "big-integer";
import { EventBusService } from "fdd-ts/eda";
import { Matcher, mock, MockProxy } from "jest-mock-extended";
import { TgSourceInviteLinkHash } from "libs/telegram-js/types";
import { UserAlreadyInChannelError } from "modules/main/command/handlers/add-private-source/errors";
import { PrivateSourceAddedEvent } from "modules/main/command/handlers/add-private-source/events";
import {
  AddPrivateSourceCmd,
  AddPrivateSourceCmdHandler,
} from "modules/main/command/handlers/add-private-source/index";
import { MainModuleDS } from "modules/main/command/projections";
import { TgSourceType } from "modules/main/command/projections/tg-source";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
import { Api, TelegramClient } from "telegram";
import { mocked } from "ts-jest/utils";

import Updates = Api.Updates;
import Channel = Api.Channel;
import ChatPhoto = Api.ChatPhoto;
import PeerChannel = Api.PeerChannel;
import ChatFull = Api.messages.ChatFull;
import ChannelFull = Api.ChannelFull;
import PeerNotifySettings = Api.PeerNotifySettings;
import PhotoEmpty = Api.PhotoEmpty;
import GetFullChannel = Api.channels.GetFullChannel;
import clearAllMocks = jest.clearAllMocks;

jest.mock("modules/main/command/projections/tg-source/ds");

const mockedTgSourceDS = mocked(TgSourceDS);

describe("AddPrivateSourceCmdHandler", () => {
  let client: {
    ref: MockProxy<TelegramClient>;
  };
  let eventBus: MockProxy<EventBusService>;
  let cmd: AddPrivateSourceCmd;
  let sourceInviteLinkHash: TgSourceInviteLinkHash;
  let sourceType: TgSourceType;
  let ds: MockProxy<MainModuleDS>;

  beforeEach(() => {
    client = {
      ref: mock<TelegramClient>(),
    };
    eventBus = mock<EventBusService>();
    sourceInviteLinkHash = TgSourceInviteLinkHash.ofString("");
    sourceType = TgSourceType.fromString("Channel");
    ds = mock<MainModuleDS>();

    clearAllMocks();
    cmd = AddPrivateSourceCmd.create(
      {
        sourceInviteLinkHash,
        sourceType,
      },
      {
        userId: null,
      }
    );
  });

  it("should throw error about user is in channel", async () => {
    client.ref.invoke.mockImplementation(() => {
      throw new Error("USER_ALREADY_PARTICIPANT");
    });

    const handler = AddPrivateSourceCmdHandler(client, eventBus, ds);

    try {
      await handler(cmd);
    } catch (e) {
      expect(e).toBeInstanceOf(UserAlreadyInChannelError);
    }
  });

  it("should rethrow error from tg api", async () => {
    client.ref.invoke.mockImplementation(() => {
      throw new Error("Some error");
    });

    const handler = AddPrivateSourceCmdHandler(client, eventBus, ds);

    try {
      await handler(cmd);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it("success", async () => {
    const channelId = 123123;
    const channelTitle = "Some name";
    const channel = new Channel({
      id: channelId,
      title: channelTitle,
      photo: new ChatPhoto({
        dcId: 123123,
        photoId: "123" as unknown as BigInteger,
      }),
      date: new Date().getTime(),
      version: 1,
    });

    client.ref.invoke
      .calledWith(
        new Matcher((arg) => {
          return (
            arg instanceof Api.messages.ImportChatInvite &&
            arg.hash === sourceInviteLinkHash
          );
        }, "")
      )
      .mockReturnValue(
        new Promise((resolve) => {
          resolve(
            new Updates({
              updates: [],
              users: [],
              chats: [channel],
              date: new Date().getTime(),
              seq: 1,
            })
          );
        })
      );

    client.ref.invoke
      .calledWith(
        new Matcher((arg) => {
          return (
            arg instanceof GetFullChannel &&
            arg.channel instanceof PeerChannel &&
            arg.channel.channelId === channelId
          );
        }, "")
      )
      .mockReturnValue(
        new Promise((resolve) => {
          resolve(
            new ChatFull({
              fullChat: new ChannelFull({
                id: channelId,
                about: "string",
                readInboxMaxId: 0,
                readOutboxMaxId: 0,
                unreadCount: 0,
                chatPhoto: new PhotoEmpty({
                  id: 123123 as unknown as BigInteger,
                }),
                notifySettings: new PeerNotifySettings({}),
                botInfo: [],
                pts: 123,
              }),
              chats: [channel],
              users: [],
            })
          );
        })
      );

    mockedTgSourceDS.create.mockImplementation(async (ds, projection) => {
      if (
        projection.tgId !== channelId ||
        projection.tgTitle !== channelTitle
      ) {
        throw new Error("Title or id is not correct");
      }

      return projection;
    });

    eventBus.publish.mockImplementation(async (events) => {
      const event = events[0];

      if (!PrivateSourceAddedEvent.isFull(event)) {
        throw new Error("Event is not PrivateSourceAddedEvent");
      }

      if (event.data.tgName !== null || event.data.tgId !== channelId) {
        throw new Error("PrivateSourceAddedEvent data is incorrect");
      }
    });

    const handler = AddPrivateSourceCmdHandler(client, eventBus, ds);

    expect(await handler(cmd)).toBeUndefined();
  });
});
