import { BigInteger } from "big-integer";
import { EventBusService } from "fdd-ts/eda";
import { mock, MockProxy } from "jest-mock-extended";
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
import { TgSourceParticipantStatusDS } from "modules/main/command/projections/tg-participant-status";
import {
  TgSource,
  TgSourceDS,
  TgSourceId,
  TgSourceTgId,
} from "modules/main/command/projections/tg-source";
import { TgSourceParticipantDS } from "modules/main/command/projections/tg-source-participant";
import { TgSourceParticipantWithStatusDS } from "modules/main/command/projections/tg-source-participant-with-status";
import {
  TgUser,
  TgUserDS,
  TgUserId,
  TgUserTgId,
} from "modules/main/command/projections/tg-user";
import { Api, TelegramClient } from "telegram";
import { mocked } from "ts-jest/utils";
import { Logger } from "winston";

import ChannelParticipant = Api.ChannelParticipant;
import ChannelParticipants = Api.channels.ChannelParticipants;
import ChatPhoto = Api.ChatPhoto;
import Channel = Api.Channel;
import User = Api.User;

jest.mock("libs/telegram-js/check-if-me-is-channel-admin");
jest.mock("libs/telegram-js/get-channel-partisipants");
jest.mock(
  "modules/main/command/handlers/parse-tg-source-participants/operations/user-presence"
);
jest.mock(
  "modules/main/command/handlers/parse-tg-source-participants/operations/mark-left-participants"
);

const mockedCheckIfMeIsChannelAdmin = mocked(checkIfMeIsChannelAdmin);
const mockedGetAllChannelParticipants = mocked(getAllChannelParticipants);
const mockedTgUserDoesntExist = mocked(tgUserDoesntExist);
const mockedTgUserExist = mocked(tgUserExist);
const mockedMarkLeftParticipants = mocked(markLeftParticipants);

describe("ParseTgSourceParticipantsCmdHandler", () => {
  let logger: MockProxy<Logger>;
  let client: {
    ref: MockProxy<TelegramClient>;
  };
  let eventBus: MockProxy<EventBusService>;
  let tgUserDS: MockProxy<TgUserDS>;
  let tgSourceParticipantDS: MockProxy<TgSourceParticipantDS>;
  let tgSourceDS: MockProxy<TgSourceDS>;
  let tgSourceParticipantStatusDS: MockProxy<TgSourceParticipantStatusDS>;
  let tgSourceParticipantWithStatusDS: MockProxy<TgSourceParticipantWithStatusDS>;
  let cmd: ParseTgSourceParticipantsCmd;

  beforeEach(() => {
    logger = mock<Logger>();
    client = {
      ref: mock<TelegramClient>(),
    };
    eventBus = mock<EventBusService>();
    tgUserDS = mock<TgUserDS>();
    tgSourceParticipantDS = mock<TgSourceParticipantDS>();
    tgSourceDS = mock<TgSourceDS>();
    tgSourceParticipantStatusDS = mock<TgSourceParticipantStatusDS>();
    tgSourceParticipantWithStatusDS = mock<TgSourceParticipantWithStatusDS>();
    cmd = ParseTgSourceParticipantsCmd.create(
      {
        sourceId: TgSourceId.new(),
      },
      { userId: null }
    );
    mockedCheckIfMeIsChannelAdmin.mockClear();
    mockedGetAllChannelParticipants.mockClear();
    mockedTgUserDoesntExist.mockClear();
    mockedTgUserExist.mockClear();
    mockedMarkLeftParticipants.mockClear();
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

      tgSourceDS.findByIdAndNotDeleted.mockReturnValue(
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

      const handler = ParseTgSourceParticipantsCmdHandler(
        logger,
        client,
        eventBus,
        tgUserDS,
        tgSourceParticipantDS,
        tgSourceDS,
        tgSourceParticipantStatusDS,
        tgSourceParticipantWithStatusDS
      );

      expect(await handler(cmd)).toBeUndefined();
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
        id: TgUserId.new(),
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

      tgSourceDS.findByIdAndNotDeleted.mockReturnValue(
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

      tgUserDS.findByTgId.calledWith(TgUserTgId.ofString(123)).mockReturnValue(
        new Promise<TgUser | undefined>((resolve) => {
          resolve(tgUser);
        })
      );

      const handler = ParseTgSourceParticipantsCmdHandler(
        logger,
        client,
        eventBus,
        tgUserDS,
        tgSourceParticipantDS,
        tgSourceDS,
        tgSourceParticipantStatusDS,
        tgSourceParticipantWithStatusDS
      );

      expect(await handler(cmd)).toBeUndefined();
      expect(mockedMarkLeftParticipants).toHaveBeenCalledTimes(1);
      expect(mockedCheckIfMeIsChannelAdmin).toHaveBeenCalledTimes(1);
      expect(mockedTgUserExist).toHaveBeenCalledTimes(1);
      expect(mockedTgUserDoesntExist).toHaveBeenCalledTimes(
        channelParticipants.users.length - 1
      );
    });
  });
});
