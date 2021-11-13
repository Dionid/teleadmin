import { gql } from "apollo-server";

export const typeDefs = gql`
  scalar Date
  scalar UUID

  # Common

  enum OrderBy {
    """
    in ascending order, nulls last
    """
    asc

    """
    in descending order, nulls first
    """
    desc
  }

  input CreatedAtOrderBy {
    createdAt: OrderBy
  }

  enum IdSelectColumn {
    id
  }

  # TgParticipantsAnalytics

  type TgParticipantsAnalytics {
    leftUserIds: [UUID!]!
    joinedUserIds: [UUID]!
    rejoinedUserIds: [UUID]!
  }

  # TgUser

  type TgUser {
    id: UUID!
    createdAt: Date
    updatedAt: Date
    tgId: Int
    tgUsername: String
    tgBot: Boolean
    tgDeleted: Boolean
    tgVerified: Boolean
    tgFake: Boolean
    tgFirstName: String
    tgLastName: String
    tgPhone: String
    tgPhotoId: String
    tgLangCode: String
  }

  type TgUserAggregateFields {
    count(columns: [IdSelectColumn!], distinct: Boolean): Int!
  }

  type TgUserAggregate {
    aggregate: TgUserAggregateFields
    nodes: [TgUser!]!
  }

  # TgSourceParticipant

  type TgSourceParticipant {
    id: UUID!
    lastStatus: String
    tgUserId: String!
    tgUser: TgUser
  }

  type TgSourceParticipantAggregateFields {
    count(columns: [IdSelectColumn!], distinct: Boolean): Int!
  }

  type TgSourceParticipantAggregate {
    aggregate: TgSourceParticipantAggregateFields
    nodes: [TgSourceParticipant!]!
  }

  # TgSource

  enum TgSourceSelectColumn {
    id
  }

  type TgSourceAggregateFields {
    count(columns: [TgSourceSelectColumn!], distinct: Boolean): Int!
  }

  type TgSourceAggregate {
    aggregate: TgSourceAggregateFields
    nodes: [TgSource!]!
  }

  type TgSource {
    id: UUID!
    tgName: String
    tgId: Int
    tgTitle: String
    type: String
    updatedAt: Date
    createdAt: Date
    participants: [TgSourceParticipant!]!
    participantsAggregate: TgSourceParticipantAggregate!
  }

  type Query {
    tgSource(
      """
      limit the number of rows returned
      """
      limit: Int

      """
      skip the first n rows. Use only with orderBy
      """
      offset: Int

      """
      sort the rows by one or more columns
      """
      orderBy: CreatedAtOrderBy
    ): [TgSource!]!
    tgSourceAggregate(
      """
      limit the number of rows returned
      """
      limit: Int

      """
      skip the first n rows. Use only with orderBy
      """
      offset: Int

      """
      sort the rows by one or more columns
      """
      orderBy: CreatedAtOrderBy
    ): TgSourceAggregate!
    tgSourceByPK(id: UUID!): TgSource
    tgUser(
      """
      limit the number of rows returned
      """
      limit: Int

      """
      skip the first n rows. Use only with orderBy
      """
      offset: Int

      """
      sort the rows by one or more columns
      """
      orderBy: CreatedAtOrderBy
    ): [TgUser!]!
    tgUserAggregate(
      """
      limit the number of rows returned
      """
      limit: Int

      """
      skip the first n rows. Use only with orderBy
      """
      offset: Int

      """
      sort the rows by one or more columns
      """
      orderBy: CreatedAtOrderBy
    ): TgUserAggregate!
    tgUserByPk(id: UUID!): TgUser
    tgParticipantsAnalytics(
      sourceId: UUID!
      from: Date!
      to: Date!
    ): TgParticipantsAnalytics!
  }

  type MutationResponse {
    success: Boolean!
    message: String
  }

  input CreateAndSetMainApplication {
    name: String!
    appId: String!
    appHash: String!
  }

  input CreateAndSetMasterHomunculus {
    phone: String!
  }

  input SendCode {
    phone: String!
    code: String!
  }

  input AddPublicSource {
    name: String!
    type: String!
  }

  input AddPrivateSource {
    inviteLink: String!
    type: String!
  }

  input ParseTgSourceParticipants {
    sourceId: String!
  }

  input CreateFirstAdmin {
    email: String!
    password: String!
  }

  input CreateUser {
    email: String!
    password: String!
  }

  input Authenticate {
    email: String!
    password: String!
  }

  type JWTToken {
    jwtToken: String!
  }

  input LeaveAndDeleteSource {
    sourceId: String!
  }

  type Mutation {
    # AuthN
    createFirstAdmin(req: CreateFirstAdmin!): MutationResponse
    createUser(req: CreateUser!): MutationResponse
    authenticate(req: Authenticate!): JWTToken

    # Main
    createAndSetMainApplication(
      req: CreateAndSetMainApplication!
    ): MutationResponse
    createAndSetMasterHomunculus(
      req: CreateAndSetMasterHomunculus!
    ): MutationResponse
    sendCode(req: SendCode!): MutationResponse
    addPublicSource(req: AddPublicSource!): MutationResponse
    addPrivateSource(req: AddPrivateSource!): MutationResponse
    parseTgSourceParticipants(req: ParseTgSourceParticipants!): MutationResponse
    leaveAndDeleteSource(req: LeaveAndDeleteSource!): MutationResponse
  }
`;
