import { Entity } from '../../../types';
import * as prop from '../../define/defineProperty';
import { DatabaseConnection, getDatabaseConnection } from '../_test_utils/databaseConnection';
import { generateEntityTables } from './generateEntityTables';

/*
  we test an example of every variation against the database to ensure we are defining valid sql
*/
describe('generateEntityTables', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  const getShowCreateNow = async ({ tableName }: { tableName: string }) => {
    const result = await dbConnection.query({ sql: `SHOW CREATE TABLE ${tableName}` }) as any;
    return result[0][0]['Create Table'];
  };
  it('generates tables for a static entity, w/ same sytax as SHOW CREATE', async () => {
    const address = new Entity({
      name: 'address',
      properties: {
        street: prop.VARCHAR(255),
        city: prop.VARCHAR(255),
        country: prop.ENUM(['US', 'CA', 'MX']),
      },
      unique: ['street', 'city', 'country'],
    });
    const tables = await generateEntityTables({ entity: address });
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name};` });
    await dbConnection.query({ sql: tables.static.sql });
    expect(tables.version).toEqual(undefined);

    // check syntax is the same as that returned by SHOW CREATE TABLE
    const createStaticSql = await getShowCreateNow({ tableName: tables.static.name });
    expect(createStaticSql).toEqual(tables.static.sql); // should be the exact string
  });
  it('generates tables for a versioned entity, w/ same syntax as SHOW CREATE', async () => {
    const user = new Entity({
      name: 'user',
      properties: {
        cognito_uuid: prop.UUID(),
        name: {
          ...prop.VARCHAR(255),
          updatable: true,
        },
        bio: {
          ...prop.TEXT(),
          updatable: true,
          nullable: true,
        },
      },
      unique: ['cognito_uuid'],
    });
    const tables = await generateEntityTables({ entity: user });
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.version!.name};` });
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name};` });
    await dbConnection.query({ sql: tables.static.sql });
    await dbConnection.query({ sql: tables.version!.sql });

    // check syntax is the same as that returned by SHOW CREATE TABLE
    const createStaticSql = await getShowCreateNow({ tableName: tables.static.name });
    expect(createStaticSql).toEqual(tables.static.sql); // should be the exact string
    const createVersionSql = await getShowCreateNow({ tableName: tables.version!.name });
    expect(createVersionSql).toEqual(tables.version!.sql); // should be the exact string
  });
});
