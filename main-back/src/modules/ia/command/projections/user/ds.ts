import { Context } from "libs/fdd-ts/context";
import { UserTable } from "libs/main-db/models";
import { GlobalContext } from "libs/teleadmin/contexts/global";
import {
  User,
  UserEmail,
  UserHashedPassword,
  UserId,
} from "modules/ia/command/projections/user";

export const UserDM = {
  fromTableData: (tableData: UserTable): User => {
    return {
      ...tableData,
      id: tableData.id as UserId,
      email: tableData.email as UserEmail,
      password: tableData.password as UserHashedPassword,
    };
  },
};

export const findByEmail = async (
  email: UserEmail
): Promise<User | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await UserTable(knex).where({ email }).first();

  return res && UserDM.fromTableData(res);
};

export const findById = async (id: UserId): Promise<User | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await UserTable(knex).where({ id }).first();

  return res && UserDM.fromTableData(res);
};

export const findAny = async (): Promise<User | undefined> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  const res = await UserTable(knex).first();

  return res && UserDM.fromTableData(res);
};

export const create = async (projection: User): Promise<User> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  await UserTable(knex).insert(projection);

  return projection;
};

export const update = async (projection: User): Promise<User> => {
  const { knex } = Context.getStoreOrThrowError(GlobalContext);

  await UserTable(knex).where({ id: projection.id }).update(projection);

  return projection;
};

export const UserDS = {
  findByEmail,
  findById,
  findAny,
  create,
  update,
};
