import uuid from 'uuid/v4';
import { mysql as prepare } from 'yesql';

import { Entity } from '../../../types';
import * as prop from '../../define/defineProperty';
import { DatabaseConnection, getDatabaseConnection } from '../_test_utils/databaseConnection';
import { generateEntityUpsert } from '../entityFunctions/generateEntityUpsert';
import { generateEntityTables } from '../entityTables/generateEntityTables';
import { generateEntityCurrentView } from './generateEntityCurrentView';

describe('generateEntityViewCurrent', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  describe('static entity', () => {
    const address = new Entity({
      name: 'alternative_address',
      properties: {
        street: prop.VARCHAR(255),
        suite: {
          ...prop.VARCHAR(255),
          nullable: true,
        },
        city: prop.VARCHAR(255),
        country: prop.ENUM(['US', 'CA', 'MX']),
        weekday_found: {
          // non-unique but static property -> only track the first value
          ...prop.VARCHAR(15),
          nullable: true,
        },
      },
      unique: ['street', 'suite', 'city', 'country'],
    });
    it('should not create a _current view for static entities', async () => {
      const view = generateEntityCurrentView({ entity: address });
      expect(view).toEqual(null);
    });
  });
  describe('versioned entity', () => {
    const user = new Entity({
      name: 'alternative_user',
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
    beforeAll(async () => {
      // provision the table
      const tables = await generateEntityTables({ entity: user });
      await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.currentVersionPointer!.name};` });
      await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.version!.name};` });
      await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name};` });
      await dbConnection.query({ sql: tables.static.sql });
      await dbConnection.query({ sql: tables.version!.sql });
      await dbConnection.query({ sql: tables.currentVersionPointer!.sql });

      // provision the upsert method
      const { name, sql: upsertSql } = generateEntityUpsert({ entity: user });
      await dbConnection.query({ sql: `DROP FUNCTION IF EXISTS ${name}` });
      await dbConnection.query({ sql: upsertSql });
    });
    const recreateTheView = async () => {
      const { name, sql: upsertSql } = generateEntityCurrentView({ entity: user })!;
      await dbConnection.query({ sql: `DROP VIEW IF EXISTS ${name}` });
      await dbConnection.query({ sql: upsertSql });
      return { name, sql: upsertSql };
    };
    const getEntityFromView = async ({ name, id }: { name: string; id: number }) => {
      const results = (await dbConnection.execute({ sql: `select * from ${name} where id = ${id}` })) as any;
      expect(results[0].length).toEqual(1);
      const entity = results[0][0];
      return entity;
    };
    const upsertUser = async ({ cognito_uuid, name, bio }: { cognito_uuid: string; name: string; bio?: string }) => {
      const result = (await dbConnection.query(
        prepare(`
        SELECT upsert_${user.name}(
          :cognito_uuid,
          :name,
          :bio
        ) as id;
      `)({
          cognito_uuid,
          name,
          bio,
        }),
      )) as any;
      return result[0][0].id;
    };
    it('should show the entity accurately', async () => {
      const { sql, name } = await recreateTheView();
      const props = {
        cognito_uuid: uuid(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const id = await upsertUser(props);

      // check that the static part was accurate
      const entity = await getEntityFromView({ id, name });
      expect(entity).toMatchObject(props);
      expect(entity.uuid.length).toEqual(36); // sanity check that its a uuid
      expect(entity.id).toEqual(id);

      // snapshot the resultant sql to log an example
      expect(sql).toMatchSnapshot();
    });
    it('should always show the current version', async () => {
      const { name } = await recreateTheView();
      const props = {
        cognito_uuid: uuid(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const id = await upsertUser(props);
      const idAgain = await upsertUser({ ...props, name: 'Hank Hillerson' });
      await upsertUser({ ...props, name: 'Hank Hillbody', bio: undefined });
      expect(idAgain).toEqual(id);

      // check that the static part was accurate
      const entity = await getEntityFromView({ id, name });
      expect(entity).toMatchObject({ ...props, name: 'Hank Hillbody', bio: null });
    });
  });
});
