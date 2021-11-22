import { EventBus } from "@fdd-node/core/eda/event-bus";
import { UUID } from "@fdd-node/core/fop-utils";
import { telegramClient } from "apps/main-gql/set-tg-client";
import { BigInteger } from "big-integer";
import { mock, MockProxy } from "jest-mock-extended";
import { Knex } from "knex";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { Logger } from "libs/teleadmin/deps/logger";
import { TgSourceInviteLinkHash } from "libs/telegram-js/types";
import { UserAlreadyInChannelError } from "modules/main/command/handlers/add-private-source/errors";
import {
  AddPrivateSourceCmd,
  AddPrivateSourceCmdHandler,
} from "modules/main/command/handlers/add-private-source/index";
import { TgSourceType } from "modules/main/command/projections/tg-source";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
import { Api } from "telegram";
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
jest.mock("@fdd-node/core/eda/event-bus");
jest.mock("apps/main-gql/set-tg-client", () => {
  return {
    telegramClient: {
      invoke: jest.fn(),
    },
  };
});

const mockedTgSourceDS = mocked(TgSourceDS);
const mockedEventBus = mocked(EventBus);
const mockedTelegramClient = mocked(telegramClient);

describe("AddPrivateSourceCmdHandler", () => {
  let eventBus: MockProxy<EventBus>;
  let knex: MockProxy<Knex>;
  let logger: MockProxy<Logger>;
  let cmd: AddPrivateSourceCmd;
  let sourceInviteLinkHash: TgSourceInviteLinkHash;
  let sourceType: TgSourceType;

  beforeEach(() => {
    // mockedTelegramClient = mock<typeof telegramClient>()
    logger = mock<Logger>();
    knex = mock<Knex>();
    eventBus = mock<EventBus>();
    sourceInviteLinkHash = TgSourceInviteLinkHash.ofString("");
    sourceType = TgSourceType.fromString("Channel");

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
    mockedTelegramClient.invoke.mockImplementation(() => {
      throw new Error("USER_ALREADY_PARTICIPANT");
    });

    try {
      await Context.run(
        GlobalContext,
        {
          knex,
          eventBus,
          logger,
          txId: UUID.create(),
        },
        AddPrivateSourceCmdHandler,
        cmd
      );
    } catch (e) {
      expect(e).toBeInstanceOf(UserAlreadyInChannelError);
    }
  });

  it("should rethrow error from tg api", async () => {
    mockedTelegramClient.invoke.mockImplementation(() => {
      throw new Error("Some error");
    });

    try {
      await Context.run(
        GlobalContext,
        {
          knex,
          eventBus,
          logger,
          txId: UUID.create(),
        },
        AddPrivateSourceCmdHandler,
        cmd
      );
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

    mockedTelegramClient.invoke.mockImplementation(async (args) => {
      if (
        args instanceof Api.messages.ImportChatInvite &&
        args.hash === sourceInviteLinkHash
      ) {
        return new Updates({
          updates: [],
          users: [],
          chats: [channel],
          date: new Date().getTime(),
          seq: 1,
        });
      }

      if (
        args instanceof GetFullChannel &&
        args.channel instanceof PeerChannel &&
        args.channel.channelId === channelId
      ) {
        return new ChatFull({
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
        });
      }

      throw new Error("");
    });

    // mockedTelegramClient.invoke
    //   .calledWith(
    //     new Matcher((arg) => {
    //       return (
    //         arg instanceof Api.messages.ImportChatInvite &&
    //         arg.hash === sourceInviteLinkHash
    //       );
    //     }, "")
    //   )
    //   .mockReturnValue(
    //     new Promise((resolve) => {
    //       resolve(
    //         new Updates({
    //           updates: [],
    //           users: [],
    //           chats: [channel],
    //           date: new Date().getTime(),
    //           seq: 1,
    //         })
    //       );
    //     })
    //   );

    // mockedTelegramClient.invoke
    //   .calledWith(
    //     new Matcher((arg) => {
    //       return (
    //         arg instanceof GetFullChannel &&
    //         arg.channel instanceof PeerChannel &&
    //         arg.channel.channelId === channelId
    //       );
    //     }, "")
    //   )
    //   .mockReturnValue(
    //     new Promise((resolve) => {
    //       resolve(
    //         new ChatFull({
    //           fullChat: new ChannelFull({
    //             id: channelId,
    //             about: "string",
    //             readInboxMaxId: 0,
    //             readOutboxMaxId: 0,
    //             unreadCount: 0,
    //             chatPhoto: new PhotoEmpty({
    //               id: 123123 as unknown as BigInteger,
    //             }),
    //             notifySettings: new PeerNotifySettings({}),
    //             botInfo: [],
    //             pts: 123,
    //           }),
    //           chats: [channel],
    //           users: [],
    //         })
    //       );
    //     })
    //   );

    mockedTgSourceDS.create.mockImplementation(async (projection) => {
      if (
        projection.tgId !== channelId ||
        projection.tgTitle !== channelTitle
      ) {
        throw new Error("Title or id is not correct");
      }

      return projection;
    });

    mockedEventBus.publish.mockImplementation(async (eb, events) => {
      const event = events[0];

      // TODO. FIX
      // if (!PrivateSourceAddedEvent.isFull(event)) {
      //   throw new Error("Event is not PrivateSourceAddedEvent");
      // }

      if (event.data.tgName !== null || event.data.tgId !== channelId) {
        throw new Error("PrivateSourceAddedEvent data is incorrect");
      }

      return eb;
    });

    expect(
      await Context.run(
        GlobalContext,
        {
          knex,
          eventBus,
          logger,
          txId: UUID.create(),
        },
        AddPrivateSourceCmdHandler,
        cmd
      )
    ).toBeUndefined();
  });
});
