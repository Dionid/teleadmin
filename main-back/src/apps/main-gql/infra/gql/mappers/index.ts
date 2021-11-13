import {
  TgSource as GQLTgSource,
  TgUser as GQLTgUser,
} from "apps/main-gql/infra/gql/gqlgen-types";
import { TgSource, TgUser } from "libs/main-db/schemats-schema";

export const mapTgSource = (tableData: TgSource): GQLTgSource => {
  return {
    ...tableData,
    participants: [],
    participantsAggregate: {
      nodes: [],
    },
  };
};

export const mapTgUser = (tableData: TgUser): GQLTgUser => {
  return {
    ...tableData,
    tgPhotoId: tableData.tgPhotoId + "",
  };
};
