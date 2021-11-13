import { Knex } from "knex";
import {
  User,
  TgApplication,
  TgHomunculus,
  TgSource,
  TgSourceParticipant,
  TgSourceParticipantStatus,
  TgUser,
} from "libs/main-db/schemats-schema";

export type TgSourceTable = TgSource;
export const TgSourceTable = (knex: Knex) => knex<TgSourceTable>("tg_source");

export type TgUserTable = TgUser;
export const TgUserTable = (knex: Knex) => knex<TgUserTable>("tg_user");

export const TgSourceParticipantTableName = "tg_source_participant";
export type TgSourceParticipantTable = TgSourceParticipant;
export const TgSourceParticipantTable = (knex: Knex) =>
  knex<TgSourceParticipantTable>(TgSourceParticipantTableName);

export const TgSourceParticipantStatusTableName =
  "tg_source_participant_status";
export type TgSourceParticipantStatusTable = TgSourceParticipantStatus;
export const TgSourceParticipantStatusTable = (knex: Knex) =>
  knex<TgSourceParticipantStatusTable>(TgSourceParticipantStatusTableName);

export const UserTableName = "user";
export type UserTable = User;
export const UserTable = (knex: Knex) => knex<UserTable>(UserTableName);

export type TgHomunculusTable = TgHomunculus;
export const TgHomunculusTable = (knex: Knex) =>
  knex<TgHomunculusTable>("tg_homunculus");

export type TgApplicationTable = TgApplication;
export const TgApplicationTable = (knex: Knex) =>
  knex<TgApplicationTable>("tg_application");
