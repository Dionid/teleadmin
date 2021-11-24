import { EventBus } from "@fdd-node-ts/core/eda/event-bus";
import { UUID } from "@fdd-node-ts/core/fop-utils";
import { BigInteger } from "big-integer";
import { mock, MockProxy } from "jest-mock-extended";
import { Knex } from "knex";
import { Context } from "libs/fdd-ts/context";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import { Logger } from "libs/teleadmin/deps/logger";
import { checkIfMeIsChannelAdmin } from "libs/telegram-js/check-if-me-is-channel-admin";
import { getAllChannelParticipants } from "libs/telegram-js/get-channel-partisipants";
import {
  ParseTgSourceParticipantsCmd,
  ParseTgSourceParticipantsCmdHandler,
} from "modules/main/command/handlers/parse-tg-source-participants/index";
import { markLeftParticipants } from "modules/main/command/handlers/parse-tg-source-participants/operations/mark-left-participants";
import {
  tgUserDoesntExist,
  tgUserExist,
} from "modules/main/command/handlers/parse-tg-source-participants/operations/user-presence";
import {
  TgSource,
  TgSourceId,
  TgSourceTgId,
} from "modules/main/command/projections/tg-source";
import { TgSourceDS } from "modules/main/command/projections/tg-source/ds";
import {
  TgUser,
  TgUserDS,
  TgUserId,
  TgUserTgId,
} from "modules/main/command/projections/tg-user";
import { Api } from "telegram";
import { mocked } from "ts-jest/utils";

import ChannelParticipant = Api.ChannelParticipant;
import ChannelParticipants = Api.channels.ChannelParticipants;
import ChatPhoto = Api.ChatPhoto;
import Channel = Api.Channel;
import User = Api.User;
import clearAllMocks = jest.clearAllMocks;

jest.mock("libs/telegram-js/check-if-me-is-channel-admin");
jest.mock("libs/telegram-js/get-channel-partisipants");
jest.mock("@fdd-node-ts/core/eda/event-bus");
jest.mock(
  "modules/main/command/handlers/parse-tg-source-participants/operations/user-presence"
);
jest.mock(
  "modules/main/command/handlers/parse-tg-source-participants/operations/mark-left-participants"
);
jest.mock("modules/main/command/projections/tg-source/ds");
jest.mock("modules/main/command/projections/tg-user/ds");

const mockedCheckIfMeIsChannelAdmin = mocked(checkIfMeIsChannelAdmin);
const mockedGetAllChannelParticipants = mocked(getAllChannelParticipants);
const mockedTgUserDoesntExist = mocked(tgUserDoesntExist);
const mockedTgUserExist = mocked(tgUserExist);
const mockedMarkLeftParticipants = mocked(markLeftParticipants);
const mockedTgSourceDS = mocked(TgSourceDS);
const mockedTgUserDS = mocked(TgUserDS);

describe("ParseTgSourceParticipantsCmdHandler", () => {
  let eventBus: MockProxy<EventBus>;
  let cmd: ParseTgSourceParticipantsCmd;
  let knex: MockProxy<Knex>;
  let logger: MockProxy<Logger>;

  beforeEach(() => {
    eventBus = mock<EventBus>();
    logger = mock<Logger>();
    knex = mock<Knex>();
    cmd = ParseTgSourceParticipantsCmd.create(
      {
        sourceId: TgSourceId.new(),
      },
      { userId: null }
    );

    clearAllMocks();
  });

  describe("success", () => {
    it("should create new users, participants and status 'joined'", async () => {
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
      const source: TgSource = {
        id: TgSourceId.new(),
        type: "Channel",
        tgName: null,
        tgId: TgSourceTgId.ofNumber(channelId),
        createdAt: new Date(),
        updatedAt: new Date(),
        tgTitle: channelTitle,
        deletedAt: null,
      };

      mockedTgSourceDS.findByIdAndNotDeleted.mockReturnValue(
        new Promise<TgSource | undefined>((resolve) => {
          resolve(source);
        })
      );

      const channelParticipants = new ChannelParticipants({
        count: 3,
        participants: [
          new ChannelParticipant({
            userId: 123,
            date: new Date().getTime(),
          }),
          new ChannelParticipant({
            userId: 456,
            date: new Date().getTime(),
          }),
          new ChannelParticipant({
            userId: 789,
            date: new Date().getTime(),
          }),
        ],
        chats: [channel],
        users: [
          new User({
            id: 123,
          }),
          new User({
            id: 456,
          }),
          new User({
            id: 789,
          }),
        ],
      });

      mockedGetAllChannelParticipants.mockReturnValue(
        new Promise<Api.channels.TypeChannelParticipants>((resolve) => {
          resolve(channelParticipants);
        })
      );

      expect(
        await Context.run(
          GlobalContext,
          {
            knex,
            eventBus,
            logger,
            txId: UUID.create(),
          },
          ParseTgSourceParticipantsCmdHandler,
          cmd
        )
      ).toBeUndefined();
      expect(mockedMarkLeftParticipants).toHaveBeenCalledTimes(1);
      expect(mockedCheckIfMeIsChannelAdmin).toHaveBeenCalledTimes(1);
      expect(mockedTgUserDoesntExist).toHaveBeenCalledTimes(
        channelParticipants.users.length
      );
    });
    it("should create new users, participants and status 'joined'", async () => {
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
      const source: TgSource = {
        id: TgSourceId.new(),
        type: "Channel",
        tgName: null,
        tgId: TgSourceTgId.ofNumber(channelId),
        createdAt: new Date(),
        updatedAt: new Date(),
        tgTitle: channelTitle,
        deletedAt: null,
      };
      const tgUser: TgUser = {
        id: TgUserId.create(),
        tgId: TgUserTgId.ofString(123),
        tgUsername: null,
        tgPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tgBot: null,
        tgDeleted: null,
        tgVerified: null,
        tgFake: null,
        tgFirstName: null,
        tgLastName: null,
        tgPhotoId: null,
        tgLangCode: null,
      };

      mockedTgSourceDS.findByIdAndNotDeleted.mockReturnValue(
        new Promise<TgSource | undefined>((resolve) => {
          resolve(source);
        })
      );

      const channelParticipants = new ChannelParticipants({
        count: 3,
        participants: [
          new ChannelParticipant({
            userId: 123,
            date: new Date().getTime(),
          }),
          new ChannelParticipant({
            userId: 456,
            date: new Date().getTime(),
          }),
          new ChannelParticipant({
            userId: 789,
            date: new Date().getTime(),
          }),
        ],
        chats: [channel],
        users: [
          new User({
            id: 123,
          }),
          new User({
            id: 456,
          }),
          new User({
            id: 789,
          }),
        ],
      });

      mockedGetAllChannelParticipants.mockReturnValue(
        new Promise<Api.channels.TypeChannelParticipants>((resolve) => {
          resolve(channelParticipants);
        })
      );

      mockedTgUserDS.findByTgId.mockImplementation(async (tgId) => {
        if (tgId === TgUserTgId.ofString(123)) {
          return tgUser;
        }

        return undefined;
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
          ParseTgSourceParticipantsCmdHandler,
          cmd
        )
      ).toBeUndefined();
      expect(mockedMarkLeftParticipants).toHaveBeenCalledTimes(1);
      expect(mockedCheckIfMeIsChannelAdmin).toHaveBeenCalledTimes(1);
      expect(mockedTgUserExist).toHaveBeenCalledTimes(1);
      expect(mockedTgUserDoesntExist).toHaveBeenCalledTimes(
        channelParticipants.users.length - 1
      );
    });
  });
});
