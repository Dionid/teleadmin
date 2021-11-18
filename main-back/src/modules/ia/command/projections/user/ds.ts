import { UserTable } from "libs/main-db/models";
import { BaseDS } from "libs/teleadmin/projections/ds";
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

export type UserDS = BaseDS;

export const findByEmail = async (
  ds: UserDS,
  email: UserEmail
): Promise<User | undefined> => {
  const res = await UserTable(ds.knex).where({ email }).first();

  return res && UserDM.fromTableData(res);
};

export const findById = async (
  ds: UserDS,
  id: UserId
): Promise<User | undefined> => {
  const res = await UserTable(ds.knex).where({ id }).first();

  return res && UserDM.fromTableData(res);
};

export const findAny = async (ds: UserDS): Promise<User | undefined> => {
  const res = await UserTable(ds.knex).first();

  return res && UserDM.fromTableData(res);
};

export const create = async (ds: UserDS, projection: User): Promise<User> => {
  await UserTable(ds.knex).insert(projection);

  return projection;
};

export const update = async (ds: UserDS, projection: User): Promise<User> => {
  await UserTable(ds.knex).where({ id: projection.id }).update(projection);

  return projection;
};

export const UserDS = {
  findByEmail,
  findById,
  findAny,
  create,
  update,
};
